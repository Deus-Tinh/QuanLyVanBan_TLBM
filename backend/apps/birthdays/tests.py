from datetime import date
from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import StaffProfile
from .models import BirthdayEmailLog, BirthdayEmailStatus, BirthdayWish
from .services import is_birthday_on_date, send_automated_birthday_emails


class BirthdaySystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Người dùng thường
        self.user_staff = User.objects.create_user(
            username="staff1", password="password123", email="staff1@itc.edu.vn"
        )
        self.profile_staff = StaffProfile.objects.create(
            user=self.user_staff,
            full_name="Nguyễn Văn An",
            department="Khoa CNTT",
            position="Giảng viên",
            role="staff",
            birthday=date(1990, 5, 20),
        )

        # Quản trị viên
        self.user_admin = User.objects.create_superuser(
            username="admin1", password="password123", email="admin1@itc.edu.vn"
        )
        self.profile_admin = StaffProfile.objects.create(
            user=self.user_admin,
            full_name="Trần Thị Bình",
            department="Ban Giám hiệu",
            position="Phó Hiệu trưởng",
            role="admin",
            birthday=date(1985, 5, 20),
        )

        # Người sinh ngày 29/02
        self.user_leap = User.objects.create_user(
            username="leapuser", password="password123", email="leap@itc.edu.vn"
        )
        self.profile_leap = StaffProfile.objects.create(
            user=self.user_leap,
            full_name="Lê Nhuận",
            department="Phòng Đào tạo",
            position="Chuyên viên",
            role="staff",
            birthday=date(1996, 2, 29),
        )

    def test_leap_year_handling(self):
        """Kiểm tra xử lý ngày 29/02 trong năm nhuận và năm không nhuận."""
        birth_29_feb = date(1996, 2, 29)

        # Năm nhuận 2024: đúng ngày 29/02 là True
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2024, 2, 29)))

        # Năm không nhuận 2025: quy tắc FEB_28
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2025, 2, 28), leap_year_strategy="FEB_28"))
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 3, 1), leap_year_strategy="FEB_28"))

        # Năm không nhuận 2025: quy tắc MAR_01
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2025, 3, 1), leap_year_strategy="MAR_01"))

    def test_calendar_api_privacy(self):
        """Kiểm tra API lịch không để lộ năm sinh/tuổi cho người không có quyền."""
        self.client.force_authenticate(user=self.user_staff)
        url = reverse("birthdays:calendar")
        response = self.client.get(url, {"month": 5, "year": 2026})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("20", data["days"])

        # Kiểm tra không lộ birth_year hoặc age cho user thường
        staff_item = data["days"]["20"][0]
        self.assertNotIn("birth_year", staff_item)
        self.assertNotIn("nam_sinh", staff_item)
        self.assertNotIn("age", staff_item)
        self.assertIn("ho_ten", staff_item)
        self.assertIn("ngay", staff_item)
        self.assertIn("thang", staff_item)

    def test_calendar_api_admin_can_view_sensitive(self):
        """Kiểm tra Quản trị viên có thể xem thông tin năm sinh/tuổi."""
        self.client.force_authenticate(user=self.user_admin)
        url = reverse("birthdays:calendar")
        response = self.client.get(url, {"month": 5, "year": 2026})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        staff_item = data["days"]["20"][0]
        self.assertIn("birth_year", staff_item)
        self.assertIn("age", staff_item)

    def test_day_birthdays_api_pagination(self):
        """Kiểm tra API danh sách sinh nhật theo ngày có phân trang."""
        self.client.force_authenticate(user=self.user_staff)
        url = reverse("birthdays:day_birthdays")
        response = self.client.get(url, {"month": 5, "day": 20, "year": 2026, "page": 1, "page_size": 1})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total"], 2)
        self.assertEqual(len(data["employees"]), 1)
        self.assertTrue(data["has_next"])

    def test_send_automated_birthday_emails_idempotency(self):
        """Kiểm tra gửi email tự động và tính chất chống gửi trùng lặp (idempotency)."""
        target_date = date(2026, 5, 20)

        # Lượt 1: Gửi thành công cho 2 nhân sự
        results1 = send_automated_birthday_emails(target_date=target_date)
        self.assertEqual(results1["sent_count"], 2)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(BirthdayEmailLog.objects.filter(status=BirthdayEmailStatus.SUCCESS).count(), 2)

        # Lượt 2: Chạy lại cùng ngày mà không có force -> Phải bỏ qua (skipped) không gửi lại
        mail.outbox.clear()
        results2 = send_automated_birthday_emails(target_date=target_date)
        self.assertEqual(results2["sent_count"], 0)
        self.assertEqual(results2["skipped_count"], 2)
        self.assertEqual(len(mail.outbox), 0)

    def test_wish_creation_api(self):
        """Kiểm tra gửi lời chúc sinh nhật qua API."""
        self.client.force_authenticate(user=self.user_staff)
        url = reverse("birthdays:wishes")

        payload = {
            "staff_id": self.profile_admin.id,
            "message": "Kính chúc Cô sinh nhật thật nhiều niềm vui và sức khỏe!",
            "card_template": "golden",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(BirthdayWish.objects.count(), 1)
