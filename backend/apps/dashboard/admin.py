from django.contrib import admin
from .models import IncomingDocument, OutgoingDocument, MeetingRoom


@admin.register(IncomingDocument)
class IncomingDocumentAdmin(admin.ModelAdmin):
    list_display = ("so_hieu", "trich_yeu", "ngay_den", "noi_ban_hanh", "pham_vi")
    list_filter = ("pham_vi", "ngay_den")
    search_fields = ("so_hieu", "trich_yeu", "noi_ban_hanh")
    date_hierarchy = "ngay_den"
    ordering = ("-ngay_den",)


@admin.register(OutgoingDocument)
class OutgoingDocumentAdmin(admin.ModelAdmin):
    list_display = ("so_hieu", "trich_yeu", "ngay_ban_hanh", "noi_ban_hanh", "pham_vi")
    list_filter = ("pham_vi", "ngay_ban_hanh")
    search_fields = ("so_hieu", "trich_yeu", "noi_ban_hanh")
    date_hierarchy = "ngay_ban_hanh"
    ordering = ("-ngay_ban_hanh",)


@admin.register(MeetingRoom)
class MeetingRoomAdmin(admin.ModelAdmin):
    list_display = ("name", "title", "date", "start_time", "end_time", "organizer", "status")
    list_filter = ("status", "date")
    search_fields = ("name", "title", "organizer")
    date_hierarchy = "date"
    ordering = ("date", "start_time")
