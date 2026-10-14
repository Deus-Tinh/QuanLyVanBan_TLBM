from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import IncomingDocument, MeetingRoom, OutgoingDocument


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overview_view(request):
    """Return dashboard summaries using the active documents schema.

    Older local databases still use the dashboard-owned sample tables. Release
    PostgreSQL databases use the canonical documents app tables instead.
    """
    today = timezone.localdate()
    tomorrow = today + timedelta(days=1)
    user = request.user

    # The release DDL stores documents in documents_vanbanden / documents_vanbandi.
    # The older dashboard_* tables remain supported for existing SQLite dev DBs.
    table_names = set(connection.introspection.table_names())
    canonical_tables = {"documents_vanbanden", "documents_vanbandi"}
    has_canonical_documents = canonical_tables.issubset(table_names)
    legacy_tables = {"dashboard_incomingdocument", "dashboard_outgoingdocument"}
    has_legacy_documents = legacy_tables.issubset(table_names)
    use_canonical_documents = has_canonical_documents and (
        connection.vendor == "postgresql" or not has_legacy_documents
    )

    incoming_total = 0
    outgoing_total = 0
    confidential_total = 0
    recent_incoming = []
    recent_outgoing = []

    if use_canonical_documents:
        from documents.models import PhamVi
        from documents.selectors import van_ban_xem_duoc

        incoming_qs = van_ban_xem_duoc(user, "DEN")
        outgoing_qs = van_ban_xem_duoc(user, "DI")
        incoming_year_qs = incoming_qs.filter(ngay_den__year=today.year)
        outgoing_year_qs = outgoing_qs.filter(ngay_ban_hanh__year=today.year)
        incoming_total = incoming_year_qs.count()
        outgoing_total = outgoing_year_qs.count()
        confidential_total = (
            incoming_year_qs.filter(pham_vi=PhamVi.HAN_CHE).count()
            + outgoing_year_qs.filter(pham_vi=PhamVi.HAN_CHE).count()
        )

        recent_incoming = [
            {
                "id": doc.id,
                "code": doc.so_hieu,
                "title": doc.trich_yeu,
                "date": (doc.ngay_den or doc.ngay_van_ban).strftime("%d/%m/%Y"),
                "sender": doc.noi_ban_hanh,
            }
            for doc in incoming_qs.order_by("-ngay_den", "-created_at")[:5]
        ]
        recent_outgoing = [
            {
                "id": doc.id,
                "code": doc.so_hieu,
                "title": doc.trich_yeu,
                "date": (doc.ngay_ban_hanh or doc.ngay_van_ban).strftime("%d/%m/%Y"),
                "recipient": ", ".join(doc.nguoi_nhan.values_list("ho_ten", flat=True)),
            }
            for doc in outgoing_qs.order_by("-ngay_ban_hanh", "-created_at")[:5]
        ]
    elif has_legacy_documents:
        # Compatibility path for the dashboard tables used by older local DBs.
        is_admin = user.is_superuser
        incoming_qs = IncomingDocument.objects.filter(issued_date__year=today.year)
        outgoing_qs = OutgoingDocument.objects.filter(issued_date__year=today.year)
        recent_incoming_qs = IncomingDocument.objects.all()
        recent_outgoing_qs = OutgoingDocument.objects.all()

        if not is_admin:
            incoming_qs = incoming_qs.filter(is_confidential=False)
            outgoing_qs = outgoing_qs.filter(is_confidential=False)
            recent_incoming_qs = recent_incoming_qs.filter(is_confidential=False)
            recent_outgoing_qs = recent_outgoing_qs.filter(is_confidential=False)
        else:
            confidential_total = (
                incoming_qs.filter(is_confidential=True).count()
                + outgoing_qs.filter(is_confidential=True).count()
            )

        incoming_total = incoming_qs.count()
        outgoing_total = outgoing_qs.count()
        recent_incoming = [
            {
                "id": doc.id,
                "code": doc.code,
                "title": doc.title,
                "date": doc.issued_date.strftime("%d/%m/%Y"),
                "sender": doc.sender,
            }
            for doc in recent_incoming_qs[:5]
        ]
        recent_outgoing = [
            {
                "id": doc.id,
                "code": doc.code,
                "title": doc.title,
                "date": doc.issued_date.strftime("%d/%m/%Y"),
                "recipient": doc.recipient,
            }
            for doc in recent_outgoing_qs[:5]
        ]

    tasks_pending = 0  # Placeholder until the Tasks API is integrated.
    kpis = {
        "incomingCount": incoming_total,
        "outgoingCount": outgoing_total,
        "confidentialCount": confidential_total,
        "tasksCount": tasks_pending,
    }
    stats = {
        "incoming_total": incoming_total,
        "outgoing_total": outgoing_total,
        "confidential_total": confidential_total,
        "tasks_pending": tasks_pending,
    }

    # Meeting bookings are optional for this dashboard API. Query the legacy
    # table only when it exists; the release meeting schema is owned separately.
    today_meetings = []
    if "dashboard_meetingroom" in table_names:
        today_meetings = [
            {
                "id": f"room-{meeting.id}",
                "room_name": meeting.room_name,
                "roomName": meeting.room_name,
                "meeting_title": meeting.meeting_title,
                "topic": meeting.meeting_title,
                "start_time": meeting.start_time.strftime("%H:%M"),
                "end_time": meeting.end_time.strftime("%H:%M"),
                "time": f"{meeting.start_time.strftime('%H:%M')} - {meeting.end_time.strftime('%H:%M')}",
                "organizer": meeting.organizer,
                "status": meeting.status or "ready",
            }
            for meeting in MeetingRoom.objects.filter(date=today)
        ]

    employees = get_user_model().objects.filter(is_active=True).select_related("don_vi", "chuc_vu")
    today_profiles = employees.filter(ngay_sinh__month=today.month, ngay_sinh__day=today.day)
    tomorrow_profiles = employees.filter(
        ngay_sinh__month=tomorrow.month,
        ngay_sinh__day=tomorrow.day,
    )

    birthdays = []
    for employee, birthday, is_today in [
        *((profile, today, True) for profile in today_profiles),
        *((profile, tomorrow, False) for profile in tomorrow_profiles),
    ]:
        position = employee.chuc_vu.name if employee.chuc_vu_id else ""
        department = employee.don_vi.ten if employee.don_vi_id else ""
        label = "Hôm nay" if is_today else "Ngày mai"
        birthdays.append(
            {
                "id": employee.id,
                "name": employee.ho_ten,
                "fullName": employee.ho_ten,
                "full_name": employee.ho_ten,
                "birthdate": f"{birthday.strftime('%d/%m')} ({label})",
                "position": position,
                "roleTitle": position,
                "department": department,
                "unit": department,
                "isToday": is_today,
                "label": label,
            }
        )

    birthdays_by_day = {
        "today": [
            {
                "full_name": profile.ho_ten,
                "department": profile.don_vi.ten if profile.don_vi_id else "",
                "position": profile.chuc_vu.name if profile.chuc_vu_id else "",
            }
            for profile in today_profiles
        ],
        "tomorrow": [
            {
                "full_name": profile.ho_ten,
                "department": profile.don_vi.ten if profile.don_vi_id else "",
                "position": profile.chuc_vu.name if profile.chuc_vu_id else "",
            }
            for profile in tomorrow_profiles
        ],
    }

    return Response(
        {
            "kpis": kpis,
            "recentIncoming": recent_incoming,
            "recentOutgoing": recent_outgoing,
            "tasks": [],
            "meetingRooms": today_meetings,
            "birthdays": birthdays,
            # Backward-compatible response fields.
            "stats": stats,
            "recent_incoming": recent_incoming,
            "recent_outgoing": recent_outgoing,
            "today_meetings": today_meetings,
            "birthdays_by_day": birthdays_by_day,
        },
        status=status.HTTP_200_OK,
    )
