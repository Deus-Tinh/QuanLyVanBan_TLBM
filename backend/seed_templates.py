"""
Script seed dữ liệu mẫu Biểu mẫu văn bản phổ biến cho Dashboard
Sử dụng model của app document_templates (Nhóm 4 - Thượng Mạnh Quỳnh cung cấp)

Cách chạy:
    python backend/seed_templates.py
hoặc:
    cd backend && python seed_templates.py
"""
import os
import sys
from datetime import date
from pathlib import Path

# Đảm bảo đường dẫn import đúng module config và các app
BASE_DIR = Path(__file__).resolve().parent
if (BASE_DIR / "backend").exists():
    sys.path.insert(0, str(BASE_DIR / "backend"))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if (BASE_DIR / "apps").exists() and str(BASE_DIR / "apps") not in sys.path:
    sys.path.insert(0, str(BASE_DIR / "apps"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.contrib.auth import get_user_model
from document_templates.models import (
    DanhMucTaiLieu,
    LoaiTaiLieu,
    TaiLieuChiTiet,
    ChiTietTaiLieuAttachment,
)


def seed():
    print("=" * 60)
    print("🚀 Bắt đầu nạp dữ liệu mẫu biểu mẫu văn bản phổ biến (Nhóm 4)...")
    print("=" * 60)
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

    # 1. Tạo hoặc lấy Danh mục Cấp 1
    from django.db.models import Max
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

    # 2. Tạo các Loại tài liệu Cấp 2
    types_data = [
        {"ten": "Hành chính - Văn phòng", "ghi_chu": "Mẫu tờ trình, công văn, biên bản"},
        {"ten": "Tài chính - Kế toán", "ghi_chu": "Mẫu thanh toán, tạm ứng, quyết toán"},
        {"ten": "Nhân sự - Tiền lương", "ghi_chu": "Mẫu phép, công tác, hợp đồng"},
        {"ten": "Giám định - Bồi thường", "ghi_chu": "Mẫu hồ sơ tổn thất, biên bản giám định"},
        {"ten": "Công nghệ thông tin", "ghi_chu": "Mẫu cấp phát tài khoản, thiết bị CNTT"},
        {"ten": "Kinh doanh bảo hiểm", "ghi_chu": "Giấy yêu cầu bảo hiểm, bảng kê"},
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

    # 3. Danh sách 6 biểu mẫu văn bản phổ biến cần cho Dashboard
    templates_data = [
        {
            "ky_hieu": "BM-01/TCKT",
            "tieu_de": "Giấy đề nghị thanh toán tạm ứng & công tác phí",
            "don_vi": "Ban Tài chính - Kế toán",
            "loai": "Tài chính - Kế toán",
            "file_name": "BM-01-TCKT_Giay_de_nghi_thanh_toan.xlsx",
            "file_ext": "xlsx",
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "ghi_chu": "Biểu mẫu áp dụng chung toàn hệ thống khi thanh quyết toán chi phí công tác, tạm ứng nội bộ.",
        },
        {
            "ky_hieu": "BM-02/VP",
            "tieu_de": "Tờ trình phê duyệt chủ trương và kế hoạch công tác",
            "don_vi": "Văn phòng Tổng Công ty",
            "loai": "Hành chính - Văn phòng",
            "file_name": "BM-02-VP_To_trinh_ke_hoach_cong_tac.docx",
            "file_ext": "docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "ghi_chu": "Mẫu tờ trình chuẩn dùng cho các Ban/Phòng/Chi nhánh trình Ban Giám đốc phê duyệt.",
        },
        {
            "ky_hieu": "BM-03/NS",
            "tieu_de": "Đơn xin nghỉ phép và bàn giao công việc",
            "don_vi": "Ban Quản trị Nguồn Nhân lực",
            "loai": "Nhân sự - Tiền lương",
            "file_name": "BM-03-NS_Don_xin_nghi_phep_va_ban_giao.docx",
            "file_ext": "docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "ghi_chu": "Mẫu đơn xin nghỉ phép năm, nghỉ việc riêng có cam kết bàn giao công tác.",
        },
        {
            "ky_hieu": "BM-04/GD",
            "tieu_de": "Biên bản giám định hiện trường tổn thất xe cơ giới",
            "don_vi": "Khối Giám định Bồi thường",
            "loai": "Giám định - Bồi thường",
            "file_name": "BM-04-GD_Bien_ban_giam_dinh_ton_that_xe.pdf",
            "file_ext": "pdf",
            "mime_type": "application/pdf",
            "ghi_chu": "Biểu mẫu lập biên bản giám định hiện trường vụ việc tổn thất xe cơ giới và tài sản.",
        },
        {
            "ky_hieu": "BM-05/CNTT",
            "tieu_de": "Phiếu yêu cầu cấp phát thiết bị và quyền truy cập hệ thống CNTT",
            "don_vi": "Khối Công nghệ Thông tin",
            "loai": "Công nghệ thông tin",
            "file_name": "BM-05-CNTT_Yeu_cau_cap_quyen_he_thong.docx",
            "file_ext": "docx",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "ghi_chu": "Biểu mẫu đề xuất cấp máy tính, tài khoản email và phân quyền phần mềm điều hành.",
        },
        {
            "ky_hieu": "BM-06/KD",
            "tieu_de": "Giấy yêu cầu bảo hiểm và bảng kê khai rủi ro doanh nghiệp",
            "don_vi": "Ban Kinh doanh & Khai thác",
            "loai": "Kinh doanh bảo hiểm",
            "file_name": "BM-06-KD_Giay_yeu_cau_bao_hiem_DN.pdf",
            "file_ext": "pdf",
            "mime_type": "application/pdf",
            "ghi_chu": "Mẫu yêu cầu bảo hiểm tài sản, kỹ thuật và trách nhiệm dành cho khách hàng doanh nghiệp.",
        },
    ]

    for item in templates_data:
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
        # Gán Loại tài liệu
        loai_obj = type_map.get(item["loai"])
        if loai_obj:
            doc.loai_tai_lieu.set([loai_obj])

        # Đính kèm tệp mẫu để Dashboard hiển thị đúng định dạng (format)
        ChiTietTaiLieuAttachment.objects.update_or_create(
            document=doc,
            name=item["file_name"],
            defaults={
                "path": f"document_templates/{item['file_name']}",
                "file_size": 1024 * 35,
                "mime_type": item["mime_type"],
                "nguoi_tao": admin_user,
            },
        )
        status_text = "Đã tạo mới" if created else "Đã cập nhật"
        print(f"  + [{item['file_ext'].upper()}] {item['ky_hieu']}: {item['tieu_de']} ({item['don_vi']}) -> {status_text}")

    print("=" * 60)
    print("✅ Đã hoàn tất nạp dữ liệu mẫu biểu mẫu văn bản cho Dashboard!")
    print("=" * 60)


if __name__ == "__main__":
    seed()
