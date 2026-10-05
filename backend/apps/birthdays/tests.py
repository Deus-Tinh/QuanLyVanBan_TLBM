from datetime import date
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core import mail
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Position
from birthdays.models import BirthdayEmailLog, BirthdayEmailStatus, BirthdayWish, BirthdayWishStatus
from birthdays.services import generate_birthday_email_html, is_birthday_on_date, send_automated_birthday_emails
from organizations.models import DonVi, KhoiKhuVuc

Employee = get_user_model()


class BirthdaySystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        khoi = KhoiKhuVuc.objects.create(ten="Khối Đào tạo")
        self.don_vi = DonVi.objects.create(khoi=khoi, stt_uu_tien=1, ten="Khoa CNTT")
        self.chuc_vu = Position.objects.create(display_order=1, name="Giảng viên")

        # 1. Nhân viên thường (có quyền view_sinhnhat, send_wish_sinhnhat)
        self.emp_staff = Employee.objects.create_user(
            username="staff1",
            password="password123",
            email="staff1@itc.edu.vn",
            ho_ten="Nguyễn Văn An",
            ngay_sinh=date(1990, 5, 20),
            don_vi=self.don_vi,
            chuc_vu=self.chuc_vu,
            is_active=True,
        )
        perm_view = Permission.objects.get(codename="view_sinhnhat")
        perm_wish = Permission.objects.get(codename="send_wish_sinhnhat")
        self.emp_staff.user_permissions.add(perm_view, perm_wish)

        # 2. Quản trị viên (superuser)
        self.emp_admin = Employee.objects.create_superuser(
            username="admin1",
            password="password123",
            email="admin1@itc.edu.vn",
            ho_ten="Trần Thị Bình",
            ngay_sinh=date(1985, 5, 20),
            don_vi=self.don_vi,
            chuc_vu=self.chuc_vu,
        )

        # 3. Nhân viên sinh 29/02
        self.emp_leap = Employee.objects.create_user(
            username="leapuser",
            password="password123",
            email="leap@itc.edu.vn",
            ho_ten="Lê Nhuận",
            ngay_sinh=date(1996, 2, 29),
            don_vi=self.don_vi,
            chuc_vu=self.chuc_vu,
            is_active=True,
        )

        # 4. User không có quyền
        self.emp_no_perm = Employee.objects.create_user(
            username="noperm",
            password="password123",
            email="noperm@itc.edu.vn",
            ho_ten="Không Có Quyền",
            ngay_sinh=date(1992, 1, 1),
            don_vi=self.don_vi,
            chuc_vu=self.chuc_vu,
            is_active=True,
        )

    def test_leap_year_handling(self):
        """Kiểm tra xử lý ngày 29/02 trong năm nhuận và năm không nhuận."""
        birth_29_feb = date(1996, 2, 29)

        # Năm nhuận 2024: đúng ngày 29/02 là True
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2024, 2, 29)))

        # Năm không nhuận 2025: quy tắc FEB_28 (mặc định)
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2025, 2, 28)))
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 3, 1)))

        # Năm không nhuận 2025: quy tắc MAR_01
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2025, 3, 1), leap_year_strategy="MAR_01"))

        # Quy tắc SKIP: không tự chuyển ngày trong năm không nhuận.
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 2, 28), leap_year_strategy="SKIP"))
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 3, 1), leap_year_strategy="SKIP"))

    def test_calendar_api_privacy_and_rbac(self):
        """Lịch chỉ trả số lượng theo ngày, yêu cầu quyền view_sinhnhat."""
        url = reverse("birthdays:calendar")

        # 401 khi chưa đăng nhập
        response = self.client.get(url, {"month": 5, "year": 2026})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # 403 khi thiếu quyền view_sinhnhat
        self.client.force_authenticate(user=self.emp_no_perm)
        response = self.client.get(url, {"month": 5, "year": 2026})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 200 khi có quyền view_sinhnhat
        self.client.force_authenticate(user=self.emp_staff)
        response = self.client.get(url, {"month": 5, "year": 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["month"], 5)
        self.assertEqual(data["year"], 2026)
        self.assertEqual(data["days"].get("20"), 2)  # An & Bình sinh 20/05
        # Đảm bảo không lộ danh sách cá nhân trong lịch tháng
        self.assertNotIn("employees", data)

    def test_day_birthdays_api(self):
        """API chi tiết ngày có phân trang và chỉ trả trường cần thiết, ẩn năm sinh."""
        url = reverse("birthdays:day_birthdays")
        self.client.force_authenticate(user=self.emp_staff)

        response = self.client.get(url, {"month": 5, "day": 20, "year": 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total"], 2)
        employees = data["employees"]
        self.assertEqual(len(employees), 2)
        emp1 = employees[0]
        self.assertIn("ho_ten", emp1)
        self.assertIn("ngay", emp1)
        self.assertIn("thang", emp1)
        self.assertIn("chuc_vu", emp1)
        self.assertIn("don_vi", emp1)
        # Không công bố năm sinh, email, sdt
        self.assertNotIn("nam", emp1)
        self.assertNotIn("email", emp1)
        self.assertNotIn("sdt", emp1)

    def test_birthday_email_logs_api(self):
        """API nhật ký gửi email yêu cầu quyền view_sinhnhat."""
        log = BirthdayEmailLog.objects.create(
            employee=self.emp_staff,
            sent_date=date(2026, 5, 20),
            recipient_email=self.emp_staff.email,
            subject="Chúc mừng sinh nhật",
            status=BirthdayEmailStatus.SUCCESS,
        )

        url = reverse("birthdays:logs")
        self.client.force_authenticate(user=self.emp_staff)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["logs"][0]["employee_name"], self.emp_staff.ho_ten)
        self.assertEqual(data["logs"][0]["status"], BirthdayEmailStatus.SUCCESS)

    def test_birthday_wishes_api(self):
        """API gửi lời chúc mừng sinh nhật yêu cầu quyền send_wish_sinhnhat."""
        url = reverse("birthdays:wishes")

        # 403 khi user không có quyền
        self.client.force_authenticate(user=self.emp_no_perm)
        response = self.client.post(url, {
            "employee_id": self.emp_staff.id,
            "message": "Chúc bạn sinh nhật vui vẻ!",
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 201 khi user có quyền send_wish_sinhnhat
        self.client.force_authenticate(user=self.emp_staff)
        response = self.client.post(url, {
            "employee_id": self.emp_staff.id,
            "message": "Chúc bạn sinh nhật vui vẻ và thành công!",
            "is_anonymous": False,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BirthdayWish.objects.count(), 1)
        wish = BirthdayWish.objects.first()
        self.assertEqual(wish.message, "Chúc bạn sinh nhật vui vẻ và thành công!")
        self.assertEqual(wish.status, BirthdayWishStatus.APPROVED)

        # GET danh sách lời chúc
        get_response = self.client.get(url, {"employee_id": self.emp_staff.id})
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_response.json()["wishes"]), 1)

    @override_settings(
        MAILERS={"default": {"BACKEND": "django.core.mail.backends.locmem.EmailBackend"}},
        BIRTHDAY_LEAP_DAY_STRATEGY="FEB_28",
    )
    def test_send_automated_birthday_emails_success(self):
        """Gửi email tự động thành công cho nhân viên đến ngày sinh nhật."""
        mail.outbox.clear()
        target_date = date(2026, 5, 20)

        results = send_automated_birthday_emails(
            target_date=target_date,
            allow_test_email_backend=True,
        )

        self.assertEqual(results["total_eligible"], 2)  # An và Bình
        self.assertEqual(results["sent_count"], 2)
        self.assertEqual(results["failed_count"], 0)
        self.assertEqual(len(mail.outbox), 2)

        # Kiểm tra BirthdayEmailLog được tạo đúng trạng thái SUCCESS
        logs = BirthdayEmailLog.objects.filter(sent_date=target_date)
        self.assertEqual(logs.count(), 2)
        for log in logs:
            self.assertEqual(log.status, BirthdayEmailStatus.SUCCESS)
            self.assertIsNotNone(log.sent_at)

        # Chạy lại cùng ngày: Không gửi trùng (anti-duplicate)
        mail.outbox.clear()
        results_rerun = send_automated_birthday_emails(
            target_date=target_date,
            allow_test_email_backend=True,
        )
        self.assertEqual(results_rerun["sent_count"], 0)
        self.assertEqual(results_rerun["skipped_count"], 2)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        MAILERS={"default": {"BACKEND": "django.core.mail.backends.locmem.EmailBackend"}},
        BIRTHDAY_LEAP_DAY_STRATEGY="FEB_28",
    )
    def test_send_birthday_emails_management_command(self):
        """Kiểm tra lệnh quản trị send_birthday_emails qua call_command."""
        mail.outbox.clear()
        call_command(
            "send_birthday_emails",
            "--date=2026-05-20",
            "--allow-locmem",
        )
        self.assertEqual(len(mail.outbox), 2)
