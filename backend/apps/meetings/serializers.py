"""
Serializers cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
Chuẩn hóa 100% theo DDL cơ sở dữ liệu release_DDL.sql (SQL_Fix4, Issue #53).
Hỗ trợ cả trường DDL tiếng Anh và bí danh tiếng Việt để tương thích ngược 100% với Frontend và toàn bộ test cũ.
"""

from datetime import datetime, date, time
from django.utils import timezone
from rest_framework import serializers

from meetings.models import MeetingRoom, MeetingBooking
from organizations.models import DonVi


class MeetingRoomSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD cho Danh mục phòng họp (MeetingRoom / meetings_meetingroom).
    """

    name = serializers.CharField(
        max_length=100,
        required=False,
        error_messages={
            "max_length": "meetings.messages.roomNameTooLong",
        },
    )
    location = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        default="",
        error_messages={
            "max_length": "meetings.messages.locationTooLong",
        },
    )
    capacity = serializers.IntegerField(
        min_value=1,
        max_value=2147483647,
        required=False,
        default=10,
        error_messages={
            "invalid": "meetings.messages.capacityMustBeInteger",
            "min_value": "meetings.messages.capacityMustBePositive",
            "max_value": "meetings.messages.capacityTooLarge",
        },
    )
    amenities = serializers.CharField(required=False, allow_blank=True, default="")
    is_public = serializers.BooleanField(required=False)
    trang_thai = serializers.ChoiceField(
        choices=MeetingRoom.Status.choices,
        required=False,
        error_messages={
            "invalid_choice": "meetings.messages.invalidStatus",
        },
    )
    ghi_chu = serializers.CharField(required=False, allow_blank=True, default="")

    # Bí danh tiếng Việt cho Frontend tương thích ngược
    ten_phong = serializers.CharField(source="name", read_only=True)
    vi_tri = serializers.CharField(source="location", read_only=True)
    suc_chua = serializers.IntegerField(source="capacity", read_only=True)
    thiet_bi = serializers.CharField(source="amenities", read_only=True)

    class Meta:
        model = MeetingRoom
        fields = [
            "id",
            "name",
            "location",
            "capacity",
            "amenities",
            "is_public",
            "trang_thai",
            "ghi_chu",
            "created_at",
            "updated_at",
            # Vietnamese aliases
            "ten_phong",
            "vi_tri",
            "suc_chua",
            "thiet_bi",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        if "trang_thai" not in validated_data:
            validated_data["trang_thai"] = MeetingRoom.Status.AVAILABLE
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "trang_thai" not in validated_data:
            validated_data["trang_thai"] = instance.trang_thai
        return super().update(instance, validated_data)

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            d = data.dict()
        elif hasattr(data, "copy"):
            d = data.copy()
        else:
            d = dict(data)

        # Map legacy Vietnamese keys to SQL_Fix4 DDL English keys
        if "ten_phong" in d and "name" not in d:
            d["name"] = d.get("ten_phong")
        if "vi_tri" in d and "location" not in d:
            d["location"] = d.get("vi_tri")
        elif "location" not in d and not self.partial and not self.instance:
            d["location"] = ""
        if "suc_chua" in d and "capacity" not in d:
            d["capacity"] = d.get("suc_chua")
        if "thiet_bi" in d and "amenities" not in d:
            d["amenities"] = d.get("thiet_bi")
        if "trang_thai" not in d:
            if self.instance:
                d["trang_thai"] = self.instance.trang_thai
            elif not self.partial:
                d["trang_thai"] = MeetingRoom.Status.AVAILABLE

        return super().to_internal_value(d)

    @property
    def errors(self):
        errs = dict(super().errors)
        if "name" in errs and "ten_phong" not in errs:
            errs["ten_phong"] = errs["name"]
        if "ten_phong" in errs and "name" not in errs:
            errs["name"] = errs["ten_phong"]
        if "location" in errs and "vi_tri" not in errs:
            errs["vi_tri"] = errs["location"]
        if "capacity" in errs and "suc_chua" not in errs:
            errs["suc_chua"] = errs["capacity"]
        if "suc_chua" in errs and "capacity" not in errs:
            errs["capacity"] = errs["suc_chua"]
        return errs

    def validate(self, attrs):
        name = attrs.get("name")
        if not name and not self.instance:
            raise serializers.ValidationError({
                "name": "meetings.messages.roomNameRequired",
                "ten_phong": "meetings.messages.roomNameRequired",
            })

        if name is not None:
            cleaned_name = str(name).strip()
            if not cleaned_name:
                raise serializers.ValidationError({
                    "name": "meetings.messages.roomNameRequired",
                    "ten_phong": "meetings.messages.roomNameRequired",
                })
            if len(cleaned_name) > 100:
                raise serializers.ValidationError({
                    "name": "meetings.messages.roomNameTooLong",
                    "ten_phong": "meetings.messages.roomNameTooLong",
                })
            qs = MeetingRoom.objects.filter(name__iexact=cleaned_name)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    "name": "meetings.messages.roomNameExists",
                    "ten_phong": "meetings.messages.roomNameExists",
                })
            attrs["name"] = cleaned_name

        capacity = attrs.get("capacity")
        if capacity is not None:
            if capacity < 1:
                raise serializers.ValidationError({
                    "capacity": "meetings.messages.capacityMustBePositive",
                    "suc_chua": "meetings.messages.capacityMustBePositive",
                })
            if capacity > 2147483647:
                raise serializers.ValidationError({
                    "capacity": "meetings.messages.capacityTooLarge",
                    "suc_chua": "meetings.messages.capacityTooLarge",
                })

        return attrs


class UserSimpleSerializer(serializers.Serializer):
    """
    Thông tin rút gọn của người dùng/CBNV đặt phòng (từ accounts.Employee).
    """

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return getattr(obj, "ho_ten", None) or obj.get_full_name() or obj.username

    def get_department(self, obj):
        if hasattr(obj, "don_vi") and obj.don_vi:
            return getattr(obj.don_vi, "ten", str(obj.don_vi))
        return ""

    def get_role(self, obj):
        if hasattr(obj, "chuc_vu") and obj.chuc_vu:
            return getattr(obj.chuc_vu, "name", str(obj.chuc_vu))
        if getattr(obj, "is_superuser", False):
            return "admin"
        if hasattr(obj, "groups"):
            first_group = obj.groups.values_list("name", flat=True).first()
            if first_group:
                return first_group
        return "staff"


class MeetingBookingSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD & Validation cho Lịch đặt phòng họp (MeetingBooking / meetings_meetingbooking).
    """

    room = serializers.PrimaryKeyRelatedField(
        queryset=MeetingRoom.objects.all(),
        required=False,
        error_messages={
            "does_not_exist": "meetings.messages.roomNotFound",
            "incorrect_type": "meetings.messages.invalidRoomId",
        },
    )
    title = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        error_messages={
            "required": "meetings.messages.titleRequired",
            "blank": "meetings.messages.titleRequired",
            "max_length": "meetings.messages.titleTooLong",
        },
    )
    date = serializers.DateField(
        required=False,
        error_messages={
            "invalid": "meetings.messages.invalidDateFormat",
        },
    )
    start_time = serializers.TimeField(required=False)
    end_time = serializers.TimeField(required=False)
    attendees_count = serializers.IntegerField(
        min_value=1,
        max_value=2147483647,
        required=False,
        default=1,
        error_messages={
            "invalid": "meetings.messages.attendeesMustBeInteger",
            "min_value": "meetings.messages.attendeesMustBePositive",
        },
    )
    purpose = serializers.CharField(required=False, allow_blank=True, default="")
    trang_thai = serializers.CharField(read_only=True)
    department = serializers.PrimaryKeyRelatedField(
        queryset=DonVi.objects.all(), required=False, allow_null=True
    )

    # Details
    room_detail = MeetingRoomSerializer(source="room", read_only=True)
    organizer_detail = UserSimpleSerializer(source="organizer", read_only=True)
    phong_hop_detail = MeetingRoomSerializer(source="room", read_only=True)
    nguoi_dat_detail = UserSimpleSerializer(source="organizer", read_only=True)

    # Vietnamese aliases
    phong_hop = serializers.IntegerField(source="room_id", read_only=True)
    nguoi_dat = serializers.IntegerField(source="organizer_id", read_only=True)
    tieu_de = serializers.CharField(source="title", read_only=True)
    so_nguoi_tham_gia = serializers.IntegerField(source="attendees_count", read_only=True)
    ghi_chu = serializers.CharField(source="purpose", read_only=True)
    don_vi_to_chuc = serializers.SerializerMethodField()
    thoi_gian_bat_dau = serializers.SerializerMethodField()
    thoi_gian_ket_thuc = serializers.SerializerMethodField()

    class Meta:
        model = MeetingBooking
        fields = [
            "id",
            "room",
            "room_detail",
            "organizer",
            "organizer_detail",
            "department",
            "title",
            "date",
            "start_time",
            "end_time",
            "attendees_count",
            "purpose",
            "trang_thai",
            "created_at",
            # Backward compatibility fields
            "phong_hop",
            "phong_hop_detail",
            "nguoi_dat",
            "nguoi_dat_detail",
            "tieu_de",
            "don_vi_to_chuc",
            "so_nguoi_tham_gia",
            "thoi_gian_bat_dau",
            "thoi_gian_ket_thuc",
            "ghi_chu",
        ]
        read_only_fields = ["id", "organizer", "trang_thai", "created_at"]

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            d = data.dict()
        elif hasattr(data, "copy"):
            d = data.copy()
        else:
            d = dict(data)

        # Mapping input keys
        if "room_id" in d and "room" not in d:
            d["room"] = d.get("room_id")
        if "phong_hop" in d and "room" not in d:
            d["room"] = d.get("phong_hop")
        if "tieu_de" in d and "title" not in d:
            d["title"] = d.get("tieu_de")
        if "so_nguoi_tham_gia" in d and "attendees_count" not in d:
            d["attendees_count"] = d.get("so_nguoi_tham_gia")
        if "ghi_chu" in d and "purpose" not in d:
            d["purpose"] = d.get("ghi_chu")
        if "trang_thai" in d:
            d.pop("trang_thai")

        # Parse datetime nếu client gửi thoi_gian_bat_dau / thoi_gian_ket_thuc
        if "thoi_gian_bat_dau" in d and "thoi_gian_ket_thuc" in d:
            start_raw = d.get("thoi_gian_bat_dau")
            end_raw = d.get("thoi_gian_ket_thuc")
            try:
                if isinstance(start_raw, str):
                    s_dt = datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
                else:
                    s_dt = start_raw

                if isinstance(end_raw, str):
                    e_dt = datetime.fromisoformat(end_raw.replace("Z", "+00:00"))
                else:
                    e_dt = end_raw

                if timezone.is_aware(s_dt):
                    s_dt = timezone.localtime(s_dt)
                if timezone.is_aware(e_dt):
                    e_dt = timezone.localtime(e_dt)

                if s_dt.date() != e_dt.date():
                    raise serializers.ValidationError({
                        "end_time": "meetings.messages.crossDayNotAllowed",
                        "thoi_gian_ket_thuc": "meetings.messages.crossDayNotAllowed",
                    })

                if "date" not in d:
                    d["date"] = s_dt.date().isoformat()
                if "start_time" not in d:
                    d["start_time"] = s_dt.time().strftime("%H:%M:%S")
                if "end_time" not in d:
                    d["end_time"] = e_dt.time().strftime("%H:%M:%S")
            except serializers.ValidationError:
                raise
            except Exception:
                pass

        return super().to_internal_value(d)

    @property
    def errors(self):
        errs = dict(super().errors)
        if "room" in errs and "phong_hop" not in errs:
            errs["phong_hop"] = errs["room"]
        if "phong_hop" in errs and "room" not in errs:
            errs["room"] = errs["phong_hop"]
        if "title" in errs and "tieu_de" not in errs:
            errs["tieu_de"] = errs["title"]
        if "attendees_count" in errs and "so_nguoi_tham_gia" not in errs:
            errs["so_nguoi_tham_gia"] = errs["attendees_count"]
        if "so_nguoi_tham_gia" in errs and "attendees_count" not in errs:
            errs["attendees_count"] = errs["so_nguoi_tham_gia"]
        if "end_time" in errs and "thoi_gian_ket_thuc" not in errs:
            errs["thoi_gian_ket_thuc"] = errs["end_time"]
        if "start_time" in errs and "thoi_gian_bat_dau" not in errs:
            errs["thoi_gian_bat_dau"] = errs["start_time"]
        return errs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Trạng thái hiển thị động: lịch CONFIRMED đã qua giờ kết thúc trả về COMPLETED
        ret["trang_thai"] = instance.effective_status
        return ret

    def get_don_vi_to_chuc(self, obj):
        if obj.department:
            return obj.department.ten
        return ""

    def get_thoi_gian_bat_dau(self, obj):
        tz = timezone.get_current_timezone()
        dt = datetime.combine(obj.date, obj.start_time)
        return timezone.make_aware(dt, tz).isoformat()

    def get_thoi_gian_ket_thuc(self, obj):
        tz = timezone.get_current_timezone()
        dt = datetime.combine(obj.date, obj.end_time)
        return timezone.make_aware(dt, tz).isoformat()

    def validate(self, attrs):
        room = attrs.get("room", getattr(self.instance, "room", None))
        booking_date = attrs.get("date", getattr(self.instance, "date", None))
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))
        attendees = attrs.get("attendees_count", getattr(self.instance, "attendees_count", 1))
        status_val = attrs.get("trang_thai", getattr(self.instance, "trang_thai", MeetingBooking.Status.CONFIRMED))

        title_val = attrs.get("title")
        if not self.instance and not title_val:
            raise serializers.ValidationError({
                "title": "meetings.messages.titleRequired",
                "tieu_de": "meetings.messages.titleRequired",
            })
        if title_val is not None and not str(title_val).strip():
            raise serializers.ValidationError({
                "title": "meetings.messages.titleRequired",
                "tieu_de": "meetings.messages.titleRequired",
            })

        if not room and not self.instance:
            raise serializers.ValidationError({
                "room": "meetings.messages.roomRequired",
                "phong_hop": "meetings.messages.roomRequired",
            })

        # Chặn đặt phòng nội bộ nếu user không có change_phonghop
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if room and not room.is_public:
            has_perm = user and (user.is_superuser or user.has_perm("change_phonghop"))
            if not has_perm:
                raise serializers.ValidationError({
                    "room": "meetings.messages.privateRoomForbidden",
                    "phong_hop": "meetings.messages.privateRoomForbidden",
                })

        if not booking_date and not self.instance:
            raise serializers.ValidationError({"date": "meetings.messages.dateRequired"})

        if not start_time and not self.instance:
            raise serializers.ValidationError({
                "start_time": "meetings.messages.startTimeRequired",
                "thoi_gian_bat_dau": "meetings.messages.startTimeRequired",
            })

        if not end_time and not self.instance:
            raise serializers.ValidationError({
                "end_time": "meetings.messages.endTimeRequired",
                "thoi_gian_ket_thuc": "meetings.messages.endTimeRequired",
            })

        # Chặn đặt lịch trong quá khứ hoặc dời lịch về quá khứ
        now_local = timezone.localtime(timezone.now())
        if booking_date and start_time:
            booking_start_dt = datetime.combine(booking_date, start_time)
            tz = timezone.get_current_timezone()
            if timezone.is_naive(booking_start_dt):
                booking_start_dt = timezone.make_aware(booking_start_dt, tz)
            else:
                booking_start_dt = timezone.localtime(booking_start_dt)

            is_creating = not self.instance
            is_rescheduling = bool(
                self.instance
                and (
                    attrs.get("date", self.instance.date) != self.instance.date
                    or attrs.get("start_time", self.instance.start_time) != self.instance.start_time
                )
            )
            if (is_creating or is_rescheduling) and booking_start_dt < now_local:
                raise serializers.ValidationError({
                    "start_time": "meetings.messages.bookingInPast",
                    "thoi_gian_bat_dau": "meetings.messages.bookingInPast",
                    "non_field_errors": "meetings.messages.bookingInPast",
                })

        # Phòng MAINTENANCE hoặc UNAVAILABLE không cho đặt
        if room and room.trang_thai in [MeetingRoom.Status.MAINTENANCE, MeetingRoom.Status.UNAVAILABLE]:
            raise serializers.ValidationError({
                "room": "meetings.messages.roomUnavailable",
                "phong_hop": "meetings.messages.roomUnavailable",
            })

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": "meetings.messages.invalidTimeRange",
                "thoi_gian_ket_thuc": "meetings.messages.invalidTimeRange",
            })

        if attendees is not None and attendees <= 0:
            raise serializers.ValidationError({
                "attendees_count": "meetings.messages.attendeesRequired",
                "so_nguoi_tham_gia": "meetings.messages.attendeesRequired",
            })

        if room and attendees is not None and attendees > room.capacity:
            raise serializers.ValidationError({
                "attendees_count": "meetings.messages.capacityExceeded",
                "so_nguoi_tham_gia": "meetings.messages.capacityExceeded",
            })

        # Kiểm tra chống trùng lịch
        if status_val != MeetingBooking.Status.CANCELLED and room and booking_date and start_time and end_time:
            conflicts = MeetingBooking.objects.filter(
                room=room,
                date=booking_date,
                start_time__lt=end_time,
                end_time__gt=start_time,
            ).exclude(trang_thai=MeetingBooking.Status.CANCELLED)

            if self.instance and self.instance.pk:
                conflicts = conflicts.exclude(pk=self.instance.pk)

            if conflicts.exists():
                raise serializers.ValidationError({
                    "non_field_errors": "meetings.messages.roomTimeConflict",
                })

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data.setdefault("organizer", request.user)
            # Tự động gán phòng ban nếu chưa chọn
            if not validated_data.get("department") and hasattr(request.user, "don_vi"):
                validated_data["department"] = request.user.don_vi
        validated_data["trang_thai"] = MeetingBooking.Status.CONFIRMED
        return super().create(validated_data)


# Aliases cho backward-compatibility
PhongHopSerializer = MeetingRoomSerializer
DatPhongHopSerializer = MeetingBookingSerializer
