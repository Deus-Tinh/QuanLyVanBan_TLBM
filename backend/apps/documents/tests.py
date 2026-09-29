"""Tests cho Module Văn Bản — Kiến trúc 3 Model (VanBanDen, VanBanDi, VanBanMat)."""

import io
import tempfile
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .filters import DocumentFilter, ViewerFilter
from .models import (
    HieuLuc,
    LoaiVanBan,
    VanBanDen,
    VanBanDenAttachment,
    VanBanDi,
    VanBanDiAttachment,
    VanBanMat,
    VanBanMatAttachment,
    DocumentViewLog,
    Document,
    DocumentAttachment,
)
from .services import (
    export_to_excel,
    generate_excel_template,
    generate_so_thu_tu,
    import_from_excel,
    log_document_view,
)


class GenerateSoThuTuTests(TestCase):
    """Test tự sinh số thứ tự an toàn theo từng model."""

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="test123")

    def test_first_so_thu_tu_is_1(self):
        """Số đầu tiên trong năm phải là 1."""
        result = generate_so_thu_tu("DEN", 2026)
        self.assertEqual(result, 1)

    def test_auto_increment(self):
        """Số tiếp theo phải tăng dần."""
        VanBanDen.objects.create(
            nam=2026, so_hieu="01/CV", so_thu_tu=1,
            trich_yeu="Test 1", nguoi_tao=self.user,
        )
        VanBanDen.objects.create(
            nam=2026, so_hieu="02/CV", so_thu_tu=2,
            trich_yeu="Test 2", nguoi_tao=self.user,
        )
        result = generate_so_thu_tu("DEN", 2026)
        self.assertEqual(result, 3)

    def test_separate_by_year(self):
        """Số thứ tự phải tách riêng theo năm."""
        VanBanDen.objects.create(
            nam=2025, so_hieu="01/CV", so_thu_tu=5,
            trich_yeu="Test 2025", nguoi_tao=self.user,
        )
        result = generate_so_thu_tu("DEN", 2026)
        self.assertEqual(result, 1)

    def test_separate_by_loai(self):
        """Số thứ tự phải tách riêng theo từng loại văn bản (Đến và Đi)."""
        VanBanDen.objects.create(
            nam=2026, so_hieu="01/CV", so_thu_tu=10,
            trich_yeu="Test DEN", nguoi_tao=self.user,
        )
        result = generate_so_thu_tu("DI", 2026)
        self.assertEqual(result, 1)

    def test_mat_returns_none(self):
        """VB Mật không có số thứ tự."""
        result = generate_so_thu_tu("MAT", 2026)
        self.assertIsNone(result)


class DocumentViewLogTests(TestCase):
    """Test ghi log người xem (upsert) khớp bảng documents_view_log."""

    def setUp(self):
        self.user = User.objects.create_user(username="viewer1", password="test123")
        self.doc = VanBanDen.objects.create(
            nam=2026, so_hieu="01/CV", so_thu_tu=1,
            trich_yeu="Test document", nguoi_tao=self.user,
        )

    def test_first_view_creates_log(self):
        """Lần xem đầu tạo bản ghi mới."""
        log_document_view(self.doc, self.user)
        self.assertEqual(DocumentViewLog.objects.count(), 1)
        log = DocumentViewLog.objects.first()
        self.assertEqual(log.document_type, "vanbanden")
        self.assertEqual(log.document_id, self.doc.id)

    def test_second_view_updates_timestamp(self):
        """Lần xem thứ 2 chỉ cập nhật thời gian, không tạo bản ghi mới."""
        log_document_view(self.doc, self.user)
        first_time = DocumentViewLog.objects.first().viewed_at

        log_document_view(self.doc, self.user)
        self.assertEqual(DocumentViewLog.objects.count(), 1)

        updated_time = DocumentViewLog.objects.first().viewed_at
        self.assertGreaterEqual(updated_time, first_time)

    def test_different_users_create_separate_logs(self):
        """Mỗi user có bản ghi riêng."""
        user2 = User.objects.create_user(username="viewer2", password="test123")
        log_document_view(self.doc, self.user)
        log_document_view(self.doc, user2)
        self.assertEqual(DocumentViewLog.objects.count(), 2)


class DocumentModelTests(TestCase):
    """Test trực tiếp 3 models: VanBanDen, VanBanDi, VanBanMat."""

    def setUp(self):
        self.user = User.objects.create_user(username="admin", password="test123")

    def test_create_van_ban_den(self):
        """Tạo VB Đến thành công."""
        doc = VanBanDen.objects.create(
            nam=2026, so_hieu="15/CV-BGDDT", so_thu_tu=1,
            trich_yeu="V/v hướng dẫn tuyển sinh",
            noi_ban_hanh="Bộ GD&ĐT",
            ngay_den=timezone.now(),
            nguoi_tao=self.user,
        )
        self.assertEqual(doc.loai, "DEN")
        self.assertEqual(doc.so_thu_tu, 1)
        self.assertFalse(doc.is_expired)

    def test_create_van_ban_di(self):
        """Tạo VB Đi thành công."""
        doc = VanBanDi.objects.create(
            nam=2026, so_hieu="10/TB-ITC", so_thu_tu=1,
            trich_yeu="Thông báo lịch thi",
            noi_ban_hanh="Trường ITC",
            ngay_ban_hanh=timezone.now(),
            nguoi_tao=self.user,
        )
        self.assertEqual(doc.loai, "DI")
        self.assertEqual(doc.so_thu_tu, 1)
        self.assertFalse(doc.is_expired)

    def test_create_van_ban_mat(self):
        """Tạo VB Mật thành công (không có trường so_thu_tu)."""
        doc = VanBanMat.objects.create(
            nam=2026, so_hieu="01/QD-MAT",
            trich_yeu="Văn bản mật nội bộ",
            nguoi_tao=self.user,
        )
        self.assertEqual(doc.loai, "MAT")
        self.assertIsNone(doc.so_thu_tu)

    def test_is_expired_property(self):
        """Property is_expired hoạt động đúng."""
        doc = VanBanDen.objects.create(
            nam=2026, so_hieu="01/CV", so_thu_tu=1,
            trich_yeu="Test", hieu_luc=HieuLuc.HET_HIEU_LUC,
            nguoi_tao=self.user,
        )
        self.assertTrue(doc.is_expired)

    def test_str_representation(self):
        """__str__ hiển thị đúng format."""
        doc = VanBanDen.objects.create(
            nam=2026, so_hieu="15/CV-TEST", so_thu_tu=1,
            trich_yeu="Test", nguoi_tao=self.user,
        )
        self.assertIn("Văn bản Đến", str(doc))
        self.assertIn("15/CV-TEST", str(doc))


class DocumentFilterTests(TestCase):
    """Test bộ lọc nâng cao."""

    def setUp(self):
        self.user = User.objects.create_user(username="filteruser", password="test123")
        self.doc1 = VanBanDen.objects.create(
            nam=2026, so_hieu="15/CV-BGDDT", so_thu_tu=1,
            trich_yeu="Hướng dẫn tuyển sinh đại học",
            noi_ban_hanh="Bộ Giáo Dục",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            ngay_den=timezone.now(),
            nguoi_tao=self.user,
        )
        self.doc2 = VanBanDen.objects.create(
            nam=2025, so_hieu="42/TB-ITC", so_thu_tu=2,
            trich_yeu="Thông báo kết thúc học phần",
            noi_ban_hanh="Trường ITC",
            hieu_luc=HieuLuc.HET_HIEU_LUC,
            ngay_den=timezone.now(),
            nguoi_tao=self.user,
        )

    def test_filter_loai_case_insensitive(self):
        f_upper = DocumentFilter({"loai": "DEN"}, queryset=VanBanDen.objects.all())
        self.assertEqual(f_upper.qs.count(), 1)
        self.assertEqual(f_upper.qs.first().id, self.doc1.id)

        f_lower = DocumentFilter({"loai": "den"}, queryset=VanBanDen.objects.all())
        self.assertEqual(f_lower.qs.count(), 1)
        self.assertEqual(f_lower.qs.first().id, self.doc1.id)

    def test_filter_type_english_alias(self):
        f = DocumentFilter({"type": "den"}, queryset=VanBanDen.objects.all())
        self.assertEqual(f.qs.count(), 1)
        self.assertEqual(f.qs.first().id, self.doc1.id)

    def test_filter_year_english_alias(self):
        f_nam = DocumentFilter({"nam": 2026}, queryset=VanBanDen.objects.all())
        self.assertEqual(f_nam.qs.count(), 1)

        f_year = DocumentFilter({"year": 2026}, queryset=VanBanDen.objects.all())
        self.assertEqual(f_year.qs.count(), 1)

    def test_filter_search_q_and_keyword(self):
        f_q = DocumentFilter({"q": "tuyển sinh"}, queryset=VanBanDen.objects.all())
        self.assertEqual(f_q.qs.count(), 1)

        f_kw = DocumentFilter({"keyword": "tuyển sinh"}, queryset=VanBanDen.objects.all())
        self.assertEqual(f_kw.qs.count(), 1)


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class DocumentAPITests(TestCase):
    """Test API endpoints (hỗ trợ cả unified endpoint và dedicated endpoints)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="cbnv", password="password123", first_name="Văn", last_name="Nguyễn"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.doc = VanBanDen.objects.create(
            nam=2026, so_hieu="10/CV-UBND", so_thu_tu=1,
            trich_yeu="Công văn chỉ đạo",
            noi_ban_hanh="UBND TP.HCM",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            ngay_den=timezone.now(),
            nguoi_tao=self.user,
        )

    def tearDown(self):
        super().tearDown()
        for att in list(VanBanDenAttachment.objects.all()) + list(VanBanDiAttachment.objects.all()) + list(VanBanMatAttachment.objects.all()):
            if att.file:
                att.file.delete(save=False)

    def test_api_list_documents(self):
        """GET /api/documents/?loai=DEN"""
        response = self.client.get("/api/documents/?loai=DEN")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 1)

    def test_api_retrieve_and_view_log(self):
        """GET /api/documents/{id}/ tự ghi nhận lịch sử xem."""
        response = self.client.get(f"/api/documents/{self.doc.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["so_hieu"], "10/CV-UBND")

        view_log = DocumentViewLog.objects.filter(document_type="vanbanden", document_id=self.doc.id, user=self.user)
        self.assertTrue(view_log.exists())

    def test_api_viewers(self):
        """GET /api/documents/{id}/viewers/"""
        log_document_view(self.doc, self.user)

        response = self.client.get(f"/api/documents/{self.doc.id}/viewers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["username"], "cbnv")

    def test_api_so_thu_tu_read_only_on_update(self):
        """PUT / PATCH không cho phép sửa so_thu_tu."""
        response = self.client.patch(
            f"/api/documents/{self.doc.id}/",
            {"so_thu_tu": 999, "trich_yeu": "Trích yếu mới"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doc.refresh_from_db()
        self.assertEqual(self.doc.so_thu_tu, 1)
        self.assertEqual(self.doc.trich_yeu, "Trích yếu mới")

    def test_api_excel_template(self):
        """GET /api/documents/template/?loai=DEN sinh file Excel."""
        response = self.client.get("/api/documents/template/?loai=DEN")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("application/vnd.openxmlformats-officedocument", response["Content-Type"])

    def test_api_excel_export(self):
        """GET /api/documents/export/?loai=DEN xuất file Excel theo bộ lọc."""
        response = self.client.get("/api/documents/export/?loai=DEN")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("application/vnd.openxmlformats-officedocument", response["Content-Type"])

    def test_api_excel_import(self):
        """POST /api/documents/import/ nhận file Excel và import."""
        template_stream = generate_excel_template("DEN")
        excel_file = SimpleUploadedFile(
            "import_test.xlsx",
            template_stream.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        response = self.client.post(
            "/api/documents/import/",
            {"file": excel_file, "loai": "DEN"},
            format="multipart",
        )
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_attachment_upload_path_by_document_type(self):
        """Kiểm tra file đính kèm được tự động phân vào folder: den, di, mat."""
        # 1. Văn bản Đến -> 02_documents/den/
        file_den = SimpleUploadedFile("congvan_den.pdf", b"Test content den", content_type="application/pdf")
        att_den = VanBanDenAttachment.objects.create(
            document=self.doc,
            file=file_den,
            name="congvan_den.pdf",
            file_size=16,
        )
        self.assertTrue(att_den.file.name.startswith("02_documents/den/"))
        parts_den = att_den.file.name.split("/")
        self.assertEqual(len(parts_den), 6)
        self.assertEqual(parts_den[1], "den")

        # 2. Văn bản Đi -> 02_documents/di/
        doc_di = VanBanDi.objects.create(
            nam=2026, so_hieu="10/TB-TLBM", trich_yeu="Thông báo đi", nguoi_tao=self.user
        )
        file_di = SimpleUploadedFile("thongbao_di.pdf", b"Test content di", content_type="application/pdf")
        att_di = VanBanDiAttachment.objects.create(
            document=doc_di,
            file=file_di,
            name="thongbao_di.pdf",
            file_size=15,
        )
        self.assertTrue(att_di.file.name.startswith("02_documents/di/"))
        parts_di = att_di.file.name.split("/")
        self.assertEqual(len(parts_di), 6)
        self.assertEqual(parts_di[1], "di")

        # 3. Văn bản Mật -> 02_documents/mat/
        doc_mat = VanBanMat.objects.create(
            nam=2026, so_hieu="01/CV-MAT", trich_yeu="Văn bản mật", nguoi_tao=self.user
        )
        file_mat = SimpleUploadedFile("mat.pdf", b"Test content mat", content_type="application/pdf")
        att_mat = VanBanMatAttachment.objects.create(
            document=doc_mat,
            file=file_mat,
            name="mat.pdf",
            file_size=16,
        )
        self.assertTrue(att_mat.file.name.startswith("02_documents/mat/"))
        parts_mat = att_mat.file.name.split("/")
        self.assertEqual(len(parts_mat), 6)
        self.assertEqual(parts_mat[1], "mat")

    def test_dedicated_endpoints(self):
        """Kiểm tra các endpoint chuyên biệt /api/documents/den/, /di/, /mat/."""
        res_den = self.client.get("/api/documents/den/")
        self.assertEqual(res_den.status_code, status.HTTP_200_OK)

        res_di = self.client.get("/api/documents/di/")
        self.assertEqual(res_di.status_code, status.HTTP_200_OK)

        res_mat = self.client.get("/api/documents/mat/")
        self.assertEqual(res_mat.status_code, status.HTTP_200_OK)


class ConfidentialDocumentSecurityTests(TestCase):
    """Kiểm thử bảo mật Văn bản Mật."""

    def setUp(self):
        self.creator = User.objects.create_user(username="creator", password="pwd")
        self.recipient = User.objects.create_user(username="recipient", password="pwd")
        self.stranger = User.objects.create_user(username="stranger", password="pwd")
        self.admin = User.objects.create_superuser(username="admin_user", password="pwd", email="admin@test.com")

        self.doc_mat = VanBanMat.objects.create(
            nam=2026,
            so_hieu="01/MAT-BGDDT",
            trich_yeu="Văn bản mật về an ninh mạng",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            nguoi_tao=self.creator,
        )
        self.doc_mat.nguoi_nhan.add(self.recipient)

    def test_confidential_visible_to_creator_and_recipient(self):
        """Người tạo và người nhận được chỉ định đích danh xem được văn bản mật."""
        client = APIClient()

        # 1. Người tạo
        client.force_authenticate(user=self.creator)
        res_creator_list = client.get("/api/documents/?loai=MAT")
        self.assertEqual(res_creator_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_creator_list.data["count"], 1)

        res_creator_detail = client.get(f"/api/documents/{self.doc_mat.id}/")
        self.assertEqual(res_creator_detail.status_code, status.HTTP_200_OK)

        # 2. Người nhận được chỉ định
        client.force_authenticate(user=self.recipient)
        res_recipient_list = client.get("/api/documents/?loai=MAT")
        self.assertEqual(res_recipient_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_recipient_list.data["count"], 1)

        res_recipient_detail = client.get(f"/api/documents/{self.doc_mat.id}/")
        self.assertEqual(res_recipient_detail.status_code, status.HTTP_200_OK)

    def test_confidential_hidden_from_unauthorized_user(self):
        """Người không được chỉ định KHÔNG THẤY văn bản mật."""
        client = APIClient()
        client.force_authenticate(user=self.stranger)

        res_list = client.get("/api/documents/?loai=MAT")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data["count"], 0)

        res_detail = client.get(f"/api/documents/{self.doc_mat.id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_confidential_recipient_is_read_only(self):
        """Người nhận được chỉ định CHỈ CÓ QUYỀN ĐỌC."""
        client = APIClient()
        client.force_authenticate(user=self.recipient)

        res_patch = client.patch(
            f"/api/documents/{self.doc_mat.id}/",
            {"trich_yeu": "Sửa lén văn bản mật"},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("chỉ có quyền đọc", str(res_patch.data))

        res_delete = client.delete(f"/api/documents/{self.doc_mat.id}/")
        self.assertEqual(res_delete.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("chỉ có quyền đọc", str(res_delete.data))

    def test_confidential_creator_and_admin_can_update_and_delete(self):
        """Chỉ Người tạo hoặc Admin mới được phép Sửa hoặc Xóa văn bản mật."""
        client = APIClient()

        # Người tạo sửa thành công
        client.force_authenticate(user=self.creator)
        res_creator_patch = client.patch(
            f"/api/documents/{self.doc_mat.id}/",
            {"trich_yeu": "Cập nhật trích yếu hợp lệ bởi người tạo"},
            format="json",
        )
        self.assertEqual(res_creator_patch.status_code, status.HTTP_200_OK)
        self.doc_mat.refresh_from_db()
        self.assertEqual(self.doc_mat.trich_yeu, "Cập nhật trích yếu hợp lệ bởi người tạo")

        # Admin xóa thành công
        client.force_authenticate(user=self.admin)
        res_admin_delete = client.delete(f"/api/documents/{self.doc_mat.id}/")
        self.assertEqual(res_admin_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(VanBanMat.objects.filter(id=self.doc_mat.id).exists())


class DocumentAutoExpireTests(TestCase):
    """Test tính năng tự động chuyển trạng thái Hết hiệu lực khi tới hạn."""

    def setUp(self):
        self.user = User.objects.create_user(username="expireuser", password="test123")
        self.past_date = timezone.now() - timezone.timedelta(days=2)
        self.future_date = timezone.now() + timezone.timedelta(days=30)

        # 1. Văn bản còn hiệu lực nhưng đã quá hạn
        self.doc_expired = VanBanDen.objects.create(
            nam=2026, so_hieu="99/CV-EXPIRED", so_thu_tu=1,
            trich_yeu="Văn bản đã quá hạn",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            ngay_het_hieu_luc=self.past_date,
            nguoi_tao=self.user,
        )

        # 2. Văn bản còn hiệu lực và chưa tới hạn
        self.doc_active = VanBanDen.objects.create(
            nam=2026, so_hieu="100/CV-ACTIVE", so_thu_tu=2,
            trich_yeu="Văn bản còn hạn trong tương lai",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            ngay_het_hieu_luc=self.future_date,
            nguoi_tao=self.user,
        )

        # 3. Văn bản đã bị thay thế (HET_VA_THAY_THE)
        self.doc_replaced = VanBanDen.objects.create(
            nam=2026, so_hieu="101/CV-REPLACED", so_thu_tu=3,
            trich_yeu="Văn bản đã bị thay thế",
            hieu_luc=HieuLuc.HET_VA_THAY_THE,
            link_thay_the="100/CV-ACTIVE",
            ngay_het_hieu_luc=self.past_date,
            nguoi_tao=self.user,
        )

    def test_auto_expire_on_get_api(self):
        """Khi gọi API GET /api/documents/, văn bản quá hạn tự động chuyển sang HET_HIEU_LUC."""
        client = APIClient()
        client.force_authenticate(user=self.user)

        res = client.get("/api/documents/?loai=DEN")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.doc_expired.refresh_from_db()
        self.assertEqual(self.doc_expired.hieu_luc, HieuLuc.HET_HIEU_LUC)

        self.doc_active.refresh_from_db()
        self.assertEqual(self.doc_active.hieu_luc, HieuLuc.CON_HIEU_LUC)

        self.doc_replaced.refresh_from_db()
        self.assertEqual(self.doc_replaced.hieu_luc, HieuLuc.HET_VA_THAY_THE)

    def test_management_command_expire_documents(self):
        """Management command expire_documents hoạt động chính xác."""
        from django.core.management import call_command
        from io import StringIO

        out = StringIO()
        call_command("expire_documents", stdout=out)

        self.doc_expired.refresh_from_db()
        self.assertEqual(self.doc_expired.hieu_luc, HieuLuc.HET_HIEU_LUC)


class DocumentPermissionOption2Tests(TestCase):
    """Test phân quyền Sửa/Xóa văn bản."""

    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin_perm", password="password", is_staff=True)
        self.staff1 = User.objects.create_user(username="staff1", password="password")
        self.staff2 = User.objects.create_user(username="staff2", password="password")

        self.doc_staff1 = VanBanDen.objects.create(
            nam=2026, so_hieu="10/CV-STAFF1", so_thu_tu=1,
            trich_yeu="Văn bản do staff1 tạo",
            nguoi_tao=self.staff1,
        )

    def test_non_admin_cannot_delete_document(self):
        """Cán bộ thông thường không được phép xóa văn bản -> 403 Forbidden."""
        client = APIClient()
        client.force_authenticate(user=self.staff1)

        res = client.delete(f"/api/documents/{self.doc_staff1.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Quyền xóa chỉ dành cho Quản trị viên", str(res.data))
        self.assertTrue(VanBanDen.objects.filter(id=self.doc_staff1.id).exists())

    def test_admin_can_delete_document(self):
        """Admin có quyền xóa văn bản -> 204 No Content."""
        client = APIClient()
        client.force_authenticate(user=self.admin)

        res = client.delete(f"/api/documents/{self.doc_staff1.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(VanBanDen.objects.filter(id=self.doc_staff1.id).exists())

    def test_non_creator_cannot_edit_document(self):
        """Cán bộ không phải người tạo không được phép sửa văn bản -> 403 Forbidden."""
        client = APIClient()
        client.force_authenticate(user=self.staff2)

        res = client.patch(
            f"/api/documents/{self.doc_staff1.id}/",
            {"trich_yeu": "Staff2 cố tình sửa văn bản của Staff1"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Chỉ Quản trị viên, Người tạo", str(res.data))

    def test_creator_can_edit_own_document(self):
        """Người tạo văn bản được phép sửa văn bản của mình -> 200 OK."""
        client = APIClient()
        client.force_authenticate(user=self.staff1)

        res = client.patch(
            f"/api/documents/{self.doc_staff1.id}/",
            {"trich_yeu": "Staff1 cập nhật trích yếu hợp lệ"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.doc_staff1.refresh_from_db()
        self.assertEqual(self.doc_staff1.trich_yeu, "Staff1 cập nhật trích yếu hợp lệ")

    def test_admin_can_edit_any_document(self):
        """Admin có quyền sửa bất kỳ văn bản nào -> 200 OK."""
        client = APIClient()
        client.force_authenticate(user=self.admin)

        res = client.patch(
            f"/api/documents/{self.doc_staff1.id}/",
            {"trich_yeu": "Admin chỉnh sửa trích yếu"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.doc_staff1.refresh_from_db()
        self.assertEqual(self.doc_staff1.trich_yeu, "Admin chỉnh sửa trích yếu")

    def test_delegated_staff_can_edit_and_delete(self):
        """Cán bộ đặc biệt được cấp quyền (Django permissions) có thể sửa và xóa."""
        from django.contrib.auth.models import Permission
        perm_change = Permission.objects.get(codename="change_vanbanden")
        perm_delete = Permission.objects.get(codename="delete_vanbanden")
        self.staff2.user_permissions.add(perm_change, perm_delete)
        self.staff2 = User.objects.get(pk=self.staff2.pk)

        client = APIClient()
        client.force_authenticate(user=self.staff2)

        res_edit = client.patch(
            f"/api/documents/{self.doc_staff1.id}/",
            {"trich_yeu": "Staff2 được ủy quyền sửa văn bản"},
            format="json",
        )
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)

        res_delete = client.delete(f"/api/documents/{self.doc_staff1.id}/")
        self.assertEqual(res_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(VanBanDen.objects.filter(id=self.doc_staff1.id).exists())

    def test_delete_replacement_document_restores_counterpart(self):
        """Khi xóa văn bản thay thế (A), văn bản cũ (B) tự động gỡ link và khôi phục CON_HIEU_LUC."""
        doc_b = VanBanDen.objects.create(
            nam=2026, so_hieu="15/CV-OLD", so_thu_tu=10,
            trich_yeu="Văn bản cũ B",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            nguoi_tao=self.admin,
        )

        client = APIClient()
        client.force_authenticate(user=self.admin)
        res_create = client.post(
            "/api/documents/",
            {
                "loai": "DEN",
                "nam": 2026,
                "so_hieu": "125/CV-NEW",
                "trich_yeu": "Văn bản mới A thay cho B",
                "noi_ban_hanh": "Bộ GD&ĐT",
                "hieu_luc": "CON_HIEU_LUC",
                "link_thay_the": "15/CV-OLD",
            },
            format="json",
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        new_doc_id = res_create.data["id"]

        # Kiểm tra văn bản B đã được tự động đồng bộ sang HET_VA_THAY_THE
        doc_b.refresh_from_db()
        self.assertEqual(doc_b.hieu_luc, HieuLuc.HET_VA_THAY_THE)
        self.assertEqual(doc_b.link_thay_the, "125/CV-NEW")

        # Xóa văn bản mới A
        res_del = client.delete(f"/api/documents/{new_doc_id}/")
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)

        # Kiểm tra văn bản B tự động khôi phục CON_HIEU_LUC và xóa link_thay_the
        doc_b.refresh_from_db()
        self.assertEqual(doc_b.hieu_luc, HieuLuc.CON_HIEU_LUC)
        self.assertEqual(doc_b.link_thay_the, "")
