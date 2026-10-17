"""Dựng DB PostgreSQL từ docs/common/database/release_DDL.sql rồi đồng bộ trạng thái migration Django.

Một quy trình dùng chung cho local, CI, DB template của test và staging:
1. Tạo DB rỗng (hoặc dựng lại khi có --force).
2. Nạp release_DDL.sql trong một transaction (lỗi là dừng, không để lại DB nạp dở).
3. Duyệt các migration theo thứ tự phụ thuộc. App có đủ bảng model trong DB thì ghi nhận migration
   là đã áp dụng (fake); app không có bảng nào thì áp dụng thật. App có một phần bảng thì báo lỗi.
4. Xác nhận không còn migration chưa áp dụng.
5. Tùy chọn chạy seed_db.

Kết nối lấy từ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (tham số dòng lệnh ghi đè, riêng mật khẩu
chỉ đọc từ DB_PASSWORD). User kết nối cần quyền CREATEDB. Cần DJANGO_SECRET_KEY như khi chạy backend.

Dùng: python scripts/build_db.py [--dbname TÊN] [--force | --if-empty] [--seed]
"""
import argparse
import os
import sys
from pathlib import Path

import psycopg
from psycopg import sql

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
DEFAULT_DDL = ROOT / "docs" / "common" / "database" / "release_DDL.sql"
MAINTENANCE_DB = "postgres"


def parse_args():
    env = os.environ
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--host", default=env.get("DB_HOST", "localhost"))
    parser.add_argument("--port", default=env.get("DB_PORT", "5432"))
    parser.add_argument("--user", default=env.get("DB_USER", "postgres"))
    parser.add_argument("--dbname", default=env.get("DB_NAME"), required="DB_NAME" not in env)
    parser.add_argument("--ddl", type=Path, default=DEFAULT_DDL)
    parser.add_argument("--seed", action="store_true", help="chạy seed_db sau khi dựng")
    existing = parser.add_mutually_exclusive_group()
    existing.add_argument("--force", action="store_true", help="xóa và dựng lại DB đã tồn tại")
    existing.add_argument("--if-empty", action="store_true", help="bỏ qua (exit 0) nếu DB đã có bảng")
    return parser.parse_args()


def connect(args, dbname, **kwargs):
    return psycopg.connect(
        dbname=dbname, host=args.host, port=args.port, user=args.user,
        password=os.environ.get("DB_PASSWORD", ""), **kwargs,
    )


def table_count(args):
    with connect(args, args.dbname) as conn:
        return conn.execute(
            "SELECT count(*) FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
        ).fetchone()[0]


def create_database(args):
    """Trả về False khi bỏ qua vì DB đã khởi tạo (--if-empty)."""
    name = sql.Identifier(args.dbname)
    with connect(args, MAINTENANCE_DB, autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", [args.dbname]
        ).fetchone()
        if exists:
            if args.force:
                conn.execute(sql.SQL("DROP DATABASE {} WITH (FORCE)").format(name))
            elif table_count(args) == 0:
                return True
            elif args.if_empty:
                print(f"DB {args.dbname} đã có bảng; bỏ qua. Dùng --force để dựng lại.")
                return False
            else:
                raise SystemExit(
                    f"DB {args.dbname} đã có bảng. Dùng --force để xóa và dựng lại, "
                    "hoặc --if-empty để bỏ qua."
                )
        conn.execute(sql.SQL("CREATE DATABASE {}").format(name))
    return True


def load_ddl(args):
    # Không có placeholder tham số nên psycopg gửi nguyên văn nhiều câu lệnh; lỗi ở đâu thì rollback toàn bộ.
    with connect(args, args.dbname) as conn:
        conn.execute(args.ddl.read_text(encoding="utf-8"))
    print(f"Đã nạp {args.ddl.name}.")


def setup_django(args):
    os.environ.update({
        "DB_ENGINE": "postgresql", "DB_HOST": args.host, "DB_PORT": str(args.port),
        "DB_USER": args.user, "DB_NAME": args.dbname,
    })
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    sys.path.insert(0, str(BACKEND))
    os.chdir(BACKEND)
    import django

    django.setup()


def app_tables(state):
    """Bảng vật lý của từng app theo trạng thái migration cuối cùng."""
    tables = {}
    for model in state.apps.get_models(include_auto_created=True):
        meta = model._meta
        if meta.managed and not meta.proxy and not meta.swapped:
            tables.setdefault(meta.app_label, set()).add(meta.db_table)
    return tables


def decide_fake(app_labels, tables_by_app, existing):
    fake = {}
    for app in sorted(app_labels):
        tables = tables_by_app.get(app, set())
        present = tables & existing
        if tables and present == tables:
            fake[app] = True
        elif not present:
            fake[app] = False
        else:
            raise SystemExit(
                f"App '{app}' có một phần bảng trong DDL: có {sorted(present)}, "
                f"thiếu {sorted(tables - present)}. Không thể fake một phần; cần chuẩn hóa DDL hoặc migration."
            )
    return fake


def adopt_migrations():
    from django.core.management import call_command
    from django.db import connection
    from django.db.migrations.executor import MigrationExecutor

    executor = MigrationExecutor(connection)
    loader = executor.loader
    leaves = sorted(loader.graph.leaf_nodes())
    order = []
    for leaf in leaves:
        order.extend(n for n in loader.graph.forwards_plan(leaf) if n not in order)

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
        )
        existing = {row[0] for row in cursor.fetchall()}
    fake = decide_fake({app for app, _ in order}, app_tables(loader.project_state(leaves)), existing)
    for app, is_fake in fake.items():
        print(f"  {app}: {'fake (bảng đã có trong DDL)' if is_fake else 'migrate thật'}")

    for app, name in order:
        executor.loader.build_graph()
        executor.migrate([(app, name)], fake=fake[app])

    # Chạy migrate rỗng để phát tín hiệu post_migrate một lần (contenttypes, v.v.) và xác nhận kết quả.
    call_command("migrate", interactive=False, verbosity=0)
    pending = MigrationExecutor(connection).migration_plan(
        MigrationExecutor(connection).loader.graph.leaf_nodes()
    )
    if pending:
        raise SystemExit(f"Còn migration chưa áp dụng: {[f'{m.app_label}.{m.name}' for m, _ in pending]}")
    print("Không còn migration chưa áp dụng.")


def main():
    args = parse_args()
    if not args.ddl.is_file():
        raise SystemExit(f"Không thấy file DDL: {args.ddl}")
    if not create_database(args):
        return
    load_ddl(args)
    setup_django(args)
    adopt_migrations()
    if args.seed:
        from django.core.management import call_command

        call_command("seed_db")
    print(f"Đã dựng DB {args.dbname}.")


if __name__ == "__main__":
    main()
