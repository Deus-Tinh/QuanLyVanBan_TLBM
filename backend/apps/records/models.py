from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import connections, models, router, transaction
from django.db.models import Max, Q
from django.db.models.functions import Lower, Trim


class HoSo(models.Model):
    stt_uu_tien = models.PositiveIntegerField(
        unique=True, validators=[MinValueValidator(1)]
    )
    so_ky_hieu = models.CharField(max_length=255, unique=True)
    ten_ho_so = models.CharField(max_length=255)
    nguoi_lap = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ho_so_da_lap",
    )
    ngay_lap = models.DateTimeField(null=True, blank=True)
    ghi_chu = models.TextField(null=True, blank=True)
    is_he_thong = models.BooleanField(default=False, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "records_hoso"
        ordering = ["-is_he_thong", "stt_uu_tien", "id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(stt_uu_tien__gt=0), name="ck_records_hoso_stt_positive"
            ),
            models.UniqueConstraint(
                fields=["is_he_thong"],
                condition=Q(is_he_thong=True),
                name="uq_records_hoso_he_thong",
            ),
        ]
        indexes = [
            models.Index(fields=["ten_ho_so"], name="idx_hoso_ten"),
            models.Index(fields=["ngay_lap"], name="idx_hoso_ngay_lap"),
        ]

    def save(self, *args, **kwargs):
        using = kwargs.get("using") or router.db_for_write(type(self), instance=self)
        if self._state.adding and self.stt_uu_tien in (None, 0):
            with transaction.atomic(using=using):
                # Cùng khóa với trigger PostgreSQL trong SQL đã duyệt.
                if connections[using].vendor == "postgresql":
                    with connections[using].cursor() as cursor:
                        cursor.execute(
                            "SELECT pg_advisory_xact_lock('records_hoso'::regclass::oid::bigint)"
                        )
                max_stt = type(self).objects.using(using).aggregate(
                    highest=Max("stt_uu_tien")
                )["highest"]
                self.stt_uu_tien = (max_stt or 0) + 1
                return super().save(*args, **kwargs)
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.is_he_thong:
            raise ValueError("Không thể xóa Hồ sơ chung / hồ sơ hệ thống.")
        return super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.so_ky_hieu} - {self.ten_ho_so}"


class LoaiVanBan(models.Model):
    ho_so = models.ForeignKey(HoSo, on_delete=models.PROTECT, related_name="loai_van_ban")
    ten_loai = models.CharField(max_length=255)
    ngay_lap = models.DateTimeField(null=True, blank=True)
    ghi_chu = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "records_loaivanban"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                models.F("ho_so"),
                Lower(Trim("ten_loai")),
                name="uq_records_loaivanban_hoso_ten",
            ),
        ]
        indexes = [
            models.Index(fields=["ten_loai"], name="idx_loaivanban_ten"),
            models.Index(fields=["ngay_lap"], name="idx_loaivanban_ngay_lap"),
        ]

    def __str__(self):
        return self.ten_loai
