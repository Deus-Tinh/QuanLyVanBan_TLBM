"""Tests cho Module Văn Bản — Kiến trúc 2 Model (VanBanDen, VanBanDi)."""

import io
import tempfile
from django.contrib.auth import get_user_model
User = get_user_model()
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from organizations.models import DonVi
from records.models import HoSo, LoaiVanBan as RecordLoaiVanBan

from documents.filters import DocumentFilter, ViewerFilter
from documents.models import (
    HieuLuc,
    LoaiVanBan,
    PhamVi,
    VanBanDen,
    VanBanDenAttachment,
    VanBanDenNguoiNhan,
    VanBanDenHoSo,
    VanBanDenDanhmuc,
    VanBanDenDonViNhan,
    VanBanDi,
    VanBanDiAttachment,
    VanBanDiNguoiNhan,
    VanBanDiHoSo,
    VanBanDiDanhmuc,
    VanBanDiDonViNhan,
    VanBanDiNoiBanHanh,
    VanBanMat,
    VanBanMatAttachment,
    VanBanMatNguoiNhan,
    VanBanMatHoSo,
    VanBanMatDanhmuc,
    VanBanMatDonViNhan,
    VanBanMatNoiBanHanh,
    DocumentViewLog,
    DocumentAccessLog,
    Document,
    DocumentAttachment,
)
from documents.services import (
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

    def test_di_increment_so_thu_tu(self):
        """Văn bản Đi cũng tự tăng số thứ tự độc lập."""
        VanBanDi.objects.create(
            nam=2026, so_hieu="01/TB", so_thu_tu=1,
            trich_yeu="Test DI 1", nguoi_tao=self.user,
        )
        result = generate_so_thu_tu("DI", 2026)
        self.assertEqual(result, 2)


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
    """Test trực tiếp các models: VanBanDen, VanBanDi."""

    def setUp(self):
        self.user = User.objects.create_user(username="documents_admin_test", password="test123")

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

    def test_create_van_ban_han_che(self):
        """Tạo VB Hạn chế nội bộ thành công với pham_vi=HAN_CHE."""
        doc = VanBanDen.objects.create(
            nam=2026, so_hieu="01/QD-HAN-CHE", so_thu_tu=1,
            trich_yeu="Văn bản hạn chế nội bộ",
            pham_vi=PhamVi.HAN_CHE,
            nguoi_tao=self.user,
        )
        self.assertEqual(doc.pham_vi, PhamVi.HAN_CHE)
        self.assertEqual(doc.loai, "DEN")

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
        self.assertEqual(f_upper.qs.count(), 2)

        f_lower = DocumentFilter({"loai": "den"}, queryset=VanBanDen.objects.all())
        self.assertEqual(f_lower.qs.count(), 2)

    def test_filter_type_english_alias(self):
        f = DocumentFilter({"type": "den"}, queryset=VanBanDen.objects.all())
        self.assertEqual(f.qs.count(), 2)

    def test_filter_chi_con_hieu_luc(self):
        f = DocumentFilter({"chi_con_hieu_luc": True}, queryset=VanBanDen.objects.all())
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
        user_kwargs = {"username": "cbnv", "password": "password123"}
        if hasattr(User, "ho_ten"):
            user_kwargs["ho_ten"] = "Nguyễn Văn"
        elif hasattr(User, "first_name"):
            user_kwargs["first_name"] = "Văn"
            user_kwargs["last_name"] = "Nguyễn"
        self.user = User.objects.create_user(**user_kwargs)
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
        for att in list(VanBanDenAttachment.objects.all()) + list(VanBanDiAttachment.objects.all()):
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
        """Kiểm tra file đính kèm được tự động phân vào folder: den, di theo phân loại: thuong, han_che."""
        # 1. Văn bản Đến -> 02_documents/den/thuong/
        file_den = SimpleUploadedFile("congvan_den.pdf", b"Test content den", content_type="application/pdf")
        att_den = VanBanDenAttachment.objects.create(
            document=self.doc,
            file=file_den,
            name="congvan_den.pdf",
            file_size=16,
        )
        self.assertTrue(att_den.file.name.startswith("02_documents/den/thuong/"))
        parts_den = att_den.file.name.split("/")
        self.assertEqual(len(parts_den), 7)
        self.assertEqual(parts_den[1], "den")
        self.assertEqual(parts_den[2], "thuong")

        # 2. Văn bản Đi -> 02_documents/di/thuong/
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
        self.assertTrue(att_di.file.name.startswith("02_documents/di/thuong/"))
        parts_di = att_di.file.name.split("/")
        self.assertEqual(len(parts_di), 7)
        self.assertEqual(parts_di[1], "di")
        self.assertEqual(parts_di[2], "thuong")

    def test_dedicated_endpoints(self):
        """Kiểm tra các endpoint chuyên biệt /api/documents/den/, /di/."""
        res_den = self.client.get("/api/documents/den/")
        self.assertEqual(res_den.status_code, status.HTTP_200_OK)

        res_di = self.client.get("/api/documents/di/")
        self.assertEqual(res_di.status_code, status.HTTP_200_OK)

    def test_create_without_permission_denied(self):
        """Issue #61 Lỗi 1: User không có quyền tạo văn bản bị chặn 403 Forbidden."""
        response = self.client.post(
            "/api/documents/",
            {
                "loai": "DEN",
                "nam": 2026,
                "so_hieu": "99/CV-TEST",
                "trich_yeu": "Test không quyền",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_het_va_thay_the_without_link_rejected(self):
        """Issue #61 Lỗi 2: HET_VA_THAY_THE bắt buộc phải có link_thay_the."""
        self.user.is_staff = True
        self.user.save()
        response = self.client.post(
            "/api/documents/",
            {
                "loai": "DEN",
                "nam": 2026,
                "so_hieu": "100/CV-TEST",
                "trich_yeu": "Test thay thế rỗng",
                "hieu_luc": HieuLuc.HET_VA_THAY_THE,
                "link_thay_the": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("link_thay_the", response.data)

    def test_create_returns_id_in_response(self):
        """Issue #61 Lỗi 3: Tạo văn bản thành công phải trả về trường id trong response."""
        self.user.is_staff = True
        self.user.save()
        response = self.client.post(
            "/api/documents/",
            {
                "loai": "DEN",
                "nam": 2026,
                "so_hieu": "101/CV-TEST",
                "trich_yeu": "Test có id",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertIsNotNone(response.data["id"])


class JunctionAndThroughModelTests(TestCase):
    """Kiểm thử các bảng liên kết qua trung gian và M2M through models khớp DDL."""

    def setUp(self):
        self.user = User.objects.create_user(username="test_emp", password="pwd")
        self.doc_den = VanBanDen.objects.create(
            nam=2026,
            so_hieu="10/CV-DEN",
            so_thu_tu=1,
            trich_yeu="Văn bản đến test junction",
            nguoi_tao=self.user,
        )
        self.doc_di = VanBanDi.objects.create(
            nam=2026,
            so_hieu="20/TB-DI",
            so_thu_tu=1,
            trich_yeu="Văn bản đi test junction",
            nguoi_tao=self.user,
        )

    def test_m2m_through_nguoi_nhan_den_and_di(self):
        """M2M nguoi_nhan sử dụng through model với employee_id khớp DDL."""
        self.doc_den.nguoi_nhan.add(self.user)
        self.assertTrue(
            VanBanDenNguoiNhan.objects.filter(vanbanden=self.doc_den, employee=self.user).exists()
        )
        self.assertEqual(self.doc_den.nguoi_nhan.count(), 1)

        self.doc_di.nguoi_nhan.add(self.user)
        self.assertTrue(
            VanBanDiNguoiNhan.objects.filter(vanbandi=self.doc_di, employee=self.user).exists()
        )
        self.assertEqual(self.doc_di.nguoi_nhan.count(), 1)

    def test_junction_danhmuc_filter(self):
        """Bảng documents_vanbanden_danhmuc và documents_vanbandi_danhmuc kết nối thành công với filter loai_van_ban."""
        hoso = HoSo.objects.get(is_he_thong=True)
        category = RecordLoaiVanBan.objects.create(ho_so=hoso, ten_loai="Loại văn bản junction")
        VanBanDenDanhmuc.objects.create(vanbanden=self.doc_den, loaivanban_id=category.pk)
        VanBanDiDanhmuc.objects.create(vanbandi=self.doc_di, loaivanban_id=category.pk)

        f_den = DocumentFilter({"loai_van_ban": str(category.pk)}, queryset=VanBanDen.objects.all())
        self.assertIn(self.doc_den, f_den.qs)

        f_den_miss = DocumentFilter({"loai_van_ban": "888"}, queryset=VanBanDen.objects.all())
        self.assertNotIn(self.doc_den, f_den_miss.qs)

    def test_junction_hoso_and_donvinhan(self):
        """Bảng hoso, donvinhan, noibanhanh lưu trữ và truy vấn chính xác."""
        hoso_id = HoSo.objects.get(is_he_thong=True).pk
        donvi_id = DonVi.objects.order_by("id").first().pk
        hs = VanBanDenHoSo.objects.create(vanbanden=self.doc_den, hoso_id=hoso_id)
        dvn = VanBanDenDonViNhan.objects.create(vanbanden=self.doc_den, donvi_id=donvi_id)
        self.assertEqual(self.doc_den.hoso.first(), hs)
        self.assertEqual(self.doc_den.donvinhan.first(), dvn)

        hs_di = VanBanDiHoSo.objects.create(vanbandi=self.doc_di, hoso_id=hoso_id)
        dvn_di = VanBanDiDonViNhan.objects.create(vanbandi=self.doc_di, donvi_id=donvi_id)
        nbh_di = VanBanDiNoiBanHanh.objects.create(vanbandi=self.doc_di, donvi_id=donvi_id)
        self.assertEqual(self.doc_di.hoso.first(), hs_di)
        self.assertEqual(self.doc_di.donvinhan.first(), dvn_di)
        self.assertEqual(self.doc_di.noibanhanh_links.first(), nbh_di)

    def test_restricted_document_visible_to_recipient_department(self):
        """Văn bản hạn chế xem được bởi CBNV thuộc đơn vị nhận (donvinhan)."""
        from documents.selectors import van_ban_xem_duoc
        department, other_department = list(DonVi.objects.order_by("id")[:2])
        user_dept = User.objects.create_user(username="dept_user", password="pwd")
        user_dept.don_vi_id = department.pk

        doc_restricted = VanBanDen.objects.create(
            nam=2026,
            so_hieu="30/HC-DEPT",
            so_thu_tu=2,
            trich_yeu="Văn bản hạn chế cho phòng ban",
            pham_vi=PhamVi.HAN_CHE,
            nguoi_tao=self.user,
        )
        VanBanDenDonViNhan.objects.create(vanbanden=doc_restricted, donvi_id=department.pk)

        # CBNV thuộc đơn vị nhận xem được
        qs = van_ban_xem_duoc(user_dept, "DEN")
        self.assertIn(doc_restricted, qs)

        # Người lạ không thuộc đơn vị nhận không xem được
        stranger = User.objects.create_user(username="dept_stranger", password="pwd")
        stranger.don_vi_id = other_department.pk
        qs_stranger = van_ban_xem_duoc(stranger, "DEN")
        self.assertNotIn(doc_restricted, qs_stranger)


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

        # 4. Văn bản còn hiệu lực 1 phần nhưng đã quá hạn (phải chuyển sang HET_HIEU_LUC)
        self.doc_partial_expired = VanBanDen.objects.create(
            nam=2026, so_hieu="102/CV-PARTIAL-EXP", so_thu_tu=4,
            trich_yeu="Văn bản còn hiệu lực 1 phần nhưng quá hạn",
            hieu_luc=HieuLuc.CON_HIEU_LUC_1_PHAN,
            ngay_het_hieu_luc=self.past_date,
            nguoi_tao=self.user,
        )

        # 5. Văn bản còn hiệu lực 1 phần còn hạn trong tương lai (giữ nguyên CON_HIEU_LUC_1_PHAN)
        self.doc_partial_active = VanBanDen.objects.create(
            nam=2026, so_hieu="103/CV-PARTIAL-ACT", so_thu_tu=5,
            trich_yeu="Văn bản còn hiệu lực 1 phần trong tương lai",
            hieu_luc=HieuLuc.CON_HIEU_LUC_1_PHAN,
            ngay_het_hieu_luc=self.future_date,
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

        # Kiểm tra văn bản còn hiệu lực 1 phần quá hạn tự chuyển thành HET_HIEU_LUC
        self.doc_partial_expired.refresh_from_db()
        self.assertEqual(self.doc_partial_expired.hieu_luc, HieuLuc.HET_HIEU_LUC)

        # Văn bản còn hiệu lực 1 phần chưa quá hạn giữ nguyên CON_HIEU_LUC_1_PHAN
        self.doc_partial_active.refresh_from_db()
        self.assertEqual(self.doc_partial_active.hieu_luc, HieuLuc.CON_HIEU_LUC_1_PHAN)

    def test_management_command_expire_documents(self):
        """Management command expire_documents hoạt động chính xác."""
        from django.core.management import call_command
        from io import StringIO

        out = StringIO()
        call_command("expire_documents", stdout=out)

        self.doc_expired.refresh_from_db()
        self.assertEqual(self.doc_expired.hieu_luc, HieuLuc.HET_HIEU_LUC)

        self.doc_partial_expired.refresh_from_db()
        self.assertEqual(self.doc_partial_expired.hieu_luc, HieuLuc.HET_HIEU_LUC)


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
        """Cán bộ không phải người tạo không được phép xóa văn bản -> 403 Forbidden."""
        client = APIClient()
        client.force_authenticate(user=self.staff2)

        res = client.delete(f"/api/documents/{self.doc_staff1.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(VanBanDen.objects.filter(id=self.doc_staff1.id).exists())

    def test_creator_can_delete_own_active_document(self):
        """Người tạo có quyền xóa văn bản còn hiệu lực do mình tạo -> 204 No Content."""
        client = APIClient()
        client.force_authenticate(user=self.staff1)

        res = client.delete(f"/api/documents/{self.doc_staff1.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(VanBanDen.objects.filter(id=self.doc_staff1.id).exists())

    def test_creator_cannot_delete_expired_document(self):
        """Người tạo không được phép xóa văn bản đã hết hiệu lực (chỉ Admin mới được xóa) -> 403 Forbidden."""
        doc_exp = VanBanDen.objects.create(
            nam=2026, so_hieu="11/CV-STAFF1-EXP", so_thu_tu=2,
            trich_yeu="Văn bản hết hạn",
            hieu_luc=HieuLuc.HET_HIEU_LUC,
            nguoi_tao=self.staff1,
        )
        client = APIClient()
        client.force_authenticate(user=self.staff1)

        res = client.delete(f"/api/documents/{doc_exp.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(VanBanDen.objects.filter(id=doc_exp.id).exists())

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


class RestrictedDocumentSecurityIssue82Tests(TestCase):
    """
    Bộ kiểm thử toàn diện cho Issue #82 & PR #92:
    Văn bản hạn chế (pham_vi = 'HAN_CHE'), hàm xem dùng chung, và nhật ký truy cập (DocumentAccessLog).
    """

    def setUp(self):
        self.creator = User.objects.create_user(username="creator_user", password="pwd", is_staff=True)
        self.recipient1 = User.objects.create_user(username="recipient_1", password="pwd")
        self.recipient2 = User.objects.create_user(username="recipient_2", password="pwd")
        self.stranger = User.objects.create_user(username="stranger_user", password="pwd")
        self.other_staff = User.objects.create_user(username="other_staff", password="pwd", is_staff=True)
        self.superuser = User.objects.create_superuser(username="admin_super", password="pwd", email="admin@corp.vn")

        # Tạo văn bản hạn chế mẫu
        self.doc_han_che = VanBanDen.objects.create(
            nam=2026,
            so_hieu="01/HC-2026",
            so_thu_tu=1,
            trich_yeu="Văn bản hạn chế mật nội bộ công ty",
            pham_vi=PhamVi.HAN_CHE,
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            nguoi_tao=self.creator,
        )
        self.doc_han_che.nguoi_nhan.add(self.recipient1)

    def test_restricted_document_requires_at_least_one_recipient_on_create(self):
        """Văn bản hạn chế bắt buộc phải có ít nhất một người nhận khi tạo mới."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        response = client.post(
            "/api/documents/",
            {
                "loai": "DEN",
                "nam": 2026,
                "so_hieu": "02/HC-FAIL",
                "trich_yeu": "Thử tạo không người nhận",
                "pham_vi": "HAN_CHE",
                "nguoi_nhan": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nguoi_nhan", response.data)

    def test_restricted_document_rejects_system_wide_mail(self):
        """Văn bản hạn chế không được phép bật gửi mail toàn hệ thống."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        response = client.post(
            "/api/documents/",
            {
                "loai": "DEN",
                "nam": 2026,
                "so_hieu": "03/HC-MAIL",
                "trich_yeu": "Thử gửi mail toàn hệ thống",
                "pham_vi": "HAN_CHE",
                "gui_mail_toan_he_thong": True,
                "nguoi_nhan": [self.recipient1.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("gui_mail_toan_he_thong", response.data)

    def test_create_restricted_document_logs_them_nguoi_xem(self):
        """Khi tạo mới văn bản hạn chế, hệ thống tự động ghi log THEM_NGUOI_XEM cho các người nhận ban đầu."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        response = client.post(
            "/api/documents/",
            {
                "loai": "DEN",
                "nam": 2026,
                "so_hieu": "04/HC-SUCCESS",
                "trich_yeu": "Tạo văn bản hạn chế thành công",
                "pham_vi": "HAN_CHE",
                "nguoi_nhan": [self.recipient1.id, self.recipient2.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_id = response.data["id"]

        logs = DocumentAccessLog.objects.filter(document_id=new_id, hanh_dong="THEM_NGUOI_XEM")
        self.assertEqual(logs.count(), 2)
        target_ids = set(logs.values_list("doi_tuong_user_id", flat=True))
        self.assertEqual(target_ids, {self.recipient1.id, self.recipient2.id})

    def test_creator_and_recipient_can_view_and_logs_xem(self):
        """Người tạo và người nhận trong danh sách xem được văn bản hạn chế và được ghi log XEM."""
        client = APIClient()

        # 1. Người tạo xem
        client.force_authenticate(user=self.creator)
        res_list = client.get("/api/documents/?loai=DEN")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        ids = [doc["id"] for doc in res_list.data.get("results", res_list.data)]
        self.assertIn(self.doc_han_che.id, ids)

        res_detail = client.get(f"/api/documents/{self.doc_han_che.id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data["pham_vi"], "HAN_CHE")
        self.assertEqual(res_detail.data["pham_vi_display"], "Hạn chế")

        # 2. Người nhận xem
        client.force_authenticate(user=self.recipient1)
        res_rec_detail = client.get(f"/api/documents/{self.doc_han_che.id}/")
        self.assertEqual(res_rec_detail.status_code, status.HTTP_200_OK)

        # Kiểm tra nhật ký XEM
        view_logs = DocumentAccessLog.objects.filter(
            document_id=self.doc_han_che.id,
            hanh_dong="XEM",
        )
        self.assertTrue(view_logs.filter(user=self.creator).exists())
        self.assertTrue(view_logs.filter(user=self.recipient1).exists())

    def test_unauthorized_user_and_superuser_get_404_and_logs_bi_tu_choi(self):
        """
        Tài khoản không thuộc danh sách, KỂ CẢ SUPERUSER, nhận 404 như không tồn tại,
        và mỗi lần thử truy cập đều bị ghi log BI_TU_CHOI.
        """
        client = APIClient()

        # 1. Người lạ (stranger)
        client.force_authenticate(user=self.stranger)
        res_stranger_list = client.get("/api/documents/?loai=DEN")
        stranger_ids = [doc["id"] for doc in res_stranger_list.data.get("results", res_stranger_list.data)]
        self.assertNotIn(self.doc_han_che.id, stranger_ids)

        res_stranger_detail = client.get(f"/api/documents/{self.doc_han_che.id}/")
        self.assertEqual(res_stranger_detail.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Superuser (Tuyệt đối KHÔNG có ngoại lệ)
        client.force_authenticate(user=self.superuser)
        res_super_list = client.get("/api/documents/?loai=DEN")
        super_ids = [doc["id"] for doc in res_super_list.data.get("results", res_super_list.data)]
        self.assertNotIn(self.doc_han_che.id, super_ids)

        res_super_detail = client.get(f"/api/documents/{self.doc_han_che.id}/")
        self.assertEqual(res_super_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Kiểm tra nhật ký BI_TU_CHOI
        rejected_logs = DocumentAccessLog.objects.filter(
            document_id=self.doc_han_che.id,
            hanh_dong="BI_TU_CHOI",
        )
        self.assertTrue(rejected_logs.filter(user=self.stranger).exists())
        self.assertTrue(rejected_logs.filter(user=self.superuser).exists())

    def test_inactive_user_cannot_view_restricted_document(self):
        """Tài khoản bị khóa (is_active = False) mất hoàn toàn quyền xem, kể cả đã là người nhận."""
        self.recipient1.is_active = False
        self.recipient1.save()

        client = APIClient()
        client.force_authenticate(user=self.recipient1)

        res_detail = client.get(f"/api/documents/{self.doc_han_che.id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_restricted_document(self):
        """Văn bản hạn chế KHÔNG ĐƯỢC PHÉP XÓA (bị chặn ở cả API và Model level)."""
        client = APIClient()

        # Thử xóa bằng người tạo
        client.force_authenticate(user=self.creator)
        res_del_creator = client.delete(f"/api/documents/{self.doc_han_che.id}/")
        self.assertEqual(res_del_creator.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("không được phép xóa", str(res_del_creator.data))

        # Thử xóa bằng superuser
        client.force_authenticate(user=self.superuser)
        res_del_super = client.delete(f"/api/documents/{self.doc_han_che.id}/")
        # Superuser nhận 404 (vì không xem được) hoặc 403
        self.assertIn(res_del_super.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        # Đảm bảo văn bản vẫn còn nguyên trong DB
        self.assertTrue(VanBanDen.objects.filter(id=self.doc_han_che.id).exists())

    def test_cannot_change_pham_vi_after_creation(self):
        """Không được phép đổi phạm vi văn bản sau khi tạo (API từ chối)."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        response = client.patch(
            f"/api/documents/{self.doc_han_che.id}/",
            {"pham_vi": "NOI_BO"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pham_vi", response.data)

        self.doc_han_che.refresh_from_db()
        self.assertEqual(self.doc_han_che.pham_vi, PhamVi.HAN_CHE)

    def test_update_recipients_logs_them_and_bot_nguoi_xem(self):
        """Thêm / bớt người xem văn bản hạn chế ghi log đúng THEM_NGUOI_XEM và BOT_NGUOI_XEM."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        # Cập nhật: bớt recipient1, thêm recipient2
        response = client.patch(
            f"/api/documents/{self.doc_han_che.id}/",
            {"nguoi_nhan": [self.recipient2.id]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Kiểm tra nhật ký
        added_log = DocumentAccessLog.objects.filter(
            document_id=self.doc_han_che.id,
            hanh_dong="THEM_NGUOI_XEM",
            doi_tuong_user=self.recipient2,
        ).first()
        self.assertIsNotNone(added_log)
        self.assertEqual(added_log.user, self.creator)

        removed_log = DocumentAccessLog.objects.filter(
            document_id=self.doc_han_che.id,
            hanh_dong="BOT_NGUOI_XEM",
            doi_tuong_user=self.recipient1,
        ).first()
        self.assertIsNotNone(removed_log)
        self.assertEqual(removed_log.user, self.creator)

    def test_download_attachment_access_control_and_logging(self):
        """Tải file đính kèm văn bản hạn chế: Người được cấp tải được (ghi TAI_FILE), người lạ nhận 404 (ghi BI_TU_CHOI)."""
        simple_file = SimpleUploadedFile("mat_noi_bo.pdf", b"Secret PDF content", content_type="application/pdf")
        att = VanBanDenAttachment.objects.create(
            document=self.doc_han_che,
            file=simple_file,
            name="mat_noi_bo.pdf",
            file_size=18,
            created_user=self.creator,
        )

        client = APIClient()

        # 1. Người lạ tải file -> nhận 404 và ghi BI_TU_CHOI
        client.force_authenticate(user=self.stranger)
        res_stranger = client.get(f"/api/documents/{self.doc_han_che.id}/attachments/{att.id}/download/")
        self.assertEqual(res_stranger.status_code, status.HTTP_404_NOT_FOUND)

        rej_log = DocumentAccessLog.objects.filter(
            document_id=self.doc_han_che.id,
            hanh_dong="BI_TU_CHOI",
            tep_id=att.id,
            user=self.stranger,
        ).first()
        self.assertIsNotNone(rej_log)

        # 2. Người nhận tải file -> nhận 200 và ghi TAI_FILE
        client.force_authenticate(user=self.recipient1)
        res_recipient = client.get(f"/api/documents/{self.doc_han_che.id}/attachments/{att.id}/download/")
        self.assertEqual(res_recipient.status_code, status.HTTP_200_OK)

        down_log = DocumentAccessLog.objects.filter(
            document_id=self.doc_han_che.id,
            hanh_dong="TAI_FILE",
            tep_id=att.id,
            user=self.recipient1,
        ).first()
        self.assertIsNotNone(down_log)

    def test_document_access_log_is_worm_immutable(self):
        """Nhật ký DocumentAccessLog tuân thủ WORM: Không được sửa và không được xóa."""
        log = DocumentAccessLog.objects.create(
            document_type="vanbanden",
            document_id=self.doc_han_che.id,
            user=self.creator,
            hanh_dong=DocumentAccessLog.HanhDong.XEM,
        )
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            log.save()

        with self.assertRaises(ValidationError):
            log.delete()

    def test_composite_primary_key_junction_tables(self):
        """Test D-1: 9 bảng nối hoạt động với CompositePrimaryKey không có cột id thừa."""
        from documents.models import (
            VanBanDenNguoiNhan, VanBanDenHoSo, VanBanDenDanhmuc, VanBanDenDonViNhan,
            VanBanDiNguoiNhan, VanBanDiHoSo, VanBanDiDanhmuc, VanBanDiDonViNhan, VanBanDiNoiBanHanh
        )

        # 1. Thêm người nhận qua M2M through (add, all, remove)
        self.doc_han_che.nguoi_nhan.add(self.recipient2)
        self.assertTrue(self.doc_han_che.nguoi_nhan.filter(pk=self.recipient2.pk).exists())
        self.doc_han_che.nguoi_nhan.remove(self.recipient2)
        self.assertFalse(self.doc_han_che.nguoi_nhan.filter(pk=self.recipient2.pk).exists())

        # 2. Tạo bản ghi trực tiếp trên các bảng junction
        hoso_id = HoSo.objects.get(is_he_thong=True).pk
        category = RecordLoaiVanBan.objects.create(ho_so_id=hoso_id, ten_loai="Loại văn bản bảo mật")
        donvi_id = DonVi.objects.order_by("id").first().pk
        hoso = VanBanDenHoSo.objects.create(vanbanden=self.doc_han_che, hoso_id=hoso_id)
        self.assertEqual(hoso.hoso_id, hoso_id)

        dm = VanBanDenDanhmuc.objects.create(vanbanden=self.doc_han_che, loaivanban_id=category.pk)
        self.assertEqual(dm.loaivanban_id, category.pk)

        dv = VanBanDenDonViNhan.objects.create(vanbanden=self.doc_han_che, donvi_id=donvi_id)
        self.assertEqual(dv.donvi_id, donvi_id)

        # Query all không bị lỗi column id does not exist
        all_hoso = list(VanBanDenHoSo.objects.filter(vanbanden=self.doc_han_che))
        self.assertEqual(len(all_hoso), 1)

    def test_auto_stt_concurrency_retry_mechanism(self):
        """Test B-1: Cơ chế retry sinh so_thu_tu tự động khi gặp IntegrityError."""
        # Tạo văn bản đầu tiên
        doc1 = VanBanDen.objects.create(
            nam=2026, so_hieu="AUTO-01/TEST", so_thu_tu=100,
            trich_yeu="Văn bản test STT 100", noi_ban_hanh="ITC",
        )
        self.assertEqual(doc1.so_thu_tu, 100)

        # Tạo văn bản tiếp theo không truyền so_thu_tu, save() tự động sinh số kế tiếp
        doc2 = VanBanDen.objects.create(
            nam=2026, so_hieu="AUTO-02/TEST",
            trich_yeu="Văn bản test STT tự sinh", noi_ban_hanh="ITC",
        )
        self.assertGreaterEqual(doc2.so_thu_tu, 101)

    def test_directional_replacement_relations_and_circular_prevention(self):
        """Test phân định quan hệ thay thế 2 chiều và chặn vòng lặp thay thế A <-> B."""
        from documents.services import get_replacement_relations, sync_replacement_document
        from documents.serializers import DocumentCreateUpdateSerializer
        from rest_framework.exceptions import ValidationError

        # Tạo văn bản gốc A
        doc_a = VanBanDen.objects.create(
            nam=2026, so_hieu="VB-A/2026", so_thu_tu=201,
            trich_yeu="Văn bản cũ A", noi_ban_hanh="ITC",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
        )

        # Tạo văn bản B thay thế A
        doc_b = VanBanDen.objects.create(
            nam=2026, so_hieu="VB-B/2026", so_thu_tu=202,
            trich_yeu="Văn bản mới B thay thế A", noi_ban_hanh="ITC",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            link_thay_the="VB-A/2026",
        )
        sync_replacement_document(doc_b)
        doc_a.refresh_from_db()

        # Quan hệ của A: bị B thay thế
        rel_a = get_replacement_relations(doc_a)
        self.assertIn("VB-B/2026", rel_a["bi_thay_boi"])
        self.assertEqual(rel_a["thay_the_cho"], [])

        # Quan hệ của B: thay thế A
        rel_b = get_replacement_relations(doc_b)
        self.assertIn("VB-A/2026", rel_b["thay_the_cho"])
        self.assertEqual(rel_b["bi_thay_boi"], [])

        # Chặn tự thay thế chính mình
        ser_self = DocumentCreateUpdateSerializer(
            instance=doc_b,
            data={"so_hieu": "VB-B/2026", "link_thay_the": "VB-B/2026", "noi_ban_hanh": "ITC", "trich_yeu": "Test"},
            partial=True,
        )
        with self.assertRaises(ValidationError):
            ser_self.is_valid(raise_exception=True)

        # Chặn A thay thế ngược lại B (Circular Replacement)
        ser_circ = DocumentCreateUpdateSerializer(
            instance=doc_a,
            data={"so_hieu": "VB-A/2026", "link_thay_the": "VB-B/2026", "noi_ban_hanh": "ITC", "trich_yeu": "Test"},
            partial=True,
        )
        with self.assertRaises(ValidationError):
            ser_circ.is_valid(raise_exception=True)

    def test_reject_nonexistent_replacement_target(self):
        """Khóa nghiệp vụ: Chặn nhập số hiệu văn bản không tồn tại trong hệ thống (như '12')."""
        from documents.serializers import DocumentCreateUpdateSerializer
        doc = VanBanDen.objects.create(
            nam=2026, so_hieu="112/TB-SGDĐT", so_thu_tu=210,
            trich_yeu="Văn bản thông báo", noi_ban_hanh="SGDĐT",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            link_thay_the="",
        )
        # Thử gán link_thay_the là số '12' (không tồn tại trong CSDL)
        ser = DocumentCreateUpdateSerializer(
            instance=doc,
            data={"hieu_luc": HieuLuc.HET_VA_THAY_THE, "link_thay_the": "12"},
            partial=True,
        )
        self.assertFalse(ser.is_valid())
        self.assertIn("link_thay_the", ser.errors)
        self.assertIn("không tồn tại", str(ser.errors["link_thay_the"][0]))

    def test_get_replacement_relations_ignores_nonexistent_target(self):
        """Engine quan hệ thay thế tuyệt đối không sinh badge cho văn bản ma/không tồn tại trong DB."""
        from documents.services import get_replacement_relations
        doc = VanBanDen.objects.create(
            nam=2026, so_hieu="112/TB-SGDĐT", so_thu_tu=211,
            trich_yeu="Văn bản thông báo", noi_ban_hanh="SGDĐT",
            hieu_luc=HieuLuc.HET_HIEU_LUC,
            link_thay_the="12",  # Giả sử trong DB có chuỗi 12 chưa xóa
        )
        rel = get_replacement_relations(doc)
        self.assertEqual(rel["thay_the_cho"], [])
        self.assertEqual(rel["bi_thay_boi"], [])


class DocumentPhamViFilterTests(TestCase):
    """
    Test suite kiểm tra bộ lọc pham_vi (HAN_CHE / NOI_BO) theo contract điều hướng của Nhóm 3 (PR #131).
    Đảm bảo:
    - Lọc đúng pham_vi=HAN_CHE và pham_vi=NOI_BO cho cả Văn bản Đến và Đi.
    - Bảo mật RBAC tuyệt đối: Chỉ người tạo/người nhận/đơn vị nhận mới thấy văn bản HAN_CHE.
    - Người không có quyền (stranger) khi gọi pham_vi=HAN_CHE nhận count = 0, không lộ metadata.
    - Phân trang (pagination) và count tính toán chính xác trên tập đã lọc.
    """

    def setUp(self):
        self.creator = User.objects.create_user(username="creator_pv", password="pwd", is_staff=True)
        self.recipient = User.objects.create_user(username="recipient_pv", password="pwd")
        self.stranger = User.objects.create_user(username="stranger_pv", password="pwd")

        # Văn bản đến: 1 nội bộ, 1 hạn chế
        self.doc_den_noibo = VanBanDen.objects.create(
            nam=2026, so_hieu="01/NB-DEN", so_thu_tu=1,
            trich_yeu="Văn bản đến nội bộ thông thường",
            pham_vi=PhamVi.NOI_BO,
            hien_thi=True,
            nguoi_tao=self.creator,
        )
        self.doc_den_hanche = VanBanDen.objects.create(
            nam=2026, so_hieu="02/HC-DEN", so_thu_tu=2,
            trich_yeu="Văn bản đến hạn chế bảo mật",
            pham_vi=PhamVi.HAN_CHE,
            hien_thi=False,
            nguoi_tao=self.creator,
        )
        self.doc_den_hanche.nguoi_nhan.add(self.recipient)

        # Văn bản đi: 1 nội bộ, 1 hạn chế
        self.doc_di_noibo = VanBanDi.objects.create(
            nam=2026, so_hieu="01/NB-DI", so_thu_tu=1,
            trich_yeu="Văn bản đi nội bộ thông thường",
            pham_vi=PhamVi.NOI_BO,
            hien_thi=True,
            nguoi_tao=self.creator,
        )
        self.doc_di_hanche = VanBanDi.objects.create(
            nam=2026, so_hieu="02/HC-DI", so_thu_tu=2,
            trich_yeu="Văn bản đi hạn chế bảo mật",
            pham_vi=PhamVi.HAN_CHE,
            hien_thi=False,
            nguoi_tao=self.creator,
        )
        self.doc_di_hanche.nguoi_nhan.add(self.recipient)

    def test_filter_den_han_che_for_creator(self):
        """Người tạo lọc pham_vi=HAN_CHE cho VB Đến chỉ thấy đúng văn bản hạn chế."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        response = client.get("/api/documents/?loai=DEN&pham_vi=HAN_CHE")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.doc_den_hanche.id)
        self.assertEqual(response.data["results"][0]["pham_vi"], "HAN_CHE")

    def test_filter_den_han_che_for_recipient(self):
        """Người nhận lọc pham_vi=HAN_CHE cho VB Đến thấy đúng văn bản hạn chế được giao."""
        client = APIClient()
        client.force_authenticate(user=self.recipient)

        response = client.get("/api/documents/?loai=DEN&pham_vi=HAN_CHE")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.doc_den_hanche.id)

    def test_filter_den_han_che_for_stranger_returns_zero(self):
        """Người không có quyền lọc pham_vi=HAN_CHE nhận kết quả rỗng (count=0, không lộ metadata)."""
        client = APIClient()
        client.force_authenticate(user=self.stranger)

        response = client.get("/api/documents/?loai=DEN&pham_vi=HAN_CHE")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["results"]), 0)

    def test_filter_den_noi_bo(self):
        """Lọc pham_vi=NOI_BO chỉ trả về văn bản nội bộ, loại bỏ văn bản hạn chế."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        response = client.get("/api/documents/?loai=DEN&pham_vi=NOI_BO")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.doc_den_noibo.id)
        self.assertEqual(response.data["results"][0]["pham_vi"], "NOI_BO")

    def test_filter_di_han_che_and_pagination(self):
        """Kiểm tra lọc pham_vi=HAN_CHE trên Văn bản Đi kèm phân trang chính xác."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        response = client.get("/api/documents/?loai=DI&pham_vi=HAN_CHE&page=1&page_size=10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.doc_di_hanche.id)
        self.assertEqual(response.data["results"][0]["pham_vi"], "HAN_CHE")


class VanBanMatTests(TestCase):
    """
    Test suite cho phân hệ Văn bản Mật (VanBanMat / loai=MAT).
    Kiểm tra toàn diện: Model, bảo mật nghiêm ngặt (Issue #82, #83), API endpoints, ngăn chặn xóa.
    """

    def setUp(self):
        User = get_user_model()
        self.creator = User.objects.create_user(
            username="mat_creator",
            password="password123",
            email="creator@school.edu.vn",
            is_staff=True,
        )
        self.recipient = User.objects.create_user(
            username="mat_recipient",
            password="password123",
            email="recipient@school.edu.vn",
        )
        self.stranger = User.objects.create_user(
            username="mat_stranger",
            password="password123",
            email="stranger@school.edu.vn",
        )
        self.superuser = User.objects.create_superuser(
            username="mat_super",
            password="password123",
            email="super@school.edu.vn",
        )

        self.doc_mat = VanBanMat.objects.create(
            nam=2026,
            so_hieu="01/MAT-BGH",
            trich_yeu="Kế hoạch bảo vệ an ninh và bí mật nội bộ năm 2026",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            nguoi_tao=self.creator,
            pham_vi=PhamVi.HAN_CHE,
            gui_mail_toan_he_thong=False,
        )
        self.doc_mat.nguoi_nhan.add(self.recipient)

    def test_model_confidential_constraints(self):
        """Văn bản mật tự động gán pham_vi=HAN_CHE và cấm gửi mail toàn hệ thống."""
        self.assertEqual(self.doc_mat.pham_vi, PhamVi.HAN_CHE)
        self.assertFalse(self.doc_mat.gui_mail_toan_he_thong)
        self.assertIn(self.doc_mat.loai, ("DEN", "MAT"))
        self.assertIn(self.doc_mat.document_kind, ("vanbanden", "vanbanmat"))

    def test_admin_cannot_delete_restricted_compatibility_document(self):
        """Alias Văn bản Mật vẫn tuân thủ hợp đồng không xóa văn bản HAN_CHE."""
        client = APIClient()
        client.force_authenticate(user=self.superuser)
        res = client.delete(f"/api/documents/mat/{self.doc_mat.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(VanBanMat.objects.filter(id=self.doc_mat.id).exists())

    def test_attachment_creation_and_path(self):
        """Tệp đính kèm văn bản mật lưu theo đường dẫn chuẩn 02_documents/..."""
        att = VanBanMatAttachment.objects.create(
            document=self.doc_mat,
            name="kehoach_mat.pdf",
        )
        self.assertTrue(att.file.field.upload_to(att, "kehoach_mat.pdf").startswith("02_documents/"))

    def test_junction_relations(self):
        """Liên kết Hồ sơ, Danh mục, Đơn vị nhận, Nơi ban hành hoạt động trơn tru."""
        hoso_id = HoSo.objects.get(is_he_thong=True).pk
        category = RecordLoaiVanBan.objects.create(ho_so_id=hoso_id, ten_loai="Loại văn bản hạn chế")
        donvi_id = DonVi.objects.order_by("id").first().pk
        VanBanMatHoSo.objects.create(vanbanden=self.doc_mat, hoso_id=hoso_id)
        VanBanMatDanhmuc.objects.create(vanbanden=self.doc_mat, loaivanban_id=category.pk)
        VanBanMatDonViNhan.objects.create(vanbanden=self.doc_mat, donvi_id=donvi_id)

        self.assertEqual(self.doc_mat.hoso.count(), 1)
        self.assertEqual(self.doc_mat.danhmuc.count(), 1)
        self.assertEqual(self.doc_mat.donvinhan.count(), 1)

    def test_creator_and_recipient_can_access(self):
        """Người tạo và người nhận xem được văn bản mật qua API."""
        client = APIClient()

        # Người tạo
        client.force_authenticate(user=self.creator)
        res = client.get("/api/documents/mat/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)

        res_detail = client.get(f"/api/documents/mat/{self.doc_mat.id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data["so_hieu"], "01/MAT-BGH")

        # Người nhận
        client.force_authenticate(user=self.recipient)
        res = client.get("/api/documents/mat/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)

    def test_stranger_and_superuser_cannot_access_confidential_document(self):
        """Người ngoài và superuser không có trong người nhận đều không xem được (404/bảo mật tuyệt đối)."""
        client = APIClient()

        # Người ngoài
        client.force_authenticate(user=self.stranger)
        res = client.get("/api/documents/mat/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 0)

        res_detail = client.get(f"/api/documents/mat/{self.doc_mat.id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Superuser không được gán quyền nhận
        client.force_authenticate(user=self.superuser)
        res_super = client.get("/api/documents/mat/")
        self.assertEqual(res_super.data["count"], 0)

        res_super_detail = client.get(f"/api/documents/mat/{self.doc_mat.id}/")
        self.assertEqual(res_super_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_via_api(self):
        """Cố gắng xóa văn bản mật qua API bị từ chối 403."""
        client = APIClient()
        client.force_authenticate(user=self.creator)
        res = client.delete(f"/api/documents/mat/{self.doc_mat.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_confidential_document_via_unified_api(self):
        """Tạo văn bản mật qua endpoint thống nhất /api/documents/ với loai=MAT."""
        client = APIClient()
        client.force_authenticate(user=self.creator)

        payload = {
            "loai": "MAT",
            "so_hieu": "02/MAT-BGH",
            "trich_yeu": "Nội quy phòng họp mật",
            "nam": 2026,
            "nguoi_nhan": [self.recipient.id],
        }
        res = client.post("/api/documents/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn(res.data["loai"], ("DEN", "MAT"))
        self.assertEqual(res.data["pham_vi"], "HAN_CHE")

        doc = VanBanMat.objects.filter(so_hieu="02/MAT-BGH").first()
        self.assertIsNotNone(doc)
        self.assertTrue(doc.nguoi_nhan.filter(id=self.recipient.id).exists())


# ═══════════════════════════════════════════════════════════════════
# VAN BAN DI SERVICE TESTS (Phụ trách: Nguyễn Anh Đô)
# ═══════════════════════════════════════════════════════════════════

class VanBanDiServiceTests(TestCase):
    """
    Bộ kiểm thử Backend Services cho Văn bản Đi (Phụ trách: Nguyễn Anh Đô):
    1. Thuật toán tự sinh Số đi (so_thu_tu) tự tăng độc lập theo năm, concurrency safe.
    2. Khóa cứng so_thu_tu và nam khi cập nhật văn bản (PUT/PATCH).
    3. Bộ lọc nâng cao VanBanDiFilter (năm, khoảng ngày ban hành, loại VB, hồ sơ, hiệu lực, nơi ban hành, người ký, đơn vị nhận).
    4. Dịch vụ Excel Văn bản Đi (sinh file mẫu từ DB, Import tự cấp số đi nếu trống, Export theo bộ lọc).
    5. Cập nhật và truy vấn lịch sử người xem DocumentViewLog (document_type='vanbandi') qua endpoint /viewers/.
    """

    def setUp(self):
        from documents.services import generate_so_thu_tu, generate_excel_template, import_from_excel, export_to_excel
        from documents.filters import VanBanDiFilter
        self.creator = User.objects.create_user(
            username="docreator",
            password="testpassword123",
            email="docreator@itc.edu.vn",
        )
        self.recipient = User.objects.create_user(
            username="dorecipient",
            password="testpassword123",
            email="dorecipient@itc.edu.vn",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.creator)

    def test_di_concurrency_safe_numbering(self):
        """Số đi tự tăng độc lập theo năm và bảo vệ chống trùng lặp."""
        from documents.services import generate_so_thu_tu
        so1 = generate_so_thu_tu("DI", 2026)
        self.assertEqual(so1, 1)

        doc1 = VanBanDi.objects.create(
            nam=2026,
            so_hieu="01/TB-ITC",
            so_thu_tu=so1,
            trich_yeu="Thông báo lịch nghỉ lễ 2026",
            nguoi_tao=self.creator,
        )
        self.assertEqual(doc1.so_thu_tu, 1)

        so2 = generate_so_thu_tu("DI", 2026)
        self.assertEqual(so2, 2)

        # Độc lập theo năm
        so_2027 = generate_so_thu_tu("DI", 2027)
        self.assertEqual(so_2027, 1)

    def test_di_update_so_thu_tu_and_nam_strictly_immutable(self):
        """Khóa cứng so_thu_tu và nam, chặn hoàn toàn việc sửa đổi số đi qua form cập nhật (PUT/PATCH)."""
        doc = VanBanDi.objects.create(
            nam=2026,
            so_hieu="10/QĐ-ITC",
            so_thu_tu=10,
            trich_yeu="Quyết định ban đầu",
            nguoi_tao=self.creator,
            ngay_ban_hanh=timezone.now(),
        )

        # Cố gắng thay đổi so_thu_tu và nam qua PUT /api/documents/{id}/
        res_put = self.client.put(
            f"/api/documents/{doc.id}/",
            {
                "loai": "DI",
                "so_hieu": "10/QĐ-ITC-SỬA",
                "trich_yeu": "Quyết định sau khi sửa",
                "nam": 2030,
                "so_thu_tu": 999,
                "ngay_ban_hanh": timezone.now().isoformat(),
            },
            format="json",
        )
        self.assertEqual(res_put.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(doc.so_thu_tu, 10)  # Vẫn giữ nguyên 10!
        self.assertEqual(doc.nam, 2026)      # Vẫn giữ nguyên 2026!
        self.assertEqual(doc.trich_yeu, "Quyết định sau khi sửa")

        # Cố gắng thay đổi qua PATCH endpoint chuyên biệt /api/documents/di/{id}/
        res_patch = self.client.patch(
            f"/api/documents/di/{doc.id}/",
            {
                "nam": 2040,
                "so_thu_tu": 888,
                "trich_yeu": "Quyết định sau khi patch",
            },
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(doc.so_thu_tu, 10)  # Vẫn giữ nguyên 10!
        self.assertEqual(doc.nam, 2026)      # Vẫn giữ nguyên 2026!

    def test_di_advanced_filters(self):
        """Bộ lọc nâng cao VanBanDiFilter hỗ trợ đa tiêu chí."""
        from documents.filters import VanBanDiFilter
        now = timezone.now()
        doc1 = VanBanDi.objects.create(
            nam=2026,
            so_hieu="01/QĐ-ITC",
            so_thu_tu=1,
            trich_yeu="Quyết định khen thưởng giảng viên",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            nguoi_ky="Hiệu trưởng",
            nguoi_tao=self.creator,
            ngay_ban_hanh=now - timezone.timedelta(days=10),
        )
        doc2 = VanBanDi.objects.create(
            nam=2026,
            so_hieu="02/TB-ITC",
            so_thu_tu=2,
            trich_yeu="Thông báo lịch thi học kỳ (Hồ sơ đào tạo)",
            hieu_luc=HieuLuc.HET_HIEU_LUC,
            nguoi_ky="Trưởng phòng đào tạo",
            nguoi_tao=self.creator,
            ngay_ban_hanh=now - timezone.timedelta(days=2),
        )

        donvi_ids = list(DonVi.objects.order_by("id").values_list("id", flat=True)[:2])
        VanBanDiNoiBanHanh.objects.create(vanbandi=doc1, donvi_id=donvi_ids[0])
        VanBanDiDonViNhan.objects.create(vanbandi=doc2, donvi_id=donvi_ids[1])

        qs = VanBanDi.objects.all()

        # Lọc theo năm
        f_nam = VanBanDiFilter({"nam": 2026}, queryset=qs)
        self.assertEqual(f_nam.qs.count(), 2)

        # Lọc theo khoảng ngày ban hành
        f_date = VanBanDiFilter(
            {"tu_ngay": (now - timezone.timedelta(days=5)).isoformat(), "den_ngay": now.isoformat()},
            queryset=qs,
        )
        self.assertEqual(f_date.qs.count(), 1)
        self.assertEqual(f_date.qs.first().id, doc2.id)

        # Lọc theo loại VB
        f_loai = VanBanDiFilter({"loai_van_ban": "Quyết định"}, queryset=qs)
        self.assertEqual(f_loai.qs.count(), 1)
        self.assertEqual(f_loai.qs.first().id, doc1.id)

        # Lọc theo hồ sơ
        f_hoso = VanBanDiFilter({"ho_so": "Hồ sơ đào tạo"}, queryset=qs)
        self.assertEqual(f_hoso.qs.count(), 1)
        self.assertEqual(f_hoso.qs.first().id, doc2.id)

        # Lọc theo hiệu lực
        f_hl = VanBanDiFilter({"hieu_luc": "CON_HIEU_LUC"}, queryset=qs)
        self.assertEqual(f_hl.qs.count(), 1)
        self.assertEqual(f_hl.qs.first().id, doc1.id)

        # Lọc theo người ký
        f_signer = VanBanDiFilter({"nguoi_ky": "Hiệu trưởng"}, queryset=qs)
        self.assertEqual(f_signer.qs.count(), 1)
        self.assertEqual(f_signer.qs.first().id, doc1.id)

        # Lọc theo nơi ban hành liên kết
        f_nbh = VanBanDiFilter({"noi_ban_hanh": str(donvi_ids[0])}, queryset=qs)
        self.assertEqual(f_nbh.qs.count(), 1)
        self.assertEqual(f_nbh.qs.first().id, doc1.id)

        # Lọc theo đơn vị nhận
        f_dvn = VanBanDiFilter({"don_vi_nhan": str(donvi_ids[1])}, queryset=qs)
        self.assertEqual(f_dvn.qs.count(), 1)
        self.assertEqual(f_dvn.qs.first().id, doc2.id)

    def test_di_excel_service_template_import_export(self):
        """Dịch vụ Excel Văn bản Đi: template, import tự cấp số nếu trống, export theo bộ lọc."""
        from documents.services import generate_excel_template, import_from_excel, export_to_excel
        # 1. Sinh file mẫu
        template_bio = generate_excel_template("DI")
        self.assertTrue(template_bio.getvalue().startswith(b"PK"))

        # 2. Import Excel tự cấp Số đi nếu cột trống
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.append(["Số, ký hiệu VB", "Số đi", "Ngày ban hành", "Trích yếu nội dung", "Hiệu lực"])
        ws.append(["11/TB-DI", "", "15/09/2026 09:00:00", "Thông báo tuyển dụng cán bộ mới", "CON_HIEU_LUC"])

        in_bio = io.BytesIO()
        wb.save(in_bio)
        in_bio.seek(0)

        result = import_from_excel(in_bio, "DI", self.creator)
        self.assertEqual(result["created"], 1)

        imported_doc = VanBanDi.objects.filter(so_hieu="11/TB-DI").first()
        self.assertIsNotNone(imported_doc)
        self.assertTrue(imported_doc.so_thu_tu >= 1)

        # 3. Export Excel có cột Số đi
        export_bio = export_to_excel(VanBanDi.objects.filter(so_hieu="11/TB-DI"), "DI")
        self.assertTrue(export_bio.getvalue().startswith(b"PK"))

    def test_di_viewlog_and_viewers_endpoint(self):
        """Ghi nhận lịch sử xem DocumentViewLog (document_type='vanbandi') và query viewers."""
        doc = VanBanDi.objects.create(
            nam=2026,
            so_hieu="55/TB-DI",
            so_thu_tu=55,
            trich_yeu="Thông báo lịch trực tuần",
            nguoi_tao=self.creator,
        )

        # Xem văn bản qua API
        res = self.client.get(f"/api/documents/{doc.id}/?loai=DI")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        log_entry = DocumentViewLog.objects.filter(
            document_type="vanbandi",
            document_id=doc.id,
            user=self.creator,
        ).first()
        self.assertIsNotNone(log_entry)

        # Query viewers API chuyên biệt /api/documents/di/{id}/viewers/
        res_viewers = self.client.get(f"/api/documents/di/{doc.id}/viewers/")
        self.assertEqual(res_viewers.status_code, status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════
# VAN BAN MAT SERVICE TESTS (Phụ trách: Nguyễn Anh Đô)
# ═══════════════════════════════════════════════════════════════════

class VanBanMatServiceTests(TestCase):
    """
    Bộ kiểm thử Backend Services cho Văn bản Mật (Phụ trách: Nguyễn Anh Đô):
    1. Bộ lọc nâng cao VanBanMatFilter: số ký hiệu, trích yếu, năm, khoảng ngày ban hành, hiệu lực.
    2. Dịch vụ Excel cho Văn bản Mật: sinh file mẫu bảo mật (không có cột Số đi), import chặt chẽ (áp pham_vi=HAN_CHE, cấm mail).
    3. Export Excel theo phân quyền người dùng đăng nhập (không rò rỉ dữ liệu mật cho người không được nhận).
    4. Cập nhật logic DocumentViewLog cho document_type='vanbanmat' lưu chính xác ngày giờ phút giây.
    5. Khóa chức năng gửi email toàn hệ thống ở cấp backend service đối với văn bản mật.
    """

    def setUp(self):
        from documents.filters import VanBanMatFilter
        from documents.services import (
            generate_excel_template,
            import_from_excel,
            export_to_excel,
            send_document_notification_mail,
        )
        self.creator = User.objects.create_user(
            username="matcreator",
            password="testpassword123",
            email="creator@itc.edu.vn",
        )
        self.recipient = User.objects.create_user(
            username="matrecipient",
            password="testpassword123",
            email="recipient@itc.edu.vn",
        )
        self.stranger = User.objects.create_user(
            username="matstranger",
            password="testpassword123",
            email="stranger@itc.edu.vn",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.creator)

    def test_mat_advanced_filters(self):
        """Bộ lọc nâng cao VanBanMatFilter: số ký hiệu, trích yếu, năm, khoảng ngày ban hành, hiệu lực."""
        from documents.filters import VanBanMatFilter
        now = timezone.now()
        doc1 = VanBanMat.objects.create(
            nam=2026,
            so_hieu="01/MẬT-BGH",
            trich_yeu="Phương án bảo mật đề thi học kỳ 1",
            hieu_luc=HieuLuc.CON_HIEU_LUC,
            nguoi_tao=self.creator,
            ngay_den=now - timezone.timedelta(days=10),
            pham_vi=PhamVi.HAN_CHE,
        )
        doc1.nguoi_nhan.add(self.recipient)

        doc2 = VanBanMat.objects.create(
            nam=2026,
            so_hieu="02/MẬT-TCKT",
            trich_yeu="Báo cáo quyết toán dự án quốc phòng",
            hieu_luc=HieuLuc.HET_HIEU_LUC,
            nguoi_tao=self.creator,
            ngay_den=now - timezone.timedelta(days=2),
            pham_vi=PhamVi.HAN_CHE,
        )
        doc2.nguoi_nhan.add(self.recipient)

        qs = VanBanMat.objects.all()

        # Tìm kiếm từ khóa theo số ký hiệu hoặc trích yếu
        f_q = VanBanMatFilter({"q": "đề thi"}, queryset=qs)
        self.assertEqual(f_q.qs.count(), 1)
        self.assertEqual(f_q.qs.first().id, doc1.id)

        f_so = VanBanMatFilter({"so_hieu": "02/MẬT"}, queryset=qs)
        self.assertEqual(f_so.qs.count(), 1)
        self.assertEqual(f_so.qs.first().id, doc2.id)

        # Lọc theo năm
        f_nam = VanBanMatFilter({"nam": 2026}, queryset=qs)
        self.assertEqual(f_nam.qs.count(), 2)

        # Lọc theo khoảng ngày ban hành
        f_date = VanBanMatFilter(
            {"tu_ngay": (now - timezone.timedelta(days=5)).isoformat(), "den_ngay": now.isoformat()},
            queryset=qs,
        )
        self.assertEqual(f_date.qs.count(), 1)
        self.assertEqual(f_date.qs.first().id, doc2.id)

        # Lọc theo hiệu lực
        f_hl = VanBanMatFilter({"hieu_luc": "CON_HIEU_LUC"}, queryset=qs)
        self.assertEqual(f_hl.qs.count(), 1)
        self.assertEqual(f_hl.qs.first().id, doc1.id)

    def test_mat_excel_security_template(self):
        """Sinh file mẫu Excel bảo mật: không có cột Số đi, có định dạng bảo mật."""
        from documents.services import generate_excel_template
        template_bio = generate_excel_template("MAT")
        self.assertTrue(template_bio.getvalue().startswith(b"PK"))

        from openpyxl import load_workbook
        wb = load_workbook(template_bio, read_only=True)
        ws = wb.active
        headers = [cell for cell in next(ws.iter_rows(values_only=True))]
        self.assertNotIn("Số đi", headers)
        self.assertIn("Số, ký hiệu VB", headers)
        self.assertIn("Trích yếu nội dung", headers)

    def test_mat_excel_import_strict_validation(self):
        """Import Excel VB Mật: kiểm tra chặt chẽ bắt buộc, áp pham_vi=HAN_CHE và cấm gửi mail."""
        from documents.services import import_from_excel
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.append(["Số, ký hiệu VB", "Ngày ban hành", "Trích yếu nội dung", "Hiệu lực"])
        ws.append(["99/MẬT-BGH", "10/10/2026 08:30:00", "Hồ sơ công tác nhân sự bảo mật", "CON_HIEU_LUC"])

        in_bio = io.BytesIO()
        wb.save(in_bio)
        in_bio.seek(0)

        result = import_from_excel(in_bio, "MAT", self.creator)
        self.assertEqual(result["created"], 1)

        imported = VanBanMat.objects.filter(so_hieu="99/MẬT-BGH").first()
        self.assertIsNotNone(imported)
        self.assertEqual(imported.pham_vi, PhamVi.HAN_CHE)
        self.assertFalse(imported.gui_mail_toan_he_thong)
        self.assertTrue(imported.nguoi_nhan.filter(id=self.creator.id).exists())

    def test_mat_excel_export_scoped_by_user_permissions(self):
        """Export Excel VB Mật: tuân thủ chặt chẽ phân quyền, không có cột Số đi."""
        doc = VanBanMat.objects.create(
            nam=2026,
            so_hieu="77/MẬT-BGH",
            trich_yeu="Tài liệu cơ mật của Ban Giám hiệu",
            nguoi_tao=self.creator,
            pham_vi=PhamVi.HAN_CHE,
        )
        doc.nguoi_nhan.add(self.recipient)

        # Người lạ gọi export qua API chỉ nhận được danh sách rỗng (hoặc chỉ văn bản họ được xem)
        client_stranger = APIClient()
        client_stranger.force_authenticate(user=self.stranger)
        res_stranger = client_stranger.get("/api/documents/mat/export/")
        self.assertEqual(res_stranger.status_code, status.HTTP_200_OK)

        from openpyxl import load_workbook
        wb_stranger = load_workbook(io.BytesIO(res_stranger.content), read_only=True)
        ws_stranger = wb_stranger.active
        rows_stranger = list(ws_stranger.iter_rows(values_only=True))
        # Chỉ có 1 hàng header, 0 hàng dữ liệu
        self.assertEqual(len(rows_stranger), 1)

        # Người nhận được phép xuất
        client_recipient = APIClient()
        client_recipient.force_authenticate(user=self.recipient)
        res_recipient = client_recipient.get("/api/documents/mat/export/")
        self.assertEqual(res_recipient.status_code, status.HTTP_200_OK)
        wb_recipient = load_workbook(io.BytesIO(res_recipient.content), read_only=True)
        ws_recipient = wb_recipient.active
        rows_recipient = list(ws_recipient.iter_rows(values_only=True))
        self.assertEqual(len(rows_recipient), 2)
        # Xác nhận hàng header không có cột Số đi
        self.assertNotIn("Số đi", rows_recipient[0])

    def test_mat_viewlog_uses_backing_kind_and_preserves_timestamp(self):
        """Alias Văn bản Mật ghi view-log dưới loại văn bản của bảng dùng chung."""
        doc = VanBanMat.objects.create(
            nam=2026,
            so_hieu="88/MẬT-VP",
            trich_yeu="Văn bản mật kiểm tra view log",
            nguoi_tao=self.creator,
            pham_vi=PhamVi.HAN_CHE,
        )
        doc.nguoi_nhan.add(self.recipient)

        client_rec = APIClient()
        client_rec.force_authenticate(user=self.recipient)
        res = client_rec.get(f"/api/documents/mat/{doc.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        view_log = DocumentViewLog.objects.filter(
            document_type="vanbanden",
            document_id=doc.id,
            user=self.recipient,
        ).first()
        self.assertIsNotNone(view_log)
        self.assertIsNotNone(view_log.viewed_at)

        res_viewers = client_rec.get(f"/api/documents/mat/{doc.id}/viewers/")
        self.assertEqual(res_viewers.status_code, status.HTTP_200_OK)

    def test_mat_access_log_uses_backing_kind(self):
        from documents.selectors import log_access

        doc = VanBanMat.objects.create(
            nam=2026,
            so_hieu="89/MAT-SERVICE",
            trich_yeu="Văn bản mật kiểm tra access log",
            nguoi_tao=self.creator,
            pham_vi=PhamVi.HAN_CHE,
        )
        log = log_access(
            "vanbanmat",
            doc.pk,
            self.creator,
            DocumentAccessLog.HanhDong.XEM,
        )
        self.assertEqual(log.document_type, "vanbanden")

    def test_mat_email_lockdown_at_service_layer(self):
        """Khóa hoàn toàn chức năng gửi email toàn hệ thống ở cấp backend service đối với văn bản mật."""
        from django.core.exceptions import ValidationError
        from documents.services import send_document_notification_mail

        doc = VanBanMat.objects.create(
            nam=2026,
            so_hieu="100/MẬT-BGH",
            trich_yeu="Bí mật nhà nước tuyệt đối",
            nguoi_tao=self.creator,
            pham_vi=PhamVi.HAN_CHE,
            gui_mail_toan_he_thong=False,
        )
        doc.nguoi_nhan.add(self.recipient)

        # Cố gắng gửi mail toàn hệ thống ở service layer -> Bị từ chối bằng ValidationError
        with self.assertRaises(ValidationError):
            send_document_notification_mail(doc, force_system_wide=True)

        with self.assertRaises(ValidationError):
            send_document_notification_mail(doc, recipient_list="ALL")

        # Gửi đích danh cho người nhận được cấp quyền -> Hợp lệ
        result = send_document_notification_mail(doc)
        self.assertTrue(result["success"])
        self.assertTrue(result["is_confidential"])
        self.assertIn(self.recipient.email, result["recipients"])







