"""
Helper kiểm quyền dùng chung (RBAC contract Issue #21).

Mọi nhóm kiểm quyền bằng codename theo SQL_Fix4, không kèm app label:

    from authorization.permissions import require_permission

    @api_view(["GET"])
    @permission_classes([IsAuthenticated, require_permission("view_hoso")])
    def hoso_list(request): ...

Một view phục vụ nhiều method thì truyền dict {method: codename}:

    @api_view(["GET", "POST"])
    @permission_classes([IsAuthenticated, require_permission({"GET": "view_hoso", "POST": "add_hoso"})])
    def hoso_list_create(request): ...

Method không có trong dict bị từ chối; HEAD và OPTIONS dùng quyền của GET.
Quyền được kiểm trước khi view chạy, nên người thiếu quyền nhận 403 kể cả với id không tồn tại.

Chưa đăng nhập -> 401 (do IsAuthenticated), thiếu quyền -> 403.
Quản trị tối cao (is_superuser) luôn được phép.
"""
from rest_framework.permissions import BasePermission

DEFAULT_DENIED_MESSAGE = "roles.messages.permissionDenied"


def require_permission(codename, message: str = DEFAULT_DENIED_MESSAGE):
    """
    Tạo lớp permission DRF.

    `codename` là một chuỗi (một quyền cho mọi method) hoặc dict {method: codename} (quyền theo method).
    """
    if isinstance(codename, dict):
        mapping = {method.upper(): code for method, code in codename.items()}
        for method in ("HEAD", "OPTIONS"):
            if method not in mapping and "GET" in mapping:
                mapping[method] = mapping["GET"]
        label = "_".join(sorted(set(mapping.values())))

        def required_for(request):
            return mapping.get(request.method)

    else:
        label = codename

        def required_for(request):
            return codename

    class RequirePermission(BasePermission):
        def has_permission(self, request, view):
            user = request.user
            needed = required_for(request)
            return bool(user and user.is_authenticated and needed and user.has_perm(needed))

    RequirePermission.message = message
    RequirePermission.__name__ = f"Require_{label}"
    RequirePermission.__qualname__ = RequirePermission.__name__
    return RequirePermission
