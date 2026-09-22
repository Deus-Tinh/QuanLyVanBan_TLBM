from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import StaffProfile


class StaffProfileInline(admin.StackedInline):
    """Hiển thị StaffProfile ngay trong trang chỉnh sửa User."""
    model = StaffProfile
    can_delete = False
    verbose_name = "Hồ sơ CBNV"
    verbose_name_plural = "Hồ sơ CBNV"
    fields = (
        "full_name", "department", "position",
        "role", "phone", "birthday", "avatar_url",
    )


class UserAdmin(BaseUserAdmin):
    """User Admin mở rộng để hiển thị inline StaffProfile."""
    inlines = (StaffProfileInline,)
    list_display = ("username", "email", "get_full_name_display", "get_role", "is_active")

    def get_full_name_display(self, obj):
        try:
            return obj.profile.full_name
        except StaffProfile.DoesNotExist:
            return obj.get_full_name() or "(chưa có hồ sơ)"
    get_full_name_display.short_description = "Họ và tên"

    def get_role(self, obj):
        try:
            return obj.profile.get_role_display()
        except StaffProfile.DoesNotExist:
            return "—"
    get_role.short_description = "Quyền hạn"


# Đăng ký lại User với UserAdmin mở rộng
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Đăng ký StaffProfile riêng để có thể quản lý độc lập
@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "department", "position", "role", "birthday")
    list_filter = ("role", "department")
    search_fields = ("full_name", "user__username", "department")
    ordering = ("full_name",)
