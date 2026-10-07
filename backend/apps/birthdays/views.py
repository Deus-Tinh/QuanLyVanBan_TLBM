import calendar
from datetime import date
from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authorization.permissions import require_permission
from accounts.models import Employee
from .models import BirthdayEmailLog, BirthdayWish, BirthdayWishStatus
from .services import is_birthday_on_date, serialize_staff_birthday


def serialize_email_log(log: BirthdayEmailLog) -> dict:
    return {
        "id": log.id,
        "employee_id": log.employee_id,
        "employee_name": log.employee.ho_ten,
        "department": log.employee.don_vi.ten if log.employee.don_vi else "",
        "sent_date": log.sent_date.strftime("%d/%m/%Y"),
        "sent_at": timezone.localtime(log.sent_at).strftime("%d/%m/%Y %H:%M:%S") if log.sent_at else None,
        "recipient_email": log.recipient_email,
        "subject": log.subject,
        "card_template": log.card_template,
        "status": log.status,
        "status_display": log.get_status_display(),
        "retry_count": log.retry_count,
        "error_message": log.error_message or "",
        "smtp_response_code": log.smtp_response_code or "",
    }


def serialize_wish(wish: BirthdayWish) -> dict:
    return {
        "id": wish.id,
        "employee_id": wish.employee_id,
        "employee_name": wish.employee.ho_ten,
        "sender_name": "Ẩn danh" if wish.is_anonymous else wish.sender_name,
        "message": wish.message,
        "card_template": wish.card_template,
        "is_anonymous": wish.is_anonymous,
        "status": wish.status,
        "sticker_url": wish.sticker_url or "",
        "likes_count": wish.likes_count,
        "created_at": timezone.localtime(wish.created_at).strftime("%d/%m/%Y %H:%M:%S") if wish.created_at else None,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated, require_permission("view_sinhnhat")])
def calendar_api(request):
    """
    Lịch sinh nhật dương lịch. Chỉ trả số lượng theo ngày, không trả hồ sơ.
    `year` là năm đang xem lịch, không phải năm sinh của CBNV.
    Yêu cầu quyền: view_sinhnhat.
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

    birthdays = Employee.objects.filter(is_active=True).exclude(ngay_sinh__isnull=True)
    birthday_filter = Q(ngay_sinh__month=month)
    if not calendar.isleap(year) and leap_strategy == "MAR_01" and month == 3:
        birthday_filter |= Q(ngay_sinh__month=2, ngay_sinh__day=29)
    birth_dates = birthdays.filter(birthday_filter).values_list("ngay_sinh", flat=True)

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
@permission_classes([IsAuthenticated, require_permission("view_sinhnhat")])
def day_birthdays_api(request):
    """
    API lấy danh sách CBNV có sinh nhật dương lịch trong một ngày, có phân trang.
    Contract: GET /api/birthdays/day/?month=&day=&year=&page=&page_size=
    Yêu cầu quyền: view_sinhnhat.
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

    birthday_filter = Q(ngay_sinh__month=month, ngay_sinh__day=day)
    if not calendar.isleap(year) and (
        (leap_strategy == "FEB_28" and month == 2 and day == 28)
        or (leap_strategy == "MAR_01" and month == 3 and day == 1)
    ):
        birthday_filter |= Q(ngay_sinh__month=2, ngay_sinh__day=29)

    staff_on_day = (
        Employee.objects.filter(is_active=True)
        .exclude(ngay_sinh__isnull=True)
        .filter(birthday_filter)
        .select_related("don_vi", "chuc_vu")
        .order_by("don_vi__stt_uu_tien", "chuc_vu__display_order", "ho_ten", "id")
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
        "employees": [serialize_staff_birthday(emp) for emp in current_page_data],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, require_permission("view_sinhnhat")])
def birthday_email_logs_api(request):
    """
    API xem nhật ký gửi email chúc mừng sinh nhật tự động.
    Yêu cầu quyền: view_sinhnhat.
    """
    logs = BirthdayEmailLog.objects.all().select_related("employee", "employee__don_vi", "employee__chuc_vu")

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


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, require_permission("send_wish_sinhnhat")])
def birthday_wishes_api(request):
    """
    API gửi lời chúc mừng sinh nhật thủ công và xem lời chúc.
    Yêu cầu quyền: send_wish_sinhnhat.
    """
    if request.method == "GET":
        employee_id = request.GET.get("employee_id")
        wishes = BirthdayWish.objects.filter(status=BirthdayWishStatus.APPROVED)
        if employee_id:
            wishes = wishes.filter(employee_id=employee_id)
        wishes = wishes.select_related("employee").order_by("-created_at")[:50]
        return Response({
            "success": True,
            "wishes": [serialize_wish(w) for w in wishes],
        })

    # POST: Gửi lời chúc mới
    data = request.data or {}
    employee_id = data.get("employee_id")
    message = (data.get("message") or "").strip()
    sender_name = (data.get("sender_name") or request.user.ho_ten or request.user.username).strip()
    card_template = data.get("card_template", "GOLDEN")
    is_anonymous = bool(data.get("is_anonymous", False))
    sticker_url = data.get("sticker_url")

    if not employee_id:
        return Response({"success": False, "error": "Vui lòng chọn nhân viên nhận lời chúc."}, status=400)
    if not message:
        return Response({"success": False, "error": "Nội dung lời chúc không được để trống."}, status=400)

    try:
        target_employee = Employee.objects.get(pk=employee_id)
    except Employee.DoesNotExist:
        return Response({"success": False, "error": "Nhân viên không tồn tại."}, status=404)

    wish = BirthdayWish.objects.create(
        employee=target_employee,
        sender_name=sender_name,
        message=message,
        card_template=card_template,
        is_anonymous=is_anonymous,
        status=BirthdayWishStatus.APPROVED,
        sticker_url=sticker_url,
    )

    return Response({
        "success": True,
        "message": "Gửi lời chúc thành công!",
        "wish": serialize_wish(wish),
    }, status=201)
