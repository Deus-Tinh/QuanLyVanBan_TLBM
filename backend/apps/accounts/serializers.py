from rest_framework import serializers


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
