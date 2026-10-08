from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
from django.db.models.functions import Lower, Trim
from django.db.models.lookups import Exact
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="HoSo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stt_uu_tien", models.PositiveIntegerField(unique=True, validators=[MinValueValidator(1)])),
                ("so_ky_hieu", models.CharField(max_length=255, unique=True)),
                ("ten_ho_so", models.CharField(max_length=255)),
                ("nguoi_lap", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="ho_so_da_lap", to=settings.AUTH_USER_MODEL)),
                ("ngay_lap", models.DateTimeField(blank=True, null=True)),
                ("ghi_chu", models.TextField(blank=True, null=True)),
                ("is_he_thong", models.BooleanField(default=False, editable=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "records_hoso",
                "ordering": ["-is_he_thong", "stt_uu_tien", "id"],
                "indexes": [
                    models.Index(fields=["ten_ho_so"], name="idx_hoso_ten"),
                    models.Index(fields=["ngay_lap"], name="idx_hoso_ngay_lap"),
                ],
                "constraints": [
                    models.CheckConstraint(condition=models.Q(stt_uu_tien__gt=0), name="ck_records_hoso_stt_positive"),
                    models.CheckConstraint(condition=~Exact(Trim("so_ky_hieu"), models.Value("")), name="ck_records_hoso_so_ky_hieu_not_blank"),
                    models.UniqueConstraint(fields=["is_he_thong"], condition=models.Q(is_he_thong=True), name="uq_records_hoso_he_thong"),
                ],
            },
        ),
        migrations.CreateModel(
            name="LoaiVanBan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ho_so", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="loai_van_ban", to="records.hoso")),
                ("ten_loai", models.CharField(max_length=255)),
                ("ngay_lap", models.DateTimeField(blank=True, null=True)),
                ("ghi_chu", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "records_loaivanban",
                "ordering": ["id"],
                "indexes": [
                    models.Index(fields=["ten_loai"], name="idx_loaivanban_ten"),
                    models.Index(fields=["ngay_lap"], name="idx_loaivanban_ngay_lap"),
                ],
                "constraints": [
                    models.CheckConstraint(condition=~Exact(Trim("ten_loai"), models.Value("")), name="ck_records_loaivanban_ten_loai_not_blank"),
                    models.UniqueConstraint(models.F("ho_so"), Lower(Trim("ten_loai")), name="uq_records_loaivanban_hoso_ten"),
                ],
            },
        ),
    ]
