import calendar
import json
from datetime import date
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import StaffProfile
from .models import BirthdayEmailLog, BirthdayWish
from .services import (
    is_birthday_on_date,
    send_automated_birthday_emails,
    serialize_staff_birthday,
    user_can_view_sensitive_cbnv,
)


def serialize_wish(wish: BirthdayWish) -> dict:
    return {
        "id": wish.id,
        "staff_id": wish.staff_id,
        "staff_name": wish.staff.full_name,
        "sender_name": wish.sender_name,
        "message": wish.message,
        "card_template": wish.card_template,
        "created_at": timezone.localtime(wish.created_at).strftime("%d/%m/%Y %H:%M"),
    }


def serialize_email_log(log: BirthdayEmailLog) -> dict:
    return {
        "id": log.id,
        "staff_id": log.staff_id,
        "staff_name": log.staff.full_name,
        "department": log.staff.department or "",
        "sent_date": log.sent_date.strftime("%d/%m/%Y"),
        "sent_at": timezone.localtime(log.sent_at).strftime("%d/%m/%Y %H:%M:%S") if log.sent_at else None,
        "processed_at": timezone.localtime(log.processed_at).strftime("%d/%m/%Y %H:%M:%S") if log.processed_at else None,
        "recipient_email": log.recipient_email,
        "subject": log.subject,
        "card_template": log.card_template,
        "status": log.status,
        "status_display": log.get_status_display(),
        "retry_count": log.retry_count,
        "error_message": log.error_message,
        "skip_reason": log.skip_reason,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def calendar_api(request):
    """
    API lấy dữ liệu tổng hợp lịch sinh nhật trong một tháng cụ thể.
    Contract: GET /api/birthdays/calendar/?month=&year=
    
    BẢO MẬT:
    - `year` là năm đang xem lịch, không phải năm sinh của CBNV.
    - Không trả về năm sinh/tuổi cho người dùng không có quyền.
    """
    now = timezone.localdate()
    month_raw = request.GET.get("month", str(now.month))
    year_raw = request.GET.get("year", str(now.year))

    try:
        month = int(month_raw)
        if month < 1 or month > 12:
            return Response({"success": False, "error": "Tháng không hợp lệ (1-12)."}, status=400)
    except (ValueError, TypeError):
        return Response({"success": False, "error": "Tham số tháng phải là số nguyên."}, status=400)

    try:
        year = int(year_raw)
        if year < 1900 or year > 2100:
            return Response({"success": False, "error": "Năm không hợp lệ (1900-2100)."}, status=400)
    except (ValueError, TypeError):
        return Response({"success": False, "error": "Tham số năm phải là số nguyên."}, status=400)

    can_view_sensitive = user_can_view_sensitive_cbnv(request.user)
    days_in_month = calendar.monthrange(year, month)[1]

    all_active = (
        StaffProfile.objects.filter(user__is_active=True)
        .exclude(birthday__isnull=True)
        .select_related("user")
        .order_by("full_name")
    )

    days_map = {}
    month_staff_list = []

    for day in range(1, days_in_month + 1):
        target_date = date(year, month, day)
        staff_on_day = [
            serialize_staff_birthday(s, target_date=target_date, can_view_sensitive=can_view_sensitive)
            for s in all_active
            if is_birthday_on_date(s.birthday, target_date)
        ]
        if staff_on_day:
            days_map[str(day)] = staff_on_day
            month_staff_list.extend(staff_on_day)

    return Response({
        "success": True,
        "month": month,
        "year": year,
        "days_in_month": days_in_month,
        "total_staff": len(month_staff_list),
        "days": days_map,
        "employees": month_staff_list,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def day_birthdays_api(request):
    """
    API lấy danh sách CBNV có sinh nhật trong một ngày cụ thể có hỗ trợ phân trang.
    Contract: GET /api/birthdays/day/?month=&day=&year=&page=&page_size=
    
    BẢO MẬT:
    - Không trả về năm sinh/tuổi cho người dùng không có quyền.
    """
    now = timezone.localdate()
    month_raw = request.GET.get("month", str(now.month))
    day_raw = request.GET.get("day", str(now.day))
    year_raw = request.GET.get("year", str(now.year))
    page_raw = request.GET.get("page", "1")
    page_size_raw = request.GET.get("page_size", "10")

    try:
        month = int(month_raw)
        if month < 1 or month > 12:
            return Response({"success": False, "error": "Tháng không hợp lệ (1-12)."}, status=400)
    except (ValueError, TypeError):
        return Response({"success": False, "error": "Tham số tháng phải là số nguyên."}, status=400)

    try:
        year = int(year_raw)
        if year < 1900 or year > 2100:
            return Response({"success": False, "error": "Năm không hợp lệ (1900-2100)."}, status=400)
    except (ValueError, TypeError):
        return Response({"success": False, "error": "Tham số năm phải là số nguyên."}, status=400)

    days_in_month = calendar.monthrange(year, month)[1]
    try:
        day = int(day_raw)
        if day < 1 or day > days_in_month:
            return Response(
                {"success": False, "error": f"Ngày không hợp lệ trong tháng {month}/{year} (tối đa {days_in_month} ngày)."},
                status=400,
            )
    except (ValueError, TypeError):
        return Response({"success": False, "error": "Tham số ngày phải là số nguyên."}, status=400)

    try:
        page = max(1, int(page_raw))
        page_size = min(max(1, int(page_size_raw)), 50)
    except (ValueError, TypeError):
        page = 1
        page_size = 10

    can_view_sensitive = user_can_view_sensitive_cbnv(request.user)
    target_date = date(year, month, day)

    all_active = (
        StaffProfile.objects.filter(user__is_active=True)
        .exclude(birthday__isnull=True)
        .select_related("user")
        .order_by("full_name")
    )

    staff_on_day = [
        serialize_staff_birthday(s, target_date=target_date, can_view_sensitive=can_view_sensitive)
        for s in all_active
        if is_birthday_on_date(s.birthday, target_date)
    ]

    paginator = Paginator(staff_on_day, page_size)
    current_page_data = paginator.get_page(page)

    return Response({
        "success": True,
        "date": target_date.strftime("%d/%m/%Y"),
        "day": day,
        "month": month,
        "year": year,
        "total": paginator.count,
        "page": current_page_data.number,
        "total_pages": paginator.num_pages,
        "has_next": current_page_data.has_next(),
        "has_previous": current_page_data.has_previous(),
        "employees": list(current_page_data),
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def birthday_wishes_api(request):
    """
    API gửi và xem danh sách lời chúc sinh nhật.
    - GET: Lấy danh sách lời chúc gửi đến một nhân sự (?staff_id=...)
    - POST: Gửi lời chúc mới
    """
    if request.method == "GET":
        staff_id = request.GET.get("staff_id")
        wishes = BirthdayWish.objects.all().select_related("staff")
        if staff_id:
            wishes = wishes.filter(staff_id=staff_id)

        paginator = Paginator(wishes[:100], 20)
        page_obj = paginator.get_page(request.GET.get("page", 1))

        return Response({
            "success": True,
            "total": paginator.count,
            "page": page_obj.number,
            "total_pages": paginator.num_pages,
            "wishes": [serialize_wish(w) for w in page_obj],
        })

    # POST: Tạo lời chúc
    data = request.data
    staff_id = data.get("staff_id") or data.get("employee_id")
    message = (data.get("message") or "").strip()
    card_template = data.get("card_template", "classic")

    if not staff_id:
        return Response({"success": False, "error": "Vui lòng chọn nhân viên nhận lời chúc."}, status=400)

    if not message:
        return Response({"success": False, "error": "Nội dung lời chúc không được để trống."}, status=400)

    try:
        staff = StaffProfile.objects.get(id=staff_id)
    except StaffProfile.DoesNotExist:
        return Response({"success": False, "error": "Không tìm thấy hồ sơ cán bộ nhân viên."}, status=404)

    sender_name = request.user.get_full_name() or request.user.username
    if hasattr(request.user, "profile") and request.user.profile.full_name:
        sender_name = request.user.profile.full_name

    wish = BirthdayWish.objects.create(
        staff=staff,
        sender_name=sender_name,
        message=message,
        card_template=card_template,
    )

    return Response({
        "success": True,
        "message": "Gửi lời chúc sinh nhật thành công!",
        "wish": serialize_wish(wish),
    }, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def birthday_email_logs_api(request):
    """
    API xem nhật ký gửi email chúc mừng sinh nhật tự động.
    """
    logs = BirthdayEmailLog.objects.all().select_related("staff")

    month_raw = request.GET.get("month")
    year_raw = request.GET.get("year")
    status_raw = request.GET.get("status")

    if month_raw:
        try:
            logs = logs.filter(sent_date__month=int(month_raw))
        except ValueError:
            pass

    if year_raw:
        try:
            logs = logs.filter(sent_date__year=int(year_raw))
        except ValueError:
            pass

    if status_raw:
        logs = logs.filter(status=status_raw)

    paginator = Paginator(logs, 15)
    page_obj = paginator.get_page(request.GET.get("page", 1))

    return Response({
        "success": True,
        "total": paginator.count,
        "page": page_obj.number,
        "total_pages": paginator.num_pages,
        "logs": [serialize_email_log(log) for log in page_obj],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def trigger_birthday_job_api(request):
    """
    API kích hoạt quét và gửi email sinh nhật tự động trong ngày (dành cho Quản trị viên).
    """
    if not request.user.is_staff and not request.user.is_superuser:
        user_role = getattr(getattr(request.user, "profile", None), "role", "")
        if user_role != "admin":
            return Response({"success": False, "error": "Chỉ Quản trị viên mới có quyền kích hoạt tác vụ gửi email."}, status=403)

    force = request.data.get("force", False)
    results = send_automated_birthday_emails(force=force)

    return Response({
        "success": True,
        "message": f"Hoàn tất quét sinh nhật. Đã gửi: {results['sent_count']} | Bỏ qua: {results['skipped_count']} | Thất bại: {results['failed_count']}",
        "results": results,
    })
