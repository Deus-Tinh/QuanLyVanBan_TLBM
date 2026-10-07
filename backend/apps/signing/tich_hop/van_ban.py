"""
Tích hợp văn bản đi (Nhóm 2).

Hợp đồng: `kiem_tra_van_ban_trinh_ky(nguoi_dung, document_type, van_ban_id)` trả `VanBanDi` nếu văn bản
được phép trình ký, ngược lại ném `SigningError`. Quy tắc (#80, #82/#83):
- chỉ văn bản đi (`vanbandi`);
- văn bản phải tồn tại;
- văn bản `pham_vi = 'HAN_CHE'` không đi qua trình ký;
- người trình phải xem được văn bản.

Cài đặt tạm (chờ hàm "văn bản xem được" dùng chung của Nhóm 2, #68 mục C5):
- đọc trực tiếp bảng DDL `documents_vanbandi`, chỉ các cột `id`, `pham_vi`, `nguoi_tao`, `trich_yeu`, `so_hieu`;
- quyền xem: người tạo văn bản hoặc có quyền `view_vanbandi`.
Khi Nhóm 2 có hàm dùng chung, thay thân `_doc_van_ban_di` và `_xem_duoc` bằng lời gọi hàm đó.
"""

from dataclasses import dataclass

from django.db import connection
from rest_framework import status

from .. import enums
from ..errors import SigningError
from ..permissions import co_quyen

BANG_VAN_BAN_DI = "documents_vanbandi"
PHAM_VI_HAN_CHE = "HAN_CHE"


@dataclass(frozen=True)
class VanBanDi:
    id: int
    pham_vi: str
    nguoi_tao_id: int | None
    so_hieu: str
    trich_yeu: str


def _doc_van_ban_di(van_ban_id):
    if BANG_VAN_BAN_DI not in connection.introspection.table_names():
        raise SigningError(
            code="chua_co_du_lieu_van_ban",
            detail="Hệ thống chưa có dữ liệu văn bản đi (phân hệ Văn bản chưa được triển khai).",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT id, pham_vi, nguoi_tao, so_hieu, trich_yeu FROM {BANG_VAN_BAN_DI} WHERE id = %s",
            [van_ban_id],
        )
        row = cursor.fetchone()
    if row is None:
        return None
    return VanBanDi(id=row[0], pham_vi=row[1], nguoi_tao_id=row[2], so_hieu=row[3] or "", trich_yeu=row[4] or "")


def _xem_duoc(nguoi_dung, van_ban):
    return van_ban.nguoi_tao_id == nguoi_dung.pk or co_quyen(nguoi_dung, "view_vanbandi")


def kiem_tra_van_ban_trinh_ky(nguoi_dung, document_type, van_ban_id):
    if document_type != enums.LoaiVanBan.VAN_BAN_DI:
        raise SigningError(code="chi_trinh_ky_van_ban_di", detail="Trình ký chỉ nhận văn bản đi.",
                           fields={"document_type": ["Chỉ nhận 'vanbandi'."]})
    van_ban = _doc_van_ban_di(van_ban_id)
    if van_ban is None:
        raise SigningError(code="khong_tim_thay_van_ban", detail="Không tìm thấy văn bản đi.",
                           status_code=status.HTTP_404_NOT_FOUND, fields={"van_ban_id": ["Không tồn tại."]})
    if van_ban.pham_vi == PHAM_VI_HAN_CHE:
        raise SigningError(code="van_ban_han_che_khong_trinh_ky",
                           detail="Văn bản hạn chế không đi qua trình ký.",
                           fields={"van_ban_id": ["Văn bản có phạm vi HAN_CHE."]})
    if not _xem_duoc(nguoi_dung, van_ban):
        # Không tiết lộ sự tồn tại của văn bản người dùng không được xem
        raise SigningError(code="khong_tim_thay_van_ban", detail="Không tìm thấy văn bản đi.",
                           status_code=status.HTTP_404_NOT_FOUND, fields={"van_ban_id": ["Không tồn tại."]})
    return van_ban
