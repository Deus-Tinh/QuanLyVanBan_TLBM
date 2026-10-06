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

    name = serializers.CharField(max_length=100, required=False)
    location = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    capacity = serializers.IntegerField(min_value=1, max_value=2147483647, required=False, default=10)
    amenities = serializers.CharField(required=False, allow_blank=True, default="")
    is_public = serializers.BooleanField(required=False, default=True)
    status = serializers.ChoiceField(choices=MeetingRoom.Status.choices, required=False, default=MeetingRoom.Status.AVAILABLE)
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
            "status",
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
                "name": "Tên phòng họp không được để trống.",
                "ten_phong": "Tên phòng họp không được để trống.",
            })

        if name is not None:
            cleaned_name = str(name).strip()
            if not cleaned_name:
                raise serializers.ValidationError({
                    "name": "Tên phòng họp không được để trống.",
                    "ten_phong": "Tên phòng họp không được để trống.",
                })
            qs = MeetingRoom.objects.filter(name__iexact=cleaned_name)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    "name": f"Phòng họp với tên '{cleaned_name}' đã tồn tại trong hệ thống.",
                    "ten_phong": f"Phòng họp với tên '{cleaned_name}' đã tồn tại trong hệ thống.",
                })
            attrs["name"] = cleaned_name

        capacity = attrs.get("capacity")
        if capacity is not None and capacity < 1:
            raise serializers.ValidationError({
                "capacity": "Sức chứa phòng họp phải là số nguyên dương lớn hơn hoặc bằng 1.",
                "suc_chua": "Sức chứa phòng họp phải là số nguyên dương lớn hơn hoặc bằng 1.",
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
        queryset=MeetingRoom.objects.all(), required=False
    )
    title = serializers.CharField(max_length=255, required=False)
    date = serializers.DateField(required=False)
    start_time = serializers.TimeField(required=False)
    end_time = serializers.TimeField(required=False)
    attendees_count = serializers.IntegerField(min_value=1, max_value=2147483647, required=False, default=1)
    purpose = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(choices=MeetingBooking.Status.choices, required=False, default=MeetingBooking.Status.CONFIRMED)
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
    trang_thai = serializers.SerializerMethodField()

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
            "status",
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
            "trang_thai",
            "ghi_chu",
        ]
        read_only_fields = ["id", "organizer", "created_at"]

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
        if "trang_thai" in d and "status" not in d:
            mapping = {
                "da_dat": MeetingBooking.Status.CONFIRMED,
                "da_huy": MeetingBooking.Status.CANCELLED,
                "hoan_thanh": MeetingBooking.Status.COMPLETED,
            }
            st = d.get("trang_thai")
            d["status"] = mapping.get(st, st)

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

                if "date" not in d:
                    d["date"] = s_dt.date().isoformat()
                if "start_time" not in d:
                    d["start_time"] = s_dt.time().strftime("%H:%M:%S")
                if "end_time" not in d:
                    d["end_time"] = e_dt.time().strftime("%H:%M:%S")
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

    def get_trang_thai(self, obj):
        mapping = {
            MeetingBooking.Status.CONFIRMED: "da_dat",
            MeetingBooking.Status.CANCELLED: "da_huy",
            MeetingBooking.Status.COMPLETED: "hoan_thanh",
        }
        return mapping.get(obj.status, obj.status)

    def validate(self, attrs):
        room = attrs.get("room", getattr(self.instance, "room", None))
        booking_date = attrs.get("date", getattr(self.instance, "date", None))
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))
        attendees = attrs.get("attendees_count", getattr(self.instance, "attendees_count", 1))
        status_val = attrs.get("status", getattr(self.instance, "status", MeetingBooking.Status.CONFIRMED))

        if not room and not self.instance:
            raise serializers.ValidationError({
                "room": "Vui lòng chọn phòng họp.",
                "phong_hop": "Vui lòng chọn phòng họp.",
            })

        if not booking_date and not self.instance:
            raise serializers.ValidationError({"date": "Vui lòng chọn ngày họp."})

        if not start_time and not self.instance:
            raise serializers.ValidationError({"start_time": "Vui lòng chọn giờ bắt đầu."})

        if not end_time and not self.instance:
            raise serializers.ValidationError({"end_time": "Vui lòng chọn giờ kết thúc."})

        # Phòng MAINTENANCE hoặc UNAVAILABLE không cho đặt
        if room and room.status in [MeetingRoom.Status.MAINTENANCE, MeetingRoom.Status.UNAVAILABLE]:
            err_msg = f"Phòng họp '{room.name}' đang ở trạng thái {room.get_status_display()}, không thể đặt lịch."
            raise serializers.ValidationError({
                "room": err_msg,
                "phong_hop": err_msg,
            })

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.",
                "thoi_gian_ket_thuc": "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.",
            })

        if attendees is not None and attendees <= 0:
            raise serializers.ValidationError({
                "attendees_count": "Số người tham gia phải lớn hơn 0.",
                "so_nguoi_tham_gia": "Số người tham gia phải lớn hơn 0.",
            })

        if room and attendees is not None and attendees > room.capacity:
            err_msg = f"Số người tham gia ({attendees}) vượt quá sức chứa tối đa của phòng '{room.name}' ({room.capacity} người)."
            raise serializers.ValidationError({
                "attendees_count": err_msg,
                "so_nguoi_tham_gia": err_msg,
            })

        # Kiểm tra chống trùng lịch
        if status_val != MeetingBooking.Status.CANCELLED and room and booking_date and start_time and end_time:
            conflicts = MeetingBooking.objects.filter(
                room=room,
                date=booking_date,
                start_time__lt=end_time,
                end_time__gt=start_time,
            ).exclude(status=MeetingBooking.Status.CANCELLED)

            if self.instance and self.instance.pk:
                conflicts = conflicts.exclude(pk=self.instance.pk)

            if conflicts.exists():
                conflict = conflicts.first()
                organizer = conflict.organizer
                host_name = getattr(organizer, "ho_ten", None) or organizer.get_full_name() or organizer.username
                c_start = conflict.start_time.strftime("%H:%M")
                c_end = conflict.end_time.strftime("%H:%M")
                c_date = conflict.date.strftime("%d/%m/%Y")
                raise serializers.ValidationError({
                    "non_field_errors": f"Phòng họp '{room.name}' đã có lịch đặt: '{conflict.title}' ({c_start} - {c_end} ngày {c_date}) bởi {host_name}. Vui lòng chọn khung giờ khác!"
                })

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data.setdefault("organizer", request.user)
            # Tự động gán phòng ban nếu chưa chọn
            if not validated_data.get("department") and hasattr(request.user, "don_vi"):
                validated_data["department"] = request.user.don_vi
        return super().create(validated_data)


# Aliases cho backward-compatibility
PhongHopSerializer = MeetingRoomSerializer
DatPhongHopSerializer = MeetingBookingSerializer
