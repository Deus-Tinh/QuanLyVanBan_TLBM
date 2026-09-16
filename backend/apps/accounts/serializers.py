from rest_framework import serializers
from django.contrib.auth.models import User
from .models import StaffProfile


class StaffProfileSerializer(serializers.ModelSerializer):
    """Serializer thông tin hồ sơ CBNV (dùng chung cho profile & login response)."""

    class Meta:
        model = StaffProfile
        fields = (
            "full_name",
            "department",
            "position",
            "role",
            "phone",
            "avatar_url",
            "birthday",
        )


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ thông tin người dùng — trả về cho API /profile/."""

    profile = StaffProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile",
        )


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
