import importlib

from django.apps import apps as global_apps
from django.db import connection
from django.test import TestCase

from accounts.models import Employee
from records.models import HoSo

reference_data = importlib.import_module("records.migrations.0003_reference_data_ddl")


class CommonHoSoMigrationTests(TestCase):
    """Migration dữ liệu nền Hồ sơ chung: lấy người lập từ tài khoản `admin`, idempotent, không tạo tài khoản."""

    def run_seed(self):
        with connection.schema_editor() as editor:
            reference_data.seed(global_apps, editor)

    def test_no_admin_creates_nothing(self):
        self.run_seed()
        self.assertEqual(HoSo.objects.count(), 0)
        self.assertFalse(Employee.objects.filter(username="admin").exists())

    def test_creates_common_hoso_once_for_admin(self):
        admin = Employee.objects.create_user(username="admin", email="admin@example.test", password="mat-khau-thu",
                                             ho_ten="Quản trị", ngay_sinh="1990-01-01")
        self.run_seed()
        self.run_seed()
        hoso = HoSo.objects.get()
        self.assertEqual((hoso.so_ky_hieu, hoso.is_he_thong, hoso.nguoi_lap_id), ("HSC", True, admin.pk))

    def test_marks_existing_hsc_as_system_record(self):
        admin = Employee.objects.create_user(username="admin", email="admin@example.test", password="mat-khau-thu",
                                             ho_ten="Quản trị", ngay_sinh="1990-01-01")
        existing = HoSo.objects.create(stt_uu_tien=1, so_ky_hieu="HSC", ten_ho_so="Hồ sơ có sẵn", nguoi_lap=admin)
        self.run_seed()
        existing.refresh_from_db()
        self.assertTrue(existing.is_he_thong)
        self.assertEqual(existing.ten_ho_so, "Hồ sơ có sẵn")
        self.assertEqual(HoSo.objects.count(), 1)
