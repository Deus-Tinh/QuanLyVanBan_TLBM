from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import StaffProfile
from .serializers import ChangePasswordSerializer


# ─────────────────────────────────────────────────────────────────────────────
# Hàm tiện ích — lấy / tạo StaffProfile cho user nếu chưa có
# ─────────────────────────────────────────────────────────────────────────────

def _get_or_create_profile(user):
    """Tự động tạo StaffProfile nếu chưa có (tránh crash với superuser cũ)."""
    profile, created = StaffProfile.objects.get_or_create(
        user=user,
        defaults={
            "full_name": user.get_full_name() or user.username,
            "role": "admin" if user.is_superuser else "staff",
        },
    )
    return profile


def _build_user_payload(user):
    """Trả về dict thông tin user dùng chung cho login & profile response."""
    profile = _get_or_create_profile(user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": profile.full_name,
        "department": profile.department,
        "position": profile.position,
        "role": profile.role,
        "phone": profile.phone,
        "avatar_url": profile.avatar_url,
        "birthday": profile.birthday.isoformat() if profile.birthday else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/login/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Đăng nhập và cấp JWT token.

    Request body:
        { "username": "...", "password": "..." }

    Response 200:
        {
            "access": "<jwt_access_token>",
            "refresh": "<jwt_refresh_token>",
            "user": { id, username, email, full_name, department, position, role, ... }
        }

    Response 401:
        { "detail": "Tài khoản hoặc mật khẩu không chính xác." }
    """
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {"detail": "Vui lòng nhập đầy đủ tài khoản và mật khẩu."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {"detail": "Tài khoản hoặc mật khẩu không chính xác."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"detail": "Tài khoản đã bị vô hiệu hóa. Liên hệ Quản trị viên ITC."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Cấp JWT token
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": _build_user_payload(user),
        },
        status=status.HTTP_200_OK,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/auth/profile/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Lấy thông tin cá nhân của user đang đăng nhập.
    Yêu cầu Header: Authorization: Bearer <access_token>

    Response 200:
        { id, username, email, full_name, department, position, role, phone, avatar_url, birthday }
    """
    return Response(_build_user_payload(request.user), status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/change-password/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Đổi mật khẩu người dùng đang đăng nhập.

    Request body:
        { "old_password": "...", "new_password": "..." }

    Response 200:
        { "detail": "Mật khẩu đã được cập nhật thành công." }

    Response 400:
        { "detail": "Mật khẩu cũ không đúng." }
    """
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    old_password = serializer.validated_data["old_password"]
    new_password = serializer.validated_data["new_password"]

    if not user.check_password(old_password):
        return Response(
            {"detail": "Mật khẩu cũ không đúng."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if old_password == new_password:
        return Response(
            {"detail": "Mật khẩu mới phải khác mật khẩu cũ."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()

    return Response(
        {"detail": "Mật khẩu đã được cập nhật thành công."},
        status=status.HTTP_200_OK,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/logout/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Đăng xuất — đưa refresh token vào blacklist để vô hiệu hóa.

    Request body:
        { "refresh": "<refresh_token>" }

    Response 200:
        { "detail": "Đăng xuất thành công." }
    """
    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response(
            {"detail": "Vui lòng cung cấp refresh token."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError as e:
        return Response(
            {"detail": f"Token không hợp lệ hoặc đã hết hạn: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"detail": "Đăng xuất thành công."},
        status=status.HTTP_200_OK,
    )
