"""
Models cho phân hệ Phòng họp (Issue #22 - Nhóm 7).

Giai đoạn 1 (Đợt 1): Quản lý danh mục phòng họp (PhongHop).
Giai đoạn 3 (Đợt 3): Đặt lịch & Khóa khung giờ (DatPhongHop) sẽ được tích hợp
sau khi phân hệ Cán bộ Nhân viên (Issue #24 - Khánh) hoàn tất.
"""

from django.core.validators import MinValueValidator
from django.db import models


class PhongHop(models.Model):
    """
    Model đại diện cho danh mục phòng họp của cơ quan / đơn vị.
    """
    ten_phong = models.CharField(
        max_length=150,
        unique=True,
        db_index=True,
        verbose_name="Tên phòng họp",
        help_text="Tên nhận diện phòng họp (duy nhất)",
    )
    vi_tri = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Vị trí phòng",
        help_text="Tầng, tòa nhà hoặc khu vực",
    )
    suc_chua = models.PositiveIntegerField(
        default=10,
        validators=[MinValueValidator(1, message="Sức chứa phòng họp phải từ 1 người trở lên.")],
        verbose_name="Sức chứa (người)",
        help_text="Số lượng người tham gia tối đa",
    )
    thiet_bi = models.TextField(
        blank=True,
        default="",
        verbose_name="Trang thiết bị",
        help_text="Mô tả thiết bị có sẵn (Máy chiếu, Micro, Hội nghị truyền hình...)",
    )
    is_public = models.BooleanField(
        default=True,
        verbose_name="Hiển thị công khai",
        help_text="Trạng thái phòng có đang sẵn sàng sử dụng hay không",
    )
    ghi_chu = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tạo",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Cập nhật lần cuối",
    )

    class Meta:
        db_table = "meetings_phonghop"
        verbose_name = "Phòng họp"
        verbose_name_plural = "Danh mục phòng họp"
        ordering = ["ten_phong"]

    def __str__(self):
        return f"{self.ten_phong} ({self.suc_chua} chỗ)"
