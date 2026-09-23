from django.db import models
from django.utils import timezone
from accounts.models import StaffProfile


class BirthdayWish(models.Model):
    """Mô hình lưu trữ lời chúc và thiệp mừng sinh nhật gửi cho cán bộ nhân viên."""

    staff = models.ForeignKey(
        StaffProfile,
        on_delete=models.CASCADE,
        related_name="birthday_wishes",
        verbose_name="Nhân viên nhận lời chúc",
    )
    sender_name = models.CharField(max_length=150, verbose_name="Người gửi lời chúc")
    message = models.TextField(verbose_name="Nội dung lời chúc mừng")
    card_template = models.CharField(
        max_length=50,
        default="classic",
        verbose_name="Mẫu thiệp chúc mừng",
        help_text="classic, modern, elegant, golden",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian gửi")

    class Meta:
        verbose_name = "Lời chúc sinh nhật"
        verbose_name_plural = "Danh sách lời chúc sinh nhật"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Lời chúc từ {self.sender_name} gửi đến {self.staff.full_name}"


class BirthdayEmailStatus(models.TextChoices):
    PENDING = "PENDING", "Chờ xử lý"
    PROCESSING = "PROCESSING", "Đang xử lý"
    SUCCESS = "SUCCESS", "Gửi thành công"
    FAILED = "FAILED", "Thất bại"
    SKIPPED = "SKIPPED", "Bỏ qua"


class BirthdayEmailLog(models.Model):
    """Nhật ký gửi email chúc mừng sinh nhật tự động định kỳ."""

    staff = models.ForeignKey(
        StaffProfile,
        on_delete=models.CASCADE,
        related_name="birthday_email_logs",
        verbose_name="Nhân viên được chúc mừng",
    )
    sent_date = models.DateField(verbose_name="Ngày sinh nhật ghi nhận")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Thời điểm tạo bản ghi")
    processed_at = models.DateTimeField(default=timezone.now, verbose_name="Thời điểm xử lý gần nhất")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Thời điểm gửi mail thành công")
    recipient_email = models.EmailField(verbose_name="Địa chỉ email người nhận")
    subject = models.CharField(max_length=255, verbose_name="Tiêu đề email")
    card_template = models.CharField(
        max_length=50,
        default="golden",
        verbose_name="Mẫu thiệp gửi kèm",
    )
    status = models.CharField(
        max_length=20,
        choices=BirthdayEmailStatus.choices,
        default=BirthdayEmailStatus.PENDING,
        verbose_name="Trạng thái gửi",
    )
    retry_count = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Số lần thử gửi lại",
    )
    error_message = models.TextField(
        blank=True,
        default="",
        verbose_name="Chi tiết lỗi nếu thất bại",
    )
    skip_reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Lý do bỏ qua nếu có",
    )

    class Meta:
        verbose_name = "Nhật ký email sinh nhật"
        verbose_name_plural = "Nhật ký email sinh nhật tự động"
        ordering = ["-sent_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "sent_date"],
                name="unique_birthday_email_per_day",
            )
        ]

    def __str__(self):
        return f"Email sinh nhật: {self.staff.full_name} ({self.sent_date:%d/%m/%Y}) - {self.get_status_display()}"
