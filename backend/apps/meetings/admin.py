"""
Django Admin cho app meetings (Issue #22 - Nhóm 7).
"""

from django.contrib import admin
from meetings.models import PhongHop


@admin.register(PhongHop)
class PhongHopAdmin(admin.ModelAdmin):
    list_display = ("ten_phong", "vi_tri", "suc_chua", "is_public", "created_at", "updated_at")
    list_filter = ("is_public", "created_at")
    search_fields = ("ten_phong", "vi_tri", "thiet_bi", "ghi_chu")
    ordering = ("ten_phong",)
