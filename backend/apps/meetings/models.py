"""
Models cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
Chuẩn hóa 100% theo DDL cơ sở dữ liệu release_DDL.sql (SQL_Fix4, Issue #53).

- MeetingRoom (bảng meetings_meetingroom): Danh mục phòng họp.
- MeetingBooking (bảng meetings_meetingbooking): Lịch đặt phòng họp & giữ chỗ.
"""

from datetime import datetime
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class MeetingRoomQuerySet(models.QuerySet):
    def _translate_filter_kwargs(self, kwargs):
        mapping = {
            "ten_phong": "name",
            "vi_tri": "location",
            "suc_chua": "capacity",
            "thiet_bi": "amenities",
        }
        new_kwargs = {}
        for k, v in kwargs.items():
            translated = False
            for old_p, new_p in mapping.items():
                if k == old_p:
                    new_kwargs[new_p] = v
                    translated = True
                    break
                elif k.startswith(f"{old_p}__"):
                    new_kwargs[k.replace(old_p, new_p, 1)] = v
                    translated = True
                    break
            if not translated:
                new_kwargs[k] = v
        return new_kwargs

    def filter(self, *args, **kwargs):
        return super().filter(*args, **self._translate_filter_kwargs(kwargs))

    def exclude(self, *args, **kwargs):
        return super().exclude(*args, **self._translate_filter_kwargs(kwargs))


class MeetingBookingQuerySet(models.QuerySet):
    def _translate_filter_kwargs(self, kwargs):
        mapping = {
            "phong_hop": "room",
            "phong_hop_id": "room_id",
            "nguoi_dat": "organizer",
            "nguoi_dat_id": "organizer_id",
            "tieu_de": "title",
            "so_nguoi_tham_gia": "attendees_count",
            "ghi_chu": "purpose",
            "trang_thai": "status",
        }
        new_kwargs = {}
        for k, v in kwargs.items():
            translated = False
            for old_p, new_p in mapping.items():
                if k == old_p:
                    new_kwargs[new_p] = v
                    translated = True
                    break
                elif k.startswith(f"{old_p}__"):
                    new_kwargs[k.replace(old_p, new_p, 1)] = v
                    translated = True
                    break
            if not translated:
                new_kwargs[k] = v
        return new_kwargs

    def filter(self, *args, **kwargs):
        return super().filter(*args, **self._translate_filter_kwargs(kwargs))

    def exclude(self, *args, **kwargs):
        return super().exclude(*args, **self._translate_filter_kwargs(kwargs))


class MeetingRoom(models.Model):
    """
    Model đại diện cho danh mục phòng họp — bảng meetings_meetingroom theo SQL_Fix4.
    """

    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Sẵn sàng"
        MAINTENANCE = "MAINTENANCE", "Bảo trì"
        UNAVAILABLE = "UNAVAILABLE", "Không khả dụng"

    objects = MeetingRoomQuerySet.as_manager()

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Tên phòng họp",
        help_text="Tên nhận diện phòng họp (duy nhất)",
    )
    location = models.CharField(
        max_length=200,
        verbose_name="Vị trí",
        help_text="Tầng, tòa nhà hoặc khu vực",
    )
    capacity = models.PositiveIntegerField(
        default=10,
        validators=[MinValueValidator(1, message="Sức chứa phòng họp phải từ 1 người trở lên.")],
        verbose_name="Sức chứa (người)",
        help_text="Số lượng người tham gia tối đa",
    )
    amenities = models.TextField(
        blank=True,
        default="",
        verbose_name="Trang thiết bị",
        help_text="Mô tả thiết bị có sẵn (Máy chiếu, Micro, Hội nghị truyền hình...)",
    )
    is_public = models.BooleanField(
        default=True,
        verbose_name="Hiển thị công khai",
        help_text="Hiển thị công khai cho CBNV đặt (nếu False chỉ Admin/Lễ tân thấy)",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
        verbose_name="Trạng thái phòng",
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
        db_table = "meetings_meetingroom"
        verbose_name = "Phòng họp"
        verbose_name_plural = "Danh mục phòng họp"
        ordering = ["name", "id"]
        default_permissions = ()
        permissions = [
            ("view_schedule_phonghop", "Xem lịch phòng họp"),
            ("add_phonghop", "Thêm phòng họp"),
            ("change_phonghop", "Sửa phòng họp"),
            ("delete_phonghop", "Xóa phòng họp"),
        ]

    def __init__(self, *args, **kwargs):
        # Hỗ trợ backward compatibility kwargs cũ
        if "ten_phong" in kwargs and "name" not in kwargs:
            kwargs["name"] = kwargs.pop("ten_phong")
        if "vi_tri" in kwargs and "location" not in kwargs:
            kwargs["location"] = kwargs.pop("vi_tri")
        if "suc_chua" in kwargs and "capacity" not in kwargs:
            kwargs["capacity"] = kwargs.pop("suc_chua")
        if "thiet_bi" in kwargs and "amenities" not in kwargs:
            kwargs["amenities"] = kwargs.pop("thiet_bi")
        super().__init__(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.capacity} chỗ)"

    def clean(self):
        if self.capacity is not None and self.capacity <= 0:
            raise ValidationError({"capacity": "Sức chứa phòng họp phải lớn hơn 0."})

    # ── Backward compatibility properties ─────────────────────────────────
    @property
    def ten_phong(self):
        return self.name

    @ten_phong.setter
    def ten_phong(self, val):
        self.name = val

    @property
    def vi_tri(self):
        return self.location

    @vi_tri.setter
    def vi_tri(self, val):
        self.location = val

    @property
    def suc_chua(self):
        return self.capacity

    @suc_chua.setter
    def suc_chua(self, val):
        self.capacity = val

    @property
    def thiet_bi(self):
        return self.amenities

    @thiet_bi.setter
    def thiet_bi(self, val):
        self.amenities = val


class MeetingBooking(models.Model):
    """
    Lịch đặt phòng họp & giữ chỗ khung giờ — bảng meetings_meetingbooking theo SQL_Fix4.
    """

    class Status(models.TextChoices):
        CONFIRMED = "CONFIRMED", "Đã xác nhận"
        CANCELLED = "CANCELLED", "Đã hủy"
        COMPLETED = "COMPLETED", "Đã hoàn thành"

    objects = MeetingBookingQuerySet.as_manager()

    STATUS_DA_DAT = "CONFIRMED"
    STATUS_DA_HUY = "CANCELLED"
    STATUS_HOAN_THANH = "COMPLETED"

    STATUS_CHOICES = Status.choices

    room = models.ForeignKey(
        MeetingRoom,
        on_delete=models.RESTRICT,
        related_name="bookings",
        verbose_name="Phòng họp",
    )
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="meeting_bookings",
        verbose_name="Người đặt",
    )
    department = models.ForeignKey(
        "organizations.DonVi",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="meeting_bookings",
        verbose_name="Đơn vị tổ chức",
    )
    title = models.CharField(
        max_length=255,
        verbose_name="Tiêu đề cuộc họp / Nội dung",
    )
    date = models.DateField(
        verbose_name="Ngày họp",
        db_index=True,
    )
    start_time = models.TimeField(
        verbose_name="Giờ bắt đầu",
    )
    end_time = models.TimeField(
        verbose_name="Giờ kết thúc",
    )
    attendees_count = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1, message="Số người tham gia phải lớn hơn 0.")],
        verbose_name="Số người tham gia",
    )
    purpose = models.TextField(
        blank=True,
        default="",
        verbose_name="Mục đích cuộc họp / Ghi chú",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CONFIRMED,
        verbose_name="Trạng thái",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày tạo",
    )

    class Meta:
        db_table = "meetings_meetingbooking"
        verbose_name = "Lịch đặt phòng họp"
        verbose_name_plural = "Danh sách đặt phòng họp"
        ordering = ["-date", "-start_time", "-id"]
        indexes = [
            models.Index(fields=["room", "date"], name="idx_booking_room_date"),
        ]
        default_permissions = ()
        permissions = [
            ("add_datphonghop", "Đặt phòng họp"),
            ("change_own_datphonghop", "Sửa/Hủy lịch do chính mình đặt"),
            ("change_any_datphonghop", "Sửa/Hủy mọi lịch đặt phòng (QT)"),
        ]

    def __init__(self, *args, **kwargs):
        if "phong_hop" in kwargs and "room" not in kwargs:
            kwargs["room"] = kwargs.pop("phong_hop")
        if "phong_hop_id" in kwargs and "room_id" not in kwargs:
            kwargs["room_id"] = kwargs.pop("phong_hop_id")
        if "nguoi_dat" in kwargs and "organizer" not in kwargs:
            kwargs["organizer"] = kwargs.pop("nguoi_dat")
        if "nguoi_dat_id" in kwargs and "organizer_id" not in kwargs:
            kwargs["organizer_id"] = kwargs.pop("nguoi_dat_id")
        if "tieu_de" in kwargs and "title" not in kwargs:
            kwargs["title"] = kwargs.pop("tieu_de")
        if "so_nguoi_tham_gia" in kwargs and "attendees_count" not in kwargs:
            kwargs["attendees_count"] = kwargs.pop("so_nguoi_tham_gia")
        if "ghi_chu" in kwargs and "purpose" not in kwargs:
            kwargs["purpose"] = kwargs.pop("ghi_chu")
        if "trang_thai" in kwargs and "status" not in kwargs:
            tt = kwargs.pop("trang_thai")
            mapping = {
                "da_dat": self.Status.CONFIRMED,
                "da_huy": self.Status.CANCELLED,
                "hoan_thanh": self.Status.COMPLETED,
            }
            kwargs["status"] = mapping.get(tt, tt)
        if "thoi_gian_bat_dau" in kwargs:
            dt_start = kwargs.pop("thoi_gian_bat_dau")
            if hasattr(dt_start, "date"):
                if timezone.is_aware(dt_start):
                    dt_start = timezone.localtime(dt_start)
                if "date" not in kwargs:
                    kwargs["date"] = dt_start.date()
                if "start_time" not in kwargs:
                    kwargs["start_time"] = dt_start.time()
        if "thoi_gian_ket_thuc" in kwargs:
            dt_end = kwargs.pop("thoi_gian_ket_thuc")
            if hasattr(dt_end, "time"):
                if timezone.is_aware(dt_end):
                    dt_end = timezone.localtime(dt_end)
                if "end_time" not in kwargs:
                    kwargs["end_time"] = dt_end.time()
        if "don_vi_to_chuc" in kwargs:
            kwargs.pop("don_vi_to_chuc")
        super().__init__(*args, **kwargs)

    def __str__(self):
        return f"[{self.room.name}] {self.title} ({self.date:%d/%m/%Y} {self.start_time:%H:%M} - {self.end_time:%H:%M})"

    # ── Backward compatibility properties ─────────────────────────────────
    @property
    def effective_status(self):
        """
        Tính trạng thái hiển thị động:
        Nếu lịch CONFIRMED nhưng thời điểm kết thúc đã qua thì hiển thị COMPLETED.
        """
        if self.status == self.Status.CONFIRMED and self.date and self.end_time:
            now_local = timezone.localtime(timezone.now())
            today = now_local.date()
            now_time = now_local.time()
            if self.date < today or (self.date == today and self.end_time <= now_time):
                return self.Status.COMPLETED
        return self.status

    @property
    def phong_hop(self):
        return self.room

    @phong_hop.setter
    def phong_hop(self, val):
        self.room = val

    @property
    def phong_hop_id(self):
        return self.room_id

    @phong_hop_id.setter
    def phong_hop_id(self, val):
        self.room_id = val

    @property
    def nguoi_dat(self):
        return self.organizer

    @nguoi_dat.setter
    def nguoi_dat(self, val):
        self.organizer = val

    @property
    def nguoi_dat_id(self):
        return self.organizer_id

    @nguoi_dat_id.setter
    def nguoi_dat_id(self, val):
        self.organizer_id = val

    @property
    def don_vi_to_chuc(self):
        return self.department.ten if self.department else ""

    @property
    def tieu_de(self):
        return self.title

    @tieu_de.setter
    def tieu_de(self, val):
        self.title = val

    @property
    def so_nguoi_tham_gia(self):
        return self.attendees_count

    @so_nguoi_tham_gia.setter
    def so_nguoi_tham_gia(self, val):
        self.attendees_count = val

    @property
    def ghi_chu(self):
        return self.purpose

    @ghi_chu.setter
    def ghi_chu(self, val):
        self.purpose = val

    @property
    def trang_thai(self):
        class StatusProxy(str):
            def __eq__(self, other):
                if super().__eq__(other):
                    return True
                mapping = {
                    "CONFIRMED": ["da_dat", "CONFIRMED"],
                    "CANCELLED": ["da_huy", "CANCELLED"],
                    "COMPLETED": ["hoan_thanh", "COMPLETED"],
                }
                return other in mapping.get(self, [])
        return StatusProxy(self.effective_status)

    @trang_thai.setter
    def trang_thai(self, val):
        mapping = {
            "da_dat": self.Status.CONFIRMED,
            "da_huy": self.Status.CANCELLED,
            "hoan_thanh": self.Status.COMPLETED,
        }
        self.status = mapping.get(val, val)

    @property
    def thoi_gian_bat_dau(self):
        tz = timezone.get_current_timezone()
        dt = datetime.combine(self.date, self.start_time)
        return timezone.make_aware(dt, tz) if timezone.is_naive(dt) else dt

    @property
    def thoi_gian_ket_thuc(self):
        tz = timezone.get_current_timezone()
        dt = datetime.combine(self.date, self.end_time)
        return timezone.make_aware(dt, tz) if timezone.is_naive(dt) else dt

    def clean(self):
        super().clean()
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError({
                    "end_time": "Giờ kết thúc phải diễn ra sau giờ bắt đầu."
                })

        if self.attendees_count is not None and self.attendees_count <= 0:
            raise ValidationError({
                "attendees_count": "Số người tham gia phải lớn hơn 0."
            })

        # Kiểm tra trạng thái phòng họp: MAINTENANCE hoặc UNAVAILABLE không cho đặt
        room = getattr(self, "room", None)
        if room:
            if room.status in [MeetingRoom.Status.MAINTENANCE, MeetingRoom.Status.UNAVAILABLE]:
                raise ValidationError({
                    "room": f"Phòng họp '{room.name}' đang ở trạng thái {room.get_status_display()}, không thể đặt lịch."
                })
            if self.attendees_count and self.attendees_count > room.capacity:
                raise ValidationError({
                    "attendees_count": f"Số người tham gia ({self.attendees_count}) vượt quá sức chứa tối đa của phòng ({room.capacity})."
                })

        # Kiểm tra trùng lịch đối với lịch có hiệu lực (khác CANCELLED)
        if self.status != self.Status.CANCELLED and self.room_id and self.date and self.start_time and self.end_time:
            conflicts = MeetingBooking.objects.filter(
                room_id=self.room_id,
                date=self.date,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            ).exclude(status=self.Status.CANCELLED)

            if self.pk:
                conflicts = conflicts.exclude(pk=self.pk)

            if conflicts.exists():
                conflict = conflicts.first()
                organizer = conflict.organizer
                host_name = getattr(organizer, "ho_ten", None) or organizer.get_full_name() or organizer.username
                c_start = conflict.start_time.strftime("%H:%M")
                c_end = conflict.end_time.strftime("%H:%M")
                c_date = conflict.date.strftime("%d/%m/%Y")
                raise ValidationError({
                    "non_field_errors": f"Khung giờ này đã bị trùng với cuộc họp '{conflict.title}' ({c_start} - {c_end} ngày {c_date}) bởi {host_name}."
                })


# Aliases cho backward-compatibility
PhongHop = MeetingRoom
DatPhongHop = MeetingBooking
