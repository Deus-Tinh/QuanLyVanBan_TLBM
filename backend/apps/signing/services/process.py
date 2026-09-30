from django.db import IntegrityError, transaction
from django.db.models import Max

from .. import enums
from ..errors import ConflictError, SigningError
from ..models import SigningProcess, SigningProcessStep, SigningProcessStepSigner
from .audit import ghi_nhat_ky

LOAI = "signing_process"
CAU_HINH_NHAC_HAN_MAC_DINH = {"truoc_han_gio": [24], "dung_han": True}


def _khoa(process_id):
    """Khóa dòng quy trình trong transaction hiện tại (không tác dụng trên SQLite)."""
    return SigningProcess.objects.select_for_update().get(pk=process_id)


def _yeu_cau_ban_nhap(process):
    if process.trang_thai != enums.TrangThaiQuyTrinh.NHAP:
        raise ConflictError(
            code="quy_trinh_khong_the_sua",
            detail="Chỉ được sửa quy trình ở trạng thái nháp; hãy nhân bản để tạo phiên bản mới.",
        )


@transaction.atomic
def tao_quy_trinh(nguoi_tao, *, ma_quy_trinh, ten_quy_trinh, pham_vi, kieu_ky_mac_dinh,
                  mo_ta="", cau_hinh_nhac_han=None, cap_ky=()):
    """Tạo quy trình nháp (phiên bản 1) kèm các cấp và người ký cấu hình sẵn.

    `cap_ky`: danh sách dict {cap_ky, ten_cap_ky, thu_tu, don_vi_id?, so_gio_xu_ly?, ghi_chu?,
    nguoi_ky: [{nguoi_ky?, chuc_vu_id?, vai_tro_ky?, chan_ky_chinh?, thu_tu}]}.
    """
    try:
        with transaction.atomic():
            process = SigningProcess.objects.create(
                ma_quy_trinh=ma_quy_trinh, ten_quy_trinh=ten_quy_trinh, mo_ta=mo_ta,
                pham_vi=pham_vi, kieu_ky_mac_dinh=kieu_ky_mac_dinh,
                cau_hinh_nhac_han=cau_hinh_nhac_han or CAU_HINH_NHAC_HAN_MAC_DINH,
                phien_ban=1, create_by=nguoi_tao,
            )
    except IntegrityError:
        raise ConflictError(code="quy_trinh_trung_ma", detail="Mã quy trình đã tồn tại.")
    for cap in cap_ky:
        them_cap_ky(process, nguoi_tao, **cap, _ghi_nhat_ky=False)
    ghi_nhat_ky(nguoi_tao, LOAI, process.pk, "TAO_QUY_TRINH", trang_thai_sau=process.trang_thai)
    return process


@transaction.atomic
def them_cap_ky(process, nguoi_thuc_hien, *, cap_ky, ten_cap_ky, thu_tu, nguoi_ky=(),
                don_vi_id=None, so_gio_xu_ly=None, ghi_chu="", _ghi_nhat_ky=True):
    process = _khoa(process.pk)
    _yeu_cau_ban_nhap(process)
    try:
        with transaction.atomic():
            step = SigningProcessStep.objects.create(
                quy_trinh=process, cap_ky=cap_ky, ten_cap_ky=ten_cap_ky, thu_tu=thu_tu,
                don_vi_id=don_vi_id, so_gio_xu_ly=so_gio_xu_ly, ghi_chu=ghi_chu,
            )
    except IntegrityError:
        raise ConflictError(code="cap_ky_trung_thu_tu", detail="Thứ tự cấp ký đã tồn tại trong quy trình.")
    for nk in nguoi_ky:
        them_nguoi_ky(step, nguoi_thuc_hien, **nk)
    if _ghi_nhat_ky:
        ghi_nhat_ky(nguoi_thuc_hien, LOAI, process.pk, "THEM_CAP_KY", chi_tiet=f"thu_tu={thu_tu}")
    return step


@transaction.atomic
def them_nguoi_ky(step, nguoi_thuc_hien, *, thu_tu, nguoi_ky=None, chuc_vu_id=None,
                  vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True):
    process = _khoa(step.quy_trinh_id)
    _yeu_cau_ban_nhap(process)
    if (nguoi_ky is None) == (chuc_vu_id is None):
        raise SigningError(
            code="nguoi_ky_hoac_chuc_vu",
            detail="Phải nhập đúng một trong hai: người ký hoặc chức vụ ký.",
        )
    return SigningProcessStepSigner.objects.create(
        buoc_quy_trinh=step, nguoi_ky=nguoi_ky, chuc_vu_id=chuc_vu_id,
        vai_tro_ky=vai_tro_ky, chan_ky_chinh=chan_ky_chinh, thu_tu=thu_tu,
    )


def kiem_tra_truoc_khi_kich_hoat(process):
    """Quy trình phải có cấp đang áp dụng và mỗi cấp phải có người ký."""
    steps = list(process.cap_ky_set.filter(dang_ap_dung=True).prefetch_related("nguoi_ky_set"))
    if not steps:
        raise SigningError(code="quy_trinh_khong_co_cap", detail="Quy trình chưa có cấp ký nào đang áp dụng.")
    thieu = [s.thu_tu for s in steps if not s.nguoi_ky_set.all()]
    if thieu:
        raise SigningError(
            code="cap_ky_khong_co_nguoi_ky",
            detail="Có cấp ký chưa có người ký.",
            fields={"cap_ky_thieu_nguoi_ky": thieu},
        )


@transaction.atomic
def kich_hoat(process, nguoi_thuc_hien):
    process = _khoa(process.pk)
    if process.trang_thai != enums.TrangThaiQuyTrinh.NHAP:
        raise ConflictError(code="quy_trinh_khong_o_trang_thai_nhap", detail="Chỉ kích hoạt được quy trình nháp.")
    kiem_tra_truoc_khi_kich_hoat(process)
    truoc = process.trang_thai
    process.trang_thai = enums.TrangThaiQuyTrinh.HOAT_DONG
    process.update_by = nguoi_thuc_hien
    process.save(update_fields=["trang_thai", "update_by", "update_at"])
    ghi_nhat_ky(nguoi_thuc_hien, LOAI, process.pk, "KICH_HOAT_QUY_TRINH",
                trang_thai_truoc=truoc, trang_thai_sau=process.trang_thai)
    return process


@transaction.atomic
def ngung(process, nguoi_thuc_hien):
    process = _khoa(process.pk)
    if process.trang_thai != enums.TrangThaiQuyTrinh.HOAT_DONG:
        raise ConflictError(code="quy_trinh_khong_hoat_dong", detail="Chỉ ngừng được quy trình đang hoạt động.")
    truoc = process.trang_thai
    process.trang_thai = enums.TrangThaiQuyTrinh.NGUNG
    process.update_by = nguoi_thuc_hien
    process.save(update_fields=["trang_thai", "update_by", "update_at"])
    ghi_nhat_ky(nguoi_thuc_hien, LOAI, process.pk, "NGUNG_QUY_TRINH",
                trang_thai_truoc=truoc, trang_thai_sau=process.trang_thai)
    return process


@transaction.atomic
def nhan_ban(process, nguoi_thuc_hien):
    """Tạo phiên bản mới (nháp) từ quy trình hiện có, sao chép cấp và người ký."""
    nguon = SigningProcess.objects.get(pk=process.pk)
    ban_moi_nhat = SigningProcess.objects.select_for_update().filter(
        ma_quy_trinh=nguon.ma_quy_trinh
    ).aggregate(m=Max("phien_ban"))["m"]
    moi = SigningProcess.objects.create(
        ma_quy_trinh=nguon.ma_quy_trinh, ten_quy_trinh=nguon.ten_quy_trinh, mo_ta=nguon.mo_ta,
        pham_vi=nguon.pham_vi, kieu_ky_mac_dinh=nguon.kieu_ky_mac_dinh,
        cau_hinh_nhac_han=nguon.cau_hinh_nhac_han, phien_ban=ban_moi_nhat + 1,
        create_by=nguoi_thuc_hien,
    )
    for step in nguon.cap_ky_set.prefetch_related("nguoi_ky_set"):
        step_moi = SigningProcessStep.objects.create(
            quy_trinh=moi, cap_ky=step.cap_ky, ten_cap_ky=step.ten_cap_ky, thu_tu=step.thu_tu,
            don_vi_id=step.don_vi_id, so_gio_xu_ly=step.so_gio_xu_ly,
            dang_ap_dung=step.dang_ap_dung, ghi_chu=step.ghi_chu,
        )
        for nk in step.nguoi_ky_set.all():
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step_moi, nguoi_ky=nk.nguoi_ky, chuc_vu_id=nk.chuc_vu_id,
                vai_tro_ky=nk.vai_tro_ky, chan_ky_chinh=nk.chan_ky_chinh, thu_tu=nk.thu_tu,
            )
    ghi_nhat_ky(nguoi_thuc_hien, LOAI, moi.pk, "NHAN_BAN_QUY_TRINH", trang_thai_sau=moi.trang_thai,
                du_lieu_kem_theo={"tu_quy_trinh": nguon.pk, "phien_ban": moi.phien_ban})
    return moi
