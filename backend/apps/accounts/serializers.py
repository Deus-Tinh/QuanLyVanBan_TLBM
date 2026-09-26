"""
Serializers cho phân hệ Quản lý Cán bộ Nhân viên (CBNV - Issue #24).
Tác giả: Lê Duy Khánh (leduykhanhdevs).
"""
import secrets
import string
from django.db import transaction
from django.contrib.auth.models import User, Group
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from organizations.models import DonVi
from .models import Position, StaffProfile, vietnam_phone_regex


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer xác thực payload đổi mật khẩu."""

    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
        help_text="Mật khẩu hiện tại",
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
        help_text="Mật khẩu mới (tối thiểu 8 ký tự)",
    )


class PositionSerializer(serializers.ModelSerializer):
    """Serializer danh mục Chức vụ (accounts_position)."""

    class Meta:
        model = Position
        fields = [
            "id",
            "name",
            "display_order",
            "is_public",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Tên chức vụ không được để trống.")
        return trimmed


class GroupSimpleSerializer(serializers.ModelSerializer):
    """Serializer nhóm quyền RBAC."""

    class Meta:
        model = Group
        fields = ["id", "name"]


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị danh sách và chi tiết Cán bộ Nhân viên (CBNV).
    Tự động che giấu năm sinh và nhóm quyền nếu user hiện tại thiếu quyền view_sensitive_cbnv.
    """

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    ho_ten = serializers.CharField(source="full_name", read_only=True)

    don_vi_id = serializers.IntegerField(source="don_vi.id", read_only=True, allow_null=True)
    don_vi_ten = serializers.SerializerMethodField()
    khoi_ten = serializers.SerializerMethodField()

    chuc_vu_id = serializers.IntegerField(source="chuc_vu.id", read_only=True, allow_null=True)
    chuc_vu_ten = serializers.SerializerMethodField()

    sdt = serializers.CharField(source="phone", read_only=True)
    ngay_sinh = serializers.SerializerMethodField()
    is_birthday_masked = serializers.SerializerMethodField()

    nhom_quyen = serializers.SerializerMethodField()
    trang_thai_display = serializers.CharField(source="get_trang_thai_display", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    has_sensitive_permission = serializers.SerializerMethodField()
    temporary_password = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "ho_ten",
            "full_name",
            "ngay_sinh",
            "birthday",
            "is_birthday_masked",
            "don_vi_id",
            "don_vi_ten",
            "khoi_ten",
            "chuc_vu_id",
            "chuc_vu_ten",
            "chuc_danh",
            "sdt",
            "phone",
            "avatar_url",
            "trang_thai",
            "trang_thai_display",
            "is_active",
            "is_public",
            "ghi_chu",
            "nhom_quyen",
            "has_sensitive_permission",
            "temporary_password",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_temporary_password(self, obj):
        return getattr(obj, "raw_temporary_password", None)

    def _user_has_sensitive_perm(self) -> bool:
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        return request.user.has_perm("accounts.view_sensitive_cbnv")

    def get_has_sensitive_permission(self, obj) -> bool:
        return self._user_has_sensitive_perm()

    def get_don_vi_ten(self, obj) -> str:
        if obj.don_vi:
            return obj.don_vi.ten
        return obj.department or "—"

    def get_khoi_ten(self, obj) -> str:
        if obj.don_vi and obj.don_vi.khoi:
            return obj.don_vi.khoi.ten
        return ""

    def get_chuc_vu_ten(self, obj) -> str:
        if obj.chuc_vu:
            return obj.chuc_vu.name
        return obj.position or "—"

    def get_ngay_sinh(self, obj):
        if not obj.birthday:
            return None
        # Nếu có quyền xem dữ liệu nhạy cảm -> trả về ngày đầy đủ YYYY-MM-DD
        if self._user_has_sensitive_perm():
            return obj.birthday.isoformat()
        # Nếu không có quyền -> chỉ trả về ngày/tháng và ẩn năm (DD/MM/----)
        return obj.birthday.strftime("%d/%m/----")

    def get_is_birthday_masked(self, obj) -> bool:
        if not obj.birthday:
            return False
        return not self._user_has_sensitive_perm()

    def get_nhom_quyen(self, obj):
        # Ẩn danh sách nhóm quyền nếu không có quyền xem thông tin nhạy cảm
        if not self._user_has_sensitive_perm():
            return []
        return [
            {"id": g.id, "name": g.name} for g in obj.nhom_quyen.all()
        ]


class EmployeeCreateSerializer(serializers.Serializer):
    """
    Serializer thêm mới Cán bộ Nhân viên kèm tài khoản User.
    Bảo đảm không lưu mật khẩu thô và trả về mật khẩu tạm duy nhất một lần.
    """

    ho_ten = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(
        max_length=128, required=False, allow_blank=True, write_only=True
    )
    ngay_sinh = serializers.DateField(required=True)
    don_vi_id = serializers.PrimaryKeyRelatedField(
        queryset=DonVi.objects.all(), required=False, allow_null=True
    )
    chuc_vu_id = serializers.PrimaryKeyRelatedField(
        queryset=Position.objects.all(), required=False, allow_null=True
    )
    chuc_danh = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    sdt = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default="", validators=[vietnam_phone_regex]
    )
    nhom_quyen_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), required=False
    )
    trang_thai = serializers.ChoiceField(
        choices=StaffProfile.STATUS_CHOICES, default="dang_lam_viec"
    )
    is_public = serializers.BooleanField(default=True)
    ghi_chu = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_ho_ten(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Họ và tên nhân viên không được để trống.")
        return trimmed

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(f"Địa chỉ email '{normalized}' đã tồn tại trong hệ thống.")
        return normalized

    def validate_username(self, value):
        if value:
            trimmed = value.strip()
            if User.objects.filter(username__iexact=trimmed).exists():
                raise serializers.ValidationError(f"Tên đăng nhập '{trimmed}' đã tồn tại trong hệ thống.")
            return trimmed
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        ho_ten = validated_data["ho_ten"]
        username = validated_data.get("username")
        if not username:
            # Tự động lấy phần local-part của email
            local_part = email.split("@")[0]
            candidate = local_part
            idx = 1
            while User.objects.filter(username__iexact=candidate).exists():
                candidate = f"{local_part}{idx}"
                idx += 1
            username = candidate

        raw_password = validated_data.get("password")
        is_temporary_pwd = False
        if not raw_password:
            # Sinh mật khẩu ngẫu nhiên an toàn 10 ký tự gồm chữ hoa, thường và số
            alphabet = string.ascii_letters + string.digits
            raw_password = "".join(secrets.choice(alphabet) for _ in range(10))
            is_temporary_pwd = True

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=raw_password,
                first_name=ho_ten.split(" ")[-1] if " " in ho_ten else ho_ten,
                last_name=" ".join(ho_ten.split(" ")[:-1]) if " " in ho_ten else "",
                is_active=(validated_data.get("trang_thai") != "nghi_viec"),
            )

            profile, _ = StaffProfile.objects.get_or_create(user=user)
            profile.full_name = ho_ten
            profile.birthday = validated_data["ngay_sinh"]
            profile.don_vi = validated_data.get("don_vi_id")
            profile.chuc_vu = validated_data.get("chuc_vu_id")
            profile.chuc_danh = validated_data.get("chuc_danh", "")
            profile.phone = validated_data.get("sdt", "")
            profile.trang_thai = validated_data.get("trang_thai", "dang_lam_viec")
            profile.is_public = validated_data.get("is_public", True)
            profile.ghi_chu = validated_data.get("ghi_chu", "")
            profile.save()

            groups = validated_data.get("nhom_quyen_ids")
            if groups:
                profile.nhom_quyen.set(groups)
                user.groups.set(groups)

            profile.raw_temporary_password = raw_password
            profile.is_temporary_password = is_temporary_pwd
            return profile


class EmployeeUpdateSerializer(serializers.Serializer):
    """Serializer cập nhật thông tin Cán bộ Nhân viên."""

    ho_ten = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    ngay_sinh = serializers.DateField(required=False, allow_null=True)
    don_vi_id = serializers.PrimaryKeyRelatedField(
        queryset=DonVi.objects.all(), required=False, allow_null=True
    )
    chuc_vu_id = serializers.PrimaryKeyRelatedField(
        queryset=Position.objects.all(), required=False, allow_null=True
    )
    chuc_danh = serializers.CharField(max_length=150, required=False, allow_blank=True)
    sdt = serializers.CharField(
        max_length=20, required=False, allow_blank=True, validators=[vietnam_phone_regex]
    )
    nhom_quyen_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), required=False
    )
    trang_thai = serializers.ChoiceField(
        choices=StaffProfile.STATUS_CHOICES, required=False
    )
    is_public = serializers.BooleanField(required=False)
    ghi_chu = serializers.CharField(required=False, allow_blank=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        instance = self.instance
        if instance and instance.user.email.lower() == normalized:
            return normalized
        if User.objects.filter(email__iexact=normalized).exclude(pk=instance.user.pk).exists():
            raise serializers.ValidationError(f"Địa chỉ email '{normalized}' đã thuộc về nhân viên khác.")
        return normalized

    def update(self, instance, validated_data):
        user = instance.user

        with transaction.atomic():
            if "ho_ten" in validated_data:
                instance.full_name = validated_data["ho_ten"].strip()
                if " " in instance.full_name:
                    user.last_name = " ".join(instance.full_name.split(" ")[:-1])
                    user.first_name = instance.full_name.split(" ")[-1]
                else:
                    user.first_name = instance.full_name

            if "email" in validated_data:
                user.email = validated_data["email"]

            if "ngay_sinh" in validated_data:
                instance.birthday = validated_data["ngay_sinh"]

            if "don_vi_id" in validated_data:
                instance.don_vi = validated_data["don_vi_id"]

            if "chuc_vu_id" in validated_data:
                instance.chuc_vu = validated_data["chuc_vu_id"]

            if "chuc_danh" in validated_data:
                instance.chuc_danh = validated_data["chuc_danh"]

            if "sdt" in validated_data:
                instance.phone = validated_data["sdt"]

            if "trang_thai" in validated_data:
                instance.trang_thai = validated_data["trang_thai"]

            if "is_public" in validated_data:
                instance.is_public = validated_data["is_public"]

            if "ghi_chu" in validated_data:
                instance.ghi_chu = validated_data["ghi_chu"]

            if "avatar_url" in validated_data:
                instance.avatar_url = validated_data["avatar_url"]

            user.save()
            instance.save()

            if "nhom_quyen_ids" in validated_data:
                instance.nhom_quyen.set(validated_data["nhom_quyen_ids"])
                user.groups.set(validated_data["nhom_quyen_ids"])

            return instance
