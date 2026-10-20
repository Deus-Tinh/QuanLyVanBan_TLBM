"""Dựng DB PostgreSQL từ docs/common/database/release_DDL.sql rồi đồng bộ trạng thái migration Django.

Một quy trình dùng chung cho local, CI và staging:
1. Tạo DB rỗng với collation ICU vi-VN (hoặc dựng lại khi có --force); DB có sẵn collation khác thì báo lỗi. DB có sẵn chỉ dùng tại chỗ khi còn nguyên trạng mới tạo: không
   schema ngoài public, không relation/type/function trong public, không extension ngoài plpgsql.
2. Nạp release_DDL.sql. File này tự có BEGIN/COMMIT nên không rollback được giữa chừng.
3. Duyệt migration theo thứ tự phụ thuộc. App có đủ bảng model trong DB thì ghi nhận migration
   là đã áp dụng (fake); app không có bảng nào thì áp dụng thật. App có một phần bảng thì báo lỗi.
4. Xác nhận không còn migration chưa áp dụng.
5. Tùy chọn chạy seed_db.
6. Ghi dấu hoàn tất vào COMMENT của DB (sha256 của DDL, trạng thái seed và collation).

Bước nào thất bại thì dọn: DB do lượt chạy này tạo (hoặc thay bằng --force) bị DROP; DB có sẵn nhưng rỗng
được trả về trạng thái rỗng (DROP SCHEMA public rồi tạo lại). DB có sẵn không đạt nguyên trạng không bị chạm
vào khi thiếu --force. --if-empty chỉ bỏ qua khi DB có dấu hoàn tất khớp hash DDL và yêu cầu seed.

--sync: chạy trên DB đã tồn tại (không tạo/xóa DB, không nạp DDL, không ghi dấu hoàn tất, không seed). Chỉ chạy khi
dấu hoàn tất có ddl_sha256 khớp release_DDL.sql hiện tại (DB đúng bằng nguồn chuẩn); không có dấu hoặc dấu lệch
thì dừng trước mọi thay đổi và yêu cầu dựng lại bằng --force. Khi dấu khớp, chỉ xử lý migration chưa áp dụng
theo thứ tự phụ thuộc: app có đủ bảng thì fake, app chưa có bảng nào thì migrate thật, app có một phần bảng hoặc
thiếu cột của model thì báo lỗi. Lỗi giữa chừng không dọn DB; thông báo nêu các migration đã ghi nhận.

Kết nối lấy từ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (tham số dòng lệnh ghi đè, riêng mật khẩu
chỉ đọc từ DB_PASSWORD). User kết nối cần quyền CREATEDB. Cần DJANGO_SECRET_KEY như khi chạy backend.

Dùng: python scripts/build_db.py [--dbname TÊN] [--force | --if-empty] [--seed] | --sync
"""
import argparse
import hashlib
import os
import sys
from pathlib import Path

import psycopg
from psycopg import sql

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
DEFAULT_DDL = ROOT / "docs" / "common" / "database" / "release_DDL.sql"
MAINTENANCE_DB = "postgres"
MARK_PREFIX = "build_db:v2"
# Collation của mọi DB do repo tạo: thứ tự ORDER BY theo chuỗi trong query của app và view (ví dụ
# string_agg(... ORDER BY dv.ten)) phụ thuộc collation nên phải cố định.
ICU_LOCALE = "vi-VN"
LIBC_LOCALE = "C.UTF-8"
CREATE_DATABASE = (
    "CREATE DATABASE {} TEMPLATE template0 ENCODING 'UTF8' "
    "LOCALE_PROVIDER icu ICU_LOCALE '" + ICU_LOCALE + "' LOCALE '" + LIBC_LOCALE + "'"
)


def parse_args():
    env = os.environ
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--host", default=env.get("DB_HOST", "localhost"))
    parser.add_argument("--port", default=env.get("DB_PORT", "5432"))
    parser.add_argument("--user", default=env.get("DB_USER", "postgres"))
    parser.add_argument("--dbname", default=env.get("DB_NAME"), required="DB_NAME" not in env)
    parser.add_argument("--ddl", type=Path, default=DEFAULT_DDL)
    parser.add_argument("--seed", action="store_true", help="chạy seed_db sau khi dựng")
    parser.add_argument("--demo-data", action="store_true", help="chạy seed_db với cờ --demo-data")
    existing = parser.add_mutually_exclusive_group()
    existing.add_argument("--force", action="store_true", help="xóa và dựng lại DB đã tồn tại")
    existing.add_argument("--if-empty", action="store_true", help="bỏ qua (exit 0) nếu DB đã có bảng")
    parser.add_argument("--sync", action="store_true", help="chỉ áp dụng migration chưa áp dụng lên DB hiện có")
    args = parser.parse_args()
    if args.demo_data and not args.seed:
        parser.error("--demo-data cần đi cùng --seed")
    if args.sync and (args.force or args.if_empty or args.seed or args.demo_data):
        parser.error("--sync không dùng chung với --force, --if-empty, --seed, --demo-data")
    return args


def connect(args, dbname, **kwargs):
    return psycopg.connect(
        dbname=dbname, host=args.host, port=args.port, user=args.user,
        password=os.environ.get("DB_PASSWORD", ""), **kwargs,
    )


def ddl_sha256(args):
    return hashlib.sha256(args.ddl.read_bytes()).hexdigest()


def build_mark(args):
    return f"{MARK_PREFIX} ddl_sha256={ddl_sha256(args)} seed={int(args.seed)} collation=icu:{ICU_LOCALE}"


def read_collation(conn, dbname):
    """(provider, icu_locale) của DB; PG16 gọi cột là daticulocale, PG17 đổi thành datlocale."""
    row = conn.execute(
        "SELECT datlocprovider, coalesce(to_jsonb(d)->>'datlocale', to_jsonb(d)->>'daticulocale') "
        "FROM pg_database d WHERE datname = %s",
        [dbname],
    ).fetchone()
    return row if row else None


def require_collation(conn, dbname):
    collation = read_collation(conn, dbname)
    if collation != ("i", ICU_LOCALE):
        raise SystemExit(
            f"DB {dbname} có collation (provider, locale) = {collation}, cần ('i', '{ICU_LOCALE}') "
            f"(ICU {ICU_LOCALE}). Dùng --force để xóa và dựng lại với collation đúng."
        )


def pristine_violations(args):
    """Liệt kê dấu hiệu DB không còn nguyên trạng; danh sách rỗng nghĩa là DB mới tạo, chưa có gì."""
    queries = {
        "schema ngoài public": (
            "SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('public', 'pg_catalog', 'information_schema') "
            "AND nspname NOT LIKE 'pg\\_toast%' AND nspname NOT LIKE 'pg\\_temp%'"
        ),
        "relation trong public": (
            "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
            "WHERE n.nspname = 'public'"
        ),
        "type trong public": (
            "SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace "
            "WHERE n.nspname = 'public' AND t.typtype <> 'c' AND t.typcategory <> 'A'"
        ),
        "function/procedure trong public": (
            "SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace "
            "WHERE n.nspname = 'public'"
        ),
        "extension": "SELECT extname FROM pg_extension WHERE extname <> 'plpgsql'",
    }
    found = []
    with connect(args, args.dbname) as conn:
        for label, query in queries.items():
            names = [row[0] for row in conn.execute(query).fetchall()]
            if names:
                found.append(f"{label}: {sorted(names)[:5]}")
    return found


def read_mark(conn, dbname):
    row = conn.execute(
        "SELECT shobj_description(oid, 'pg_database') FROM pg_database WHERE datname = %s", [dbname]
    ).fetchone()
    return row[0] if row else None


def create_database(conn, dbname):
    """Tạo DB với collation chuẩn; kiểm tra lại, sai thì xóa chính DB vừa tạo rồi báo lỗi."""
    conn.execute(sql.SQL(CREATE_DATABASE).format(sql.Identifier(dbname)))
    try:
        require_collation(conn, dbname)
    except BaseException:
        conn.execute(sql.SQL("DROP DATABASE {} WITH (FORCE)").format(sql.Identifier(dbname)))
        raise


def prepare_database(args):
    """Chuẩn bị DB đích. Trả về cách dọn khi lỗi: 'drop', 'reset' hoặc None; None kèm skip=True là bỏ qua."""
    name = sql.Identifier(args.dbname)
    with connect(args, MAINTENANCE_DB, autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", [args.dbname]
        ).fetchone()
        if not exists:
            create_database(conn, args.dbname)
            return "drop", False
        if args.force:
            conn.execute(sql.SQL("DROP DATABASE {} WITH (FORCE)").format(name))
            create_database(conn, args.dbname)
            return "drop", False
        require_collation(conn, args.dbname)
        mark = read_mark(conn, args.dbname)
    violations = pristine_violations(args) if mark is None else ["đã có dấu hoàn tất"]
    if not violations:
        return "reset", False
    if args.if_empty and mark == build_mark(args):
        print(f"DB {args.dbname} đã dựng hoàn tất với DDL và yêu cầu seed hiện tại; bỏ qua.")
        return None, True
    if args.if_empty:
        raise SystemExit(
            f"DB {args.dbname} không có dấu hoàn tất khớp DDL/seed hiện tại (dấu: {mark!r}). "
            "Dùng --force để xóa và dựng lại."
        )
    raise SystemExit(
        f"DB {args.dbname} đã tồn tại và không ở nguyên trạng mới tạo ({'; '.join(violations)}). "
        "Không rõ nội dung nên không chạm vào. Dùng --force để xóa và dựng lại."
    )


def require_matching_mark(args):
    """--sync chỉ chạy khi DB do script dựng từ đúng bản release_DDL.sql hiện tại."""
    with connect(args, MAINTENANCE_DB, autocommit=True) as conn:
        exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", [args.dbname]).fetchone()
        mark = read_mark(conn, args.dbname) if exists else None
        if exists:
            require_collation(conn, args.dbname)
    if not exists:
        raise SystemExit(f"DB {args.dbname} chưa tồn tại. Chạy `pnpm db:setup` trước.")
    if not (mark or "").startswith(f"{MARK_PREFIX} ddl_sha256={ddl_sha256(args)} "):
        raise SystemExit(
            f"DB {args.dbname} không có dấu hoàn tất khớp bản release_DDL.sql hiện tại (dấu: {mark!r}): "
            "DDL đã đổi hoặc DB không dựng bằng script. Không thay đổi gì. Chạy `pnpm db:reset` "
            "(build_db.py --force) để dựng lại."
        )


def cleanup(args, mode):
    """Dọn DB sau khi lỗi. Ném SystemExit nếu không dọn được."""
    if "django" in sys.modules:
        from django.db import connections

        connections.close_all()
    if mode == "drop":
        with connect(args, MAINTENANCE_DB, autocommit=True) as conn:
            conn.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(args.dbname)))
        print(f"Đã xóa DB {args.dbname} do lượt dựng thất bại.", file=sys.stderr)
    elif mode == "reset":
        with connect(args, args.dbname, autocommit=True) as conn:
            conn.execute("DROP SCHEMA public CASCADE")
            conn.execute("CREATE SCHEMA public")
        print(f"Đã trả DB {args.dbname} về trạng thái rỗng do lượt dựng thất bại.", file=sys.stderr)


def load_ddl(args):
    with connect(args, args.dbname) as conn:
        conn.execute(args.ddl.read_text(encoding="utf-8"))
    print(f"Đã nạp {args.ddl.name}.")


def write_mark(args):
    with connect(args, MAINTENANCE_DB, autocommit=True) as conn:
        conn.execute(
            sql.SQL("COMMENT ON DATABASE {} IS {}").format(
                sql.Identifier(args.dbname), sql.Literal(build_mark(args))
            )
        )


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


def decide_fake(app_labels, tables_by_app, existing, hint):
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
                f"App '{app}' có một phần bảng trong DB: có {sorted(present)}, "
                f"thiếu {sorted(tables - present)}. Không thể fake một phần. {hint}"
            )
    return fake


def check_columns(app_labels, state, fake, columns_by_table):
    """App được fake phải có đủ cột của model trong DB, vì fake bỏ qua mọi AddField/AlterField."""
    missing = []
    for model in state.apps.get_models(include_auto_created=True):
        meta = model._meta
        if meta.app_label not in app_labels or not fake.get(meta.app_label):
            continue
        if not meta.managed or meta.proxy or meta.swapped:
            continue
        have = columns_by_table.get(meta.db_table, set())
        missing += [f"{meta.db_table}.{f.column}" for f in meta.local_concrete_fields if f.column not in have]
    if missing:
        raise SystemExit(
            f"DB thiếu cột của model: {sorted(missing)}. Không thể fake migration của app đã có bảng; "
            "cập nhật release_DDL.sql rồi chạy `pnpm db:reset` (hoặc build_db.py --force)."
        )


def adopt_migrations(sync=False):
    from django.core.management import call_command
    from django.db import connection
    from django.db.migrations.executor import MigrationExecutor

    executor = MigrationExecutor(connection)
    loader = executor.loader
    leaves = sorted(loader.graph.leaf_nodes())
    if sync:
        order = [(m.app_label, m.name) for m, _ in executor.migration_plan(leaves)]
        if not order:
            print("Không còn migration chưa áp dụng.")
            return
    else:
        order = []
        for leaf in leaves:
            order.extend(n for n in loader.graph.forwards_plan(leaf) if n not in order)

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'"
        )
        columns_by_table = {}
        for table, column in cursor.fetchall():
            columns_by_table.setdefault(table, set()).add(column)
        cursor.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
        )
        existing = {row[0] for row in cursor.fetchall()}
    apps_in_order = {app for app, _ in order}
    state = loader.project_state(leaves)
    hint = (
        "Cập nhật release_DDL.sql rồi chạy `pnpm db:reset` (hoặc build_db.py --force)."
        if sync else "Cần chuẩn hóa DDL hoặc migration."
    )
    fake = decide_fake(apps_in_order, app_tables(state), existing, hint)
    if sync:
        check_columns(apps_in_order, state, fake, columns_by_table)
    for app, is_fake in fake.items():
        print(f"  {app}: {'fake (bảng đã có trong DB)' if is_fake else 'migrate thật'}")

    done = []
    try:
        for app, name in order:
            executor.loader.build_graph()
            executor.migrate([(app, name)], fake=fake[app])
            done.append(f"{app}.{name}")
    except BaseException as exc:
        raise SystemExit(
            f"Migration lỗi sau khi đã ghi nhận {done or 'không migration nào'}; DB không được dọn: {exc!r}"
        ) from exc

    # Chạy migrate rỗng để phát tín hiệu post_migrate một lần (contenttypes, v.v.) và xác nhận kết quả.
    call_command("migrate", interactive=False, verbosity=0)
    pending = MigrationExecutor(connection).migration_plan(
        MigrationExecutor(connection).loader.graph.leaf_nodes()
    )
    if pending:
        raise SystemExit(f"Còn migration chưa áp dụng: {[f'{m.app_label}.{m.name}' for m, _ in pending]}")
    print("Không còn migration chưa áp dụng.")


def build(args):
    load_ddl(args)
    setup_django(args)
    adopt_migrations()
    if args.seed:
        from django.core.management import call_command

        call_command("seed_db", demo_data=args.demo_data)
    write_mark(args)
    print(f"Đã dựng DB {args.dbname}.")


def require_seed_secrets(args):
    if args.seed and not os.environ.get("ADMIN_PASSWORD", "").strip():
        raise SystemExit("Thiếu ADMIN_PASSWORD; chưa thay đổi database.")
    if args.demo_data and not os.environ.get("DEMO_PASSWORD", "").strip():
        raise SystemExit("Thiếu DEMO_PASSWORD cho --demo-data; chưa thay đổi database.")


def main():
    args = parse_args()
    if args.sync:
        if not args.ddl.is_file():
            raise SystemExit(f"Không thấy file DDL: {args.ddl}")
        require_matching_mark(args)
        setup_django(args)
        adopt_migrations(sync=True)
        return
    if not args.ddl.is_file():
        raise SystemExit(f"Không thấy file DDL: {args.ddl}")
    require_seed_secrets(args)
    mode, skip = prepare_database(args)
    if skip:
        return
    try:
        build(args)
    except BaseException as exc:
        try:
            cleanup(args, mode)
        except Exception as cleanup_exc:
            raise SystemExit(
                f"Dựng DB {args.dbname} thất bại: {exc!r}. Dọn DB cũng thất bại: {cleanup_exc!r}. "
                f"DB {args.dbname} có thể còn sót, cần xử lý thủ công."
            ) from exc
        raise


if __name__ == "__main__":
    main()
