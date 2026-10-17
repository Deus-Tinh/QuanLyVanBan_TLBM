"""
Tạo/cập nhật 5 tài khoản demo theo quy định: admin, vanthu, chuyenvien, truongphong, giamdoc.

Mật khẩu chung đọc từ biến môi trường DEMO_PASSWORD (backend/.env, không commit); thiếu thì báo lỗi.
Luồng trình ký demo: chuyenvien tạo trình -> truongphong ký -> giamdoc ký chính; vanthu là văn thư.
"""

import os

from django.apps import apps
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import Employee, Position
from organizations.models import DonVi

# (username, họ tên hiển thị, chức vụ, mã nhóm quyền SQL_Fix4, là quản trị)
TAI_KHOAN_DEMO = [
    ("admin", "Quản trị hệ thống", "Quản trị viên", "ADMIN", True),
    ("vanthu", "Văn thư", "Văn thư", "VT", False),
    ("chuyenvien", "Chuyên viên", "Chuyên viên", "CV", False),
    ("truongphong", "Trưởng phòng", "Trưởng phòng", "TP", False),
    ("giamdoc", "Giám đốc", "Lãnh đạo cơ quan", "BGD", False),
]
DON_VI_DEMO = "Ban công nghệ thông tin"


def _nhom_quyen(ma):
    """auth_group theo `ma_nhom_quyen` (bảng mở rộng của app authorization); không có thì bỏ qua."""
    if not apps.is_installed("authorization"):
        return None
    info = apps.get_model("authorization", "GroupInfo").objects.filter(ma_nhom_quyen=ma).first()
    return Group.objects.filter(pk=info.pk).first() if info else None


def _chuc_vu(ten):
    chuc_vu = Position.objects.filter(name=ten).first()
    if chuc_vu is None:
        chuc_vu = Position.objects.create(name=ten, display_order=Position.get_next_display_order())
    return chuc_vu


class Command(BaseCommand):
    help = "Tạo/cập nhật 5 tài khoản demo (admin, vanthu, chuyenvien, truongphong, giamdoc); mật khẩu lấy từ DEMO_PASSWORD."

    def add_arguments(self, parser):
        parser.add_argument("--email-domain", default="",
                            help="Đặt email <username>@<domain> cho từng tài khoản (mặc định: giữ email hiện có)")
        parser.add_argument("--mat-khau-la-username", action="store_true",
                            help="Đặt mật khẩu của từng tài khoản trùng với username của tài khoản đó.")

    def handle(self, *args, **options):
        mat_khau = os.getenv("DEMO_PASSWORD") if "DEMO_PASSWORD" in os.environ else os.getenv("SIGNING_DEMO_PASSWORD", "")
        if not mat_khau and not options.get("mat_khau_la_username"):
            raise CommandError("Chưa đặt biến môi trường DEMO_PASSWORD (khai báo trong backend/.env).")
        mien = options["email_domain"].strip().lstrip("@")
        UserModel = get_user_model()
        don_vi = DonVi.objects.filter(ten=DON_VI_DEMO).first() or DonVi.objects.order_by("stt_uu_tien").first()
        with transaction.atomic():
            for username, ho_ten, ten_chuc_vu, ma_nhom, quan_tri in TAI_KHOAN_DEMO:
                email = f"{username}@{mien}" if mien else None
                if email and UserModel.objects.filter(email=email).exclude(username=username).exists():
                    raise CommandError(f"Email {email} đã thuộc tài khoản khác.")
                nguoi_dung = UserModel.objects.filter(username=username).first()
                if nguoi_dung is None:
                    nguoi_dung = UserModel.objects.create_user(
                        username, ho_ten=ho_ten, chuc_vu=_chuc_vu(ten_chuc_vu), don_vi=don_vi, email=email,
                    )
                nguoi_dung.ho_ten = ho_ten
                nguoi_dung.chuc_vu = _chuc_vu(ten_chuc_vu)
                nguoi_dung.don_vi = don_vi or nguoi_dung.don_vi
                if email:
                    nguoi_dung.email = email
                nguoi_dung.trang_thai = Employee.Status.LAM_VIEC
                nguoi_dung.is_active = True
                nguoi_dung.is_staff = quan_tri
                nguoi_dung.is_superuser = quan_tri
                nguoi_dung.set_password(username if options.get("mat_khau_la_username") else mat_khau)
                nguoi_dung.save()
                nhom = _nhom_quyen(ma_nhom)
                if nhom is not None:
                    nguoi_dung.groups.set([nhom])
                if username == "chuyenvien":
                    from django.contrib.auth.models import Permission
                    p = Permission.objects.filter(codename="send_trinhky").first()
                    if p:
                        nguoi_dung.user_permissions.add(p)
                self.stdout.write(f" [OK] {username} — {ho_ten}" + ("" if nhom else " (chưa có nhóm quyền)"))
        self.stdout.write(self.style.SUCCESS(f"Đã tạo/cập nhật {len(TAI_KHOAN_DEMO)} tài khoản demo."))
