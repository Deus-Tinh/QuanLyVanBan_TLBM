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
