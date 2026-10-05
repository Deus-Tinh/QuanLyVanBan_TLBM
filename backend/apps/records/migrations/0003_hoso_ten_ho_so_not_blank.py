from django.db import migrations, models
from django.db.models.functions import Trim
from django.db.models.lookups import Exact


class Migration(migrations.Migration):
    dependencies = [("records", "0002_hoso_guards")]

    operations = [
        migrations.AddConstraint(
            model_name="hoso",
            constraint=models.CheckConstraint(
                condition=~Exact(Trim("ten_ho_so"), models.Value("")),
                name="ck_records_hoso_ten_ho_so_not_blank",
            ),
        ),
    ]
