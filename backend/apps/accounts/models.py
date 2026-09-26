from django.db import models
from django.contrib.auth.models import User


class StaffProfile(models.Model):
    """
    Mở rộng User mặc định của Django để lưu thông tin CBNV ITC.
    Mỗi User Django tương ứng đúng 1 StaffProfile (OneToOne).
    """

    ROLE_CHOICES = [
        ("admin", "Quản trị viên"),
        ("staff", "Cán bộ chuyên viên"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name="Tài khoản",
    )
    full_name = models.CharField(
        max_length=150,
        verbose_name="Họ và tên đầy đủ",
    )
    department = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Đơn vị / Phòng ban",
    )
    position = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Chức vụ",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="staff",
        verbose_name="Quyền hạn",
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="Số điện thoại",
    )
    avatar_url = models.URLField(
        blank=True,
        default="",
        verbose_name="URL ảnh đại diện",
    )
    birthday = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày sinh",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lần cuối")

    class Meta:
        verbose_name = "Hồ sơ CBNV"
        verbose_name_plural = "Hồ sơ CBNV"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.user.username}) — {self.get_role_display()}"
