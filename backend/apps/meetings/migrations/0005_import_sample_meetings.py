from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0012_import_sample_employees"),
        ("meetings", "0004_install_meetingroom_updated_at_trigger"),
        ("organizations", "0005_reference_data_ddl"),
    ]

    # Sample workbook data is imported only by the explicit management command.
    operations = []
