from django.core.validators import RegexValidator
from django.db import models
from django.contrib.auth.models import User, Group

# Regex kiểm tra số điện thoại Việt Nam chuẩn
vietnam_phone_regex = RegexValidator(
    regex=r"^(0|\+84)[1-9][0-9]{7,9}$",
    message="Số điện thoại không hợp lệ. Vui lòng nhập định dạng Việt Nam hợp lệ (ví dụ: 0912345678 hoặc 0281234567).",
)


class Position(models.Model):
    """
    Danh mục Chức vụ (Bảng accounts_position theo CSDL QLVB&TL).
    """

    name = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Tên chức vụ",
        help_text="Bắt buộc, ví dụ: Tổng Giám đốc, Trưởng phòng, Chuyên viên...",
    )
    display_order = models.PositiveIntegerField(
        unique=True,
        verbose_name="STT ưu tiên hiển thị",
        help_text="Số nguyên dương duy nhất, sắp xếp từ nhỏ đến lớn.",
    )
    is_public = models.BooleanField(
        default=True,
        verbose_name="Hiển thị công khai (isPublic)",
    )
    note = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lần cuối")

    class Meta:
      db_table = "accounts_position"
      verbose_name = "Chức vụ"
      verbose_name_plural = "Danh mục Chức vụ"
      ordering = ["display_order", "name", "id"]

    def __str__(self):
      return self.name

    @classmethod
    def get_next_display_order(cls) -> int:
      latest = cls.objects.order_by("-display_order").first()
      return (latest.display_order + 1) if latest else 1


class StaffProfile(models.Model):
    """
    Hồ sơ Cán bộ Nhân viên (CBNV - Module 7.1 / Issue #24).
    Mở rộng từ User mặc định của Django, liên kết với Đơn vị, Chức vụ và Nhóm quyền.
    """

    ROLE_CHOICES = [
        ("admin", "Quản trị viên"),
        ("staff", "Cán bộ chuyên viên"),
    ]

    STATUS_CHOICES = [
        ("dang_lam_viec", "Đang làm việc"),
        ("nghi_viec", "Nghỉ việc"),
        ("LAM_VIEC", "Đang làm việc"),
        ("NGHI_VIEC", "Nghỉ việc"),
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
    birthday = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày sinh",
        help_text="Ngày tháng năm sinh của nhân viên. Ẩn năm sinh với user thường.",
    )
    don_vi = models.ForeignKey(
        "organizations.DonVi",
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name="employees",
        verbose_name="Đơn vị / Phòng ban",
    )
    chuc_vu = models.ForeignKey(
        Position,
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name="employees",
        verbose_name="Chức vụ",
    )
    chuc_danh = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Chức danh tự do",
        help_text="Chức danh chuyên môn (ví dụ: Chuyên viên chính, Kế toán viên...)",
    )
    nhom_quyen = models.ManyToManyField(
        Group,
        blank=True,
        related_name="cbnv_profiles",
        verbose_name="Nhóm quyền RBAC",
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        default="",
        validators=[vietnam_phone_regex],
        verbose_name="Số điện thoại",
    )
    trang_thai = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="dang_lam_viec",
        verbose_name="Trạng thái làm việc",
    )
    is_public = models.BooleanField(
        default=True,
        verbose_name="Hiển thị công khai",
    )
    ghi_chu = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú",
    )
    avatar_url = models.URLField(
        blank=True,
        default="",
        verbose_name="URL ảnh đại diện",
    )

    # Các trường kế thừa giữ tính tương thích ngược với API cũ
    department = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Tên Đơn vị (Legacy string)",
    )
    position = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Tên Chức vụ (Legacy string)",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="staff",
        verbose_name="Quyền hạn (Legacy)",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lần cuối")

    class Meta:
      db_table = "accounts_staffprofile"
      verbose_name = "Hồ sơ CBNV"
      verbose_name_plural = "Hồ sơ CBNV"
      ordering = [
          "don_vi__stt_uu_tien",
          "chuc_vu__display_order",
          "full_name",
          "id",
      ]
      permissions = [
          ("view_sensitive_cbnv", "Can view sensitive CBNV fields"),
          ("import_cbnv", "Can import CBNV from file"),
          ("approve_password_reset_cbnv", "Can approve CBNV password reset"),
      ]

    def __str__(self):
      don_vi_name = self.don_vi.ten if self.don_vi else self.department or "—"
      chuc_vu_name = self.chuc_vu.name if self.chuc_vu else self.position or "—"
      return f"{self.full_name} ({chuc_vu_name} - {don_vi_name})"

    def save(self, *args, **kwargs):
      # Đồng bộ tên đơn vị / chức vụ legacy string
      if self.don_vi:
        self.department = self.don_vi.ten
      if self.chuc_vu:
        self.position = self.chuc_vu.name

      if self.trang_thai in ("nghi_viec", "NGHI_VIEC"):
        self.trang_thai = "nghi_viec"
        if self.user.is_active:
          self.user.is_active = False
          self.user.save(update_fields=["is_active"])
      elif self.trang_thai in ("dang_lam_viec", "LAM_VIEC"):
        self.trang_thai = "dang_lam_viec"
        if not self.user.is_active:
          self.user.is_active = True
          self.user.save(update_fields=["is_active"])

      super().save(*args, **kwargs)
