from datetime import timedelta
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth import get_user_model
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
            in_rows = cursor.fetchall()

            # Đọc tệp đính kèm cho Văn bản đến từ bảng documents_vanbanden_attachment
            in_att_map = {}
            cursor.execute(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_vanbanden_attachment'"
            )
            if cursor.fetchone():
                cursor.execute("""
                    SELECT document_id, name, path
                    FROM documents_vanbanden_attachment
                    WHERE is_deleted = FALSE
                """)
                for d_id, a_name, a_path in cursor.fetchall():
                    ext = a_name.split('.')[-1].lower() if '.' in a_name else 'pdf'
                    a_type = 'excel' if ext in ['xls', 'xlsx'] else ('word' if ext in ['doc', 'docx'] else ('image' if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp'] else 'pdf'))
                    in_att_map.setdefault(d_id, []).append({
                        "name": a_name,
                        "url": a_path,
                        "type": a_type,
                        "size": "612 KB" if ext == "pdf" else ("98 KB" if ext in ["doc", "docx"] else ("12 KB" if ext in ["xls", "xlsx"] else "1.4 MB")),
                    })

            recent_incoming = []
            for r in in_rows:
                doc_date = r[3] or r[4]
                date_str = doc_date.strftime("%d/%m/%Y") if doc_date else today.strftime("%d/%m/%Y")
                recent_incoming.append({
                    "id": r[0],
                    "code": r[1],
                    "title": r[2],
                    "date": date_str,
                    "sender": r[5] or "Cơ quan ban hành",
                    "scope": r[6],
                    "attachments": in_att_map.get(r[0], []),
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
            out_rows = cursor.fetchall()

            # Đọc tệp đính kèm cho Văn bản đi từ bảng documents_vanbandi_attachment
            out_att_map = {}
            cursor.execute(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_vanbandi_attachment'"
            )
            if cursor.fetchone():
                cursor.execute("""
                    SELECT document_id, name, path
                    FROM documents_vanbandi_attachment
                    WHERE is_deleted = FALSE
                """)
                for d_id, a_name, a_path in cursor.fetchall():
                    ext = a_name.split('.')[-1].lower() if '.' in a_name else 'pdf'
                    a_type = 'excel' if ext in ['xls', 'xlsx'] else ('word' if ext in ['doc', 'docx'] else ('image' if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp'] else 'pdf'))
                    out_att_map.setdefault(d_id, []).append({
                        "name": a_name,
                        "url": a_path,
                        "type": a_type,
                        "size": "612 KB" if ext == "pdf" else ("98 KB" if ext in ["doc", "docx"] else ("12 KB" if ext in ["xls", "xlsx"] else "1.4 MB")),
                    })

            recent_outgoing = []
            for r in out_rows:
                doc_date = r[3] or r[4]
                date_str = doc_date.strftime("%d/%m/%Y") if doc_date else today.strftime("%d/%m/%Y")
                recent_outgoing.append({
                    "id": r[0],
                    "code": r[1],
                    "title": r[2],
                    "date": date_str,
                    "recipient": r[5] or "Nơi nhận",
                    "scope": r[6],
                    "attachments": out_att_map.get(r[0], []),
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

            # 5. Danh sách nhiệm vụ từ task_congviec
            tasks_list = []
            cursor.execute(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_congviec'"
            )
            if cursor.fetchone():
                cursor.execute("""
                    SELECT id, noi_dung, ngay_tao_cv, ngay_xu_ly, opened_at, approved_at
                    FROM task_congviec
                    WHERE hien_thi = TRUE
                    ORDER BY id DESC
                    LIMIT 20
                """)
                for t_row in cursor.fetchall():
                    t_id, t_title, t_created, t_due, t_opened, t_approved = t_row
                    t_due_date = t_due if hasattr(t_due, 'strftime') else today
                    due_str = t_due_date.strftime("%d/%m/%Y") if hasattr(t_due_date, 'strftime') else str(t_due)

                    if t_approved is not None:
                        t_status = 'completed'
                        t_status_label = 'Đã hoàn thành'
                        t_variant = 'success'
                    elif t_due < today:
                        t_status = 'overdue'
                        t_status_label = 'Quá hạn xử lý'
                        t_variant = 'danger'
                    elif t_opened is None:
                        t_status = 'pending'
                        t_status_label = 'Đang chờ duyệt'
                        t_variant = 'warning'
                    else:
                        t_status = 'processing'
                        t_status_label = 'Đang xử lý'
                        t_variant = 'info'

                    tasks_list.append({
                        "id": str(t_id),
                        "title": t_title,
                        "due": due_str,
                        "status": t_status,
                        "statusLabel": t_status_label,
                        "variant": t_variant,
                    })

            # 6. Danh sách biểu mẫu từ records_chitiettailieu
            resources_list = []
            cursor.execute(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'records_chitiettailieu'"
            )
            if cursor.fetchone():
                cursor.execute("""
                    SELECT c.id, c.ky_hieu, c.tieu_de, COALESCE(a.name, 'BM.docx')
                    FROM records_chitiettailieu c
                    LEFT JOIN records_chitiettailieu_attachment a ON a.document_id = c.id
                    WHERE c.hieu_luc = 'CON_HIEU_LUC'
                    ORDER BY c.id ASC
                    LIMIT 5
                """)
                for r_row in cursor.fetchall():
                    r_id, r_code, r_title, r_att_name = r_row
                    ext = r_att_name.split('.')[-1].upper() if '.' in r_att_name else 'DOCX'
                    resources_list.append({
                        "code": r_code or f"BM-{r_id:02d}",
                        "title": r_title,
                        "format": ext,
                    })

            return {
                "incoming_total": incoming_total,
                "outgoing_total": outgoing_total,
                "confidential_total": confidential_total,
                "recent_incoming": recent_incoming,
                "recent_outgoing": recent_outgoing,
                "birthdays_list": birthdays_list,
                "tasks_list": tasks_list,
                "resources_list": resources_list,
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
    is_admin = getattr(user, "is_superuser", False) or getattr(user, "is_staff", False)

    # Kiểm tra và ưu tiên truy vấn trực tiếp từ bảng chuẩn release_DDL.sql trên PostgreSQL
    ddl_data = _get_release_ddl_data(today, is_admin)
    if ddl_data is not None:
        incoming_total = ddl_data["incoming_total"]
        outgoing_total = ddl_data["outgoing_total"]
        confidential_total = ddl_data["confidential_total"]
        recent_incoming = ddl_data["recent_incoming"]
        recent_outgoing = ddl_data["recent_outgoing"]
        birthdays_list = ddl_data["birthdays_list"]
        tasks_list = ddl_data.get("tasks_list", [])
        resources_list = ddl_data.get("resources_list", [])
        tasks_pending = len([t for t in tasks_list if t["status"] in ["processing", "pending", "overdue"]])

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
                "tasks": tasks_list,
                "resources": resources_list,
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
    User = get_user_model()
    today_users = User.objects.filter(
        ngay_sinh__month=today.month,
        ngay_sinh__day=today.day,
    ).select_related("chuc_vu", "don_vi")

    tomorrow_users = User.objects.filter(
        ngay_sinh__month=tomorrow.month,
        ngay_sinh__day=tomorrow.day,
    ).select_related("chuc_vu", "don_vi")

    # Mảng phẳng birthdays chuẩn BirthdayEmployee của React
    birthdays_list = []
    for u in today_users:
        birthdays_list.append({
            "id": u.id,
            "name": u.ho_ten or u.username,
            "fullName": u.ho_ten or u.username,
            "full_name": u.ho_ten or u.username,
            "birthdate": f"{today.strftime('%d/%m')} (Hôm nay)",
            "position": u.chuc_vu.name if u.chuc_vu else "Chuyên viên",
            "roleTitle": u.chuc_vu.name if u.chuc_vu else "Chuyên viên",
            "department": u.don_vi.ten if u.don_vi else "Ban Quản lý",
            "unit": u.don_vi.ten if u.don_vi else "Ban Quản lý",
            "isToday": True,
            "label": "Hôm nay",
        })
    for u in tomorrow_users:
        birthdays_list.append({
            "id": u.id,
            "name": u.ho_ten or u.username,
            "fullName": u.ho_ten or u.username,
            "full_name": u.ho_ten or u.username,
            "birthdate": f"{tomorrow.strftime('%d/%m')} (Ngày mai)",
            "position": u.chuc_vu.name if u.chuc_vu else "Chuyên viên",
            "roleTitle": u.chuc_vu.name if u.chuc_vu else "Chuyên viên",
            "department": u.don_vi.ten if u.don_vi else "Ban Quản lý",
            "unit": u.don_vi.ten if u.don_vi else "Ban Quản lý",
            "isToday": False,
            "label": "Ngày mai",
        })

    birthdays_by_day = {
        "today": [
            {
                "full_name": u.ho_ten or u.username,
                "department": u.don_vi.ten if u.don_vi else "Ban Quản lý",
                "position": u.chuc_vu.name if u.chuc_vu else "Chuyên viên",
            }
            for u in today_users
        ],
        "tomorrow": [
            {
                "full_name": u.ho_ten or u.username,
                "department": u.don_vi.ten if u.don_vi else "Ban Quản lý",
                "position": u.chuc_vu.name if u.chuc_vu else "Chuyên viên",
            }
            for u in tomorrow_users
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
