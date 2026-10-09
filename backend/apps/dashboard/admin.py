from django.contrib import admin
from .models import IncomingDocument, OutgoingDocument, MeetingRoom


@admin.register(IncomingDocument)
class IncomingDocumentAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "issued_date", "sender", "is_confidential")
    list_filter = ("is_confidential", "issued_date")
    search_fields = ("code", "title", "sender")
    date_hierarchy = "issued_date"
    ordering = ("-issued_date",)


@admin.register(OutgoingDocument)
class OutgoingDocumentAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "issued_date", "recipient", "is_confidential")
    list_filter = ("is_confidential", "issued_date")
    search_fields = ("code", "title", "recipient")
    date_hierarchy = "issued_date"
    ordering = ("-issued_date",)


@admin.register(MeetingRoom)
class MeetingRoomAdmin(admin.ModelAdmin):
    list_display = ("room_name", "meeting_title", "date", "start_time", "end_time", "organizer", "status")
    list_filter = ("status", "date")
    search_fields = ("room_name", "meeting_title", "organizer")
    date_hierarchy = "date"
    ordering = ("date", "start_time")
