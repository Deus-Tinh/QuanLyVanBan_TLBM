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
    """Trả về dict thông tin user dùng chung cho login & profile response, hỗ trợ cả camelCase lẫn snake_case."""
    profile = _get_or_create_profile(user)
    full_name = profile.full_name or user.get_full_name() or user.username
    department = profile.department or "Văn phòng Trung tâm"
    position = profile.position or ("Quản trị viên tối cao" if profile.role == "admin" else "Chuyên viên văn thư")
    date_joined_str = user.date_joined.strftime("%Y-%m-%d") if user.date_joined else ""

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        # CamelCase (theo API Contract Hieu.md)
        "fullName": full_name,
        "unit": department,
        "roleTitle": position,
        "dateJoined": date_joined_str,
        # Snake_case (tương thích backward)
        "full_name": full_name,
        "department": department,
        "position": position,
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
    Khớp 100% API Contract của Hieu.md:
      Response 200: { "success": true, "token": "...", "access": "...", "user": { ... } }
      Response 401: { "success": false, "error": "...", "detail": "..." }
    """
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        msg = "Vui lòng nhập đầy đủ tài khoản và mật khẩu."
        return Response(
            {"success": False, "error": msg, "detail": msg},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        from django.contrib.auth.models import User
        try:
            existing_user = User.objects.get(username=username)
            if not existing_user.is_active and existing_user.check_password(password):
                msg = "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên."
                return Response(
                    {"success": False, "error": msg, "detail": msg},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except User.DoesNotExist:
            pass

        msg = "Tên đăng nhập hoặc mật khẩu không chính xác!"
        return Response(
            {"success": False, "error": msg, "detail": msg},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        msg = "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên."
        return Response(
            {"success": False, "error": msg, "detail": msg},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Cấp JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)

    return Response(
        {
            "success": True,
            "token": access_token,
            "access": access_token,
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
        msg = "Mật khẩu hiện tại không chính xác!"
        return Response(
            {"success": False, "message": msg, "error": msg, "detail": msg},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(new_password) < 8:
        msg = "Mật khẩu mới phải có tối thiểu 8 ký tự!"
        return Response(
            {"success": False, "message": msg, "error": msg, "detail": msg},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if old_password == new_password:
        msg = "Mật khẩu mới phải khác mật khẩu cũ."
        return Response(
            {"success": False, "message": msg, "error": msg, "detail": msg},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()

    msg = "Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại."
    return Response(
        {"success": True, "message": msg, "detail": msg},
        status=status.HTTP_200_OK,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/logout/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Đăng xuất — đưa refresh token vào blacklist để vô hiệu hóa (nếu có refresh token),
    hoặc hủy phiên làm việc.
    """
    refresh_token = request.data.get("refresh")

    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass  # Nếu token đã hết hạn hoặc không hợp lệ, vẫn cho phép đăng xuất an toàn

    return Response(
        {"success": True, "message": "Đã đăng xuất", "detail": "Đã đăng xuất"},
        status=status.HTTP_200_OK,
    )
