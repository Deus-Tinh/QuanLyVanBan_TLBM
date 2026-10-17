"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include

from accounts.views import staffs_view

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # ── Module Nhóm 1 — Hiếu ──────────────────────────────────────────────
    # API Cán bộ / Nhân viên (phục vụ liên nhóm)
    path("api/accounts/staffs/", staffs_view, name="accounts_staffs"),
    # API Xác thực & Tài khoản: POST /api/auth/login/, GET /api/auth/profile/, ...
    path("api/auth/", include("accounts.urls", namespace="accounts")),

    # API Tổng quan Dashboard: GET /api/dashboard/overview/
    path("api/dashboard/", include("dashboard.urls", namespace="dashboard")),

    # ── Module Nhóm 7 — Quản trị hệ thống & Nhân sự ───────────────────────
    path("api/organizations/", include("organizations.urls", namespace="organizations")),
    path("api/accounts/", include("accounts.employee_urls", namespace="employee_management")),
    path("api/positions/", include("accounts.position_urls", namespace="positions")),
    path("api/", include("authorization.urls", namespace="authorization")),
]

