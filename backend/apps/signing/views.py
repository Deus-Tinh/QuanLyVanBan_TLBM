import base64

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import enums
from .errors import SigningAPIView
from .models import SigningKey, SigningProcess
from .permissions import KY_TRINH_KY, QUAN_LY_QUY_TRINH, XEM_TRINH_KY, co_quyen, yeu_cau_quyen
from .serializers import (
    DatPinSerializer, DoiPinSerializer, KhoaDangKySerializer, KhoaSerializer, MoKhoaKySerializer,
    QuyTrinhInputSerializer, QuyTrinhSerializer, ThuHoiKhoaSerializer, XacMinhSoHuuSerializer,
    XoayVongSerializer,
)
from .services import keys as key_service
from .services import pin as pin_service
from .services import process as process_service


@api_view(["GET"])
def ping_view(request):
    """GET /api/v1/signing/ping/ — yêu cầu đăng nhập (permission mặc định IsAuthenticated)."""
    return Response({"module": "signing", "status": "ok"})


def _ip(request):
    return request.META.get("REMOTE_ADDR") or None


# ── Quy trình ────────────────────────────────────────────────────────────────
# Phase 6b (plan mục 8): xem cần view_trinhky; tạo, kích hoạt, ngừng, nhân bản cần
# manage_signing_process. Quy trình là cấu hình chung của cơ quan: người có quyền quản lý
# thấy mọi trạng thái và thao tác được trên mọi quy trình; người khác chỉ thấy HOAT_DONG.


def _quy_trinh_xem_duoc(user):
    queryset = SigningProcess.objects.prefetch_related("cap_ky_set__nguoi_ky_set")
    if co_quyen(user, QUAN_LY_QUY_TRINH):
        return queryset
    yeu_cau_quyen(user, XEM_TRINH_KY)
    return queryset.filter(trang_thai=enums.TrangThaiQuyTrinh.HOAT_DONG)


class QuyTrinhListCreateView(SigningAPIView):
    def get(self, request):
        queryset = _quy_trinh_xem_duoc(request.user).order_by("ma_quy_trinh", "-phien_ban")
        trang_thai = request.query_params.get("trang_thai")
        if trang_thai:
            queryset = queryset.filter(trang_thai=trang_thai)
        return Response(QuyTrinhSerializer(queryset, many=True).data)

    def post(self, request):
        yeu_cau_quyen(request.user, QUAN_LY_QUY_TRINH)
        data = QuyTrinhInputSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        process = process_service.tao_quy_trinh(request.user, **data.validated_data)
        process = _quy_trinh_xem_duoc(request.user).get(pk=process.pk)
        return Response(QuyTrinhSerializer(process).data, status=status.HTTP_201_CREATED)


class QuyTrinhDetailView(SigningAPIView):
    def get(self, request, pk):
        process = get_object_or_404(_quy_trinh_xem_duoc(request.user), pk=pk)
        return Response(QuyTrinhSerializer(process).data)


class QuyTrinhActionView(SigningAPIView):
    """POST /quy-trinh/<pk>/<action>/ với action = kich-hoat | ngung | nhan-ban."""

    actions = {
        "kich-hoat": process_service.kich_hoat,
        "ngung": process_service.ngung,
        "nhan-ban": process_service.nhan_ban,
    }
    action = None

    def post(self, request, pk):
        yeu_cau_quyen(request.user, QUAN_LY_QUY_TRINH)
        process = get_object_or_404(_quy_trinh_xem_duoc(request.user), pk=pk)
        result = self.actions[self.action](process, request.user)
        result = _quy_trinh_xem_duoc(request.user).get(pk=result.pk)
        code = status.HTTP_201_CREATED if self.action == "nhan-ban" else status.HTTP_200_OK
        return Response(QuyTrinhSerializer(result).data, status=code)


# ── Khóa ký ──────────────────────────────────────────────────────────────────
# Người dùng chỉ thấy và thao tác trên khóa của chính mình (khóa người khác trả 404).
# Đăng ký, xác minh, kích hoạt, xoay vòng khóa và thao tác PIN cần sign_trinhky.
# Xem danh sách, lấy challenge và thu hồi khóa của chính mình không cần quyền riêng:
# người bị gỡ quyền ký vẫn phải thu hồi được khóa của mình.


def _khoa_cua_toi(request):
    return SigningKey.objects.filter(nguoi_so_huu=request.user)


class KhoaListCreateView(SigningAPIView):
    def get(self, request):
        return Response(KhoaSerializer(_khoa_cua_toi(request).order_by("-created_at"), many=True).data)

    def post(self, request):
        yeu_cau_quyen(request.user, KY_TRINH_KY)
        data = KhoaDangKySerializer(data=request.data)
        data.is_valid(raise_exception=True)
        key = key_service.dang_ky(request.user, dia_chi_ip=_ip(request), **data.validated_data)
        return Response(KhoaSerializer(key).data, status=status.HTTP_201_CREATED)


class KhoaThachThucView(SigningAPIView):
    def get(self, request, pk):
        key = get_object_or_404(_khoa_cua_toi(request), pk=pk)
        return Response({"thach_thuc": key_service.thach_thuc_so_huu(key)})


class KhoaActionView(SigningAPIView):
    """POST /khoa/<pk>/<action>/ với action = xac-minh | kich-hoat | thu-hoi | xoay-vong."""

    action = None

    def post(self, request, pk):
        if self.action != "thu-hoi":
            yeu_cau_quyen(request.user, KY_TRINH_KY)
        key = get_object_or_404(_khoa_cua_toi(request), pk=pk)
        ip = _ip(request)
        if self.action == "xac-minh":
            data = XacMinhSoHuuSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            result = key_service.xac_minh_so_huu(key, request.user, data.validated_data["chu_ky_so"], ip)
        elif self.action == "kich-hoat":
            result = key_service.kich_hoat(key, request.user, ip)
        elif self.action == "thu-hoi":
            data = ThuHoiKhoaSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            result = key_service.thu_hoi(key, request.user, data.validated_data["ly_do"], ip)
        else:  # xoay-vong: key là khóa cũ, body chứa khóa mới
            data = XoayVongSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            khoa_moi = get_object_or_404(_khoa_cua_toi(request), pk=data.validated_data["khoa_moi"])
            result = key_service.xoay_vong(key, khoa_moi, request.user, ip)
        return Response(KhoaSerializer(result).data)


# ── PIN mở khóa ký (Phase 6, plan mục 3.4) ───────────────────────────────────


class KhoaPinView(SigningAPIView):
    """
    POST /khoa/<pk>/<action>/ với action = dat-pin | mo-khoa-ky | doi-pin.
    Trả `manh_bi_mat` (k_srv, Base64) chỉ sau khi xác minh; không trả PIN, verifier hay bản bọc.
    """

    action = None

    def post(self, request, pk):
        yeu_cau_quyen(request.user, KY_TRINH_KY)
        key = get_object_or_404(_khoa_cua_toi(request), pk=pk)
        ip = _ip(request)
        http_status = status.HTTP_200_OK
        if self.action == "dat-pin":
            data = DatPinSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            unlock, manh_bi_mat = pin_service.dat_pin(
                key, request.user, data.validated_data["xac_minh_pin"], data.validated_data["tham_so_kdf"], ip,
            )
            http_status = status.HTTP_201_CREATED
        elif self.action == "mo-khoa-ky":
            data = MoKhoaKySerializer(data=request.data)
            data.is_valid(raise_exception=True)
            unlock, manh_bi_mat = pin_service.mo_khoa_ky(key, request.user, data.validated_data["xac_minh_pin"], ip)
        else:  # doi-pin
            data = DoiPinSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            unlock, manh_bi_mat = pin_service.doi_pin(
                key, request.user, data.validated_data["xac_minh_pin_cu"], data.validated_data["xac_minh_pin_moi"],
                data.validated_data["tham_so_kdf"], ip,
            )
        response = Response(
            {"khoa": key.pk, "manh_bi_mat": base64.b64encode(manh_bi_mat).decode(), "tham_so_kdf": unlock.tham_so_kdf},
            status=http_status,
        )
        response["Cache-Control"] = "no-store"
        return response
