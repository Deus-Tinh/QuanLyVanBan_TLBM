"""
Selectors cho Module Văn Bản — Hỗ trợ quy tắc xem văn bản chuẩn theo Issue #82 & Issue #83.

Cung cấp cho các phân hệ khác (Dashboard Nhóm 1, Hồ sơ Nhóm 3, Công việc Nhóm 6):
- van_ban_xem_duoc(user, loai): Trả về QuerySet văn bản mà user được phép xem.
  + NOI_BO: Người có quyền view_* hoặc admin/staff xem được.
  + HAN_CHE: CHỈ người tạo và người nhận (documents_*_nguoinhan) xem được.
    Tuyệt đối không ngoại lệ cho superuser hay quyền view_*.
    Tài khoản bị khóa (is_active = FALSE) mất quyền xem.
- la_nguoi_xem_duoc(user, van_ban): Kiểm tra boolean quyền xem trên một đối tượng văn bản cụ thể.
- log_access(document_type, document_id, user, hanh_dong, ...): Ghi nhật ký vào documents_access_log.
"""

from django.db.models import Q
from .models import LoaiVanBan, PhamVi, VanBanDen, VanBanDi, get_document_model, DocumentAccessLog


def van_ban_xem_duoc(user, loai="DEN"):
    """
    Quy tắc xem văn bản chuẩn theo Issue #82 & Issue #83:
    - user không tồn tại hoặc is_active = False: trả về none()
    - NOI_BO: xem được nếu có quyền view_vanbanden/view_vanbandi hoặc là staff/admin
    - HAN_CHE: chỉ người tạo (nguoi_tao = user) hoặc người nhận (nguoi_nhan = user).
      Tuyệt đối KHÔNG có ngoại lệ cho superuser hay quyền view_*.
    """
    model = get_document_model(loai)

    if not user or not user.is_authenticated or not getattr(user, "is_active", True):
        return model.objects.none()

    model_name = getattr(model, "document_kind", "vanbanden")

    if model_name == "vanbanmat":
        # Hỗ trợ tương thích ngược cho VanBanMat: người tạo, người nhận hoặc admin
        if user.is_staff or user.is_superuser:
            return model.objects.all()
        return model.objects.filter(Q(nguoi_tao=user) | Q(nguoi_nhan=user)).distinct()

    # Điều kiện xem HAN_CHE (Issue #82 & #83): CHỈ người tạo hoặc người nhận trong documents_*_nguoinhan
    # Tuyệt đối KHÔNG có ngoại lệ cho superuser hay quyền view_*
    cond_han_che = Q(pham_vi=PhamVi.HAN_CHE) & (Q(nguoi_tao=user) | Q(nguoi_nhan=user))

    # Điều kiện xem NOI_BO:
    has_view_perm = (
        user.is_staff
        or user.is_superuser
        or user.has_perm(f"documents.view_{model_name}")
        or user.has_perm("documents.view_document")
        or getattr(getattr(user, "profile", None), "role", None) in ("admin", "lanh_dao", "van_thu")
    )
    if has_view_perm:
        cond_noi_bo = Q(pham_vi=PhamVi.NOI_BO)
    else:
        # Cán bộ thường không có quyền view_* thì xem các văn bản nội bộ công khai (hien_thi = True)
        cond_noi_bo = Q(pham_vi=PhamVi.NOI_BO, hien_thi=True)

    return model.objects.filter(cond_noi_bo | cond_han_che).distinct()


def la_nguoi_xem_duoc(user, van_ban):
    """
    Kiểm tra người dùng có quyền xem văn bản này hay không.
    Nhóm 6 (Công việc) và các phân hệ khác gọi hàm này trước khi giao việc từ văn bản hạn chế.
    """
    if not user or not user.is_authenticated or not getattr(user, "is_active", True):
        return False

    pham_vi = getattr(van_ban, "pham_vi", PhamVi.NOI_BO)
    if pham_vi == PhamVi.HAN_CHE:
        if van_ban.nguoi_tao_id == user.pk:
            return True
        if hasattr(van_ban, "nguoi_nhan") and van_ban.nguoi_nhan.filter(pk=user.pk).exists():
            return True
        return False

    if getattr(van_ban, "document_kind", None) == "vanbanmat":
        if user.is_staff or user.is_superuser:
            return True
        if van_ban.nguoi_tao_id == user.pk:
            return True
        if hasattr(van_ban, "nguoi_nhan") and van_ban.nguoi_nhan.filter(pk=user.pk).exists():
            return True
        return False

    # NOI_BO
    model_name = getattr(van_ban, "document_kind", "vanbanden")
    return (
        user.is_staff
        or user.is_superuser
        or user.has_perm(f"documents.view_{model_name}")
        or user.has_perm("documents.view_document")
        or getattr(van_ban, "hien_thi", True)
    )


def log_access(document_type, document_id, user, hanh_dong, doi_tuong_user=None, tep_id=None, dia_chi_ip=None):
    """
    Ghi nhật ký vào documents_access_log cho văn bản HAN_CHE.
    """
    if not user or not user.is_authenticated:
        return None
    return DocumentAccessLog.objects.create(
        document_type=str(document_type).lower(),
        document_id=document_id,
        user=user,
        hanh_dong=hanh_dong,
        doi_tuong_user=doi_tuong_user,
        tep_id=tep_id,
        dia_chi_ip=dia_chi_ip,
    )
