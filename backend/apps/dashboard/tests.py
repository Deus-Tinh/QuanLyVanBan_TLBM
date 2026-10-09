from datetime import date, timedelta
from django.apps import apps
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Position
from documents.models import PhamVi, VanBanDen, VanBanDi
from organizations.models import DonVi, KhoiKhuVuc


class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()
        self.tomorrow = self.today + timedelta(days=1)

        khoi = KhoiKhuVuc.objects.create(ten="Khối Hỗ trợ")
        don_vi = DonVi.objects.create(khoi=khoi, stt_uu_tien=1, ten="Phòng Hành chính")
        chuc_vu = Position.objects.create(display_order=1, name="Chuyên viên văn thư")
        UserModel = get_user_model()

        self.staff_user = UserModel.objects.create_user(
            username="staffuser",
            password="password123",
            ho_ten="Cán Bộ Nhân Viên",
            don_vi=don_vi,
            chuc_vu=chuc_vu,
            ngay_sinh=date(1995, self.today.month, self.today.day),
        )
        self.staff_user.user_permissions.add(*Permission.objects.filter(
            codename__in=("view_vanbanden", "view_vanbandi")
        ))
        self.admin_user = UserModel.objects.create_superuser(
            username="adminuser",
            password="password123",
            ho_ten="Quản Trị Viên",
            don_vi=don_vi,
            chuc_vu=chuc_vu,
            ngay_sinh=date(1990, self.tomorrow.month, self.tomorrow.day),
        )

    def test_overview_unauthorized(self):
        """Yêu cầu chưa xác thực phải bị từ chối 401."""
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_overview_authorized_contract(self):
        """Người dùng hợp lệ nhận đủ các khóa của hợp đồng API."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ("kpis", "recentIncoming", "recentOutgoing", "tasks", "meetingRooms", "birthdays"):
            self.assertIn(key, response.data)
        self.assertEqual(
            set(response.data["kpis"]), {"incomingCount", "outgoingCount", "tasksCount"}
        )

    def test_documents_use_shared_visibility_for_counts_and_recent_lists(self):
        """KPI và 5 bản ghi gần nhất chỉ gồm văn bản mà người gọi được xem."""
        VanBanDen.objects.create(
            nam=self.today.year, so_thu_tu=10, so_hieu="DEN-10", trich_yeu="Đến nội bộ",
            nguoi_tao=self.admin_user, pham_vi=PhamVi.NOI_BO,
        )
        VanBanDen.objects.create(
            nam=self.today.year, so_thu_tu=11, so_hieu="DEN-11", trich_yeu="Đến hạn chế của cán bộ",
            nguoi_tao=self.staff_user, pham_vi=PhamVi.HAN_CHE,
        )
        VanBanDen.objects.create(
            nam=self.today.year, so_thu_tu=12, so_hieu="DEN-12", trich_yeu="Đến hạn chế khác",
            nguoi_tao=self.admin_user, pham_vi=PhamVi.HAN_CHE,
        )
        VanBanDi.objects.create(
            nam=self.today.year, so_thu_tu=10, so_hieu="DI-10", trich_yeu="Đi nội bộ",
            nguoi_tao=self.admin_user, pham_vi=PhamVi.NOI_BO,
        )
        VanBanDi.objects.create(
            nam=self.today.year, so_thu_tu=11, so_hieu="DI-11", trich_yeu="Đi hạn chế của cán bộ",
            nguoi_tao=self.staff_user, pham_vi=PhamVi.HAN_CHE,
        )

        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["kpis"]["incomingCount"], 2)
        self.assertEqual(response.data["kpis"]["outgoingCount"], 2)
        self.assertEqual(
            {doc["code"] for doc in response.data["recentIncoming"]}, {"DEN-10", "DEN-11"}
        )
        self.assertEqual(
            {doc["code"] for doc in response.data["recentOutgoing"]}, {"DI-10", "DI-11"}
        )
        self.assertEqual(response.data["meetingRooms"], [])

        # Superuser chỉ thấy văn bản HAN_CHE do chính mình tạo.
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.data["kpis"]["incomingCount"], 2)
        self.assertEqual(response.data["kpis"]["outgoingCount"], 1)
        self.assertNotIn("DI-11", {doc["code"] for doc in response.data["recentOutgoing"]})

    def test_overview_has_no_confidential_data(self):
        """Không còn khóa văn bản mật; superuser không có đường xem riêng."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertNotIn("confidentialCount", response.data["kpis"])
        self.assertNotIn("confidential_total", response.data["stats"])

    def test_dashboard_defines_no_models(self):
        """Dữ liệu chỉ lấy từ bảng của DDL, dashboard không tạo bảng riêng."""
        self.assertEqual(list(apps.get_app_config("dashboard").get_models()), [])

    def test_overview_birthdays_today_and_tomorrow(self):
        """Sinh nhật hôm nay và ngày mai vẫn đọc từ bảng nhân viên."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        labels = {b["label"] for b in response.data["birthdays"]}
        self.assertEqual(labels, {"Hôm nay", "Ngày mai"})
