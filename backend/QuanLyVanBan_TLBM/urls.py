"""
URL Configuration for QuanLyVanBan_TLBM project.
Môn học: ITC - Lập trình Django (MĐ501911)
Giảng viên: NCS.ThS. Trần Phương Duy
Trưởng nhóm & Project Manager: Châu Tuấn Kiệt (Nhóm 1)
"""

from django.contrib import admin
from django.urls import path, include
from .stub_views import stub_page

# 1. Accounts namespace (Nhóm 1)
accounts_patterns = ([
    path('profile/', lambda r: stub_page(r, 'Thông tin cá nhân', 'Trang hiển thị và chỉnh sửa thông tin người dùng cá nhân (Mục 1.1)', 'Nhóm 1 (Châu Tuấn Kiệt PM)'), name='profile'),
    path('password-change/', lambda r: stub_page(r, 'Đổi mật khẩu', 'Chức năng đổi mật khẩu người dùng (Mục 1.1)', 'Nhóm 1 (Châu Tuấn Kiệt PM)'), name='password_change'),
    path('logout/', lambda r: stub_page(r, 'Đăng xuất', 'Chức năng đăng xuất an toàn khỏi hệ thống (Mục 1.1)', 'Nhóm 1 (Châu Tuấn Kiệt PM)'), name='logout'),
], 'accounts')

# 2. Archives namespace (Nhóm 3)
archives_patterns = ([
    path('danh-muc-ho-so/', lambda r: stub_page(r, 'Quản lý Danh mục Hồ sơ', 'Quản lý danh mục hồ sơ công việc (Mục 3.1)', 'Nhóm 3 (Phan Thị Ánh Tuyền)'), name='danh_muc_ho_so'),
    path('loai-van-ban/', lambda r: stub_page(r, 'Quản lý Loại văn bản', 'Quản lý các loại văn bản (Mục 3.2)', 'Nhóm 3 (Phan Thị Ánh Tuyền)'), name='loai_van_ban'),
    path('van-ban-theo-ho-so/', lambda r: stub_page(r, 'Hồ sơ và Văn bản', 'Liên kết hồ sơ và văn bản (Mục 3.3)', 'Nhóm 3 (Phan Thị Ánh Tuyền)'), name='van_ban_theo_ho_so'),
], 'archives')

# 3. Forms namespace (Nhóm 4)
forms_patterns = ([
    path('categories/', lambda r: stub_page(r, 'Danh mục Biểu mẫu', 'Quản lý tài liệu và biểu mẫu chung (Mục 4.1)', 'Nhóm 4 (Thượng Mạnh Quỳnh)'), name='categories'),
    path('general-docs/', lambda r: stub_page(r, 'Tài liệu chung', 'Kho tài liệu biểu mẫu chung (Mục 4.2)', 'Nhóm 4 (Thượng Mạnh Quỳnh)'), name='general_docs'),
], 'forms')

# 4. Signatures namespace (Nhóm 5)
signatures_patterns = ([
    path('workflow/', lambda r: stub_page(r, 'Quản lý Trình ký số', 'Quy trình trình ký số điện tử (Mục 5.1)', 'Nhóm 5 (Lê Thanh Hậu)'), name='workflow_list'),
], 'signatures')

# 5. Tasks namespace (Nhóm 6)
tasks_patterns = ([
    path('list/', lambda r: stub_page(r, 'Quản lý Giao việc', 'Giao việc và xử lý công việc (Mục 6.1)', 'Nhóm 6 (Phan Tạ Hữu Đức)'), name='task_list'),
], 'tasks')

# 6. Meetings namespace (Nhóm 7)
meetings_patterns = ([
    path('booking/', lambda r: stub_page(r, 'Đăng ký Phòng họp', 'Tiện ích đặt phòng họp nội bộ (Mục 7.1)', 'Nhóm 7 (Tô Thanh Tân)'), name='booking_list'),
], 'meetings')

# 7. System Admin namespace (Nhóm 7)
system_admin_patterns = ([
    path('departments/', lambda r: stub_page(r, 'Đơn vị & Phòng ban', 'Quản lý danh mục Đơn vị / Phòng ban (Mục 7.3)', 'Nhóm 7 (Tô Thanh Tân)'), name='departments'),
    path('positions/', lambda r: stub_page(r, 'Danh mục Chức vụ', 'Quản lý danh mục Chức vụ (Mục 7.4)', 'Nhóm 7 (Tô Thanh Tân)'), name='positions'),
    path('employees/', lambda r: stub_page(r, 'Quản lý Cán bộ Nhân viên', 'Hồ sơ danh sách CBNV (Mục 7.5)', 'Nhóm 7 (Tô Thanh Tân)'), name='employees'),
    path('roles-permissions/', lambda r: stub_page(r, 'Phân quyền người dùng', 'Phân quyền theo nhóm và vai trò (Mục 7.7)', 'Nhóm 7 (Tô Thanh Tân)'), name='roles_permissions'),
    path('settings/', lambda r: stub_page(r, 'Cài đặt hệ thống', 'Cấu hình tham số hệ thống điều hành', 'Nhóm 7 (Tô Thanh Tân)'), name='settings'),
], 'system_admin')

# 8. AI Assistant namespace (Nhóm 8)
ai_patterns = ([
    path('chat/', lambda r: stub_page(r, 'Chatbot AI Tra cứu', 'Chatbot AI hỗ trợ tra cứu văn bản và quy trình (Mục 8.1)', 'Nhóm 8 (Trần Vũ Giang Anh)'), name='chat'),
], 'ai_assistant')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('dashboard.urls')),
    path('birthdays/', include('birthdays.urls')),
    path('documents/', include('documents.urls')),
    # Các phân hệ của các nhóm khác
    path('accounts/', include(accounts_patterns)),
    path('archives/', include(archives_patterns)),
    path('forms/', include(forms_patterns)),
    path('signatures/', include(signatures_patterns)),
    path('tasks/', include(tasks_patterns)),
    path('meetings/', include(meetings_patterns)),
    path('system-admin/', include(system_admin_patterns)),
    path('ai-assistant/', include(ai_patterns)),
]
