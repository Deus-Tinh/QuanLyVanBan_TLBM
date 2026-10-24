from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import APIView
from rest_framework.views import exception_handler as drf_exception_handler


class SigningError(APIException):
    """Lỗi nghiệp vụ với mã lỗi ổn định để client xử lý."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "loi_nghiep_vu"
    default_detail = "Yêu cầu không hợp lệ."

    def __init__(self, code=None, detail=None, status_code=None, fields=None):
        super().__init__(detail=detail, code=code)
        if status_code is not None:
            self.status_code = status_code
        self.fields = fields or {}


class ConflictError(SigningError):
    status_code = status.HTTP_409_CONFLICT
    default_code = "xung_dot_trang_thai"
    default_detail = "Trạng thái hiện tại không cho phép thao tác."


# Lỗi chuẩn của Django/DRF (404, 401, 403, 405, 429) mặc định trả chi tiết tiếng Anh: thay bằng tiếng Việt theo mã
# trạng thái; giao diện dịch theo `code`.
CHI_TIET_CHUAN = {
    status.HTTP_401_UNAUTHORIZED: "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
    status.HTTP_403_FORBIDDEN: "Tài khoản không có quyền thực hiện thao tác này.",
    status.HTTP_404_NOT_FOUND: "Không tìm thấy hoặc tài khoản không được xem dữ liệu này.",
    status.HTTP_405_METHOD_NOT_ALLOWED: "Phương thức không được hỗ trợ.",
    status.HTTP_429_TOO_MANY_REQUESTS: "Thao tác quá nhiều lần, thử lại sau.",
}


def exception_handler(exc, context):
    """Lỗi trả dạng {"code", "detail", "fields"}; lỗi validation DRF giữ chi tiết theo field."""
    response = drf_exception_handler(exc, context)
    if response is None:
        return None
    if isinstance(exc, SigningError):
        response.data = {
            "code": exc.get_codes(),
            "detail": str(exc.detail),
            "fields": exc.fields,
        }
    elif response.status_code == status.HTTP_400_BAD_REQUEST and isinstance(response.data, dict):
        response.data = {"code": "du_lieu_khong_hop_le", "detail": "", "fields": response.data}
    elif isinstance(response.data, dict) and "detail" in response.data:
        response.data = {
            "code": "khong_tim_thay" if isinstance(exc, Http404) else getattr(exc, "default_code", "loi"),
            "detail": CHI_TIET_CHUAN.get(response.status_code, str(response.data["detail"])),
            "fields": {},
        }
    return response


class ImmutableEvidenceError(ConflictError):
    default_code = "bang_chung_bat_bien"
    default_detail = "Bằng chứng đã ghi nhận không được sửa hoặc xóa."


class SigningAPIView(APIView):
    """Base view của module: chỉ áp dụng định dạng lỗi này cho /api/v1/signing/, không đổi module khác."""

    def get_exception_handler(self):
        return exception_handler
