"""
URL configuration for QLVB&TL project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # ── Module Nhóm 1 — Hiếu ──────────────────────────────────────────────
    # API Xác thực & Tài khoản: POST /api/auth/login/, GET /api/auth/profile/, ...
    path("api/auth/", include("accounts.urls", namespace="accounts")),

    # API Tổng quan Dashboard: GET /api/dashboard/overview/
    path("api/dashboard/", include("dashboard.urls", namespace="dashboard")),

    # ── Module Nhóm 2 — Văn bản ───────────────────────────────────────────
    path("api/", include("documents.urls")),
]

# Serve media files trong development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
