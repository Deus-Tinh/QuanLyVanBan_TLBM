"""Restore SQLite guards lost when 0003 rebuilds records_hoso.

PostgreSQL keeps its triggers when adding the constraint. Its canonical
release schema must remain unchanged by this migration.
"""
from django.db import migrations


def restore_sqlite_guards(apps, schema_editor):
    if schema_editor.connection.vendor != "sqlite":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS trg_hoso_prevent_delete
            BEFORE DELETE ON records_hoso WHEN OLD.is_he_thong = 1
            BEGIN
              SELECT RAISE(ABORT, 'Không thể xóa Hồ sơ chung / bản ghi hệ thống.');
            END;
        """)
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS trg_hoso_prevent_update_he_thong
            BEFORE UPDATE OF is_he_thong ON records_hoso
            WHEN OLD.is_he_thong = 1 AND NEW.is_he_thong = 0
            BEGIN
              SELECT RAISE(ABORT, 'Không thể gỡ bỏ cờ is_he_thong từ TRUE sang FALSE.');
            END;
        """)


class Migration(migrations.Migration):
    dependencies = [("records", "0003_hoso_ten_ho_so_not_blank")]
    operations = [
        # Reversing the repair alone should not remove protection from the table.
        migrations.RunPython(restore_sqlite_guards, migrations.RunPython.noop),
    ]
