"""
Models cho Module Văn Bản (Đến / Đi / Mật) — Kiến trúc 3 Model theo chuẩn CSDL QLVB&TL.

Kiến trúc:
1. VanBanDen  (db_table: 'documents_vanbanden')   — Văn bản Đến
2. VanBanDi   (db_table: 'documents_vanbandi')    — Văn bản Đi
3. VanBanMat  (db_table: 'documents_vanbanmat')   — Văn bản Mật
Cả 3 model kế thừa từ abstract model BaseVanBan chứa các trường chung, tránh trùng lặp mã.

Tệp đính kèm (Attachment - Hướng A: 7 trường):
- VanBanDenAttachment  (db_table: 'documents_vanbanden_attachment')
- VanBanDiAttachment   (db_table: 'documents_vanbandi_attachment')
- VanBanMatAttachment  (db_table: 'documents_vanbanmat_attachment')

Lịch sử người xem (View Log):
- DocumentViewLog      (db_table: 'documents_view_log')

Đồng thời cung cấp Facade / Helper `Document` và `DocumentAttachment` để đảm bảo tương thích ngược
hoàn toàn với các endpoint API chung và code hiện hữu.
"""

import os
from django.conf import settings
from django.db import models
from django.utils import timezone


# ═══════════════════════════════════════════════════════════════════
# ENUM & Choices
# ═══════════════════════════════════════════════════════════════════

class LoaiVanBan(models.TextChoices):
    DEN = "DEN", "Văn bản Đến"
    DI = "DI", "Văn bản Đi"
    MAT = "MAT", "Văn bản Mật"


class HieuLuc(models.TextChoices):
    CON_HIEU_LUC = "CON_HIEU_LUC", "Còn hiệu lực"
    CON_HIEU_LUC_1_PHAN = "CON_HIEU_LUC_1_PHAN", "Còn hiệu lực 1 phần"
    HET_HIEU_LUC = "HET_HIEU_LUC", "Hết hiệu lực"
    HET_VA_THAY_THE = "HET_VA_THAY_THE", "Hết hiệu lực và thay thế"


# ═══════════════════════════════════════════════════════════════════
# Abstract Base Model
# ═══════════════════════════════════════════════════════════════════

class BaseVanBan(models.Model):
    """
    Model cơ sở trừu tượng chứa các trường dùng chung cho cả 3 phân hệ văn bản:
    Đến, Đi, Mật.
    """

    HieuLuc = HieuLuc
    LoaiVanBan = LoaiVanBan

    # ── Năm & Ký hiệu ──────────────────────────────────────────────
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

    # ── Nội dung & Ngày ─────────────────────────────────────────────
    trich_yeu = models.TextField("Trích yếu nội dung")
    ngay_van_ban = models.DateTimeField(
        "Ngày văn bản",
        null=True,
        blank=True,
        help_text="Dùng để lọc/sắp xếp danh sách.",
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

    # ── Ghi chú & Cờ hệ thống ──────────────────────────────────────
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

    # ── Audit ──────────────────────────────────────────────────────
    nguoi_tao = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người tạo",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="nguoi_tao",
        related_name="%(class)s_created",
    )
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)
    updated_at = models.DateTimeField("Ngày cập nhật", auto_now=True)

    class Meta:
        abstract = True

    @property
    def is_expired(self):
        """Kiểm tra văn bản đã hết hiệu lực chưa."""
        return self.hieu_luc in (self.HieuLuc.HET_HIEU_LUC, self.HieuLuc.HET_VA_THAY_THE)

    @property
    def view_logs(self):
        """Lấy danh sách log người xem tương ứng."""
        return DocumentViewLog.objects.filter(
            document_type=self.document_kind,
            document_id=self.pk,
        ).order_by("-viewed_at")


# ═══════════════════════════════════════════════════════════════════
# 1. Văn bản Đến (documents_vanbanden)
# ═══════════════════════════════════════════════════════════════════

class VanBanDen(BaseVanBan):
    """
    Model quản lý Văn bản Đến — Nghị định 30/2020/NĐ-CP.
    Khớp 100% với bảng vật lý `documents_vanbanden`.
    """

    loai = "DEN"
    document_kind = "vanbanden"

    so_thu_tu = models.PositiveIntegerField(
        "Số đến",
        null=True,
        blank=True,
        help_text="Tự động tăng theo năm (Số đến).",
    )
    ngay_den = models.DateTimeField(
        "Ngày đến",
        null=True,
        blank=True,
        default=timezone.now,
        help_text="Lấy đầy đủ ngày giờ phút giây.",
    )
    noi_ban_hanh = models.CharField(
        "Nơi ban hành",
        max_length=500,
        blank=True,
        default="",
    )
    nguoi_nhan = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        verbose_name="Người nhận",
        related_name="vanbanden_received",
        blank=True,
        db_table="documents_vanbanden_nguoinhan",
        help_text="Cán bộ nhân viên nhận văn bản đến.",
    )

    class Meta:
        db_table = "documents_vanbanden"
        verbose_name = "Văn bản Đến"
        verbose_name_plural = "Văn bản Đến"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["nam", "so_thu_tu"], name="idx_vbden_nam_stt"),
            models.Index(fields=["ngay_den"], name="idx_vbden_ngay_den"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["nam", "so_thu_tu"], name="uq_vanbanden_nam_stt")
        ]

    def get_loai_display(self):
        return "Văn bản Đến"

    def __str__(self):
        label = self.so_hieu or f"#{self.pk}"
        return f"[Văn bản Đến] {label}"


# ═══════════════════════════════════════════════════════════════════
# 2. Văn bản Đi (documents_vanbandi)
# ═══════════════════════════════════════════════════════════════════

class VanBanDi(BaseVanBan):
    """
    Model quản lý Văn bản Đi — Nghị định 30/2020/NĐ-CP.
    Khớp 100% với bảng vật lý `documents_vanbandi`.
    """

    loai = "DI"
    document_kind = "vanbandi"

    so_thu_tu = models.PositiveIntegerField(
        "Số đi",
        null=True,
        blank=True,
        help_text="Tự động tăng theo năm (Số đi).",
    )
    ngay_ban_hanh = models.DateTimeField(
        "Ngày ban hành",
        null=True,
        blank=True,
        default=timezone.now,
        help_text="Ngày ban hành cho Văn bản Đi.",
    )
    nguoi_nhan = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        verbose_name="Người nhận",
        related_name="vanbandi_received",
        blank=True,
        db_table="documents_vanbandi_nguoinhan",
        help_text="Cán bộ nhân viên nhận văn bản đi.",
    )

    @property
    def noi_ban_hanh(self):
        return getattr(self, "_noi_ban_hanh", "") or "Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC)"

    @noi_ban_hanh.setter
    def noi_ban_hanh(self, val):
        self._noi_ban_hanh = val

    def save(self, *args, **kwargs):
        if not self.ngay_van_ban:
            self.ngay_van_ban = self.ngay_ban_hanh or timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "documents_vanbandi"
        verbose_name = "Văn bản Đi"
        verbose_name_plural = "Văn bản Đi"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["nam", "so_thu_tu"], name="idx_vbdi_nam_stt"),
            models.Index(fields=["ngay_ban_hanh"], name="idx_vbdi_ngay_ban_hanh"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["nam", "so_thu_tu"], name="uq_vanbandi_nam_stt")
        ]

    def get_loai_display(self):
        return "Văn bản Đi"

    def __str__(self):
        label = self.so_hieu or f"#{self.pk}"
        return f"[Văn bản Đi] {label}"


# ═══════════════════════════════════════════════════════════════════
# 3. Văn bản Mật (documents_vanbanmat)
# ═══════════════════════════════════════════════════════════════════

class VanBanMat(BaseVanBan):
    """
    Model quản lý Văn bản Mật.
    Khớp 100% với bảng vật lý `documents_vanbanmat`.
    Lưu ý: VB Mật KHÔNG CÓ trường `so_thu_tu`.
    """

    loai = "MAT"
    document_kind = "vanbanmat"
    so_thu_tu = None

    ngay_ban_hanh = models.DateTimeField(
        "Ngày ban hành",
        null=True,
        blank=True,
        help_text="Ngày ban hành cho Văn bản Mật (tuỳ chọn).",
    )
    nguoi_nhan = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        verbose_name="Người nhận",
        related_name="vanbanmat_received",
        blank=True,
        db_table="documents_vanbanmat_nguoinhan",
        help_text="VB Mật: Quyết định ai được xem (Access Control List).",
    )

    @property
    def noi_ban_hanh(self):
        return getattr(self, "_noi_ban_hanh", "") or ""

    @noi_ban_hanh.setter
    def noi_ban_hanh(self, val):
        self._noi_ban_hanh = val

    class Meta:
        db_table = "documents_vanbanmat"
        verbose_name = "Văn bản Mật"
        verbose_name_plural = "Văn bản Mật"
        ordering = ["-created_at"]

    def get_loai_display(self):
        return "Văn bản Mật"

    def __str__(self):
        label = self.so_hieu or f"#{self.pk}"
        return f"[Văn bản Mật] {label}"


# ═══════════════════════════════════════════════════════════════════
# Attachment Models (Hướng A: 7 trường chuẩn hóa)
# ═══════════════════════════════════════════════════════════════════

def document_attachment_path(instance, filename):
    """
    Xác định đường dẫn lưu file đính kèm theo từng phân hệ:
    02_documents/<loai>/<nam>/<thang>/<ngay>/<filename>
    """
    doc = getattr(instance, "document", None)
    subfolder = "den"
    date_val = None
    year = None

    if doc:
        loai = getattr(doc, "loai", "DEN")
        loai_map = {"DEN": "den", "DI": "di", "MAT": "mat"}
        subfolder = loai_map.get(loai, "den")
        year = getattr(doc, "nam", timezone.now().year)
        if loai == "DEN":
            date_val = getattr(doc, "ngay_den", None) or getattr(doc, "ngay_van_ban", None)
        elif loai in ("DI", "MAT"):
            date_val = getattr(doc, "ngay_ban_hanh", None) or getattr(doc, "ngay_van_ban", None)

    if not date_val:
        date_val = timezone.now()
    if not year:
        year = date_val.year

    return f"02_documents/{subfolder}/{year}/{date_val.month:02d}/{date_val.day:02d}/{filename}"


class BaseDocumentAttachment(models.Model):
    """Abstract model chứa 7 trường chuẩn Hướng A cho tệp đính kèm."""

    name = models.CharField("Tên gốc file", max_length=255)
    file = models.FileField(
        "File đính kèm",
        upload_to=document_attachment_path,
        db_column="path",
        max_length=500,
        null=True,
        blank=True,
        help_text="Chấp nhận: PDF, DOC, DOCX, JPG, JPEG, PNG. Tối đa 20MB.",
    )
    is_deleted = models.BooleanField("Cờ xóa mềm", default=False)
    created_time = models.DateTimeField("Ngày upload", default=timezone.now)
    created_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người tải lên",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="created_user_id",
        related_name="%(class)s_uploaded",
    )

    class Meta:
        abstract = True
        ordering = ["created_time"]

    def __init__(self, *args, **kwargs):
        path_val = kwargs.pop("path", None)
        file_size_val = kwargs.pop("file_size", None)
        file_name_val = kwargs.pop("file_name", None)
        super().__init__(*args, **kwargs)
        if path_val and not self.file:
            self.file = path_val
        if file_size_val:
            self._file_size = file_size_val
        if file_name_val and not self.name:
            self.name = file_name_val

    @property
    def path(self):
        return self.file.name if self.file else ""

    @path.setter
    def path(self, val):
        self.file = val

    @property
    def file_size(self):
        try:
            return self.file.size if self.file else (getattr(self, "_file_size", 0) or 0)
        except Exception:
            return getattr(self, "_file_size", 0) or 0

    @file_size.setter
    def file_size(self, val):
        self._file_size = val

    @property
    def file_name(self):
        return self.name

    @property
    def uploaded_at(self):
        return self.created_time

    def save(self, *args, **kwargs):
        if self.file and not self.name:
            self.name = os.path.basename(self.file.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name or f"Attachment #{self.pk}"


class VanBanDenAttachment(BaseDocumentAttachment):
    document = models.ForeignKey(
        VanBanDen,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Văn bản đến",
    )

    class Meta:
        db_table = "documents_vanbanden_attachment"
        verbose_name = "Tệp đính kèm VB Đến"
        verbose_name_plural = "Tệp đính kèm VB Đến"
        ordering = ["created_time"]


class VanBanDiAttachment(BaseDocumentAttachment):
    document = models.ForeignKey(
        VanBanDi,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Văn bản đi",
    )

    class Meta:
        db_table = "documents_vanbandi_attachment"
        verbose_name = "Tệp đính kèm VB Đi"
        verbose_name_plural = "Tệp đính kèm VB Đi"
        ordering = ["created_time"]


class VanBanMatAttachment(BaseDocumentAttachment):
    document = models.ForeignKey(
        VanBanMat,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Văn bản mật",
    )

    class Meta:
        db_table = "documents_vanbanmat_attachment"
        verbose_name = "Tệp đính kèm VB Mật"
        verbose_name_plural = "Tệp đính kèm VB Mật"
        ordering = ["created_time"]


# ═══════════════════════════════════════════════════════════════════
# DocumentViewLog (documents_view_log)
# ═══════════════════════════════════════════════════════════════════

class DocumentViewLog(models.Model):
    """
    Ghi nhận lịch sử người đã xem văn bản.
    Khớp 100% với bảng `documents_view_log` (document_type, document_id, user_id, viewed_at).
    """

    class DocumentKind(models.TextChoices):
        VANBANDEN = "vanbanden", "Văn bản Đến"
        VANBANDI = "vanbandi", "Văn bản Đi"
        VANBANMAT = "vanbanmat", "Văn bản Mật"

    document_type = models.CharField(
        "Loại văn bản",
        max_length=20,
        choices=DocumentKind.choices,
        default=DocumentKind.VANBANDEN,
    )
    document_id = models.PositiveBigIntegerField("ID văn bản")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="document_views",
        verbose_name="Người xem",
    )
    viewed_at = models.DateTimeField("Thời gian xem", auto_now=True)

    class Meta:
        db_table = "documents_view_log"
        verbose_name = "Lịch sử xem văn bản"
        verbose_name_plural = "Lịch sử xem văn bản"
        unique_together = [("document_type", "document_id", "user")]
        ordering = ["-viewed_at"]

    def __str__(self):
        return f"{self.user} xem {self.document_type}#{self.document_id} lúc {self.viewed_at}"


# ═══════════════════════════════════════════════════════════════════
# Helper Functions & Backward-Compatibility Facade
# ═══════════════════════════════════════════════════════════════════

def get_document_model(loai: str):
    """Trả về Model Class tương ứng với loại văn bản."""
    loai_str = str(loai).strip().upper()
    if loai_str in ("DI", "VANBANDI"):
        return VanBanDi
    if loai_str in ("MAT", "VANBANMAT"):
        return VanBanMat
    return VanBanDen


def get_attachment_model(loai_or_doc):
    """Trả về Attachment Model tương ứng."""
    if isinstance(loai_or_doc, VanBanDen) or getattr(loai_or_doc, "loai", "") == "DEN":
        return VanBanDenAttachment
    if isinstance(loai_or_doc, VanBanDi) or getattr(loai_or_doc, "loai", "") == "DI":
        return VanBanDiAttachment
    if isinstance(loai_or_doc, VanBanMat) or getattr(loai_or_doc, "loai", "") == "MAT":
        return VanBanMatAttachment
    loai_str = str(loai_or_doc).strip().upper()
    if loai_str in ("DI", "VANBANDI"):
        return VanBanDiAttachment
    if loai_str in ("MAT", "VANBANMAT"):
        return VanBanMatAttachment
    return VanBanDenAttachment


class DocumentManager:
    """Manager giả lập cho facade Document phục vụ tương thích ngược."""

    def create(self, **kwargs):
        loai = kwargs.pop("loai", "DEN")
        model = get_document_model(loai)
        # Bỏ qua so_thu_tu nếu là MAT
        if str(loai).upper() in ("MAT", "VANBANMAT") and "so_thu_tu" in kwargs:
            kwargs.pop("so_thu_tu", None)
        return model.objects.create(**kwargs)

    def filter(self, *args, **kwargs):
        loai = kwargs.pop("loai", None)
        if loai:
            model = get_document_model(loai)
            return model.objects.filter(*args, **kwargs)
        # Mặc định kết hợp hoặc trả về VanBanDen
        return VanBanDen.objects.filter(*args, **kwargs)

    def get(self, *args, **kwargs):
        loai = kwargs.pop("loai", None)
        if loai:
            return get_document_model(loai).objects.get(*args, **kwargs)
        for model in (VanBanDen, VanBanDi, VanBanMat):
            try:
                return model.objects.get(*args, **kwargs)
            except model.DoesNotExist:
                continue
        raise VanBanDen.DoesNotExist(f"Document with kwargs {kwargs} does not exist.")

    def all(self):
        return VanBanDen.objects.all()

    def count(self):
        return (
            VanBanDen.objects.count()
            + VanBanDi.objects.count()
            + VanBanMat.objects.count()
        )


class DocumentFacade:
    """
    Facade class tương thích ngược cho `Document`.
    Cho phép gọi: Document.objects.create(loai="DEN", ...), Document.HieuLuc, Document.LoaiVanBan
    """

    HieuLuc = HieuLuc
    LoaiVanBan = LoaiVanBan
    objects = DocumentManager()

    DoesNotExist = VanBanDen.DoesNotExist


Document = DocumentFacade


class DocumentAttachmentFacade:
    """Facade tương thích ngược cho DocumentAttachment."""

    class Manager:
        def create(self, **kwargs):
            doc = kwargs.get("document")
            att_model = get_attachment_model(doc)
            # Chuyển đổi file_name -> name nếu truyền theo cú pháp cũ
            if "file_name" in kwargs and "name" not in kwargs:
                kwargs["name"] = kwargs.pop("file_name")
            return att_model.objects.create(**kwargs)

        def filter(self, *args, **kwargs):
            return VanBanDenAttachment.objects.filter(*args, **kwargs)

        def all(self):
            return VanBanDenAttachment.objects.all()

    objects = Manager()


DocumentAttachment = DocumentAttachmentFacade
