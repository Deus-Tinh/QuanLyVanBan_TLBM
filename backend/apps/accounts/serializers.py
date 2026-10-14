"""
Serializers cho phân hệ Quản lý Cán bộ Nhân viên (CBNV - Issue #24).
Tác giả: Lê Duy Khánh (leduykhanhdevs). Chuyển sang Employee (Custom User Model) theo SQL_Fix4.
"""
import secrets
import string

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import IntegrityError, transaction
from rest_framework import serializers

from organizations.models import DonVi
from .models import Employee, Position, vietnam_phone_regex

# Giao diện dùng 'dang_lam_viec' / 'nghi_viec'; CSDL (ENUM employee_work_status) dùng 'LAM_VIEC' / 'NGHI_VIEC'.
STATUS_API_TO_DB = {
    "dang_lam_viec": Employee.Status.LAM_VIEC,
    "nghi_viec": Employee.Status.NGHI_VIEC,
    "LAM_VIEC": Employee.Status.LAM_VIEC,
    "NGHI_VIEC": Employee.Status.NGHI_VIEC,
}
STATUS_DB_TO_API = {
    Employee.Status.LAM_VIEC: "dang_lam_viec",
    Employee.Status.NGHI_VIEC: "nghi_viec",
}
STATUS_API_CHOICES = list(STATUS_API_TO_DB.keys())

SENSITIVE_PERMISSION = "accounts.view_full_cbnv"


def user_can_view_sensitive(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    return bool(user.is_superuser or user.is_staff or user.has_perm(SENSITIVE_PERMISSION))


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
    """
    Danh mục Chức vụ (accounts_position, Issue #20).
    Key API theo Issue (stt_uu_tien, ten_chuc_vu, ghi_chu) ánh xạ vào cột DDL (display_order, name, note).
    """

    stt_uu_tien = serializers.IntegerField(
        source="display_order",
        required=False,
        min_value=1,
        error_messages={
            "min_value": "positions.messages.sttInvalid",
            "invalid": "positions.messages.sttInvalid",
        },
    )
    ten_chuc_vu = serializers.CharField(
        source="name",
        max_length=255,
        error_messages={
            "blank": "positions.messages.nameRequired",
            "required": "positions.messages.nameRequired",
            "null": "positions.messages.nameRequired",
            "max_length": "positions.messages.nameTooLong",
        },
    )
    ghi_chu = serializers.CharField(source="note", required=False, allow_blank=True, allow_null=True)
    is_public = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = Position
        fields = ["id", "stt_uu_tien", "ten_chuc_vu", "is_public", "ghi_chu"]
        read_only_fields = ["id"]

    def validate_ten_chuc_vu(self, value):
        trimmed = " ".join(value.split())
        if not trimmed:
            raise serializers.ValidationError("positions.messages.nameRequired")
        # So khớp bằng casefold ở Python: iexact của SQLite không phân biệt hoa/thường với chữ có dấu.
        others = Position.objects.all()
        if self.instance is not None:
            others = others.exclude(pk=self.instance.pk)
        if trimmed.casefold() in {n.casefold() for n in others.values_list("name", flat=True)}:
            raise serializers.ValidationError("positions.messages.nameExists")
        return trimmed

    def validate_stt_uu_tien(self, value):
        duplicated = Position.objects.filter(display_order=value)
        if self.instance is not None:
            duplicated = duplicated.exclude(pk=self.instance.pk)
        if duplicated.exists():
            raise serializers.ValidationError("positions.messages.sttExists")
        return value

    def validate_ghi_chu(self, value):
        return (value or "").strip()

    def create(self, validated_data):
        if "display_order" in validated_data:
            return super().create(validated_data)
        # Không truyền STT: tự lấy MAX + 1; thử lại nếu hai request cùng lúc chọn trùng số.
        for _ in range(5):
            validated_data["display_order"] = Position.get_next_display_order()
            try:
                with transaction.atomic():
                    return super().create(validated_data)
            except IntegrityError:
                continue
        raise serializers.ValidationError({"stt_uu_tien": ["positions.messages.sttExists"]})


class GroupSimpleSerializer(serializers.ModelSerializer):
    """Serializer nhóm quyền RBAC."""

    class Meta:
        model = Group
        fields = ["id", "name"]


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Hiển thị danh sách và chi tiết CBNV.
    Che năm sinh và ẩn nhóm quyền nếu người xem thiếu quyền accounts.view_full_cbnv.
    """

    user_id = serializers.IntegerField(source="id", read_only=True)
    full_name = serializers.CharField(source="ho_ten", read_only=True)

    don_vi_id = serializers.IntegerField(read_only=True)
    don_vi_ten = serializers.CharField(source="don_vi.ten", read_only=True)
    khoi_ten = serializers.CharField(source="don_vi.khoi.ten", read_only=True)

    chuc_vu_id = serializers.IntegerField(read_only=True)
    chuc_vu_ten = serializers.CharField(source="chuc_vu.name", read_only=True)

    phone = serializers.CharField(source="sdt", read_only=True)
    avatar_url = serializers.SerializerMethodField()
    ngay_sinh = serializers.SerializerMethodField()
    birthday = serializers.SerializerMethodField()
    is_birthday_masked = serializers.SerializerMethodField()

    nhom_quyen = serializers.SerializerMethodField()
    trang_thai = serializers.SerializerMethodField()
    trang_thai_display = serializers.CharField(source="get_trang_thai_display", read_only=True)
    has_sensitive_permission = serializers.SerializerMethodField()
    temporary_password = serializers.SerializerMethodField()

    class Meta:
        model = Employee
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

    def _can_view_sensitive(self) -> bool:
        request = self.context.get("request")
        return user_can_view_sensitive(getattr(request, "user", None))

    def get_temporary_password(self, obj):
        return getattr(obj, "raw_temporary_password", None)

    def get_avatar_url(self, obj) -> str:
        # SQL_Fix4 không có cột ảnh đại diện; giữ khóa để giao diện cũ không lỗi.
        return ""

    def get_trang_thai(self, obj) -> str:
        return STATUS_DB_TO_API.get(obj.trang_thai, obj.trang_thai)

    def get_has_sensitive_permission(self, obj) -> bool:
        return self._can_view_sensitive()

    def get_ngay_sinh(self, obj):
        if self._can_view_sensitive():
            return obj.ngay_sinh.isoformat()
        return obj.ngay_sinh.strftime("%d/%m/----")

    def get_birthday(self, obj):
        # Chỉ trả ngày sinh đầy đủ cho người có quyền; người khác chỉ thấy ngay_sinh đã che năm.
        return obj.ngay_sinh.isoformat() if self._can_view_sensitive() else None

    def get_is_birthday_masked(self, obj) -> bool:
        return not self._can_view_sensitive()

    def get_nhom_quyen(self, obj):
        if not self._can_view_sensitive():
            return []
        return [{"id": g.id, "name": g.name} for g in obj.groups.all()]


class EmployeeCreateSerializer(serializers.Serializer):
    """Thêm mới CBNV kèm tài khoản đăng nhập; không lưu mật khẩu thô, trả mật khẩu tạm một lần."""

    ho_ten = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(
        max_length=128, required=False, allow_blank=True, write_only=True
    )
    ngay_sinh = serializers.DateField(required=True)
    don_vi_id = serializers.PrimaryKeyRelatedField(queryset=DonVi.objects.all(), required=True)
    chuc_vu_id = serializers.PrimaryKeyRelatedField(queryset=Position.objects.all(), required=True)
    chuc_danh = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    sdt = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default="", validators=[vietnam_phone_regex]
    )
    nhom_quyen_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), required=False
    )
    trang_thai = serializers.ChoiceField(choices=STATUS_API_CHOICES, default="dang_lam_viec")
    is_public = serializers.BooleanField(default=True)
    ghi_chu = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_ho_ten(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Họ và tên nhân viên không được để trống.")
        return trimmed

    def validate_email(self, value):
        normalized = value.strip().lower()
        if get_user_model().objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(f"Địa chỉ email '{normalized}' đã tồn tại trong hệ thống.")
        return normalized

    def validate_username(self, value):
        if value:
            trimmed = value.strip()
            if get_user_model().objects.filter(username__iexact=trimmed).exists():
                raise serializers.ValidationError(f"Tên đăng nhập '{trimmed}' đã tồn tại trong hệ thống.")
            return trimmed
        return value

    def create(self, validated_data):
        UserModel = get_user_model()
        email = validated_data["email"]
        username = validated_data.get("username")
        if not username:
            local_part = email.split("@")[0]
            candidate = local_part
            idx = 1
            while UserModel.objects.filter(username__iexact=candidate).exists():
                candidate = f"{local_part}{idx}"
                idx += 1
            username = candidate

        raw_password = validated_data.get("password")
        if not raw_password:
            alphabet = string.ascii_letters + string.digits
            raw_password = "".join(secrets.choice(alphabet) for _ in range(10))

        trang_thai = STATUS_API_TO_DB[validated_data.get("trang_thai", "dang_lam_viec")]

        with transaction.atomic():
            employee = UserModel.objects.create_user(
                username=username,
                password=raw_password,
                email=email,
                ho_ten=validated_data["ho_ten"],
                ngay_sinh=validated_data["ngay_sinh"],
                don_vi=validated_data["don_vi_id"],
                chuc_vu=validated_data["chuc_vu_id"],
                chuc_danh=validated_data.get("chuc_danh", ""),
                sdt=validated_data.get("sdt", ""),
                trang_thai=trang_thai,
                is_active=(trang_thai != Employee.Status.NGHI_VIEC),
                is_public=validated_data.get("is_public", True),
                ghi_chu=validated_data.get("ghi_chu", ""),
            )
            groups = validated_data.get("nhom_quyen_ids")
            if groups:
                employee.groups.set(groups)

            employee.raw_temporary_password = raw_password
            return employee


class EmployeeUpdateSerializer(serializers.Serializer):
    """Cập nhật thông tin CBNV."""

    ho_ten = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    ngay_sinh = serializers.DateField(required=False)
    don_vi_id = serializers.PrimaryKeyRelatedField(queryset=DonVi.objects.all(), required=False)
    chuc_vu_id = serializers.PrimaryKeyRelatedField(queryset=Position.objects.all(), required=False)
    chuc_danh = serializers.CharField(max_length=150, required=False, allow_blank=True)
    sdt = serializers.CharField(
        max_length=20, required=False, allow_blank=True, validators=[vietnam_phone_regex]
    )
    nhom_quyen_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), required=False
    )
    trang_thai = serializers.ChoiceField(choices=STATUS_API_CHOICES, required=False)
    is_public = serializers.BooleanField(required=False)
    ghi_chu = serializers.CharField(required=False, allow_blank=True)
    avatar_url = serializers.CharField(required=False, allow_blank=True)  # nhận nhưng bỏ qua: DDL không có cột

    def validate_email(self, value):
        normalized = value.strip().lower()
        duplicated = get_user_model().objects.filter(email__iexact=normalized).exclude(pk=self.instance.pk)
        if duplicated.exists():
            raise serializers.ValidationError(f"Địa chỉ email '{normalized}' đã thuộc về nhân viên khác.")
        return normalized

    def update(self, instance, validated_data):
        with transaction.atomic():
            if "ho_ten" in validated_data:
                instance.ho_ten = validated_data["ho_ten"].strip()
            if "email" in validated_data:
                instance.email = validated_data["email"]
            if "ngay_sinh" in validated_data:
                instance.ngay_sinh = validated_data["ngay_sinh"]
            if "don_vi_id" in validated_data:
                instance.don_vi = validated_data["don_vi_id"]
            if "chuc_vu_id" in validated_data:
                instance.chuc_vu = validated_data["chuc_vu_id"]
            for field in ("chuc_danh", "sdt", "is_public", "ghi_chu"):
                if field in validated_data:
                    setattr(instance, field, validated_data[field])

            if "trang_thai" in validated_data:
                new_status = STATUS_API_TO_DB[validated_data["trang_thai"]]
                if new_status == Employee.Status.LAM_VIEC and instance.trang_thai == Employee.Status.NGHI_VIEC:
                    instance.is_active = True
                instance.trang_thai = new_status

            instance.save()

            if "nhom_quyen_ids" in validated_data:
                instance.groups.set(validated_data["nhom_quyen_ids"])

            return instance
