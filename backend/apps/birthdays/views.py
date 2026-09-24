import calendar
from datetime import date
from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import StaffProfile
from .models import BirthdayEmailLog
from .services import is_birthday_on_date, serialize_staff_birthday


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
    Lịch sinh nhật dương lịch. Chỉ trả số lượng theo ngày, không trả hồ sơ.
    `year` là năm đang xem lịch, không phải năm sinh của CBNV.
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

    days_in_month = calendar.monthrange(year, month)[1]
    leap_strategy = getattr(settings, "BIRTHDAY_LEAP_DAY_STRATEGY", "FEB_28")

    # Eligibility beyond active accounts awaits the CBNV visibility rule from #21/#24.
    birthdays = StaffProfile.objects.filter(user__is_active=True).exclude(birthday__isnull=True)
    birthday_filter = Q(birthday__month=month)
    if not calendar.isleap(year) and leap_strategy == "MAR_01" and month == 3:
        birthday_filter |= Q(birthday__month=2, birthday__day=29)
    birth_dates = birthdays.filter(birthday_filter).values_list("birthday", flat=True)

    days_map = {}
    for birth_date in birth_dates.iterator():
        if birth_date.month == 2 and birth_date.day == 29 and not calendar.isleap(year):
            if leap_strategy == "FEB_28" and month == 2:
                day = 28
            elif leap_strategy == "MAR_01" and month == 3:
                day = 1
            else:
                continue
        else:
            day = birth_date.day
        if day <= days_in_month and is_birthday_on_date(
            birth_date, date(year, month, day), leap_year_strategy=leap_strategy
        ):
            key = str(day)
            days_map[key] = days_map.get(key, 0) + 1

    return Response({
        "success": True,
        "month": month,
        "year": year,
        "days_in_month": days_in_month,
        "total_staff": sum(days_map.values()),
        "days": days_map,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def day_birthdays_api(request):
    """
    API lấy danh sách CBNV có sinh nhật dương lịch trong một ngày, có phân trang.
    Contract: GET /api/birthdays/day/?month=&day=&year=&page=&page_size=
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
        page = int(page_raw)
        page_size = int(page_size_raw)
    except (ValueError, TypeError):
        return Response({"success": False, "error": "Trang và kích thước trang phải là số nguyên."}, status=400)
    if page < 1 or page_size < 1 or page_size > 50:
        return Response({"success": False, "error": "Trang phải từ 1; kích thước trang từ 1 đến 50."}, status=400)

    target_date = date(year, month, day)
    leap_strategy = getattr(settings, "BIRTHDAY_LEAP_DAY_STRATEGY", "FEB_28")

    birthday_filter = Q(birthday__month=month, birthday__day=day)
    if not calendar.isleap(year) and (
        (leap_strategy == "FEB_28" and month == 2 and day == 28)
        or (leap_strategy == "MAR_01" and month == 3 and day == 1)
    ):
        birthday_filter |= Q(birthday__month=2, birthday__day=29)

    staff_on_day = (
        StaffProfile.objects.filter(user__is_active=True)
        .exclude(birthday__isnull=True)
        .filter(birthday_filter)
        .order_by("department", "position", "full_name", "id")
    )

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
        "employees": [serialize_staff_birthday(staff) for staff in current_page_data],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def birthday_email_logs_api(request):
    """
    API xem nhật ký gửi email chúc mừng sinh nhật tự động.
    """
    if not (request.user.is_staff or request.user.is_superuser):
        user_role = getattr(getattr(request.user, "profile", None), "role", "")
        if user_role != "admin":
            return Response({"success": False, "error": "Chỉ Quản trị viên được xem nhật ký email."}, status=403)

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
