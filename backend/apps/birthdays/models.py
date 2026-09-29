from django.db import models
from django.utils import timezone
from accounts.models import StaffProfile


class BirthdayEmailStatus(models.TextChoices):
    PENDING = "PENDING", "Chờ xử lý"
    PROCESSING = "PROCESSING", "Đang xử lý"
    SUCCESS = "SUCCESS", "Gửi thành công"
    FAILED = "FAILED", "Thất bại"
    UNCERTAIN = "UNCERTAIN", "Cần đối soát trạng thái gửi"
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
    birthday_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name="Năm sinh nhật",
        help_text="Khoá chống gửi trùng trong cùng một năm dương lịch.",
    )
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
    reconciliation_note = models.TextField(
        blank=True,
        default="",
        verbose_name="Bằng chứng đối soát SMTP",
    )
    reconciled_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm đối soát",
    )
    attempt_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name="Mã phiên gửi (attempt_id)",
        help_text="Định danh duy nhất của lượt gửi để ngăn chặn ghi đè khi bản ghi đã được đối soát.",
    )
    worker_pid = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="PID của worker gửi thư",
        help_text="PID của tiến trình đang thực thi gửi email.",
    )
    worker_host = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Tên máy chủ của worker gửi thư",
        help_text="Hostname của máy chủ đang thực thi tiến trình gửi.",
    )

    class Meta:
        verbose_name = "Nhật ký email sinh nhật"
        verbose_name_plural = "Nhật ký email sinh nhật tự động"
        ordering = ["-sent_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "sent_date"],
                name="unique_birthday_email_per_day",
            ),
            models.UniqueConstraint(
                fields=["staff", "birthday_year"],
                name="unique_birthday_email_per_year",
            ),
        ]

    def __str__(self):
        return f"Email sinh nhật: {self.staff.full_name} ({self.sent_date:%d/%m/%Y}) - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        # Historical duplicate audit rows may keep NULL after the forward
        # migration. Every newly created row must carry its period key.
        if self._state.adding and self.birthday_year is None:
            self.birthday_year = self.sent_date.year
        super().save(*args, **kwargs)
