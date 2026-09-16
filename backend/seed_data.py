"""
Script khởi tạo dữ liệu mẫu cho môi trường phát triển.
Chạy bằng: .venv\Scripts\python manage.py shell < seed_data.py

Tạo:
  - 1 superuser: admin / admin123456
  - 1 user thường: staff01 / staff123456
  - 5 văn bản đến mẫu
  - 5 văn bản đi mẫu
  - 2 phòng họp hôm nay
"""
import os
import django
from datetime import date, time, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from accounts.models import StaffProfile
from dashboard.models import IncomingDocument, OutgoingDocument, MeetingRoom

print("=" * 60)
print("🌱 SEED DATA — Hệ thống QLVB&TL ITC")
print("=" * 60)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Tài khoản Admin
# ─────────────────────────────────────────────────────────────────────────────
if not User.objects.filter(username="admin").exists():
    admin_user = User.objects.create_superuser(
        username="admin",
        email="admin@itc.edu.vn",
        password="admin123456",
        first_name="Quản trị",
        last_name="Viên",
    )
    StaffProfile.objects.create(
        user=admin_user,
        full_name="Quản trị viên ITC",
        department="Ban Giám đốc",
        position="Quản trị viên hệ thống",
        role="admin",
        phone="028.3800.1234",
        birthday=date(1990, 1, 15),
    )
    print("✅ Tạo admin: admin / admin123456")
else:
    print("⏩ admin đã tồn tại, bỏ qua.")

# ─────────────────────────────────────────────────────────────────────────────
# 2. Tài khoản Cán bộ mẫu
# ─────────────────────────────────────────────────────────────────────────────
if not User.objects.filter(username="hieu501250367").exists():
    staff_user = User.objects.create_user(
        username="hieu501250367",
        email="hieu.501250367@itc.edu.vn",
        password="hieu123456",
        first_name="Hiếu",
        last_name="Nguyễn Văn",
    )
    today = date.today()
    StaffProfile.objects.create(
        user=staff_user,
        full_name="Nguyễn Văn Hiếu",
        department="Ban Công nghệ Thông tin",
        position="Cán bộ Lập trình Backend",
        role="staff",
        phone="090.0000.001",
        # Sinh nhật hôm nay để test widget
        birthday=today.replace(year=2000),
    )
    print("✅ Tạo cán bộ: hieu501250367 / hieu123456 (sinh nhật hôm nay để test)")
else:
    print("⏩ hieu501250367 đã tồn tại, bỏ qua.")

# ─────────────────────────────────────────────────────────────────────────────
# 3. Văn bản đến mẫu
# ─────────────────────────────────────────────────────────────────────────────
if IncomingDocument.objects.count() == 0:
    today = date.today()
    incoming_data = [
        ("128/QĐ-BGDĐT", "Hướng dẫn công tác năm học mới 2026", today - timedelta(days=0), "Bộ Giáo dục và Đào tạo"),
        ("45/CV-UBND",   "Tăng cường an toàn thông tin CSDL nhà nước", today - timedelta(days=1), "UBND TP.HCM"),
        ("09/TB-ITC",    "Thông báo lịch bảo vệ đồ án chuyên ngành", today - timedelta(days=2), "ITC — Phòng Đào tạo"),
        ("77/HD-TCHQ",   "Quy trình kiểm tra hồ sơ điện tử liên ngành", today - timedelta(days=3), "Tổng cục Hải quan"),
        ("14/KH-ITC",    "Kế hoạch triển khai hệ thống quản lý văn bản", today - timedelta(days=4), "ITC — Ban Giám đốc"),
    ]
    for code, title, issued_date, sender in incoming_data:
        IncomingDocument.objects.create(
            code=code, title=title, issued_date=issued_date, sender=sender
        )
    print(f"✅ Tạo {len(incoming_data)} văn bản đến mẫu.")
else:
    print(f"⏩ Đã có {IncomingDocument.objects.count()} văn bản đến, bỏ qua.")

# ─────────────────────────────────────────────────────────────────────────────
# 4. Văn bản đi mẫu
# ─────────────────────────────────────────────────────────────────────────────
if OutgoingDocument.objects.count() == 0:
    today = date.today()
    outgoing_data = [
        ("210/TB-BL",   "Thông báo kết luận cuộc họp giao ban quý 3",          today - timedelta(days=0), "Các phòng ban ITC"),
        ("89/QĐ-BL",    "Quyết định ban hành khung an ninh thông tin",          today - timedelta(days=1), "Ban Công nghệ"),
        ("62/TTr-ITC",  "Tờ trình phê duyệt kinh phí trang bị máy chủ",        today - timedelta(days=2), "Ban Giám đốc"),
        ("55/CV-BL",    "Công văn gửi các đơn vị phòng ban cấp 2",             today - timedelta(days=3), "Các phòng ban"),
        ("31/QĐ-BL",    "Quyết định phân công nhiệm vụ đồ án Django",           today - timedelta(days=5), "Nhóm 1-8 Đồ án"),
    ]
    for code, title, issued_date, recipient in outgoing_data:
        OutgoingDocument.objects.create(
            code=code, title=title, issued_date=issued_date, recipient=recipient
        )
    print(f"✅ Tạo {len(outgoing_data)} văn bản đi mẫu.")
else:
    print(f"⏩ Đã có {OutgoingDocument.objects.count()} văn bản đi, bỏ qua.")

# ─────────────────────────────────────────────────────────────────────────────
# 5. Phòng họp hôm nay
# ─────────────────────────────────────────────────────────────────────────────
if MeetingRoom.objects.filter(date=date.today()).count() == 0:
    today = date.today()
    meetings_data = [
        ("Phòng Họp A201", "Hội nghị Ban Giám Đốc", time(8, 30), time(11, 30), "NCS.ThS. Trần Phương Duy", "ongoing"),
        ("Phòng Họp B105", "Họp Sprint Review Nhóm 1-8 Đồ án Django", time(14, 0), time(16, 30), "Châu Tuấn Kiệt (PM)", "upcoming"),
    ]
    for room, title, start, end, organizer, status in meetings_data:
        MeetingRoom.objects.create(
            room_name=room,
            meeting_title=title,
            date=today,
            start_time=start,
            end_time=end,
            organizer=organizer,
            status=status,
        )
    print(f"✅ Tạo {len(meetings_data)} phòng họp hôm nay.")
else:
    print(f"⏩ Đã có phòng họp hôm nay, bỏ qua.")

print()
print("=" * 60)
print("🎉 Seed data hoàn thành!")
print()
print("Tài khoản để test:")
print("  👑 admin         / admin123456  → Quyền: admin")
print("  👤 hieu501250367 / hieu123456   → Quyền: staff (sinh nhật hôm nay)")
print()
print("Endpoint API:")
print("  POST http://127.0.0.1:8000/api/auth/login/")
print("  GET  http://127.0.0.1:8000/api/auth/profile/        (cần Bearer token)")
print("  GET  http://127.0.0.1:8000/api/dashboard/overview/  (cần Bearer token)")
print("  http://127.0.0.1:8000/admin/")
print("=" * 60)
