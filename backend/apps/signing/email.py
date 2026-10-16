"""
Thông báo người trong luồng ký qua email (django.core.mail, SMTP cấu hình ở settings) — plan mục 4.1, 9.

- Hàm gửi trực tiếp: `gui_mail`, `bao_den_luot_ky`, `bao_nguoi_tao` (lỗi gửi chỉ ghi log, trả 0).
- Service nghiệp vụ gọi `thong_bao_den_luot_ky` / `thong_bao_nguoi_tao` trong transaction: tạo bản ghi
  `signing_notification` (IN_APP đánh dấu DA_GUI; EMAIL ở CHO_GUI làm outbox) và chỉ gửi email sau commit.
  Rollback thì không có bản ghi và không gửi. Kết quả gửi cập nhật DA_GUI hoặc THAT_BAI kèm `loi_gui`.
- Người nhận không có email: bỏ qua kênh EMAIL, ghi cảnh báo; vẫn có bản ghi IN_APP.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from . import enums
from .models import SigningNotification
from .tich_hop import van_ban

logger = logging.getLogger(__name__)

DEN_LUOT_KY = "DEN_LUOT_KY"
SU_KIEN_NGUOI_TAO = {
    "HOAN_THANH": "đã hoàn thành",
    "TU_CHOI": "bị từ chối",
    "YEU_CAU_SUA": "cần chỉnh sửa",
    "HUY": "đã bị hủy",
}
LOI_GUI_TOI_DA = 1000


def _ten(user):
    return user.get_full_name() or user.get_username()


def _thoi_gian(dt):
    return timezone.localtime(dt).strftime("%d/%m/%Y %H:%M:%S")


def _gui(dia_chi, tieu_de, noi_dung):
    return send_mail(subject=f"[QLVB] {tieu_de}", message=noi_dung, from_email=settings.DEFAULT_FROM_EMAIL,
                     recipient_list=dia_chi, fail_silently=False)


def gui_mail(nguoi_nhan, tieu_de, noi_dung):
    """Gửi ngay một email tới các người dùng có email; trả số email đã gửi (0 khi lỗi hoặc không có địa chỉ)."""
    dia_chi = sorted({u.email for u in nguoi_nhan if getattr(u, "email", "")})
    bo_qua = [u.get_username() for u in nguoi_nhan if not getattr(u, "email", "")]
    if bo_qua:
        logger.warning("Bỏ qua người nhận không có email: %s", ", ".join(bo_qua))
    if not dia_chi:
        return 0
    try:
        return _gui(dia_chi, tieu_de, noi_dung)
    except Exception:
        logger.exception("Gửi email thất bại tới %s", dia_chi)
        return 0


def gui_mail_sau_commit(nguoi_nhan, tieu_de, noi_dung):
    nguoi_nhan = list(nguoi_nhan)
    transaction.on_commit(lambda: gui_mail(nguoi_nhan, tieu_de, noi_dung), robust=True)


# ── Nội dung ────────────────────────────────────────────────────────────────


def noi_dung_den_luot_ky(nguoi_ky, ma_ho_so, trich_yeu, han_xu_ly=None, duong_dan=""):
    dong = [f"Kính gửi {_ten(nguoi_ky)},", "", f"Hồ sơ trình ký {ma_ho_so} đang chờ xử lý.",
            f"Trích yếu: {trich_yeu or '(không có)'}"]
    if han_xu_ly:
        dong.append(f"Hạn xử lý: {_thoi_gian(han_xu_ly)}")
    if duong_dan:
        dong.append(f"Xem và ký tại: {duong_dan}")
    return f"Đến lượt bạn ký: {ma_ho_so}", "\n".join(dong)


def noi_dung_nguoi_tao(nguoi_tao, ma_ho_so, trich_yeu, su_kien, ghi_chu="", duong_dan=""):
    dong = [f"Kính gửi {_ten(nguoi_tao)},", "", f"Hồ sơ trình ký {ma_ho_so} {su_kien}.",
            f"Trích yếu: {trich_yeu or '(không có)'}"]
    if ghi_chu:
        dong.append(f"Ghi chú: {ghi_chu}")
    if duong_dan:
        dong.append(f"Chi tiết: {duong_dan}")
    return f"Hồ sơ {ma_ho_so} {su_kien}", "\n".join(dong)


def bao_den_luot_ky(nguoi_ky, ma_ho_so, trich_yeu, han_xu_ly=None, duong_dan=""):
    return gui_mail([nguoi_ky], *noi_dung_den_luot_ky(nguoi_ky, ma_ho_so, trich_yeu, han_xu_ly, duong_dan))


def bao_nguoi_tao(nguoi_tao, ma_ho_so, trich_yeu, su_kien, ghi_chu="", duong_dan=""):
    return gui_mail([nguoi_tao], *noi_dung_nguoi_tao(nguoi_tao, ma_ho_so, trich_yeu, su_kien, ghi_chu, duong_dan))


def duong_dan_ho_so(yeu_cau_id):
    return f"{settings.FRONTEND_URL.rstrip('/')}/approvals/{yeu_cau_id}"


def _mo_ta_ho_so(yeu_cau):
    mo_ta = van_ban.mo_ta_van_ban(yeu_cau.document_type, yeu_cau.van_ban_id)
    so_hieu = mo_ta.get("so_hieu")
    ma_ho_so = f"#{yeu_cau.pk}" + (f" ({so_hieu})" if so_hieu else "")
    return ma_ho_so, mo_ta.get("trich_yeu") or yeu_cau.ghi_chu


# ── Bản ghi signing_notification (outbox) ───────────────────────────────────


def _tao_ban_ghi(trinh_ky_id, nguoi_nhan, loai, khoa, buoc_ky=None):
    """Tạo bản ghi IN_APP (DA_GUI) và EMAIL (CHO_GUI, gửi sau commit). Khóa đã có thì không tạo lại."""
    thoi_diem = timezone.now()
    chung = {"trinh_ky_id": trinh_ky_id, "buoc_ky": buoc_ky, "nguoi_nhan": nguoi_nhan, "loai_thong_bao": loai}
    khoa_in_app = f"{khoa}:{enums.KenhThongBao.IN_APP}"
    if not SigningNotification.objects.filter(khoa_chong_gui_trung=khoa_in_app).exists():
        SigningNotification.objects.create(kenh=enums.KenhThongBao.IN_APP, khoa_chong_gui_trung=khoa_in_app,
                                           trang_thai=enums.TrangThaiThongBao.DA_GUI, thoi_diem_gui=thoi_diem,
                                           **chung)
    if not nguoi_nhan.email:
        logger.info("Bỏ qua email thông báo %s: người dùng %s không có email", loai, nguoi_nhan.get_username())
        return
    khoa_email = f"{khoa}:{enums.KenhThongBao.EMAIL}"
    if SigningNotification.objects.filter(khoa_chong_gui_trung=khoa_email).exists():
        return
    ban_ghi = SigningNotification.objects.create(kenh=enums.KenhThongBao.EMAIL, khoa_chong_gui_trung=khoa_email,
                                                 **chung)
    transaction.on_commit(lambda: gui_thong_bao_email(ban_ghi.pk), robust=True)


def thong_bao_den_luot_ky(dong_nguoi_ky):
    """Gọi khi các dòng người ký vừa được mở lượt (đã gán `thoi_diem_mo`), trong transaction mở lượt."""
    for dong in dong_nguoi_ky:
        khoa = f"{DEN_LUOT_KY}:{dong.pk}:{dong.thoi_diem_mo.isoformat()}"
        _tao_ban_ghi(dong.buoc_ky.luot_trinh.trinh_ky_id, dong.nguoi_ky, DEN_LUOT_KY, khoa, buoc_ky=dong)


def thong_bao_nguoi_tao(yeu_cau, loai, luot=None):
    """`loai` thuộc SU_KIEN_NGUOI_TAO; gọi trong transaction chuyển trạng thái lượt trình hoặc hồ sơ."""
    pham_vi = f"luot:{luot.pk}" if luot is not None else f"ho_so:{yeu_cau.pk}"
    _tao_ban_ghi(yeu_cau.pk, yeu_cau.create_by, loai, f"{loai}:{pham_vi}")


def _noi_dung_ban_ghi(ban_ghi):
    yeu_cau = ban_ghi.trinh_ky
    ma_ho_so, trich_yeu = _mo_ta_ho_so(yeu_cau)
    duong_dan = duong_dan_ho_so(yeu_cau.pk)
    if ban_ghi.loai_thong_bao == DEN_LUOT_KY:
        han = ban_ghi.buoc_ky.buoc_ky.han_xu_ly if ban_ghi.buoc_ky else None
        return noi_dung_den_luot_ky(ban_ghi.nguoi_nhan, ma_ho_so, trich_yeu, han, duong_dan)
    ghi_chu = {"TU_CHOI": yeu_cau.ly_do_tu_choi, "HUY": yeu_cau.ly_do_huy}.get(ban_ghi.loai_thong_bao, "")
    if ban_ghi.loai_thong_bao == "YEU_CAU_SUA":
        luot = yeu_cau.luot_trinh_set.order_by("-so_luot").first()
        ghi_chu = luot.ly_do if luot else ""
    return noi_dung_nguoi_tao(ban_ghi.nguoi_nhan, ma_ho_so, trich_yeu,
                              SU_KIEN_NGUOI_TAO[ban_ghi.loai_thong_bao], ghi_chu, duong_dan)


def gui_thong_bao_email(ban_ghi_id):
    """Gửi một bản ghi EMAIL đang CHO_GUI; cập nhật DA_GUI hoặc THAT_BAI. Bản ghi đã xử lý thì bỏ qua."""
    with transaction.atomic():
        ban_ghi = (SigningNotification.objects.select_for_update()
                   .select_related("trinh_ky", "nguoi_nhan", "buoc_ky__buoc_ky")
                   .filter(pk=ban_ghi_id, kenh=enums.KenhThongBao.EMAIL,
                           trang_thai=enums.TrangThaiThongBao.CHO_GUI).first())
        if ban_ghi is None:
            return False
        loi = ""
        try:
            tieu_de, noi_dung = _noi_dung_ban_ghi(ban_ghi)
            da_gui = _gui([ban_ghi.nguoi_nhan.email], tieu_de, noi_dung)
            if not da_gui:
                loi = "Máy chủ email không nhận thư."
        except Exception as exc:
            logger.exception("Gửi email thông báo %s thất bại", ban_ghi.pk)
            loi = f"{type(exc).__name__}: {exc}"[:LOI_GUI_TOI_DA]
        ban_ghi.trang_thai = enums.TrangThaiThongBao.THAT_BAI if loi else enums.TrangThaiThongBao.DA_GUI
        ban_ghi.thoi_diem_gui = None if loi else timezone.now()
        ban_ghi.loi_gui = loi
        ban_ghi.save(update_fields=["trang_thai", "thoi_diem_gui", "loi_gui"])
        return not loi

