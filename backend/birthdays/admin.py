from django.contrib import admin
from .models import Department, StaffBirthday, GreetingCardLog, CronScheduleConfig

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')

@admin.register(StaffBirthday)
class StaffBirthdayAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'dept_name', 'bday_day', 'bday_month', 'sent')
    list_filter = ('bday_month', 'sent', 'dept_code')
    search_fields = ('name', 'email', 'role')

@admin.register(GreetingCardLog)
class GreetingCardLogAdmin(admin.ModelAdmin):
    list_display = ('staff', 'sender', 'sent_at')

@admin.register(CronScheduleConfig)
class CronScheduleConfigAdmin(admin.ModelAdmin):
    list_display = ('schedule_time', 'is_active', 'email_subject', 'updated_at')
