"""Cấu hình riêng cho CI kiểm tra tích hợp cơ sở dữ liệu trên PostgreSQL.

Kế thừa settings.py, chỉ thay DATABASES bằng PostgreSQL đọc từ biến môi trường.
Không dùng cho môi trường chạy thật.
"""
import os

from .settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "tlbm_ci"),
        "USER": os.environ.get("POSTGRES_USER", "postgres"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres"),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}
