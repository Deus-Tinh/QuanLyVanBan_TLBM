from django.utils import timezone

from documents.models import VanBanDen, VanBanDi
from signing import enums
from signing.models import SigningRequestStepSigner


def dem_ho_so_cho_ky(user):
    """
    Đếm số lượng yêu cầu trình ký đang ở trạng thái CHO_KY của người dùng đăng nhập.
    Phục vụ đổ số liệu vào Header Badge và KPI Trang chủ Dashboard (Nhóm 1).
    """
    if not user or not user.is_authenticated:
        return 0

    return SigningRequestStepSigner.objects.filter(
        nguoi_ky=user,
        trang_thai=enums.TrangThaiNguoiKy.CHO_KY,
    ).count()


def danh_sach_trinh_ky_gan_nhat(user, limit=5):
    """
    Lấy danh sách các phiếu trình ký gần nhất được phân công cho cán bộ.
    Bao gồm thông tin trích yếu văn bản, người trình, ngày gửi và trạng thái xử lý.
    """
    if not user or not user.is_authenticated:
        return []

    signers = list(
        SigningRequestStepSigner.objects.filter(nguoi_ky=user)
        .select_related("buoc_ky__luot_trinh__trinh_ky__create_by")
        .order_by("-buoc_ky__luot_trinh__trinh_ky__created_at", "-pk")[:limit]
    )

    if not signers:
        return []

    STATUS_MAP = {
        enums.TrangThaiNguoiKy.CHO_KY: ("Chờ ký", "warning", "pending"),
        enums.TrangThaiNguoiKy.DA_KY: ("Đã ký", "success", "completed"),
        enums.TrangThaiNguoiKy.TU_CHOI: ("Từ chối", "danger", "rejected"),
    }

    # Gom danh sách ID văn bản đi và đến để query tối ưu (không bị N+1)
    vb_di_ids = []
    vb_den_ids = []
    pairs = []
    for s in signers:
        req = s.buoc_ky.luot_trinh.trinh_ky
        pairs.append((s, req))
        if req.document_type == enums.LoaiVanBan.VAN_BAN_DI:
            vb_di_ids.append(req.van_ban_id)
        elif req.document_type == enums.LoaiVanBan.VAN_BAN_DEN:
            vb_den_ids.append(req.van_ban_id)

    vb_di_map = {vb.id: vb.trich_yeu for vb in VanBanDi.objects.filter(id__in=vb_di_ids)} if vb_di_ids else {}
    vb_den_map = {vb.id: vb.trich_yeu for vb in VanBanDen.objects.filter(id__in=vb_den_ids)} if vb_den_ids else {}

    results = []
    for s, req in pairs:
        if req.document_type == enums.LoaiVanBan.VAN_BAN_DI:
            title = vb_di_map.get(req.van_ban_id) or f"Văn bản đi #{req.van_ban_id}"
        elif req.document_type == enums.LoaiVanBan.VAN_BAN_DEN:
            title = vb_den_map.get(req.van_ban_id) or f"Văn bản đến #{req.van_ban_id}"
        else:
            title = f"Hồ sơ trình ký #{req.id}"

        creator = req.create_by
        creator_name = (
            getattr(creator, "ho_ten", "")
            or f"{creator.last_name} {creator.first_name}".strip()
            or creator.username
        )

        date_str = ""
        dt = req.ngay_gui or req.created_at
        if dt:
            date_str = timezone.localtime(dt).strftime("%d/%m/%Y")

        label, variant, badge_status = STATUS_MAP.get(
            s.trang_thai, ("Khác", "info", "other")
        )

        results.append(
            {
                "id": req.id,
                "code": f"TK-{req.id:03d}",
                "ma_trinh_ky": f"TK-{req.id:03d}",
                "title": title,
                "tieu_de": title,
                "submitter": creator_name,
                "nguoi_trinh": creator_name,
                "date": date_str,
                "ngay_gui": date_str,
                "submittedDate": date_str,
                "status": s.trang_thai,
                "trang_thai": s.trang_thai,
                "statusLabel": label,
                "trang_thai_display": label,
                "variant": variant,
                "badgeStatus": badge_status,
            }
        )

    return results
