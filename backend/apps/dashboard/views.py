from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from documents.models import VanBanDenAttachment, VanBanDiAttachment
from documents.selectors import van_ban_xem_duoc

RECENT_LIMIT = 5
ATTACHMENT_TYPES = {
    "excel": ("xls", "xlsx"),
    "word": ("doc", "docx"),
    "image": ("jpg", "jpeg", "png", "gif", "webp"),
}


def _attachment_type(name):
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    for kind, exts in ATTACHMENT_TYPES.items():
        if ext in exts:
            return kind
    return "pdf"


def _recent_documents(user, loai, date_field, attachment_model, extra_field, extra_key, extra_default):
    """Top văn bản gần nhất mà user được xem, cùng bộ đếm trong năm hiện tại.

    Cả bộ đếm và danh sách dùng selector chung `van_ban_xem_duoc` nên không lộ văn bản HAN_CHE.
    """
    visible = van_ban_xem_duoc(user, loai)
    year_total = visible.filter(**{f"{date_field}__year": timezone.localdate().year}).count()
    documents = list(visible.order_by(f"-{date_field}", "-pk")[:RECENT_LIMIT])

    attachments = {}
    rows = attachment_model.objects.filter(
        document_id__in=[d.pk for d in documents], is_deleted=False
    ).order_by("created_at", "pk")
    for att in rows:
        attachments.setdefault(att.document_id, []).append(
            {"name": att.name, "url": att.path, "type": _attachment_type(att.name), "size": ""}
        )

    items = []
    for doc in documents:
        shown = doc.ngay_van_ban or getattr(doc, date_field)
        items.append(
            {
                "id": doc.pk,
                "code": doc.so_hieu,
                "title": doc.trich_yeu,
                "date": timezone.localtime(shown).strftime("%d/%m/%Y"),
                extra_key: getattr(doc, extra_field) or extra_default,
                "scope": doc.pham_vi,
                "attachments": attachments.get(doc.pk, []),
            }
        )
    return year_total, items


def _tasks(today):
    """Nhiệm vụ từ task_congviec (Nhóm 6 chưa có model trong staging); bảng chưa có thì trả rỗng."""
    if "task_congviec" not in connection.introspection.table_names():
        return []
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, noi_dung, ngay_xu_ly, opened_at, approved_at
            FROM task_congviec
            WHERE hien_thi = TRUE
            ORDER BY id DESC
            LIMIT 20
            """
        )
        rows = cursor.fetchall()

    tasks = []
    for task_id, title, due, opened_at, approved_at in rows:
        if approved_at is not None:
            task_status, label, variant = "completed", "Đã hoàn thành", "success"
        elif due < today:
            task_status, label, variant = "overdue", "Quá hạn xử lý", "danger"
        elif opened_at is None:
            task_status, label, variant = "pending", "Đang chờ duyệt", "warning"
        else:
            task_status, label, variant = "processing", "Đang xử lý", "info"
        tasks.append(
            {
                "id": str(task_id),
                "title": title,
                "due": due.strftime("%d/%m/%Y"),
                "status": task_status,
                "statusLabel": label,
                "variant": variant,
            }
        )
    return tasks


def _resources():
    """Biểu mẫu còn hiệu lực từ records_chitiettailieu (Nhóm 4 chưa có model trong staging)."""
    tables = connection.introspection.table_names()
    if "records_chitiettailieu" not in tables or "records_chitiettailieu_attachment" not in tables:
        return []
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT c.id, c.ky_hieu, c.tieu_de,
                   (SELECT a.name FROM records_chitiettailieu_attachment a
                     WHERE a.document_id = c.id AND a.is_deleted = FALSE
                     ORDER BY a.id LIMIT 1)
            FROM records_chitiettailieu c
            WHERE c.hieu_luc = 'CON_HIEU_LUC'
            ORDER BY c.id
            LIMIT %s
            """,
            [RECENT_LIMIT],
        )
        rows = cursor.fetchall()

    resources = []
    for res_id, code, title, att_name in rows:
        ext = att_name.rsplit(".", 1)[-1].upper() if att_name and "." in att_name else "DOCX"
        resources.append({"code": code or f"BM-{res_id:02d}", "title": title, "format": ext})
    return resources


def _birthday_payload(employee, label, is_today, day):
    full_name = employee.ho_ten or employee.username
    position = employee.chuc_vu.name if employee.chuc_vu else "Chuyên viên"
    department = employee.don_vi.ten if employee.don_vi else "Ban Quản lý"
    return {
        "id": employee.id,
        "name": full_name,
        "fullName": full_name,
        "full_name": full_name,
        "birthdate": f"{day.strftime('%d/%m')} ({label})",
        "position": position,
        "roleTitle": position,
        "department": department,
        "unit": department,
        "isToday": is_today,
        "label": label,
    }


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

    incoming_total, recent_incoming = _recent_documents(
        request.user, "DEN", "ngay_den", VanBanDenAttachment, "noi_ban_hanh", "sender", "Cơ quan ban hành"
    )
    outgoing_total, recent_outgoing = _recent_documents(
        request.user, "DI", "ngay_ban_hanh", VanBanDiAttachment, "nguoi_ky", "recipient", "Nơi nhận"
    )
    tasks = _tasks(today)
    resources = _resources()
    tasks_pending = len([t for t in tasks if t["status"] in ("processing", "pending", "overdue")])
    # Lịch họp lấy từ module Nhóm 7 sau khi được tích hợp vào staging.
    today_meetings = []

    employees = get_user_model().objects.filter(is_active=True).select_related("don_vi", "chuc_vu")
    today_users = list(employees.filter(ngay_sinh__month=today.month, ngay_sinh__day=today.day))
    tomorrow_users = list(employees.filter(ngay_sinh__month=tomorrow.month, ngay_sinh__day=tomorrow.day))

    birthdays_list = [_birthday_payload(u, "Hôm nay", True, today) for u in today_users] + [
        _birthday_payload(u, "Ngày mai", False, tomorrow) for u in tomorrow_users
    ]

    def by_day(users):
        return [
            {"full_name": p["full_name"], "department": p["department"], "position": p["position"]}
            for p in (_birthday_payload(u, "", False, today) for u in users)
        ]

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

    return Response(
        {
            # Hợp đồng chuẩn Hieu.md
            "kpis": kpis,
            "recentIncoming": recent_incoming,
            "recentOutgoing": recent_outgoing,
            "tasks": tasks,
            "resources": resources,
            "meetingRooms": today_meetings,
            "birthdays": birthdays_list,
            # Tương thích backward
            "stats": stats,
            "recent_incoming": recent_incoming,
            "recent_outgoing": recent_outgoing,
            "today_meetings": today_meetings,
            "birthdays_by_day": {"today": by_day(today_users), "tomorrow": by_day(tomorrow_users)},
        },
        status=status.HTTP_200_OK,
    )
