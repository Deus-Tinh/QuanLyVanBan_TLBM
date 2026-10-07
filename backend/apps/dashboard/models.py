from django.db import models
from django.utils import timezone


class IncomingDocument(models.Model):
    """
    Văn bản đến — Đồng bộ chuẩn DDL documents_vanbanden (Lê Thanh Hậu & Nhóm 2).
    Các trường vật lý tương ứng 1:1 với cấu trúc DDL v0:
    so_hieu, trich_yeu, ngay_den, noi_ban_hanh, pham_vi ('NOI_BO' | 'HAN_CHE').
    """

    class PhamVi(models.TextChoices):
        NOI_BO = "NOI_BO", "Nội bộ"
        HAN_CHE = "HAN_CHE", "Hạn chế"

    nam = models.PositiveSmallIntegerField(
        default=2026,
        verbose_name="Năm",
    )
    so_hieu = models.CharField(
        max_length=255,
        default="",
        verbose_name="Số, ký hiệu văn bản (so_hieu)",
    )
    trich_yeu = models.TextField(
        default="",
        verbose_name="Trích yếu nội dung (trich_yeu)",
    )
    ngay_den = models.DateField(
        default=timezone.localdate,
        verbose_name="Ngày đến (ngay_den)",
    )
    noi_ban_hanh = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Nơi ban hành (noi_ban_hanh)",
    )
    nguoi_ky = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Người ký (nguoi_ky)",
    )
    chuc_vu = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Chức vụ (chuc_vu)",
    )
    pham_vi = models.CharField(
        max_length=20,
        choices=PhamVi.choices,
        default=PhamVi.NOI_BO,
        verbose_name="Phạm vi văn bản (pham_vi)",
        help_text="NOI_BO: Văn bản nội bộ | HAN_CHE: Văn bản phạm vi hạn chế",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Văn bản đến"
        verbose_name_plural = "Văn bản đến"
        ordering = ["-ngay_den", "-created_at"]

    def __init__(self, *args, **kwargs):
        # Hỗ trợ tương thích ngược cho kwargs legacy
        if "code" in kwargs and "so_hieu" not in kwargs:
            kwargs["so_hieu"] = kwargs.pop("code")
        if "title" in kwargs and "trich_yeu" not in kwargs:
            kwargs["trich_yeu"] = kwargs.pop("title")
        if "sender" in kwargs and "noi_ban_hanh" not in kwargs:
            kwargs["noi_ban_hanh"] = kwargs.pop("sender")
        if "issued_date" in kwargs and "ngay_den" not in kwargs:
            kwargs["ngay_den"] = kwargs.pop("issued_date")
        if "is_confidential" in kwargs and "pham_vi" not in kwargs:
            kwargs["pham_vi"] = self.PhamVi.HAN_CHE if kwargs.pop("is_confidential") else self.PhamVi.NOI_BO
        super().__init__(*args, **kwargs)

    def __str__(self):
        return f"[{self.so_hieu}] {self.trich_yeu}"

    # Properties mapping ngược sang biến cũ
    @property
    def code(self):
        return self.so_hieu

    @property
    def title(self):
        return self.trich_yeu

    @property
    def sender(self):
        return self.noi_ban_hanh

    @property
    def issued_date(self):
        return self.ngay_den

    @property
    def is_confidential(self):
        return self.pham_vi == self.PhamVi.HAN_CHE


class OutgoingDocument(models.Model):
    """
    Văn bản đi — Đồng bộ chuẩn DDL documents_vanbandi (Lê Thanh Hậu & Nhóm 2).
    Các trường vật lý tương ứng 1:1 với cấu trúc DDL v0:
    so_hieu, trich_yeu, ngay_ban_hanh, noi_ban_hanh, pham_vi ('NOI_BO' | 'HAN_CHE').
    """

    class PhamVi(models.TextChoices):
        NOI_BO = "NOI_BO", "Nội bộ"
        HAN_CHE = "HAN_CHE", "Hạn chế"

    nam = models.PositiveSmallIntegerField(
        default=2026,
        verbose_name="Năm",
    )
    so_hieu = models.CharField(
        max_length=255,
        default="",
        verbose_name="Số, ký hiệu văn bản (so_hieu)",
    )
    trich_yeu = models.TextField(
        default="",
        verbose_name="Trích yếu nội dung (trich_yeu)",
    )
    ngay_ban_hanh = models.DateField(
        default=timezone.localdate,
        verbose_name="Ngày ban hành (ngay_ban_hanh)",
    )
    noi_ban_hanh = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Nơi nhận / ban hành (noi_ban_hanh)",
    )
    nguoi_ky = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Người ký (nguoi_ky)",
    )
    chuc_vu = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Chức vụ (chuc_vu)",
    )
    pham_vi = models.CharField(
        max_length=20,
        choices=PhamVi.choices,
        default=PhamVi.NOI_BO,
        verbose_name="Phạm vi văn bản (pham_vi)",
        help_text="NOI_BO: Văn bản nội bộ | HAN_CHE: Văn bản phạm vi hạn chế",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Văn bản đi"
        verbose_name_plural = "Văn bản đi"
        ordering = ["-ngay_ban_hanh", "-created_at"]

    def __init__(self, *args, **kwargs):
        # Hỗ trợ tương thích ngược cho kwargs legacy
        if "code" in kwargs and "so_hieu" not in kwargs:
            kwargs["so_hieu"] = kwargs.pop("code")
        if "title" in kwargs and "trich_yeu" not in kwargs:
            kwargs["trich_yeu"] = kwargs.pop("title")
        if "recipient" in kwargs and "noi_ban_hanh" not in kwargs:
            kwargs["noi_ban_hanh"] = kwargs.pop("recipient")
        if "sender" in kwargs and "noi_ban_hanh" not in kwargs:
            kwargs["noi_ban_hanh"] = kwargs.pop("sender")
        if "issued_date" in kwargs and "ngay_ban_hanh" not in kwargs:
            kwargs["ngay_ban_hanh"] = kwargs.pop("issued_date")
        if "is_confidential" in kwargs and "pham_vi" not in kwargs:
            kwargs["pham_vi"] = self.PhamVi.HAN_CHE if kwargs.pop("is_confidential") else self.PhamVi.NOI_BO
        super().__init__(*args, **kwargs)

    def __str__(self):
        return f"[{self.so_hieu}] {self.trich_yeu}"

    # Properties mapping ngược sang biến cũ
    @property
    def code(self):
        return self.so_hieu

    @property
    def title(self):
        return self.trich_yeu

    @property
    def recipient(self):
        return self.noi_ban_hanh

    @property
    def issued_date(self):
        return self.ngay_ban_hanh

    @property
    def is_confidential(self):
        return self.pham_vi == self.PhamVi.HAN_CHE


class MeetingRoom(models.Model):
    """
    Lịch phòng họp — Đồng bộ chuẩn DDL meetings_meetingroom & meetings_meetingbooking (Nhóm 7).
    Trường 'name' tương ứng với meetings_meetingroom.name.
    Trường 'title' tương ứng với meetings_meetingbooking.title.
    """

    STATUS_CHOICES = [
        ("upcoming", "Sắp diễn ra"),
        ("ongoing", "Đang diễn ra"),
        ("done", "Đã kết thúc"),
    ]

    name = models.CharField(
        max_length=200,
        default="",
        verbose_name="Tên phòng họp (name)",
    )
    title = models.CharField(
        max_length=500,
        default="",
        verbose_name="Nội dung cuộc họp (title)",
    )
    date = models.DateField(
        default=timezone.localdate,
        verbose_name="Ngày họp (date)",
    )
    start_time = models.TimeField(
        default="08:00",
        verbose_name="Giờ bắt đầu (start_time)",
    )
    end_time = models.TimeField(
        default="09:00",
        verbose_name="Giờ kết thúc (end_time)",
    )
    organizer = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Chủ trì cuộc họp (organizer)",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="upcoming",
        verbose_name="Trạng thái",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Phòng họp / Lịch họp"
        verbose_name_plural = "Phòng họp / Lịch họp"
        ordering = ["date", "start_time"]

    def __init__(self, *args, **kwargs):
        if "room_name" in kwargs and "name" not in kwargs:
            kwargs["name"] = kwargs.pop("room_name")
        if "meeting_title" in kwargs and "title" not in kwargs:
            kwargs["title"] = kwargs.pop("meeting_title")
        super().__init__(*args, **kwargs)

    def __str__(self):
        return f"{self.name} — {self.title} ({self.date})"

    @property
    def room_name(self):
        return self.name

    @property
    def meeting_title(self):
        return self.title
