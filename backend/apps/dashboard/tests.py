from datetime import date, timedelta, time
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import StaffProfile
from dashboard.models import IncomingDocument, OutgoingDocument, MeetingRoom


class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()
        self.tomorrow = self.today + timedelta(days=1)

        # 1. Staff user (cán bộ chuyên viên)
        self.staff_user = User.objects.create_user(username="staffuser", password="password123")
        self.staff_profile = StaffProfile.objects.create(
            user=self.staff_user,
            full_name="Cán Bộ Nhân Viên",
            department="Phòng Hành chính",
            position="Chuyên viên văn thư",
            role="staff",
            birthday=date(1995, self.today.month, self.today.day),
        )

        # 2. Admin user (quản trị viên)
        self.admin_user = User.objects.create_user(username="adminuser", password="password123")
        self.admin_profile = StaffProfile.objects.create(
            user=self.admin_user,
            full_name="Quản Trị Viên",
            department="Văn phòng Trung tâm",
            position="Quản trị viên tối cao",
            role="admin",
            birthday=date(1990, self.tomorrow.month, self.tomorrow.day),
        )

        # 3. Tạo văn bản thường và văn bản mật
        self.doc_normal = IncomingDocument.objects.create(
            code="VB-THUONG-01",
            title="Văn bản thông thường công khai",
            issued_date=self.today,
            sender="Sở Giáo Dục",
            is_confidential=False,
        )
        self.doc_secret = IncomingDocument.objects.create(
            code="VB-MAT-01",
            title="Văn bản tuyệt mật nội bộ",
            issued_date=self.today,
            sender="Ban Cơ Yếu",
            is_confidential=True,
        )
        self.out_normal = OutgoingDocument.objects.create(
            code="VBD-THUONG-01",
            title="Văn bản đi công khai",
            issued_date=self.today,
            recipient="UBND TP.HCM",
            is_confidential=False,
        )
        self.out_secret = OutgoingDocument.objects.create(
            code="VBD-MAT-01",
            title="Văn bản đi mật",
            issued_date=self.today,
            recipient="Thủ trưởng đơn vị",
            is_confidential=True,
        )

        # 4. Phòng họp
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
        """Yêu cầu chưa xác thực phải bị từ chối 401."""
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_overview_authorized_contract(self):
        """User hợp lệ nhận đủ các trường hợp đồng chuẩn."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("kpis", response.data)
        self.assertIn("recentIncoming", response.data)
        self.assertIn("recentOutgoing", response.data)
        self.assertIn("meetingRooms", response.data)
        self.assertIn("birthdays", response.data)

    def test_overview_as_staff_excludes_confidential(self):
        """Cán bộ thường (staff) KHÔNG được thấy văn bản mật và confidentialCount bằng 0."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Confidential KPI phải bằng 0
        self.assertEqual(response.data["kpis"]["confidentialCount"], 0)
        
        # Danh sách gần đây không được chứa văn bản mật
        incoming_codes = [d["code"] for d in response.data["recentIncoming"]]
        outgoing_codes = [d["code"] for d in response.data["recentOutgoing"]]
        self.assertNotIn("VB-MAT-01", incoming_codes)
        self.assertNotIn("VBD-MAT-01", outgoing_codes)
        self.assertIn("VB-THUONG-01", incoming_codes)
        self.assertIn("VBD-THUONG-01", outgoing_codes)

    def test_overview_as_admin_includes_confidential(self):
        """Quản trị viên (admin) được phép thống kê và xem văn bản mật."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Confidential KPI phản ánh đúng 2 văn bản mật đã tạo
        self.assertEqual(response.data["kpis"]["confidentialCount"], 2)

        # Danh sách chứa cả văn bản mật
        incoming_codes = [d["code"] for d in response.data["recentIncoming"]]
        self.assertIn("VB-MAT-01", incoming_codes)

    def test_overview_empty(self):
        """Khi cơ sở dữ liệu trống, API trả về 0 và mảng rỗng không bị crash."""
        IncomingDocument.objects.all().delete()
        OutgoingDocument.objects.all().delete()
        MeetingRoom.objects.all().delete()

        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["kpis"]["incomingCount"], 0)
        self.assertEqual(response.data["kpis"]["outgoingCount"], 0)
        self.assertEqual(response.data["recentIncoming"], [])
        self.assertEqual(response.data["recentOutgoing"], [])
        self.assertEqual(response.data["meetingRooms"], [])

    @override_settings(BIRTHDAY_LEAP_DAY_STRATEGY="FEB_28")
    @patch("dashboard.views.timezone.localdate", return_value=date(2025, 2, 28))
    def test_birthday_widget_excludes_inactive_and_follows_leap_policy(self, _localdate):
        self.admin_profile.birthday = date(1990, 2, 28)
        self.admin_profile.save(update_fields=["birthday"])
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        leap_user = User.objects.create_user(username="leap_staff", password="password123")
        StaffProfile.objects.create(
            user=leap_user,
            full_name="CBNV sinh 29/02",
            birthday=date(1996, 2, 29),
        )

        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        names = [staff["name"] for staff in response.data["birthdays"]]
        self.assertIn("CBNV sinh 29/02", names)
        self.assertNotIn(self.admin_profile.full_name, names)
        leap_birthday = next(staff for staff in response.data["birthdays"] if staff["name"] == "CBNV sinh 29/02")
        self.assertEqual(leap_birthday["birthdate"], "29/02 (Hôm nay)")
