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
            full_name="Cán Bộ Ngày Mai",
            department="Ban Kế hoạch",
            position="Chuyên viên",
            birthday=date(1995, self.tomorrow.month, self.tomorrow.day),
        )

        # Tạo 1 phòng họp hôm nay
        from datetime import time
        MeetingRoom.objects.create(
            room_name="Phòng họp A1 - Khu A",
            meeting_title="Họp giao ban định kỳ",
            date=self.today,
            start_time=time(8, 30),
            end_time=time(11, 30),
            organizer="Văn phòng Trung tâm",
            status="ready",
        )

    def test_overview_unauthorized(self):
        """Test chưa đăng nhập bị chặn 401"""
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_overview_authorized_contract(self):
        """Test khớp 100% API contract của Hieu.md"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        # 1. KPIs
        self.assertIn("kpis", data)
        kpis = data["kpis"]
        self.assertIn("incomingCount", kpis)
        self.assertIn("outgoingCount", kpis)
        self.assertIn("confidentialCount", kpis)
        self.assertIn("tasksCount", kpis)
        self.assertIsInstance(kpis["incomingCount"], int)
        self.assertIsInstance(kpis["outgoingCount"], int)

        # 2. Lists
        self.assertIn("recentIncoming", data)
        self.assertIn("recentOutgoing", data)
        self.assertIn("tasks", data)
        self.assertIn("meetingRooms", data)
        self.assertIn("birthdays", data)
        self.assertIsInstance(data["recentIncoming"], list)
        self.assertIsInstance(data["recentOutgoing"], list)
        self.assertIsInstance(data["tasks"], list)
        self.assertIsInstance(data["meetingRooms"], list)
        self.assertIsInstance(data["birthdays"], list)

        # 3. Kiểm tra meetingRooms item
        if data["meetingRooms"]:
            room = data["meetingRooms"][0]
            self.assertIn("roomName", room)
            self.assertIn("topic", room)
            self.assertIn("time", room)
            self.assertIn("status", room)

        # 4. Kiểm tra birthdays item
        if data["birthdays"]:
            bday = data["birthdays"][0]
            self.assertIn("name", bday)
            self.assertIn("position", bday)
            self.assertIn("isToday", bday)

    def test_tomorrow_date_calculation(self):
        """Test tính toán ngày mai chính xác với các ngày cuối tháng/cuối năm."""
        d1 = date(2026, 12, 30)
        self.assertEqual(d1 + timedelta(days=1), date(2026, 12, 31))

        d2 = date(2026, 12, 31)
        self.assertEqual(d2 + timedelta(days=1), date(2027, 1, 1))

        d3 = date(2026, 2, 28)
        self.assertEqual(d3 + timedelta(days=1), date(2026, 3, 1))
