from django.conf import settings
from django.db import models
from django.db.models import Q

from . import enums

User = settings.AUTH_USER_MODEL


def sha256_or_null(field):
    """CHECK: giá trị rỗng (NULL) hoặc SHA-256 hex 64 ký tự thường."""
    return Q(**{f"{field}__isnull": True}) | Q(**{f"{field}__regex": r"^[0-9a-f]{64}$"})


# ─────────────────────────────────────────────────────────────────────────────
# Phase 2 — model chỉ phụ thuộc người dùng
# ─────────────────────────────────────────────────────────────────────────────


class SigningKey(models.Model):
    """Khóa công khai Ed25519 của người dùng. Backend không lưu khóa bí mật."""

    nguoi_so_huu = models.ForeignKey(User, on_delete=models.PROTECT, related_name="signing_keys")
    ma_khoa = models.CharField(max_length=100, unique=True)
    dau_van_tay = models.CharField(max_length=64, unique=True)
    thuat_toan = models.CharField(max_length=50, default="Ed25519")
    khoa_cong_khai = models.TextField()
    trang_thai = models.CharField(
        max_length=20, choices=enums.TrangThaiKhoa.choices, default=enums.TrangThaiKhoa.CHO_KICH_HOAT
    )
    thoi_diem_xac_minh_so_huu = models.DateTimeField(null=True, blank=True)
    thoi_diem_kich_hoat = models.DateTimeField(null=True, blank=True)
    ngay_hieu_luc = models.DateTimeField()
    ngay_het_han = models.DateTimeField(null=True, blank=True)
    ngay_thu_hoi = models.DateTimeField(null=True, blank=True)
    khoa_thay_the = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    ghi_chu = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "signing_key"
        constraints = [
            models.UniqueConstraint(
                fields=["nguoi_so_huu"],
                condition=Q(trang_thai=enums.TrangThaiKhoa.HOAT_DONG),
                name="uq_signing_key_mot_khoa_hoat_dong",
            ),
            models.CheckConstraint(
                condition=~Q(trang_thai=enums.TrangThaiKhoa.HOAT_DONG)
                | Q(thoi_diem_xac_minh_so_huu__isnull=False),
                name="chk_signing_key_hoat_dong_da_xac_minh",
            ),
        ]

    def __str__(self):
        return f"{self.ma_khoa} ({self.trang_thai})"


class SigningProcess(models.Model):
    ma_quy_trinh = models.CharField(max_length=50)
    ten_quy_trinh = models.CharField(max_length=255)
    mo_ta = models.TextField(blank=True, default="")
    phien_ban = models.PositiveSmallIntegerField(default=1)
    trang_thai = models.CharField(
        max_length=20, choices=enums.TrangThaiQuyTrinh.choices, default=enums.TrangThaiQuyTrinh.NHAP
    )
    pham_vi = models.CharField(max_length=20, choices=enums.PhamViQuyTrinh.choices)
    kieu_ky_mac_dinh = models.CharField(max_length=20, choices=enums.KieuKy.choices)
    cau_hinh_nhac_han = models.JSONField(null=True, blank=True)
    create_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    update_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    update_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "signing_process"
        constraints = [
            models.UniqueConstraint(fields=["ma_quy_trinh", "phien_ban"], name="uq_signing_process_ma_phien_ban"),
        ]

    def __str__(self):
        return f"{self.ma_quy_trinh} v{self.phien_ban}"


class SigningProcessStep(models.Model):
    quy_trinh = models.ForeignKey(SigningProcess, on_delete=models.CASCADE, related_name="cap_ky_set")
    cap_ky = models.PositiveSmallIntegerField()
    ten_cap_ky = models.CharField(max_length=255)
    thu_tu = models.PositiveSmallIntegerField()
    # Chờ Nhóm 7 (organizations_donvi): đổi sang ForeignKey khi bảng có trên staging.
    don_vi_id = models.BigIntegerField(null=True, blank=True)
    so_gio_xu_ly = models.PositiveIntegerField(null=True, blank=True)
    dang_ap_dung = models.BooleanField(default=True)
    ghi_chu = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "signing_process_step"
        ordering = ["thu_tu"]
        constraints = [
            models.UniqueConstraint(fields=["quy_trinh", "thu_tu"], name="uq_signing_process_step_thu_tu"),
        ]

    def __str__(self):
        return f"{self.quy_trinh_id}/{self.thu_tu} {self.ten_cap_ky}"
