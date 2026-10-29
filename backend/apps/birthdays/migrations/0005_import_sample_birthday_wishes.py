from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0012_import_sample_employees"),
        ("birthdays", "0004_install_updated_at_triggers"),
    ]

    # Sample workbook data is imported only by the explicit management command.
    operations = []
