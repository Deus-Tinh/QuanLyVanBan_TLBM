# Generated for DDL Staging Release (PR #96 / PR #101 / PR #102 / Refs #80)
# Đồng bộ kiểu ENUM và schema của Chi tiết tài liệu với release_DDL.sql

from django.db import migrations


ENUM_COLUMNS = [
    ("records_chitiettailieu", "chitiettailieu_hienthi", "hien_thi", ("TAT_CA", "NOI_BO_PHONG_BAN")),
    ("records_chitiettailieu", "hieu_luc_status", "hieu_luc", ("CON_HIEU_LUC", "CON_HIEU_LUC_1_PHAN", "HET_HIEU_LUC", "HET_VA_THAY_THE")),
]


def columns_to_enum(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        for table, enum_type, col, labels in ENUM_COLUMNS:
            cursor.execute("SELECT 1 FROM pg_type WHERE typname = %s", [enum_type])
            if cursor.fetchone() is None:
                values = ", ".join("'%s'" % label for label in labels)
                cursor.execute(f"CREATE TYPE {enum_type} AS ENUM ({values})")
            cursor.execute(
                "SELECT udt_name FROM information_schema.columns "
                "WHERE table_schema = current_schema() AND table_name = %s AND column_name = %s",
                [table, col],
            )
            row = cursor.fetchone()
            if row and row[0] != enum_type:
                cursor.execute(f"ALTER TABLE {table} ALTER COLUMN {col} DROP DEFAULT")
                cursor.execute(
                    f"ALTER TABLE {table} ALTER COLUMN {col} TYPE {enum_type} USING {col}::{enum_type}"
                )


def columns_to_varchar(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        for table, enum_type, col, labels in ENUM_COLUMNS:
            cursor.execute(f"ALTER TABLE {table} ALTER COLUMN {col} DROP DEFAULT")
            cursor.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE varchar(30) USING {col}::text")
            if col == "hien_thi":
                cursor.execute(f"ALTER TABLE {table} ALTER COLUMN {col} SET DEFAULT 'TAT_CA'")


def align_indexes_forwards(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        # 1. records_chitiettailieu: index don_vi_id -> idx_chitiettailieu_don_vi
        cursor.execute(
            "SELECT indexname FROM pg_indexes "
            "WHERE schemaname = current_schema() AND tablename = 'records_chitiettailieu'"
        )
        existing_indexes = {row[0] for row in cursor.fetchall()}
        if "idx_chitiettailieu_don_vi" not in existing_indexes:
            for idx in existing_indexes:
                if idx.startswith("records_chitiettailieu_don_vi_id"):
                    cursor.execute(f"ALTER INDEX {idx} RENAME TO idx_chitiettailieu_don_vi")
                    break

        # 2. records_chitiettailieu_attachment:
        cursor.execute(
            "SELECT indexname FROM pg_indexes "
            "WHERE schemaname = current_schema() AND tablename = 'records_chitiettailieu_attachment'"
        )
        att_indexes = {row[0] for row in cursor.fetchall()}
        if "idx_chitiettailieu_att_doc" in att_indexes and "idx_chitiettailieu_attachment_doc" not in att_indexes:
            cursor.execute("ALTER INDEX idx_chitiettailieu_att_doc RENAME TO idx_chitiettailieu_attachment_doc")
        if "idx_chitiettailieu_att_del" in att_indexes and "idx_chitiettailieu_attachment_deleted" not in att_indexes:
            cursor.execute("ALTER INDEX idx_chitiettailieu_att_del RENAME TO idx_chitiettailieu_attachment_deleted")


def align_indexes_backwards(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT indexname FROM pg_indexes "
            "WHERE schemaname = current_schema() AND tablename = 'records_chitiettailieu_attachment'"
        )
        att_indexes = {row[0] for row in cursor.fetchall()}
        if "idx_chitiettailieu_attachment_doc" in att_indexes and "idx_chitiettailieu_att_doc" not in att_indexes:
            cursor.execute("ALTER INDEX idx_chitiettailieu_attachment_doc RENAME TO idx_chitiettailieu_att_doc")
        if "idx_chitiettailieu_attachment_deleted" in att_indexes and "idx_chitiettailieu_att_del" not in att_indexes:
            cursor.execute("ALTER INDEX idx_chitiettailieu_attachment_deleted RENAME TO idx_chitiettailieu_att_del")


class Migration(migrations.Migration):

    dependencies = [
        ('document_templates', '0002_normalize_column_names_ddl_pr96'),
    ]

    operations = [
        migrations.RunPython(columns_to_enum, columns_to_varchar),
        migrations.RunPython(align_indexes_forwards, align_indexes_backwards),
    ]
