"""Django Admin cho Module Văn Bản — Kiến trúc 3 Model."""

from django.contrib import admin

from .models import (
    VanBanDen,
    VanBanDenAttachment,
    VanBanDi,
    VanBanDiAttachment,
    VanBanMat,
    VanBanMatAttachment,
    DocumentViewLog,
)


# ═══════════════════════════════════════════════════════════════════
# 1. Văn bản Đến Admin
# ═══════════════════════════════════════════════════════════════════

class VanBanDenAttachmentInline(admin.TabularInline):
    model = VanBanDenAttachment
    extra = 0
    readonly_fields = ["created_time"]


@admin.register(VanBanDen)
class VanBanDenAdmin(admin.ModelAdmin):
    list_display = [
        "so_hieu",
        "nam",
        "so_thu_tu",
        "ngay_den",
        "trich_yeu_short",
        "noi_ban_hanh",
        "hieu_luc",
        "hien_thi",
        "created_at",
    ]
    list_filter = ["nam", "hieu_luc", "hien_thi"]
    search_fields = ["so_hieu", "trich_yeu", "noi_ban_hanh"]
    readonly_fields = ["so_thu_tu", "created_at", "updated_at"]
    inlines = [VanBanDenAttachmentInline]
    list_per_page = 20

    @admin.display(description="Trích yếu")
    def trich_yeu_short(self, obj):
        if len(obj.trich_yeu) > 80:
            return obj.trich_yeu[:80] + "..."
        return obj.trich_yeu


# ═══════════════════════════════════════════════════════════════════
# 2. Văn bản Đi Admin
# ═══════════════════════════════════════════════════════════════════

class VanBanDiAttachmentInline(admin.TabularInline):
    model = VanBanDiAttachment
    extra = 0
    readonly_fields = ["created_time"]


@admin.register(VanBanDi)
class VanBanDiAdmin(admin.ModelAdmin):
    list_display = [
        "so_hieu",
        "nam",
        "so_thu_tu",
        "ngay_ban_hanh",
        "trich_yeu_short",
        "noi_ban_hanh",
        "hieu_luc",
        "hien_thi",
        "created_at",
    ]
    list_filter = ["nam", "hieu_luc", "hien_thi"]
    search_fields = ["so_hieu", "trich_yeu", "noi_ban_hanh"]
    readonly_fields = ["so_thu_tu", "created_at", "updated_at"]
    inlines = [VanBanDiAttachmentInline]
    list_per_page = 20

    @admin.display(description="Trích yếu")
    def trich_yeu_short(self, obj):
        if len(obj.trich_yeu) > 80:
            return obj.trich_yeu[:80] + "..."
        return obj.trich_yeu


# ═══════════════════════════════════════════════════════════════════
# 3. Văn bản Mật Admin
# ═══════════════════════════════════════════════════════════════════

class VanBanMatAttachmentInline(admin.TabularInline):
    model = VanBanMatAttachment
    extra = 0
    readonly_fields = ["created_time"]


@admin.register(VanBanMat)
class VanBanMatAdmin(admin.ModelAdmin):
    list_display = [
        "so_hieu",
        "nam",
        "ngay_ban_hanh",
        "trich_yeu_short",
        "noi_ban_hanh",
        "hieu_luc",
        "hien_thi",
        "created_at",
    ]
    list_filter = ["nam", "hieu_luc", "hien_thi"]
    search_fields = ["so_hieu", "trich_yeu", "noi_ban_hanh"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [VanBanMatAttachmentInline]
    list_per_page = 20

    @admin.display(description="Trích yếu")
    def trich_yeu_short(self, obj):
        if len(obj.trich_yeu) > 80:
            return obj.trich_yeu[:80] + "..."
        return obj.trich_yeu


# ═══════════════════════════════════════════════════════════════════
# 4. View Log Admin
# ═══════════════════════════════════════════════════════════════════

@admin.register(DocumentViewLog)
class DocumentViewLogAdmin(admin.ModelAdmin):
    list_display = ["document_type", "document_id", "user", "viewed_at"]
    list_filter = ["document_type", "viewed_at"]
    search_fields = ["user__username", "user__first_name", "user__last_name"]
    readonly_fields = ["viewed_at"]
    list_per_page = 30
