"""
Services cho Module Văn Bản — Nguyễn Anh Đô (Backend Service).

Bao gồm:
1. Tự sinh số thứ tự (Số đến / Số đi) an toàn concurrency
2. Sinh file Excel mẫu từ DB (không dùng file tĩnh)
3. Import dữ liệu từ Excel
4. Export danh sách ra Excel theo bộ lọc
"""

import io
from datetime import datetime

from django.db import models, transaction
from django.utils import timezone
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from .models import Document, DocumentAttachment


# ═══════════════════════════════════════════════════════════════════
# 1. TỰ SINH SỐ THỨ TỰ — An toàn concurrency (select_for_update)
# ═══════════════════════════════════════════════════════════════════

def generate_so_thu_tu(loai: str, nam: int) -> int:
    """
    Sinh số thứ tự tự động tăng dần theo năm + loại văn bản.
    An toàn race-condition bằng select_for_update() trong transaction.

    - VB Đến: loai='DEN' → Số đến (1, 2, 3, ...)
    - VB Đi:  loai='DI'  → Số (1, 2, 3, ...)
    - VB Mật: KHÔNG có số thứ tự → trả về None

    Args:
        loai: Loại văn bản ('DEN' hoặc 'DI')
        nam: Năm (VD: 2026)

    Returns:
        Số thứ tự mới (int) hoặc None nếu VB Mật
    """
    if loai == Document.LoaiVanBan.MAT:
        return None

    with transaction.atomic():
        # Lock các bản ghi cùng loại + năm để tránh 2 request
        # cùng lúc tạo ra cùng 1 số
        last = (
            Document.objects
            .select_for_update()
            .filter(loai=loai, nam=nam)
            .aggregate(max_so=models.Max("so_thu_tu"))
        )
        return (last["max_so"] or 0) + 1


# ═══════════════════════════════════════════════════════════════════
# 2. TỰ ĐỘNG CHUYỂN HẾT HIỆU LỰC KHI QUÁ HẠN
# ═══════════════════════════════════════════════════════════════════

def check_and_update_expired_documents() -> int:
    """
    Quét và tự động chuyển trạng thái các văn bản đã tới hoặc quá ngày hết hiệu lực
    sang 'HET_HIEU_LUC'.

    Quy tắc:
    - Chỉ áp dụng cho các văn bản đang có hieu_luc = 'CON_HIEU_LUC'
    - Có ngay_het_hieu_luc không rỗng
    - ngay_het_hieu_luc <= timezone.now()
    - KHÔNG ghi đè các văn bản đang là 'HET_VA_THAY_THE' (đã bị thay thế).

    Returns:
        Số lượng văn bản đã được cập nhật sang HET_HIEU_LUC.
    """
    now = timezone.now()
    updated_count = Document.objects.filter(
        hieu_luc=Document.HieuLuc.CON_HIEU_LUC,
        ngay_het_hieu_luc__isnull=False,
        ngay_het_hieu_luc__lte=now,
    ).update(hieu_luc=Document.HieuLuc.HET_HIEU_LUC)
    return updated_count


# ═══════════════════════════════════════════════════════════════════
# 3. GHI LOG NGƯỜI XEM — Upsert (update_or_create)
# ═══════════════════════════════════════════════════════════════════

def log_document_view(document, user):
    """
    Ghi nhận người dùng đã xem văn bản.
    Nếu đã xem trước đó → cập nhật thời gian xem mới nhất.
    Nếu chưa xem → tạo bản ghi mới.
    """
    from .models import DocumentViewLog

    DocumentViewLog.objects.update_or_create(
        document=document,
        user=user,
        defaults={"viewed_at": timezone.now()},
    )


# ═══════════════════════════════════════════════════════════════════
# 3. EXCEL — Sinh file mẫu từ DB (không dùng file tĩnh)
# ═══════════════════════════════════════════════════════════════════

# Cấu hình cột Excel theo loại văn bản
EXCEL_COLUMNS = {
    Document.LoaiVanBan.DEN: [
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
    Document.LoaiVanBan.DI: [
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
    Document.LoaiVanBan.MAT: [
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

# Dữ liệu mẫu cho dòng ví dụ trong template
SAMPLE_DATA = {
    Document.LoaiVanBan.DEN: {
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
    Document.LoaiVanBan.DI: {
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
    Document.LoaiVanBan.MAT: {
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

# Styles cho Excel
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
    """
    Sinh file Excel mẫu trực tiếp từ cấu hình DB.
    Khớp 100% với CSDL, không bao giờ lo lệch cột.

    File mẫu bao gồm:
    - Dòng 1: Tiêu đề cột (header)
    - Dòng 2: Dòng ví dụ mẫu (in nghiêng, nền vàng nhạt)

    Args:
        loai: Loại văn bản ('DEN', 'DI', 'MAT')

    Returns:
        BytesIO chứa nội dung file Excel (.xlsx)
    """
    columns = EXCEL_COLUMNS.get(loai, EXCEL_COLUMNS[Document.LoaiVanBan.DEN])
    sample = SAMPLE_DATA.get(loai, SAMPLE_DATA[Document.LoaiVanBan.DEN])

    wb = Workbook()
    ws = wb.active

    loai_display = dict(Document.LoaiVanBan.choices).get(loai, loai)
    ws.title = f"Mẫu {loai_display}"

    # ── Header row ──
    for col_idx, (field_name, header_text, width) in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header_text)
        cell.font = _header_font
        cell.fill = _header_fill
        cell.alignment = _header_alignment
        cell.border = _thin_border
        ws.column_dimensions[get_column_letter(col_idx)].width = width

    # ── Sample data row ──
    for col_idx, (field_name, _, _) in enumerate(columns, start=1):
        value = sample.get(field_name, "")
        cell = ws.cell(row=2, column=col_idx, value=value)
        cell.font = _sample_font
        cell.fill = _sample_fill
        cell.alignment = _cell_alignment
        cell.border = _thin_border

    # ── Freeze header row ──
    ws.freeze_panes = "A2"

    # ── Auto-filter ──
    last_col = get_column_letter(len(columns))
    ws.auto_filter.ref = f"A1:{last_col}1"

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


# ═══════════════════════════════════════════════════════════════════
# 4. EXCEL — Import dữ liệu từ file Excel
# ═══════════════════════════════════════════════════════════════════

# Mapping từ tên cột header (tiếng Việt) → field name trong model
HEADER_TO_FIELD = {
    "Số, ký hiệu VB": "so_hieu",
    "Ngày đến": "ngay_den",
    "Ngày ban hành": "ngay_ban_hanh",
    "Ngày văn bản": "ngay_van_ban",
    "Trích yếu nội dung": "trich_yeu",
    "Nơi ban hành": "noi_ban_hanh",
    "Người ký": "nguoi_ky",
    "Chức vụ": "chuc_vu",
    "Hiệu lực": "hieu_luc",
    "Ghi chú": "ghi_chu",
}

# Các định dạng ngày được chấp nhận khi đọc từ Excel
DATE_FORMATS = [
    "%d/%m/%Y %H:%M:%S",
    "%d/%m/%Y %H:%M",
    "%d/%m/%Y",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d",
]


def _parse_date(value):
    """Parse giá trị ngày từ Excel (hỗ trợ cả datetime object và string)."""
    if value is None:
        return None
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return timezone.make_aware(value)
        return value
    text = str(value).strip()
    if not text:
        return None
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(text, fmt)
            return timezone.make_aware(dt)
        except ValueError:
            continue
    return None


def _parse_hieu_luc(value):
    """Parse giá trị hiệu lực từ Excel."""
    if value is None:
        return Document.HieuLuc.CON_HIEU_LUC

    text = str(value).strip().upper()
    # Hỗ trợ cả mã nội bộ và text tiếng Việt
    mapping = {
        "CON_HIEU_LUC": Document.HieuLuc.CON_HIEU_LUC,
        "CÒN HIỆU LỰC": Document.HieuLuc.CON_HIEU_LUC,
        "HET_HIEU_LUC": Document.HieuLuc.HET_HIEU_LUC,
        "HẾT HIỆU LỰC": Document.HieuLuc.HET_HIEU_LUC,
        "HET_VA_THAY_THE": Document.HieuLuc.HET_VA_THAY_THE,
        "HẾT HIỆU LỰC VÀ THAY THẾ": Document.HieuLuc.HET_VA_THAY_THE,
    }
    return mapping.get(text, Document.HieuLuc.CON_HIEU_LUC)


def import_from_excel(file_obj, loai: str, user) -> dict:
    """
    Import dữ liệu văn bản từ file Excel.

    Quy trình:
    1. Đọc file Excel, xác định mapping cột từ header row
    2. Bỏ qua dòng mẫu (có chứa text "xóa trước khi import")
    3. Validate và tạo Document cho từng dòng hợp lệ
    4. Tự sinh so_thu_tu cho mỗi bản ghi (nếu VB Đến/Đi)

    Args:
        file_obj: File Excel (.xlsx) upload
        loai: Loại văn bản ('DEN', 'DI', 'MAT')
        user: User thực hiện import

    Returns:
        dict: {"created": int, "errors": list[dict]}
    """
    wb = load_workbook(file_obj, read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return {"created": 0, "errors": [{"row": 0, "message": "File không có dữ liệu."}]}

    # ── Xác định mapping cột ──
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
        # Bỏ qua dòng mẫu
        row_text = " ".join(str(v) for v in row_data if v)
        if "xóa trước khi import" in row_text.lower():
            continue

        # Bỏ qua dòng trống hoàn toàn
        if not any(v for v in row_data):
            continue

        # ── Xây dựng dữ liệu cho Document ──
        doc_data = {"loai": loai, "nguoi_tao": user}

        for col_idx, field_name in col_map.items():
            if col_idx < len(row_data):
                value = row_data[col_idx]
            else:
                value = None

            if field_name in ("ngay_den", "ngay_ban_hanh", "ngay_van_ban"):
                doc_data[field_name] = _parse_date(value)
            elif field_name == "hieu_luc":
                doc_data[field_name] = _parse_hieu_luc(value)
            else:
                doc_data[field_name] = str(value).strip() if value else ""

        # ── Validate bắt buộc ──
        if not doc_data.get("trich_yeu"):
            errors.append({"row": row_idx, "message": "Thiếu trích yếu nội dung."})
            continue

        if not doc_data.get("so_hieu"):
            errors.append({"row": row_idx, "message": "Thiếu số, ký hiệu văn bản."})
            continue

        # ── Tự sinh số thứ tự ──
        nam = doc_data.get("nam", timezone.now().year)
        if "nam" not in doc_data:
            doc_data["nam"] = nam
        doc_data["so_thu_tu"] = generate_so_thu_tu(loai, nam)

        # ── Tạo Document ──
        try:
            Document.objects.create(**doc_data)
            created_count += 1
        except Exception as e:
            errors.append({"row": row_idx, "message": str(e)})

    wb.close()
    return {"created": created_count, "errors": errors}


# ═══════════════════════════════════════════════════════════════════
# 5. EXCEL — Export danh sách ra Excel theo bộ lọc
# ═══════════════════════════════════════════════════════════════════

def export_to_excel(queryset, loai: str) -> io.BytesIO:
    """
    Xuất danh sách văn bản ra file Excel theo bộ lọc hiện tại.

    Args:
        queryset: QuerySet đã được filter
        loai: Loại văn bản để xác định cấu hình cột

    Returns:
        BytesIO chứa nội dung file Excel (.xlsx)
    """
    columns = EXCEL_COLUMNS.get(loai, EXCEL_COLUMNS[Document.LoaiVanBan.DEN])

    wb = Workbook()
    ws = wb.active

    loai_display = dict(Document.LoaiVanBan.choices).get(loai, loai)
    ws.title = f"Danh sách {loai_display}"

    # ── Cột STT ──
    stt_cell = ws.cell(row=1, column=1, value="STT")
    stt_cell.font = _header_font
    stt_cell.fill = _header_fill
    stt_cell.alignment = _header_alignment
    stt_cell.border = _thin_border
    ws.column_dimensions["A"].width = 6

    # ── Cột Số đến/Số (nếu không phải Mật) ──
    col_offset = 2
    if loai != Document.LoaiVanBan.MAT:
        so_label = "Số đến" if loai == Document.LoaiVanBan.DEN else "Số"
        so_cell = ws.cell(row=1, column=2, value=so_label)
        so_cell.font = _header_font
        so_cell.fill = _header_fill
        so_cell.alignment = _header_alignment
        so_cell.border = _thin_border
        ws.column_dimensions["B"].width = 10
        col_offset = 3

    # ── Header các cột còn lại ──
    for idx, (field_name, header_text, width) in enumerate(columns, start=col_offset):
        cell = ws.cell(row=1, column=idx, value=header_text)
        cell.font = _header_font
        cell.fill = _header_fill
        cell.alignment = _header_alignment
        cell.border = _thin_border
        ws.column_dimensions[get_column_letter(idx)].width = width

    # ── Data rows ──
    for row_idx, doc in enumerate(queryset, start=2):
        # STT
        stt = ws.cell(row=row_idx, column=1, value=row_idx - 1)
        stt.font = _cell_font
        stt.alignment = Alignment(horizontal="center", vertical="center")
        stt.border = _thin_border

        # Số đến/Số
        data_col = 2
        if loai != Document.LoaiVanBan.MAT:
            so = ws.cell(row=row_idx, column=2, value=doc.so_thu_tu)
            so.font = _cell_font
            so.alignment = Alignment(horizontal="center", vertical="center")
            so.border = _thin_border
            data_col = 3

        # Các cột dữ liệu
        for idx, (field_name, _, _) in enumerate(columns, start=data_col):
            value = getattr(doc, field_name, "")

            # Format datetime thành string đọc được
            if isinstance(value, datetime):
                value = value.strftime("%d/%m/%Y %H:%M")
            elif hasattr(value, "strftime"):
                value = value.strftime("%d/%m/%Y")

            # Hiệu lực: hiển thị label tiếng Việt
            if field_name == "hieu_luc":
                value = doc.get_hieu_luc_display()

            cell = ws.cell(row=row_idx, column=idx, value=value)
            cell.font = _cell_font
            cell.alignment = _cell_alignment
            cell.border = _thin_border

    # ── Freeze header ──
    ws.freeze_panes = "A2"

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output
