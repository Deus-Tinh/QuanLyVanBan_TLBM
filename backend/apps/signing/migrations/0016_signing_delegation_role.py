import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("signing", "0015_van_ban_trinh_ky_khac"), ("accounts", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="signingrequeststepsigner", name="chuc_vu_goc_uy_quyen",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="+", to="accounts.position"),
        ),
        migrations.CreateModel(
            name="SigningDelegationRole",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("chuc_vu_giao", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="+", to="accounts.position")),
                ("chuc_vu_nhan", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="+", to="accounts.position")),
            ],
            options={"db_table": "signing_delegation_role", "constraints": [models.UniqueConstraint(fields=("chuc_vu_giao", "chuc_vu_nhan"), name="uq_signing_delegation_role")]},
        ),
    ]
