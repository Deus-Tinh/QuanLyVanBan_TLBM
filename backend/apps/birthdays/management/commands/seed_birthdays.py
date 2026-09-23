from datetime import date, timedelta
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import StaffProfile


class Command(BaseCommand):
    help = "Tao du lieu mau CBNV co ngay sinh nhat de kiem thu he thong."

    def handle(self, *args, **options):
        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)

        sample_staff = [
            {
                "username": "tinh.tran",
                "full_name": "Tran Dinh Tinh",
                "email": "tinh.tran@itc.edu.vn",
                "department": "To Cong nghe & He thong",
                "position": "Chuyen vien Ky thuat phan mem",
                "birthday": date(2000, today.month, today.day),
                "role": "staff",
            },
            {
                "username": "tan.to",
                "full_name": "To Thanh Tan",
                "email": "tan.to@itc.edu.vn",
                "department": "To Quan tri Du lieu & He thong",
                "position": "Truong nhom DA",
                "birthday": date(1998, today.month, today.day),
                "role": "admin",
            },
            {
                "username": "hieu.nguyen",
                "full_name": "Nguyen Phan Minh Hieu",
                "email": "hieu.nguyen@itc.edu.vn",
                "department": "Khoa Cong nghe Thong tin",
                "position": "Giang vien - Chuyen vien",
                "birthday": date(1995, tomorrow.month, tomorrow.day),
                "role": "staff",
            },
            {
                "username": "khanh.le",
                "full_name": "Le Duy Khanh",
                "email": "khanh.le@itc.edu.vn",
                "department": "Phong To chuc Can bo",
                "position": "Chuyen vien Nhan su",
                "birthday": date(1992, today.month, min(28, max(1, today.day - 3))),
                "role": "staff",
            },
            {
                "username": "quang.do",
                "full_name": "Do Manh Quang",
                "email": "quang.do@itc.edu.vn",
                "department": "Ban Dam bao Chat luong",
                "position": "Chuyen vien Kiem dinh",
                "birthday": date(1996, today.month, min(28, today.day + 5)),
                "role": "staff",
            },
            {
                "username": "nhuan.nguyen",
                "full_name": "Nguyen Thi Nhuan",
                "email": "nhuan.nguyen@itc.edu.vn",
                "department": "Phong Dao tao",
                "position": "Chuyen vien Quan ly sinh vien",
                "birthday": date(1996, 2, 29),
                "role": "staff",
            },
        ]

        created_count = 0
        updated_count = 0

        for item in sample_staff:
            user, u_created = User.objects.get_or_create(
                username=item["username"],
                defaults={
                    "email": item["email"],
                    "first_name": item["full_name"].split()[-1],
                    "last_name": " ".join(item["full_name"].split()[:-1]),
                    "is_active": True,
                },
            )
            if u_created:
                user.set_password("Itc@123456")
                user.save()

            profile, p_created = StaffProfile.objects.update_or_create(
                user=user,
                defaults={
                    "full_name": item["full_name"],
                    "department": item["department"],
                    "position": item["position"],
                    "role": item["role"],
                    "birthday": item["birthday"],
                },
            )

            if p_created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Seed du lieu sinh nhat hoan tat: Tao moi {created_count} CBNV, cap nhat {updated_count} CBNV."
            )
        )
