"""
Bộ kiểm thử toàn diện cho phân hệ Quản lý Cán bộ Nhân viên (CBNV - Issue #24).
Tác giả: Lê Duy Khánh (leduykhanhdevs).
Bao gồm:
1. CRUD nhân viên (tạo, đọc, sửa, xóa, tìm kiếm, lọc, sắp xếp theo STT Đơn vị -> Chức vụ).
2. Kiểm tra tính bảo mật & quyền riêng tư (che năm sinh DD/MM/---- và ẩn nhóm quyền nếu thiếu quyền view_full_cbnv).
3. Kiểm tra logic nghiệp vụ: trạng thái 'nghi_viec' tự động vô hiệu hóa user.is_active = False.
4. Kiểm tra danh mục Chức vụ (Position) và Nhóm quyền (Group).
5. Kiểm tra Tải tệp mẫu Excel và Nhập Excel validate từng dòng dữ liệu.
"""
from io import BytesIO
from datetime import date
import openpyxl
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from organizations.models import KhoiKhuVuc, DonVi
from accounts.models import Employee, Position

User = get_user_model()


class EmployeeBaseTestCase(APITestCase):
    """Lớp nền tảng tạo sẵn dữ liệu mẫu cho các ca kiểm thử."""

    def setUp(self):
        # 1. Tạo Khối & Đơn vị
        self.khoi = KhoiKhuVuc.objects.create(ten="Khối Cơ quan Điều hành")
        self.don_vi_1 = DonVi.objects.create(
            ten="Văn phòng Viện",
            khoi=self.khoi,
            stt_uu_tien=1,
            is_public=True,
        )
        self.don_vi_2 = DonVi.objects.create(
            ten="Phòng Kế toán - Tài chính",
            khoi=self.khoi,
            stt_uu_tien=2,
            is_public=True,
        )

        # 2. Tạo Chức vụ
        self.cv_truong_phong = Position.objects.create(
            name="Trưởng phòng",
            display_order=1,
            is_public=True,
        )
        self.cv_chuyen_vien = Position.objects.create(
            name="Chuyên viên",
            display_order=2,
            is_public=True,
        )

        # 3. Tạo Nhóm quyền
        # "Văn thư" là nhóm chuẩn đã được authorization seed sẵn (SQL_Fix4)
        self.group_van_thu, _ = Group.objects.get_or_create(name="Văn thư")
        self.group_lanh_dao, _ = Group.objects.get_or_create(name="Lãnh đạo đơn vị")

        # 4. Tạo Users (Employee là Custom User Model)
        # Superuser
        self.admin_user = User.objects.create_superuser(
            username="admin_user",
            email="admin@donvi.gov.vn",
            password="SuperPassword123",
            ho_ten="Quản trị viên",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_truong_phong,
        )

        # User thường (không có quyền view_full_cbnv)
        self.normal_user = User.objects.create_user(
            username="normal_user",
            email="normal@donvi.gov.vn",
            password="NormalPassword123",
            ho_ten="Nguyễn Văn Bình",
            ngay_sinh=date(1995, 5, 20),
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
            sdt="0912345678",
        )

        # User có quyền xem thông tin nhạy cảm
        self.sensitive_user = User.objects.create_user(
            username="sensitive_user",
            email="sensitive@donvi.gov.vn",
            password="SensitivePassword123",
            ho_ten="Trần Văn Hùng",
            ngay_sinh=date(1988, 10, 15),
            don_vi=self.don_vi_2,
            chuc_vu=self.cv_truong_phong,
            sdt="0987654321",
        )
        self.perm_sensitive = Permission.objects.get(codename="view_full_cbnv")
        self.perm_import = Permission.objects.get(codename="import_cbnv")
        self.sensitive_user.user_permissions.add(self.perm_sensitive, self.perm_import)

        # URLs
        self.employee_list_url = "/api/accounts/employees/"
        self.group_list_url = "/api/accounts/groups/"
        self.template_url = "/api/accounts/employees/template/"
        self.import_url = "/api/accounts/employees/import/"


class EmployeeCRUDAndFilterTests(EmployeeBaseTestCase):
    """Kiểm tra tạo, đọc, cập nhật, xóa, tìm kiếm và phân trang CBNV."""

    def test_create_employee_success(self):
        """Tạo mới CBNV thành công, tự động tạo User, sinh mật khẩu tạm thời và hash mật khẩu."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "ho_ten": "Lê Thị Mai",
            "email": "mailt@donvi.gov.vn",
            "ngay_sinh": "1992-08-25",
            "don_vi_id": self.don_vi_1.id,
            "chuc_vu_id": self.cv_chuyen_vien.id,
            "chuc_danh": "Chuyên viên tổng hợp",
            "sdt": "0901234567",
            "nhom_quyen_ids": [self.group_van_thu.id],
            "trang_thai": "dang_lam_viec",
            "is_public": True,
            "ghi_chu": "Nhân viên mới tuyển dụng",
        }
        response = self.client.post(self.employee_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["ho_ten"], "Lê Thị Mai")
        self.assertEqual(data["email"], "mailt@donvi.gov.vn")
        self.assertEqual(data["don_vi_ten"], "Văn phòng Viện")
        self.assertEqual(data["chuc_vu_ten"], "Chuyên viên")
        self.assertIsNotNone(data["temporary_password"])

        # Kiểm tra bản ghi User được tạo trong DB
        user = User.objects.get(email="mailt@donvi.gov.vn")
        self.assertTrue(user.is_active)
        self.assertTrue(user.check_password(data["temporary_password"]))
        # Kiểm tra nhóm quyền được liên kết
        self.assertTrue(user.groups.filter(id=self.group_van_thu.id).exists())

    def test_create_employee_validation_duplicate_email(self):
        """Tạo CBNV với email trùng lặp phải trả về lỗi 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "ho_ten": "Nguyễn Văn Trùng",
            "email": "normal@donvi.gov.vn",  # Trùng với self.normal_user
            "ngay_sinh": "1990-01-01",
        }
        response = self.client.post(self.employee_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json())

    def test_create_employee_validation_invalid_phone(self):
        """Tạo CBNV với số điện thoại sai định dạng VN phải trả về lỗi 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "ho_ten": "Trần Thị Sai SĐT",
            "email": "saisdt@donvi.gov.vn",
            "ngay_sinh": "1990-01-01",
            "sdt": "123456",  # Không phải số điện thoại VN hợp lệ
        }
        response = self.client.post(self.employee_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sdt", response.json())

    def test_list_employees_pagination_and_all(self):
        """Kiểm tra danh sách CBNV hỗ trợ phân trang và query all=true."""
        self.client.force_authenticate(user=self.admin_user)
        # Phân trang mặc định
        res = self.client.get(self.employee_list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Lấy toàn bộ không phân trang với all=true
        res_all = self.client.get(f"{self.employee_list_url}?all=true")
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res_all.json(), list)

    def test_search_employees(self):
        """Tìm kiếm CBNV theo tên, email, sđt."""
        self.client.force_authenticate(user=self.admin_user)
        # Tìm theo tên
        res = self.client.get(f"{self.employee_list_url}?search=Bình")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["ho_ten"], "Nguyễn Văn Bình")

        # Tìm theo SĐT
        res_phone = self.client.get(f"{self.employee_list_url}?search=0987654321")
        self.assertEqual(res_phone.status_code, status.HTTP_200_OK)
        results_phone = res_phone.json()["results"]
        self.assertEqual(len(results_phone), 1)
        self.assertEqual(results_phone[0]["ho_ten"], "Trần Văn Hùng")

    def test_filter_employees_by_unit_and_position(self):
        """Lọc CBNV theo đơn vị và chức vụ."""
        self.client.force_authenticate(user=self.admin_user)
        res_unit = self.client.get(f"{self.employee_list_url}?don_vi_id={self.don_vi_2.id}")
        self.assertEqual(res_unit.status_code, status.HTTP_200_OK)
        results = res_unit.json()["results"]
        self.assertTrue(all(item["don_vi_id"] == self.don_vi_2.id for item in results))

    def test_update_employee(self):
        """Cập nhật thông tin CBNV."""
        self.client.force_authenticate(user=self.admin_user)
        detail_url = f"{self.employee_list_url}{self.normal_user.id}/"
        payload = {
            "ho_ten": "Nguyễn Văn Bình (Cập nhật)",
            "chuc_danh": "Phó phòng phụ trách",
            "sdt": "0933333333",
        }
        res = self.client.patch(detail_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["ho_ten"], "Nguyễn Văn Bình (Cập nhật)")
        self.assertEqual(data["chuc_danh"], "Phó phòng phụ trách")
        self.assertEqual(data["sdt"], "0933333333")

    def test_delete_employee(self):
        """Xóa CBNV (chính là tài khoản đăng nhập)."""
        self.client.force_authenticate(user=self.admin_user)
        target_user_id = self.normal_user.id
        detail_url = f"{self.employee_list_url}{target_user_id}/"

        res = self.client.delete(detail_url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=target_user_id).exists())


    def test_create_employee_requires_unit_and_position(self):
        """SQL_Fix4: don_vi_id và chuc_vu_id NOT NULL -> thiếu là 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {"ho_ten": "Thiếu Đơn Vị", "email": "thieu@donvi.gov.vn", "ngay_sinh": "1990-01-01"}
        response = self.client.post(self.employee_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertIn("don_vi_id", body)
        self.assertIn("chuc_vu_id", body)

    def test_status_is_stored_with_ddl_enum_values(self):
        """API nhận 'nghi_viec' nhưng CSDL lưu 'NGHI_VIEC' (ENUM employee_work_status), API vẫn trả dạng cũ."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(f"{self.employee_list_url}{self.normal_user.id}/", {"trang_thai": "nghi_viec"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["trang_thai"], "nghi_viec")
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.trang_thai, "NGHI_VIEC")

    def test_filter_by_status_uses_api_value(self):
        self.client.force_authenticate(user=self.admin_user)
        self.normal_user.trang_thai = Employee.Status.NGHI_VIEC
        self.normal_user.save()
        res = self.client.get(f"{self.employee_list_url}?trang_thai=nghi_viec")
        self.assertEqual([item["username"] for item in res.json()["results"]], ["normal_user"])


class EmployeeSecurityAndPrivacyTests(EmployeeBaseTestCase):
    """Kiểm tra các quy tắc bảo mật & quyền riêng tư trường dữ liệu nhạy cảm."""

    def test_birthday_masked_for_user_without_sensitive_perm(self):
        """User thường không có quyền view_full_cbnv: ngày sinh bị che thành DD/MM/---- và nhóm quyền rỗng."""
        self.client.force_authenticate(user=self.normal_user)
        detail_url = f"{self.employee_list_url}{self.sensitive_user.id}/"
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        # Ngày sinh gốc là 1988-10-15 -> phải được format thành 15/10/----
        self.assertEqual(data["ngay_sinh"], "15/10/----")
        self.assertIsNone(data["birthday"])  # không được lộ ngày sinh đầy đủ qua trường birthday
        self.assertTrue(data["is_birthday_masked"])
        self.assertFalse(data["has_sensitive_permission"])
        self.assertEqual(data["nhom_quyen"], [])

    def test_birthday_full_for_user_with_sensitive_perm(self):
        """User có quyền view_full_cbnv: xem được ngày sinh đầy đủ YYYY-MM-DD và nhóm quyền."""
        self.client.force_authenticate(user=self.sensitive_user)
        # Gán nhóm quyền cho normal_profile
        self.normal_user.groups.add(self.group_van_thu)

        detail_url = f"{self.employee_list_url}{self.normal_user.id}/"
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        # Ngày sinh gốc 1995-05-20 -> trả về đúng 1995-05-20
        self.assertEqual(data["ngay_sinh"], "1995-05-20")
        self.assertFalse(data["is_birthday_masked"])
        self.assertTrue(data["has_sensitive_permission"])
        self.assertEqual(len(data["nhom_quyen"]), 1)
        self.assertEqual(data["nhom_quyen"][0]["name"], "Văn thư")

    def test_superuser_has_sensitive_perm_by_default(self):
        """Superuser luôn có toàn quyền xem ngày sinh đầy đủ."""
        self.client.force_authenticate(user=self.admin_user)
        detail_url = f"{self.employee_list_url}{self.normal_user.id}/"
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["ngay_sinh"], "1995-05-20")
        self.assertFalse(data["is_birthday_masked"])

    def test_status_nghi_viec_deactivates_user(self):
        """Khi cập nhật trạng thái 'nghi_viec', user.is_active tự động chuyển thành False."""
        self.client.force_authenticate(user=self.admin_user)
        detail_url = f"{self.employee_list_url}{self.normal_user.id}/"
        res = self.client.patch(detail_url, {"trang_thai": "nghi_viec"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.normal_user.refresh_from_db()
        self.assertFalse(self.normal_user.is_active)

        # Chuyển lại 'dang_lam_viec' -> user.is_active trở lại True
        res_reactivate = self.client.patch(detail_url, {"trang_thai": "dang_lam_viec"}, format="json")
        self.assertEqual(res_reactivate.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertTrue(self.normal_user.is_active)


class GroupAPITests(EmployeeBaseTestCase):
    """Kiểm tra API Nhóm quyền (Chức vụ có bộ test riêng ở test_positions.py)."""

    def test_list_groups(self):
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.get(self.group_list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(len(data) >= 2)


class EmployeeExcelImportExportTests(EmployeeBaseTestCase):
    """Kiểm tra tải tệp mẫu và nhập dữ liệu từ Excel."""

    def test_download_excel_template(self):
        """Tải tệp mẫu Excel trả về mã 200 và header tệp đính kèm .xlsx."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get(self.template_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertIn("mau_danh_sach_cbnv.xlsx", res["Content-Disposition"])

    def test_import_excel_permission_denied_for_normal_user(self):
        """User thường không có quyền import_cbnv bị từ chối với mã 403."""
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.post(self.import_url, {}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_import_excel_missing_file(self):
        """Gửi request import không có tệp đính kèm trả về mã 400."""
        self.client.force_authenticate(user=self.sensitive_user)
        res = self.client.post(self.import_url, {}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_import_excel_with_validation_errors(self):
        """Nhập Excel có lỗi định dạng: báo lỗi chi tiết theo từng dòng."""
        self.client.force_authenticate(user=self.sensitive_user)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Danh Sach CBNV"
        ws.append(["STT", "Họ và tên (*)", "Ngày sinh (*)", "Email (*)", "Số điện thoại", "Tên Đơn vị / Phòng ban (*)", "Tên Chức vụ (*)", "Chức danh tự do", "Trạng thái", "Ghi chú"])
        ws.append(["(Ghi chú)", "", "", "", "", "", "", "", "", ""])

        # Dòng 3: Thiếu email, sđt sai, ngày sinh sai định dạng
        ws.append([1, "Lê Lỗi Dữ Liệu", "sai_ngay_sinh", "", "12345", "Đơn vị không tồn tại", "Chức vụ ảo", "", "Đang làm việc", ""])

        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        bio.name = "danh_sach_loi.xlsx"

        res = self.client.post(self.import_url, {"file": bio}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        data = res.json()
        self.assertFalse(data["success"])
        self.assertTrue(len(data["errors"]) > 0)
        self.assertEqual(data["errors"][0]["row"], 3)

    def test_import_excel_success(self):
        """Nhập Excel hợp lệ: tạo nhân viên và user thành công trong DB."""
        self.client.force_authenticate(user=self.sensitive_user)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Danh Sach CBNV"
        ws.append(["STT", "Họ và tên (*)", "Ngày sinh (*)", "Email (*)", "Số điện thoại", "Tên Đơn vị / Phòng ban (*)", "Tên Chức vụ (*)", "Chức danh tự do", "Trạng thái", "Ghi chú"])
        ws.append(["(Ghi chú)", "", "", "", "", "", "", "", "", ""])

        # Dòng 3: Dữ liệu hợp lệ
        ws.append([1, "Đoàn Văn Hậu", "1999-04-19", "doanvanhau@donvi.gov.vn", "0912345679", "Văn phòng Viện", "Chuyên viên", "Chuyên viên đối ngoại", "Đang làm việc", "Ghi chú mẫu"])

        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        bio.name = "danh_sach_hop_le.xlsx"

        res = self.client.post(self.import_url, {"file": bio}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["created_count"], 1)

        # Kiểm tra bản ghi trong DB
        self.assertTrue(User.objects.filter(email="doanvanhau@donvi.gov.vn").exists())
        self.assertTrue(User.objects.filter(ho_ten="Đoàn Văn Hậu", don_vi=self.don_vi_1).exists())


class SeedDbCommandTests(APITestCase):
    """Lệnh seed_db: đủ 82 đơn vị (tên không duy nhất: "Lãnh đạo khối" có ở 2 khối) và chạy lặp không tạo trùng."""

    def test_seed_db_is_complete_and_idempotent(self):
        import os
        from io import StringIO
        from unittest import mock

        from django.core.management import call_command

        with mock.patch.dict(os.environ, {"DEMO_PASSWORD": "mat-khau-kiem-thu"}):
            call_command("seed_db", verbosity=0, stdout=StringIO())
        self.assertEqual(KhoiKhuVuc.objects.count(), 16)
        self.assertEqual(DonVi.objects.count(), 82)
        self.assertEqual(DonVi.objects.filter(ten="Lãnh đạo khối").count(), 2)
        self.assertTrue(User.objects.filter(username="admin", is_superuser=True).exists())

        with mock.patch.dict(os.environ, {"DEMO_PASSWORD": ""}):
            call_command("seed_db", verbosity=0, stdout=StringIO())
        self.assertEqual(DonVi.objects.count(), 82)
        self.assertEqual(Position.objects.count(), 7)
