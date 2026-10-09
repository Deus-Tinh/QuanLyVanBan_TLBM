"""
Bộ kiểm thử toàn diện cho phân hệ Quản lý Cán bộ Nhân viên (CBNV - Issue #24).
Tác giả: Lê Duy Khánh (leduykhanhdevs).
Bao gồm:
1. CRUD nhân viên (tạo, đọc, sửa, xóa, tìm kiếm, lọc, sắp xếp theo STT Đơn vị -> Chức vụ).
2. Kiểm tra tính bảo mật & quyền riêng tư (che năm sinh DD/MM/---- và ẩn nhóm quyền nếu thiếu quyền view_full_cbnv).
3. Kiểm tra logic nghiệp vụ: trạng thái 'NGHI_VIEC' tự động vô hiệu hóa user.is_active = False.
4. Kiểm tra danh mục Chức vụ (Position) và Nhóm quyền (Group).
5. Kiểm tra Tải tệp mẫu Excel và Nhập Excel validate từng dòng dữ liệu.
"""
from io import BytesIO
from datetime import date, timedelta
from unittest.mock import patch
import openpyxl
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.db.models import ProtectedError, RestrictedError
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
        self.perm_view_list = Permission.objects.get(codename="view_list_cbnv")
        self.perm_sensitive = Permission.objects.get(codename="view_full_cbnv")
        self.perm_import = Permission.objects.get(codename="import_cbnv")
        self.perm_add = Permission.objects.get(codename="add_cbnv")
        self.perm_change_full = Permission.objects.get(codename="change_full_cbnv")
        self.perm_change_self = Permission.objects.get(codename="change_self_cbnv")
        self.perm_delete = Permission.objects.get(codename="delete_cbnv")

        self.normal_user.user_permissions.add(self.perm_view_list)
        self.sensitive_user.user_permissions.add(self.perm_view_list, self.perm_sensitive, self.perm_import)

        # User không có quyền nào (để test 403)
        self.no_perm_user = User.objects.create_user(
            username="no_perm_user",
            email="noperm@donvi.gov.vn",
            password="NoPermPassword123",
            ho_ten="Người dùng không quyền",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
        )

        # User chỉ có quyền thay đổi thông tin bản thân (change_self_cbnv)
        self.self_user = User.objects.create_user(
            username="self_user",
            email="self@donvi.gov.vn",
            password="SelfPassword123",
            ho_ten="Người dùng sửa bản thân",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
            sdt="0911223344",
        )
        self.self_user.user_permissions.add(self.perm_view_list, self.perm_change_self)

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
            "trang_thai": "LAM_VIEC",
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
        """API nhận và trả đúng giá trị ENUM employee_work_status của DDL."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(f"{self.employee_list_url}{self.normal_user.id}/", {"trang_thai": "NGHI_VIEC"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["trang_thai"], "NGHI_VIEC")
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.trang_thai, "NGHI_VIEC")

    def test_filter_by_status_uses_ddl_value(self):
        self.client.force_authenticate(user=self.admin_user)
        self.normal_user.trang_thai = Employee.Status.NGHI_VIEC
        self.normal_user.save()
        res = self.client.get(f"{self.employee_list_url}?trang_thai=NGHI_VIEC")
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

    def test_owner_sees_unmasked_birthday(self):
        """Chủ tài khoản (dù không có quyền view_full_cbnv) luôn xem được ngày sinh đầy đủ của chính mình."""
        self.client.force_authenticate(user=self.normal_user)
        own_url = f"{self.employee_list_url}{self.normal_user.id}/"
        res = self.client.get(own_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["ngay_sinh"], "1995-05-20")
        self.assertFalse(data["is_birthday_masked"])

    def test_status_nghi_viec_deactivates_user(self):
        """Khi cập nhật trạng thái 'NGHI_VIEC', user.is_active tự động chuyển thành False."""
        self.client.force_authenticate(user=self.admin_user)
        detail_url = f"{self.employee_list_url}{self.normal_user.id}/"
        res = self.client.patch(detail_url, {"trang_thai": "NGHI_VIEC"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.normal_user.refresh_from_db()
        self.assertFalse(self.normal_user.is_active)

        # Chuyển lại 'LAM_VIEC' -> user.is_active trở lại True
        res_reactivate = self.client.patch(detail_url, {"trang_thai": "LAM_VIEC"}, format="json")
        self.assertEqual(res_reactivate.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertTrue(self.normal_user.is_active)


class GroupAPITests(EmployeeBaseTestCase):
    """Kiểm tra API Nhóm quyền (Chức vụ có bộ test riêng ở test_positions.py)."""

    def test_list_groups_forbidden_without_permission(self):
        """User thường không có quyền add_cbnv / change_full_cbnv / view_nhomquyen bị chặn 403."""
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.get(self.group_list_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data["detail"], "roles.messages.permissionDenied")

    def test_list_groups_success_with_permission(self):
        """Superuser hoặc User có quyền thêm CBNV (add_cbnv) được xem danh sách nhóm quyền (200)."""
        self.client.force_authenticate(user=self.admin_user)
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

    def test_import_excel_does_not_create_position_on_error(self):
        """Review PR #71: Không tự ý tạo Chức vụ mới khi import nếu không tồn tại; phải báo lỗi dòng."""
        self.client.force_authenticate(user=self.sensitive_user)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Danh Sach CBNV"
        ws.append(["STT", "Họ và tên (*)", "Ngày sinh (*)", "Email (*)", "Số điện thoại", "Tên Đơn vị / Phòng ban (*)", "Tên Chức vụ (*)", "Chức danh tự do", "Trạng thái", "Ghi chú"])
        ws.append(["(Ghi chú)", "", "", "", "", "", "", "", "", ""])
        ws.append([1, "Lê Không Chức Vụ", "1990-01-01", "nochucvu@donvi.gov.vn", "0911223344", "Văn phòng Viện", "Chức Vụ Không Tồn Tại 999", "", "Đang làm việc", ""])

        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        bio.name = "chuc_vu_la.xlsx"

        res = self.client.post(self.import_url, {"file": bio}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        data = res.json()
        self.assertFalse(data["success"])
        self.assertTrue(any("Không tìm thấy Chức vụ" in err["message"] for err in data["errors"]))
        self.assertFalse(Position.objects.filter(name="Chức Vụ Không Tồn Tại 999").exists())

    def test_import_excel_duplicate_unit_name_fails(self):
        """Review PR #71: Đơn vị trùng tên giữa nhiều Khối/Khu vực phải báo lỗi yêu cầu ghi rõ."""
        self.client.force_authenticate(user=self.sensitive_user)

        # Tạo thêm 1 khối và 1 đơn vị cùng tên "Văn phòng Viện"
        khoi2 = KhoiKhuVuc.objects.create(ten="Khối Cơ quan phía Nam")
        DonVi.objects.create(ten="Văn phòng Viện", khoi=khoi2, stt_uu_tien=99)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Danh Sach CBNV"
        ws.append(["STT", "Họ và tên (*)", "Ngày sinh (*)", "Email (*)", "Số điện thoại", "Tên Đơn vị / Phòng ban (*)", "Tên Chức vụ (*)", "Chức danh tự do", "Trạng thái", "Ghi chú"])
        ws.append(["(Ghi chú)", "", "", "", "", "", "", "", "", ""])
        ws.append([1, "Nguyễn Trùng Đơn Vị", "1990-01-01", "trungdonvi@donvi.gov.vn", "0911223344", "Văn phòng Viện", "Chuyên viên", "", "Đang làm việc", ""])

        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        bio.name = "trung_don_vi.xlsx"

        res = self.client.post(self.import_url, {"file": bio}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        data = res.json()
        self.assertFalse(data["success"])
        self.assertTrue(any("trùng lặp giữa nhiều Khối/Khu vực" in err["message"] for err in data["errors"]))


class EmployeePermissionSecurityTests(EmployeeBaseTestCase):
    """
    Kiểm thử chuyên sâu bảo mật phân quyền RBAC (Issue #24 & Review PR #39).
    Kiểm tra 401 (chưa xác thực) và 403 (thiếu quyền) cho tất cả endpoint CRUD, import và xuất mẫu.
    """

    def test_unauthenticated_requests_return_401(self):
        """Request khi chưa đăng nhập (không có token) phải trả về 401 Unauthorized."""
        self.client.force_authenticate(user=None)

        detail_url = f"{self.employee_list_url}{self.normal_user.id}/"
        payload = {
            "ho_ten": "Test Unauthorized",
            "email": "unauth@donvi.gov.vn",
            "ngay_sinh": "1990-01-01",
            "don_vi_id": self.don_vi_1.id,
            "chuc_vu_id": self.cv_chuyen_vien.id,
        }

        # 1. Read endpoints
        self.assertEqual(self.client.get(self.employee_list_url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.get(self.template_url).status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Write endpoints
        self.assertEqual(self.client.post(self.employee_list_url, payload, format="json").status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.put(detail_url, payload, format="json").status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.patch(detail_url, {"sdt": "0912345678"}, format="json").status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.delete(detail_url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.post(self.import_url, {}, format="multipart").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_permissions_returns_403(self):
        """User đã đăng nhập nhưng không có quyền tương ứng phải bị từ chối với 403 Forbidden."""
        self.client.force_authenticate(user=self.no_perm_user)

        detail_url = f"{self.employee_list_url}{self.normal_user.id}/"
        payload = {
            "ho_ten": "CBNV Không Quyền",
            "email": "failperm@donvi.gov.vn",
            "ngay_sinh": "1990-01-01",
            "don_vi_id": self.don_vi_1.id,
            "chuc_vu_id": self.cv_chuyen_vien.id,
        }

        # Read endpoints
        self.assertEqual(self.client.get(self.employee_list_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(self.template_url).status_code, status.HTTP_403_FORBIDDEN)

        # Write endpoints
        self.assertEqual(self.client.post(self.employee_list_url, payload, format="json").status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(detail_url, {"sdt": "0912345678"}, format="json").status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(detail_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.post(self.import_url, {}, format="multipart").status_code, status.HTTP_403_FORBIDDEN)

    def test_change_self_permission_isolated_to_own_profile(self):
        """User có quyền change_self_cbnv chỉ được sửa chính mình, sửa người khác trả về 403."""
        self.client.force_authenticate(user=self.self_user)

        # 1. Sửa thông tin cá nhân chính mình -> Thành công 200 OK
        own_url = f"{self.employee_list_url}{self.self_user.id}/"
        res_self = self.client.patch(own_url, {"sdt": "0909998877"}, format="json")
        self.assertEqual(res_self.status_code, status.HTTP_200_OK)
        self.self_user.refresh_from_db()
        self.assertEqual(self.self_user.sdt, "0909998877")

        # 2. Cố gắng sửa thông tin CBNV khác -> Bị từ chối 403 Forbidden
        other_url = f"{self.employee_list_url}{self.normal_user.id}/"
        res_other = self.client.patch(other_url, {"sdt": "0901112233"}, format="json")
        self.assertEqual(res_other.status_code, status.HTTP_403_FORBIDDEN)

    def test_change_self_cannot_escalate_privileges_or_modify_admin_fields(self):
        """
        Tài khoản chỉ có change_self_cbnv tuyệt đối không được tự nâng quyền
        hoặc thay đổi chức vụ, đơn vị, trạng thái, chức danh, nhóm quyền của chính mình (403 Forbidden).
        """
        self.client.force_authenticate(user=self.self_user)
        own_url = f"{self.employee_list_url}{self.self_user.id}/"

        # 1. Tự gán nhóm quyền cho mình -> Bị chặn 403
        res_group = self.client.patch(own_url, {"nhom_quyen_ids": [self.group_van_thu.id]}, format="json")
        self.assertEqual(res_group.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_group.data["detail"], "roles.messages.permissionDenied")
        self.self_user.refresh_from_db()
        self.assertEqual(self.self_user.groups.count(), 0)

        # 2. Tự đổi trạng thái làm việc / nghỉ việc -> 403
        res_status = self.client.patch(own_url, {"trang_thai": "NGHI_VIEC"}, format="json")
        self.assertEqual(res_status.status_code, status.HTTP_403_FORBIDDEN)
        self.self_user.refresh_from_db()
        self.assertEqual(self.self_user.trang_thai, Employee.Status.LAM_VIEC)

        # 3. Tự đổi đơn vị phòng ban -> 403
        res_unit = self.client.patch(own_url, {"don_vi_id": self.don_vi_2.id}, format="json")
        self.assertEqual(res_unit.status_code, status.HTTP_403_FORBIDDEN)
        self.self_user.refresh_from_db()
        self.assertEqual(self.self_user.don_vi_id, self.don_vi_1.id)

        # 4. Tự đổi chức vụ -> 403
        res_pos = self.client.patch(own_url, {"chuc_vu_id": self.cv_truong_phong.id}, format="json")
        self.assertEqual(res_pos.status_code, status.HTTP_403_FORBIDDEN)
        self.self_user.refresh_from_db()
        self.assertEqual(self.self_user.chuc_vu_id, self.cv_chuyen_vien.id)

        # 5. Tự đổi chức danh -> 403
        res_title = self.client.patch(own_url, {"chuc_danh": "Trưởng phòng phụ trách"}, format="json")
        self.assertEqual(res_title.status_code, status.HTTP_403_FORBIDDEN)

        # 6. Tự đổi ghi chú hoặc is_public -> 403
        self.assertEqual(self.client.patch(own_url, {"ghi_chu": "Hack ghi chú"}, format="json").status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(own_url, {"is_public": False}, format="json").status_code, status.HTTP_403_FORBIDDEN)

        # 7. Gửi thông tin cá nhân hợp lệ (sdt, email, ngay_sinh) -> 200 OK
        res_ok = self.client.patch(
            own_url,
            {"sdt": "0988112233", "email": "newself@donvi.gov.vn", "ngay_sinh": "1993-03-03"},
            format="json"
        )
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.self_user.refresh_from_db()
        self.assertEqual(self.self_user.sdt, "0988112233")
        self.assertEqual(self.self_user.email, "newself@donvi.gov.vn")
        self.assertEqual(self.self_user.ngay_sinh.strftime("%Y-%m-%d"), "1993-03-03")

    def test_change_full_permission_can_update_any_employee(self):
        """User có quyền change_full_cbnv có thể sửa thông tin của bất kỳ CBNV nào."""
        hr_user = User.objects.create_user(
            username="hr_user",
            email="hr@donvi.gov.vn",
            password="HrPassword123",
            ho_ten="Cán bộ nhân sự",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
        )
        hr_user.user_permissions.add(self.perm_view_list, self.perm_change_full)
        self.client.force_authenticate(user=hr_user)

        target_url = f"{self.employee_list_url}{self.normal_user.id}/"
        res = self.client.patch(target_url, {"sdt": "0988776655"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.sdt, "0988776655")

    def test_add_and_delete_permissions_isolated(self):
        """Kiểm tra quyền add_cbnv và delete_cbnv hoạt động độc lập và chính xác."""
        creator_user = User.objects.create_user(
            username="creator_user",
            email="creator@donvi.gov.vn",
            password="CreatorPassword123",
            ho_ten="Cán bộ thêm mới",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
        )
        creator_user.user_permissions.add(self.perm_add)
        self.client.force_authenticate(user=creator_user)

        # 1. Có quyền add_cbnv -> POST thành công
        payload = {
            "ho_ten": "Nhân viên mới do Creator tạo",
            "email": "newbie@donvi.gov.vn",
            "ngay_sinh": "1994-04-04",
            "don_vi_id": self.don_vi_1.id,
            "chuc_vu_id": self.cv_chuyen_vien.id,
        }
        res_create = self.client.post(self.employee_list_url, payload, format="json")
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        new_emp_id = res_create.json()["id"]

        # 2. Không có quyền delete_cbnv -> DELETE bị từ chối 403
        del_url = f"{self.employee_list_url}{new_emp_id}/"
        res_delete_denied = self.client.delete(del_url)
        self.assertEqual(res_delete_denied.status_code, status.HTTP_403_FORBIDDEN)

        # 3. User có quyền delete_cbnv -> DELETE thành công 204
        deleter_user = User.objects.create_user(
            username="deleter_user",
            email="deleter@donvi.gov.vn",
            password="DeleterPassword123",
            ho_ten="Cán bộ xóa",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
        )
        deleter_user.user_permissions.add(self.perm_delete)
        self.client.force_authenticate(user=deleter_user)
        res_delete_ok = self.client.delete(del_url)
        self.assertEqual(res_delete_ok.status_code, status.HTTP_204_NO_CONTENT)

    def test_superuser_bypasses_all_permission_gates(self):
        """Superuser không cần gán quyền lẻ tẻ, luôn vượt qua tất cả các chốt kiểm tra."""
        self.client.force_authenticate(user=self.admin_user)
        self.assertEqual(self.client.get(self.employee_list_url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(self.template_url).status_code, status.HTTP_200_OK)

    def test_ordering_and_filter_security(self):
        """Review PR #71: Chặn ordering bất hợp pháp, che ordering ngày sinh nếu thiếu quyền, validate filter int, chặn mảng JSON."""
        # 1. User thường (chỉ có view_list_cbnv) ordering field lạ -> 400 Bad Request
        self.client.force_authenticate(user=self.normal_user)
        res_bogus = self.client.get(f"{self.employee_list_url}?ordering=bogus_field")
        self.assertEqual(res_bogus.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_bogus.data["detail"], "employees.messages.invalidOrdering")

        # 2. User thường ordering ngay_sinh mà không có view_full_cbnv -> 400 Bad Request
        res_birth = self.client.get(f"{self.employee_list_url}?ordering=ngay_sinh")
        self.assertEqual(res_birth.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_birth.data["detail"], "employees.messages.invalidOrdering")

        # 3. User có view_full_cbnv ordering ngay_sinh -> 200 OK
        self.client.force_authenticate(user=self.sensitive_user)
        res_birth_ok = self.client.get(f"{self.employee_list_url}?ordering=-ngay_sinh")
        self.assertEqual(res_birth_ok.status_code, status.HTTP_200_OK)

        # 4. Filter id không phải số nguyên -> 400 Bad Request (thay vì 500)
        res_filter_err = self.client.get(f"{self.employee_list_url}?don_vi_id=abc")
        self.assertEqual(res_filter_err.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_filter_err.data["detail"], "employees.messages.invalidFilterParam")

        # 5. Gửi body là mảng JSON thay vì dict -> 400 Bad Request (thay vì 500)
        self.client.force_authenticate(user=self.admin_user)
        res_array = self.client.patch(
            f"{self.employee_list_url}{self.normal_user.id}/",
            [{"ho_ten": "Hacked"}],
            format="json",
        )
        self.assertEqual(res_array.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_array.data["detail"], "employees.messages.invalidDataFormat")

    def test_business_guards_on_delete_and_deactivate(self):
        """Review PR #71: Bảo vệ an toàn hệ thống khi xóa và thôi việc (nghỉ việc)."""
        # 1. Superuser cố gắng tự xóa chính mình -> 400
        self.client.force_authenticate(user=self.admin_user)
        res_self_del = self.client.delete(f"{self.employee_list_url}{self.admin_user.id}/")
        self.assertEqual(res_self_del.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_self_del.data["detail"], "employees.messages.cannotDeleteSelf")

        # 2. Superuser cố gắng tự thôi việc chính mình -> 400
        res_self_deact = self.client.patch(
            f"{self.employee_list_url}{self.admin_user.id}/",
            {"trang_thai": "NGHI_VIEC"},
            format="json",
        )
        self.assertEqual(res_self_deact.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_self_deact.data["detail"], "employees.messages.cannotDeactivateSelf")

        # 3. User có delete_cbnv (nhưng không phải superuser) cố xóa superuser -> 403
        deleter_user = User.objects.create_user(
            username="guard_deleter",
            email="gdeleter@donvi.gov.vn",
            password="DeleterPass123",
            ho_ten="Deleter",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
        )
        deleter_user.user_permissions.add(self.perm_delete)
        self.client.force_authenticate(user=deleter_user)
        res_del_su = self.client.delete(f"{self.employee_list_url}{self.admin_user.id}/")
        self.assertEqual(res_del_su.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_del_su.data["detail"], "employees.messages.cannotDeleteSuperuser")

        # 4. User có change_full_cbnv (nhưng không phải superuser) cố chuyển superuser thành nghỉ việc -> 403
        hr_user = User.objects.create_user(
            username="guard_hr",
            email="ghr@donvi.gov.vn",
            password="HrPassword123",
            ho_ten="HR User",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_chuyen_vien,
        )
        hr_user.user_permissions.add(self.perm_change_full)
        self.client.force_authenticate(user=hr_user)
        res_deact_su = self.client.patch(
            f"{self.employee_list_url}{self.admin_user.id}/",
            {"trang_thai": "NGHI_VIEC"},
            format="json",
        )
        self.assertEqual(res_deact_su.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_deact_su.data["detail"], "employees.messages.cannotDeactivateSuperuser")

        # 5. Superuser thứ 2 thôi việc superuser đầu tiên, nhưng không thể thôi việc superuser cuối cùng
        second_admin = User.objects.create_superuser(
            username="admin_2",
            email="admin2@donvi.gov.vn",
            password="AdminPassword123",
            ho_ten="Quản trị viên 2",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_truong_phong,
        )
        self.client.force_authenticate(user=second_admin)
        res_deact_1 = self.client.patch(
            f"{self.employee_list_url}{self.admin_user.id}/",
            {"trang_thai": "NGHI_VIEC"},
            format="json",
        )
        self.assertEqual(res_deact_1.status_code, status.HTTP_200_OK)

        # Giờ admin_user đã nghỉ việc, chỉ còn second_admin là superuser active.
        # Nếu ai đó cố gắng xóa hoặc thôi việc admin_2 -> 400 cannotDeactivateLastSuperuser
        third_admin = User.objects.create_superuser(
            username="admin_3",
            email="admin3@donvi.gov.vn",
            password="AdminPassword123",
            ho_ten="Quản trị viên 3",
            don_vi=self.don_vi_1,
            chuc_vu=self.cv_truong_phong,
            trang_thai=Employee.Status.NGHI_VIEC,
        )
        self.client.force_authenticate(user=third_admin)
        res_last = self.client.patch(
            f"{self.employee_list_url}{second_admin.id}/",
            {"trang_thai": "NGHI_VIEC"},
            format="json",
        )
        self.assertEqual(res_last.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_last.data["detail"], "employees.messages.cannotDeactivateLastSuperuser")

    def test_manual_create_rejects_weak_password(self):
        """Review PR #71: Tạo tài khoản thủ công với mật khẩu yếu phải bị từ chối 400 qua validate_password."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "ho_ten": "Tài Khoản Mật Khẩu Yếu",
            "email": "weakpass@donvi.gov.vn",
            "ngay_sinh": "1990-01-01",
            "don_vi_id": self.don_vi_1.id,
            "chuc_vu_id": self.cv_chuyen_vien.id,
            "password": "123",
        }
        res = self.client.post(self.employee_list_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", res.json())


class ReviewRound4FixesTests(EmployeeBaseTestCase):
    """
    Bộ kiểm thử cho các phản hồi Review Vòng 4 từ Trưởng nhóm:
    1. Xóa CBNV có quan hệ RESTRICT / PROTECT không gây lỗi 500, trả về 400 + i18n key rõ ràng.
    2. Ngày sinh không thể ở tương lai hoặc ngoài khoảng độ tuổi [18, 100].
    3. Filter ?trang_thai=bogus trả về 400 invalidFilterParam, không gây DataError trên PostgreSQL ENUM.
    4. PATCH is_active hỗ trợ chuỗi 'false'/'true' và đồng bộ với trang_thai, áp dụng đầy đủ guards.
    5. Các lỗi serializer DRF trả chuẩn i18n keys thay vì tiếng Anh mặc định.
    6. Import Excel validate ngày sinh tương lai và độ tuổi.
    """

    @patch.object(Employee, "delete")
    def test_delete_employee_with_restricted_relation_fails_gracefully(self, mock_delete):
        """Review Vòng 4: Xóa CBNV có dữ liệu ràng buộc RESTRICT trả về 400 và thông báo thân thiện."""
        mock_delete.side_effect = RestrictedError("Cannot delete restricted relation", [])
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.delete(f"{self.employee_list_url}{self.normal_user.id}/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "employees.messages.cannotDeleteProtected")

    @patch.object(Employee, "delete")
    def test_delete_employee_with_protected_relation_fails_gracefully(self, mock_delete):
        """Review Vòng 4: Xóa CBNV có dữ liệu ràng buộc PROTECT trả về 400 và thông báo thân thiện."""
        mock_delete.side_effect = ProtectedError("Cannot delete protected relation", [])
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.delete(f"{self.employee_list_url}{self.normal_user.id}/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "employees.messages.cannotDeleteProtected")

    def test_birthday_validation_future_and_age_range(self):
        """Review Vòng 4: Không cho phép ngày sinh tương lai hoặc độ tuổi ngoài khoảng [18, 100]."""
        self.client.force_authenticate(user=self.admin_user)
        today = date.today()

        # 1. Ngày mai -> 400 birthdayInFuture
        tomorrow = today + timedelta(days=1)
        res_fut = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "Người Tương Lai",
                "email": "future@donvi.gov.vn",
                "ngay_sinh": tomorrow.isoformat(),
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": self.cv_chuyen_vien.id,
            },
            format="json",
        )
        self.assertEqual(res_fut.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("employees.messages.birthdayInFuture", str(res_fut.json()))

        # 2. Dưới 18 tuổi (ví dụ: 17 tuổi) -> 400 birthdayOutOfRange
        under_18 = date(today.year - 17, today.month, today.day)
        res_u18 = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "Người Chưa Đủ 18",
                "email": "under18@donvi.gov.vn",
                "ngay_sinh": under_18.isoformat(),
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": self.cv_chuyen_vien.id,
            },
            format="json",
        )
        self.assertEqual(res_u18.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("employees.messages.birthdayOutOfRange", str(res_u18.json()))

        # 3. Trên 100 tuổi (ví dụ: 101 tuổi) -> 400 birthdayOutOfRange
        over_100 = date(today.year - 101, today.month, today.day)
        res_o100 = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "Cụ Thượng Thọ",
                "email": "over100@donvi.gov.vn",
                "ngay_sinh": over_100.isoformat(),
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": self.cv_chuyen_vien.id,
            },
            format="json",
        )
        self.assertEqual(res_o100.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("employees.messages.birthdayOutOfRange", str(res_o100.json()))

        # 4. Độ tuổi hợp lệ (ví dụ: 25 tuổi) -> 201 Created
        valid_bday = date(today.year - 25, today.month, today.day)
        res_ok = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "Người Hợp Lệ Tuổi",
                "email": "validage@donvi.gov.vn",
                "ngay_sinh": valid_bday.isoformat(),
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": self.cv_chuyen_vien.id,
            },
            format="json",
        )
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

    def test_invalid_trang_thai_filter_param_returns_400(self):
        """Review Vòng 4: Filter ?trang_thai=bogus phải trả về 400 chứ không gây 500 DataError trên PostgreSQL."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get(f"{self.employee_list_url}?trang_thai=bogus")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.json()["detail"], "employees.messages.invalidFilterParam")

    def test_patch_is_active_string_boolean_and_guards(self):
        """Review Vòng 4: PATCH is_active dạng string 'false'/'true' phải được ghi nhận và đồng bộ trạng thái."""
        self.client.force_authenticate(user=self.admin_user)

        # 1. Khóa tài khoản qua is_active="false" (chuỗi)
        res_deact = self.client.patch(
            f"{self.employee_list_url}{self.normal_user.id}/",
            {"is_active": "false"},
            format="json",
        )
        self.assertEqual(res_deact.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertFalse(self.normal_user.is_active)
        self.assertEqual(self.normal_user.trang_thai, Employee.Status.NGHI_VIEC)

        # 2. Mở khóa tài khoản qua is_active="true" (chuỗi)
        res_react = self.client.patch(
            f"{self.employee_list_url}{self.normal_user.id}/",
            {"is_active": "true"},
            format="json",
        )
        self.assertEqual(res_react.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertTrue(self.normal_user.is_active)
        self.assertEqual(self.normal_user.trang_thai, Employee.Status.LAM_VIEC)

        # 3. Bảo vệ: Không cho phép tự khóa tài khoản của chính mình bằng is_active="false"
        res_self = self.client.patch(
            f"{self.employee_list_url}{self.admin_user.id}/",
            {"is_active": "false"},
            format="json",
        )
        self.assertEqual(res_self.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_self.data["detail"], "employees.messages.cannotDeactivateSelf")

    def test_drf_serializer_error_messages_i18n(self):
        """Review Vòng 4: Toàn bộ lỗi validation từ DRF serializer phải trả mã i18n chuẩn."""
        self.client.force_authenticate(user=self.admin_user)

        # 1. Họ tên quá 150 ký tự
        res_name = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "A" * 151,
                "email": "nametoolong@donvi.gov.vn",
                "ngay_sinh": "1990-01-01",
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": self.cv_chuyen_vien.id,
            },
            format="json",
        )
        self.assertEqual(res_name.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_name.json()["ho_ten"], ["employees.messages.nameTooLong"])

        # 2. Email sai định dạng
        res_email = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "Email Sai",
                "email": "invalid-email-format",
                "ngay_sinh": "1990-01-01",
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": self.cv_chuyen_vien.id,
            },
            format="json",
        )
        self.assertEqual(res_email.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_email.json()["email"], ["employees.messages.invalidEmail"])

        # 3. Đơn vị không tồn tại
        res_donvi = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "Đơn Vị Ảo",
                "email": "donviao@donvi.gov.vn",
                "ngay_sinh": "1990-01-01",
                "don_vi_id": 999999,
                "chuc_vu_id": self.cv_chuyen_vien.id,
            },
            format="json",
        )
        self.assertEqual(res_donvi.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_donvi.json()["don_vi_id"], ["employees.messages.unitNotFound"])

        # 4. Chức vụ không tồn tại
        res_chucvu = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "Chức Vụ Ảo",
                "email": "chucvuao@donvi.gov.vn",
                "ngay_sinh": "1990-01-01",
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": 999999,
            },
            format="json",
        )
        self.assertEqual(res_chucvu.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_chucvu.json()["chuc_vu_id"], ["employees.messages.positionNotFound"])

        # 5. SĐT sai chuẩn VN (qua regex validator ở model)
        res_sdt = self.client.post(
            self.employee_list_url,
            {
                "ho_ten": "SĐT Sai",
                "email": "sdtsai@donvi.gov.vn",
                "ngay_sinh": "1990-01-01",
                "don_vi_id": self.don_vi_1.id,
                "chuc_vu_id": self.cv_chuyen_vien.id,
                "sdt": "09999",
            },
            format="json",
        )
        self.assertEqual(res_sdt.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_sdt.json()["sdt"], ["employees.messages.invalidPhone"])

    def test_excel_import_birthday_validations(self):
        """Review Vòng 4: Import Excel kiểm tra ngày sinh tương lai và khoảng tuổi [18, 100]."""
        self.client.force_authenticate(user=self.sensitive_user)
        today = date.today()
        fut_date = (today + timedelta(days=5)).isoformat()
        u18_date = date(today.year - 16, today.month, today.day).isoformat()

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Họ và tên", "Ngày sinh", "Email", "Số điện thoại", "Đơn vị", "Chức vụ", "Chức danh", "Trạng thái", "Ghi chú"])
        ws.append(["Tương Lai", fut_date, "fut@donvi.gov.vn", "0912345678", self.don_vi_1.ten, self.cv_truong_phong.name, "", "Đang làm việc", ""])
        ws.append(["Dưới 18", u18_date, "u18@donvi.gov.vn", "0912345679", self.don_vi_1.ten, self.cv_truong_phong.name, "", "Đang làm việc", ""])

        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        bio.name = "test_birthdays.xlsx"

        res = self.client.post(self.import_url, {"file": bio}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        errors = res.json()["errors"]
        codes = [err["code"] for err in errors]
        self.assertIn("employees.messages.birthdayInFuture", codes)
        self.assertIn("employees.messages.birthdayOutOfRange", codes)


class SeedDbCommandTests(APITestCase):
    """Lệnh seed_db: đủ 82 đơn vị (tên không duy nhất: "Lãnh đạo khối" có ở 2 khối) và chạy lặp không tạo trùng."""

    def test_seed_db_is_complete_and_idempotent(self):
        from django.core.management import call_command

        call_command("seed_db", verbosity=0)
        self.assertEqual(KhoiKhuVuc.objects.count(), 16)
        self.assertEqual(DonVi.objects.count(), 82)
        self.assertEqual(DonVi.objects.filter(ten="Lãnh đạo khối").count(), 2)
        self.assertTrue(User.objects.filter(username="admin", is_superuser=True).exists())

        call_command("seed_db", verbosity=0)
        self.assertEqual(DonVi.objects.count(), 82)
        self.assertEqual(Position.objects.count(), 7)
