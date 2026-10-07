import calendar
from datetime import date
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape
from accounts.models import Employee
from .models import BirthdayEmailLog, BirthdayEmailStatus

PRE_ACCEPTANCE_SMTP_ERRORS = (
    Exception,
)


def is_birthday_on_date(birth_date: date, target_date: date, leap_year_strategy: str = "FEB_28") -> bool:
    """
    Xác định xem ngày `target_date` có phải là ngày sinh nhật của `birth_date` hay không.
    Ngày sinh được hiểu theo dương lịch. Trong năm không nhuận, ngày sinh
    29/02 được ghi nhận vào 28/02 theo quy tắc đã thống nhất.

    Quy tắc cấu hình leap_year_strategy:
    - "SKIP": Không chuyển ngày 29/02 trong năm không nhuận.
    - "FEB_28": Chúc mừng vào ngày 28/02 nếu năm đích không nhuận (mặc định).
    - "MAR_01": Chúc mừng vào ngày 01/03 nếu năm đích không nhuận.
    """
    if birth_date is None or target_date is None:
        return False

    # Trường hợp thông thường: trùng cả tháng và ngày
    if birth_date.month == target_date.month and birth_date.day == target_date.day:
        return True

    # Trường hợp sinh ngày 29/02 trong năm không nhuận
    if birth_date.month == 2 and birth_date.day == 29:
        is_target_leap = calendar.isleap(target_date.year)
        if not is_target_leap:
            if leap_year_strategy == "FEB_28" and target_date.month == 2 and target_date.day == 28:
                return True
            if leap_year_strategy == "MAR_01" and target_date.month == 3 and target_date.day == 1:
                return True

    return False


def serialize_staff_birthday(employee: Employee) -> dict:
    """
    Chỉ trả đúng các trường tối thiểu trong hợp đồng API sinh nhật.
    Không công bố năm sinh, tuổi, email, số điện thoại hay tài khoản.
    """
    birth_date = employee.ngay_sinh
    chuc_vu_name = employee.chuc_vu.name if employee.chuc_vu else ""
    don_vi_name = employee.don_vi.ten if employee.don_vi else ""
    return {
        "id": employee.id,
        "ho_ten": employee.ho_ten,
        "ngay": birth_date.day if birth_date else None,
        "thang": birth_date.month if birth_date else None,
        "chuc_vu": chuc_vu_name,
        "don_vi": don_vi_name,
    }


def generate_birthday_email_html(employee: Employee, card_template: str = "GOLDEN") -> str:
    """
    Tạo nội dung HTML sang trọng, chuẩn mực cho thiệp chúc mừng sinh nhật gửi qua email.

    TUÂN THỦ QUY ĐỊNH BẢO MẬT:
    - Tuyệt đối không hiển thị tuổi hoặc năm sinh trong nội dung thư chúc mừng.
    """
    department_name = employee.don_vi.ten if employee.don_vi else "Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)"
    day_month_str = f"{employee.ngay_sinh.day:02d}/{employee.ngay_sinh.month:02d}" if employee.ngay_sinh else ""
    safe_name = escape(employee.ho_ten)
    safe_department = escape(department_name)
    safe_unit = escape(employee.don_vi.ten if employee.don_vi else "Cơ quan")
    safe_position = escape(employee.chuc_vu.name if employee.chuc_vu else "Cán bộ")

    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }}
        .card-container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
        .header-banner {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #ec4899 100%); padding: 40px 20px; text-align: center; color: #ffffff; }}
        .header-banner h1 {{ margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }}
        .header-banner p {{ margin-top: 8px; font-size: 14px; opacity: 0.9; }}
        .content-body {{ padding: 32px 28px; color: #1e293b; line-height: 1.6; text-align: center; }}
        .greeting-title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
        .staff-highlight {{ color: #2563eb; font-weight: 700; }}
        .message-box {{ background: #f8fafc; border-left: 4px solid #3b82f6; padding: 18px 20px; text-align: left; margin: 20px 0; border-radius: 0 12px 12px 0; font-size: 15px; color: #334155; }}
        .footer-signature {{ margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; }}
        .footer-signature strong {{ color: #0f172a; }}
    </style>
</head>
<body>
    <div class="card-container">
        <div class="header-banner">
            <h1>🎂 CHÚC MỪNG SINH NHẬT 🎂</h1>
            <p>Hệ thống Quản lý Văn bản &amp; Tài liệu Mật (QLVB&amp;TL)</p>
        </div>
        <div class="content-body">
            <div class="greeting-title">
                Kính gửi Đồng chí <span class="staff-highlight">{safe_name}</span>
            </div>
            <p>
                Nhân dịp ngày sinh nhật ({day_month_str}), Ban Giám hiệu, Công đoàn cùng toàn thể cán bộ nhân viên <strong>{safe_department}</strong> thân ái gửi đến đồng chí lời chúc mừng nồng nhiệt và tốt đẹp nhất!
            </p>
            <div class="message-box">
                "Kính chúc đồng chí luôn dồi dào sức khỏe, ngập tràn niềm vui, hạnh phúc bền lâu và luôn hoàn thành xuất sắc mọi trọng trách công tác được giao phó!"
            </div>
            <p style="font-size: 13px; color: #64748b;">
                Đơn vị: <strong>{safe_unit}</strong> · Chức vụ: <strong>{safe_position}</strong>
            </p>
            <div class="footer-signature">
                <p>Thư gửi tự động từ <strong>Hệ Thống Tiện Ích Hành Chính QLVB&amp;TL</strong></p>
                <p>© {timezone.localdate().year} Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)</p>
            </div>
        </div>
    </div>
</body>
</html>"""


def _email_log(employee: Employee, sent_date: date, recipient: str, subject: str) -> BirthdayEmailLog:
    log, _ = BirthdayEmailLog.objects.get_or_create(
        employee=employee,
        sent_date=sent_date,
        defaults={
            "sent_at": timezone.now(),
            "recipient_email": recipient or "unknown",
            "subject": subject,
            "card_template": "GOLDEN",
            "status": BirthdayEmailStatus.PENDING,
        },
    )
    return log


def _safe_error(error: Exception) -> str:
    smtp_code = getattr(error, "smtp_code", None)
    if smtp_code is not None:
        return f"{type(error).__name__} (SMTP {smtp_code})"
    return str(error) or type(error).__name__


def _claim_delivery(log: BirthdayEmailLog, recipient: str, subject: str, max_retries: int) -> bool:
    """
    Claim delivery of a birthday email using select_for_update within transaction.atomic.
    Only rows in eligible states (PENDING or RETRY/FAILED with retry_count <= max_retries)
    can be claimed. Sets status to SENDING.
    """
    with transaction.atomic():
        locked_log = (
            BirthdayEmailLog.objects.select_for_update()
            .filter(pk=log.pk)
            .first()
        )
        if not locked_log:
            return False

        is_eligible = (
            locked_log.status == BirthdayEmailStatus.PENDING
            or (
                locked_log.status in (BirthdayEmailStatus.RETRY, BirthdayEmailStatus.FAILED)
                and locked_log.retry_count <= max_retries
            )
        )
        if not is_eligible:
            log.refresh_from_db()
            return False

        now = timezone.now()
        locked_log.status = BirthdayEmailStatus.SENDING
        locked_log.recipient_email = recipient
        locked_log.subject = subject
        locked_log.error_message = None
        locked_log.sent_at = now
        locked_log.save(
            update_fields=[
                "status",
                "recipient_email",
                "subject",
                "error_message",
                "sent_at",
                "updated_at",
            ]
        )

    log.refresh_from_db()
    return True


def _record_delivery_result(
    log: BirthdayEmailLog,
    new_status: str,
    error_message: str = "",
    *,
    sent_at=None,
    smtp_response_code: str = None,
) -> bool:
    """
    Record the delivery outcome under a row lock (select_for_update).
    Only updates if currently SENDING.
    """
    with transaction.atomic():
        locked_log = (
            BirthdayEmailLog.objects.select_for_update()
            .filter(pk=log.pk)
            .first()
        )
        if not locked_log or locked_log.status != BirthdayEmailStatus.SENDING:
            return False

        now = timezone.now()
        locked_log.status = new_status
        update_fields = ["status", "updated_at"]

        if new_status == BirthdayEmailStatus.SUCCESS:
            locked_log.sent_at = sent_at or now
            locked_log.error_message = None
            locked_log.smtp_response_code = smtp_response_code or "250"
            update_fields.extend(["sent_at", "error_message", "smtp_response_code"])
        elif new_status in (BirthdayEmailStatus.RETRY, BirthdayEmailStatus.FAILED):
            locked_log.retry_count = locked_log.retry_count + 1
            locked_log.error_message = error_message
            if smtp_response_code:
                locked_log.smtp_response_code = smtp_response_code
                update_fields.append("smtp_response_code")
            update_fields.extend(["retry_count", "error_message"])
        else:
            locked_log.error_message = error_message
            update_fields.append("error_message")

        locked_log.save(update_fields=update_fields)

    log.refresh_from_db()
    return True


def send_automated_birthday_emails(
    target_date: date = None,
    max_retries: int = 3,
    leap_year_strategy: str = None,
    allow_test_email_backend: bool = False,
) -> dict:
    """
    Send each active employee at most one accepted birthday message per date.
    Uses SQL_Fix4 ENUM: PENDING, SENDING, SUCCESS, FAILED, RETRY.
    """
    if target_date is None:
        target_date = timezone.localdate()
    if not 0 <= max_retries <= 10:
        raise ValueError("max_retries must be between 0 and 10")

    smtp_backend = "django.core.mail.backends.smtp.EmailBackend"
    memory_backend = "django.core.mail.backends.locmem.EmailBackend"

    current_backend = None
    if hasattr(settings, "MAILERS"):
        mailers_dict = getattr(settings, "MAILERS", {})
        default_mailer = mailers_dict.get("default", {})
        current_backend = default_mailer.get("BACKEND")
    elif hasattr(settings, "EMAIL_BACKEND"):
        try:
            current_backend = settings.EMAIL_BACKEND
        except AttributeError:
            current_backend = None

    if not current_backend:
        current_backend = smtp_backend

    if current_backend != smtp_backend and not (
        allow_test_email_backend and (current_backend == memory_backend or "locmem" in current_backend)
    ):
        raise ImproperlyConfigured("Birthday email delivery requires an SMTP backend.")

    if leap_year_strategy is None:
        leap_year_strategy = getattr(settings, "BIRTHDAY_LEAP_DAY_STRATEGY", "FEB_28")
    if leap_year_strategy not in ("SKIP", "FEB_28", "MAR_01"):
        raise ValueError("Invalid leap-year birthday strategy")

    active_employees = (
        Employee.objects.filter(is_active=True)
        .exclude(ngay_sinh__isnull=True)
        .select_related("don_vi", "chuc_vu")
    )
    eligible_employees = [
        emp
        for emp in active_employees
        if is_birthday_on_date(emp.ngay_sinh, target_date, leap_year_strategy=leap_year_strategy)
    ]

    results = {
        "target_date": target_date.strftime("%d/%m/%Y"),
        "total_eligible": len(eligible_employees),
        "sent_count": 0,
        "skipped_count": 0,
        "failed_count": 0,
        "retry_count": 0,
        "details": [],
    }
    sender_email = getattr(settings, "DEFAULT_FROM_EMAIL", "admin@qlvb.local")

    for emp in eligible_employees:
        log = None
        try:
            recipient = (emp.email or "").strip()
            subject = f"[QLVB&TL] Thư chúc mừng sinh nhật cán bộ nhân viên: {emp.ho_ten}"

            # Check if email is valid
            try:
                validate_email(recipient)
            except ValidationError:
                # Không gửi được do email không hợp lệ, không tạo log hoặc bỏ qua
                results["skipped_count"] += 1
                results["details"].append({
                    "employee_id": emp.id,
                    "full_name": emp.ho_ten,
                    "skipped": True,
                    "reason": "Địa chỉ email không hợp lệ hoặc bị để trống.",
                })
                continue

            log = _email_log(emp, target_date, recipient, subject)

            html_content = generate_birthday_email_html(emp)

            # Claim delivery lock
            if not _claim_delivery(log, recipient, subject, max_retries):
                reason = {
                    BirthdayEmailStatus.SUCCESS: "Đã gửi thành công trước đó.",
                    BirthdayEmailStatus.SENDING: "Đang được xử lý bởi tiến trình khác.",
                    BirthdayEmailStatus.FAILED: "Đã hết số lần thử lại.",
                }.get(log.status, "Không thể nhận quyền gửi.")
                results["skipped_count"] += 1
                results["details"].append({
                    "employee_id": emp.id,
                    "full_name": emp.ho_ten,
                    "skipped": True,
                    "status": log.status,
                    "reason": reason,
                })
                continue

            # Attempt sending
            send_error = None
            try:
                accepted = send_mail(
                    subject=subject,
                    message=f"Kính chúc đồng chí {emp.ho_ten} sinh nhật vui vẻ, hạnh phúc và thành công!",
                    from_email=sender_email,
                    recipient_list=[recipient],
                    html_message=html_content,
                    fail_silently=False,
                )
                if accepted != 1:
                    send_error = RuntimeError("SMTP did not accept the message.")
            except Exception as exc:
                send_error = exc

            if send_error is not None:
                # Decide RETRY or FAILED
                next_status = BirthdayEmailStatus.RETRY if log.retry_count < max_retries else BirthdayEmailStatus.FAILED
                _record_delivery_result(
                    log=log,
                    new_status=next_status,
                    error_message=_safe_error(send_error),
                )
                results["failed_count"] += 1
                if next_status == BirthdayEmailStatus.RETRY:
                    results["retry_count"] += 1
                results["details"].append({
                    "employee_id": emp.id,
                    "full_name": emp.ho_ten,
                    "status": next_status,
                    "error": _safe_error(send_error),
                })
            else:
                _record_delivery_result(
                    log=log,
                    new_status=BirthdayEmailStatus.SUCCESS,
                    sent_at=timezone.now(),
                    smtp_response_code="250 OK",
                )
                results["sent_count"] += 1
                results["details"].append({
                    "employee_id": emp.id,
                    "full_name": emp.ho_ten,
                    "status": "SUCCESS",
                    "recipient_email": recipient,
                })

        except Exception as exc:
            if log is not None and log.status == BirthdayEmailStatus.SENDING:
                try:
                    _record_delivery_result(
                        log=log,
                        new_status=BirthdayEmailStatus.RETRY,
                        error_message=_safe_error(exc),
                    )
                except Exception:
                    pass
            results["failed_count"] += 1
            results["details"].append({
                "employee_id": emp.id,
                "full_name": emp.ho_ten,
                "status": "RETRY",
                "error": _safe_error(exc),
            })

    return results
