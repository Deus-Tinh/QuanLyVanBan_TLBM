"""
Services cho Module Văn Bản — Kiến trúc 3 Model (VanBanDen, VanBanDi, VanBanMat).

Bao gồm:
1. Tự sinh số thứ tự (Số đến / Số đi) an toàn concurrency (select_for_update)
2. Tự động chuyển hết hiệu lực khi quá hạn (quét trên cả 3 model)
3. Ghi log người xem (upsert vào documents_view_log theo document_type + document_id)
4. Sinh file Excel mẫu trực tiếp từ DB
5. Import dữ liệu từ Excel vào đúng model tương ứng
6. Export danh sách ra Excel theo bộ lọc
"""

import io
from datetime import datetime

from django.db import models, transaction
from django.utils import timezone
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from .models import (
    HieuLuc,
    LoaiVanBan,
    VanBanDen,
    VanBanDenAttachment,
    VanBanDi,
    VanBanDiAttachment,
    VanBanMat,
    VanBanMatAttachment,
    DocumentViewLog,
    get_document_model,
)


# ═══════════════════════════════════════════════════════════════════
# 1. TỰ SINH SỐ THỨ TỰ — An toàn concurrency (select_for_update)
# ═══════════════════════════════════════════════════════════════════

def generate_so_thu_tu(loai: str, nam: int) -> int | None:
    """
    Sinh số thứ tự tự động tăng dần theo năm + loại văn bản.
    An toàn race-condition bằng select_for_update() trong transaction.

    - VB Đến: loai='DEN' → Số đến (1, 2, 3, ...)
    - VB Đi:  loai='DI'  → Số đi  (1, 2, 3, ...)
    - VB Mật: KHÔNG có số thứ tự → trả về None
    """
    loai_str = str(loai).strip().upper()
    if loai_str in ("MAT", "VANBANMAT"):
        return None

    model = VanBanDi if loai_str in ("DI", "VANBANDI") else VanBanDen

    with transaction.atomic():
        last = (
            model.objects
            .select_for_update()
            .filter(nam=nam)
            .aggregate(max_so=models.Max("so_thu_tu"))
        )
        return (last["max_so"] or 0) + 1


# ═══════════════════════════════════════════════════════════════════
# 2. TỰ ĐỘNG CHUYỂN HẾT HIỆU LỰC KHI QUÁ HẠN
# ═══════════════════════════════════════════════════════════════════

def check_and_update_expired_documents() -> int:
    """
    Quét và tự động chuyển trạng thái các văn bản đã tới hoặc quá ngày hết hiệu lực
    sang 'HET_HIEU_LUC' trên cả 3 model: Đến, Đi, Mật.
    Áp dụng cho cả CON_HIEU_LUC và CON_HIEU_LUC_1_PHAN.
    """
    now = timezone.now()
    active_statuses = [HieuLuc.CON_HIEU_LUC, HieuLuc.CON_HIEU_LUC_1_PHAN]

    count_den = VanBanDen.objects.filter(
        hieu_luc__in=active_statuses,
        ngay_het_hieu_luc__isnull=False,
        ngay_het_hieu_luc__lte=now,
    ).update(hieu_luc=HieuLuc.HET_HIEU_LUC)

    count_di = VanBanDi.objects.filter(
        hieu_luc__in=active_statuses,
        ngay_het_hieu_luc__isnull=False,
        ngay_het_hieu_luc__lte=now,
    ).update(hieu_luc=HieuLuc.HET_HIEU_LUC)

    count_mat = VanBanMat.objects.filter(
        hieu_luc__in=active_statuses,
        ngay_het_hieu_luc__isnull=False,
        ngay_het_hieu_luc__lte=now,
    ).update(hieu_luc=HieuLuc.HET_HIEU_LUC)

    return count_den + count_di + count_mat


# ═══════════════════════════════════════════════════════════════════
# 2.1 TRUY VẤN ĐỘNG QUAN HỆ THAY THẾ 2 CHIỀU (Dynamic Replacements)
# ═══════════════════════════════════════════════════════════════════

def get_dynamic_replacements(doc) -> list[str]:
    """
    Truy vấn động quan hệ thay thế 2 chiều:
    1. Lấy danh sách số hiệu trong doc.link_thay_the (hỗ trợ phân tách bằng dấu phẩy).
    2. Quét ngược trong DB: Tìm các văn bản (Đến, Đi, Mật) có link_thay_the chứa doc.so_hieu.
    3. Hợp nhất danh sách và loại bỏ trùng lặp.
    """
    results: list[str] = []
    own_link = getattr(doc, "link_thay_the", "") or ""
    so_hieu = getattr(doc, "so_hieu", "") or ""
    so_hieu_clean = so_hieu.strip().lower()

    if own_link:
        for item in own_link.split(","):
            s = item.strip()
            if s and s.lower() != so_hieu_clean and s not in results:
                results.append(s)

    if so_hieu:
        from .models import VanBanDen, VanBanDi, VanBanMat
        for model in (VanBanDen, VanBanDi, VanBanMat):
            try:
                pk_val = getattr(doc, "pk", None)
                qs = model.objects.filter(link_thay_the__icontains=so_hieu)
                if pk_val and isinstance(doc, model):
                    qs = qs.exclude(pk=pk_val)
                for other in qs:
                    other_link = getattr(other, "link_thay_the", "") or ""
                    tokens = [t.strip().lower() for t in other_link.split(",") if t.strip()]
                    if so_hieu_clean in tokens and other.so_hieu:
                        target = other.so_hieu.strip()
                        if target and target.lower() != so_hieu_clean and target not in results:
                            results.append(target)
            except Exception:
                pass

    return results
 
 
# ═══════════════════════════════════════════════════════════════════
# 2.2 QUERYSET DÙNG CHUNG / KIỂM QUYỀN TRUY CẬP (Mục B4 & B5 Issue #53)
# ═══════════════════════════════════════════════════════════════════

def get_accessible_documents(user, doc_type: str = "vanbanden", strict_need_to_know: bool = False):
    """
    QuerySet chuẩn hoá dùng chung cho:
    - Module Văn Bản (Nhóm 2)
    - Dashboard / KPI (Nhóm 1)
    - Trợ lý AI (Nhóm 8)

    Đồng bộ 100% với selectors.van_ban_xem_duoc theo Issue #82 & Issue #83.
    """
    from .selectors import van_ban_xem_duoc
    return van_ban_xem_duoc(user, doc_type)



# ═══════════════════════════════════════════════════════════════════
# 3. GHI LOG NGƯỜI XEM — Upsert vào documents_view_log
# ═══════════════════════════════════════════════════════════════════

def log_document_view(document, user):
    """
    Ghi nhận người dùng đã xem văn bản.
    Khớp với bảng `documents_view_log` (document_type, document_id, user_id).
    """
    if not user or not user.is_authenticated:
        return

    doc_type = getattr(document, "document_kind", None)
    if not doc_type:
        loai = getattr(document, "loai", "DEN")
        if loai == "DI":
            doc_type = "vanbandi"
        elif loai == "MAT":
            doc_type = "vanbanmat"
        else:
            doc_type = "vanbanden"

    doc_id = document.pk if hasattr(document, "pk") else document.id

    DocumentViewLog.objects.update_or_create(
        document_type=doc_type,
        document_id=doc_id,
        user=user,
        defaults={"viewed_at": timezone.now()},
    )


# ═══════════════════════════════════════════════════════════════════
# 4. EXCEL — Cấu hình & Sinh file mẫu
# ═══════════════════════════════════════════════════════════════════

EXCEL_COLUMNS = {
    LoaiVanBan.DEN: [
        ("so_hieu", "Số, ký hiệu VB", 20),
        ("ngay_den", "Ngày đến", 18),
        ("ngay_van_ban", "Ngày văn bản", 18),
        ("trich_yeu", "Trích yếu nội dung", 50),
        ("noi_ban_hanh", "Nơi ban hành", 30),
        ("nguoi_ky", "Người ký", 20),
        ("chuc_vu", "Chức vụ", 20),
        ("hieu_luc", "Hiệu lực", 20),
        ("ghi_chu", "Ghi chú", 30),
    ],
    LoaiVanBan.DI: [
        ("so_hieu", "Số, ký hiệu VB", 20),
        ("ngay_ban_hanh", "Ngày ban hành", 18),
        ("ngay_van_ban", "Ngày văn bản", 18),
        ("trich_yeu", "Trích yếu nội dung", 50),
        ("noi_ban_hanh", "Nơi ban hành", 30),
        ("nguoi_ky", "Người ký", 20),
        ("chuc_vu", "Chức vụ", 20),
        ("hieu_luc", "Hiệu lực", 20),
        ("ghi_chu", "Ghi chú", 30),
    ],
    LoaiVanBan.MAT: [
        ("so_hieu", "Số, ký hiệu VB", 20),
        ("ngay_ban_hanh", "Ngày ban hành", 18),
        ("ngay_van_ban", "Ngày văn bản", 18),
        ("trich_yeu", "Trích yếu nội dung", 50),
        ("noi_ban_hanh", "Nơi ban hành", 30),
        ("nguoi_ky", "Người ký", 20),
        ("chuc_vu", "Chức vụ", 20),
        ("hieu_luc", "Hiệu lực", 20),
        ("ghi_chu", "Ghi chú", 30),
    ],
}

SAMPLE_DATA = {
    LoaiVanBan.DEN: {
        "so_hieu": "15/CV-BGDDT",
        "ngay_den": "15/09/2026 08:30:00",
        "ngay_van_ban": "14/09/2026",
        "trich_yeu": "V/v hướng dẫn tuyển sinh năm học 2026-2027",
        "noi_ban_hanh": "Bộ Giáo dục và Đào tạo",
        "nguoi_ky": "Nguyễn Văn A",
        "chuc_vu": "Thứ trưởng",
        "hieu_luc": "CON_HIEU_LUC",
        "ghi_chu": "(Dòng ví dụ — xóa trước khi import)",
    },
    LoaiVanBan.DI: {
        "so_hieu": "42/TB-ITC",
        "ngay_ban_hanh": "15/09/2026",
        "ngay_van_ban": "15/09/2026",
        "trich_yeu": "Thông báo lịch thi kết thúc học phần HK1",
        "noi_ban_hanh": "Trường ITC",
        "nguoi_ky": "Trần Văn B",
        "chuc_vu": "Hiệu trưởng",
        "hieu_luc": "CON_HIEU_LUC",
        "ghi_chu": "(Dòng ví dụ — xóa trước khi import)",
    },
    LoaiVanBan.MAT: {
        "so_hieu": "01/QD-MAT",
        "ngay_ban_hanh": "15/09/2026",
        "ngay_van_ban": "15/09/2026",
        "trich_yeu": "Quyết định kỷ luật nội bộ",
        "noi_ban_hanh": "Trường ITC",
        "nguoi_ky": "Lê Văn C",
        "chuc_vu": "Hiệu trưởng",
        "hieu_luc": "CON_HIEU_LUC",
        "ghi_chu": "(Dòng ví dụ — xóa trước khi import)",
    },
}

_header_font = Font(name="Arial", bold=True, size=11, color="FFFFFF")
_header_fill = PatternFill(start_color="2E86C1", end_color="2E86C1", fill_type="solid")
_header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
_sample_fill = PatternFill(start_color="FFF9C4", end_color="FFF9C4", fill_type="solid")
_sample_font = Font(name="Arial", italic=True, size=10, color="888888")
_cell_font = Font(name="Arial", size=10)
_cell_alignment = Alignment(vertical="center", wrap_text=True)
_thin_border = Border(
    left=Side(style="thin"),
    right=Side(style="thin"),
    top=Side(style="thin"),
    bottom=Side(style="thin"),
)


def generate_excel_template(loai: str) -> io.BytesIO:
    """Sinh file Excel mẫu trực tiếp từ cấu hình DB."""
    loai_str = str(loai).strip().upper()
    if loai_str in ("DI", "VANBANDI"):
        norm_loai = LoaiVanBan.DI
    elif loai_str in ("MAT", "VANBANMAT"):
        norm_loai = LoaiVanBan.MAT
    else:
        norm_loai = LoaiVanBan.DEN

    columns = EXCEL_COLUMNS.get(norm_loai, EXCEL_COLUMNS[LoaiVanBan.DEN])
    sample = SAMPLE_DATA.get(norm_loai, SAMPLE_DATA[LoaiVanBan.DEN])

    wb = Workbook()
    ws = wb.active
    ws.title = f"Mẫu {dict(LoaiVanBan.choices).get(norm_loai, norm_loai)}"

    ws.row_dimensions[1].height = 28
    for col_idx, (field_name, col_title, col_width) in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col_title)
        cell.font = _header_font
        cell.fill = _header_fill
        cell.alignment = _header_alignment
        cell.border = _thin_border
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = col_width

    ws.row_dimensions[2].height = 22
    for col_idx, (field_name, _, _) in enumerate(columns, start=1):
        val = sample.get(field_name, "")
        cell = ws.cell(row=2, column=col_idx, value=val)
        cell.font = _sample_font
        cell.fill = _sample_fill
        cell.alignment = _cell_alignment
        cell.border = _thin_border

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    wb.close()
    return output


# ═══════════════════════════════════════════════════════════════════
# 5. IMPORT DỮ LIỆU TỪ EXCEL VÀO ĐÚNG MODEL
# ═══════════════════════════════════════════════════════════════════

HEADER_TO_FIELD = {
    "Số, ký hiệu VB": "so_hieu",
    "Số hiệu": "so_hieu",
    "Số ký hiệu": "so_hieu",
    "Ngày đến": "ngay_den",
    "Ngày ban hành": "ngay_ban_hanh",
    "Ngày văn bản": "ngay_van_ban",
    "Trích yếu nội dung": "trich_yeu",
    "Trích yếu": "trich_yeu",
    "Nơi ban hành": "noi_ban_hanh",
    "Người ký": "nguoi_ky",
    "Chức vụ": "chuc_vu",
    "Hiệu lực": "hieu_luc",
    "Ghi chú": "ghi_chu",
    "Link văn bản thay thế": "link_thay_the",
}


def _parse_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return timezone.make_aware(value)
        return value
    text = str(value).strip()
    for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(text, fmt)
            return timezone.make_aware(dt)
        except ValueError:
            continue
    return None


def _parse_hieu_luc(value):
    if value is None:
        return HieuLuc.CON_HIEU_LUC
    text = str(value).strip().upper()
    mapping = {
        "CON_HIEU_LUC": HieuLuc.CON_HIEU_LUC,
        "CÒN HIỆU LỰC": HieuLuc.CON_HIEU_LUC,
        "HET_HIEU_LUC": HieuLuc.HET_HIEU_LUC,
        "HẾT HIỆU LỰC": HieuLuc.HET_HIEU_LUC,
        "HET_VA_THAY_THE": HieuLuc.HET_VA_THAY_THE,
        "HẾT HIỆU LỰC VÀ THAY THẾ": HieuLuc.HET_VA_THAY_THE,
    }
    return mapping.get(text, HieuLuc.CON_HIEU_LUC)


def import_from_excel(file_obj, loai: str, user) -> dict:
    """Import dữ liệu văn bản từ file Excel vào đúng model tương ứng."""
    loai_str = str(loai).strip().upper()
    model = get_document_model(loai_str)

    wb = load_workbook(file_obj, read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return {"created": 0, "errors": [{"row": 0, "message": "File không có dữ liệu."}]}

    header_row = rows[0]
    col_map = {}
    for col_idx, header_value in enumerate(header_row):
        if header_value and str(header_value).strip() in HEADER_TO_FIELD:
            col_map[col_idx] = HEADER_TO_FIELD[str(header_value).strip()]

    if not col_map:
        return {
            "created": 0,
            "errors": [{"row": 1, "message": "Không nhận diện được cột. Vui lòng dùng file mẫu."}],
        }

    created_count = 0
    errors = []

    for row_idx, row_data in enumerate(rows[1:], start=2):
        row_text = " ".join(str(v) for v in row_data if v)
        if "xóa trước khi import" in row_text.lower():
            continue
        if not any(v for v in row_data):
            continue

        doc_data = {"nguoi_tao": user}

        for col_idx, field_name in col_map.items():
            value = row_data[col_idx] if col_idx < len(row_data) else None

            if field_name in ("ngay_den", "ngay_ban_hanh", "ngay_van_ban"):
                doc_data[field_name] = _parse_date(value)
            elif field_name == "hieu_luc":
                doc_data[field_name] = _parse_hieu_luc(value)
            else:
                doc_data[field_name] = str(value).strip() if value else ""

        if not doc_data.get("trich_yeu"):
            errors.append({"row": row_idx, "message": "Thiếu trích yếu nội dung."})
            continue

        if not doc_data.get("so_hieu"):
            errors.append({"row": row_idx, "message": "Thiếu số, ký hiệu văn bản."})
            continue

        nam = doc_data.get("nam", timezone.now().year)
        if "nam" not in doc_data:
            doc_data["nam"] = nam

        # Sinh số thứ tự nếu không phải VB Mật
        if loai_str not in ("MAT", "VANBANMAT"):
            doc_data["so_thu_tu"] = generate_so_thu_tu(loai_str, nam)
        else:
            doc_data.pop("so_thu_tu", None)

        # Gán ngày mặc định theo loại nếu thiếu
        if loai_str in ("DEN", "VANBANDEN") and not doc_data.get("ngay_den"):
            doc_data["ngay_den"] = timezone.now()
        elif loai_str in ("DI", "VANBANDI") and not doc_data.get("ngay_ban_hanh"):
            doc_data["ngay_ban_hanh"] = timezone.now()

        try:
            model.objects.create(**doc_data)
            created_count += 1
        except Exception as e:
            errors.append({"row": row_idx, "message": str(e)})

    wb.close()
    return {"created": created_count, "errors": errors}


# ═══════════════════════════════════════════════════════════════════
# 6. EXPORT DANH SÁCH RA EXCEL THEO BỘ LỌC
# ═══════════════════════════════════════════════════════════════════

def export_to_excel(queryset, loai: str) -> io.BytesIO:
    """Xuất danh sách văn bản ra file Excel theo bộ lọc hiện tại."""
    loai_str = str(loai).strip().upper()
    if loai_str in ("DI", "VANBANDI"):
        norm_loai = LoaiVanBan.DI
    elif loai_str in ("MAT", "VANBANMAT"):
        norm_loai = LoaiVanBan.MAT
    else:
        norm_loai = LoaiVanBan.DEN

    columns = EXCEL_COLUMNS.get(norm_loai, EXCEL_COLUMNS[LoaiVanBan.DEN])

    wb = Workbook()
    ws = wb.active
    loai_display = dict(LoaiVanBan.choices).get(norm_loai, norm_loai)
    ws.title = f"Danh sách {loai_display}"

    # Cột STT
    stt_cell = ws.cell(row=1, column=1, value="STT")
    stt_cell.font = _header_font
    stt_cell.fill = _header_fill
    stt_cell.alignment = _header_alignment
    stt_cell.border = _thin_border
    ws.column_dimensions["A"].width = 6

    # Cột Số đến/Số đi (nếu không phải Mật)
    col_offset = 2
    if norm_loai != LoaiVanBan.MAT:
        so_label = "Số đến" if norm_loai == LoaiVanBan.DEN else "Số"
        so_cell = ws.cell(row=1, column=2, value=so_label)
        so_cell.font = _header_font
        so_cell.fill = _header_fill
        so_cell.alignment = _header_alignment
        so_cell.border = _thin_border
        ws.column_dimensions["B"].width = 10
        col_offset = 3

    for col_idx, (_, col_title, col_width) in enumerate(columns, start=col_offset):
        cell = ws.cell(row=1, column=col_idx, value=col_title)
        cell.font = _header_font
        cell.fill = _header_fill
        cell.alignment = _header_alignment
        cell.border = _thin_border
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = col_width

    ws.row_dimensions[1].height = 28

    hieu_luc_map = dict(HieuLuc.choices)

    for row_idx, doc in enumerate(queryset, start=2):
        ws.row_dimensions[row_idx].height = 22

        cell_stt = ws.cell(row=row_idx, column=1, value=row_idx - 1)
        cell_stt.font = _cell_font
        cell_stt.alignment = Alignment(horizontal="center", vertical="center")
        cell_stt.border = _thin_border

        if norm_loai != LoaiVanBan.MAT:
            cell_so = ws.cell(row=row_idx, column=2, value=getattr(doc, "so_thu_tu", ""))
            cell_so.font = _cell_font
            cell_so.alignment = Alignment(horizontal="center", vertical="center")
            cell_so.border = _thin_border

        for col_idx, (field_name, _, _) in enumerate(columns, start=col_offset):
            val = getattr(doc, field_name, "")
            if isinstance(val, datetime):
                val = val.strftime("%d/%m/%Y %H:%M" if field_name == "ngay_den" else "%d/%m/%Y")
            elif field_name == "hieu_luc":
                val = hieu_luc_map.get(val, val)
            elif val is None:
                val = ""

            cell = ws.cell(row=row_idx, column=col_idx, value=str(val))
            cell.font = _cell_font
            cell.alignment = _cell_alignment
            cell.border = _thin_border

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    wb.close()
    return output
