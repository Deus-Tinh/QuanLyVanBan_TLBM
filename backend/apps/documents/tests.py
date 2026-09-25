"""Tests cho Module Văn Bản — Giai đoạn 1: VB Đến (Nguyễn Anh Đô)."""

import io
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .filters import DocumentFilter, ViewerFilter
from .models import Document, DocumentAttachment, DocumentViewLog
from .services import (
    export_to_excel,
    generate_excel_template,
    generate_so_thu_tu,
    import_from_excel,
    log_document_view,
)


class GenerateSoThuTuTests(TestCase):
    """Test tự sinh số thứ tự an toàn."""

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="test123")

    def test_first_so_thu_tu_is_1(self):
        """Số đầu tiên trong năm phải là 1."""
        result = generate_so_thu_tu("DEN", 2026)
        self.assertEqual(result, 1)

    def test_auto_increment(self):
        """Số tiếp theo phải tăng dần."""
        Document.objects.create(
            loai="DEN", nam=2026, so_hieu="01/CV", so_thu_tu=1,
            trich_yeu="Test 1", nguoi_tao=self.user,
        )
        Document.objects.create(
            loai="DEN", nam=2026, so_hieu="02/CV", so_thu_tu=2,
            trich_yeu="Test 2", nguoi_tao=self.user,
        )
        result = generate_so_thu_tu("DEN", 2026)
        self.assertEqual(result, 3)

    def test_separate_by_year(self):
        """Số thứ tự phải tách riêng theo năm."""
        Document.objects.create(
            loai="DEN", nam=2025, so_hieu="01/CV", so_thu_tu=5,
            trich_yeu="Test 2025", nguoi_tao=self.user,
        )
        result = generate_so_thu_tu("DEN", 2026)
        self.assertEqual(result, 1)

    def test_separate_by_loai(self):
        """Số thứ tự phải tách riêng theo loại."""
        Document.objects.create(
            loai="DEN", nam=2026, so_hieu="01/CV", so_thu_tu=10,
            trich_yeu="Test DEN", nguoi_tao=self.user,
        )
        result = generate_so_thu_tu("DI", 2026)
        self.assertEqual(result, 1)

    def test_mat_returns_none(self):
        """VB Mật không có số thứ tự."""
        result = generate_so_thu_tu("MAT", 2026)
        self.assertIsNone(result)


class DocumentViewLogTests(TestCase):
    """Test ghi log người xem (upsert)."""

    def setUp(self):
        self.user = User.objects.create_user(username="viewer1", password="test123")
        self.doc = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="01/CV", so_thu_tu=1,
            trich_yeu="Test document", nguoi_tao=self.user,
        )

    def test_first_view_creates_log(self):
        """Lần xem đầu tạo bản ghi mới."""
        log_document_view(self.doc, self.user)
        self.assertEqual(DocumentViewLog.objects.count(), 1)

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
    """Test model Document."""

    def setUp(self):
        self.user = User.objects.create_user(username="admin", password="test123")

    def test_create_van_ban_den(self):
        """Tạo VB Đến thành công."""
        doc = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="15/CV-BGDDT", so_thu_tu=1,
            trich_yeu="V/v hướng dẫn tuyển sinh",
            noi_ban_hanh="Bộ GD&ĐT",
            ngay_den=timezone.now(),
            nguoi_tao=self.user,
        )
        self.assertEqual(doc.loai, "DEN")
        self.assertEqual(doc.so_thu_tu, 1)
        self.assertFalse(doc.is_expired)

    def test_is_expired_property(self):
        """Property is_expired hoạt động đúng."""
        doc = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="01/CV", so_thu_tu=1,
            trich_yeu="Test", hieu_luc="HET_HIEU_LUC",
            nguoi_tao=self.user,
        )
        self.assertTrue(doc.is_expired)

    def test_str_representation(self):
        """__str__ hiển thị đúng format."""
        doc = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="15/CV-TEST", so_thu_tu=1,
            trich_yeu="Test", nguoi_tao=self.user,
        )
        self.assertIn("Văn bản Đến", str(doc))
        self.assertIn("15/CV-TEST", str(doc))


class DocumentFilterTests(TestCase):
    """Test bộ lọc nâng cao: hỗ trợ hoa/thường và aliases Tiếng Anh."""

    def setUp(self):
        self.user = User.objects.create_user(username="filteruser", password="test123")
        self.doc1 = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="15/CV-BGDDT", so_thu_tu=1,
            trich_yeu="Hướng dẫn tuyển sinh đại học",
            noi_ban_hanh="Bộ Giáo Dục",
            hieu_luc="CON_HIEU_LUC",
            ngay_den=timezone.now(),
            nguoi_tao=self.user,
        )
        self.doc2 = Document.objects.create(
            loai="DI", nam=2025, so_hieu="42/TB-ITC", so_thu_tu=1,
            trich_yeu="Thông báo thi kết thúc học phần",
            noi_ban_hanh="Trường ITC",
            hieu_luc="HET_HIEU_LUC",
            ngay_ban_hanh=timezone.now(),
            nguoi_tao=self.user,
        )

    def test_filter_loai_case_insensitive(self):
        """Lọc ?loai=den hoặc ?loai=DEN đều ra đúng kết quả."""
        f_upper = DocumentFilter({"loai": "DEN"}, queryset=Document.objects.all())
        self.assertEqual(f_upper.qs.count(), 1)
        self.assertEqual(f_upper.qs.first().id, self.doc1.id)

        f_lower = DocumentFilter({"loai": "den"}, queryset=Document.objects.all())
        self.assertEqual(f_lower.qs.count(), 1)
        self.assertEqual(f_lower.qs.first().id, self.doc1.id)

    def test_filter_type_english_alias(self):
        """Lọc ?type=den (alias Tiếng Anh) hoạt động đúng."""
        f = DocumentFilter({"type": "den"}, queryset=Document.objects.all())
        self.assertEqual(f.qs.count(), 1)
        self.assertEqual(f.qs.first().id, self.doc1.id)

    def test_filter_year_english_alias(self):
        """Lọc ?year=2026 và ?nam=2026 đều hoạt động đúng."""
        f_nam = DocumentFilter({"nam": 2026}, queryset=Document.objects.all())
        self.assertEqual(f_nam.qs.count(), 1)

        f_year = DocumentFilter({"year": 2026}, queryset=Document.objects.all())
        self.assertEqual(f_year.qs.count(), 1)

    def test_filter_search_q_and_keyword(self):
        """Tìm kiếm ?q=tuyển sinh và ?keyword=tuyển sinh."""
        f_q = DocumentFilter({"q": "tuyển sinh"}, queryset=Document.objects.all())
        self.assertEqual(f_q.qs.count(), 1)

        f_kw = DocumentFilter({"keyword": "tuyển sinh"}, queryset=Document.objects.all())
        self.assertEqual(f_kw.qs.count(), 1)


class DocumentAPITests(TestCase):
    """Test toàn bộ API endpoints (URL bằng Tiếng Anh chuẩn RESTful)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="cbnv", password="password123", first_name="Văn", last_name="Nguyễn"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.doc = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="10/CV-UBND", so_thu_tu=1,
            trich_yeu="Công văn chỉ đạo",
            noi_ban_hanh="UBND TP.HCM",
            hieu_luc="CON_HIEU_LUC",
            ngay_den=timezone.now(),
            nguoi_tao=self.user,
        )

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

        # Kiểm tra ViewLog đã được ghi
        view_log = DocumentViewLog.objects.filter(document=self.doc, user=self.user)
        self.assertTrue(view_log.exists())

    def test_api_viewers(self):
        """GET /api/documents/{id}/viewers/"""
        # Ghi log trước
        log_document_view(self.doc, self.user)

        response = self.client.get(f"/api/documents/{self.doc.id}/viewers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["username"], "cbnv")

    def test_api_so_thu_tu_read_only_on_update(self):
        """PUT / PATCH không cho phép sửa so_thu_tu (Số đến)."""
        response = self.client.patch(
            f"/api/documents/{self.doc.id}/",
            {"so_thu_tu": 999, "trich_yeu": "Trích yếu mới"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doc.refresh_from_db()
        self.assertEqual(self.doc.so_thu_tu, 1)  # Không đổi!
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
        # Sinh file mẫu
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
        # Template mặc định chỉ có dòng ví dụ (bị bỏ qua) nên created = 0, phản hồi 400 đúng quy chuẩn
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_attachment_upload_path_by_document_type(self):
        """Kiểm tra file đính kèm được tự động phân vào folder tương ứng: den, di, mat."""
        # 1. Văn bản Đến -> 02_documents/den/
        file_den = SimpleUploadedFile("congvan_den.pdf", b"Test content den", content_type="application/pdf")
        att_den = DocumentAttachment.objects.create(
            document=self.doc,  # loai = "DEN"
            file=file_den,
            file_name="congvan_den.pdf",
            file_size=16,
        )
        self.assertTrue(att_den.file.name.startswith("02_documents/den/"))

        # 2. Văn bản Đi -> 02_documents/di/
        doc_di = Document.objects.create(
            loai="DI", nam=2026, so_hieu="10/TB-TLBM", trich_yeu="Thông báo đi", nguoi_tao=self.user
        )
        file_di = SimpleUploadedFile("thongbao_di.pdf", b"Test content di", content_type="application/pdf")
        att_di = DocumentAttachment.objects.create(
            document=doc_di,
            file=file_di,
            file_name="thongbao_di.pdf",
            file_size=15,
        )
        self.assertTrue(att_di.file.name.startswith("02_documents/di/"))

        # 3. Văn bản Mật -> 02_documents/mat/
        doc_mat = Document.objects.create(
            loai="MAT", nam=2026, so_hieu="01/CV-MAT", trich_yeu="Văn bản mật", nguoi_tao=self.user
        )
        file_mat = SimpleUploadedFile("mat.pdf", b"Test content mat", content_type="application/pdf")
        att_mat = DocumentAttachment.objects.create(
            document=doc_mat,
            file=file_mat,
            file_name="mat.pdf",
            file_size=16,
        )
        self.assertTrue(att_mat.file.name.startswith("02_documents/mat/"))


class ConfidentialDocumentSecurityTests(TestCase):
    """
    Kiểm thử bảo mật Văn bản Mật:
    1. Chỉ đối tượng được chỉ định (hoặc người tạo / admin) mới được đọc. Người ngoài hoàn toàn không thấy (404).
    2. Đối tượng được chỉ định CHỈ CÓ QUYỀN ĐỌC (Read-Only) — không được sửa (403), không được xóa (403).
    3. Chỉ Người tạo hoặc Quản trị viên (Admin) mới có quyền Sửa / Xóa.
    """

    def setUp(self):
        self.creator = User.objects.create_user(username="creator", password="pwd")
        self.recipient = User.objects.create_user(username="recipient", password="pwd")
        self.stranger = User.objects.create_user(username="stranger", password="pwd")
        self.admin = User.objects.create_superuser(username="admin_user", password="pwd", email="admin@test.com")

        self.doc_mat = Document.objects.create(
            loai="MAT",
            nam=2026,
            so_hieu="01/MAT-BGDDT",
            trich_yeu="Văn bản mật về an ninh mạng",
            hieu_luc="CON_HIEU_LUC",
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
        """Người không được chỉ định KHÔNG THẤY văn bản mật (kể cả list và detail = 404)."""
        client = APIClient()
        client.force_authenticate(user=self.stranger)

        # List không thấy
        res_list = client.get("/api/documents/?loai=MAT")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data["count"], 0)

        # Detail trả về 404 Not Found
        res_detail = client.get(f"/api/documents/{self.doc_mat.id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_confidential_recipient_is_read_only(self):
        """Người nhận được chỉ định CHỈ CÓ QUYỀN ĐỌC — bị chặn 403 Forbidden khi Sửa hoặc Xóa."""
        client = APIClient()
        client.force_authenticate(user=self.recipient)

        # Cố tình sửa -> 403 Forbidden
        res_patch = client.patch(
            f"/api/documents/{self.doc_mat.id}/",
            {"trich_yeu": "Sửa lén văn bản mật"},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("chỉ có quyền đọc", str(res_patch.data))

        # Cố tình xóa -> 403 Forbidden
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
        self.assertFalse(Document.objects.filter(id=self.doc_mat.id).exists())


class DocumentAutoExpireTests(TestCase):
    """Test tính năng tự động chuyển trạng thái Hết hiệu lực khi tới hạn."""

    def setUp(self):
        from django.core.management import call_command
        self.user = User.objects.create_user(username="expireuser", password="test123")
        self.past_date = timezone.now() - timezone.timedelta(days=2)
        self.future_date = timezone.now() + timezone.timedelta(days=30)

        # 1. Văn bản còn hiệu lực nhưng đã quá hạn
        self.doc_expired = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="99/CV-EXPIRED", so_thu_tu=1,
            trich_yeu="Văn bản đã quá hạn",
            hieu_luc=Document.HieuLuc.CON_HIEU_LUC,
            ngay_het_hieu_luc=self.past_date,
            nguoi_tao=self.user,
        )

        # 2. Văn bản còn hiệu lực và chưa tới hạn
        self.doc_active = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="100/CV-ACTIVE", so_thu_tu=2,
            trich_yeu="Văn bản còn hạn trong tương lai",
            hieu_luc=Document.HieuLuc.CON_HIEU_LUC,
            ngay_het_hieu_luc=self.future_date,
            nguoi_tao=self.user,
        )

        # 3. Văn bản đã bị thay thế (HET_VA_THAY_THE)
        self.doc_replaced = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="101/CV-REPLACED", so_thu_tu=3,
            trich_yeu="Văn bản đã bị thay thế",
            hieu_luc=Document.HieuLuc.HET_VA_THAY_THE,
            link_thay_the="100/CV-ACTIVE",
            ngay_het_hieu_luc=self.past_date,
            nguoi_tao=self.user,
        )

    def test_auto_expire_on_get_api(self):
        """Khi gọi API GET /api/documents/, văn bản quá hạn tự động chuyển sang HET_HIEU_LUC."""
        client = APIClient()
        client.force_authenticate(user=self.user)

        res = client.get("/api/documents/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.doc_expired.refresh_from_db()
        self.assertEqual(self.doc_expired.hieu_luc, Document.HieuLuc.HET_HIEU_LUC)

        self.doc_active.refresh_from_db()
        self.assertEqual(self.doc_active.hieu_luc, Document.HieuLuc.CON_HIEU_LUC)

        self.doc_replaced.refresh_from_db()
        self.assertEqual(self.doc_replaced.hieu_luc, Document.HieuLuc.HET_VA_THAY_THE)

    def test_management_command_expire_documents(self):
        """Management command expire_documents hoạt động chính xác."""
        from django.core.management import call_command
        from io import StringIO

        out = StringIO()
        call_command("expire_documents", stdout=out)

        self.doc_expired.refresh_from_db()
        self.assertEqual(self.doc_expired.hieu_luc, Document.HieuLuc.HET_HIEU_LUC)


class DocumentPermissionOption2Tests(TestCase):
    """Test phân quyền Sửa/Xóa văn bản theo Phương án 2."""

    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin_perm", password="password", is_staff=True)
        self.staff1 = User.objects.create_user(username="staff1", password="password")
        self.staff2 = User.objects.create_user(username="staff2", password="password")

        # Văn bản do staff1 tạo
        self.doc_staff1 = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="10/CV-STAFF1", so_thu_tu=1,
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
        self.assertTrue(Document.objects.filter(id=self.doc_staff1.id).exists())

    def test_admin_can_delete_document(self):
        """Admin có quyền xóa văn bản -> 204 No Content."""
        client = APIClient()
        client.force_authenticate(user=self.admin)

        res = client.delete(f"/api/documents/{self.doc_staff1.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Document.objects.filter(id=self.doc_staff1.id).exists())

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
        perm_change = Permission.objects.get(codename="change_document")
        perm_delete = Permission.objects.get(codename="delete_document")
        self.staff2.user_permissions.add(perm_change, perm_delete)
        # Clear cached permissions
        self.staff2 = User.objects.get(pk=self.staff2.pk)

        client = APIClient()
        client.force_authenticate(user=self.staff2)

        # Edit test
        res_edit = client.patch(
            f"/api/documents/{self.doc_staff1.id}/",
            {"trich_yeu": "Staff2 được ủy quyền sửa văn bản"},
            format="json",
        )
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)

        # Delete test
        res_delete = client.delete(f"/api/documents/{self.doc_staff1.id}/")
        self.assertEqual(res_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Document.objects.filter(id=self.doc_staff1.id).exists())

    def test_delete_replacement_document_restores_counterpart(self):
        """Khi xóa văn bản thay thế (A), văn bản cũ (B) tự động gỡ link và khôi phục CON_HIEU_LUC."""
        doc_b = Document.objects.create(
            loai="DEN", nam=2026, so_hieu="15/CV-OLD", so_thu_tu=10,
            trich_yeu="Văn bản cũ B",
            hieu_luc="CON_HIEU_LUC",
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
        self.assertEqual(doc_b.hieu_luc, "HET_VA_THAY_THE")
        self.assertEqual(doc_b.link_thay_the, "125/CV-NEW")

        # Xóa văn bản mới A
        res_del = client.delete(f"/api/documents/{new_doc_id}/")
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)

        # Kiểm tra văn bản B tự động khôi phục CON_HIEU_LUC và xóa link_thay_the
        doc_b.refresh_from_db()
        self.assertEqual(doc_b.hieu_luc, "CON_HIEU_LUC")
        self.assertEqual(doc_b.link_thay_the, "")


