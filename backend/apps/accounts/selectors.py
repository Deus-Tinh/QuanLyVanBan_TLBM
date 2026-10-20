"""Selector công khai của module Tài khoản cho các phân hệ khác (Dashboard Nhóm 1)."""
from .models import Employee


def nhan_vien_sinh_ngay(ngay):
    """Nhân viên đang hoạt động có ngày và tháng sinh trùng `ngay`, kèm đơn vị và chức vụ.

    So khớp đúng ngày/tháng; không dời sinh nhật 29/02 như quy tắc gửi thiệp của module Sinh nhật.
    """
    return Employee.objects.filter(
        is_active=True, ngay_sinh__month=ngay.month, ngay_sinh__day=ngay.day
    ).select_related("don_vi", "chuc_vu")
