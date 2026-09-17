from datetime import time, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from accounts.models import StaffProfile
from dashboard.models import IncomingDocument, OutgoingDocument, MeetingRoom


class Command(BaseCommand):
    help = "Khoi tao du lieu nguoi dung test chuan cong vu va du lieu mau cho Dashboard."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Dang khoi tao du lieu mau theo chuan Hieu.md..."))

        # ── 1. Tạo tài khoản Admin ──────────────────────────────────────────
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "quantri@donvi.gov.vn",
                "first_name": "Quan Tri Vien",
                "last_name": "He Thong",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.set_password("Admin@123")
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.email = "quantri@donvi.gov.vn"
        admin_user.save()

        today = timezone.localdate()
        StaffProfile.objects.update_or_create(
            user=admin_user,
            defaults={
                "full_name": "Quan Tri Vien He Thong",
                "department": "Van phong Trung tam",
                "position": "Quan tri vien toi cao",
                "role": "admin",
                "phone": "028.3896.8888",
                "birthday": today.replace(year=1990),
            },
        )
        self.stdout.write(self.style.SUCCESS("[OK] Tai khoan Admin: admin / Admin@123 (quantri@donvi.gov.vn)"))

        # ── 2. Tạo tài khoản Cán bộ (staff) ─────────────────────────────────
        canbo_user, _ = User.objects.get_or_create(
            username="canbo",
            defaults={
                "email": "canbo@donvi.gov.vn",
                "first_name": "Can Bo",
                "last_name": "Xu Ly Van Ban",
                "is_staff": True,
                "is_superuser": False,
            },
        )
        canbo_user.set_password("Canbo@123")
        canbo_user.is_staff = True
        canbo_user.is_superuser = False
        canbo_user.is_active = True
        canbo_user.email = "canbo@donvi.gov.vn"
        canbo_user.save()

        tomorrow = today + timedelta(days=1)
        StaffProfile.objects.update_or_create(
            user=canbo_user,
            defaults={
                "full_name": "Can Bo Xu Ly Van Ban",
                "department": "Phong To chuc - Hanh chinh",
                "position": "Chuyen vien van thu",
                "role": "staff",
                "phone": "028.3896.6666",
                "birthday": today.replace(year=1995, month=tomorrow.month, day=tomorrow.day),
            },
        )
        self.stdout.write(self.style.SUCCESS("[OK] Tai khoan Can bo: canbo / Canbo@123 (canbo@donvi.gov.vn)"))

        # Xóa tài khoản cũ nếu có MSSV để đảm bảo DevOps audit
        User.objects.filter(username__contains="501250").delete()

        # ── 3. Khởi tạo văn bản mẫu ──────────────────────────────────────────
        incoming_samples = [
            ("128/QD-UBND", "V/v phe duyet de an chuyen doi so cong vu giai doan 2026-2030", today, "UBND TP.HCM", False),
            ("45/CV-STTTT", "Huong dan trien khai he thong quan ly van ban va dieu hanh", today - timedelta(days=1), "So Thong tin va Truyen thong", False),
            ("09/BC-TTr", "Bao cao cong tac thanh tra hanh chinh quy 3/2026", today - timedelta(days=2), "Thanh tra Thanh pho", False),
            ("88/TB-VP", "Thong bao ket luan cuoc hop giao ban thuong ky thang 9", today - timedelta(days=3), "Van phong UBND", False),
            ("12/KH-SNV", "Ke hoach dao tao, boi duong can bo cong chuc nam 2026", today - timedelta(days=4), "So Noi vu", False),
        ]
        for code, title, issued_date, sender, is_conf in incoming_samples:
            IncomingDocument.objects.get_or_create(
                code=code,
                defaults={
                    "title": title,
                    "issued_date": issued_date,
                    "sender": sender,
                    "is_confidential": is_conf,
                },
            )

        outgoing_samples = [
            ("52/TTr-ITC", "To trinh xin chu truong nang cap ha tang mang trung tam du lieu", today, "Ban Giam doc So", False),
            ("104/GM-VP", "Giay moi hop ra soat tien do tich hop phan he Dashboard", today - timedelta(days=1), "Cac phong ban truc thuoc", False),
            ("77/TB-BGD", "Thong bao lich nghi va phan cong truc co quan", today - timedelta(days=2), "Toan the CBNV", False),
            ("33/CV-CNTT", "Cong van de nghi cung cap danh muc bieu mau dien tu", today - timedelta(days=3), "Trung tam Luu tru", False),
            ("15/QD-ITC", "Quyet dinh kien toan to cong tac an toan an ninh mang", today - timedelta(days=5), "Ban Chi dao Chuyen doi so", True),
        ]
        for code, title, issued_date, recipient, is_conf in outgoing_samples:
            OutgoingDocument.objects.get_or_create(
                code=code,
                defaults={
                    "title": title,
                    "issued_date": issued_date,
                    "recipient": recipient,
                    "is_confidential": is_conf,
                },
            )

        # ── 4. Khởi tạo phòng họp hôm nay ───────────────────────────────────
        MeetingRoom.objects.get_or_create(
            room_name="Phong hop A1 - Khu A",
            meeting_title="Hop giao ban dinh ky",
            date=today,
            defaults={
                "start_time": time(8, 30),
                "end_time": time(11, 30),
                "organizer": "Van phong Trung tam",
                "status": "ready",
            },
        )
        MeetingRoom.objects.get_or_create(
            room_name="Phong hop Truc tuyen B2",
            meeting_title="Hop truc tuyen voi So TT&TT ve tich hop API",
            date=today,
            defaults={
                "start_time": time(14, 0),
                "end_time": time(16, 30),
                "organizer": "Ban Cong nghe thong tin",
                "status": "upcoming",
            },
        )

        self.stdout.write(self.style.SUCCESS("[OK] Da khoi tao hoan tat du lieu mau. He thong san sang!"))
