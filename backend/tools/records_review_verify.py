"""Exercise fresh migration and canonical DDL adoption on TWO new PostgreSQL DBs.

Never imports into, migrates, changes passwords in, or drops the configured DB.
Temporary verification databases remain available for inspection in pgAdmin.
"""
from __future__ import annotations
import argparse
import importlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import uuid


def worker(repo, mode):
    sys.path.insert(0, str(repo / 'backend'))
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.records_release'
    import django
    django.setup()
    from django.db import connection
    from django.core.management import call_command
    from django.db.migrations.executor import MigrationExecutor
    from django.test.utils import CaptureQueriesContext
    from tools import records_release_bootstrap as verifier
    if mode == 'fresh':
        call_command('migrate', interactive=False, verbosity=1)
        verifier.canonical_records_indexes_preflight(connection)
        call_command('makemigrations', 'records', check=True, dry_run=True, verbosity=1)
        print('POSTGRESQL_FRESH_INDEX_CATALOG = PASS', flush=True)
        return
    verifier.TARGET = os.environ['DB_NAME']
    config = {key: os.environ['DB_' + source] for key, source in (
        ('host','HOST'), ('port','PORT'), ('user','USER'), ('password','PASSWORD'))}
    manifest = verifier.release_manifest(repo / 'docs/common/database/release_DDL.sql')
    verifier.validate_graph(connection)
    verifier.model_preflight(connection)
    verifier.record_guards_preflight(connection)
    verifier.canonical_records_indexes_preflight(connection)
    verifier.bootstrap(connection, manifest, verifier)
    verifier.require_ready(connection, manifest, config, verifier)
    verifier.smoke_api(connection, manifest)
    verifier.smoke_retired_document_endpoint()
    migration = importlib.import_module('records.migrations.0005_canonical_fk_indexes')
    apps = MigrationExecutor(connection).loader.project_state().apps
    with connection.schema_editor() as editor, CaptureQueriesContext(connection) as captured:
        migration.canonicalize_fk_indexes(apps, editor)
    if any(query['sql'].lstrip().upper().startswith(('CREATE INDEX', 'DROP INDEX', 'ALTER INDEX', 'ALTER TABLE')) for query in captured.captured_queries):
        raise ValueError('Already canonical adopted indexes unexpectedly issued schema DDL')
    print('POSTGRESQL_ADOPTED_INDEX_NO_DDL = PASS', flush=True)
    print('POSTGRESQL_DDL_ADOPTION_INDEX_CATALOG = PASS', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--worker', choices=('fresh', 'adopt'), help=argparse.SUPPRESS)
    args = parser.parse_args()
    repo = args.repo.resolve()
    sys.path.insert(0, str(repo / 'backend'))
    os.environ['PSYCOPG_IMPL'] = 'binary'
    if args.worker:
        worker(repo, args.worker)
        return
    from dotenv import dotenv_values
    import psycopg
    from psycopg import sql
    from tools import records_release_bootstrap as verifier
    verifier.release_manifest(repo / 'docs/common/database/release_DDL.sql')
    config = dotenv_values(repo / 'backend/.env')
    project_name = config.get('DB_NAME')
    if not project_name or not config.get('DB_USER'):
        raise ValueError('The worktree backend/.env must identify its database and user')
    bindir = config.get('POSTGRES_BIN') or os.getenv('POSTGRES_BIN')
    candidate = (Path(bindir) / ('psql.exe' if os.name == 'nt' else 'psql')) if bindir else None
    if not candidate or not candidate.is_file():
        found = shutil.which('psql')
        candidate = Path(found) if found else None
    if not candidate and os.name == 'nt':
        defaults = [Path('D:/PostgreSQL/bin/psql.exe'), Path('C:/Program Files/PostgreSQL/18/bin/psql.exe')]
        candidate = next((path for path in defaults if path.is_file()), None)
    if not candidate:
        raise ValueError('Set POSTGRES_BIN in backend/.env or add psql to PATH; no DB created')
    cfg = dict(user=config['DB_USER'], password=config.get('DB_PASSWORD') or '',
               host=config.get('DB_HOST') or '127.0.0.1', port=config.get('DB_PORT') or '5432', connect_timeout=5)
    names = {mode: 'g3_idx_' + mode + '_' + uuid.uuid4().hex[:12] for mode in ('fresh', 'adopt')}
    if project_name in names.values():
        raise ValueError('Verification database must differ from configured database')
    # Drop no database: keep verification evidence, including partial runs.
    env = dict(os.environ, PSYCOPG_IMPL='binary', DJANGO_SETTINGS_MODULE='config.records_release')
    env.update({ 'DB_' + key.upper(): str(cfg[key]) for key in ('host', 'port', 'user', 'password') })
    for key in list(env):
        if key.upper().startswith('PG'):
            env.pop(key)
    env.update(PGHOST=cfg['host'], PGPORT=str(cfg['port']), PGUSER=cfg['user'],
               PGPASSWORD=cfg['password'], PGCLIENTENCODING='UTF8', PGCONNECT_TIMEOUT='5')
    logs = repo.parent / ('g3_index_verification_' + uuid.uuid4().hex[:12])
    logs.mkdir()
    try:
        with psycopg.connect(**cfg, dbname='postgres', autocommit=True) as admin:
            version = admin.execute('SELECT version()').fetchone()[0]
            print('POSTGRESQL =', version, flush=True)
            for mode, name in names.items():
                if admin.execute('SELECT 1 FROM pg_database WHERE datname=%s', [name]).fetchone():
                    raise ValueError('Unexpected database already exists: ' + name)
                admin.execute(sql.SQL("CREATE DATABASE {} TEMPLATE template0 ENCODING 'UTF8'").format(sql.Identifier(name)))
        for mode, name in names.items():
            env.update(DB_NAME=name, PGDATABASE=name)
            if mode == 'adopt':
                with (logs / 'ddl_import.log').open('wb') as out:
                    result = subprocess.run([str(candidate), '-X', '-w', '-v', 'ON_ERROR_STOP=1', '-f', str(repo / 'docs/common/database/release_DDL.sql')], env=env, stdout=out, stderr=subprocess.STDOUT, timeout=180)
                if result.returncode:
                    raise ValueError('Canonical DDL import failed; inspect ddl_import.log')
            with (logs / (mode + '.log')).open('wb') as out:
                result = subprocess.run([sys.executable, str(Path(__file__).resolve()), '--repo', str(repo), '--worker', mode], env=env, stdout=out, stderr=subprocess.STDOUT, timeout=240)
            if result.returncode:
                raise ValueError(mode + ' path failed; inspect its log before migration on project DB')
            print('POSTGRESQL_' + mode.upper() + '_PATH = PASS', flush=True)
        print('POSTGRESQL_BOTH_INDEX_PATHS = PASS', flush=True)
    finally:
        (logs / 'databases.json').write_text(json.dumps({'project_database_unchanged':project_name, 'verification_databases':names}, indent=2), encoding='utf-8')
        print('PROJECT_DATABASE = UNCHANGED', flush=True)
        print('VERIFICATION_LOG_DIRECTORY =', logs, flush=True)
        for mode, name in names.items():
            print('VERIFICATION_DATABASE_' + mode.upper(), '=', name, flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('POSTGRESQL_INDEX_VERIFICATION = FAILED', flush=True)
        # No DSN/passwords are printed.
        print('ERROR_TYPE =', type(error).__name__, flush=True)
        if isinstance(error, (ValueError, FileNotFoundError)):
            print('ERROR =', str(error), flush=True)
        sys.exit(1)
