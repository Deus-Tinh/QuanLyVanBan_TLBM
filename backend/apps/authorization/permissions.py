"""
Helper kiểm quyền dùng chung (RBAC contract Issue #21).

Mọi nhóm kiểm quyền bằng codename theo SQL_Fix4, không kèm app label:

    from authorization.permissions import require_permission

    @api_view(["GET"])
    @permission_classes([IsAuthenticated, require_permission("view_hoso")])
    def hoso_list(request): ...

Chưa đăng nhập -> 401 (do IsAuthenticated), thiếu quyền -> 403.
Quản trị tối cao (is_superuser) luôn được phép.
"""
from rest_framework.permissions import BasePermission

DEFAULT_DENIED_MESSAGE = "roles.messages.permissionDenied"


def require_permission(codename: str, message: str = DEFAULT_DENIED_MESSAGE):
    """Tạo lớp permission DRF yêu cầu user có quyền `codename`."""

    class RequirePermission(BasePermission):
        def has_permission(self, request, view):
            user = request.user
            return bool(user and user.is_authenticated and user.has_perm(codename))

    RequirePermission.message = message
    RequirePermission.__name__ = f"Require_{codename}"
    RequirePermission.__qualname__ = RequirePermission.__name__
    return RequirePermission
