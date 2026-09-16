from datetime import date
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import StaffProfile
from .models import IncomingDocument, OutgoingDocument, MeetingRoom


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
            "confidential_total": <int>,
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
    tomorrow = today.replace(day=today.day + 1) if today.day < 28 else (
        date(today.year, today.month + 1, 1) if today.month < 12 else date(today.year + 1, 1, 1)
    )

    # ── 1. Thống kê số liệu tổng quan ──────────────────────────────────────
    current_year = today.year
    incoming_qs = IncomingDocument.objects.filter(issued_date__year=current_year)
    outgoing_qs = OutgoingDocument.objects.filter(issued_date__year=current_year)

    stats = {
        "incoming_total": incoming_qs.count(),
        "outgoing_total": outgoing_qs.count(),
        "confidential_total": (
            incoming_qs.filter(is_confidential=True).count()
            + outgoing_qs.filter(is_confidential=True).count()
        ),
        # tasks_pending: placeholder — sẽ tích hợp khi Nhóm 6 hoàn tất API Tasks
        "tasks_pending": 0,
    }

    # ── 2. Top 5 văn bản đến mới nhất ──────────────────────────────────────
    recent_incoming = [
        {
            "code": doc.code,
            "title": doc.title,
            "date": doc.issued_date.strftime("%d/%m/%Y"),
            "sender": doc.sender,
        }
        for doc in IncomingDocument.objects.all()[:5]
    ]

    # ── 3. Top 5 văn bản đi mới nhất ───────────────────────────────────────
    recent_outgoing = [
        {
            "code": doc.code,
            "title": doc.title,
            "date": doc.issued_date.strftime("%d/%m/%Y"),
            "recipient": doc.recipient,
        }
        for doc in OutgoingDocument.objects.all()[:5]
    ]

    # ── 4. Lịch phòng họp hôm nay ──────────────────────────────────────────
    today_meetings = [
        {
            "room_name": m.room_name,
            "meeting_title": m.meeting_title,
            "start_time": m.start_time.strftime("%H:%M"),
            "end_time": m.end_time.strftime("%H:%M"),
            "organizer": m.organizer,
            "status": m.status,
        }
        for m in MeetingRoom.objects.filter(date=today)
    ]

    # ── 5. Sinh nhật hôm nay (T) và ngày mai (T+1) ─────────────────────────
    def _birthday_list(target_date):
        profiles = StaffProfile.objects.filter(
            birthday__month=target_date.month,
            birthday__day=target_date.day,
        ).select_related("user")
        return [
            {
                "full_name": p.full_name,
                "department": p.department,
                "position": p.position,
            }
            for p in profiles
        ]

    birthdays = {
        "today": _birthday_list(today),
        "tomorrow": _birthday_list(tomorrow),
    }

    return Response(
        {
            "stats": stats,
            "recent_incoming": recent_incoming,
            "recent_outgoing": recent_outgoing,
            "today_meetings": today_meetings,
            "birthdays": birthdays,
        },
        status=status.HTTP_200_OK,
    )
