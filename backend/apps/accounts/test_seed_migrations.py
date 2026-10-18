import importlib

from django.apps import apps as global_apps
from django.db import connection
from django.test import TestCase

from accounts.models import Employee, Position
from organizations.models import DonVi, KhoiKhuVuc

organizations_seed = importlib.import_module("organizations.migrations.0005_reference_data_ddl")
accounts_seed = importlib.import_module("accounts.migrations.0006_reference_data_ddl")


class SeedReferenceDataMigrationTests(TestCase):
    """Migration dữ liệu nền: đúng nội dung release_DDL.sql, idempotent, không ghi đè dữ liệu sẵn có."""

    def run_seeds(self):
        with connection.schema_editor() as editor:
            organizations_seed.seed(global_apps, editor)
            accounts_seed.seed(global_apps, editor)

    def test_seed_creates_reference_data_once(self):
        self.assertEqual(KhoiKhuVuc.objects.count(), 0)
        self.run_seeds()
        self.assertEqual(KhoiKhuVuc.objects.count(), 16)
        self.assertEqual(DonVi.objects.count(), 82)
        self.assertEqual(list(Position.objects.values_list("name", flat=True)), ["Quản trị viên"])
        admin = Employee.objects.get(username="admin")
        self.assertEqual(admin.password, "pbkdf2_sha256$system_seed_placeholder")
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.don_vi.ten, "Ban công nghệ thông tin")

        self.run_seeds()
        self.assertEqual(KhoiKhuVuc.objects.count(), 16)
        self.assertEqual(DonVi.objects.count(), 82)
        self.assertEqual(Employee.objects.filter(username="admin").count(), 1)

    def test_seed_keeps_existing_account_and_hierarchy(self):
        khoi = KhoiKhuVuc.objects.create(ten="KHỐI TỰ TẠO", thu_tu_hien_thi=1)
        position = Position.objects.create(name="Quản trị viên", display_order=9, is_public=True)
        donvi = DonVi.objects.create(khoi=khoi, ten="Đơn vị tự tạo", stt_uu_tien=1, is_public=True)
        admin = Employee(username="admin", email="admin@example.test", ho_ten="Tài khoản có sẵn",
                         ngay_sinh="1991-02-03", chuc_vu=position, don_vi=donvi)
        admin.set_password("mat-khau-hien-co")
        admin.save()

        self.run_seeds()

        self.assertEqual(KhoiKhuVuc.objects.count(), 1)
        self.assertEqual(DonVi.objects.count(), 1)
        self.assertEqual(Position.objects.count(), 1)
        admin.refresh_from_db()
        self.assertEqual(admin.ho_ten, "Tài khoản có sẵn")
        self.assertTrue(admin.check_password("mat-khau-hien-co"))
