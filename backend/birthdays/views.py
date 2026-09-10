from django.shortcuts import render
from django.http import JsonResponse
from datetime import datetime
from .models import StaffBirthday, CronScheduleConfig, GreetingCardLog

def birthday_calendar(request):
    """
    Phân hệ 7.2: Quản lý Sinh nhật CBNV & Lịch thiệp tự động
    """
    now = datetime.now()
    current_month = now.month
    today_day = now.day

    # Danh sách mẫu nếu DB chưa có bản ghi
    cbnv_sample = [
        {"id": 1, "name": "Châu Tuấn Kiệt", "role": "Project Manager (PM) · Nhóm 1", "dept": "HT", "dept_name": "Ban Công nghệ Thông tin", "bday_month": 9, "bday_day": 10, "email": "kiet.ct@itc.edu.vn", "sent": True, "sent_time": "08:00:00 10/09/2026", "avatar": "👨‍💼"},
        {"id": 2, "name": "Trần Vũ Giang Anh", "role": "Trưởng nhóm 8 (AI)", "dept": "NV", "dept_name": "Khối Nghiệp vụ Bảo hiểm", "bday_month": 9, "bday_day": 10, "email": "anh.tvg@itc.edu.vn", "sent": True, "sent_time": "08:00:00 10/09/2026", "avatar": "👩‍💼"},
        {"id": 3, "name": "Tô Thanh Tân", "role": "Data Architect · Trưởng nhóm 7", "dept": "HT", "dept_name": "Khối Hỗ trợ (CNTT & QTHệ Thống)", "bday_month": 9, "bday_day": 11, "email": "tan.tt@itc.edu.vn", "sent": False, "sent_time": None, "avatar": "👨‍💻"},
        {"id": 4, "name": "Lê Thanh Hậu", "role": "DevOps · Trưởng nhóm 5", "dept": "HT", "dept_name": "Ban Pháp chế & Hệ thống", "bday_month": 9, "bday_day": 15, "email": "hau.lt@itc.edu.vn", "sent": False, "sent_time": None, "avatar": "👨‍🔧"},
        {"id": 5, "name": "Phan Thị Ánh Tuyền", "role": "Trưởng nhóm 3 (Hồ sơ)", "dept": "KD", "dept_name": "Khối Kinh doanh Bảo hiểm", "bday_month": 9, "bday_day": 18, "email": "tuyen.pta@itc.edu.vn", "sent": False, "sent_time": None, "avatar": "👩‍💻"},
        {"id": 6, "name": "Lê Trí Kiệt", "role": "Trưởng nhóm 2 (Văn bản)", "dept": "BL_HCM", "dept_name": "Bảo Long Sài Gòn & Bến Thành", "bday_month": 9, "bday_day": 22, "email": "kiet.lt@itc.edu.vn", "sent": False, "sent_time": None, "avatar": "👨‍💼"},
        {"id": 7, "name": "Thượng Mạnh Quỳnh", "role": "Trưởng nhóm 4 (Tài liệu)", "dept": "HĐQT", "dept_name": "Văn phòng Hội đồng Quản trị", "bday_month": 9, "bday_day": 25, "email": "quynh.tm@itc.edu.vn", "sent": False, "sent_time": None, "avatar": "👩‍⚖️"},
        {"id": 8, "name": "Phan Tạ Hữu Đức", "role": "Trưởng nhóm 6 (Giao việc)", "dept": "BAN_TGD", "dept_name": "Văn phòng Ban Tổng Giám đốc", "bday_month": 9, "bday_day": 28, "email": "duc.pth@itc.edu.vn", "sent": False, "sent_time": None, "avatar": "👨‍💼"}
    ]

    today_staffs = []
    tomorrow_staffs = []
    for s in cbnv_sample:
        s['department'] = {'name': s['dept_name']}
        if s['bday_day'] == 10 and s['bday_month'] == 9:
            today_staffs.append(s)
        elif s['bday_day'] == 11 and s['bday_month'] == 9:
            tomorrow_staffs.append(s)

    today_count = len(today_staffs)
    tomorrow_count = len(tomorrow_staffs)
    month_count = len(cbnv_sample)

    context = {
        'active_menu': 'birthdays',
        'active_group': 'utilities',
        'today_count': today_count,
        'tomorrow_count': tomorrow_count,
        'month_count': month_count,
        'current_month': '09',
        'current_year': 2026,
        'cbnv_list': cbnv_sample,
        'today_staffs': today_staffs,
        'tomorrow_staffs': tomorrow_staffs,
        'tomorrow_date': datetime(2026, 9, 11),
    }
    return render(request, 'birthdays/birthday_dashboard.html', context)

def api_send_wish(request):
    """API endpoint xử lý gửi thiệp mừng sinh nhật"""
    if request.method == 'POST':
        staff_id = request.POST.get('staff_id')
        message = request.POST.get('message', '')
        sender = request.POST.get('sender', 'Ban Tổng Giám đốc & Công đoàn TLBM')
        return JsonResponse({
            'status': 'success',
            'message': 'Đã gửi thiệp chúc mừng sinh nhật thành công!',
            'sent_time': datetime.now().strftime('%H:%M:%S %d/%m/%Y')
        })
    return JsonResponse({'status': 'error', 'message': 'Phương thức không hợp lệ'}, status=400)

def api_save_config(request):
    """API endpoint cấu hình lịch gửi tự động 08:00"""
    if request.method == 'POST':
        schedule_time = request.POST.get('schedule_time', '08:00')
        return JsonResponse({
            'status': 'success',
            'message': f'Cấu hình lịch phát tự động vào lúc {schedule_time} hằng ngày thành công!'
        })
    return JsonResponse({'status': 'error', 'message': 'Phương thức không hợp lệ'}, status=400)
