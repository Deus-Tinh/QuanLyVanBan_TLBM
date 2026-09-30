import sys
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from organizations.models import KhoiKhuVuc, DonVi
from accounts.models import Position, StaffProfile

KHOI_DATA = [
    ("HỘI ĐỒNG QUẢN TRỊ", 1),
    ("VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ", 2),
    ("BAN TỔNG GIÁM ĐỐC", 3),
    ("VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI", 4),
    ("KHỐI KINH DOANH", 5),
    ("KHỐI NGHIỆP VỤ", 6),
    ("KHỐI HỖ TRỢ", 7),
    ("KHỐI QUẢN LÝ RỦI RO", 8),
    ("KHỐI TÀI CHÍNH", 9),
    ("KHỐI KẾ TOÁN", 10),
    ("VĂN PHÒNG 2", 11),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", 12),
    ("KHU VỰC MIỀN BẮC", 13),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", 14),
    ("KHU VỰC ĐÔNG NAM BỘ", 15),
    ("GIÁM ĐỊNH VÙNG", 16),
]

DONVI_DATA = [
    ("HỘI ĐỒNG QUẢN TRỊ", "Hội đồng quản trị"),
    ("HỘI ĐỒNG QUẢN TRỊ", "Ban kiểm toán nội bộ"),
    ("VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ", "Văn phòng hội đồng quản trị"),
    ("BAN TỔNG GIÁM ĐỐC", "Ban tổng giám đốc"),
    ("BAN TỔNG GIÁM ĐỐC", "Giám đốc vùng"),
    ("VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI", "Văn phòng ban điều hành"),
    ("KHỐI KINH DOANH", "Ban khách hàng doanh nghiệp"),
    ("KHỐI KINH DOANH", "Ban khách hàng qua môi giới"),
    ("KHỐI KINH DOANH", "Ban Bancassurance"),
    ("KHỐI KINH DOANH", "Ban khách hàng cá nhân"),
    ("KHỐI KINH DOANH", "Ban chăm sóc khách hàng ĐT"),
    ("KHỐI KINH DOANH", "Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông"),
    ("KHỐI KINH DOANH", "Ban dự án lớn"),
    ("KHỐI KINH DOANH", "Ban dự án khách hàng qua đại lý"),
    ("KHỐI NGHIỆP VỤ", "Ban bảo hiểm con người"),
    ("KHỐI NGHIỆP VỤ", "Ban bảo hiểm tài sản kỹ thuật"),
    ("KHỐI NGHIỆP VỤ", "Ban tái bảo hiểm"),
    ("KHỐI NGHIỆP VỤ", "Ban bảo hiểm xe cơ giới"),
    ("KHỐI NGHIỆP VỤ", "Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng"),
    ("KHỐI HỖ TRỢ", "Lãnh đạo khối"),
    ("KHỐI HỖ TRỢ", "Ban hành chính quản trị"),
    ("KHỐI HỖ TRỢ", "Ban nhân sự"),
    ("KHỐI HỖ TRỢ", "Ban pháp chế"),
    ("KHỐI HỖ TRỢ", "Ban công nghệ thông tin"),
    ("KHỐI HỖ TRỢ", "Ban truyền thông và marketing"),
    ("KHỐI QUẢN LÝ RỦI RO", "Ban quản lý rủi ro và tuân thủ"),
    ("KHỐI TÀI CHÍNH", "Ban đầu tư"),
    ("KHỐI TÀI CHÍNH", "Ban tài chính kế hoạch"),
    ("KHỐI TÀI CHÍNH", "Ban dự án MIS"),
    ("KHỐI KẾ TOÁN", "Lãnh đạo khối"),
    ("KHỐI KẾ TOÁN", "Ban kế toán"),
    ("VĂN PHÒNG 2", "Văn phòng 2"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Sở giao dịch Bảo Long"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long TP.HCM"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long Sài Gòn"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long Gia Định"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long Bến Thành"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long Nam Sài Gòn"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long Tân Sơn Nhất"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long Đông Sài Gòn"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Bảo Long Đông Phương"),
    ("KHU VỰC THÀNH PHỐ HỒ CHÍ MINH", "Trung tâm kinh doanh Thủ Thiêm"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Hà Nội"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Thủ Đô"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Thăng Long"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Thái Nguyên"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Quảng Ninh"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Hải Phòng"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Phú Thọ"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Bắc Ninh"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Hải Dương"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Nam Định"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Vĩnh Phúc"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Đông Hải"),
    ("KHU VỰC MIỀN BẮC", "Sở giao dịch miền Bắc"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Ninh Bình"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Thái Bình"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Đông Đô"),
    ("KHU VỰC MIỀN BẮC", "Bảo Long Thanh Hóa"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long KV Tây Nguyên (Daklak)"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Phú Yên"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Đà Nẵng"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Trung Bộ (Huế)"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Bắc Trung Bộ (Nghệ An)"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Khánh Hòa"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Bình Định"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Bình Thuận"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Quảng Ngãi"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Gia Lai"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Lâm Đồng"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Bảo Long Quảng Bình"),
    ("KHU VỰC MIỀN TRUNG TÂY NGUYÊN", "Trung tâm kinh doanh Sông Hàn"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Bình Dương"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Vũng Tàu"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Đồng Nai"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Tây Ninh"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Long An"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Cần Thơ"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Cà Mau"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Kiên Giang"),
    ("KHU VỰC ĐÔNG NAM BỘ", "Bảo Long Đồng Tháp"),
    ("GIÁM ĐỊNH VÙNG", "Giám định vùng"),
]

POSITION_DATA = [
    (1, "Quản trị viên"),
    (2, "Trưởng phòng"),
    (3, "Phó phòng"),
    (4, "Chuyên viên"),
    (5, "Nhân viên"),
    (6, "Văn thư"),
    (7, "Lãnh đạo cơ quan"),
]


class Command(BaseCommand):
    help = "Seed database with exact SQL_Fix4 data (Khối, Đơn vị, Chức vụ, Admin)"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("==> Seeding database from SQL_Fix4 specification..."))

        with transaction.atomic():
            # 1. Seed Khoi / Khu vuc
            khoi_map = {}
            for ten, thu_tu in KHOI_DATA:
                khoi, created = KhoiKhuVuc.objects.get_or_create(
                    ten=ten,
                    defaults={"thu_tu_hien_thi": thu_tu}
                )
                khoi_map[ten] = khoi
            self.stdout.write(self.style.SUCCESS(f" [OK] Seeded {len(khoi_map)} Khoi / Khu vuc."))

            # 2. Seed Don vi / Phong ban
            donvi_count = 0
            for idx, (khoi_ten, donvi_ten) in enumerate(DONVI_DATA, start=1):
                khoi = khoi_map.get(khoi_ten)
                if not khoi:
                    continue
                DonVi.objects.get_or_create(
                    ten=donvi_ten,
                    defaults={
                        "khoi": khoi,
                        "stt_uu_tien": idx,
                        "is_public": True,
                    }
                )
                donvi_count += 1
            self.stdout.write(self.style.SUCCESS(f" [OK] Seeded {donvi_count} Don vi / Phong ban."))

            # 3. Seed Chuc vu
            pos_map = {}
            for order, name in POSITION_DATA:
                pos, _ = Position.objects.get_or_create(
                    name=name,
                    defaults={"display_order": order, "is_public": True}
                )
                pos_map[name] = pos
            self.stdout.write(self.style.SUCCESS(f" [OK] Seeded {len(pos_map)} Chuc vu."))

            # 4. Seed Admin account
            admin_donvi = DonVi.objects.filter(ten="Ban công nghệ thông tin").first() or DonVi.objects.first()
            admin_chucvu = pos_map.get("Quản trị viên")

            admin_user, created = User.objects.get_or_create(
                username="admin",
                defaults={
                    "email": "admin@baolong.vn",
                    "is_staff": True,
                    "is_superuser": True,
                    "is_active": True,
                }
            )
            admin_user.set_password("Admin@123")
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.save()

            StaffProfile.objects.update_or_create(
                user=admin_user,
                defaults={
                    "full_name": "Quản trị hệ thống",
                    "chuc_vu": admin_chucvu,
                    "don_vi": admin_donvi,
                    "phone": "0901234567",
                    "trang_thai": "dang_lam_viec",
                    "is_public": True,
                }
            )
            self.stdout.write(self.style.SUCCESS(" [OK] Seeded admin user: admin / Admin@123"))

            # 5. Seed Demo Users for QA Testing
            demo_users = [
                ("truongphong_cntt", "Trưởng Phòng CNTT", "Trưởng phòng", admin_donvi, "0901111222"),
                ("chuyenvien_cntt", "Chuyên Viên CNTT", "Chuyên viên", admin_donvi, "0902222333"),
                ("vanthu_cntt", "Văn Thư Lưu Trữ", "Văn thư", admin_donvi, "0903333444"),
            ]
            for uname, hoten, pos_name, dvi, phone in demo_users:
                u, _ = User.objects.get_or_create(
                    username=uname,
                    defaults={"email": f"{uname}@baolong.vn", "is_active": True, "is_staff": False}
                )
                u.set_password("Admin@123")
                u.is_active = True
                u.save()

                StaffProfile.objects.update_or_create(
                    user=u,
                    defaults={
                        "full_name": hoten,
                        "chuc_vu": pos_map.get(pos_name),
                        "don_vi": dvi,
                        "phone": phone,
                        "trang_thai": "dang_lam_viec",
                        "is_public": True,
                    }
                )
            self.stdout.write(self.style.SUCCESS(" [OK] Seeded demo users for Issue #24 testing (Admin@123)."))

        self.stdout.write(self.style.SUCCESS("==> Database seeding completed successfully 100%!"))
