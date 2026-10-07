from django.db import migrations, models

TABLES = ("meetings_meetingroom", "meetings_meetingbooking")


def rename_status_columns(apps, schema_editor):
    """Đổi status -> trang_thai nếu DB còn cột cũ; DB dựng từ DDL đã có trang_thai thì bỏ qua."""
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        for table in TABLES:
            columns = {c.name for c in connection.introspection.get_table_description(cursor, table)}
            if "status" in columns and "trang_thai" not in columns:
                cursor.execute(
                    f"ALTER TABLE {schema_editor.quote_name(table)} RENAME COLUMN status TO trang_thai"
                )


class Migration(migrations.Migration):

    dependencies = [
        ("meetings", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(rename_status_columns, migrations.RunPython.noop)
            ],
            state_operations=[
                migrations.AlterField(
                    model_name="meetingbooking",
                    name="status",
                    field=models.CharField(
                        choices=[
                            ("CONFIRMED", "Đã xác nhận"),
                            ("CANCELLED", "Đã hủy"),
                            ("COMPLETED", "Đã hoàn thành"),
                        ],
                        db_column="trang_thai",
                        default="CONFIRMED",
                        max_length=20,
                        verbose_name="Trạng thái",
                    ),
                ),
                migrations.AlterField(
                    model_name="meetingroom",
                    name="status",
                    field=models.CharField(
                        choices=[
                            ("AVAILABLE", "Sẵn sàng"),
                            ("MAINTENANCE", "Bảo trì"),
                            ("UNAVAILABLE", "Không khả dụng"),
                        ],
                        db_column="trang_thai",
                        default="AVAILABLE",
                        max_length=20,
                        verbose_name="Trạng thái phòng",
                    ),
                ),
            ],
        ),
    ]
