"""
Permissions cho phân hệ Quản lý Cán bộ Nhân viên (accounts - Issue #24).
"""
from rest_framework.permissions import BasePermission
from authorization.permissions import require_permission, DEFAULT_DENIED_MESSAGE


class CanChangeEmployeePermission(BasePermission):
    """
    Quyền cập nhật thông tin Cán bộ Nhân viên (accounts.Employee):
    - Superuser: Toàn quyền sửa bất kỳ CBNV nào.
    - Có quyền 'change_full_cbnv': Có thể sửa bất kỳ CBNV nào trong hệ thống.
    - Có quyền 'change_self_cbnv': CHỈ ĐƯỢC sửa chính bản thân mình (obj.id == request.user.id).
    - Ngược lại: 403 Forbidden.
    """
    message = DEFAULT_DENIED_MESSAGE

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.has_perm("change_full_cbnv") or user.has_perm("change_self_cbnv"))

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.has_perm("change_full_cbnv"):
            return True
        if user.has_perm("change_self_cbnv"):
            return obj.id == user.id
        return False
