from datetime import date, timedelta
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
        latest_stt = DonVi.objects.order_by("-stt_uu_tien").values_list("stt_uu_tien", flat=True).first() or 0
        don_vi = DonVi.objects.create(khoi=khoi, stt_uu_tien=latest_stt + 1, ten="Phòng Hành chính")
        chuc_vu = Position.objects.create(
            display_order=Position.get_next_display_order(), name="Chuyên viên văn thư"
        )
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

    def test_overview_birthdays_today_and_tomorrow(self):
        """Sinh nhật hôm nay và ngày mai vẫn đọc từ bảng nhân viên."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        labels = {b["label"] for b in response.data["birthdays"]}
        self.assertEqual(labels, {"Hôm nay", "Ngày mai"})

    def test_tasks_match_work_visibility_and_status(self):
        from work.models import Task, TaskAttachment, TaskComment, TaskStatus
        from dashboard.views import _tasks

        own = Task.objects.create(title="Visible task", created_by=self.staff_user,
                                  due_date=self.today, requirement="Review")
        Task.objects.create(title="Other task", created_by=self.admin_user,
                            due_date=self.today, requirement="Review")
        # Hidden tasks remain visible to their creator, as in the work API.
        hidden = Task.objects.create(title="Creator hidden task", created_by=self.staff_user,
                                     due_date=self.today, requirement="Review", is_public=False)
        result = _tasks(self.staff_user, self.today)
        self.assertEqual({row["id"] for row in result}, {str(own.pk), str(hidden.pk)})
        self.assertTrue(all(row["workStatus"] == TaskStatus.CHO_XU_LY for row in result))
        # Evidence takes precedence over the deadline in the domain status selector.
        comment = TaskComment.objects.create(task=own, author=self.staff_user, content="Evidence")
        TaskAttachment.objects.create(task=own, comment=comment, kind="BANG_CHUNG",
                                      file="proof.pdf", uploaded_by=self.staff_user)
        own.due_date = self.today - timedelta(days=1)
        own.created_date = own.due_date
        own.save(update_fields=["due_date", "created_date"])
        result = {row["id"]: row for row in _tasks(self.staff_user, self.today)}
        self.assertEqual(result[str(own.pk)]["workStatus"], TaskStatus.CHO_DUYET)
        self.assertEqual(result[str(own.pk)]["status"], "pending")
        self.assertEqual(len(_tasks(self.admin_user, self.today)), 3)

    def test_resources_match_template_visibility_before_limit(self):
        from document_templates.models import DanhMucTaiLieu, TaiLieuChiTiet
        from document_templates.selectors import visible_resources
        from dashboard.views import _resources

        category = DanhMucTaiLieu.objects.create(
            ten_tai_lieu="Templates", nguoi_lap=self.admin_user
        )
        for i in range(6):
            TaiLieuChiTiet.objects.create(dm_tai_lieu=category, ky_hieu=f"PRIVATE-{i}",
                tieu_de="Private", ngay_dang=self.today, hien_thi="NOI_BO_PHONG_BAN",
                nguoi_tao=self.admin_user, don_vi_id=None)
        for code, creator, unit, visibility, validity in (
            ("PUBLIC", self.admin_user, None, "TAT_CA", "CON_HIEU_LUC"),
            ("OWN", self.staff_user, None, "NOI_BO_PHONG_BAN", "CON_HIEU_LUC"),
            ("DEPT", self.admin_user, self.staff_user.don_vi_id, "NOI_BO_PHONG_BAN", "CON_HIEU_LUC"),
            ("EXPIRED", self.staff_user, None, "TAT_CA", "HET_HIEU_LUC"),
        ):
            TaiLieuChiTiet.objects.create(dm_tai_lieu=category, ky_hieu=code,
                tieu_de=code, ngay_dang=self.today, hien_thi=visibility,
                nguoi_tao=creator, don_vi_id=unit, hieu_luc=validity)
        expected = set(visible_resources(TaiLieuChiTiet.objects.all(), self.staff_user)
                       .filter(hieu_luc="CON_HIEU_LUC").values_list("ky_hieu", flat=True))
        self.assertEqual(expected, {"PUBLIC", "OWN", "DEPT"})
        self.assertEqual({row["code"] for row in _resources(self.staff_user)}, expected)
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual({row["code"] for row in response.data["resources"]}, expected)
