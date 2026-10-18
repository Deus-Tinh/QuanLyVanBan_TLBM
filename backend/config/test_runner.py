from django.apps import apps
from django.db import connections
from django.db.models.signals import post_migrate
from django.test.runner import DiscoverRunner

# Dữ liệu nền do migration tạo (khối, đơn vị, chức vụ, tài khoản hệ thống). Bộ test dựng dữ liệu riêng
# từ bảng trống nên DB test được làm rỗng các bảng này ngay sau migrate, trước khi nhân bản cho --parallel.
SEEDED_TABLES = (
    "accounts_employee",
    "accounts_position",
    "organizations_donvi",
    "organizations_khoi",
)


def _clear_seeded_reference_data(using, **kwargs):
    with connections[using].cursor() as cursor:
        cursor.execute(f"TRUNCATE {', '.join(SEEDED_TABLES)} RESTART IDENTITY CASCADE")


class SeedFreeDiscoverRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        sender = apps.get_app_config("accounts")
        post_migrate.connect(_clear_seeded_reference_data, sender=sender, dispatch_uid="test-clear-seed")
        try:
            return super().setup_databases(**kwargs)
        finally:
            post_migrate.disconnect(dispatch_uid="test-clear-seed")
