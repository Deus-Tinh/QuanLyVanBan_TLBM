from django.contrib import admin
from .models import BirthdayEmailLog, BirthdayWish


@admin.register(BirthdayEmailLog)
class BirthdayEmailLogAdmin(admin.ModelAdmin):
    list_display = ("staff", "sent_date", "recipient_email", "status", "retry_count", "sent_at")
    list_filter = ("status", "sent_date", "card_template")
    search_fields = ("staff__full_name", "recipient_email", "subject")
    readonly_fields = ("created_at", "processed_at", "sent_at")


@admin.register(BirthdayWish)
class BirthdayWishAdmin(admin.ModelAdmin):
    list_display = ("staff", "sender_name", "card_template", "created_at")
    list_filter = ("card_template", "created_at")
    search_fields = ("staff__full_name", "sender_name", "message")
    readonly_fields = ("created_at",)
