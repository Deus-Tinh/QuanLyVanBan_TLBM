"""
Serializers cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
"""

from django.utils import timezone
from rest_framework import serializers
from meetings.models import PhongHop, DatPhongHop


class PhongHopSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD cho Danh mục phòng họp (PhongHop).
    """

    class Meta:
        model = PhongHop
        fields = [
            "id",
            "ten_phong",
            "vi_tri",
            "suc_chua",
            "thiet_bi",
            "is_public",
            "ghi_chu",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_ten_phong(self, value):
        cleaned_name = value.strip()
        if not cleaned_name:
            raise serializers.ValidationError("Tên phòng họp không được để trống hoặc chỉ chứa khoảng trắng.")

        # Kiểm tra trùng tên phòng họp (không phân biệt chữ hoa/thường)
        qs = PhongHop.objects.filter(ten_phong__iexact=cleaned_name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f"Phòng họp với tên '{cleaned_name}' đã tồn tại trong hệ thống.")

        return cleaned_name

    def validate_suc_chua(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError("Sức chứa phòng họp phải là số nguyên dương lớn hơn hoặc bằng 1.")
        return value


class UserSimpleSerializer(serializers.Serializer):
    """
    Thông tin rút gọn của người dùng/CBNV đặt phòng.
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
        if hasattr(obj, "profile") and getattr(obj.profile, "department", None):
            return obj.profile.department
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


class DatPhongHopSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD & Validation cho Lịch đặt phòng họp (DatPhongHop).
    """
    nguoi_dat_detail = UserSimpleSerializer(source="nguoi_dat", read_only=True)
    phong_hop_detail = PhongHopSerializer(source="phong_hop", read_only=True)

    class Meta:
        model = DatPhongHop
        fields = [
            "id",
            "phong_hop",
            "phong_hop_detail",
            "nguoi_dat",
            "nguoi_dat_detail",
            "don_vi_to_chuc",
            "tieu_de",
            "thoi_gian_bat_dau",
            "thoi_gian_ket_thuc",
            "so_nguoi_tham_gia",
            "trang_thai",
            "ghi_chu",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "nguoi_dat", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("thoi_gian_bat_dau", getattr(self.instance, "thoi_gian_bat_dau", None))
        end = attrs.get("thoi_gian_ket_thuc", getattr(self.instance, "thoi_gian_ket_thuc", None))
        phong = attrs.get("phong_hop", getattr(self.instance, "phong_hop", None))
        status_val = attrs.get("trang_thai", getattr(self.instance, "trang_thai", DatPhongHop.STATUS_DA_DAT))
        so_nguoi = attrs.get("so_nguoi_tham_gia", getattr(self.instance, "so_nguoi_tham_gia", 1))

        if start and end and start >= end:
            raise serializers.ValidationError({
                "thoi_gian_ket_thuc": "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu."
            })

        if so_nguoi is not None and so_nguoi <= 0:
            raise serializers.ValidationError({
                "so_nguoi_tham_gia": "Số người tham gia phải lớn hơn 0."
            })

        if phong and so_nguoi is not None and so_nguoi > phong.suc_chua:
            raise serializers.ValidationError({
                "so_nguoi_tham_gia": f"Số người tham gia ({so_nguoi}) vượt quá sức chứa của phòng '{phong.ten_phong}' ({phong.suc_chua} người)."
            })

        # Kiểm tra trùng lịch đối với lịch có hiệu lực
        if status_val != DatPhongHop.STATUS_DA_HUY and phong and start and end:
            conflicts = DatPhongHop.objects.filter(
                phong_hop=phong,
                thoi_gian_bat_dau__lt=end,
                thoi_gian_ket_thuc__gt=start,
            ).exclude(trang_thai=DatPhongHop.STATUS_DA_HUY)

            if self.instance and self.instance.pk:
                conflicts = conflicts.exclude(pk=self.instance.pk)

            if conflicts.exists():
                conflict = conflicts.first()
                nguoi_dat = conflict.nguoi_dat
                nguoi_dat_name = getattr(nguoi_dat, "ho_ten", None) or nguoi_dat.get_full_name() or nguoi_dat.username

                tz = timezone.get_current_timezone()
                c_start = timezone.localtime(conflict.thoi_gian_bat_dau, tz).strftime("%H:%M")
                c_end = timezone.localtime(conflict.thoi_gian_ket_thuc, tz).strftime("%H:%M ngày %d/%m/%Y")
                raise serializers.ValidationError({
                    "non_field_errors": f"Phòng họp '{phong.ten_phong}' đã có lịch đặt: '{conflict.tieu_de}' ({c_start} - {c_end}) bởi {nguoi_dat_name}. Vui lòng chọn khung giờ khác!"
                })

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data.setdefault("nguoi_dat", request.user)
            # Tự động gán đơn vị tổ chức nếu chưa điền
            if not validated_data.get("don_vi_to_chuc"):
                if hasattr(request.user, "don_vi") and request.user.don_vi:
                    validated_data["don_vi_to_chuc"] = getattr(request.user.don_vi, "ten", str(request.user.don_vi))
                elif hasattr(request.user, "profile") and getattr(request.user.profile, "department", None):
                    validated_data["don_vi_to_chuc"] = request.user.profile.department
        return super().create(validated_data)

