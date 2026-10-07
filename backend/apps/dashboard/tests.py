from datetime import date, timedelta, time
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import StaffProfile
from dashboard.models import IncomingDocument, OutgoingDocument, MeetingRoom


class DashboardAPITests(TestCase):
    def setUp(self):
        IncomingDocument.objects.all().delete()
        OutgoingDocument.objects.all().delete()
        MeetingRoom.objects.all().delete()

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

        # 3. Tạo văn bản thường (NOI_BO) và văn bản hạn chế (HAN_CHE) theo chuẩn DDL v0
        self.doc_normal = IncomingDocument.objects.create(
            so_hieu="VB-THUONG-01",
            trich_yeu="Văn bản thông thường công khai",
            ngay_den=self.today,
            noi_ban_hanh="Sở Giáo Dục",
            pham_vi=IncomingDocument.PhamVi.NOI_BO,
        )
        self.doc_secret = IncomingDocument.objects.create(
            so_hieu="VB-MAT-01",
            trich_yeu="Văn bản hạn chế nội bộ",
            ngay_den=self.today,
            noi_ban_hanh="Ban Cơ Yếu",
            pham_vi=IncomingDocument.PhamVi.HAN_CHE,
        )
        self.out_normal = OutgoingDocument.objects.create(
            so_hieu="VBD-THUONG-01",
            trich_yeu="Văn bản đi công khai",
            ngay_ban_hanh=self.today,
            noi_ban_hanh="UBND TP.HCM",
            pham_vi=OutgoingDocument.PhamVi.NOI_BO,
        )
        self.out_secret = OutgoingDocument.objects.create(
            so_hieu="VBD-MAT-01",
            trich_yeu="Văn bản đi hạn chế",
            ngay_ban_hanh=self.today,
            noi_ban_hanh="Thủ trưởng đơn vị",
            pham_vi=OutgoingDocument.PhamVi.HAN_CHE,
        )

        # 4. Phòng họp theo chuẩn DDL meetings_meetingroom / booking
        MeetingRoom.objects.create(
            name="Phòng họp A1 - Khu A",
            title="Họp giao ban định kỳ",
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
