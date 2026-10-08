"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # ── Module Nhóm 1 — Hiếu ──────────────────────────────────────────────
    # API Xác thực & Tài khoản: POST /api/auth/login/, GET /api/auth/profile/, ...
    path("api/auth/", include("accounts.urls", namespace="accounts")),

    # API Tổng quan Dashboard: GET /api/dashboard/overview/
    path("api/dashboard/", include("dashboard.urls", namespace="dashboard")),

    # ── Module Nhóm 4 — Tài liệu & Biểu mẫu (Nguyễn Chí Tín) ───────────────
    path("api/resources/", include("document_templates.urls")),

    # ── Module Nhóm 7 — Quang ─────────────────────────────────────────────
    # API Quản lý Khối & Đơn vị: /api/organizations/...
    path("api/organizations/", include("organizations.urls", namespace="organizations")),

    # ── Module Nhóm 7 — Khánh (Issue #24) ──────────────────────────────────
    # API Quản lý Cán bộ Nhân viên (CBNV): /api/accounts/...
    path("api/accounts/", include("accounts.employee_urls", namespace="employee_management")),
    # Danh mục Chức vụ (Issue #20)
    path("api/positions/", include("accounts.position_urls", namespace="positions")),

    # ── Module Nhóm 7 — Tân + Hiếu (Issue #21) ─────────────────────────────
    # API Phân quyền (Issue #21): /api/roles/, /api/permissions/, /api/auth/me/permissions/
    path("api/", include("authorization.urls", namespace="authorization")),

    # ── Module Nhóm 7 — Tình (Issue #23) ──────────────────────────────────
    # API Sinh nhật: GET /api/birthdays/calendar/, /api/birthdays/day/, ...
    path("api/birthdays/", include("birthdays.urls", namespace="birthdays")),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

