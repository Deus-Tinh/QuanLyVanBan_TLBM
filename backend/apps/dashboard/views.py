from datetime import timedelta
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import StaffProfile
from .models import IncomingDocument, OutgoingDocument, MeetingRoom


def _get_release_ddl_data(today, is_admin):
    """Truy vấn trực tiếp từ 55 bảng chuẩn của release_DDL.sql trên PostgreSQL."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_vanbanden'"
            )
            if not cursor.fetchone():
                return None

            # 1. Thống kê số lượng
            cursor.execute(
                "SELECT count(*) FROM documents_vanbanden WHERE EXTRACT(year FROM ngay_den) = %s",
                [today.year],
            )
            incoming_total = cursor.fetchone()[0] or 0

            cursor.execute(
                "SELECT count(*) FROM documents_vanbandi WHERE EXTRACT(year FROM ngay_ban_hanh) = %s",
                [today.year],
            )
            outgoing_total = cursor.fetchone()[0] or 0

            cursor.execute("SELECT count(*) FROM documents_vanbanden WHERE pham_vi = 'HAN_CHE'")
            conf_in = cursor.fetchone()[0] or 0
            cursor.execute("SELECT count(*) FROM documents_vanbandi WHERE pham_vi = 'HAN_CHE'")
            conf_out = cursor.fetchone()[0] or 0
            confidential_total = (conf_in + conf_out) if is_admin else 0

            # 2. Top 5 văn bản đến
            if is_admin:
                cursor.execute("""
                    SELECT id, so_hieu, trich_yeu, ngay_van_ban, ngay_den, noi_ban_hanh, pham_vi
                    FROM documents_vanbanden
                    ORDER BY ngay_den DESC, id DESC
                    LIMIT 5
                """)
            else:
                cursor.execute("""
                    SELECT id, so_hieu, trich_yeu, ngay_van_ban, ngay_den, noi_ban_hanh, pham_vi
                    FROM documents_vanbanden
                    WHERE pham_vi = 'NOI_BO'
                    ORDER BY ngay_den DESC, id DESC
                    LIMIT 5
                """)
            recent_incoming = []
            for r in cursor.fetchall():
                doc_date = r[3] or r[4]
                date_str = doc_date.strftime("%d/%m/%Y") if doc_date else today.strftime("%d/%m/%Y")
                recent_incoming.append({
                    "id": r[0],
                    "code": r[1],
                    "title": r[2],
                    "date": date_str,
                    "sender": r[5] or "Cơ quan ban hành",
                    "scope": r[6],
                })

            # 3. Top 5 văn bản đi
            if is_admin:
                cursor.execute("""
                    SELECT id, so_hieu, trich_yeu, ngay_van_ban, ngay_ban_hanh, nguoi_ky, pham_vi
                    FROM documents_vanbandi
                    ORDER BY ngay_ban_hanh DESC, id DESC
                    LIMIT 5
                """)
            else:
                cursor.execute("""
                    SELECT id, so_hieu, trich_yeu, ngay_van_ban, ngay_ban_hanh, nguoi_ky, pham_vi
                    FROM documents_vanbandi
                    WHERE pham_vi = 'NOI_BO'
                    ORDER BY ngay_ban_hanh DESC, id DESC
                    LIMIT 5
                """)
            recent_outgoing = []
            for r in cursor.fetchall():
                doc_date = r[3] or r[4]
                date_str = doc_date.strftime("%d/%m/%Y") if doc_date else today.strftime("%d/%m/%Y")
                recent_outgoing.append({
                    "id": r[0],
                    "code": r[1],
                    "title": r[2],
                    "date": date_str,
                    "recipient": r[5] or "Nơi nhận",
                    "scope": r[6],
                })

            # 4. Sinh nhật từ accounts_employee nếu có
            birthdays_list = []
            cursor.execute(
                "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounts_employee' AND column_name = 'ngay_sinh'"
            )
            if cursor.fetchone():
                cursor.execute("""
                    SELECT e.id, e.ho_ten, e.ngay_sinh, COALESCE(p.name, 'Chuyên viên'), COALESCE(d.ten, 'Ban Quản lý')
                    FROM accounts_employee e
                    LEFT JOIN accounts_position p ON e.chuc_vu_id = p.id
                    LEFT JOIN organizations_donvi d ON e.don_vi_id = d.id
                    WHERE EXTRACT(month FROM e.ngay_sinh) = %s AND EXTRACT(day FROM e.ngay_sinh) = %s
                """, [today.month, today.day])
                for row in cursor.fetchall():
                    birthdays_list.append({
                        "id": row[0],
                        "name": row[1],
                        "fullName": row[1],
                        "full_name": row[1],
                        "birthdate": f"{today.strftime('%d/%m')} (Hôm nay)",
                        "position": row[3],
                        "roleTitle": row[3],
                        "department": row[4],
                        "unit": row[4],
                        "isToday": True,
                        "label": "Hôm nay",
                    })

            return {
                "incoming_total": incoming_total,
                "outgoing_total": outgoing_total,
                "confidential_total": confidential_total,
                "recent_incoming": recent_incoming,
                "recent_outgoing": recent_outgoing,
                "birthdays_list": birthdays_list,
            }
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/dashboard/overview/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overview_view(request):
    """
    Tổng hợp số liệu cho Dashboard Nhóm 1.

    Yêu cầu Header: Authorization: Bearer <access_token>
    """
    today = timezone.localdate()
    tomorrow = today + timedelta(days=1)

    user = request.user
    profile = getattr(user, "profile", None)
    is_admin = user.is_superuser or (profile and profile.role == "admin")

    # Kiểm tra và ưu tiên truy vấn trực tiếp từ bảng chuẩn release_DDL.sql trên PostgreSQL
    ddl_data = _get_release_ddl_data(today, is_admin)
    if ddl_data is not None:
        incoming_total = ddl_data["incoming_total"]
        outgoing_total = ddl_data["outgoing_total"]
        confidential_total = ddl_data["confidential_total"]
        recent_incoming = ddl_data["recent_incoming"]
        recent_outgoing = ddl_data["recent_outgoing"]
        birthdays_list = ddl_data["birthdays_list"]
        tasks_pending = 0

        stats = {
            "incoming_total": incoming_total,
            "outgoing_total": outgoing_total,
            "confidential_total": confidential_total,
            "tasks_pending": tasks_pending,
        }
        kpis = {
            "incomingCount": incoming_total,
            "outgoingCount": outgoing_total,
            "confidentialCount": confidential_total,
            "tasksCount": tasks_pending,
        }
        return Response(
            {
                "kpis": kpis,
                "recentIncoming": recent_incoming,
                "recentOutgoing": recent_outgoing,
                "tasks": [],
                "meetingRooms": [],
                "birthdays": birthdays_list,
                "stats": stats,
                "recent_incoming": recent_incoming,
                "recent_outgoing": recent_outgoing,
                "today_meetings": [],
                "birthdays_by_day": {"today": [], "tomorrow": []},
            },
            status=status.HTTP_200_OK,
        )

    current_year = today.year
    incoming_qs = IncomingDocument.objects.filter(issued_date__year=current_year)
    outgoing_qs = OutgoingDocument.objects.filter(issued_date__year=current_year)

    if not is_admin:
        # Cán bộ thường không được phép xem hoặc thống kê văn bản mật
        incoming_qs = incoming_qs.filter(is_confidential=False)
        outgoing_qs = outgoing_qs.filter(is_confidential=False)
        confidential_total = 0
    else:
        confidential_total = (
            incoming_qs.filter(is_confidential=True).count()
            + outgoing_qs.filter(is_confidential=True).count()
        )

    incoming_total = incoming_qs.count()
    outgoing_total = outgoing_qs.count()
    tasks_pending = 0  # Placeholder — sẽ tích hợp khi Nhóm 6 hoàn tất API Tasks

    stats = {
        "incoming_total": incoming_total,
        "outgoing_total": outgoing_total,
        "confidential_total": confidential_total,
        "tasks_pending": tasks_pending,
    }

    kpis = {
        "incomingCount": incoming_total,
        "outgoingCount": outgoing_total,
        "confidentialCount": confidential_total,
        "tasksCount": tasks_pending,
    }

    # ── 2. Top 5 văn bản đến mới nhất ──────────────────────────────────────
    recent_incoming_qs = IncomingDocument.objects.all()
    if not is_admin:
        recent_incoming_qs = recent_incoming_qs.filter(is_confidential=False)

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

    # ── 3. Top 5 văn bản đi mới nhất ───────────────────────────────────────
    recent_outgoing_qs = OutgoingDocument.objects.all()
    if not is_admin:
        recent_outgoing_qs = recent_outgoing_qs.filter(is_confidential=False)

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

    # ── 4. Lịch phòng họp hôm nay ──────────────────────────────────────────
    today_meetings = [
        {
            "id": f"room-{m.id}",
            "room_name": m.room_name,
            "roomName": m.room_name,
            "meeting_title": m.meeting_title,
            "topic": m.meeting_title,
            "start_time": m.start_time.strftime("%H:%M"),
            "end_time": m.end_time.strftime("%H:%M"),
            "time": f"{m.start_time.strftime('%H:%M')} - {m.end_time.strftime('%H:%M')}",
            "organizer": m.organizer,
            "status": m.status or "ready",
        }
        for m in MeetingRoom.objects.filter(date=today)
    ]

    # ── 5. Sinh nhật hôm nay (T) và ngày mai (T+1) ─────────────────────────
    today_profiles = StaffProfile.objects.filter(
        birthday__month=today.month,
        birthday__day=today.day,
    ).select_related("user")

    tomorrow_profiles = StaffProfile.objects.filter(
        birthday__month=tomorrow.month,
        birthday__day=tomorrow.day,
    ).select_related("user")

    # Mảng phẳng birthdays chuẩn BirthdayEmployee của React
    birthdays_list = []
    for p in today_profiles:
        birthdays_list.append({
            "id": p.id,
            "name": p.full_name,
            "fullName": p.full_name,
            "full_name": p.full_name,
            "birthdate": f"{today.strftime('%d/%m')} (Hôm nay)",
            "position": p.position or "Chuyên viên",
            "roleTitle": p.position or "Chuyên viên",
            "department": p.department or "Ban Quản lý",
            "unit": p.department or "Ban Quản lý",
            "isToday": True,
            "label": "Hôm nay",
        })
    for p in tomorrow_profiles:
        birthdays_list.append({
            "id": p.id,
            "name": p.full_name,
            "fullName": p.full_name,
            "full_name": p.full_name,
            "birthdate": f"{tomorrow.strftime('%d/%m')} (Ngày mai)",
            "position": p.position or "Chuyên viên",
            "roleTitle": p.position or "Chuyên viên",
            "department": p.department or "Ban Quản lý",
            "unit": p.department or "Ban Quản lý",
            "isToday": False,
            "label": "Ngày mai",
        })

    birthdays_by_day = {
        "today": [
            {
                "full_name": p.full_name,
                "department": p.department,
                "position": p.position,
            }
            for p in today_profiles
        ],
        "tomorrow": [
            {
                "full_name": p.full_name,
                "department": p.department,
                "position": p.position,
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
