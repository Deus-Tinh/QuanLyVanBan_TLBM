r"""
Script seed dữ liệu mẫu Biểu mẫu văn bản kèm TỆP ĐÍNH KÈM THẬT (Excel, Word, PDF)
phục vụ Xem trước (Preview), Tải về (Download) và Quản lý trên Dashboard/Kho tài liệu.

Cách chạy:
    python backend/seed_templates.py
hoặc:
    cd backend && python seed_templates.py
"""
import io
import os
import sys
from datetime import date
from pathlib import Path

# Đảm bảo import đúng cấu hình Django từ thư mục backend
BASE_DIR = Path(__file__).resolve().parent
if (BASE_DIR / "backend").exists():
    backend_dir = BASE_DIR / "backend"
else:
    backend_dir = BASE_DIR

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if (backend_dir / "apps").exists() and str(backend_dir / "apps") not in sys.path:
    sys.path.insert(0, str(backend_dir / "apps"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db.models import Max
from document_storage import get_document_storage
from document_templates.models import (
    DanhMucTaiLieu,
    LoaiTaiLieu,
    TaiLieuChiTiet,
    ChiTietTaiLieuAttachment,
)

# Thư viện sinh tệp
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Đăng ký font tiếng Việt chuẩn cho ReportLab
def register_vietnamese_fonts():
    font_candidates = [
        ("Arial", "C:/Windows/Fonts/arial.ttf", "Arial-Bold", "C:/Windows/Fonts/arialbd.ttf", "Arial-Italic", "C:/Windows/Fonts/ariali.ttf"),
        ("Times", "C:/Windows/Fonts/times.ttf", "Times-Bold", "C:/Windows/Fonts/timesbd.ttf", "Times-Italic", "C:/Windows/Fonts/timesi.ttf"),
    ]
    registered = False
    for regular_name, regular_path, bold_name, bold_path, italic_name, italic_path in font_candidates:
        if os.path.exists(regular_path) and os.path.exists(bold_path):
            try:
                pdfmetrics.registerFont(TTFont("VNFont", regular_path))
                pdfmetrics.registerFont(TTFont("VNFont-Bold", bold_path))
                if os.path.exists(italic_path):
                    pdfmetrics.registerFont(TTFont("VNFont-Italic", italic_path))
                else:
                    pdfmetrics.registerFont(TTFont("VNFont-Italic", regular_path))
                registered = True
                break
            except Exception as e:
                print(f"  [Lưu ý font] Không đăng ký được {regular_name}: {e}")
    if not registered:
        # Fallback sang Helvetica chuẩn
        pass

register_vietnamese_fonts()


# ==============================================================================
# 1. HÀM SINH TỆP EXCEL: BM-01 (Giấy đề nghị thanh toán tạm ứng & công tác phí)
# ==============================================================================
def generate_bm01_tckt_excel() -> bytes:
    wb = openpyxl.Workbook()

    # --- Sheet 1: Giấy đề nghị thanh toán ---
    ws1 = wb.active
    ws1.title = "Đề nghị thanh toán"
    ws1.views.sheetView[0].showGridLines = True

    # Styling constants
    navy_fill = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid")
    soft_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    total_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    header_font = Font(name="Arial", size=10, bold=True, color="FFFFFF")
    title_font = Font(name="Arial", size=15, bold=True, color="1B365D")
    company_font = Font(name="Arial", size=10, bold=True, color="0F172A")
    bold_font = Font(name="Arial", size=10, bold=True)
    normal_font = Font(name="Arial", size=10)
    italic_font = Font(name="Arial", size=9, italic=True)

    thin_border = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="thin", color="CBD5E1"),
    )
    double_bottom_border = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="double", color="1B365D"),
    )

    # Header công ty
    ws1["A1"] = "TỔNG CÔNG TY CỔ PHẦN BẢO HIỂM BẢO LONG"
    ws1["A1"].font = company_font
    ws1["A2"] = "BAN TÀI CHÍNH - KẾ TOÁN"
    ws1["A2"].font = italic_font

    ws1["F1"] = "Mẫu số: BM-01/TCKT"
    ws1["F1"].font = Font(name="Arial", size=9, bold=True)
    ws1["F1"].alignment = Alignment(horizontal="right")
    ws1["F2"] = "Ban hành theo QĐ số 15/2026/QĐ-BL"
    ws1["F2"].font = italic_font
    ws1["F2"].alignment = Alignment(horizontal="right")

    # Tiêu đề
    ws1.merge_cells("A4:G4")
    ws1["A4"] = "GIẤY ĐỀ NGHỊ THANH TOÁN TẠM ỨNG & CÔNG TÁC PHÍ"
    ws1["A4"].font = title_font
    ws1["A4"].alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[4].height = 28

    ws1.merge_cells("A5:G5")
    ws1["A5"] = "Số phiếu: TT-2026/01-088  |  Ngày lập: 15/01/2026"
    ws1["A5"].font = italic_font
    ws1["A5"].alignment = Alignment(horizontal="center")

    # Thông tin người đề nghị
    info_rows = [
        ("Họ và tên người đề nghị:", "Nguyễn Văn An", "Mã nhân viên:", "BL-0412"),
        ("Chức vụ:", "Chuyên viên Giám định Bồi thường", "Bộ phận/Ban:", "Khối Giám định Bồi thường"),
        ("Tài khoản thụ hưởng:", "0071001234567 tại Vietcombank - CN TP.HCM", "Mục đích:", "Công tác giám định tổn thất tàu biển tại Đà Nẵng"),
    ]
    cur_r = 7
    for label1, val1, label2, val2 in info_rows:
        ws1.cell(row=cur_r, column=1, value=label1).font = bold_font
        ws1.cell(row=cur_r, column=2, value=val1).font = normal_font
        ws1.cell(row=cur_r, column=5, value=label2).font = bold_font
        ws1.cell(row=cur_r, column=6, value=val2).font = normal_font
        cur_r += 1

    # Bảng chi tiết
    cur_r = 11
    headers = ["STT", "Nội dung chi phí", "Số HĐ / Chứng từ", "Ngày HĐ", "Đơn vị cung cấp", "Số tiền (VNĐ)", "Ghi chú"]
    ws1.row_dimensions[cur_r].height = 24
    for c_idx, h_text in enumerate(headers, start=1):
        cell = ws1.cell(row=cur_r, column=c_idx, value=h_text)
        cell.fill = navy_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    data_rows = [
        (1, "Vé máy bay khứ hồi TP.HCM - Đà Nẵng", "VN-892104", "10/01/2026", "Vietnam Airlines", 3250000, "Hạng Phổ thông linh hoạt"),
        (2, "Khách sạn Novotel Danang Premier (3 đêm)", "HD-003418", "13/01/2026", "Novotel Danang", 4500000, "Định mức 1.500.000đ/đêm"),
        (3, "Thuê xe di chuyển hiện trường Cảng Tiên Sa", "HD-881290", "12/01/2026", "Taxi Mai Linh Đà Nẵng", 1200000, "Khảo sát tàu hàng tổn thất"),
        (4, "Phụ cấp lưu trú & công tác phí (3 ngày)", "QD-15/TCKT", "10/01/2026", "Bảo Long Insurance", 900000, "Định mức 300.000đ/ngày"),
        (5, "Chi phí tiếp đón chuyên gia giám định Crawford", "HD-771235", "12/01/2026", "Nhà hàng Hải Cảng", 2150000, "Họp thống nhất biên bản tổn thất"),
    ]

    start_data_row = cur_r + 1
    for r_data in data_rows:
        cur_r += 1
        ws1.row_dimensions[cur_r].height = 20
        for c_idx, val in enumerate(r_data, start=1):
            cell = ws1.cell(row=cur_r, column=c_idx, value=val)
            cell.font = normal_font
            cell.border = thin_border
            if c_idx == 1:
                cell.alignment = Alignment(horizontal="center")
            elif c_idx == 4:
                cell.alignment = Alignment(horizontal="center")
            elif c_idx == 6:
                cell.alignment = Alignment(horizontal="right")
                cell.number_format = "#,##0"

    end_data_row = cur_r

    # Tổng cộng chi phí phát sinh
    cur_r += 1
    ws1.merge_cells(start_row=cur_r, start_column=1, end_row=cur_r, end_column=5)
    ws1.cell(row=cur_r, column=1, value="CỘNG CHI PHÍ THỰC TẾ PHÁT SINH (I)").font = bold_font
    ws1.cell(row=cur_r, column=1).alignment = Alignment(horizontal="right")
    sum_cell = ws1.cell(row=cur_r, column=6, value=f"=SUM(F{start_data_row}:F{end_data_row})")
    sum_cell.font = bold_font
    sum_cell.number_format = "#,##0"
    sum_cell.fill = total_fill
    for col in range(1, 8):
        ws1.cell(row=cur_r, column=col).border = thin_border

    # Số tiền đã tạm ứng
    cur_r += 1
    ws1.merge_cells(start_row=cur_r, start_column=1, end_row=cur_r, end_column=5)
    ws1.cell(row=cur_r, column=1, value="Số tiền đã tạm ứng trước theo Phiếu chi PC-0412 (II)").font = normal_font
    ws1.cell(row=cur_r, column=1).alignment = Alignment(horizontal="right")
    tam_ung_cell = ws1.cell(row=cur_r, column=6, value=10000000)
    tam_ung_cell.font = normal_font
    tam_ung_cell.number_format = "#,##0"
    for col in range(1, 8):
        ws1.cell(row=cur_r, column=col).border = thin_border

    # Số tiền thực thanh toán thêm
    cur_r += 1
    ws1.merge_cells(start_row=cur_r, start_column=1, end_row=cur_r, end_column=5)
    ws1.cell(row=cur_r, column=1, value="SỐ TIỀN THỰC THANH TOÁN THÊM CHO NHÂN VIÊN (III = I - II)").font = Font(name="Arial", size=10, bold=True, color="1B365D")
    ws1.cell(row=cur_r, column=1).alignment = Alignment(horizontal="right")
    diff_cell = ws1.cell(row=cur_r, column=6, value=f"=F{cur_r-2}-F{cur_r-1}")
    diff_cell.font = Font(name="Arial", size=10, bold=True, color="1B365D")
    diff_cell.number_format = "#,##0"
    diff_cell.fill = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")
    for col in range(1, 8):
        ws1.cell(row=cur_r, column=col).border = double_bottom_border

    # Số tiền bằng chữ
    cur_r += 1
    ws1.merge_cells(start_row=cur_r, start_column=1, end_row=cur_r, end_column=7)
    ws1.cell(row=cur_r, column=1, value="Số tiền đề nghị thanh toán thêm bằng chữ: Hai triệu đồng chẵn.").font = italic_font

    # Chữ ký 4 bên
    cur_r += 3
    sig_titles = [
        ("Người đề nghị thanh toán", 1, 2),
        ("Kế toán thanh toán", 3, 4),
        ("Kế toán trưởng", 5, 5),
        ("Tổng Giám đốc phê duyệt", 6, 7),
    ]
    for title, c_start, c_end in sig_titles:
        if c_start != c_end:
            ws1.merge_cells(start_row=cur_r, start_column=c_start, end_row=cur_r, end_column=c_end)
        cell = ws1.cell(row=cur_r, column=c_start, value=title)
        cell.font = bold_font
        cell.alignment = Alignment(horizontal="center")

        sub_cell = ws1.cell(row=cur_r+1, column=c_start, value="(Ký, ghi rõ họ tên)")
        sub_cell.font = italic_font
        sub_cell.alignment = Alignment(horizontal="center")

    # Tên người ký ở cuối
    cur_r += 6
    names = [
        ("Nguyễn Văn An", 1),
        ("Trần Bích Thủy", 3),
        ("Lê Hải Yến", 5),
        ("Nguyễn Thành Trung", 6),
    ]
    for name, c_idx in names:
        cell = ws1.cell(row=cur_r, column=c_idx, value=name)
        cell.font = bold_font
        cell.alignment = Alignment(horizontal="center")

    # Column widths
    col_widths = {1: 7, 2: 40, 3: 18, 4: 15, 5: 25, 6: 22, 7: 28}
    for c_idx, width in col_widths.items():
        ws1.column_dimensions[get_column_letter(c_idx)].width = width

    # --- Sheet 2: Định mức công tác phí nội bộ ---
    ws2 = wb.create_sheet(title="Định mức công tác phí")
    ws2.views.sheetView[0].showGridLines = True
    ws2["A1"] = "BẢNG ĐỊNH MỨC CÔNG TÁC PHÍ ÁP DỤNG TẠI BẢO LONG INSURANCE"
    ws2["A1"].font = title_font
    ws2["A2"] = "Ban hành theo Quyết định số 15/2026/QĐ-HĐQT ngày 02/01/2026"
    ws2["A2"].font = italic_font

    norm_headers = ["STT", "Cấp bậc / Vị trí", "Tiêu chuẩn Vé máy bay", "Định mức Khách sạn (VNĐ/đêm)", "Phụ cấp lưu trú (VNĐ/ngày)", "Hạn mức tiếp khách"]
    ws2.row_dimensions[4].height = 24
    for c_idx, h_text in enumerate(norm_headers, start=1):
        cell = ws2.cell(row=4, column=c_idx, value=h_text)
        cell.fill = navy_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    norm_data = [
        (1, "Ban Tổng Giám đốc", "Hạng Thương gia (Business)", 3500000, 800000, "Theo thực tế"),
        (2, "Giám đốc Khối / Trưởng Ban", "Hạng Phổ thông đặc biệt", 2200000, 500000, "15.000.000 VNĐ / vụ việc"),
        (3, "Trưởng phòng / Trưởng nhóm", "Hạng Phổ thông tiêu chuẩn", 1600000, 350000, "8.000.000 VNĐ / vụ việc"),
        (4, "Chuyên viên / Giám định viên", "Hạng Phổ thông tiêu chuẩn", 1500000, 300000, "5.000.000 VNĐ / vụ việc"),
    ]
    for r_idx, r_vals in enumerate(norm_data, start=5):
        for c_idx, val in enumerate(r_vals, start=1):
            cell = ws2.cell(row=r_idx, column=c_idx, value=val)
            cell.font = normal_font
            cell.border = thin_border
            if c_idx in [1]:
                cell.alignment = Alignment(horizontal="center")
            elif c_idx in [4, 5] and isinstance(val, (int, float)):
                cell.alignment = Alignment(horizontal="right")
                cell.number_format = "#,##0"

    norm_widths = {1: 7, 2: 28, 3: 26, 4: 28, 5: 28, 6: 28}
    for c_idx, width in norm_widths.items():
        ws2.column_dimensions[get_column_letter(c_idx)].width = width

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ==============================================================================
# 2. HÀM SINH TỆP WORD: BM-02 (Tờ trình phê duyệt chủ trương và kế hoạch công tác)
# ==============================================================================
def set_docx_cell_bg(cell, hex_color: str):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def generate_bm02_vp_docx() -> bytes:
    doc = docx.Document()

    # Thiết lập lề trang
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(0.8)

    # Header bảng 2 cột
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False

    cell_left = header_table.cell(0, 0)
    cell_right = header_table.cell(0, 1)

    p_l = cell_left.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_l.add_run("TỔNG CÔNG TY CP BẢO HIỂM BẢO LONG\n")
    r1.bold = True
    r1.font.size = Pt(10)
    r2 = p_l.add_run("VĂN PHÒNG TỔNG CÔNG TY\n")
    r2.bold = True
    r2.font.size = Pt(10)
    r3 = p_l.add_run("Số: 28/TTr-VP")
    r3.italic = True
    r3.font.size = Pt(9.5)

    p_r = cell_right.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r4 = p_r.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    r4.bold = True
    r4.font.size = Pt(10)
    r5 = p_r.add_run("Độc lập - Tự do - Hạnh phúc\n")
    r5.bold = True
    r5.font.size = Pt(10)
    r6 = p_r.add_run("---------------o0o---------------\n")
    r6.font.size = Pt(8)
    r7 = p_r.add_run("TP. Hồ Chí Minh, ngày 14 tháng 01 năm 2026")
    r7.italic = True
    r7.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Tiêu đề
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("TỜ TRÌNH\n")
    r_title.bold = True
    r_title.font.size = Pt(15)
    r_title.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    r_sub = p_title.add_run("V/v Phê duyệt Chủ trương và Kế hoạch công tác khảo sát,\nmở rộng mạng lưới kinh doanh bảo hiểm Q1/2026")
    r_sub.bold = True
    r_sub.italic = True
    r_sub.font.size = Pt(11)

    p_kinh_gui = doc.add_paragraph()
    p_kinh_gui.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_kg = p_kinh_gui.add_run("Kính gửi: BAN TỔNG GIÁM ĐỐC TỔNG CÔNG TY")
    r_kg.bold = True
    r_kg.font.size = Pt(11)

    # Căn cứ
    can_cu = [
        "Căn cứ Chiến lược phát triển kinh doanh giai đoạn 2026 - 2030 của Tổng Công ty Cổ phần Bảo hiểm Bảo Long;",
        "Căn cứ Nghị quyết số 02/2026/NQ-HĐQT về việc phê duyệt chỉ tiêu kế hoạch kinh doanh và mở rộng kênh phân phối năm 2026;",
        "Căn cứ nhu cầu khảo sát thực tế thị trường bảo hiểm tài sản - kỹ thuật và bảo hiểm xe cơ giới tại khu vực Duyên hải Miền Trung & Tây Nguyên;",
    ]
    for cc in can_cu:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(f"- {cc}")
        r.italic = True
        r.font.size = Pt(10)

    # Nội dung
    doc.add_paragraph("Văn phòng Tổng Công ty kính trình Ban Tổng Giám đốc xem xét và phê duyệt nội dung công tác cụ thể như sau:", style="Normal")

    # Mục I
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(8)
    r1 = p1.add_run("I. MỤC TIÊU VÀ SỰ CẦN THIẾT CỦA ĐỢT CÔNG TÁC")
    r1.bold = True
    r1.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph(
        "1. Khảo sát thực địa tiềm năng thị trường bảo hiểm công nghiệp tại các Khu kinh tế mở Chu Lai, Dung Quất và các cảng biển miền Trung.\n"
        "2. Đánh giá chất lượng dịch vụ và mạng lưới garage liên kết phục vụ công tác giám định, bồi thường xe cơ giới tại Chi nhánh Đà Nẵng và Gia Lai.\n"
        "3. Làm việc trực tiếp với các đối tác ngân hàng (Bancassurance) trên địa bàn để xúc tiến ký kết thỏa thuận hợp tác phân phối sản phẩm mới."
    )

    # Mục II: Lịch trình
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(8)
    r2 = p2.add_run("II. LỊCH TRÌNH VÀ THÀNH PHẦN ĐOÀN CÔNG TÁC")
    r2.bold = True
    r2.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    t_schedule = doc.add_table(rows=5, cols=5)
    t_schedule.alignment = WD_TABLE_ALIGNMENT.CENTER
    sched_headers = ["Thời gian", "Địa bàn", "Đơn vị làm việc", "Nội dung công tác chính", "Nhân sự phụ trách"]
    for c_idx, h in enumerate(sched_headers):
        cell = t_schedule.cell(0, c_idx)
        cell.text = h
        set_docx_cell_bg(cell, "1B365D")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    sched_rows = [
        ("20/01/2026", "Đà Nẵng", "Chi nhánh Đà Nẵng & BIDV CN Sông Hàn", "Họp triển khai kinh doanh Bancas; kiểm tra công tác bồi thường", "Đ/c Nguyễn Văn An"),
        ("21/01/2026", "Quảng Nam", "Ban Quản lý KKT Mở Chu Lai", "Tiếp xúc doanh nghiệp FDI trong KCN; chào phí bảo hiểm tài sản", "Đ/c Trần Thị Mai Lan"),
        ("22/01/2026", "Quảng Ngãi", "KCN VSIP & KKT Dung Quất", "Khảo sát thực địa cụm nhà máy đóng tàu và lọc hóa dầu", "Đ/c Lê Quốc Tuấn"),
        ("23/01/2026", "TP.HCM", "Văn phòng Tổng Công ty", "Tổng hợp biên bản làm việc và lập báo cáo kết quả trình Ban TGĐ", "Toàn đoàn"),
    ]
    for r_idx, r_data in enumerate(sched_rows, start=1):
        for c_idx, val in enumerate(r_data):
            cell = t_schedule.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.size = Pt(9)
            if c_idx in [0, 1]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Mục III: Dự toán kinh phí
    p3 = doc.add_paragraph()
    p3.paragraph_format.space_before = Pt(10)
    r3 = p3.add_run("III. DỰ TOÁN KINH PHÍ CÔNG TÁC (TẠM TÍNH)")
    r3.bold = True
    r3.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    t_cost = doc.add_table(rows=5, cols=4)
    t_cost.alignment = WD_TABLE_ALIGNMENT.CENTER
    cost_headers = ["STT", "Khoản mục chi phí", "Cách tính / Định mức", "Thành tiền (VNĐ)"]
    for c_idx, h in enumerate(cost_headers):
        cell = t_cost.cell(0, c_idx)
        cell.text = h
        set_docx_cell_bg(cell, "1B365D")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    cost_data = [
        ("1", "Vé máy bay khứ hồi (03 cán bộ)", "3 người x 3.200.000 VNĐ", "9.600.000"),
        ("2", "Khách sạn lưu trú (03 đêm, 02 phòng)", "2 phòng x 3 đêm x 1.400.000 VNĐ", "8.400.000"),
        ("3", "Thuê xe ô tô di chuyển liên tỉnh Chu Lai - Dung Quất", "Trọn gói 03 ngày làm việc", "6.500.000"),
        ("4", "Phụ cấp lưu trú & tiếp đón đối tác xúc tiến", "Theo định mức quy chế tài chính", "7.500.000"),
    ]
    for r_idx, r_data in enumerate(cost_data, start=1):
        for c_idx, val in enumerate(r_data):
            cell = t_cost.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.size = Pt(9)
            if c_idx in [0]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif c_idx in [3]:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    p_sum = doc.add_paragraph()
    p_sum.paragraph_format.space_before = Pt(6)
    r_sum = p_sum.add_run("Tổng dự toán kinh phí đề xuất: 32.000.000 VNĐ (Ba mươi hai triệu đồng chẵn).")
    r_sum.bold = True

    # Mục IV: Kiến nghị
    p4 = doc.add_paragraph()
    p4.paragraph_format.space_before = Pt(8)
    r4 = p4.add_run("IV. KIẾN NGHỊ VÀ ĐỀ XUẤT")
    r4.bold = True
    r4.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph(
        "Kính trình Ban Tổng Giám đốc xem xét:\n"
        "1. Chấp thuận chủ trương và kế hoạch công tác theo lịch trình nêu trên.\n"
        "2. Giao Ban Tài chính - Kế toán làm thủ tục tạm ứng kinh phí công tác theo quy định.\n"
        "Kính trình Ban Tổng Giám đốc xem xét, quyết định."
    )

    # Chữ ký
    doc.add_paragraph().paragraph_format.space_before = Pt(14)
    sig_table = doc.add_table(rows=1, cols=3)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_titles = [
        ("NGƯỜI LẬP TỜ TRÌNH", "(Ký, họ tên)\n\n\n\n\nLê Quốc Tuấn"),
        ("CHÁNH VĂN PHÒNG", "(Ký, họ tên)\n\n\n\n\nNguyễn Thị Thu Hà"),
        ("TỔNG GIÁM ĐỐC PHÊ DUYỆT", "(Ký, đóng dấu)\n\n\n\n\nNguyễn Thành Trung"),
    ]
    for c_idx, (t1, t2) in enumerate(sig_titles):
        cell = sig_table.cell(0, c_idx)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_t1 = p.add_run(t1 + "\n")
        r_t1.bold = True
        r_t1.font.size = Pt(10)
        r_t2 = p.add_run(t2)
        r_t2.font.size = Pt(9.5)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ==============================================================================
# 3. HÀM SINH TỆP WORD: BM-03 (Đơn xin nghỉ phép và bàn giao công việc)
# ==============================================================================
def generate_bm03_ns_docx() -> bytes:
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(0.8)

    # Header
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    p_l = ht.cell(0, 0).paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_l.add_run("TỔNG CÔNG TY CP BẢO HIỂM BẢO LONG\n")
    r1.bold = True
    r1.font.size = Pt(10)
    r2 = p_l.add_run("BAN QUẢN TRỊ NGUỒN NHÂN LỰC\n")
    r2.bold = True
    r2.font.size = Pt(10)
    r3 = p_l.add_run("Mã biểu mẫu: BM-03/NS")
    r3.italic = True
    r3.font.size = Pt(9)

    p_r = ht.cell(0, 1).paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_r.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n").bold = True
    p_r.add_run("Độc lập - Tự do - Hạnh phúc\n").bold = True
    p_r.add_run("---------------------\n").font.size = Pt(8)
    r_date = p_r.add_run("TP. Hồ Chí Minh, ngày 18 tháng 01 năm 2026")
    r_date.italic = True
    r_date.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Tiêu đề
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t = p_title.add_run("ĐƠN XIN NGHỈ PHÉP\nVÀ BIÊN BẢN BÀN GIAO CÔNG VIỆC\n")
    r_t.bold = True
    r_t.font.size = Pt(15)
    r_t.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_kg = doc.add_paragraph()
    p_kg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_kg = p_kg.add_run("Kính gửi:  - BAN TỔNG GIÁM ĐỐC\n- BAN QUẢN TRỊ NGUỒN NHÂN LỰC\n- TRƯỞNG PHÒNG / BỘ PHẬN TRỰC TIẾP")
    r_kg.bold = True
    r_kg.font.size = Pt(10.5)

    # Thông tin nhân viên
    doc.add_paragraph().paragraph_format.space_before = Pt(6)
    doc.add_paragraph("Tôi tên là:  Lê Quốc Tuấn                    Mã nhân viên:  BL-0388")
    doc.add_paragraph("Chức vụ:     Chuyên viên Phân tích Dữ liệu  Phòng/Ban:     Khối Công nghệ Thông tin")
    doc.add_paragraph("Điện thoại liên hệ khi cần thiết: 0908.123.456  -  Email: tuan.lq@baolong.vn")

    # Mục I: Đề nghị nghỉ phép
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(10)
    r1 = p1.add_run("I. NỘI DUNG XIN NGHỈ PHÉP")
    r1.bold = True
    r1.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph(
        "- Thời gian xin nghỉ: Từ ngày 26/01/2026 đến hết ngày 30/01/2026 (Tổng cộng: 05 ngày làm việc).\n"
        "- Loại nghỉ phép: [ X ] Phép năm 2026     [   ] Việc riêng có hưởng lương     [   ] Nghỉ không hưởng lương\n"
        "- Lý do xin nghỉ: Giải quyết việc gia đình kết hợp nghỉ phép theo chế độ thường niên."
    )

    # Mục II: Bàn giao công việc
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(8)
    r2 = p2.add_run("II. BIÊN BẢN BÀN GIAO CÔNG VIỆC VÀ TÀI LIỆU")
    r2.bold = True
    r2.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph("Trong thời gian nghỉ phép, tôi đã bàn giao đầy đủ các công việc đang phụ trách cho đồng nghiệp:")

    t_bg = doc.add_table(rows=4, cols=5)
    t_bg.alignment = WD_TABLE_ALIGNMENT.CENTER
    bg_headers = ["STT", "Nội dung công việc bàn giao", "Tiến độ hiện tại", "Người nhận bàn giao", "Ghi chú / Tài liệu đính kèm"]
    for c_idx, h in enumerate(bg_headers):
        cell = t_bg.cell(0, c_idx)
        cell.text = h
        set_docx_cell_bg(cell, "1B365D")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    bg_rows = [
        ("1", "Vận hành Dashboard báo cáo kinh doanh Q1", "Đã hoàn thành 90%, đã kiểm thử số liệu", "Nguyễn Hoàng Nam", "Tài liệu hướng dẫn trong thư mục chung"),
        ("2", "Xử lý các sự cố đồng bộ dữ liệu Core TLBM", "Đang trực vận hành bình thường", "Trần Minh Hoàng", "Quyền Admin dự phòng đã kích hoạt"),
        ("3", "Báo cáo tiến độ tuần dự án AI OCR", "Đã nộp bản dự thảo thứ 2", "Nguyễn Thị Mai", "Chờ phản hồi từ Ban Giám đốc"),
    ]
    for r_idx, r_data in enumerate(bg_rows, start=1):
        for c_idx, val in enumerate(r_data):
            cell = t_bg.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.size = Pt(9)
            if c_idx in [0]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Cam kết
    doc.add_paragraph().paragraph_format.space_before = Pt(8)
    doc.add_paragraph(
        "Tôi cam kết đã bàn giao rõ ràng, minh bạch và chịu trách nhiệm về các nội dung công việc trước thời điểm nghỉ phép. "
        "Trong trường hợp khẩn cấp, tôi sẵn sàng hỗ trợ đồng nghiệp qua điện thoại hoặc email."
    )

    # Chữ ký 4 bên
    doc.add_paragraph().paragraph_format.space_before = Pt(14)
    sig_table = doc.add_table(rows=1, cols=4)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_titles = [
        ("NGƯỜI LÀM ĐƠN", "(Ký, họ tên)\n\n\n\n\nLê Quốc Tuấn"),
        ("NGƯỜI NHẬN BÀN GIAO", "(Ký, họ tên)\n\n\n\n\nNguyễn Hoàng Nam"),
        ("TRƯỞNG BỘ PHẬN", "(Ký, họ tên)\n\n\n\n\nPhạm Hồng Quân"),
        ("BAN NHÂN SỰ DUYỆT", "(Ký, họ tên)\n\n\n\n\nLê Thị Thảo"),
    ]
    for c_idx, (t1, t2) in enumerate(sig_titles):
        cell = sig_table.cell(0, c_idx)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_t1 = p.add_run(t1 + "\n")
        r_t1.bold = True
        r_t1.font.size = Pt(9.5)
        r_t2 = p.add_run(t2)
        r_t2.font.size = Pt(9)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ==============================================================================
# 4. HÀM SINH TỆP PDF: BM-04 (Biên bản giám định hiện trường tổn thất xe cơ giới)
# ==============================================================================
def generate_bm04_gd_pdf() -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    font_name = "VNFont" if "VNFont" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
    font_bold = "VNFont-Bold" if "VNFont-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
    font_italic = "VNFont-Italic" if "VNFont-Italic" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Oblique"

    style_title = ParagraphStyle("TitleStyle", fontName=font_bold, fontSize=14, leading=18, alignment=TA_CENTER, textColor=colors.HexColor("#1B365D"))
    style_subtitle = ParagraphStyle("SubTitleStyle", fontName=font_italic, fontSize=9, leading=13, alignment=TA_CENTER)
    style_header_l = ParagraphStyle("HeaderL", fontName=font_bold, fontSize=9, leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#0F172A"))
    style_header_r = ParagraphStyle("HeaderR", fontName=font_bold, fontSize=9, leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#0F172A"))
    style_section = ParagraphStyle("Section", fontName=font_bold, fontSize=10.5, leading=14, textColor=colors.HexColor("#1B365D"))
    style_body = ParagraphStyle("Body", fontName=font_name, fontSize=8.5, leading=12)
    style_bold = ParagraphStyle("BodyBold", fontName=font_bold, fontSize=8.5, leading=12)
    style_tbl_header = ParagraphStyle("TblHdr", fontName=font_bold, fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=colors.white)
    style_tbl_cell = ParagraphStyle("TblCell", fontName=font_name, fontSize=8, leading=11)
    style_tbl_cell_center = ParagraphStyle("TblCellCenter", fontName=font_name, fontSize=8, leading=11, alignment=TA_CENTER)
    style_tbl_cell_right = ParagraphStyle("TblCellRight", fontName=font_name, fontSize=8, leading=11, alignment=TA_RIGHT)
    style_tbl_cell_bold_right = ParagraphStyle("TblCellBoldRight", fontName=font_bold, fontSize=8.5, leading=11, alignment=TA_RIGHT)

    elements = []

    # Header công ty
    hdr_table_data = [
        [
            Paragraph("TỔNG CÔNG TY CP BẢO HIỂM BẢO LONG<br/><b>KHỐI GIÁM ĐỊNH BỒI THƯỜNG</b>", style_header_l),
            Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/><b>Độc lập - Tự do - Hạnh phúc</b>", style_header_r),
        ]
    ]
    hdr_table = Table(hdr_table_data, colWidths=[260, 260])
    hdr_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(hdr_table)
    elements.append(Spacer(1, 8))

    # Tiêu đề
    elements.append(Paragraph("BIÊN BẢN GIÁM ĐỊNH HIỆN TRƯỜNG TỔN THẤT XE CƠ GIỚI", style_title))
    elements.append(Paragraph("Số hồ sơ bồi thường: <b>BL-XE/2026/0189</b>  |  Ngày lập: 16/01/2026", style_subtitle))
    elements.append(Spacer(1, 10))

    # I. Thông tin phương tiện
    elements.append(Paragraph("I. THÔNG TIN CHỦ XE VÀ PHƯƠNG TIỆN BẢO HIỂM", style_section))
    elements.append(Spacer(1, 4))

    vehicle_info = [
        [Paragraph("Chủ xe:", style_bold), Paragraph("Công ty TNHH Vận tải & Thương mại Á Châu", style_body),
         Paragraph("Biển số xe:", style_bold), Paragraph("<b>51H - 892.45</b>", style_body)],
        [Paragraph("Hãng xe / Hiệu:", style_bold), Paragraph("HYUNDAI SANTAFE (Đời 2023)", style_body),
         Paragraph("Số khung:", style_bold), Paragraph("RL4NC2509123891", style_body)],
        [Paragraph("Số GCN Bảo hiểm:", style_bold), Paragraph("BL/XCG/2025/99824", style_body),
         Paragraph("Thời hạn BH:", style_bold), Paragraph("Đến 31/12/2026 (Bảo hiểm 2 chiều)", style_body)],
        [Paragraph("Lái xe lúc xảy ra:", style_bold), Paragraph("Trần Đình Trọng (GPLX: 790123998124)", style_body),
         Paragraph("Điện thoại:", style_bold), Paragraph("0912.888.999", style_body)],
    ]
    t_v = Table(vehicle_info, colWidths=[105, 170, 95, 150])
    t_v.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    elements.append(t_v)
    elements.append(Spacer(1, 8))

    # II. Thời gian, địa điểm, nguyên nhân
    elements.append(Paragraph("II. THỜI GIAN, ĐỊA ĐIỂM VÀ DIỄN BIẾN SỰ CỐ TỔN THẤT", style_section))
    elements.append(Spacer(1, 4))
    desc_p = Paragraph(
        "Vào hồi 14:30 ngày 15/01/2026, tại Ngã tư Mai Chí Thọ - Đồng Văn Cống, TP. Thủ Đức, TP. Hồ Chí Minh. "
        "Xe 51H-892.45 đang lưu thông đúng làn đường quy định thì xe tải phía trước phanh gấp, lái xe đã chủ động phanh giảm tốc "
        "nhưng bị trượt bánh va chạm vào dải phân cách và phần đuôi xe trước. Không có thiệt hại về người. Cơ quan CSGT đã lập biên bản hiện trường.",
        style_body
    )
    elements.append(desc_p)
    elements.append(Spacer(1, 8))

    # III. Bảng chi tiết hạng mục tổn thất
    elements.append(Paragraph("III. CHI TIẾT HẠNG MỤC TỔN THẤT VÀ PHƯƠNG ÁN KHẮC PHỤC", style_section))
    elements.append(Spacer(1, 4))

    damage_headers = [
        Paragraph("STT", style_tbl_header),
        Paragraph("Chi tiết linh kiện / Hạng mục", style_tbl_header),
        Paragraph("Hiện trạng hư hỏng", style_tbl_header),
        Paragraph("Phương án đề xuất", style_tbl_header),
        Paragraph("Đơn giá tạm tính", style_tbl_header),
    ]

    damage_rows = [
        [Paragraph("1", style_tbl_cell_center), Paragraph("Cản trước (Ba-đờ-sốc)", style_tbl_cell), Paragraph("Nứt gãy biến dạng nặng, vỡ tai cài", style_tbl_cell), Paragraph("Thay mới chính hãng", style_tbl_cell), Paragraph("7.800.000 đ", style_tbl_cell_right)],
        [Paragraph("2", style_tbl_cell_center), Paragraph("Cụm đèn pha full LED phụ", style_tbl_cell), Paragraph("Vỡ mặt kính, gãy chân đèn đỡ", style_tbl_cell), Paragraph("Thay mới chính hãng", style_tbl_cell), Paragraph("14.500.000 đ", style_tbl_cell_right)],
        [Paragraph("3", style_tbl_cell_center), Paragraph("Tai xe trước bên phụ", style_tbl_cell), Paragraph("Móp méo biến dạng 40%", style_tbl_cell), Paragraph("Gò nắn phục hồi sơn sấy", style_tbl_cell), Paragraph("2.200.000 đ", style_tbl_cell_right)],
        [Paragraph("4", style_tbl_cell_center), Paragraph("Két nước làm mát động cơ", style_tbl_cell), Paragraph("Thủng móp rò rỉ dung dịch", style_tbl_cell), Paragraph("Thay mới két nước", style_tbl_cell), Paragraph("5.600.000 đ", style_tbl_cell_right)],
        [Paragraph("5", style_tbl_cell_center), Paragraph("Giàn nóng điều hòa ô tô", style_tbl_cell), Paragraph("Cong vênh xì môi chất lạnh", style_tbl_cell), Paragraph("Thay mới giàn nóng", style_tbl_cell), Paragraph("4.200.000 đ", style_tbl_cell_right)],
        [Paragraph("6", style_tbl_cell_center), Paragraph("Nắp ca-pô xe", style_tbl_cell), Paragraph("Móp góc trước bên phụ, trầy xước", style_tbl_cell), Paragraph("Gò nắn phục hồi sơn sấy", style_tbl_cell), Paragraph("2.500.000 đ", style_tbl_cell_right)],
        # Tổng cộng
        [Paragraph("", style_tbl_cell), Paragraph("<b>TỔNG CHI PHÍ KHẮC PHỤC TỔN THẤT (ƯỚC TÍNH)</b>", style_bold), Paragraph("", style_tbl_cell), Paragraph("", style_tbl_cell), Paragraph("<b>36.800.000 đ</b>", style_tbl_cell_bold_right)],
        [Paragraph("", style_tbl_cell), Paragraph("Khấu trừ theo hợp đồng bảo hiểm", style_body), Paragraph("", style_tbl_cell), Paragraph("", style_tbl_cell), Paragraph("500.000 đ", style_tbl_cell_right)],
        [Paragraph("", style_tbl_cell), Paragraph("<b>SỐ TIỀN BẢO HIỂM BẢO LONG BỒI THƯỜNG (TẠM TÍNH)</b>", style_section), Paragraph("", style_tbl_cell), Paragraph("", style_tbl_cell), Paragraph("<b>36.300.000 đ</b>", style_tbl_cell_bold_right)],
    ]

    t_dmg = Table([damage_headers] + damage_rows, colWidths=[25, 145, 140, 115, 95])
    t_dmg.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B365D")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, 6), [colors.white, colors.HexColor("#F8FAFC")]),
        ("BACKGROUND", (0, 7), (-1, 7), colors.HexColor("#FEF3C7")),
        ("BACKGROUND", (0, 9), (-1, 9), colors.HexColor("#D1FAE5")),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    elements.append(t_dmg)
    elements.append(Spacer(1, 8))

    # IV. Kết luận
    elements.append(Paragraph("IV. KẾT LUẬN CỦA GIÁM ĐỊNH VIÊN BẢO LONG", style_section))
    elements.append(Spacer(1, 3))
    conclusion_p = Paragraph(
        "Vụ tổn thất xảy ra trong thời hạn bảo hiểm, nguyên nhân vụ việc thuộc phạm vi bảo hiểm theo Quy tắc Bảo hiểm tự nguyện xe cơ giới "
        "của Bảo Long Insurance. Không phát hiện vi phạm nồng độ cồn, ma túy hay chở quá tải. Đề xuất chuyển xe về Garage Hyundai Sài Gòn để phục hồi theo chuẩn.",
        style_body
    )
    elements.append(conclusion_p)
    elements.append(Spacer(1, 14))

    # Chữ ký 3 bên
    sig_data = [
        [
            Paragraph("<b>ĐẠI DIỆN CHỦ XE / LÁI XE</b><br/><i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/><b>Trần Đình Trọng</b>", style_header_l),
            Paragraph("<b>ĐẠI DIỆN XƯỞNG DỊCH VỤ GARAGE</b><br/><i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/><b>Nguyễn Khắc Tuấn</b>", style_header_l),
            Paragraph("<b>GIÁM ĐỊNH VIÊN BẢO LONG</b><br/><i>(Ký, ghi rõ họ tên)</i><br/><br/><br/><br/><b>Nguyễn Văn An</b>", style_header_r),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[173, 174, 173])
    t_sig.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    elements.append(t_sig)

    doc.build(elements)
    return buf.getvalue()


# ==============================================================================
# 5. HÀM SINH TỆP WORD: BM-05 (Phiếu yêu cầu cấp quyền & thiết bị CNTT)
# ==============================================================================
def generate_bm05_cntt_docx() -> bytes:
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(0.8)

    # Header
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    p_l = ht.cell(0, 0).paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_l.add_run("TỔNG CÔNG TY CP BẢO HIỂM BẢO LONG\n").bold = True
    p_l.add_run("KHỐI CÔNG NGHỆ THÔNG TIN\n").bold = True
    r_bm = p_l.add_run("Mã biểu mẫu: BM-05/CNTT - Lần ban hành: 02")
    r_bm.italic = True
    r_bm.font.size = Pt(8.5)

    p_r = ht.cell(0, 1).paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_r.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n").bold = True
    p_r.add_run("Độc lập - Tự do - Hạnh phúc\n").bold = True
    p_r.add_run("---------------------\n").font.size = Pt(8)
    r_date = p_r.add_run("TP. Hồ Chí Minh, ngày 18 tháng 01 năm 2026")
    r_date.italic = True
    r_date.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Tiêu đề
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t = p_title.add_run("PHIẾU YÊU CẦU CẤP PHÁT THIẾT BỊ\nVÀ QUYỀN TRUY CẬP HỆ THỐNG CNTT\n")
    r_t.bold = True
    r_t.font.size = Pt(14)
    r_t.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_kg = doc.add_paragraph()
    p_kg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_kg.add_run("Kính gửi: Khối Công nghệ Thông tin (Ban IT Helpdesk & Quản trị Hệ thống)").bold = True

    # I. Thông tin nhân sự
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(8)
    r1 = p1.add_run("I. THÔNG TIN NHÂN SỰ ĐỀ NGHỊ")
    r1.bold = True
    r1.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph("Họ và tên cán bộ: Trần Thị Mai Lan               Mã nhân viên: BL-0924")
    doc.add_paragraph("Chức danh:         Chuyên viên Thẩm định Bảo hiểm  Bộ phận:      Ban Nghiệp vụ Bảo hiểm Xe & Tài sản")
    doc.add_paragraph("Ngày bắt đầu làm:  01/02/2026                      Cán bộ quản lý: Phạm Hồng Quân (Trưởng ban)")

    # II. Thiết bị phần cứng
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(8)
    r2 = p2.add_run("II. ĐỀ NGHỊ CẤP THIẾT BỊ PHẦN CỨNG")
    r2.bold = True
    r2.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    t_hw = doc.add_table(rows=4, cols=4)
    t_hw.alignment = WD_TABLE_ALIGNMENT.CENTER
    hw_headers = ["STT", "Danh mục thiết bị", "Cấu hình / Tiêu chuẩn đề xuất", "Số lượng"]
    for c_idx, h in enumerate(hw_headers):
        cell = t_hw.cell(0, c_idx)
        cell.text = h
        set_docx_cell_bg(cell, "1B365D")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    hw_rows = [
        ("1", "Máy tính xách tay (Laptop)", "Dell Latitude 5430 - Core i7 / 16GB RAM / 512GB SSD", "01 máy"),
        ("2", "Màn hình mở rộng (Monitor)", "Dell 24 inch Full HD IPS (kèm cáp HDMI/Type-C)", "01 màn hình"),
        ("3", "Phụ kiện tin học văn phòng", "Chuột không dây Logitech, bàn phím số rời, tai nghe call center", "01 bộ"),
    ]
    for r_idx, r_data in enumerate(hw_rows, start=1):
        for c_idx, val in enumerate(r_data):
            cell = t_hw.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.size = Pt(9)
            if c_idx in [0, 3]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # III. Tài khoản hệ thống
    p3 = doc.add_paragraph()
    p3.paragraph_format.space_before = Pt(8)
    r3 = p3.add_run("III. PHÂN QUYỀN TÀI KHOẢN VÀ PHẦN MỀM NGHIỆP VỤ")
    r3.bold = True
    r3.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph(
        "[ X ] 1. Hộp thư điện tử doanh nghiệp: lan.ttm@baolong.vn (Dung lượng 50GB)\n"
        "[ X ] 2. Phần mềm Quản lý Văn bản & Tài liệu Biểu mẫu (TLBM): Quyền xem, tìm kiếm và tạo lập hồ sơ thẩm định\n"
        "[ X ] 3. Phần mềm Core Insurance: Quyền Thẩm định viên (Underwriter) phân hệ Bảo hiểm Xe cơ giới & Tài sản\n"
        "[ X ] 4. Mạng riêng ảo (VPN Cisco AnyConnect): Truy cập an toàn từ xa khi đi công tác thực địa\n"
        "[   ] 5. Quyền truy cập phòng Server / Thiết bị đặc thù"
    )

    # IV. Cam kết
    p4 = doc.add_paragraph()
    p4.paragraph_format.space_before = Pt(6)
    r4 = p4.add_run("IV. CAM KẾT AN TOÀN THÔNG TIN (ISO/IEC 27001)")
    r4.bold = True
    r4.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph(
        "Tôi cam kết tuyệt đối tuân thủ Quy chế an toàn thông tin của Bảo Long Insurance: Không chia sẻ mật khẩu tài khoản; "
        "không sao chép dữ liệu khách hàng sang thiết bị cá nhân; bảo quản tốt thiết bị được cấp phát."
    )

    # Chữ ký
    doc.add_paragraph().paragraph_format.space_before = Pt(12)
    sig_table = doc.add_table(rows=1, cols=3)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_titles = [
        ("CÁN BỘ ĐỀ NGHỊ", "(Ký, họ tên)\n\n\n\n\nTrần Thị Mai Lan"),
        ("TRƯỞNG PHÒNG DUYỆT", "(Ký, họ tên)\n\n\n\n\nPhạm Hồng Quân"),
        ("IT BÀN GIAO THIẾT BỊ", "(Ký, xác nhận)\n\n\n\n\nNguyễn Minh Trí"),
    ]
    for c_idx, (t1, t2) in enumerate(sig_titles):
        cell = sig_table.cell(0, c_idx)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_t1 = p.add_run(t1 + "\n")
        r_t1.bold = True
        r_t1.font.size = Pt(9.5)
        r_t2 = p.add_run(t2)
        r_t2.font.size = Pt(9)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ==============================================================================
# 6. HÀM SINH TỆP PDF: BM-06 (Giấy yêu cầu bảo hiểm và bảng kê tài sản doanh nghiệp)
# ==============================================================================
def generate_bm06_kd_pdf() -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    font_name = "VNFont" if "VNFont" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
    font_bold = "VNFont-Bold" if "VNFont-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
    font_italic = "VNFont-Italic" if "VNFont-Italic" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Oblique"

    style_title = ParagraphStyle("TitleStyle", fontName=font_bold, fontSize=13.5, leading=17, alignment=TA_CENTER, textColor=colors.HexColor("#1B365D"))
    style_subtitle = ParagraphStyle("SubTitleStyle", fontName=font_italic, fontSize=8.5, leading=12, alignment=TA_CENTER)
    style_header_l = ParagraphStyle("HeaderL", fontName=font_bold, fontSize=9, leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#0F172A"))
    style_header_r = ParagraphStyle("HeaderR", fontName=font_bold, fontSize=9, leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#0F172A"))
    style_section = ParagraphStyle("Section", fontName=font_bold, fontSize=10, leading=13, textColor=colors.HexColor("#1B365D"))
    style_body = ParagraphStyle("Body", fontName=font_name, fontSize=8, leading=11)
    style_bold = ParagraphStyle("BodyBold", fontName=font_bold, fontSize=8, leading=11)
    style_tbl_header = ParagraphStyle("TblHdr", fontName=font_bold, fontSize=8, leading=10, alignment=TA_CENTER, textColor=colors.white)
    style_tbl_cell = ParagraphStyle("TblCell", fontName=font_name, fontSize=7.5, leading=10)
    style_tbl_cell_center = ParagraphStyle("TblCellCenter", fontName=font_name, fontSize=7.5, leading=10, alignment=TA_CENTER)
    style_tbl_cell_right = ParagraphStyle("TblCellRight", fontName=font_name, fontSize=7.5, leading=10, alignment=TA_RIGHT)
    style_tbl_cell_bold_right = ParagraphStyle("TblCellBoldRight", fontName=font_bold, fontSize=8, leading=10, alignment=TA_RIGHT)

    elements = []

    # Header công ty
    hdr_table_data = [
        [
            Paragraph("TỔNG CÔNG TY CP BẢO HIỂM BẢO LONG<br/><b>BAN KINH DOANH & KHAI THÁC</b>", style_header_l),
            Paragraph("Mẫu số: <b>BM-06/KD</b><br/>Ban hành theo QĐ số 08/2026/QĐ-BL", style_header_r),
        ]
    ]
    hdr_table = Table(hdr_table_data, colWidths=[260, 260])
    hdr_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(hdr_table)
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("GIẤY YÊU CẦU BẢO HIỂM MỌI RỦI RO TÀI SẢN DOANH NGHIỆP", style_title))
    elements.append(Paragraph("Mã số yêu cầu: <b>YCBH-DN/2026/0078</b>  |  Ngày tiếp nhận: 19/01/2026", style_subtitle))
    elements.append(Spacer(1, 8))

    # I. Bên mua bảo hiểm
    elements.append(Paragraph("I. THÔNG TIN BÊN MUA BẢO HIỂM (KHÁCH HÀNG DOANH NGHIỆP)", style_section))
    elements.append(Spacer(1, 3))
    customer_info = [
        [Paragraph("Tên doanh nghiệp:", style_bold), Paragraph("<b>CÔNG TY CỔ PHẦN THỰC PHẨM SẠCH MIỀN NAM</b>", style_body),
         Paragraph("Mã số thuế:", style_bold), Paragraph("0312456789", style_body)],
        [Paragraph("Trụ sở chính:", style_bold), Paragraph("Tầng 6, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, P. 25, Bình Thạnh, TP.HCM", style_body),
         Paragraph("Đại diện pháp luật:", style_bold), Paragraph("Ông Lê Hoàng Long - Tổng Giám đốc", style_body)],
        [Paragraph("Lĩnh vực hoạt động:", style_bold), Paragraph("Sản xuất và chế biến nông sản đóng hộp xuất khẩu", style_body),
         Paragraph("Điện thoại liên hệ:", style_bold), Paragraph("028.3899.8899 - hotline@southernclean.vn", style_body)],
    ]
    t_c = Table(customer_info, colWidths=[100, 180, 100, 140])
    t_c.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(t_c)
    elements.append(Spacer(1, 6))

    # II. Địa điểm được bảo hiểm
    elements.append(Paragraph("II. ĐỊA ĐIỂM VÀ TIÊU CHUẨN AN TOÀN PHÒNG CHÁY CHỮA CHÁY", style_section))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph(
        "- <b>Địa điểm bảo hiểm:</b> Nhà máy Chế biến Nông sản số 01, Lô B4-B5, KCN Tân Bình Mở Rộng, Bình Hưng Hòa, Bình Tân, TP.HCM.<br/>"
        "- <b>Kết cấu kiến trúc:</b> Nhà xưởng khung thép tiền chế Zamil, sàn bê tông chịu lực, mái tôn chống cháy Rockwool.<br/>"
        "- <b>Hệ thống PCCC hiện hữu:</b> Hệ thống Sprinkler tự động bao phủ 100% diện tích xưởng, máy bơm dự phòng diesel, họng nước vách tường, đã được Công an PCCC TP.HCM nghiệm thu theo Biên bản số 120/BB-PCCC ngày 10/11/2024.",
        style_body
    ))
    elements.append(Spacer(1, 6))

    # III. Bảng kê tài sản
    elements.append(Paragraph("III. BẢNG KÊ KHAI GIÁ TRỊ TÀI SẢN THAM GIA BẢO HIỂM", style_section))
    elements.append(Spacer(1, 3))

    asset_headers = [
        Paragraph("STT", style_tbl_header),
        Paragraph("Hạng mục tài sản tham gia bảo hiểm", style_tbl_header),
        Paragraph("Đặc tính kỹ thuật / Xuất xứ", style_tbl_header),
        Paragraph("Năm đưa vào SD", style_tbl_header),
        Paragraph("Số tiền bảo hiểm (VNĐ)", style_tbl_header),
    ]
    asset_rows = [
        [Paragraph("1", style_tbl_cell_center), Paragraph("Nhà xưởng, nhà kho và văn phòng điều hành", style_tbl_cell), Paragraph("Diện tích 12.500 m2 sàn bê tông", style_tbl_cell), Paragraph("2022", style_tbl_cell_center), Paragraph("65.000.000.000 đ", style_tbl_cell_right)],
        [Paragraph("2", style_tbl_cell_center), Paragraph("Dây chuyền máy móc chế biến & đóng lon tự động", style_tbl_cell), Paragraph("Hãng Krones & Tetra Pak (Đức & Thụy Điển)", style_tbl_cell), Paragraph("2023", style_tbl_cell_center), Paragraph("110.000.000.000 đ", style_tbl_cell_right)],
        [Paragraph("3", style_tbl_cell_center), Paragraph("Hệ thống kho lạnh âm sâu & máy nén khí trung tâm", style_tbl_cell), Paragraph("Dung tích 5.000 tấn, máy nén Bitzer", style_tbl_cell), Paragraph("2022", style_tbl_cell_center), Paragraph("28.000.000.000 đ", style_tbl_cell_right)],
        [Paragraph("4", style_tbl_cell_center), Paragraph("Hàng hóa thành phẩm, bao bì & nguyên vật liệu", style_tbl_cell), Paragraph("Giá trị lưu kho bình quân tháng", style_tbl_cell), Paragraph("2026", style_tbl_cell_center), Paragraph("45.000.000.000 đ", style_tbl_cell_right)],
        # Tổng cộng
        [Paragraph("", style_tbl_cell), Paragraph("<b>TỔNG SỐ TIỀN BẢO HIỂM YÊU CẦU:</b>", style_bold), Paragraph("<b>Hai trăm bốn mươi tám tỷ đồng chẵn</b>", style_tbl_cell), Paragraph("", style_tbl_cell), Paragraph("<b>248.000.000.000 đ</b>", style_tbl_cell_bold_right)],
    ]
    t_a = Table([asset_headers] + asset_rows, colWidths=[25, 175, 140, 60, 120])
    t_a.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B365D")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, 4), [colors.white, colors.HexColor("#F8FAFC")]),
        ("BACKGROUND", (0, 5), (-1, 5), colors.HexColor("#FEF3C7")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    elements.append(t_a)
    elements.append(Spacer(1, 6))

    # IV. Điều khoản mở rộng & Thời hạn
    elements.append(Paragraph("IV. CÁC ĐIỀU KHOẢN MỞ RỘNG VÀ THỜI HẠN BẢO HIỂM YÊU CẦU", style_section))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph(
        "- <b>Các điều khoản bổ sung yêu cầu:</b> Mở rộng rủi ro Giông bão ngập lụt; Mở rộng Chi phí dọn dẹp hiện trường (hạn mức 5 tỷ VNĐ); Mở rộng Đình công, bãi công bạo động; Mở rộng Chi phí thuê chuyên gia giám định độc lập quốc tế.<br/>"
        "- <b>Thời hạn bảo hiểm đề xuất:</b> 12 tháng (Từ 00:00 ngày 01/02/2026 đến 24:00 ngày 31/01/2027).<br/>"
        "- <b>Mức khấu trừ đề xuất:</b> 50.000.000 VNĐ / vụ tổn thất tài sản.",
        style_body
    ))
    elements.append(Spacer(1, 10))

    # Chữ ký
    sig_data = [
        [
            Paragraph("<b>ĐẠI DIỆN BÊN MUA BẢO HIỂM</b><br/><i>(Ký tên, đóng dấu pháp nhân)</i><br/><br/><br/><br/><b>Lê Hoàng Long</b><br/>Tổng Giám đốc", style_header_l),
            Paragraph("<b>CHUYÊN VIÊN TIẾP NHẬN BẢO LONG</b><br/><i>(Ký tên, ghi rõ họ tên)</i><br/><br/><br/><br/><b>Nguyễn Thị Thu Thủy</b><br/>Trưởng phòng Khai thác Doanh nghiệp", style_header_r),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    elements.append(t_sig)

    doc.build(elements)
    return buf.getvalue()


# ==============================================================================
# 7. HÀM SINH TỆP WORD: BM-07 (Thỏa thuận bảo mật thông tin NDA)
# ==============================================================================
def generate_bm07_pc_docx() -> bytes:
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(0.8)

    # Header
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    p_l = ht.cell(0, 0).paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_l.add_run("TỔNG CÔNG TY CP BẢO HIỂM BẢO LONG\n").bold = True
    p_l.add_run("PHÒNG PHÁP CHẾ & TUÂN THỦ\n").bold = True
    r_bm = p_l.add_run("Số: 12/2026/TTBM-BL")
    r_bm.italic = True
    r_bm.font.size = Pt(8.5)

    p_r = ht.cell(0, 1).paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_r.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n").bold = True
    p_r.add_run("Độc lập - Tự do - Hạnh phúc\n").bold = True
    p_r.add_run("---------------------\n").font.size = Pt(8)
    r_date = p_r.add_run("TP. Hồ Chí Minh, ngày 10 tháng 01 năm 2026")
    r_date.italic = True
    r_date.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Tiêu đề
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t = p_title.add_run("THỎA THUẬN BẢO MẬT THÔNG TIN\nVÀ DỮ LIỆU KINH DOANH (NDA)\n")
    r_t.bold = True
    r_t.font.size = Pt(14)
    r_t.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    doc.add_paragraph(
        "Hôm nay, ngày 10 tháng 01 năm 2026, tại Trụ sở Tổng Công ty Cổ phần Bảo hiểm Bảo Long, chúng tôi gồm có:"
    )

    doc.add_paragraph("BÊN A: TỔNG CÔNG TY CỔ PHẦN BẢO HIỂM BẢO LONG (Bên cung cấp thông tin)").bold = True
    doc.add_paragraph(
        "Địa chỉ: Tầng 5, Tòa nhà Bảo Long, 185 Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh\n"
        "Đại diện bởi: Ông Nguyễn Thành Trung     Chức vụ: Tổng Giám Đốc"
    )

    doc.add_paragraph("BÊN B: CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ & TƯ VẤN SỐ VIỆT (Bên tiếp nhận thông tin)").bold = True
    doc.add_paragraph(
        "Địa chỉ: Tầng 12, Tòa nhà Centec, 72 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh\n"
        "Đại diện bởi: Bà Vũ Thị Tuyết Lan       Chức vụ: Giám đốc Điều hành"
    )

    doc.add_paragraph("Hai bên đồng ý ký kết Thỏa thuận bảo mật thông tin với các điều khoản sau:")

    doc.add_paragraph("Điều 1: Phạm vi Thông tin Bảo mật").bold = True
    doc.add_paragraph(
        "Thông tin bảo mật bao gồm toàn bộ dữ liệu nghiệp vụ bảo hiểm, thông tin hợp đồng khách hàng, danh sách cán bộ, "
        "mã nguồn phần mềm, kiến trúc hệ thống dữ liệu TLBM và tài liệu kỹ thuật được trao đổi giữa hai bên phục vụ dự án chuyển đổi số."
    )

    doc.add_paragraph("Điều 2: Trách nhiệm và Nghĩa vụ Bảo mật").bold = True
    doc.add_paragraph(
        "Bên B cam kết: Chỉ sử dụng thông tin cho mục đích thực hiện dự án; không sao chép, tiết lộ hoặc chuyển giao cho bất kỳ bên thứ ba nào "
        "khi chưa có sự đồng ý bằng văn bản của Bên A; áp dụng đầy đủ các biện pháp an ninh mạng kỹ thuật số theo chuẩn ISO 27001."
    )

    doc.add_paragraph("Điều 3: Thời hạn Thỏa thuận và Bồi thường thiệt hại").bold = True
    doc.add_paragraph(
        "Thỏa thuận có hiệu lực 03 năm kể từ ngày ký. Mọi hành vi vi phạm nghĩa vụ bảo mật dẫn đến tổn thất thương mại, rò rỉ dữ liệu "
        "phải chịu chế tài bồi thường toàn bộ thiệt hại thực tế phát sinh và phạt vi phạm theo quy định pháp luật."
    )

    # Chữ ký
    doc.add_paragraph().paragraph_format.space_before = Pt(14)
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_titles = [
        ("ĐẠI DIỆN BÊN A (BẢO LONG)", "(Ký, đóng dấu)\n\n\n\n\nNguyễn Thành Trung"),
        ("ĐẠI DIỆN BÊN B (ĐỐI TÁC)", "(Ký, đóng dấu)\n\n\n\n\nVũ Thị Tuyết Lan"),
    ]
    for c_idx, (t1, t2) in enumerate(sig_titles):
        cell = sig_table.cell(0, c_idx)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_t1 = p.add_run(t1 + "\n")
        r_t1.bold = True
        r_t1.font.size = Pt(10)
        r_t2 = p.add_run(t2)
        r_t2.font.size = Pt(9.5)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ==============================================================================
# 8. HÀM SINH TỆP EXCEL: BM-08 (Bảng kê hóa đơn chứng từ quyết toán tạm ứng)
# ==============================================================================
def generate_bm08_tckt_excel() -> bytes:
    wb = openpyxl.Workbook()

    ws = wb.active
    ws.title = "Bảng kê chứng từ"
    ws.views.sheetView[0].showGridLines = True

    navy_fill = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid")
    total_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    header_font = Font(name="Arial", size=9.5, bold=True, color="FFFFFF")
    title_font = Font(name="Arial", size=14, bold=True, color="1B365D")
    company_font = Font(name="Arial", size=10, bold=True, color="0F172A")
    bold_font = Font(name="Arial", size=9.5, bold=True)
    normal_font = Font(name="Arial", size=9.5)
    italic_font = Font(name="Arial", size=9, italic=True)

    thin_border = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="thin", color="CBD5E1"),
    )
    double_bottom_border = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="double", color="1B365D"),
    )

    ws["A1"] = "TỔNG CÔNG TY CỔ PHẦN BẢO HIỂM BẢO LONG"
    ws["A1"].font = company_font
    ws["A2"] = "PHÒNG KẾ TOÁN TỔNG HỢP - BAN TCKT"
    ws["A2"].font = italic_font

    ws.merge_cells("A4:H4")
    ws["A4"] = "BẢNG KÊ HÓA ĐƠN CHỨNG TỪ QUYẾT TOÁN TẠM ỨNG NỘI BỘ"
    ws["A4"].font = title_font
    ws["A4"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[4].height = 26

    ws.merge_cells("A5:H5")
    ws["A5"] = "Kèm theo Giấy đề nghị thanh toán số: TT-2026/01-088  |  Kỳ quyết toán: Tháng 01/2026"
    ws["A5"].font = italic_font
    ws["A5"].alignment = Alignment(horizontal="center")

    cur_r = 7
    headers = ["STT", "Số HĐ điện tử", "Ngày HĐ", "Tên đơn vị bán hàng", "Mã số thuế", "Nội dung dịch vụ", "Tiền chưa thuế", "Tổng tiền (VNĐ)"]
    ws.row_dimensions[cur_r].height = 24
    for c_idx, h_text in enumerate(headers, start=1):
        cell = ws.cell(row=cur_r, column=c_idx, value=h_text)
        cell.fill = navy_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    invoice_data = [
        (1, "HD-0012984", "10/01/2026", "Tổng Công ty Hàng không VN (Vietnam Airlines)", "0100107518", "Vé máy bay SGN-DAD khứ hồi", 2954545, 3250000),
        (2, "HD-0089123", "13/01/2026", "Công ty TNHH MTV Khách sạn Novotel Đà Nẵng", "0401567891", "Dịch vụ phòng lưu trú 3 đêm", 4090909, 4500000),
        (3, "HD-0412890", "12/01/2026", "Công ty CP Tập đoàn Mai Linh - CN Đà Nẵng", "0400456123", "Cước vận tải taxi phục vụ giám định", 1090909, 1200000),
        (4, "HD-0005612", "12/01/2026", "Công ty CP Dịch vụ Ẩm thực Hải Cảng Đà Nẵng", "0401892345", "Tiếp đoàn chuyên gia giám định độc lập", 1954545, 2150000),
        (5, "HD-0098234", "11/01/2026", "Tập đoàn Xăng dầu Việt Nam (Petrolimex CN ĐN)", "0100107370", "Nhiên liệu xăng xe khảo sát hiện trường", 727273, 800000),
        (6, "HD-0034120", "14/01/2026", "Công ty CP Viễn thông FPT (FPT Telecom)", "0101778163", "Dịch vụ 4G/WiFi di động phục vụ hiện trường", 454545, 500000),
    ]

    start_r = cur_r + 1
    for r_vals in invoice_data:
        cur_r += 1
        ws.row_dimensions[cur_r].height = 20
        for c_idx, val in enumerate(r_vals, start=1):
            cell = ws.cell(row=cur_r, column=c_idx, value=val)
            cell.font = normal_font
            cell.border = thin_border
            if c_idx in [1, 3]:
                cell.alignment = Alignment(horizontal="center")
            elif c_idx in [7, 8]:
                cell.alignment = Alignment(horizontal="right")
                cell.number_format = "#,##0"

    end_r = cur_r

    # Tổng cộng
    cur_r += 1
    ws.merge_cells(start_row=cur_r, start_column=1, end_row=cur_r, end_column=6)
    ws.cell(row=cur_r, column=1, value="TỔNG CỘNG TIỀN THEO HÓA ĐƠN CHỨNG TỪ:").font = bold_font
    ws.cell(row=cur_r, column=1).alignment = Alignment(horizontal="right")

    sum_pre_tax = ws.cell(row=cur_r, column=7, value=f"=SUM(G{start_r}:G{end_r})")
    sum_pre_tax.font = bold_font
    sum_pre_tax.number_format = "#,##0"
    sum_pre_tax.fill = total_fill

    sum_total = ws.cell(row=cur_r, column=8, value=f"=SUM(H{start_r}:H{end_r})")
    sum_total.font = bold_font
    sum_total.number_format = "#,##0"
    sum_total.fill = total_fill

    for col in range(1, 9):
        ws.cell(row=cur_r, column=col).border = double_bottom_border

    # Ký duyệt
    cur_r += 3
    sig_titles = [
        ("Người lập bảng kê", 1, 2),
        ("Kế toán kiểm soát hóa đơn", 3, 5),
        ("Kế toán trưởng phê duyệt", 6, 8),
    ]
    for title, c_start, c_end in sig_titles:
        ws.merge_cells(start_row=cur_r, start_column=c_start, end_row=cur_r, end_column=c_end)
        cell = ws.cell(row=cur_r, column=c_start, value=title)
        cell.font = bold_font
        cell.alignment = Alignment(horizontal="center")
        ws.merge_cells(start_row=cur_r+1, start_column=c_start, end_row=cur_r+1, end_column=c_end)
        ws.cell(row=cur_r+1, column=c_start, value="(Ký, họ tên)").font = italic_font
        ws.cell(row=cur_r+1, column=c_start).alignment = Alignment(horizontal="center")

    col_widths = {1: 6, 2: 17, 3: 13, 4: 36, 5: 16, 6: 34, 7: 18, 8: 18}
    for c_idx, width in col_widths.items():
        ws.column_dimensions[get_column_letter(c_idx)].width = width

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ==============================================================================
# HÀM CHÍNH SEED DỮ LIỆU VÀ TẠO TỆP VẬT LÝ THẬT VÀO STORAGE
# ==============================================================================
def seed():
    print("=" * 60)
    print("🚀 Bắt đầu nạp dữ liệu mẫu và tạo TỆP ĐÍNH KÈM THẬT cho Biểu mẫu văn bản...")
    print("=" * 60)
    storage = get_document_storage()
    print(f"  + Thư mục lưu trữ vật lý: {storage.location}")
    print(f"  + Base URL: {storage.base_url}")

    User = get_user_model()
    admin_user = (
        User.objects.filter(is_superuser=True).first()
        or User.objects.filter(username="admin").first()
        or User.objects.first()
    )

    if not admin_user:
        admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@baolong.vn",
            password="admin",
            first_name="Quản trị",
            last_name="Hệ thống",
        )
        print("  + Đã tạo tài khoản quản trị mặc định: admin/admin")

    # 1. Danh mục Cấp 1
    danh_muc = DanhMucTaiLieu.objects.filter(ky_hieu="BM-CHUNG").first()
    if not danh_muc:
        max_stt = DanhMucTaiLieu.objects.aggregate(max_val=Max("stt_uu_tien"))["max_val"] or 0
        danh_muc = DanhMucTaiLieu.objects.create(
            ky_hieu="BM-CHUNG",
            stt_uu_tien=max_stt + 1,
            ten_tai_lieu="Hệ thống Biểu mẫu ban hành chung",
            nguoi_lap=admin_user,
            ngay_lap=date(2026, 1, 1),
            ghi_chu="Các biểu mẫu chuẩn áp dụng trong toàn hệ thống Bảo Long Insurance",
        )
    print(f"  + Danh mục Cấp 1: {danh_muc.ten_tai_lieu} ({danh_muc.ky_hieu})")

    # 2. Loại tài liệu Cấp 2
    types_data = [
        {"ten": "Hành chính - Văn phòng", "ghi_chu": "Mẫu tờ trình, công văn, biên bản"},
        {"ten": "Tài chính - Kế toán", "ghi_chu": "Mẫu thanh toán, tạm ứng, quyết toán"},
        {"ten": "Nhân sự - Tiền lương", "ghi_chu": "Mẫu phép, công tác, hợp đồng"},
        {"ten": "Giám định - Bồi thường", "ghi_chu": "Mẫu hồ sơ tổn thất, biên bản giám định"},
        {"ten": "Công nghệ thông tin", "ghi_chu": "Mẫu cấp phát tài khoản, thiết bị CNTT"},
        {"ten": "Kinh doanh bảo hiểm", "ghi_chu": "Giấy yêu cầu bảo hiểm, bảng kê"},
        {"ten": "Pháp chế & Tuân thủ", "ghi_chu": "Hợp đồng dịch vụ, bảo mật NDA"},
    ]
    type_map = {}
    for item in types_data:
        loai_obj, _ = LoaiTaiLieu.objects.get_or_create(
            dm_tai_lieu=danh_muc,
            ten_loai=item["ten"],
            defaults={
                "is_public": True,
                "ghi_chu": item["ghi_chu"],
            },
        )
        type_map[item["ten"]] = loai_obj

    # 3. Danh sách biểu mẫu văn bản phổ biến kèm bộ sinh tệp tương ứng
    templates_data = [
        {
            "ky_hieu": "BM-01/TCKT",
            "tieu_de": "Giấy đề nghị thanh toán tạm ứng & công tác phí",
            "don_vi": "Ban Tài chính - Kế toán",
            "loai": "Tài chính - Kế toán",
            "file_name": "BM-01-TCKT_Giay_de_nghi_thanh_toan.xlsx",
            "file_ext": "xlsx",
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "generator": generate_bm01_tckt_excel,
            "ghi_chu": "Biểu mẫu bảng tính Excel gồm 2 sheet: Đề nghị thanh toán và Bảng định mức công tác phí nội bộ.",
        },
        {
            "ky_hieu": "BM-02/VP",
            "tieu_de": "Tờ trình phê duyệt chủ trương và kế hoạch công tác",
            "don_vi": "Văn phòng Tổng Công ty",
            "loai": "Hành chính - Văn phòng",
            "file_name": "BM-02-VP_To_trinh_ke_hoach_cong_tac.docx",
            "file_ext": "docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "generator": generate_bm02_vp_docx,
            "ghi_chu": "Mẫu tờ trình chuẩn dùng cho các Ban/Phòng/Chi nhánh trình Ban Giám đốc phê duyệt chủ trương và kinh phí.",
        },
        {
            "ky_hieu": "BM-03/NS",
            "tieu_de": "Đơn xin nghỉ phép và bàn giao công việc",
            "don_vi": "Ban Quản trị Nguồn Nhân lực",
            "loai": "Nhân sự - Tiền lương",
            "file_name": "BM-03-NS_Don_xin_nghi_phep_va_ban_giao.docx",
            "file_ext": "docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "generator": generate_bm03_ns_docx,
            "ghi_chu": "Mẫu đơn xin nghỉ phép năm, nghỉ việc riêng có bảng bàn giao chi tiết công việc cho đồng nghiệp.",
        },
        {
            "ky_hieu": "BM-04/GD",
            "tieu_de": "Biên bản giám định hiện trường tổn thất xe cơ giới",
            "don_vi": "Khối Giám định Bồi thường",
            "loai": "Giám định - Bồi thường",
            "file_name": "BM-04-GD_Bien_ban_giam_dinh_ton_that_xe.pdf",
            "file_ext": "pdf",
            "mime_type": "application/pdf",
            "generator": generate_bm04_gd_pdf,
            "ghi_chu": "Biểu mẫu PDF chính quy lập biên bản giám định hiện trường vụ việc tổn thất xe cơ giới kèm bảng giá linh kiện.",
        },
        {
            "ky_hieu": "BM-05/CNTT",
            "tieu_de": "Phiếu yêu cầu cấp phát thiết bị và quyền truy cập hệ thống CNTT",
            "don_vi": "Khối Công nghệ Thông tin",
            "loai": "Công nghệ thông tin",
            "file_name": "BM-05-CNTT_Yeu_cau_cap_quyen_he_thong.docx",
            "file_ext": "docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "generator": generate_bm05_cntt_docx,
            "ghi_chu": "Biểu mẫu đề xuất cấp máy tính, tài khoản email và phân quyền phần mềm điều hành theo ISO 27001.",
        },
        {
            "ky_hieu": "BM-06/KD",
            "tieu_de": "Giấy yêu cầu bảo hiểm và bảng kê khai rủi ro doanh nghiệp",
            "don_vi": "Ban Kinh doanh & Khai thác",
            "loai": "Kinh doanh bảo hiểm",
            "file_name": "BM-06-KD_Giay_yeu_cau_bao_hiem_DN.pdf",
            "file_ext": "pdf",
            "mime_type": "application/pdf",
            "generator": generate_bm06_kd_pdf,
            "ghi_chu": "Mẫu văn bản PDF yêu cầu bảo hiểm tài sản, kỹ thuật và trách nhiệm doanh nghiệp kèm bảng kê tài sản 248 tỷ.",
        },
        {
            "ky_hieu": "BM-07/PC",
            "tieu_de": "Thỏa thuận bảo mật thông tin và dữ liệu kinh doanh (NDA)",
            "don_vi": "Phòng Pháp chế & Tuân thủ",
            "loai": "Pháp chế & Tuân thủ",
            "file_name": "BM-07-PC_Hop_dong_dich_vu_va_thoa_thuan_NDA.docx",
            "file_ext": "docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "generator": generate_bm07_pc_docx,
            "ghi_chu": "Mẫu thỏa thuận pháp lý chuẩn ký kết với các đối tác tư vấn và nhà cung cấp dịch vụ số.",
        },
        {
            "ky_hieu": "BM-08/TCKT",
            "tieu_de": "Bảng kê chứng từ hóa đơn thanh toán và quyết toán tạm ứng nội bộ",
            "don_vi": "Ban Tài chính - Kế toán",
            "loai": "Tài chính - Kế toán",
            "file_name": "BM-08-TCKT_Bang_ke_quyet_toan_tam_ung.xlsx",
            "file_ext": "xlsx",
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "generator": generate_bm08_tckt_excel,
            "ghi_chu": "Mẫu bảng kê hóa đơn điện tử chi tiết có công thức tính thuế VAT và tổng tiền thanh toán tự động.",
        },
    ]

    for item in templates_data:
        # 3.1 Sinh nội dung tệp nhị phân thật
        file_bytes = item["generator"]()
        file_size = len(file_bytes)

        # 3.2 Lưu tệp thật vào kho lưu trữ (storage/document_templates/)
        rel_storage_path = f"document_templates/{item['file_name']}"
        if storage.exists(rel_storage_path):
            storage.delete(rel_storage_path)

        saved_path = storage.save(rel_storage_path, ContentFile(file_bytes))
        file_url = storage.url(saved_path)
        disk_abs_path = storage.path(saved_path)

        # 3.3 Tạo hoặc cập nhật Chi tiết tài liệu
        doc, created = TaiLieuChiTiet.objects.update_or_create(
            ky_hieu=item["ky_hieu"],
            defaults={
                "dm_tai_lieu": danh_muc,
                "tieu_de": item["tieu_de"],
                "ngay_dang": date(2026, 1, 15),
                "noi_ban_hanh": item["don_vi"],
                "hieu_luc": "CON_HIEU_LUC",
                "hien_thi": "TAT_CA",
                "ghi_chu": item["ghi_chu"],
                "nguoi_tao": admin_user,
            },
        )

        loai_obj = type_map.get(item["loai"])
        if loai_obj:
            doc.loai_tai_lieu.set([loai_obj])

        # 3.4 Tạo hoặc cập nhật Attachment liên kết đúng file thật
        att, att_created = ChiTietTaiLieuAttachment.objects.update_or_create(
            document=doc,
            name=item["file_name"],
            defaults={
                "path": file_url,
                "file_size": file_size,
                "mime_type": item["mime_type"],
                "is_deleted": False,
                "nguoi_tao": admin_user,
            },
        )

        status_text = "Tạo mới" if created else "Cập nhật"
        print(f"  + [{item['file_ext'].upper():4}] {item['ky_hieu']:12}: {item['tieu_de'][:40]}... ({file_size/1024:.1f} KB) -> {status_text}")
        print(f"         📁 Đĩa: {disk_abs_path}")
        print(f"         🔗 URL: {file_url} (ID Attachment: {att.id})")

    print("\n" + "=" * 60)
    print("✅ ĐÃ HOÀN TẤT NẠP TOÀN BỘ BIỂU MẪU VÀ TẠO TỆP THẬT TRÊN ĐĨA THÀNH CÔNG!")
    print("=" * 60)


if __name__ == "__main__":
    seed()
