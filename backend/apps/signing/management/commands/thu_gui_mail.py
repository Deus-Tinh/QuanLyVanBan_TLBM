"""Gửi một email thử để kiểm tra cấu hình SMTP: `python manage.py thu_gui_mail <email>`."""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from django.core.mail import send_mail


def cau_hinh_mail():
    """(backend, host, port, tài khoản) của mailer mặc định; hỗ trợ MAILERS (Django 6.1) và EMAIL_* (5.2)."""
    mailers = getattr(settings, "MAILERS", None)
    if mailers:
        mac_dinh = mailers.get("default", {})
        tuy_chon = mac_dinh.get("OPTIONS", {})
        return mac_dinh.get("BACKEND", ""), tuy_chon.get("host", ""), tuy_chon.get("port", ""), \
            tuy_chon.get("username", "")
    return (getattr(settings, "EMAIL_BACKEND", ""), getattr(settings, "EMAIL_HOST", ""),
            getattr(settings, "EMAIL_PORT", ""), getattr(settings, "EMAIL_HOST_USER", ""))


class Command(BaseCommand):
    help = "Gửi một email thử tới địa chỉ chỉ định để kiểm tra cấu hình SMTP (không in mật khẩu)."

    def add_arguments(self, parser):
        parser.add_argument("email", help="Địa chỉ nhận email thử")

    def handle(self, *args, **options):
        dia_chi = options["email"]
        try:
            validate_email(dia_chi)
        except ValidationError as exc:
            raise CommandError(f"Địa chỉ email không hợp lệ: {dia_chi}") from exc
        backend, host, port, tai_khoan = cau_hinh_mail()
        self.stdout.write(f"Backend: {backend}")
        self.stdout.write(f"Host: {host or '(trống)'}  Port: {port or '(trống)'}  Tài khoản: {tai_khoan or '(trống)'}")
        self.stdout.write(f"Người gửi: {settings.DEFAULT_FROM_EMAIL}")
        if not (backend.endswith("smtp.EmailBackend") or backend.endswith("BaoLongSmtpEmailBackend")):
            self.stdout.write(self.style.WARNING(
                "CẢNH BÁO: thiếu EMAIL_HOST_PASSWORD trong backend/.env. Đang dùng console backend: "
                "email chỉ in ra màn hình, KHÔNG được gửi thật."))
        try:
            so_thu = send_mail(
                "Thư kiểm tra cấu hình email",
                "Thư này được gửi bằng lệnh thu_gui_mail để kiểm tra cấu hình SMTP của hệ thống QLVB.",
                settings.DEFAULT_FROM_EMAIL,
                [dia_chi],
                fail_silently=False,
            )
        except Exception as exc:
            raise CommandError(f"Gửi email thất bại: {type(exc).__name__}: {exc}") from exc
        if not so_thu:
            raise CommandError("Máy chủ email không nhận thư.")
        self.stdout.write(self.style.SUCCESS(f"Đã gửi email thử tới {dia_chi}."))
