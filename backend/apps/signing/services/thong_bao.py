"""
Thông báo người trong luồng trình ký (bảng `signing_notification`, kiêm outbox; plan mục 4.1, 9).

- Mỗi sự kiện tạo một bản ghi cho từng kênh: `IN_APP` (hiện ngay trong ứng dụng) và `EMAIL` (khi người nhận
  có email). Tạo trong cùng transaction nghiệp vụ; `khoa_chong_gui_trung` duy nhất nên thao tác lặp không
  tạo thêm thông báo.
- Email gửi sau commit (`transaction.on_commit`), lỗi thì ghi `THAT_BAI` + `loi_gui`; lệnh
  `gui_thong_bao_trinh_ky` gửi lại các bản ghi `CHO_GUI`/`THAT_BAI`. Sau này chuyển sang task Celery chỉ nhận id.
- Sự kiện: người ký được mở (`CAN_KY`); hồ sơ hoàn tất (`HOAN_THANH`), không đồng ý (`TU_CHOI`), trả lại để
  sửa (`YEU_CAU_SUA`), bị hủy (`HUY`). Người thực hiện thao tác không tự nhận thông báo của mình.
"""

import logging

from django.conf import settings
from django.core.mail import get_connection, send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.module_loading import import_string

from .. import enums
from ..models import SigningNotification, SigningRequestStepSigner
from ..tich_hop.to_chuc import ten_hien_thi
from ..tich_hop.van_ban import mo_ta_van_ban

logger = logging.getLogger(__name__)

TEN_LOAI = {
    "CAN_KY": "Cần ký duyệt",
    "HOAN_THANH": "Đã hoàn tất duyệt nội bộ",
    "TU_CHOI": "Không đồng ý ban hành",
    "YEU_CAU_SUA": "Trả lại để sửa",
    "HUY": "Hồ sơ đã hủy",
}
SO_LAN_GUI_TOI_DA = 5


def _tao(yeu_cau, nguoi_nhan, loai, khoa, buoc_ky=None):
    bay_gio = timezone.now()
    for kenh in (enums.KenhThongBao.IN_APP, enums.KenhThongBao.EMAIL):
        if kenh == enums.KenhThongBao.EMAIL and not getattr(nguoi_nhan, "email", ""):
            continue
        trong_ung_dung = kenh == enums.KenhThongBao.IN_APP
        try:
            with transaction.atomic():
                tb = SigningNotification.objects.create(
                    trinh_ky=yeu_cau, buoc_ky=buoc_ky, nguoi_nhan=nguoi_nhan, kenh=kenh, loai_thong_bao=loai,
                    khoa_chong_gui_trung=f"{khoa}:{kenh}"[:255],
                    trang_thai=enums.TrangThaiThongBao.DA_GUI if trong_ung_dung else enums.TrangThaiThongBao.CHO_GUI,
                    thoi_diem_gui=bay_gio if trong_ung_dung else None,
                )
        except IntegrityError:  # đã tạo ở lần thao tác trước (cùng khóa chống gửi trùng)
            continue
        if not trong_ung_dung:
            transaction.on_commit(lambda pk=tb.pk: gui_email(pk), robust=True)


def can_ky(dong):
    """Người ký vừa được mở trong cấp đang ký."""
    yeu_cau = dong.buoc_ky.luot_trinh.trinh_ky
    _tao(yeu_cau, dong.nguoi_ky, "CAN_KY", f"CAN_KY:{dong.pk}:{dong.thoi_diem_mo.timestamp():.6f}", buoc_ky=dong)


def _nguoi_ky_cua_luot(luot, **loc):
    return [n.nguoi_ky for n in SigningRequestStepSigner.objects.filter(buoc_ky__luot_trinh=luot, **loc)
            .select_related("nguoi_ky").order_by("pk")]


def su_kien(yeu_cau, luot, loai, nguoi_thuc_hien):
    """Thông báo kết quả cho người trong luồng: người tạo và người ký liên quan của lượt trình."""
    if loai == "HUY":
        nguoi_nhan = _nguoi_ky_cua_luot(luot, trang_thai=enums.TrangThaiNguoiKy.CHO_KY,
                                        thoi_diem_mo__isnull=False) if luot else []
    elif loai == "YEU_CAU_SUA":
        nguoi_nhan = [yeu_cau.create_by]
    else:  # HOAN_THANH, TU_CHOI: người tạo và những người đã ký
        nguoi_nhan = [yeu_cau.create_by, *_nguoi_ky_cua_luot(luot, trang_thai=enums.TrangThaiNguoiKy.DA_KY)]
    da_gui = set()
    for nguoi in nguoi_nhan:
        if nguoi.pk == nguoi_thuc_hien.pk or nguoi.pk in da_gui:
            continue
        da_gui.add(nguoi.pk)
        _tao(yeu_cau, nguoi, loai, f"{loai}:{yeu_cau.pk}:{luot.pk if luot else 0}:{nguoi.pk}")


def noi_dung(tb):
    van_ban = mo_ta_van_ban(tb.trinh_ky.document_type, tb.trinh_ky.van_ban_id)
    ten_van_ban = " — ".join(x for x in (van_ban.get("so_hieu"), van_ban.get("trich_yeu")) if x) or f"#{tb.trinh_ky_id}"
    duong_dan = f"{settings.SIGNING_FRONTEND_URL.rstrip('/')}/approvals/{tb.trinh_ky_id}"
    tieu_de = f"[Trình ký] {TEN_LOAI.get(tb.loai_thong_bao, tb.loai_thong_bao)}: {ten_van_ban}"
    than = (f"Xin chào {ten_hien_thi(tb.nguoi_nhan)},\n\n"
            f"{TEN_LOAI.get(tb.loai_thong_bao, tb.loai_thong_bao)} — hồ sơ trình ký #{tb.trinh_ky_id}: {ten_van_ban}.\n"
            f"Quy trình: {tb.trinh_ky.quy_trinh.ten_quy_trinh}. Người trình: {ten_hien_thi(tb.trinh_ky.create_by)}.\n\n"
            f"Xem hồ sơ: {duong_dan}\n\n"
            "Thư gửi tự động từ phân hệ Trình ký, vui lòng không trả lời.")
    return tieu_de, than, ten_van_ban


def gui_email(tb_id):
    """Gửi một thông báo email; trả True khi gửi được. Gọi lại an toàn (chỉ gửi bản ghi chưa gửi)."""
    with transaction.atomic():
        tb = (SigningNotification.objects.select_for_update(skip_locked=True)
              .select_related("trinh_ky__quy_trinh", "trinh_ky__create_by", "nguoi_nhan")
              .filter(pk=tb_id, kenh=enums.KenhThongBao.EMAIL)
              .exclude(trang_thai=enums.TrangThaiThongBao.DA_GUI).first())
        if tb is None:
            return False
        tieu_de, than, _ = noi_dung(tb)
        try:
            # Django 6.1 (MAILERS) không nhận tên backend ở get_connection: backend riêng thì khởi tạo trực tiếp
            ket_noi = (import_string(settings.SIGNING_EMAIL_BACKEND)(fail_silently=False)
                       if settings.SIGNING_EMAIL_BACKEND else get_connection(fail_silently=False))
            send_mail(tieu_de, than, None, [tb.nguoi_nhan.email], connection=ket_noi)
        except Exception as exc:  # SMTP/cấu hình: ghi lỗi để gửi lại, không làm hỏng nghiệp vụ
            logger.warning("Gửi email thông báo %s thất bại: %s", tb.pk, exc)
            tb.trang_thai, tb.loi_gui = enums.TrangThaiThongBao.THAT_BAI, str(exc)[:1000]
            tb.so_lan_gui_lai += 1
            tb.save(update_fields=["trang_thai", "loi_gui", "so_lan_gui_lai"])
            return False
        tb.trang_thai, tb.thoi_diem_gui, tb.loi_gui = enums.TrangThaiThongBao.DA_GUI, timezone.now(), ""
        tb.save(update_fields=["trang_thai", "thoi_diem_gui", "loi_gui"])
        return True


def gui_lai_email_ton():
    """Quét outbox: gửi lại email `CHO_GUI`/`THAT_BAI` chưa quá số lần thử. Trả (đã gửi, còn lỗi)."""
    ids = list(SigningNotification.objects.filter(
        kenh=enums.KenhThongBao.EMAIL, so_lan_gui_lai__lt=SO_LAN_GUI_TOI_DA,
        trang_thai__in=[enums.TrangThaiThongBao.CHO_GUI, enums.TrangThaiThongBao.THAT_BAI],
    ).order_by("pk").values_list("pk", flat=True))
    ok = sum(1 for pk in ids if gui_email(pk))
    return ok, len(ids) - ok


def cua_toi(nguoi, gioi_han=50):
    return (SigningNotification.objects.filter(nguoi_nhan=nguoi, kenh=enums.KenhThongBao.IN_APP)
            .select_related("trinh_ky__quy_trinh", "trinh_ky__create_by", "nguoi_nhan").order_by("-created_at", "-pk")
            [:gioi_han])
