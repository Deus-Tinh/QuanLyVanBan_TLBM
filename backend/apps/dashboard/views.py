from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/dashboard/overview/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overview_view(request):
    """
    Tổng hợp số liệu cho Dashboard Nhóm 1.

    Yêu cầu Header: Authorization: Bearer <access_token>

    Response 200:
    {
        "stats": {
            "incoming_total": <int>,
            "outgoing_total": <int>,
            "tasks_pending": <int>
        },
        "recent_incoming": [
            { "code": "...", "title": "...", "date": "DD/MM/YYYY" },
            ...
        ],
        "recent_outgoing": [...],
        "today_meetings": [
            {
                "room_name": "...",
                "meeting_title": "...",
                "start_time": "HH:MM",
                "end_time": "HH:MM",
                "organizer": "...",
                "status": "upcoming|ongoing|done"
            },
            ...
        ],
        "birthdays": {
            "today": [
                { "full_name": "...", "department": "...", "label": "Hôm nay" },
                ...
            ],
            "tomorrow": [...]
        }
    }
    """
    today = timezone.localdate()
    tomorrow = today + timedelta(days=1)

    # ── 1-4. Văn bản và phòng họp ───────────────────────────────────
    # Nguồn dữ liệu duy nhất là DDL (documents_vanbanden, documents_vanbandi,
    # meetings_*). Dashboard không giữ bảng riêng và không tự viết lại quy tắc
    # "văn bản xem được" (#68 mục C5). Khi các module trên vào staging, nối
    # tại đây qua van_ban_xem_duoc(user, loai) của Nhóm 2; đến lúc đó khối trả rỗng.
    incoming_total = 0
    outgoing_total = 0
    tasks_pending = 0  # Placeholder — sẽ tích hợp khi Nhóm 6 hoàn tất API Tasks
    recent_incoming = []
    recent_outgoing = []
    today_meetings = []

    stats = {
        "incoming_total": incoming_total,
        "outgoing_total": outgoing_total,
        "tasks_pending": tasks_pending,
    }

    kpis = {
        "incomingCount": incoming_total,
        "outgoingCount": outgoing_total,
        "tasksCount": tasks_pending,
    }

    # ── 5. Sinh nhật hôm nay (T) và ngày mai (T+1) ─────────────────────────
    employees = get_user_model().objects.filter(is_active=True).select_related("don_vi", "chuc_vu")
    today_profiles = employees.filter(
        ngay_sinh__month=today.month,
        ngay_sinh__day=today.day,
    )
    tomorrow_profiles = employees.filter(
        ngay_sinh__month=tomorrow.month,
        ngay_sinh__day=tomorrow.day,
    )

    # Mảng phẳng birthdays chuẩn BirthdayEmployee của React
    birthdays_list = []
    for p in today_profiles:
        birthdays_list.append({
            "id": p.id,
            "name": p.ho_ten,
            "fullName": p.ho_ten,
            "full_name": p.ho_ten,
            "birthdate": f"{today.strftime('%d/%m')} (Hôm nay)",
            "position": p.chuc_vu.name,
            "roleTitle": p.chuc_vu.name,
            "department": p.don_vi.ten,
            "unit": p.don_vi.ten,
            "isToday": True,
            "label": "Hôm nay",
        })
    for p in tomorrow_profiles:
        birthdays_list.append({
            "id": p.id,
            "name": p.ho_ten,
            "fullName": p.ho_ten,
            "full_name": p.ho_ten,
            "birthdate": f"{tomorrow.strftime('%d/%m')} (Ngày mai)",
            "position": p.chuc_vu.name,
            "roleTitle": p.chuc_vu.name,
            "department": p.don_vi.ten,
            "unit": p.don_vi.ten,
            "isToday": False,
            "label": "Ngày mai",
        })

    birthdays_by_day = {
        "today": [
            {
                "full_name": p.ho_ten,
                "department": p.don_vi.ten,
                "position": p.chuc_vu.name,
            }
            for p in today_profiles
        ],
        "tomorrow": [
            {
                "full_name": p.ho_ten,
                "department": p.don_vi.ten,
                "position": p.chuc_vu.name,
            }
            for p in tomorrow_profiles
        ],
    }

    return Response(
        {
            # Hợp đồng chuẩn Hieu.md
            "kpis": kpis,
            "recentIncoming": recent_incoming,
            "recentOutgoing": recent_outgoing,
            "tasks": [],
            "meetingRooms": today_meetings,
            "birthdays": birthdays_list,
            # Tương thích backward
            "stats": stats,
            "recent_incoming": recent_incoming,
            "recent_outgoing": recent_outgoing,
            "today_meetings": today_meetings,
            "birthdays_by_day": birthdays_by_day,
        },
        status=status.HTTP_200_OK,
    )
