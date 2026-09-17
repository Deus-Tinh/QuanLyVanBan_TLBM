from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import StaffProfile
from dashboard.models import IncomingDocument, OutgoingDocument, MeetingRoom


class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword123",
        )
        self.today = timezone.localdate()
        self.tomorrow = self.today + timedelta(days=1)

        # Tạo CBNV có sinh nhật ngày mai
        StaffProfile.objects.create(
            user=self.user,
            full_name="Nguyễn Văn Ngày Mai",
            department="Ban Kế hoạch",
            position="Chuyên viên",
            birthday=date(1995, self.tomorrow.month, self.tomorrow.day),
        )

    def test_overview_unauthorized(self):
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_overview_authorized(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn("stats", data)
        self.assertIn("recent_incoming", data)
        self.assertIn("recent_outgoing", data)
        self.assertIn("today_meetings", data)
        self.assertIn("birthdays", data)

        # Kiểm tra danh sách sinh nhật ngày mai có đúng cán bộ vừa tạo
        tomorrow_birthdays = data["birthdays"]["tomorrow"]
        self.assertTrue(any(b["full_name"] == "Nguyễn Văn Ngày Mai" for b in tomorrow_birthdays))

    def test_tomorrow_date_calculation(self):
        """Test tính toán ngày mai chính xác với các ngày cuối tháng/cuối năm."""
        d1 = date(2026, 12, 30)
        self.assertEqual(d1 + timedelta(days=1), date(2026, 12, 31))

        d2 = date(2026, 12, 31)
        self.assertEqual(d2 + timedelta(days=1), date(2027, 1, 1))

        d3 = date(2026, 2, 28)
        self.assertEqual(d3 + timedelta(days=1), date(2026, 3, 1))
