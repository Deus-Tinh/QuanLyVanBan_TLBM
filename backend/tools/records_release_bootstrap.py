"""Verified DDL adoption for a new Group 3 PostgreSQL runtime database."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
import re
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import uuid
from types import SimpleNamespace
TARGET = "quanlyvanban_release_20261008_g3"
DDL_HASH = "0308b8dcd23e20b57994894653df1f49cf7fe212ef94c2f4a3de33ec74ed0b5f"
SYSTEM_TABLES = {"django_migrations", "django_content_type", "django_session", "token_blacklist_outstandingtoken", "token_blacklist_blacklistedtoken"}
CORE_APPS = {"auth", "organizations", "accounts", "authorization", "records"}
CORE_TARGETS = [("auth", "0012_alter_user_first_name_max_length"), ("organizations", "0003_remove_donvi_created_at_remove_donvi_updated_at_and_more"), ("accounts", "0002_position_import_permission"), ("authorization", "0002_rbac_standard_data"), ("records", "0003_hoso_ten_ho_so_not_blank")]
SYSTEM_TARGETS = [("contenttypes", "0002_remove_content_type_name"), ("sessions", "0001_initial"), ("token_blacklist", "0013_alter_blacklistedtoken_options_and_more")]
POST_ADOPTION_TARGETS = [("records", "0005_canonical_fk_indexes")]
def require_equal(label, actual, expected):
    if actual != expected:
        if isinstance(actual, set) and isinstance(expected, set):
            print(label + "_MISSING =", sorted(expected - actual), flush=True)
            print(label + "_UNEXPECTED =", sorted(actual - expected), flush=True)
        raise ValueError(f"Release audit failed: {label}.")
    print(label, "= PASS", flush=True)

def audit_function_rows(rows, expected):
    """Exclude only functions with verified extension membership, never prefixes."""
    application = {name for name, extension in rows if extension is None}
    extension_count = sum(1 for name, extension in rows if extension is not None)
    print("PUBLIC_EXTENSION_FUNCTION_COUNT =", extension_count, flush=True)
    print("PUBLIC_APPLICATION_FUNCTION_COUNT =", len(application), flush=True)
    require_equal("RELEASE_FUNCTION_NAMES", application, expected)

def audit_database(psycopg, config, manifest):
    with psycopg.connect(**config, dbname=TARGET, options="-c default_transaction_read_only=on") as conn:
        with conn.cursor() as cur:
            cur.execute("SET TRANSACTION READ ONLY")
            cur.execute("SHOW transaction_read_only")
            require_equal("AUDIT_READ_ONLY", cur.fetchone()[0], "on")
            cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            tables = {row[0] for row in cur.fetchall()}
            require_equal("RELEASE_TABLE_SET", tables, manifest["tables"])
            print("PUBLIC_TABLE_COUNT =", len(tables), flush=True)
            cur.execute("""SELECT t.typname, e.enumlabel FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE n.nspname = 'public' ORDER BY t.typname, e.enumsortorder""")
            enums = {}
            for name, value in cur.fetchall():
                enums.setdefault(name, []).append(value)
            require_equal("RELEASE_ENUM_LABELS", enums, manifest["enums"])
            print("PUBLIC_ENUM_COUNT =", len(enums), flush=True)
            cur.execute("""SELECT t.tgname, c.relname FROM pg_trigger t
                JOIN pg_class c ON c.oid = t.tgrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND NOT t.tgisinternal""")
            triggers = set(cur.fetchall())
            print("EXPECTED_CUSTOM_TRIGGER_COUNT =", len(manifest["triggers"]), flush=True)
            print("ACTUAL_CUSTOM_TRIGGER_COUNT =", len(triggers), flush=True)
            require_equal("RELEASE_TRIGGER_NAMES", triggers, manifest["triggers"])
            print("PUBLIC_CUSTOM_TRIGGER_COUNT =", len(triggers), flush=True)
            cur.execute("SELECT viewname FROM pg_views WHERE schemaname = 'public'")
            require_equal("RELEASE_VIEW_NAMES", {r[0] for r in cur.fetchall()}, manifest["views"])
            cur.execute("SELECT extname FROM pg_catalog.pg_extension")
            extensions = {row[0] for row in cur.fetchall()}
            print("INSTALLED_EXTENSIONS =", sorted(extensions), flush=True)
            require_equal("RELEASE_REQUIRED_EXTENSIONS", extensions & manifest["extensions"], manifest["extensions"])
            cur.execute("""SELECT p.proname, e.extname
                FROM pg_catalog.pg_proc p
                JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
                LEFT JOIN pg_catalog.pg_depend d ON d.classid = 'pg_catalog.pg_proc'::regclass
                    AND d.objid = p.oid AND d.objsubid = 0
                    AND d.refclassid = 'pg_catalog.pg_extension'::regclass AND d.deptype = 'e'
                LEFT JOIN pg_catalog.pg_extension e ON e.oid = d.refobjid
                WHERE n.nspname = 'public'""")
            audit_function_rows(cur.fetchall(), manifest["functions"])
            cur.execute("SELECT codename FROM auth_permission")
            permissions = {r[0] for r in cur.fetchall()}
            require_equal("RELEASE_PERMISSION_SET", permissions, manifest["permissions"])
            print("AUTH_PERMISSION_COUNT =", len(permissions), flush=True)
            cur.execute("SELECT ma_nhom_quyen FROM auth_group")
            require_equal("RELEASE_GROUP_CODES", {r[0] for r in cur.fetchall()}, {"VT", "CV", "TP", "BGD", "ADMIN"})
            cur.execute("SELECT count(*) FROM auth_group_permissions")
            # Report actual mappings, not the contradictory historical comments.
            require_equal("AUTH_GROUP_PERMISSION_COUNT", cur.fetchone()[0], 197)
            cur.execute("""SELECT count(*) FROM auth_group_permissions gp
                LEFT JOIN auth_group g ON g.id = gp.group_id
                LEFT JOIN auth_permission p ON p.id = gp.permission_id
                WHERE g.id IS NULL OR p.id IS NULL""")
            require_equal("RBAC_MAPPING_REFERENCES", cur.fetchone()[0], 0)
            cur.execute("""SELECT table_name, column_name, is_nullable, data_type
                FROM information_schema.columns WHERE table_schema = 'public'
                AND table_name IN ('documents_vanbanden','documents_vanbandi')
                AND column_name IN ('pham_vi','do_khan')""")
            columns = {(table, column, nullable, kind) for table, column, nullable, kind in cur.fetchall()}
            expected_columns = {(table, column, "NO", "character varying")
                for table in ("documents_vanbanden", "documents_vanbandi")
                for column in ("pham_vi",)}
            require_equal("RELEASE_COLUMNS", columns, expected_columns)
            cur.execute("SELECT count(*) FROM accounts_employee WHERE username = 'admin'")
            require_equal("SEEDED_ADMIN_PRESENT", cur.fetchone()[0], 1)
            cur.execute("SELECT count(*) FROM records_hoso WHERE is_he_thong AND so_ky_hieu = 'HSC'")
            require_equal("COMMON_DOSSIER_PRESENT", cur.fetchone()[0], 1)
            cur.execute("""SELECT c.conname FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE n.nspname = 'public' AND c.contype IN ('c','f') AND NOT c.convalidated""")
            require_equal("NO_UNVALIDATED_CHECK_OR_FK", cur.fetchall(), [])
            cur.execute("SELECT tgname FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace) AND NOT tgisinternal AND tgenabled NOT IN ('O', 'A')")
            require_equal("NO_DISABLED_CUSTOM_TRIGGER", cur.fetchall(), [])
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents_access_log'")
            require_equal("ACCESS_LOG_COLUMNS", {r[0] for r in cur.fetchall()}, {
                "id", "document_type", "document_id", "user_id", "hanh_dong",
                "doi_tuong_user_id", "tep_id", "dia_chi_ip", "created_at"})
            print("RELEASE_IMPORT_CATALOG_AUDIT = PASS", flush=True)

def validate_graph(connection):
    from django.db.migrations.loader import MigrationLoader
    loader = MigrationLoader(connection)
    loader.check_consistent_history(connection)
    if loader.detect_conflicts():
        raise ValueError("Migration conflicts exist.")
    for node in CORE_TARGETS + SYSTEM_TARGETS:
        if node not in loader.graph.nodes:
            raise ValueError("Required migration is unavailable: " + ".".join(node))
    leaves = set(loader.graph.leaf_nodes())
    expected_leaves = dict(CORE_TARGETS + SYSTEM_TARGETS + POST_ADOPTION_TARGETS)
    if leaves != set(expected_leaves.items()):
        raise ValueError("Migration leaves differ from the pinned trial plan.")
    print("MIGRATION_GRAPH = PASS", flush=True)
    return loader

def model_preflight(connection):
    from django.apps import apps
    from django.contrib.auth import get_user_model
    from django.contrib.auth.models import Group, Permission
    from organizations.models import DonVi, KhoiKhuVuc
    from records.models import HoSo, LoaiVanBan
    user = get_user_model()
    models = [Group, Permission, Group.permissions.through, user,
              apps.get_model("accounts", "Position"), user.groups.through,
              user.user_permissions.through, DonVi, KhoiKhuVuc, HoSo, LoaiVanBan]
    with connection.cursor() as cur:
        for model in models:
            table = model._meta.db_table
            columns = {c.name for c in connection.introspection.get_table_description(cur, table)}
            required = {f.column for f in model._meta.concrete_fields}
            if not required.issubset(columns):
                raise ValueError(f"Missing ORM columns on {table}: {sorted(required - columns)}")
            constraints = connection.introspection.get_constraints(cur, table)
            for field in model._meta.concrete_fields:
                if not field.is_relation or not field.many_to_one:
                    continue
                if table == "auth_permission" and field.column == "content_type_id":
                    # Release deliberately allows NULL and omits a content-type FK.
                    continue
                destination = (field.remote_field.model._meta.db_table, field.target_field.column)
                if not any(c.get("foreign_key") == destination and c.get("columns") == [field.column]
                           for c in constraints.values()):
                    raise ValueError(f"Missing/wrong ORM FK: {table}.{field.column}")
    print("CORE_MODEL_COLUMN_AND_FK_PREFLIGHT = PASS", flush=True)
    print("DDL_MODEL_DIFFERENCES = accepted release: nullable content_type, wider password, nullable text, DDL guards", flush=True)

def orm_read_probe(connection):
    from django.contrib.auth import get_user_model
    from records.models import HoSo, LoaiVanBan
    with connection.cursor() as cur:
        cur.execute("SHOW transaction_read_only")
        require_equal("ORM_TRANSACTION_READ_ONLY", cur.fetchone()[0], "on")
    user = get_user_model().objects.get(username="admin")
    if not user.is_active:
        raise ValueError("The seeded admin is inactive.")
    print("EMPLOYEE_ORM = PASS", flush=True)
    dossier = HoSo.objects.select_related("nguoi_lap").filter(is_he_thong=True, so_ky_hieu="HSC").first()
    if dossier is None or dossier.nguoi_lap is None:
        raise ValueError("Common dossier or its Employee relation is unavailable.")
    print("HOSO_EMPLOYEE_JOIN = PASS", flush=True)
    print("LOAIVANBAN_COUNT =", LoaiVanBan.objects.count(), flush=True)
    permissions = user.get_all_permissions()
    if "view_hoso" not in permissions or not user.has_perm("view_hoso"):
        raise ValueError("Employee RBAC cannot resolve view_hoso.")
    print("EMPLOYEE_RBAC_READ = PASS", flush=True)
    print("SAMPLE_USER_PERMISSION_COUNT =", len(permissions), flush=True)
    with connection.cursor() as cur:
        cur.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'records_hoso'::regclass AND contype = 'c'")
        definitions = [row[0] for row in cur.fetchall()]
        # Report actual definitions; adoption decisions require semantic review, not names alone.
        print("HOSO_EXISTING_CHECK_DEFINITIONS =", definitions, flush=True)
        cur.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'records_loaivanban'::regclass AND contype = 'c'")
        print("LOAIVANBAN_EXISTING_CHECK_DEFINITIONS =", [row[0] for row in cur.fetchall()], flush=True)
    print("CORE_ADOPTION_EXECUTED = NO", flush=True)

def check_core_plan(plan):
    if any(backwards for migration, backwards in plan):
        raise ValueError("Backward migrations are forbidden.")
    if {m.app_label for m, b in plan} - CORE_APPS:
        raise ValueError("A real system migration entered the core adoption plan.")

def catalog_fingerprint(connection, tables):
    data = {}
    with connection.cursor() as cur:
        cur.execute("""SELECT table_name, column_name, ordinal_position, data_type, udt_name,
            is_nullable, column_default, character_maximum_length
            FROM information_schema.columns WHERE table_schema = 'public'
            AND table_name::text = ANY(%s) ORDER BY table_name, ordinal_position""", [sorted(tables)])
        data["columns"] = cur.fetchall()
        cur.execute("""SELECT c.relname, x.conname, pg_get_constraintdef(x.oid), x.convalidated
            FROM pg_constraint x JOIN pg_class c ON c.oid = x.conrelid
            WHERE c.relnamespace = 'public'::regnamespace AND c.relname::text = ANY(%s)
            ORDER BY c.relname, x.conname""", [sorted(tables)])
        data["constraints"] = cur.fetchall()
        cur.execute("SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename::text = ANY(%s) ORDER BY tablename, indexname", [sorted(tables)])
        data["indexes"] = cur.fetchall()
        cur.execute("""SELECT c.relname, t.tgname, pg_get_triggerdef(t.oid), t.tgenabled
            FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
            WHERE c.relnamespace = 'public'::regnamespace AND NOT t.tgisinternal
            AND c.relname::text = ANY(%s) ORDER BY c.relname, t.tgname""", [sorted(tables)])
        data["triggers"] = cur.fetchall()
        cur.execute("""SELECT p.proname, pg_get_functiondef(p.oid) FROM pg_proc p
            WHERE p.pronamespace = 'public'::regnamespace AND NOT EXISTS (
              SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass
              AND d.objid = p.oid AND d.refclassid = 'pg_extension'::regclass AND d.deptype = 'e')
            ORDER BY p.proname, p.oid""")
        data["application_functions"] = cur.fetchall()
    return hashlib.sha256(json.dumps(data, sort_keys=True, default=str).encode()).hexdigest()

def record_guards_preflight(connection):
    expected = {
        "records_hoso": {"CHECK ((btrim((so_ky_hieu)::text) <> ''::text))",
                         "CHECK ((stt_uu_tien > 0))",
                         "CHECK ((btrim((ten_ho_so)::text) <> ''::text))"},
        "records_loaivanban": {"CHECK ((btrim((ten_loai)::text) <> ''::text))"},
    }
    with connection.cursor() as cur:
        for table, wanted in expected.items():
            cur.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = %s::regclass AND contype = 'c' AND convalidated", [table])
            actual = {r[0] for r in cur.fetchall()}
            if not wanted.issubset(actual):
                raise ValueError("Release check definitions differ on " + table + "; adoption stopped.")
        cur.execute("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname IN ('uq_records_hoso_he_thong', 'uq_records_loaivanban_hoso_ten')")
        indexes = dict(cur.fetchall())
        if set(indexes) != {"uq_records_hoso_he_thong", "uq_records_loaivanban_hoso_ten"}:
            raise ValueError("Records unique guards are missing.")
        for name, definition in indexes.items():
            if "CREATE UNIQUE INDEX" not in definition:
                raise ValueError("Records guard is not a unique index: " + name)
        predicate = indexes["uq_records_hoso_he_thong"].split("WHERE", 1)[-1].lower()
        predicate = re.sub(r"[\s()]", "", predicate)
        if predicate not in {"is_he_thong=true", "is_he_thong", "is_he_thongistrue"}:
            raise ValueError("The system dossier partial-index predicate differs.")
        kind_index = indexes["uq_records_loaivanban_hoso_ten"].lower()
        if "ho_so_id" not in kind_index or "lower" not in kind_index or not any(x in kind_index for x in ("btrim", "trim")):
            raise ValueError("Document type normalization index differs.")
    print("RECORDS_DDL_GUARDS_FOR_ADOPTION = PASS", flush=True)

def final_migration_targets(verifier):
    """Keep only the final target per app, including post-adoption upgrades."""
    targets = dict(verifier.CORE_TARGETS + verifier.SYSTEM_TARGETS)
    targets.update(verifier.POST_ADOPTION_TARGETS)
    return list(targets.items())

def bootstrap(connection, manifest, verifier):
    from django.core.management import call_command
    from django.db import transaction
    from django.db.migrations.executor import MigrationExecutor
    from django.db.migrations.recorder import MigrationRecorder
    with transaction.atomic():
        with connection.cursor() as cur:
            cur.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))", ["group3-release-r2-bootstrap"])
        if MigrationRecorder(connection).applied_migrations():
            raise ValueError("Trial history is no longer empty. Use --action status; do not bootstrap again.")
        before_rows = business_rows_fingerprint(connection, manifest["tables"])
        before_catalog = catalog_fingerprint(connection, manifest["tables"])
        # Create content types for real first: auth migration dependencies require them.
        call_command("migrate", "contenttypes", "0002_remove_content_type_name", interactive=False, verbosity=1, skip_checks=True)
        executor = MigrationExecutor(connection)
        core_plan = executor.migration_plan(verifier.CORE_TARGETS)
        check_core_plan(core_plan)
        if len(core_plan) != 22:
            raise ValueError("Core adoption plan no longer contains the verified 22 migrations.")
        # No core RunPython seed/guard replacement runs here. Existing DDL is authoritative.
        executor.migrate(verifier.CORE_TARGETS, fake=True)
        # Run the SQLite trigger repair and canonical index migration normally.
        # Existing canonical DDL indexes require no schema SQL on PostgreSQL.
        executor = MigrationExecutor(connection)
        executor.migrate(verifier.POST_ADOPTION_TARGETS)
        for app, name in verifier.SYSTEM_TARGETS:
            if app != "contenttypes":
                call_command("migrate", app, name, interactive=False, verbosity=1, skip_checks=True)
        if business_rows_fingerprint(connection, manifest["tables"]) != before_rows:
            raise ValueError("Original release rows changed. Bootstrap will roll back.")
        if catalog_fingerprint(connection, manifest["tables"]) != before_catalog:
            raise ValueError("Original release schema/guards changed. Bootstrap will roll back.")
        executor = MigrationExecutor(connection)
        if executor.migration_plan(final_migration_targets(verifier)):
            raise ValueError("Pending trial migrations remain. Bootstrap will roll back.")
        applied = set(MigrationRecorder(connection).applied_migrations())
        if applied != set(executor.loader.graph.nodes):
            raise ValueError("Recorded migration set differs from the installed trial graph.")
        with connection.cursor() as cur:
            actual = set(connection.introspection.table_names(cur))
        if actual != manifest["tables"] | SYSTEM_TABLES:
            raise ValueError("Unexpected final table set. Bootstrap will roll back.")
    print("CORE_MIGRATION_ADOPTION = PASS", flush=True)
    print("SYSTEM_MIGRATIONS_EXECUTED = PASS", flush=True)
    print("ORIGINAL_RELEASE_TABLE_ROWS = UNCHANGED", flush=True)
    print("ORIGINAL_RELEASE_SCHEMA_AND_GUARDS = UNCHANGED", flush=True)
    print("PUBLIC_TABLE_COUNT_AFTER_BOOTSTRAP =", len(actual), flush=True)
    print("APPLIED_MIGRATION_COUNT =", len(applied), flush=True)
    print("RELEASE_R2_CORE_BOOTSTRAP = PASS", flush=True)

def require_ready(connection, manifest, config, verifier):
    from django.db.migrations.executor import MigrationExecutor
    verifier.validate_graph(connection)
    if MigrationExecutor(connection).migration_plan(final_migration_targets(verifier)):
        raise ValueError("Trial bootstrap is incomplete.")
    verifier.model_preflight(connection)
    record_guards_preflight(connection)
    canonical_records_indexes_preflight(connection)
    import psycopg
    expected = dict(manifest, tables=manifest["tables"] | SYSTEM_TABLES)
    verifier.audit_database(psycopg, config, expected)
    print("BOOTSTRAPPED_TRIAL_READY = PASS", flush=True)

def smoke_api(connection, manifest):
    from django.contrib.auth import get_user_model
    from django.contrib.auth.password_validation import validate_password
    from django.db import transaction, DatabaseError
    from rest_framework.test import APIClient
    from records.models import HoSo
    tables = manifest["tables"] | SYSTEM_TABLES
    before = business_rows_fingerprint(connection, tables)
    schema_before = catalog_fingerprint(connection, manifest["tables"])
    def expect(label, response, code):
        if response.status_code != code:
            raise ValueError(f"{label}: expected HTTP {code}, received HTTP {response.status_code}.")
        print(label, "= PASS", flush=True)
        return response.data
    def expect_sql_rejection(label, statement, params, sqlstate):
        try:
            with transaction.atomic():
                with connection.cursor() as cur:
                    cur.execute(statement, params)
        except DatabaseError as error:
            if getattr(error.__cause__, "sqlstate", None) != sqlstate:
                raise ValueError(label + ": unexpected SQL error type.") from None
        else:
            raise ValueError(label + ": the DDL guard failed to reject this write.")
        print(label, "= PASS", flush=True)
    with transaction.atomic():
        user = get_user_model().objects.get(username="admin")
        if not user.is_active or not user.is_superuser:
            raise ValueError("Seeded trial admin is not active/superuser.")
        password = secrets.token_urlsafe(32) + "A7!"
        validate_password(password, user=user)
        # Ephemeral password is not printed/persisted: this entire smoke transaction rolls back.
        user.set_password(password)
        user.save(update_fields=["password"])
        client = APIClient()
        expect("UNAUTHENTICATED_DOSSIER", client.get("/api/records/dossiers/"), 401)
        expect("WRONG_PASSWORD_REJECTED", client.post("/api/auth/login/", {"username": "admin", "password": password + "wrong"}, format="json"), 401)
        payload = expect("EMPLOYEE_LOGIN", client.post("/api/auth/login/", {"username": "admin", "password": password}, format="json"), 200)
        if not payload.get("access") or not payload.get("refresh") or payload["user"]["id"] != user.pk:
            raise ValueError("Login JWT/user response contract differs.")
        client.credentials(HTTP_AUTHORIZATION="Bearer " + payload["access"])
        profile = expect("EMPLOYEE_PROFILE", client.get("/api/auth/profile/"), 200)
        if profile["id"] != user.pk:
            raise ValueError("Profile identifies a different Employee.")
        expect("DOSSIER_LIST", client.get("/api/records/dossiers/"), 200)
        code = "TRIAL-" + uuid.uuid4().hex[:12]
        dossier = expect("DOSSIER_CREATE", client.post("/api/records/dossiers/", {"so_ky_hieu": code, "ten_ho_so": "Hồ sơ kiểm chứng release"}, format="json"), 201)
        if HoSo.objects.get(pk=dossier["id"]).nguoi_lap_id != user.pk:
            raise ValueError("Dossier creator FK does not reference authenticated Employee.")
        expect("DUPLICATE_DOSSIER_CODE_REJECTED", client.post("/api/records/dossiers/", {"so_ky_hieu": code, "ten_ho_so": "Hồ sơ trùng"}, format="json"), 400)
        dossier_url = f"/api/records/dossiers/{dossier['id']}/"
        expect("DOSSIER_PATCH", client.patch(dossier_url, {"ten_ho_so": "Hồ sơ kiểm chứng đã cập nhật"}, format="json"), 200)
        expect_sql_rejection("DDL_BLANK_DOSSIER_NAME_REJECTED", "UPDATE records_hoso SET ten_ho_so = '   ' WHERE id = %s", [dossier["id"]], "23514")
        common = HoSo.objects.get(is_he_thong=True, so_ky_hieu="HSC")
        expect("SYSTEM_DOSSIER_API_DELETE_REJECTED", client.delete(f"/api/records/dossiers/{common.pk}/"), 409)
        expect_sql_rejection("DDL_SYSTEM_DOSSIER_DELETE_REJECTED", "DELETE FROM records_hoso WHERE id = %s", [common.pk], "P0001")
        expect_sql_rejection("DDL_SYSTEM_FLAG_DOWNGRADE_REJECTED", "UPDATE records_hoso SET is_he_thong = false WHERE id = %s", [common.pk], "P0001")
        types_url = dossier_url + "document-types/"
        kind = expect("DOCUMENT_TYPE_CREATE", client.post(types_url, {"ten_loai": "Quyết định thử"}, format="json"), 201)
        expect("DOSSIER_WITH_TYPE_DELETE_REJECTED", client.delete(dossier_url), 409)
        kind_url = f"/api/records/document-types/{kind['id']}/"
        expect("DOCUMENT_TYPE_PATCH", client.patch(kind_url, {"ten_loai": "Thông báo thử"}, format="json"), 200)
        expect_sql_rejection("DDL_BLANK_DOCUMENT_TYPE_REJECTED", "UPDATE records_loaivanban SET ten_loai = '   ' WHERE id = %s", [kind["id"]], "23514")
        expect("DOCUMENT_TYPE_DELETE", client.delete(kind_url), 204)
        expect("DOSSIER_DELETE", client.delete(dossier_url), 204)
        refreshed = expect("JWT_REFRESH", client.post("/api/auth/token/refresh/", {"refresh": payload["refresh"]}, format="json"), 200)
        if not refreshed.get("refresh"):
            raise ValueError("JWT rotation did not issue a replacement refresh token.")
        expect("JWT_OLD_REFRESH_REJECTED", client.post("/api/auth/token/refresh/", {"refresh": payload["refresh"]}, format="json"), 401)
        expect("JWT_LOGOUT", client.post("/api/auth/logout/", {"refresh": refreshed["refresh"]}, format="json"), 200)
        expect("JWT_LOGGED_OUT_REFRESH_REJECTED", client.post("/api/auth/token/refresh/", {"refresh": refreshed["refresh"]}, format="json"), 401)
        transaction.set_rollback(True)
    if business_rows_fingerprint(connection, tables) != before:
        raise ValueError("Trial rows/password differ after smoke rollback.")
    if catalog_fingerprint(connection, manifest["tables"]) != schema_before:
        raise ValueError("Trial schema differs after smoke.")
    print("TEST_ROWS_AND_ADMIN_PASSWORD = ROLLED_BACK_AND_VERIFIED", flush=True)
    print("TRIAL_SEQUENCES = MAY_HAVE_ADVANCED", flush=True)
    print("EMPLOYEE_JWT_RECORDS_SMOKE = PASS", flush=True)
    print("GROUP2_DOCUMENT_LIST_FLOW = NOT_TESTED_BY_CORE_SMOKE", flush=True)

def business_rows_fingerprint(connection, tables):
    """Check all original DDL table rows, including permissions and mappings."""
    from psycopg import sql
    result = {}
    with connection.cursor() as cur:
        for table in sorted(tables):
            cur.execute(sql.SQL("SELECT count(*), md5(COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text, '[]')) FROM {} t").format(sql.Identifier("public", table)))
            result[table] = cur.fetchone()
    return result

def backup_trial(repo, config):
    candidates = []
    if os.environ.get("POSTGRES_BIN"):
        candidates.append(Path(os.environ["POSTGRES_BIN"]) / "pg_dump.exe")
    if shutil.which("pg_dump"):
        candidates.append(Path(shutil.which("pg_dump")))
    candidates.append(Path("D:/PostgreSQL/bin/pg_dump.exe"))
    pg_dump = next((p for p in candidates if p.is_file()), None)
    if pg_dump is None:
        raise ValueError("pg_dump unavailable; no bootstrap writes will occur.")
    folder = repo.parent / "database_backups"
    folder.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    path = folder / f"{TARGET}_before_core_bootstrap_{stamp}_{uuid.uuid4().hex[:8]}.backup"
    env = {k: v for k, v in os.environ.items() if not k.upper().startswith("PG")}
    env.update(PGDATABASE=TARGET, PGUSER=str(config["user"]), PGPASSWORD=str(config["password"]),
               PGHOST=str(config["host"]), PGPORT=str(config["port"]), PGCONNECT_TIMEOUT="5", PGCLIENTENCODING="UTF8")
    result = subprocess.run([str(pg_dump), "-w", "--format=custom", "--file", str(path)],
                            env=env, capture_output=True, timeout=180)
    if result.returncode or not path.is_file() or path.stat().st_size < 1024:
        raise RuntimeError("Trial backup failed; no bootstrap writes will occur.")
    raw = path.read_bytes()
    if raw[:5] != b"PGDMP":
        raise ValueError("Backup is not a PostgreSQL custom archive.")
    print("TRIAL_BACKUP = PASS", flush=True)
    print("TRIAL_BACKUP_PATH =", path, flush=True)
    print("TRIAL_BACKUP_SHA256 =", hashlib.sha256(raw).hexdigest(), flush=True)


def release_manifest(path):
    raw = path.read_bytes()
    require_equal("CANONICAL_DDL_SHA256", hashlib.sha256(raw).hexdigest(), DDL_HASH)
    text = raw.decode("utf-8", errors="strict")
    tables = set(re.findall(r"^CREATE TABLE\s+(\w+)\s*\(", text, re.M))
    enums = {name: re.findall(r"'([^']*)'", values) for name, values in re.findall(r"^CREATE TYPE\s+(\w+)\s+AS ENUM\s*\(([^;]+)\);", text, re.M)}
    triggers = set(re.findall(r"^CREATE (?:CONSTRAINT\s+)?TRIGGER\s+(\w+)\s+(?:BEFORE|AFTER)\s+[^;]*?\bON\s+(\w+)", text, re.M))
    views = set(re.findall(r"^CREATE VIEW\s+(\w+)\b", text, re.M))
    functions = set(re.findall(r"^CREATE (?:OR REPLACE )?FUNCTION\s+(\w+)\s*\(", text, re.M))
    extensions = set(re.findall(r"^CREATE EXTENSION (?:IF NOT EXISTS )?(\w+)\s*;", text, re.M))
    section = text.split("auth_permission (name, codename, module_ten)", 1)[1].split("ON CONFLICT", 1)[0]
    permissions = set(re.findall(r"\(\s*'[^']*'\s*,\s*'([^']*)'\s*,\s*'[^']*'\s*\)", section))
    require_equal("RELEASE_SOURCE_COUNTS", (len(tables),len(enums),len(triggers),len(permissions)), (55,20,31,77))
    return dict(tables=tables,enums=enums,triggers=triggers,views=views,functions=functions,extensions=extensions,permissions=permissions)


def create_database(repo, config):
    import psycopg
    from psycopg import sql
    from dotenv import dotenv_values
    psql = Path(dotenv_values(repo / "backend/.env").get("POSTGRES_BIN", "D:/PostgreSQL/bin")) / "psql.exe"
    if not psql.is_file():
        raise ValueError("POSTGRES_BIN/psql.exe not found; database was not created")
    with psycopg.connect(**config, dbname="postgres", autocommit=True) as admin:
        if admin.execute("SELECT 1 FROM pg_database WHERE datname = %s", [TARGET]).fetchone():
            raise ValueError("Target already exists. Use status/bootstrap; never re-import over it")
        admin.execute(sql.SQL("CREATE DATABASE {} TEMPLATE template0 ENCODING 'UTF8'").format(sql.Identifier(TARGET)))
    env = {k:v for k,v in os.environ.items() if not k.upper().startswith("PG")}
    env.update(PGUSER=str(config["user"]),PGPASSWORD=str(config["password"]),PGHOST=str(config["host"]),PGPORT=str(config["port"]),PGDATABASE=TARGET,PGCLIENTENCODING="UTF8",PGCONNECT_TIMEOUT="5")
    result = subprocess.run([str(psql),"-X","-w","-v","ON_ERROR_STOP=1","-f",str(repo / "docs/common/database/release_DDL.sql")],env=env,capture_output=True,timeout=180)
    if result.returncode:
        raise ValueError("DDL import failed. The new target is kept for diagnosis; no old database was changed")
    print("NEW_RELEASE_DATABASE_UTF8_IMPORT = PASS",flush=True)


def smoke_retired_document_endpoint():
    from django.urls import resolve, Resolver404
    for path in ("/api/records/dossiers/1/documents/", "/api/records/dossiers/999/documents/"):
        try:
            resolve(path)
        except Resolver404:
            continue
        raise ValueError("Retired Group 3 metadata endpoint remains reachable")
    print("RETIRED_GROUP3_DOCUMENT_ENDPOINT = PASS", flush=True)


def canonical_records_indexes_preflight(connection):
    from records.models import HoSo, LoaiVanBan
    for model, column, expected in ((HoSo, "nguoi_lap_id", "idx_hoso_nguoi_lap"),
                                    (LoaiVanBan, "ho_so_id", "idx_loaivanban_hoso")):
        with connection.cursor() as cursor:
            indexes = connection.introspection.get_constraints(cursor, model._meta.db_table)
        matches = {name for name, info in indexes.items()
                   if info.get("index") and not info.get("unique") and info.get("columns") == [column]}
        require_equal("CANONICAL_FK_INDEX_" + expected, matches, {expected})


def main():
    parser=argparse.ArgumentParser();parser.add_argument("--action",choices=["create","bootstrap","status","smoke"],required=True);args=parser.parse_args()
    repo=Path(__file__).resolve().parents[2]
    sys.path.insert(0,str(repo / "backend"))
    os.environ["PSYCOPG_IMPL"]="binary"
    from dotenv import dotenv_values
    env=dotenv_values(repo / "backend/.env")
    if env.get("DB_NAME")!=TARGET:raise ValueError("Worktree .env must select the new release target")
    for key in ["DB_NAME","DB_USER","DB_PASSWORD","DB_HOST","DB_PORT"]:
        if env.get(key) is not None:os.environ[key]=env[key]
    config={"user":env['DB_USER'],"password":env['DB_PASSWORD'],"host":env.get('DB_HOST') or '127.0.0.1',"port":env.get('DB_PORT') or '5432',"connect_timeout":5}
    manifest=release_manifest(repo / "docs/common/database/release_DDL.sql")
    if args.action=='create':
        create_database(repo,config)
        import psycopg
        audit_database(psycopg,config,manifest)
        return
    os.environ['DJANGO_SETTINGS_MODULE']='config.records_release'
    import django;django.setup()
    from django.conf import settings
    from django.db import connection
    require_equal("PROJECT_RUNTIME_AUTH_USER_MODEL",settings.AUTH_USER_MODEL,"accounts.Employee")
    require_equal("PROJECT_RUNTIME_DATABASE",connection.settings_dict['NAME'],TARGET)
    verifier=sys.modules[__name__]
    if args.action=='bootstrap':
        import psycopg
        audit_database(psycopg,config,manifest)
        validate_graph(connection);model_preflight(connection);record_guards_preflight(connection)
        canonical_records_indexes_preflight(connection)
        backup_trial(repo,config);bootstrap(connection,manifest,verifier)
    require_ready(connection,manifest,config,verifier)
    if args.action=='smoke':
        smoke_api(connection,manifest);smoke_retired_document_endpoint()
    print('RECORDS_RELEASE_'+args.action.upper()+' = PASS',flush=True)


if __name__=='__main__':
    try:main()
    except Exception as error:
        print('RECORDS_RELEASE_ACTION = FAILED',flush=True)
        print('ERROR_TYPE =',type(error).__name__,flush=True)
        cause = error.__cause__ or error
        print('SQLSTATE =',getattr(cause,'sqlstate',None),flush=True)
        diagnostic = getattr(cause,'diag',None)
        if diagnostic is not None:
            for name in ('table_name','column_name','constraint_name'):
                print(name.upper(),'=',getattr(diagnostic,name,None),flush=True)
        print('ERROR =',str(error)[:600] if isinstance(error,(ValueError,FileNotFoundError)) else 'Dependency/database operation failed. Existing project databases were not selected.',flush=True)
        sys.exit(1)
