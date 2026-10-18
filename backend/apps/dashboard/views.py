from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from documents.models import VanBanDenAttachment, VanBanDiAttachment
from documents.selectors import van_ban_xem_duoc

from work.models import Task, TaskStatus
from document_templates.models import TaiLieuChiTiet, ChiTietTaiLieuAttachment
from document_templates.selectors import visible_resources

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


def _tasks(user, today):
    statuses = {
        TaskStatus.CHO_XU_LY: ("processing", "Chờ xử lý", "info"),
        TaskStatus.DANG_XU_LY: ("processing", "Đang xử lý", "info"),
        TaskStatus.CHO_DUYET: ("pending", "Chờ duyệt", "warning"),
        TaskStatus.HOAN_THANH: ("completed", "Hoàn thành", "success"),
        TaskStatus.CHUA_HOAN_THANH: ("overdue", "Chưa hoàn thành", "danger"),
        TaskStatus.QUA_HAN: ("overdue", "Quá hạn", "danger"),
    }
    rows = Task.objects.visible_to(user).with_status(today).order_by("-pk")[:20]
    tasks = []
    for task in rows:
        task_status, label, variant = statuses[task.status]
        tasks.append({
            "id": str(task.pk),
            "title": task.title,
            "due": task.due_date.strftime("%d/%m/%Y"),
            "status": task_status,
            "statusLabel": label,
            "workStatus": task.status,
            "variant": variant,
        })
    return tasks


def _resources(user):
    rows = visible_resources(TaiLieuChiTiet.objects.all(), user).filter(
        hieu_luc="CON_HIEU_LUC"
    ).order_by("pk").prefetch_related(Prefetch(
        "attachments",
        queryset=ChiTietTaiLieuAttachment.objects.filter(is_deleted=False).order_by("pk"),
        to_attr="active_attachments",
    ))[:RECENT_LIMIT]
    resources = []
    for resource in rows:
        name = resource.active_attachments[0].name if resource.active_attachments else ""
        ext = name.rsplit(".", 1)[-1].upper() if "." in name else "DOCX"
        resources.append({
            "code": resource.ky_hieu or f"BM-{resource.pk:02d}",
            "title": resource.tieu_de,
            "format": ext,
        })
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
    tasks = _tasks(request.user, today)
    resources = _resources(request.user)
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
