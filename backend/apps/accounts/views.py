from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import ChangePasswordSerializer
from .alpaca_auth import check_alpaca_auth


def _build_user_payload(user):
    """Trả về dict thông tin user dùng chung cho login & profile response, hỗ trợ cả camelCase lẫn snake_case."""
    full_name = user.ho_ten or user.username
    department = user.don_vi.ten if user.don_vi_id else "Văn phòng Trung tâm"
    position = user.chuc_vu.name if user.chuc_vu_id else ("Quản trị viên tối cao" if user.is_superuser else "Chuyên viên văn thư")
    date_joined_str = user.created_at.strftime("%Y-%m-%d") if user.created_at else ""

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email or "",
        # CamelCase (theo API Contract Hieu.md)
        "fullName": full_name,
        "unit": department,
        "roleTitle": position,
        "dateJoined": date_joined_str,
        # Snake_case (tương thích backward)
        "full_name": full_name,
        "department": department,
        "position": position,
        "role": "admin" if user.is_superuser else "staff",
        "phone": user.sdt,
        "avatar_url": "",
        "birthday": user.ngay_sinh.isoformat() if user.ngay_sinh else None,
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

    auth_provider = "local"
    user = authenticate(request, username=username, password=password)

    if user is None:
        # ── [Áp dụng tài liệu 9_TinNhan: "API user của app Ngân hàng Bảo Long.docx/.md"] ──────
        # Mục 2 trong tài liệu: "API kiểm tra Username, password và thông tin của User"
        # Endpoint: POST https://phase2-sit-api.alpaca.vn/auth-command/public/user/check-auth-user
        # Quy tắc mã MAC: UpperCase(MD5(SECRET_KEY + sorted_params))
        # Dòng này kích hoạt cơ chế xác thực kép (Dual Authentication) qua API Ngân hàng Bảo Long:
        alpaca_res = check_alpaca_auth(username, password)

        # Trạng thái 7: PASSWORD_CORRECT (mật khẩu chính xác theo quy định trong tài liệu Thầy)
        if alpaca_res.get("success"):
            UserModel = get_user_model()
            user = UserModel.objects.filter(username=username).first()
            if not user:
                # Tự động tạo hồ sơ cán bộ khi xác thực qua API Bảo Long thành công
                user = UserModel.objects.create_user(
                    username=username,
                    password=password,
                    ho_ten="Phan Quốc Dũng" if username == "phanquocdung" else username,
                    email=f"{username}@baolong.vn",
                )
            else:
                if not user.is_active:
                    msg = "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên."
                    return Response(
                        {"success": False, "error": msg, "detail": msg},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                user.set_password(password)
                user.save(update_fields=["password"])
            auth_provider = "alpaca_api"
        else:
            if alpaca_res.get("status") in (0, 3):
                msg = alpaca_res.get("message") or "Tài khoản đã bị vô hiệu hóa hoặc khóa."
                return Response(
                    {"success": False, "error": msg, "detail": msg},
                    status=status.HTTP_403_FORBIDDEN,
                )

            UserModel = get_user_model()
            try:
                existing_user = UserModel.objects.get(username=username)
                if not existing_user.is_active and existing_user.check_password(password):
                    msg = "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên."
                    return Response(
                        {"success": False, "error": msg, "detail": msg},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except UserModel.DoesNotExist:
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

    user_payload = _build_user_payload(user)
    user_payload["auth_provider"] = auth_provider

    return Response(
        {
            "success": True,
            "token": access_token,
            "access": access_token,
            "refresh": str(refresh),
            "user": user_payload,
            "auth_provider": auth_provider,
        },
        status=status.HTTP_200_OK,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/admin-set-password/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_set_password_view(request):
    """
    Quản trị viên đặt/cập nhật mật khẩu cho bất kỳ tài khoản nào (admin set pass).
    Yêu cầu quyền is_staff hoặc is_superuser.
    Body: { "username": "...", "new_password": "..." }
    """
    if not (request.user.is_superuser or request.user.is_staff):
        return Response(
            {"success": False, "error": "Chỉ Quản trị viên mới có quyền đặt lại mật khẩu cho tài khoản."},
            status=status.HTTP_403_FORBIDDEN,
        )

    target_username = request.data.get("username", "").strip()
    new_password = (
        request.data.get("new_password", "").strip()
        or request.data.get("password", "").strip()
    )

    if not target_username or not new_password:
        return Response(
            {"success": False, "error": "Vui lòng nhập tên đăng nhập và mật khẩu mới."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(new_password) < 6:
        return Response(
            {"success": False, "error": "Mật khẩu mới phải có tối thiểu 6 ký tự."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    UserModel = get_user_model()
    try:
        target_user = UserModel.objects.get(username=target_username)
        target_user.set_password(new_password)
        target_user.save()
        return Response(
            {
                "success": True,
                "message": f"Đặt lại mật khẩu thành công cho tài khoản '{target_username}'.",
            },
            status=status.HTTP_200_OK,
        )
    except UserModel.DoesNotExist:
        return Response(
            {"success": False, "error": f"Không tìm thấy tài khoản '{target_username}'."},
            status=status.HTTP_404_NOT_FOUND,
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
            if hasattr(token, "blacklist"):
                token.blacklist()
        except Exception:
            pass  # Nếu token không hợp lệ hoặc blacklist không bật, vẫn cho phép đăng xuất an toàn

    return Response(
        {"success": True, "message": "Đã đăng xuất", "detail": "Đã đăng xuất"},
        status=status.HTTP_200_OK,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/accounts/staffs/ & GET /api/auth/staffs/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def staffs_view(request):
    """
    GET /api/accounts/staffs/ & GET /api/auth/staffs/
    Danh sách cán bộ / nhân viên theo phòng ban cho các phân hệ khác (Document, Records...).
    Hỗ trợ lọc theo ?department= (tên đơn vị) hoặc ?don_vi_id= (ID đơn vị).
    """
    UserModel = get_user_model()
    queryset = (
        UserModel.objects.filter(is_active=True)
        .select_related("don_vi", "chuc_vu")
        .order_by("don_vi__stt_uu_tien", "chuc_vu__display_order", "ho_ten", "id")
    )

    don_vi_id = request.query_params.get("don_vi_id")
    department = request.query_params.get("department")

    if don_vi_id is not None and don_vi_id != "":
        don_vi_id_str = str(don_vi_id).strip()
        if not don_vi_id_str.isdigit():
            return Response(
                {"detail": "don_vi_id phải là số nguyên hợp lệ.", "error": "don_vi_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = queryset.filter(don_vi_id=int(don_vi_id_str))
    elif department:
        queryset = queryset.filter(don_vi__ten__iexact=department.strip())

    data = []
    for u in queryset:
        dept_name = u.don_vi.ten if u.don_vi else ""
        position_name = u.chuc_vu.name if u.chuc_vu else ""
        full_name = u.ho_ten or u.username
        data.append({
            "id": u.id,
            "username": u.username,
            "ho_ten": full_name,
            "don_vi_id": u.don_vi_id,
            "don_vi_ten": dept_name,
            "chuc_vu_id": u.chuc_vu_id,
            "chuc_vu_ten": position_name,
        })
    return Response(data, status=status.HTTP_200_OK)


