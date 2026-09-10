from django.shortcuts import render
from datetime import datetime

def home(request):
    """
    Module 1.2: Trang chủ / Dashboard (Nhóm 1 - Châu Tuấn Kiệt PM)
    Thống kê tổng số lượng văn bản, top 5 văn bản đến/đi, sinh nhật hôm nay/ngày mai.
    """
    now = datetime.now()

    # Thống kê KPI
    stats = {
        'total_incoming': 12,
        'total_outgoing': 48,
        'total_secret': 2,
        'total_tasks': 15,
        'current_time_str': now.strftime('%H:%M:%S %d/%m/%Y'),
    }

    # Top 5 Văn bản đến mới nhất (Mục 1.2)
    incoming_docs = [
        {'id': 1, 'code': '104/CV-BTC', 'title': 'Hướng dẫn kiểm toán báo cáo tài chính bán niên 2026', 'sender': 'Bộ Tài chính', 'date': '10/09/2026', 'urgent': False},
        {'id': 2, 'code': '88/NQ-HĐQT', 'title': 'Nghị quyết thông qua kế hoạch chuyển đổi số Quý IV', 'sender': 'Văn phòng HĐQT', 'date': '09/09/2026', 'urgent': False},
        {'id': 3, 'code': '45/TB-BCA', 'title': 'Cảnh báo nguy cơ an ninh mạng và lộ lọt dữ liệu', 'sender': 'Cục An ninh Mạng', 'date': '08/09/2026', 'urgent': True},
        {'id': 4, 'code': '12/TB-TLBM', 'title': 'Thông báo về việc tổ chức Hội nghị người lao động', 'sender': 'Ban Giám đốc', 'date': '07/09/2026', 'urgent': False},
        {'id': 5, 'code': '09/HD-TCKT', 'title': 'Quy chế chi tiêu nội bộ và định mức công tác phí', 'sender': 'Phòng Tài chính', 'date': '05/09/2026', 'urgent': False},
    ]

    # Top 5 Văn bản đi mới nhất (Mục 1.2)
    outgoing_docs = [
        {'id': 1, 'code': '72/BC-TLBM', 'title': 'Báo cáo định kỳ tình hình triển khai hạ tầng số', 'receiver': 'Tập đoàn', 'date': '10/09/2026', 'status': 'Đã ký số'},
        {'id': 2, 'code': '55/TTr-VP', 'title': 'Tờ trình đề xuất trang bị thiết bị văn phòng đợt 2', 'receiver': 'Ban Tổng Giám đốc', 'date': '09/09/2026', 'status': 'Chờ duyệt'},
        {'id': 3, 'code': '41/TB-NS', 'title': 'Thông báo lịch trực lễ và đảm bảo an toàn đơn vị', 'receiver': 'Toàn thể CBNV', 'date': '08/09/2026', 'status': 'Đã ban hành'},
        {'id': 4, 'code': '33/CV-KD', 'title': 'Công văn phúc đáp đối tác bảo hiểm liên kết', 'receiver': 'Công ty Bảo Long', 'date': '06/09/2026', 'status': 'Đã ban hành'},
        {'id': 5, 'code': '29/QĐ-TCCB', 'title': 'Quyết định bổ nhiệm cán bộ quản lý dự án', 'receiver': 'Ban Nhân sự', 'date': '05/09/2026', 'status': 'Đã ký số'},
    ]

    # Sinh nhật hôm nay (T) & ngày mai (T+1)
    today_birthdays = [
        {'name': 'Châu Tuấn Kiệt', 'role': 'Project Manager (PM) · Nhóm 1', 'dept': 'Ban Công nghệ Thông tin', 'day': 10, 'month': 9, 'sent': True},
        {'name': 'Trần Vũ Giang Anh', 'role': 'Trưởng nhóm 8 (AI)', 'dept': 'Khối Nghiệp vụ Bảo hiểm', 'day': 10, 'month': 9, 'sent': True},
    ]
    tomorrow_birthdays = [
        {'name': 'Tô Thanh Tân', 'role': 'Data Architect · Trưởng nhóm 7', 'dept': 'Khối Hỗ trợ (CNTT)', 'day': 11, 'month': 9, 'sent': False},
    ]

    context = {
        'active_menu': 'dashboard',
        'stats': stats,
        'incoming_docs': incoming_docs,
        'outgoing_docs': outgoing_docs,
        'today_birthdays': today_birthdays,
        'tomorrow_birthdays': tomorrow_birthdays,
        'user_name': 'Châu Tuấn Kiệt',
        'user_role': 'Project Manager (PM) · Nhóm 1',
    }
    return render(request, 'dashboard/home.html', context)
