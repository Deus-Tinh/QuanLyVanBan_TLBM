"""
Script khởi tạo dữ liệu mẫu chuẩn công vụ cho môi trường phát triển.
Chạy bằng: python manage.py seed_accounts
hoặc: python seed_data.py
"""
import os
from datetime import date, time, timedelta
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from accounts.models import StaffProfile
from dashboard.models import IncomingDocument, OutgoingDocument, MeetingRoom

print("=" * 60)
print("SEED DATA — He thong Quan ly Van ban & Tai lieu Mat (QLVB & TLBM)")
print("=" * 60)

# 1. Tài khoản Admin
admin_user, _ = User.objects.get_or_create(
    username="admin",
    defaults={
        "email": "quantri@donvi.gov.vn",
        "first_name": "Quản Trị Viên",
        "last_name": "Hệ Thống",
        "is_staff": True,
        "is_superuser": True,
    },
)
admin_user.set_password("Admin@123")
admin_user.first_name = "Quản Trị Viên"
admin_user.last_name = "Hệ Thống"
admin_user.is_staff = True
admin_user.is_superuser = True
admin_user.is_active = True
admin_user.email = "quantri@donvi.gov.vn"
admin_user.save()

today = timezone.localdate()
StaffProfile.objects.update_or_create(
    user=admin_user,
    defaults={
        "full_name": "Quản Trị Viên Hệ Thống",
        "department": "Văn phòng Trung tâm",
        "position": "Quản trị viên tối cao",
        "role": "admin",
        "phone": "028.3896.8888",
        "birthday": today.replace(year=1990),
    },
)
print("[OK] Tai khoan Admin: admin / Admin@123 (quantri@donvi.gov.vn)")

# 2. Tài khoản Cán bộ (staff)
canbo_user, _ = User.objects.get_or_create(
    username="canbo",
    defaults={
        "email": "canbo@donvi.gov.vn",
        "first_name": "Cán Bộ",
        "last_name": "Xử Lý Văn Bản",
        "is_staff": True,
        "is_superuser": False,
    },
)
canbo_user.set_password("Canbo@123")
canbo_user.first_name = "Cán Bộ"
canbo_user.last_name = "Xử Lý Văn Bản"
canbo_user.is_staff = True
canbo_user.is_superuser = False
canbo_user.is_active = True
canbo_user.email = "canbo@donvi.gov.vn"
canbo_user.save()

tomorrow = today + timedelta(days=1)
StaffProfile.objects.update_or_create(
    user=canbo_user,
    defaults={
        "full_name": "Cán Bộ Xử Lý Văn Bản",
        "department": "Phòng Tổ chức - Hành chính",
        "position": "Chuyên viên văn thư",
        "role": "staff",
        "phone": "028.3896.6666",
        "birthday": today.replace(year=1995, month=tomorrow.month, day=tomorrow.day),
    },
)
print("[OK] Tai khoan Can bo: canbo / Canbo@123 (canbo@donvi.gov.vn)")

# Xóa tài khoản cũ nếu có MSSV để đảm bảo DevOps audit
User.objects.filter(username__contains="501250").delete()

# 3. Văn bản đến mẫu
incoming_docs = [
    ("128/QD-UBND", "V/v phê duyệt đề án chuyển đổi số công vụ giai đoạn 2026-2030", today, "UBND TP.HCM", False),
    ("45/CV-STTTT", "Hướng dẫn triển khai hệ thống quản lý văn bản và điều hành", today - timedelta(days=1), "Sở Thông tin và Truyền thông", False),
    ("09/BC-TTr", "Báo cáo công tác thanh tra hành chính quý 3/2026", today - timedelta(days=2), "Thanh tra Thành phố", False),
    ("88/TB-VP", "Thông báo kết luận cuộc họp giao ban thường kỳ tháng 9", today - timedelta(days=3), "Văn phòng UBND", False),
    ("12/KH-SNV", "Kế hoạch đào tạo, bồi dưỡng cán bộ công chức năm 2026", today - timedelta(days=4), "Sở Nội vụ", False),
]
for code, title, issued_date, sender, is_conf in incoming_docs:
    IncomingDocument.objects.update_or_create(
        code=code,
        defaults={
            "title": title,
            "issued_date": issued_date,
            "sender": sender,
            "is_confidential": is_conf,
        },
    )
print(f"[OK] Da dong bo {len(incoming_docs)} van ban den mau.")

# 4. Văn bản đi mẫu
outgoing_docs = [
    ("52/TTr-ITC", "Tờ trình xin chủ trương nâng cấp hạ tầng mạng trung tâm dữ liệu", today, "Ban Giám đốc Sở", False),
    ("104/GM-VP", "Giấy mời họp rà soát tiến độ tích hợp phân hệ Dashboard", today - timedelta(days=1), "Các phòng ban trực thuộc", False),
    ("77/TB-BGD", "Thông báo lịch nghỉ và phân công trực cơ quan", today - timedelta(days=2), "Toàn thể CBNV", False),
    ("33/CV-CNTT", "Công văn đề nghị cung cấp danh mục biểu mẫu điện tử", today - timedelta(days=3), "Trung tâm Lưu trữ", False),
    ("15/QD-ITC", "Quyết định kiện toàn tổ công tác an toàn an ninh mạng", today - timedelta(days=5), "Ban Chỉ đạo Chuyển đổi số", True),
]
for code, title, issued_date, recipient, is_conf in outgoing_docs:
    OutgoingDocument.objects.update_or_create(
        code=code,
        defaults={
            "title": title,
            "issued_date": issued_date,
            "recipient": recipient,
            "is_confidential": is_conf,
        },
    )
print(f"[OK] Da dong bo {len(outgoing_docs)} van ban di mau.")

# 5. Phòng họp hôm nay
MeetingRoom.objects.update_or_create(
    room_name="Phòng họp A1 - Khu A",
    date=today,
    defaults={
        "meeting_title": "Họp giao ban định kỳ",
        "start_time": time(8, 30),
        "end_time": time(11, 30),
        "organizer": "Văn phòng Trung tâm",
        "status": "ready",
    },
)
MeetingRoom.objects.update_or_create(
    room_name="Phòng họp Trực tuyến B2",
    date=today,
    defaults={
        "meeting_title": "Họp trực tuyến với Sở TT&TT về tích hợp API",
        "start_time": time(14, 0),
        "end_time": time(16, 30),
        "organizer": "Ban Công nghệ thông tin",
        "status": "upcoming",
    },
)
print("[OK] Da dong bo 2 phong hop mau cho hom nay.")
print("=" * 60)
print("HOAN TAT SEED DU LIEU CHUAN HIEU.MD & DEVOPS AUDIT!")
print("=" * 60)
