"""Align FK index names without rebuilding tables or re-importing release DDL."""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


INDEXES = (
    ("HoSo", "nguoi_lap", "idx_hoso_nguoi_lap"),
    ("LoaiVanBan", "ho_so", "idx_loaivanban_hoso"),
)


def canonicalize_fk_indexes(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor not in {"postgresql", "sqlite"}:
        raise RuntimeError("Records index adoption supports PostgreSQL and SQLite only.")
    quote = schema_editor.quote_name
    # Validate BOTH tables first. Unexpected indexes must never be silently dropped.
    actions = []
    for model_name, field_name, canonical in INDEXES:
        model = apps.get_model("records", model_name)
        table = model._meta.db_table
        column = model._meta.get_field(field_name).column
        generated = schema_editor._create_index_name(table, [column], suffix="")
        with connection.cursor() as cursor:
            constraints = connection.introspection.get_constraints(cursor, table)
            if connection.vendor == "postgresql":
                cursor.execute("""
                    SELECT c.relname FROM pg_index i
                    JOIN pg_class c ON c.oid = i.indexrelid
                    JOIN pg_am am ON am.oid = c.relam
                    WHERE i.indrelid = %s::regclass AND am.amname = 'btree'
                      AND i.indpred IS NULL AND i.indexprs IS NULL
                      AND i.indisvalid AND i.indisready
                      AND i.indnatts = 1 AND i.indnkeyatts = 1
                """, [table])
                plain_names = {row[0] for row in cursor.fetchall()}
            else:
                cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name=%s", [table])
                plain_names = {name for name, sql in cursor.fetchall() if sql and " WHERE " not in sql.upper()}
        matching = set()
        for name, info in constraints.items():
            if info.get("index") and not info.get("unique") and info.get("columns") == [column]:
                if name not in plain_names:
                    raise RuntimeError(f"Unexpected FK index definition: {table}.{name}")
                matching.add(name)
        if canonical in constraints and canonical not in matching:
            raise RuntimeError(f"Canonical index has a different definition: {canonical}")
        unexpected = matching - {canonical, generated}
        if unexpected:
            raise RuntimeError(f"Review unexpected FK indexes before adoption: {sorted(unexpected)}")
        actions.append((model, field_name, table, generated, canonical, matching))
    for model, field_name, table, generated, canonical, matching in actions:
        if canonical not in matching:
            if generated in matching and connection.vendor == "postgresql":
                schema_editor.execute(f"ALTER INDEX {quote(generated)} RENAME TO {quote(canonical)}")
            else:
                schema_editor.add_index(model, models.Index(fields=[field_name], name=canonical))
                if generated in matching:
                    schema_editor.execute(f"DROP INDEX {quote(generated)}")
        elif generated in matching:
            schema_editor.execute(f"DROP INDEX {quote(generated)}")


class Migration(migrations.Migration):
    dependencies = [("records", "0004_restore_sqlite_hoso_guards")]
    operations = [migrations.SeparateDatabaseAndState(
        # Irreversible deliberately: never rename canonical DDL indexes back automatically.
        database_operations=[migrations.RunPython(canonicalize_fk_indexes)],
        state_operations=[
            migrations.AlterField("hoso", "nguoi_lap", models.ForeignKey(
                to=settings.AUTH_USER_MODEL, on_delete=django.db.models.deletion.PROTECT,
                related_name="ho_so_da_lap", db_index=False)),
            migrations.AlterField("loaivanban", "ho_so", models.ForeignKey(
                to="records.hoso", on_delete=django.db.models.deletion.PROTECT,
                related_name="loai_van_ban", db_index=False)),
            migrations.AddIndex("hoso", models.Index(fields=["nguoi_lap"], name="idx_hoso_nguoi_lap")),
            migrations.AddIndex("loaivanban", models.Index(fields=["ho_so"], name="idx_loaivanban_hoso")),
        ],
    )]
