"""Django Admin cho Module Văn Bản."""

from django.contrib import admin

from .models import Document, DocumentAttachment, DocumentViewLog


class DocumentAttachmentInline(admin.TabularInline):
    """Hiển thị file đính kèm inline trong trang Document."""

    model = DocumentAttachment
    extra = 0
    readonly_fields = ["uploaded_at"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "so_hieu",
        "loai",
        "nam",
        "so_thu_tu",
        "trich_yeu_short",
        "noi_ban_hanh",
        "hieu_luc",
        "hien_thi",
        "created_at",
    ]
    list_filter = ["loai", "nam", "hieu_luc", "hien_thi"]
    search_fields = ["so_hieu", "trich_yeu", "noi_ban_hanh"]
    readonly_fields = ["so_thu_tu", "created_at", "updated_at"]
    inlines = [DocumentAttachmentInline]
    list_per_page = 20

    @admin.display(description="Trích yếu")
    def trich_yeu_short(self, obj):
        if len(obj.trich_yeu) > 80:
            return obj.trich_yeu[:80] + "..."
        return obj.trich_yeu


@admin.register(DocumentViewLog)
class DocumentViewLogAdmin(admin.ModelAdmin):
    list_display = ["document", "user", "viewed_at"]
    list_filter = ["viewed_at"]
    search_fields = ["user__username", "user__first_name", "user__last_name"]
    readonly_fields = ["viewed_at"]
    list_per_page = 30
