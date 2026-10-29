from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0011_employeeassignment_fk_cascade_ddl"),
        ("authorization", "0008_supplementary_groups_tlbgd_kt"),
        ("organizations", "0005_reference_data_ddl"),
    ]

    # Sample workbook data is imported only by the explicit management command.
    operations = []
