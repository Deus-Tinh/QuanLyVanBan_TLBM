"""
Cấu hình kiểm thử độc lập cho PostgreSQL (Issue #23 - Task 6.2).
Không chỉnh sửa hoặc ảnh hưởng đến production settings.py (vẫn dùng SQLite).
"""
import os
from .settings import *  # noqa: F401, F403

# Bảo đảm mock email backend trong quá trình test, không bao giờ gửi email thật
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Cấu hình PostgreSQL test độc lập lấy từ biến môi trường
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("TEST_DB_NAME", "qlvb_test_db"),
        "USER": os.getenv("TEST_DB_USER", "postgres"),
        "PASSWORD": os.getenv("TEST_DB_PASSWORD", ""),
        "HOST": os.getenv("TEST_DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("TEST_DB_PORT", "5433"),
        "TEST": {
            "NAME": "test_qlvb_concurrency_db",
        },
    }
}

import logging
from django.db import connections
from django.test.runner import DiscoverRunner

logger = logging.getLogger(__name__)


class PostgresIsolatedTestRunner(DiscoverRunner):
    """
    Custom test runner cho PostgreSQL test (Issue #23).
    Dọn dẹp bảng mồ côi `birthdays_birthdaywish` CHỈ TRONG DATABASE TEST CÔ LẬP
    sau khi migrations hoàn thành, trước khi chạy tests.

    Nguyên nhân: Migration 0004 xóa BirthdayWish khỏi state nhưng giữ bảng vật lý
    bằng SeparateDatabaseAndState. Django flush chỉ truncate các model có trong state,
    khiến PostgreSQL từ chối TRUNCATE accounts_staffprofile do khóa ngoại từ birthdays_birthdaywish.
    """

    def setup_databases(self, **kwargs):
        config = super().setup_databases(**kwargs)
        self._cleanup_isolated_test_birthdaywish_table()
        return config

    def _cleanup_isolated_test_birthdaywish_table(self):
        dev_db_name = os.getenv("TEST_DB_NAME", "qlvb_test_db")

        for alias in connections:
            conn = connections[alias]
            if conn.vendor != "postgresql":
                continue

            db_name = conn.settings_dict.get("NAME", "")

            # Bắt buộc xác minh an toàn môi trường test:
            # 1. Tên database phải bắt đầu bằng 'test_'
            # 2. Không được trùng với database dev/staging/production
            is_safe_test_db = (
                db_name.startswith("test_")
                and db_name != dev_db_name
                and db_name not in ("postgres", "qlvb_test_db", "qlvb_prod", "qlvb_staging")
            )

            if not is_safe_test_db:
                raise RuntimeError(
                    f"[AN TOAN] Tu choi thao tac: Ten database '{db_name}' tren alias '{alias}' "
                    f"khong phai database test co lap hop le!"
                )

            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'birthdays_birthdaywish'
                    );
                    """
                )
                table_exists = cursor.fetchone()[0]

                if table_exists:
                    # Xóa bảng mồ côi birthdays_birthdaywish KHÔNG DÙNG CASCADE
                    # Bảng này không có bảng nào khác trỏ khóa ngoại tới nó, chỉ trỏ tới accounts_staffprofile.
                    # Khi xóa, khóa ngoại đến accounts_staffprofile được giải phóng, cho phép flush / truncate thành công.
                    cursor.execute("DROP TABLE birthdays_birthdaywish;")
                    print(
                        f"\n[PostgresIsolatedTestRunner] Da don dep an toan bang birthdays_birthdaywish "
                        f"trong database test co lap '{db_name}' (khong dung CASCADE)."
                    )


TEST_RUNNER = "config.settings_test_pg.PostgresIsolatedTestRunner"

