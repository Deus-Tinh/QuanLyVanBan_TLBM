"""
Models cho Module Văn Bản (Đến / Đi / Mật).

Kiến trúc: Dùng 1 model Document duy nhất, phân biệt bằng trường `loai`.
Tránh duplicate code 3 lần giữa 3 loại văn bản.

Lưu ý phụ thuộc liên nhóm:
- ho_so → M2M tới app records (Nhóm 3) — chưa tồn tại, dùng placeholder
- danh_muc → M2M tới app records (Nhóm 3) — chưa tồn tại, dùng placeholder
- don_vi_nhan → M2M tới app organizations (Nhóm 7) — chưa tồn tại, dùng placeholder
- nguoi_nhan → M2M tới auth.User — dùng settings.AUTH_USER_MODEL
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


class Document(models.Model):
    """
    Model chính quản lý cả 3 loại văn bản: Đến, Đi, Mật.
    Phân biệt bởi trường `loai`.
    """

    class LoaiVanBan(models.TextChoices):
        DEN = "DEN", "Văn bản Đến"
        DI = "DI", "Văn bản Đi"
        MAT = "MAT", "Văn bản Mật"

    class HieuLuc(models.TextChoices):
        CON_HIEU_LUC = "CON_HIEU_LUC", "Còn hiệu lực"
        HET_HIEU_LUC = "HET_HIEU_LUC", "Hết hiệu lực"
        HET_VA_THAY_THE = "HET_VA_THAY_THE", "Hết hiệu lực và thay thế"

    # ── Discriminator ──────────────────────────────────────────────
    loai = models.CharField(
        "Loại văn bản",
        max_length=3,
        choices=LoaiVanBan.choices,
        db_index=True,
    )

    # ── Số & Ký hiệu ──────────────────────────────────────────────
    nam = models.PositiveSmallIntegerField(
        "Năm",
        default=timezone.now().year,
        db_index=True,
        help_text="Mặc định năm hiện tại, cho phép sửa.",
    )
    so_hieu = models.CharField(
        "Số, ký hiệu văn bản",
        max_length=255,
    )
    so_thu_tu = models.PositiveIntegerField(
        "Số thứ tự (Số đến / Số đi)",
        null=True,
        blank=True,
        help_text=(
            "Tự động tăng theo năm + loại. "
            "VB Đến = 'Số đến', VB Đi = 'Số'. VB Mật không có trường này."
        ),
    )

    # ── Ngày tháng ─────────────────────────────────────────────────
    ngay_den = models.DateTimeField(
        "Ngày đến",
        null=True,
        blank=True,
        help_text="Chỉ dùng cho VB Đến. Lấy đầy đủ ngày giờ phút giây.",
    )
    ngay_ban_hanh = models.DateTimeField(
        "Ngày ban hành",
        null=True,
        blank=True,
        help_text="Dùng cho VB Đi (bắt buộc) và VB Mật (tuỳ chọn).",
    )
    ngay_van_ban = models.DateTimeField(
        "Ngày văn bản",
        null=True,
        blank=True,
        help_text="Dùng để lọc/sắp xếp danh sách.",
    )

    # ── Nội dung ───────────────────────────────────────────────────
    trich_yeu = models.TextField("Trích yếu nội dung")
    noi_ban_hanh = models.CharField(
        "Nơi ban hành",
        max_length=500,
        blank=True,
        default="",
    )
    nguoi_ky = models.CharField(
        "Người ký",
        max_length=255,
        blank=True,
        default="",
    )
    chuc_vu = models.CharField(
        "Chức vụ người ký",
        max_length=255,
        blank=True,
        default="",
    )

    # ── Hiệu lực ──────────────────────────────────────────────────
    hieu_luc = models.CharField(
        "Hiệu lực",
        max_length=20,
        choices=HieuLuc.choices,
        default=HieuLuc.CON_HIEU_LUC,
        db_index=True,
    )
    ngay_het_hieu_luc = models.DateTimeField(
        "Ngày hết hiệu lực",
        null=True,
        blank=True,
    )
    link_thay_the = models.CharField(
        "Link văn bản thay thế",
        max_length=500,
        blank=True,
        default="",
    )

    # ── Ghi chú & Cờ ──────────────────────────────────────────────
    ghi_chu = models.TextField("Ghi chú", blank=True, default="")
    hien_thi = models.BooleanField(
        "Trạng thái hiển thị",
        default=True,
        help_text="False = ẩn với user thường, admin vẫn thấy (đổi màu).",
    )
    gui_mail_toan_he_thong = models.BooleanField(
        "Gửi mail toàn hệ thống",
        default=False,
    )

    # ── Quan hệ M2M — Phụ thuộc liên nhóm ─────────────────────────
    # TODO: Khi Nhóm 3 (records) tạo model HoSo, thêm:
    #   ho_so = models.ManyToManyField("records.HoSo", blank=True)
    #   danh_muc = models.ManyToManyField("records.LoaiVanBan", blank=True)

    # TODO: Khi Nhóm 7 (organizations) tạo model DonVi, thêm:
    #   don_vi_nhan = models.ManyToManyField("organizations.Organization", blank=True)

    nguoi_nhan = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        verbose_name="Người nhận",
        related_name="received_documents",
        blank=True,
        help_text=(
            "VB Đến/Đi: tham khảo. "
            "VB Mật: quyết định ai được xem (ACL)."
        ),
    )

    # ── Audit ──────────────────────────────────────────────────────
    nguoi_tao = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người tạo",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_documents",
    )
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)
    updated_at = models.DateTimeField("Ngày cập nhật", auto_now=True)

    class Meta:
        verbose_name = "Văn bản"
        verbose_name_plural = "Văn bản"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["loai", "nam"], name="idx_doc_loai_nam"),
            models.Index(fields=["loai", "nam", "so_thu_tu"], name="idx_doc_so_thu_tu"),
            models.Index(fields=["ngay_den"], name="idx_doc_ngay_den"),
            models.Index(fields=["ngay_ban_hanh"], name="idx_doc_ngay_ban_hanh"),
        ]

    def __str__(self):
        label = self.so_hieu or f"#{self.pk}"
        return f"[{self.get_loai_display()}] {label}"

    @property
    def is_expired(self):
        """Kiểm tra văn bản đã hết hiệu lực chưa."""
        return self.hieu_luc != self.HieuLuc.CON_HIEU_LUC


class DocumentAttachment(models.Model):
    """File đính kèm cho văn bản."""

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Văn bản",
    )
    file = models.FileField(
        "File đính kèm",
        upload_to="02_documents/%Y/%m/",
        help_text="Chấp nhận: PDF, DOC, DOCX, JPG, JPEG, PNG. Tối đa 20MB.",
    )
    file_name = models.CharField("Tên file gốc", max_length=255)
    file_size = models.PositiveIntegerField("Kích thước (bytes)", default=0)
    uploaded_at = models.DateTimeField("Ngày upload", auto_now_add=True)

    class Meta:
        verbose_name = "File đính kèm"
        verbose_name_plural = "File đính kèm"
        ordering = ["uploaded_at"]

    def __str__(self):
        return self.file_name


class DocumentViewLog(models.Model):
    """
    Ghi nhận lịch sử người đã xem văn bản.
    Mỗi user chỉ giữ 1 bản ghi mới nhất cho mỗi văn bản (upsert).
    """

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="view_logs",
        verbose_name="Văn bản",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="document_views",
        verbose_name="Người xem",
    )
    viewed_at = models.DateTimeField("Thời gian xem", auto_now=True)

    class Meta:
        verbose_name = "Lịch sử xem"
        verbose_name_plural = "Lịch sử xem"
        # Đảm bảo mỗi user chỉ có 1 bản ghi cho mỗi document
        unique_together = [("document", "user")]
        ordering = ["-viewed_at"]

    def __str__(self):
        return f"{self.user} xem {self.document} lúc {self.viewed_at}"
