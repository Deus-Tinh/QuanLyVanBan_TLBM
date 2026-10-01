"""
Authorization and permission utilities for Django and Django REST Framework.
"""
from functools import wraps
from rest_framework import status
from rest_framework.permissions import BasePermission, BasePermissionMetaclass
from rest_framework.response import Response


class _PermissionMeta(BasePermissionMetaclass):
    """
    Metaclass enabling require_permission to be used either as a DRF permission
    class in permission_classes=[...] or directly as a view function decorator.
    """
    def __call__(cls, *args, **kwargs):
        if len(args) == 1 and callable(args[0]) and not kwargs:
            view_func = args[0]

            @wraps(view_func)
            def wrapped(request, *a, **kw):
                user = getattr(request, "user", None)
                if not user or not user.is_authenticated:
                    return Response(
                        {"detail": "Authentication credentials were not provided."},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
                if not user.has_perm(cls.permission_required):
                    return Response(
                        {"detail": "Bạn không có quyền thực hiện thao tác này."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                return view_func(request, *a, **kw)

            wrapped.permission_classes = getattr(view_func, "permission_classes", []) + [cls]
            return wrapped
        return super().__call__(*args, **kwargs)


def require_permission(perm: str):
    """
    Tạo permission class hoặc decorator để kiểm tra quyền truy cập theo chuẩn Django/DRF.

    Sử dụng:
        @api_view(["GET"])
        @permission_classes([IsAuthenticated, require_permission("birthdays.view_birthdayemaillog")])
        def my_view(request):
            ...

    Hoặc dùng dạng decorator:
        @require_permission("birthdays.view_birthdayemaillog")
        def my_view(request):
            ...
    """
    class DynamicPermission(BasePermission, metaclass=_PermissionMeta):
        permission_required = perm
        message = "Bạn không có quyền thực hiện thao tác này."

        def has_permission(self, request, view):
            user = getattr(request, "user", None)
            return bool(
                user
                and user.is_authenticated
                and user.has_perm(perm)
            )

    safe_name = perm.replace(".", "_")
    DynamicPermission.__name__ = f"RequirePermission_{safe_name}"
    return DynamicPermission
