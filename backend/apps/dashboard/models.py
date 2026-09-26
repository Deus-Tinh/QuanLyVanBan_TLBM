from django.db import models


class IncomingDocument(models.Model):
    """Văn bản đến — dữ liệu mẫu cho Dashboard Overview."""

    code = models.CharField(max_length=100, verbose_name="Số hiệu văn bản")
    title = models.CharField(max_length=500, verbose_name="Trích yếu nội dung")
    issued_date = models.DateField(verbose_name="Ngày ban hành")
    sender = models.CharField(
        max_length=300, blank=True, default="", verbose_name="Cơ quan ban hành"
    )
    is_confidential = models.BooleanField(default=False, verbose_name="Văn bản mật")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Văn bản đến"
        verbose_name_plural = "Văn bản đến"
        ordering = ["-issued_date", "-created_at"]

    def __str__(self):
        return f"[{self.code}] {self.title}"


class OutgoingDocument(models.Model):
    """Văn bản đi — dữ liệu mẫu cho Dashboard Overview."""

    code = models.CharField(max_length=100, verbose_name="Số hiệu văn bản")
    title = models.CharField(max_length=500, verbose_name="Trích yếu nội dung")
    issued_date = models.DateField(verbose_name="Ngày ban hành")
    recipient = models.CharField(
        max_length=300, blank=True, default="", verbose_name="Nơi nhận"
    )
    is_confidential = models.BooleanField(default=False, verbose_name="Văn bản mật")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Văn bản đi"
        verbose_name_plural = "Văn bản đi"
        ordering = ["-issued_date", "-created_at"]

    def __str__(self):
        return f"[{self.code}] {self.title}"


class MeetingRoom(models.Model):
    """Lịch phòng họp — hiển thị trên Dashboard widget."""

    STATUS_CHOICES = [
        ("upcoming", "Sắp diễn ra"),
        ("ongoing", "Đang diễn ra"),
        ("done", "Đã kết thúc"),
    ]

    room_name = models.CharField(max_length=200, verbose_name="Tên phòng họp")
    meeting_title = models.CharField(max_length=500, verbose_name="Nội dung cuộc họp")
    date = models.DateField(verbose_name="Ngày họp")
    start_time = models.TimeField(verbose_name="Giờ bắt đầu")
    end_time = models.TimeField(verbose_name="Giờ kết thúc")
    organizer = models.CharField(
        max_length=200, blank=True, default="", verbose_name="Chủ trì"
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

    def __str__(self):
        return f"{self.room_name} — {self.meeting_title} ({self.date})"
