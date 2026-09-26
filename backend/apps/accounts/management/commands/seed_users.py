from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import StaffProfile


class Command(BaseCommand):
    help = "Khoi tao cac tai khoan kiem thu mac dinh (admin & canbo)"

    def handle(self, *args, **options):
        # 1. Quan tri vien
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@baolong.com.vn", "is_staff": True, "is_superuser": True},
        )
        admin_user.set_password("Admin@123")
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

        StaffProfile.objects.update_or_create(
            user=admin_user,
            defaults={
                "full_name": "Quản trị viên Hệ thống",
                "department": "Ban Công nghệ Thông tin",
                "position": "Quản trị viên tối cao",
                "role": "admin",
            },
        )
        self.stdout.write(self.style.SUCCESS("[OK] Da khoi tao tai khoan: admin / Admin@123"))

        # 2. Can bo chuyen vien
        canbo_user, _ = User.objects.get_or_create(
            username="canbo",
            defaults={"email": "canbo@baolong.com.vn", "is_staff": False, "is_superuser": False},
        )
        canbo_user.set_password("Canbo@123")
        canbo_user.save()

        StaffProfile.objects.update_or_create(
            user=canbo_user,
            defaults={
                "full_name": "Cán bộ Chuyên viên",
                "department": "Phòng Hành chính - Nhân sự",
                "position": "Chuyên viên văn thư",
                "role": "staff",
            },
        )
        self.stdout.write(self.style.SUCCESS("[OK] Da khoi tao tai khoan: canbo / Canbo@123"))
