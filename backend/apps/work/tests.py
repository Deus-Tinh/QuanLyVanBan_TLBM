import datetime
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AttachmentKind, ParticipantRole, Task, TaskAttachment, TaskComment, TaskParticipant, TaskStatus

User = get_user_model()

TEMP_MEDIA_ROOT = tempfile.mkdtemp(prefix="work-tests-")


def pdf_file(name="bang-chung.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 noi dung thu", content_type="application/pdf")


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class WorkTestBase(APITestCase):
    """Dữ liệu dùng chung: người tạo, chủ trì, chỉ đạo, tham gia, người ngoài, quản trị viên."""

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.today = timezone.localdate()
        self.creator = User.objects.create_user("nguoitao", first_name="Duy", last_name="Trần Phương")
        self.host = User.objects.create_user("chutri", first_name="Dũng", last_name="Phan Quốc")
        self.director = User.objects.create_user("chidao", first_name="Hiền", last_name="Nguyễn Thu")
        self.member = User.objects.create_user("thamgia", first_name="Minh", last_name="Nguyễn Bình")
        self.outsider = User.objects.create_user("nguoingoai")
        self.admin = User.objects.create_superuser("quantri", "quantri@example.com", "Admin@123")

    # ----- tiện ích -----

    def days(self, offset):
        return self.today + datetime.timedelta(days=offset)

    def make_task(self, created_offset=0, due_offset=3, is_public=True, title="Công việc thử", **extra):
        task = Task.objects.create(
            title=title,
            requirement="Yêu cầu thử",
            created_date=self.days(created_offset),
            due_date=self.days(due_offset),
            created_by=self.creator,
            is_public=is_public,
            **extra,
        )
        TaskParticipant.objects.bulk_create([
            TaskParticipant(task=task, user=self.host, role=ParticipantRole.CHU_TRI),
            TaskParticipant(task=task, user=self.director, role=ParticipantRole.CHI_DAO),
            TaskParticipant(task=task, user=self.member, role=ParticipantRole.THAM_GIA),
        ])
        return task

    def add_evidence(self, task, user=None, name="bang-chung.pdf"):
        """Tạo file bằng chứng đúng cách: nằm trong một ý kiến của người nộp."""
        author = user or self.member
        comment = TaskComment.objects.create(task=task, author=author, content="Nộp kết quả")
        return TaskAttachment.objects.create(
            task=task,
            comment=comment,
            kind=AttachmentKind.BANG_CHUNG,
            file=pdf_file(name),
            uploaded_by=author,
        )

    def status_of(self, task):
        return Task.objects.with_status().get(pk=task.pk).status

    def login(self, user):
        self.client.force_authenticate(user=user)

    def task_url(self, task, suffix=""):
        return f"/api/work/tasks/{task.pk}/{suffix}"


# ==========================================================================
# ===== KHU VỰC: Tính trạng thái, quyền xem, API trang chủ =====
# ==========================================================================

class TaskStatusTests(WorkTestBase):
    def test_moi_tao_la_cho_xu_ly(self):
        self.assertEqual(self.status_of(self.make_task()), TaskStatus.CHO_XU_LY)

    def test_da_mo_la_dang_xu_ly(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.assertEqual(self.status_of(task), TaskStatus.DANG_XU_LY)

    def test_co_bang_chung_la_cho_duyet(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.add_evidence(task)
        self.assertEqual(self.status_of(task), TaskStatus.CHO_DUYET)

    def test_cho_duyet_khong_bi_dong_bang_khi_qua_han(self):
        task = self.make_task(created_offset=-5, due_offset=-1, first_opened_at=timezone.now())
        self.add_evidence(task)
        self.assertEqual(self.status_of(task), TaskStatus.CHO_DUYET)

    def test_da_duyet_la_hoan_thanh(self):
        task = self.make_task(approved_at=timezone.now(), approved_by=self.host)
        self.add_evidence(task)
        self.assertEqual(self.status_of(task), TaskStatus.HOAN_THANH)

    def test_da_mo_va_het_han_la_chua_hoan_thanh(self):
        task = self.make_task(created_offset=-5, due_offset=-1, first_opened_at=timezone.now())
        self.assertEqual(self.status_of(task), TaskStatus.CHUA_HOAN_THANH)

    def test_chua_mo_va_het_han_la_qua_han(self):
        task = self.make_task(created_offset=-5, due_offset=-1)
        self.assertEqual(self.status_of(task), TaskStatus.QUA_HAN)

    def test_han_la_hom_nay_chua_tinh_het_han(self):
        task = self.make_task(created_offset=-2, due_offset=0)
        self.assertEqual(self.status_of(task), TaskStatus.CHO_XU_LY)

    def test_xoa_het_bang_chung_quay_ve_dang_xu_ly(self):
        task = self.make_task(first_opened_at=timezone.now())
        evidence = self.add_evidence(task)
        evidence.delete()
        self.assertEqual(self.status_of(task), TaskStatus.DANG_XU_LY)

    def test_loc_trang_thai_chay_trong_db(self):
        self.make_task()
        self.make_task(created_offset=-5, due_offset=-1)
        self.make_task(created_offset=-5, due_offset=-2)
        overdue = Task.objects.with_status().filter(status=TaskStatus.QUA_HAN)
        self.assertEqual(overdue.count(), 2)
        self.assertIn("CASE", str(overdue.query).upper())


class TaskVisibilityTests(WorkTestBase):
    def visible_ids(self, user):
        return set(Task.objects.visible_to(user).values_list("id", flat=True))

    def test_nguoi_lien_quan_thay_cong_viec_dang_hien_thi(self):
        task = self.make_task()
        for user in (self.creator, self.host, self.director, self.member):
            self.assertIn(task.pk, self.visible_ids(user))
        self.assertNotIn(task.pk, self.visible_ids(self.outsider))

    def test_cong_viec_dang_an_chi_nguoi_tao_va_admin_thay(self):
        task = self.make_task(is_public=False)
        self.assertIn(task.pk, self.visible_ids(self.creator))
        self.assertIn(task.pk, self.visible_ids(self.admin))
        for user in (self.host, self.director, self.member, self.outsider):
            self.assertNotIn(task.pk, self.visible_ids(user))

    def test_khong_bi_trung_dong_khi_nguoi_tao_kiem_vai_tro(self):
        task = self.make_task()
        TaskParticipant.objects.filter(task=task, user=self.member).update(user=self.creator)
        self.assertEqual(Task.objects.visible_to(self.creator).filter(pk=task.pk).count(), 1)

    def test_nguoi_ngoai_goi_chi_tiet_nhan_404(self):
        task = self.make_task()
        self.login(self.outsider)
        response = self.client.get(self.task_url(task))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Hãy quay lại danh sách", response.data["detail"])


class LatestTasksApiTests(WorkTestBase):
    def test_tra_toi_da_limit_cong_viec_moi_nhat_ma_user_duoc_xem(self):
        for index in range(7):
            self.make_task(title=f"Việc {index}", created_offset=index, due_offset=index + 3)
        self.make_task(title="Việc bị ẩn", created_offset=10, due_offset=13, is_public=False)

        self.login(self.member)
        response = self.client.get("/api/work/tasks/latest/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["title"] for item in response.data], ["Việc 6", "Việc 5", "Việc 4", "Việc 3", "Việc 2"])
        self.assertEqual(
            set(response.data[0].keys()),
            {"id", "title", "createdDate", "dueDate", "status", "statusLabel"},
        )
        self.assertEqual(response.data[0]["statusLabel"], "Chờ xử lý")

    def test_limit_sai_bao_loi_co_huong_dan(self):
        self.login(self.member)
        response = self.client.get("/api/work/tasks/latest/?limit=100")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("từ 1 đến 20", response.data["limit"][0])


# ==========================================================================
# ===== KHU VỰC: Danh sách, thêm / sửa / xóa =====
# ==========================================================================

class TaskListApiTests(WorkTestBase):
    def test_loc_trang_thai_va_phan_trang_dem_dung(self):
        for _ in range(3):
            self.make_task()
        for _ in range(5):
            self.make_task(created_offset=-5, due_offset=-1)

        self.login(self.member)
        response = self.client.get("/api/work/tasks/", {"status": "QUA_HAN", "pageSize": 2, "page": 3})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 5)
        self.assertEqual(response.data["totalPages"], 3)
        self.assertEqual(response.data["page"], 3)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertTrue(all(item["status"] == "QUA_HAN" for item in response.data["results"]))

    def test_tim_theo_tieu_de_va_loc_khoang_ngay_tao(self):
        self.make_task(title="Báo cáo quý 3", created_offset=-3, due_offset=5)
        self.make_task(title="Báo cáo năm", created_offset=0)
        self.make_task(title="Họp giao ban", created_offset=-3, due_offset=5)

        self.login(self.member)
        response = self.client.get("/api/work/tasks/", {
            "search": "báo cáo",
            "createdFrom": self.days(-4).isoformat(),
            "createdTo": self.days(-1).isoformat(),
        })

        self.assertEqual([item["title"] for item in response.data["results"]], ["Báo cáo quý 3"])

    def test_du_lieu_danh_sach_dung_hinh_dang(self):
        self.make_task()
        self.login(self.host)
        item = self.client.get("/api/work/tasks/").data["results"][0]

        self.assertEqual(item["creator"], {"id": self.creator.pk, "fullName": "Trần Phương Duy", "position": "Nhân viên"})
        self.assertEqual(item["host"]["fullName"], "Phan Quốc Dũng")
        self.assertEqual([p["id"] for p in item["directors"]], [self.director.pk])
        self.assertEqual([p["id"] for p in item["participants"]], [self.member.pk])
        self.assertEqual(item["myRoles"], ["CHU_TRI"])
        self.assertEqual(item["permissions"], {"canEdit": True, "canDelete": True, "canApprove": False, "canUnapprove": False})

    def test_tinh_trang_khong_hop_le(self):
        self.login(self.member)
        response = self.client.get("/api/work/tasks/", {"status": "ABC"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Hãy chọn một tình trạng", response.data["status"][0])

    def test_khoang_ngay_nguoc(self):
        self.login(self.member)
        response = self.client.get("/api/work/tasks/", {
            "createdFrom": self.days(1).isoformat(),
            "createdTo": self.days(-1).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TaskCreateApiTests(WorkTestBase):
    def payload(self, **overrides):
        data = {
            "title": "Chuẩn bị báo cáo tiến độ",
            "createdDate": self.today.isoformat(),
            "dueDate": self.days(5).isoformat(),
            "requirement": "Tổng hợp số liệu",
            "hostId": self.host.pk,
            "directorIds": [self.director.pk],
            "participantIds": [self.member.pk],
        }
        data.update(overrides)
        return data

    def test_tao_thanh_cong_kem_file(self):
        self.login(self.creator)
        data = self.payload(attachments=[pdf_file("Kế hoạch.pdf"), pdf_file("Phụ lục.pdf")])
        response = self.client.post("/api/work/tasks/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["status"], "CHO_XU_LY")
        self.assertTrue(response.data["isPublic"])
        self.assertEqual(response.data["creator"]["id"], self.creator.pk)
        self.assertEqual([f["fileName"] for f in response.data["attachments"]], ["Kế hoạch.pdf", "Phụ lục.pdf"])
        self.assertEqual(response.data["evidences"], [])

    def test_file_luu_theo_thu_muc_nam_thang(self):
        self.login(self.creator)
        self.client.post("/api/work/tasks/", self.payload(attachments=[pdf_file("Kế hoạch.pdf")]), format="multipart")
        stored = TaskAttachment.objects.get().file.name
        self.assertTrue(stored.startswith(f"06_tasks/{self.today:%Y/%m}/"), stored)
        self.assertTrue(stored.endswith(".pdf"))

    def test_khong_bat_buoc_file_dinh_kem(self):
        self.login(self.creator)
        response = self.client.post("/api/work/tasks/", self.payload(), format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_isPublic_false_duoc_luu(self):
        self.login(self.creator)
        response = self.client.post("/api/work/tasks/", self.payload(isPublic="false"), format="multipart")
        self.assertFalse(response.data["isPublic"])

    def test_ngay_tao_trong_qua_khu_bi_chan(self):
        self.login(self.creator)
        response = self.client.post("/api/work/tasks/", self.payload(createdDate=self.days(-1).isoformat()), format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Hãy chọn hôm nay", response.data["createdDate"][0])

    def test_ngay_xu_ly_truoc_ngay_tao_bi_chan(self):
        self.login(self.creator)
        response = self.client.post(
            "/api/work/tasks/",
            self.payload(createdDate=self.days(3).isoformat(), dueDate=self.days(2).isoformat()),
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bằng hoặc sau ngày tạo", response.data["dueDate"][0])

    def test_mot_nguoi_hai_vai_tro_bi_chan(self):
        self.login(self.creator)
        response = self.client.post(
            "/api/work/tasks/",
            self.payload(participantIds=[self.member.pk, self.director.pk]),
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("chỉ giữ một vai trò", response.data["participantIds"][0])

    def test_nguoi_tao_duoc_tu_lam_chu_tri(self):
        self.login(self.creator)
        response = self.client.post("/api/work/tasks/", self.payload(hostId=self.creator.pk), format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(sorted(response.data["myRoles"]), ["CHU_TRI", "NGUOI_TAO"])

    def test_thieu_chi_dao_va_tham_gia_bi_chan(self):
        self.login(self.creator)
        data = self.payload()
        del data["directorIds"], data["participantIds"]
        response = self.client.post("/api/work/tasks/", data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("directorIds", response.data)
        self.assertIn("participantIds", response.data)

    def test_file_sai_dinh_dang_bi_chan(self):
        self.login(self.creator)
        bad = SimpleUploadedFile("chay-thu.exe", b"MZ", content_type="application/octet-stream")
        response = self.client.post("/api/work/tasks/", self.payload(attachments=[bad]), format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("PDF, DOC/DOCX, JPG, JPEG hoặc PNG", str(response.data["attachments"]))
        self.assertFalse(Task.objects.exists())

    def test_file_tu_20mb_bi_chan(self):
        self.login(self.creator)
        big = SimpleUploadedFile("lon.pdf", b"0" * (20 * 1024 * 1024), content_type="application/pdf")
        response = self.client.post("/api/work/tasks/", self.payload(attachments=[big]), format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("dưới 20 MB", str(response.data["attachments"]))


class TaskUpdateDeleteApiTests(WorkTestBase):
    def test_chu_tri_sua_duoc_va_giu_ngay_tao_cu(self):
        task = self.make_task(created_offset=-3, due_offset=3)
        self.login(self.host)
        response = self.client.patch(self.task_url(task), {"title": "Tiêu đề mới"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["title"], "Tiêu đề mới")
        self.assertEqual(response.data["createdDate"], self.days(-3).isoformat())

    def test_chi_dao_khong_duoc_sua(self):
        task = self.make_task()
        self.login(self.director)
        response = self.client.patch(self.task_url(task), {"title": "X"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("liên hệ người tạo hoặc người chủ trì", response.data["detail"])

    def test_admin_khong_lien_quan_chi_xem(self):
        task = self.make_task(is_public=False)
        self.login(self.admin)
        detail = self.client.get(self.task_url(task))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertFalse(any(detail.data["permissions"].values()))
        self.assertEqual(self.client.patch(self.task_url(task), {"title": "X"}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(self.task_url(task)).status_code, status.HTTP_403_FORBIDDEN)

    def test_dang_cho_duyet_khong_sua_duoc(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.add_evidence(task)
        self.login(self.creator)
        response = self.client.patch(self.task_url(task), {"title": "X"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("xóa công việc và tạo lại", response.data["detail"])

    def test_han_xu_ly_khi_sua_phai_tu_hom_nay(self):
        task = self.make_task(created_offset=-3, due_offset=3)
        self.login(self.creator)
        response = self.client.patch(self.task_url(task), {"dueDate": self.days(-1).isoformat()}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("từ hôm nay trở đi", response.data["dueDate"][0])

    def test_doi_nguoi_lien_quan_va_them_bot_file(self):
        task = self.make_task()
        old_file = TaskAttachment.objects.create(
            task=task, kind=AttachmentKind.GIAO_VIEC, file=pdf_file("cu.pdf"), uploaded_by=self.creator
        )
        old_name = old_file.file.name
        self.login(self.creator)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(self.task_url(task), {
                "hostId": self.director.pk,
                "directorIds": [self.host.pk],
                "participantIds": [self.member.pk, self.outsider.pk],
                "removeAttachmentIds": [old_file.pk],
                "attachments": [pdf_file("moi.pdf")],
            }, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["host"]["id"], self.director.pk)
        self.assertEqual({p["id"] for p in response.data["participants"]}, {self.member.pk, self.outsider.pk})
        self.assertEqual([f["fileName"] for f in response.data["attachments"]], ["moi.pdf"])
        self.assertFalse(default_storage.exists(old_name))

    def test_gui_thieu_nhom_nguoi_lien_quan_bi_chan(self):
        task = self.make_task()
        self.login(self.creator)
        response = self.client.patch(self.task_url(task), {"hostId": self.director.pk}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nguoi_tao_xoa_cong_viec_da_dong_bang_va_xoa_file(self):
        task = self.make_task(created_offset=-5, due_offset=-1)
        evidence = self.add_evidence(task)
        file_name = evidence.file.name
        self.login(self.creator)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.delete(self.task_url(task))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(pk=task.pk).exists())
        self.assertFalse(default_storage.exists(file_name))

    def test_can_bo_tham_gia_khong_duoc_xoa(self):
        task = self.make_task()
        self.login(self.member)
        response = self.client.delete(self.task_url(task))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ==========================================================================
# ===== KHU VỰC: Mở chi tiết, bằng chứng, duyệt, ý kiến, tải file =====
# ==========================================================================

class TaskOpenApiTests(WorkTestBase):
    def test_nguoi_lien_quan_mo_lan_dau_duoc_ghi_nhan(self):
        task = self.make_task()
        self.login(self.member)
        response = self.client.post(self.task_url(task, "open/"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "DANG_XU_LY")
        self.assertEqual(response.data["firstOpenedBy"]["id"], self.member.pk)

    def test_mo_lan_sau_khong_ghi_de_nguoi_mo_dau_tien(self):
        task = self.make_task()
        self.login(self.member)
        self.client.post(self.task_url(task, "open/"))
        self.login(self.director)
        response = self.client.post(self.task_url(task, "open/"))
        self.assertEqual(response.data["firstOpenedBy"]["id"], self.member.pk)

    def test_nguoi_tao_mo_khong_tinh_la_da_mo(self):
        task = self.make_task()
        self.login(self.creator)
        response = self.client.post(self.task_url(task, "open/"))
        self.assertEqual(response.data["status"], "CHO_XU_LY")
        self.assertIsNone(response.data["firstOpenedAt"])

    def test_mo_sau_han_khong_doi_qua_han_thanh_chua_hoan_thanh(self):
        task = self.make_task(created_offset=-5, due_offset=-1)
        self.login(self.member)
        response = self.client.post(self.task_url(task, "open/"))
        self.assertEqual(response.data["status"], "QUA_HAN")

    def test_cong_viec_dang_an_nguoi_lien_quan_nhan_404(self):
        task = self.make_task(is_public=False)
        self.login(self.host)
        self.assertEqual(self.client.post(self.task_url(task, "open/")).status_code, status.HTTP_404_NOT_FOUND)


class TaskEvidenceApiTests(WorkTestBase):
    """Nộp kết quả = ghi ý kiến kèm file. File kèm theo là bằng chứng hoàn thành."""

    def submit(self, task, user, *names, content="Đã hoàn thành, gửi kết quả."):
        self.login(user)
        files = [pdf_file(name) for name in (names or ("bang-chung.pdf",))]
        return self.client.post(
            self.task_url(task, "comments/"), {"content": content, "files": files}, format="multipart"
        )

    def detail(self, task):
        return self.client.get(self.task_url(task)).data

    def test_tham_gia_gui_y_kien_kem_file_chuyen_cho_duyet(self):
        task = self.make_task(first_opened_at=timezone.now())
        response = self.submit(task, self.member, "Kết quả.pdf")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["content"], "Đã hoàn thành, gửi kết quả.")
        self.assertEqual([f["fileName"] for f in response.data["attachments"]], ["Kết quả.pdf"])
        self.assertEqual(response.data["attachments"][0]["kind"], "BANG_CHUNG")
        self.assertEqual(response.data["attachments"][0]["commentId"], response.data["id"])
        self.assertTrue(response.data["attachments"][0]["canDelete"])

        detail = self.detail(task)
        self.assertEqual(detail["status"], "CHO_DUYET")
        self.assertEqual(len(detail["evidences"]), 1)
        self.assertEqual(detail["evidences"][0]["uploadedBy"]["id"], self.member.pk)
        self.assertIsNotNone(detail["firstEvidenceAt"])

    def test_y_kien_chi_co_file_khong_can_noi_dung(self):
        task = self.make_task(first_opened_at=timezone.now())
        response = self.submit(task, self.member, content="")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["content"], "")

    def test_y_kien_khong_kem_file_khong_doi_trang_thai(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.login(self.member)
        response = self.client.post(self.task_url(task, "comments/"), {"content": "Đang làm, mai xong."})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["attachments"], [])
        self.assertEqual(self.detail(task)["status"], "DANG_XU_LY")

    def test_nhieu_file_trong_mot_y_kien(self):
        task = self.make_task(first_opened_at=timezone.now())
        response = self.submit(task, self.host, "a.pdf", "b.pdf")
        self.assertEqual(len(response.data["attachments"]), 2)
        self.assertEqual(TaskComment.objects.filter(task=task).count(), 1)

    def test_nguoi_khac_nop_them_khi_dang_cho_duyet(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.submit(task, self.member)
        response = self.submit(task, self.host, "bo-sung.pdf")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(self.detail(task)["evidences"]), 2)

    def test_chi_dao_va_nguoi_tao_chi_ghi_y_kien_chu_khong_kem_file(self):
        task = self.make_task()
        for user in (self.director, self.creator):
            response = self.submit(task, user)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn("gửi ý kiến dạng chữ", response.data["detail"])
            response = self.client.post(self.task_url(task, "comments/"), {"content": "Góp ý"})
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(TaskAttachment.objects.filter(task=task).exists())

    def test_dong_bang_khong_nop_duoc(self):
        task = self.make_task(created_offset=-5, due_offset=-1, first_opened_at=timezone.now())
        response = self.submit(task, self.member)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("đã bị khóa", response.data["detail"])
        self.assertFalse(TaskComment.objects.filter(task=task).exists())

    def test_da_hoan_thanh_khong_kem_file_nhung_van_ghi_y_kien_duoc(self):
        task = self.make_task(approved_at=timezone.now(), approved_by=self.host)
        self.add_evidence(task)
        response = self.submit(task, self.member)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("hủy duyệt trước", response.data["detail"])
        self.assertEqual(TaskComment.objects.filter(task=task).count(), 1)
        response = self.client.post(self.task_url(task, "comments/"), {"content": "Cảm ơn đã duyệt"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_file_sai_dinh_dang_trong_y_kien_bi_chan_va_khong_luu_gi(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.login(self.member)
        bad = SimpleUploadedFile("virus.exe", b"MZ", content_type="application/octet-stream")
        response = self.client.post(
            self.task_url(task, "comments/"), {"content": "Kết quả", "files": [bad]}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("PDF, DOC/DOCX, JPG, JPEG hoặc PNG", str(response.data["files"]))
        self.assertFalse(TaskComment.objects.filter(task=task).exists())

    def test_khong_con_api_nop_bang_chung_rieng(self):
        task = self.make_task()
        self.login(self.member)
        response = self.client.post(self.task_url(task, "evidences/"), {"files": [pdf_file()]}, format="multipart")
        self.assertIn(response.status_code, (status.HTTP_404_NOT_FOUND, status.HTTP_405_METHOD_NOT_ALLOWED))

    def test_xoa_file_thi_y_kien_van_con(self):
        task = self.make_task(first_opened_at=timezone.now())
        evidence = self.add_evidence(task, user=self.member)
        comment_id = evidence.comment_id
        self.login(self.member)
        response = self.client.delete(self.task_url(task, f"evidences/{evidence.pk}/"))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(TaskComment.objects.filter(pk=comment_id).exists())
        comments = self.client.get(self.task_url(task, "comments/")).data
        self.assertEqual(comments[0]["content"], "Nộp kết quả")
        self.assertEqual(comments[0]["attachments"], [])

    def test_rang_buoc_db_file_bang_chung_phai_nam_trong_y_kien(self):
        from django.db import IntegrityError, transaction

        task = self.make_task()
        with self.assertRaises(IntegrityError), transaction.atomic():
            TaskAttachment.objects.create(
                task=task, kind=AttachmentKind.BANG_CHUNG, file=pdf_file(), uploaded_by=self.member
            )

    def test_chi_nguoi_upload_xoa_duoc_file_cua_minh(self):
        task = self.make_task(first_opened_at=timezone.now())
        evidence = self.add_evidence(task, user=self.member)
        self.login(self.host)
        response = self.client.delete(self.task_url(task, f"evidences/{evidence.pk}/"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("do chính mình tải lên", response.data["detail"])

    def test_xoa_file_cuoi_truoc_han_quay_ve_dang_xu_ly(self):
        task = self.make_task(first_opened_at=timezone.now())
        evidence = self.add_evidence(task, user=self.member)
        file_name = evidence.file.name
        self.login(self.member)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.delete(self.task_url(task, f"evidences/{evidence.pk}/"))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["status"], "DANG_XU_LY")
        self.assertFalse(default_storage.exists(file_name))

    def test_qua_han_khong_xoa_duoc_file_bang_chung_cuoi_cung(self):
        task = self.make_task(created_offset=-5, due_offset=-1, first_opened_at=timezone.now())
        evidence = self.add_evidence(task, user=self.member)
        self.login(self.member)
        response = self.client.delete(self.task_url(task, f"evidences/{evidence.pk}/"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "Công việc đã quá hạn, không thể xóa file bằng chứng cuối cùng. Hãy nộp file mới trước rồi xóa file cũ sau.",
        )

    def test_file_cuoi_sau_han_tra_ve_ly_do_khong_xoa_duoc(self):
        task = self.make_task(created_offset=-5, due_offset=-1, first_opened_at=timezone.now())
        self.add_evidence(task, user=self.member)
        self.login(self.member)
        evidence = self.client.get(self.task_url(task)).data["evidences"][0]
        self.assertFalse(evidence["canDelete"])
        self.assertIn("Hãy nộp file mới trước rồi xóa file cũ sau", evidence["deleteBlockedReason"])
        self.login(self.host)
        self.assertIsNone(self.client.get(self.task_url(task)).data["evidences"][0]["deleteBlockedReason"])

    def test_qua_han_con_hai_file_thi_xoa_duoc_mot(self):
        task = self.make_task(created_offset=-5, due_offset=-1, first_opened_at=timezone.now())
        old = self.add_evidence(task, user=self.member, name="cu.pdf")
        self.add_evidence(task, user=self.member, name="moi.pdf")
        self.login(self.member)
        response = self.client.delete(self.task_url(task, f"evidences/{old.pk}/"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "CHO_DUYET")

    def test_da_duyet_khong_xoa_duoc_bang_chung(self):
        task = self.make_task(approved_at=timezone.now(), approved_by=self.host)
        evidence = self.add_evidence(task, user=self.member)
        self.login(self.member)
        response = self.client.delete(self.task_url(task, f"evidences/{evidence.pk}/"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_co_delete_cho_file_cua_chinh_minh(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.add_evidence(task, user=self.member)
        self.login(self.member)
        response = self.client.get(self.task_url(task))
        self.assertTrue(response.data["evidences"][0]["canDelete"])


class TaskApprovalApiTests(WorkTestBase):
    def waiting_task(self, **extra):
        task = self.make_task(first_opened_at=timezone.now(), **extra)
        self.add_evidence(task)
        return task

    def test_chi_dao_duyet_thanh_hoan_thanh(self):
        task = self.waiting_task()
        self.login(self.director)
        response = self.client.post(self.task_url(task, "approve/"))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["status"], "HOAN_THANH")
        self.assertEqual(response.data["approvedBy"]["id"], self.director.pk)

    def test_tham_gia_va_admin_khong_lien_quan_khong_duoc_duyet(self):
        task = self.waiting_task()
        for user in (self.member, self.admin):
            self.login(user)
            response = self.client.post(self.task_url(task, "approve/"))
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn("người tạo, người chủ trì hoặc người chỉ đạo", response.data["detail"])

    def test_nguoi_tao_duyet_va_huy_duyet_duoc(self):
        task = self.waiting_task()
        self.login(self.creator)
        response = self.client.post(self.task_url(task, "approve/"))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["approvedBy"]["id"], self.creator.pk)
        self.assertTrue(response.data["permissions"]["canUnapprove"])
        response = self.client.post(self.task_url(task, "unapprove/"))
        self.assertEqual(response.data["status"], "CHO_DUYET")

    def test_chua_co_bang_chung_khong_duyet_duoc(self):
        task = self.make_task(first_opened_at=timezone.now())
        self.login(self.host)
        response = self.client.post(self.task_url(task, "approve/"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("gửi ý kiến kèm file kết quả", response.data["detail"])

    def test_cho_duyet_qua_han_van_duyet_duoc(self):
        task = self.waiting_task(created_offset=-5, due_offset=-1)
        self.login(self.host)
        response = self.client.post(self.task_url(task, "approve/"))
        self.assertEqual(response.data["status"], "HOAN_THANH")

    def test_huy_duyet_quay_ve_cho_duyet_roi_duyet_lai_khi_qua_han(self):
        task = self.waiting_task(created_offset=-5, due_offset=-1)
        self.login(self.host)
        self.client.post(self.task_url(task, "approve/"))

        response = self.client.post(self.task_url(task, "unapprove/"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "CHO_DUYET")
        self.assertIsNone(response.data["approvedAt"])

        response = self.client.post(self.task_url(task, "approve/"))
        self.assertEqual(response.data["status"], "HOAN_THANH")

    def test_huy_duyet_khi_chua_duyet_bao_loi(self):
        task = self.waiting_task()
        self.login(self.host)
        response = self.client.post(self.task_url(task, "unapprove/"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_co_quyen_trong_danh_sach_theo_trang_thai(self):
        task = self.waiting_task()
        self.login(self.director)
        item = self.client.get("/api/work/tasks/").data["results"][0]
        self.assertTrue(item["permissions"]["canApprove"])
        self.assertFalse(item["permissions"]["canUnapprove"])
        self.client.post(self.task_url(task, "approve/"))
        item = self.client.get("/api/work/tasks/").data["results"][0]
        self.assertFalse(item["permissions"]["canApprove"])
        self.assertTrue(item["permissions"]["canUnapprove"])


class TaskCommentApiTests(WorkTestBase):
    def test_nguoi_lien_quan_ghi_va_xem_y_kien_theo_thu_tu(self):
        task = self.make_task()
        self.login(self.member)
        self.client.post(self.task_url(task, "comments/"), {"content": "Ý kiến 1"})
        self.login(self.creator)
        created = self.client.post(self.task_url(task, "comments/"), {"content": "Ý kiến 2"})
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["author"]["id"], self.creator.pk)

        response = self.client.get(self.task_url(task, "comments/"))
        self.assertEqual([item["content"] for item in response.data], ["Ý kiến 1", "Ý kiến 2"])
        self.assertIn("createdAt", response.data[0])

    def test_y_kien_trong_bi_chan(self):
        task = self.make_task()
        self.login(self.member)
        response = self.client.post(self.task_url(task, "comments/"), {"content": "   "})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Hãy nhập nội dung", response.data["content"][0])

    def test_dong_bang_khong_ghi_y_kien(self):
        task = self.make_task(created_offset=-5, due_offset=-1)
        self.login(self.host)
        response = self.client.post(self.task_url(task, "comments/"), {"content": "Muộn rồi"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(TaskComment.objects.exists())

    def test_admin_xem_duoc_nhung_khong_ghi_y_kien(self):
        task = self.make_task()
        self.login(self.admin)
        self.assertEqual(self.client.get(self.task_url(task, "comments/")).status_code, status.HTTP_200_OK)
        response = self.client.post(self.task_url(task, "comments/"), {"content": "Admin góp ý"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_khong_co_api_sua_xoa_y_kien(self):
        task = self.make_task()
        self.login(self.member)
        self.assertEqual(self.client.patch(self.task_url(task, "comments/"), {}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.delete(self.task_url(task, "comments/")).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class AttachmentDownloadApiTests(WorkTestBase):
    def test_nguoi_duoc_xem_tai_duoc_file_voi_ten_goc(self):
        task = self.make_task()
        evidence = self.add_evidence(task, name="Báo cáo.pdf")
        self.login(self.director)
        response = self.client.get(reverse("work:attachment-download", kwargs={"pk": evidence.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(b"".join(response.streaming_content), b"%PDF-1.4 noi dung thu")
        self.assertIn("attachment", response["Content-Disposition"])
        response.close()

    def test_nguoi_ngoai_khong_tai_duoc(self):
        task = self.make_task()
        evidence = self.add_evidence(task)
        self.login(self.outsider)
        response = self.client.get(reverse("work:attachment-download", kwargs={"pk": evidence.pk}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ==========================================================================
# ===== KHU VỰC: Cán bộ nhân viên, người dùng hiện tại, header giả lập =====
# ==========================================================================

class EmployeeApiTests(WorkTestBase):
    def test_danh_sach_can_bo_co_tim_kiem(self):
        self.login(self.creator)
        response = self.client.get("/api/work/employees/", {"search": "nguyễn"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {item["fullName"] for item in response.data},
            {"Nguyễn Thu Hiền", "Nguyễn Bình Minh"},
        )
        self.assertEqual(response.data[0]["position"], "Nhân viên")

    def test_can_bo_chua_khai_ten_thi_dung_username(self):
        self.login(self.creator)
        response = self.client.get("/api/work/employees/", {"search": "nguoingoai"})
        self.assertEqual(response.data[0]["fullName"], "nguoingoai")

    def test_me_tra_ve_co_isAdmin(self):
        self.login(self.admin)
        response = self.client.get("/api/work/me/")
        self.assertEqual(response.data["id"], self.admin.pk)
        self.assertTrue(response.data["isAdmin"])


@override_settings(DEBUG=True)
class MockHeaderAuthenticationTests(WorkTestBase):
    def test_header_hop_le_dung_user_do(self):
        response = self.client.get("/api/work/me/", HTTP_X_MOCK_USER_ID=str(self.member.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.member.pk)
        self.assertFalse(response.data["isAdmin"])

    def test_khong_gui_header_thi_dung_superuser_dau_tien(self):
        response = self.client.get("/api/work/me/")
        self.assertEqual(response.data["id"], self.admin.pk)

    def test_id_khong_ton_tai_bao_loi_co_huong_dan(self):
        response = self.client.get("/api/work/me/", HTTP_X_MOCK_USER_ID="99999")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Hãy chọn lại người dùng giả lập", response.data["detail"])

    def test_id_khong_phai_so(self):
        response = self.client.get("/api/work/me/", HTTP_X_MOCK_USER_ID="abc")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_chua_co_superuser_huong_dan_createsuperuser(self):
        User.objects.filter(is_superuser=True).delete()
        response = self.client.get("/api/work/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("createsuperuser", response.data["detail"])


class MockHeaderDisabledWhenNotDebugTests(WorkTestBase):
    def test_debug_false_thi_bo_qua_header(self):
        # Test runner luôn chạy với DEBUG=False.
        response = self.client.get("/api/work/me/", HTTP_X_MOCK_USER_ID=str(self.admin.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Bạn chưa đăng nhập", response.data["detail"])
