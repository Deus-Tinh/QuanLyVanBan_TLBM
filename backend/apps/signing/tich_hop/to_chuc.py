"""
Tích hợp tổ chức, nhân sự (Nhóm 7).

Hợp đồng:
- `ten_hien_thi(nguoi_dung)`, `ten_chuc_vu(nguoi_dung)`: dữ liệu chụp vào snapshot người ký.
- `tim_ung_vien_theo_chuc_vu(chuc_vu_id, pham_vi_chuc_vu, nguoi_tao, don_vi_co_dinh_id)`: danh sách tài khoản
  đang hoạt động giữ chức vụ trong phạm vi (plan mục 3.2). Một ứng viên thì tự gán; nhiều ứng viên thì người tạo
  chọn; không có ai thì chặn gửi.

Cài đặt tạm: model người dùng có `ho_ten`, `chuc_vu`, `don_vi` (Employee của Nhóm 7) thì dùng; nếu chưa có
(`auth.User`) thì dùng họ tên/tên đăng nhập, không có chức vụ, và người ký theo chức vụ không tìm được ứng viên
(chặn gửi với mã lỗi rõ). Khi Employee/Đơn vị/Chức vụ lên staging, cài đặt tự dùng dữ liệu thật; đổi các cột
`chuc_vu_id`, `don_vi_id` số nguyên sang FK theo DDL ở bước đó.
"""

from django.contrib.auth import get_user_model

from .. import enums


def ten_hien_thi(nguoi_dung):
    return (getattr(nguoi_dung, "ho_ten", "") or nguoi_dung.get_full_name() or nguoi_dung.get_username()).strip()


def ten_chuc_vu(nguoi_dung):
    chuc_vu = getattr(nguoi_dung, "chuc_vu", None)
    return (getattr(chuc_vu, "name", "") or getattr(chuc_vu, "ten", "") or "") if chuc_vu else ""


def _co_du_lieu_to_chuc():
    fields = {f.name for f in get_user_model()._meta.get_fields()}
    return {"chuc_vu", "don_vi"} <= fields


def tim_ung_vien_theo_chuc_vu(chuc_vu_id, pham_vi_chuc_vu, nguoi_tao, don_vi_co_dinh_id=None):
    if not _co_du_lieu_to_chuc():
        return []
    queryset = get_user_model().objects.filter(is_active=True, chuc_vu_id=chuc_vu_id)
    if pham_vi_chuc_vu == enums.PhamViChucVu.DON_VI_NGUOI_TAO:
        queryset = queryset.filter(don_vi_id=getattr(nguoi_tao, "don_vi_id", None))
    elif pham_vi_chuc_vu == enums.PhamViChucVu.DON_VI_CO_DINH:
        queryset = queryset.filter(don_vi_id=don_vi_co_dinh_id)
    if hasattr(get_user_model(), "trang_thai"):
        queryset = queryset.filter(trang_thai="LAM_VIEC")
    return list(queryset.order_by("pk"))
