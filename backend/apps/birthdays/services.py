import calendar
from datetime import date, timedelta
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.html import escape
from accounts.models import Employee
from .models import BirthdayEmailLog, BirthdayEmailStatus

PRE_ACCEPTANCE_SMTP_ERRORS = (
    Exception,
)

STALE_SENDING_NOTE = "Kết quả gửi không xác định, cần đối soát."
SKIPPED_EMAIL_PREFIX = "Bỏ qua:"


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
    brand_name = getattr(settings, "BRAND_NAME", "Bảo Long Insurance")
    organization_name = getattr(settings, "ORGANIZATION_NAME", brand_name)
    department_name = employee.don_vi.ten if employee.don_vi else organization_name
    day_month_str = f"{employee.ngay_sinh.day:02d}/{employee.ngay_sinh.month:02d}" if employee.ngay_sinh else ""
    safe_name = escape(employee.ho_ten)
    safe_brand = escape(brand_name)
    safe_organization = escape(organization_name)
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
            <p>{safe_brand}</p>
        </div>
        <div class="content-body">
            <div class="greeting-title">
                Kính gửi Đồng chí <span class="staff-highlight">{safe_name}</span>
            </div>
            <p>
                Nhân dịp ngày sinh nhật ({day_month_str}), Ban lãnh đạo và tập thể cán bộ nhân viên <strong>{safe_organization}</strong> thân ái gửi đến đồng chí lời chúc mừng nồng nhiệt và tốt đẹp nhất!
            </p>
            <div class="message-box">
                "Kính chúc đồng chí luôn dồi dào sức khỏe, ngập tràn niềm vui, hạnh phúc bền lâu và luôn hoàn thành xuất sắc mọi trọng trách công tác được giao phó!"
            </div>
            <p style="font-size: 13px; color: #64748b;">
                Đơn vị: <strong>{safe_unit}</strong> · Chức vụ: <strong>{safe_position}</strong>
            </p>
            <div class="footer-signature">
                <p>Thư gửi tự động từ <strong>{safe_brand}</strong></p>
                <p>© {timezone.localdate().year} {safe_organization}</p>
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
            "trang_thai": BirthdayEmailStatus.PENDING,
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
    can be claimed. Sets trang_thai to SENDING.
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
            locked_log.trang_thai == BirthdayEmailStatus.PENDING
            or (
                locked_log.trang_thai in (BirthdayEmailStatus.RETRY, BirthdayEmailStatus.FAILED)
                and locked_log.retry_count <= max_retries
                and not (locked_log.error_message or "").startswith(STALE_SENDING_NOTE)
            )
        )
        if locked_log.next_retry_at and locked_log.next_retry_at > timezone.now():
            is_eligible = False
        if not is_eligible:
            log.refresh_from_db()
            return False

        now = timezone.now()
        locked_log.trang_thai = BirthdayEmailStatus.SENDING
        locked_log.recipient_email = recipient
        locked_log.subject = subject
        locked_log.error_message = None
        locked_log.sent_at = now
        locked_log.save(
            update_fields=[
                "trang_thai",
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
        if not locked_log or locked_log.trang_thai != BirthdayEmailStatus.SENDING:
            return False

        now = timezone.now()
        locked_log.trang_thai = new_status
        update_fields = ["trang_thai", "updated_at"]

        if new_status == BirthdayEmailStatus.SUCCESS:
            locked_log.sent_at = sent_at or now
            locked_log.error_message = None
            locked_log.smtp_response_code = smtp_response_code or "250"
            locked_log.next_retry_at = None
            update_fields.extend(["sent_at", "error_message", "smtp_response_code", "next_retry_at"])
        elif new_status in (BirthdayEmailStatus.RETRY, BirthdayEmailStatus.FAILED):
            locked_log.retry_count = locked_log.retry_count + 1
            locked_log.error_message = error_message
            locked_log.next_retry_at = None
            if smtp_response_code:
                locked_log.smtp_response_code = smtp_response_code
                update_fields.append("smtp_response_code")
            update_fields.extend(["retry_count", "error_message", "next_retry_at"])
        else:
            locked_log.error_message = error_message
            update_fields.append("error_message")

        locked_log.save(update_fields=update_fields)

    log.refresh_from_db()
    return True


def _mark_invalid_email(log: BirthdayEmailLog, reason: str) -> bool:
    """Persist invalid or missing recipients without adding a new trang_thai value to the DDL enum."""
    with transaction.atomic():
        locked_log = BirthdayEmailLog.objects.select_for_update().filter(pk=log.pk).first()
        if (
            not locked_log
            or locked_log.trang_thai in (BirthdayEmailStatus.SUCCESS, BirthdayEmailStatus.SENDING)
            or (locked_log.error_message or "").startswith(STALE_SENDING_NOTE)
        ):
            return False

        locked_log.trang_thai = BirthdayEmailStatus.FAILED
        locked_log.error_message = f"{SKIPPED_EMAIL_PREFIX} {reason}"
        locked_log.next_retry_at = None
        locked_log.save(update_fields=["trang_thai", "error_message", "next_retry_at", "updated_at"])

    log.refresh_from_db()
    return True


def send_automated_birthday_emails(
    target_date: date = None,
    max_retries: int = 3,
    leap_year_strategy: str = None,
    allow_test_email_backend: bool = False,
) -> dict:
    """
    Send birthday messages for the target date and due RETRY rows from the prior
    three days. A stale SENDING row is marked FAILED for manual reconciliation.
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

    now = timezone.now()
    stale_cutoff = now - timedelta(minutes=30)
    stale_failed_count = BirthdayEmailLog.objects.filter(
        trang_thai=BirthdayEmailStatus.SENDING,
        updated_at__lt=stale_cutoff,
    ).update(
        trang_thai=BirthdayEmailStatus.FAILED,
        error_message=STALE_SENDING_NOTE,
        next_retry_at=None,
        updated_at=now,
    )

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
    retry_start_date = target_date - timedelta(days=3)
    retry_logs = list(
        BirthdayEmailLog.objects.filter(
            trang_thai=BirthdayEmailStatus.RETRY,
            sent_date__gte=retry_start_date,
            sent_date__lte=target_date,
        )
        .filter(Q(next_retry_at__isnull=True) | Q(next_retry_at__lte=now))
        .select_related("employee", "employee__don_vi", "employee__chuc_vu")
        .order_by("sent_date", "id")
    )
    candidate_keys = {(employee.id, target_date) for employee in eligible_employees}
    candidate_keys.update((log.employee_id, log.sent_date) for log in retry_logs)

    results = {
        "target_date": target_date.strftime("%d/%m/%Y"),
        "total_eligible": len(candidate_keys),
        "sent_count": 0,
        "skipped_count": 0,
        "failed_count": stale_failed_count,
        "stale_failed_count": stale_failed_count,
        "retry_count": 0,
        "details": [],
    }

    brand_name = getattr(settings, "BRAND_NAME", "Bảo Long Insurance")
    sender_email = getattr(settings, "DEFAULT_FROM_EMAIL", "") or None

    def process_delivery(employee: Employee, sent_date: date, existing_log=None) -> None:
        recipient = (
            existing_log.recipient_email
            if existing_log is not None
            else (employee.email or "")
        ).strip()
        subject = (
            existing_log.subject
            if existing_log is not None
            else f"[{brand_name}] Thư chúc mừng sinh nhật cán bộ nhân viên: {employee.ho_ten}"
        )
        log = existing_log or _email_log(employee, sent_date, recipient, subject)

        try:
            try:
                validate_email(recipient)
            except ValidationError:
                _mark_invalid_email(log, "Địa chỉ email không hợp lệ hoặc bị để trống.")
                results["skipped_count"] += 1
                results["details"].append({
                    "employee_id": employee.id,
                    "full_name": employee.ho_ten,
                    "skipped": True,
                    "trang_thai": BirthdayEmailStatus.FAILED,
                    "reason": "Địa chỉ email không hợp lệ hoặc bị để trống.",
                })
                return

            if not _claim_delivery(log, recipient, subject, max_retries):
                reason = {
                    BirthdayEmailStatus.SUCCESS: "Đã gửi thành công trước đó.",
                    BirthdayEmailStatus.SENDING: "Đang được xử lý bởi tiến trình khác.",
                    BirthdayEmailStatus.FAILED: (
                        STALE_SENDING_NOTE
                        if (log.error_message or "").startswith(STALE_SENDING_NOTE)
                        else "Đã hết số lần thử lại hoặc cần đối soát."
                    ),
                }.get(log.trang_thai, "Không thể nhận quyền gửi.")
                results["skipped_count"] += 1
                results["details"].append({
                    "employee_id": employee.id,
                    "full_name": employee.ho_ten,
                    "skipped": True,
                    "trang_thai": log.trang_thai,
                    "reason": reason,
                })
                return

            send_error = None
            try:
                accepted = send_mail(
                    subject=subject,
                    message=f"Kính chúc đồng chí {employee.ho_ten} sinh nhật vui vẻ, hạnh phúc và thành công!",
                    from_email=sender_email,
                    recipient_list=[recipient],
                    html_message=generate_birthday_email_html(employee),
                    fail_silently=False,
                )
                if accepted != 1:
                    send_error = RuntimeError("SMTP did not accept the message.")
            except Exception as exc:
                send_error = exc

            if send_error is not None:
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
                    "employee_id": employee.id,
                    "full_name": employee.ho_ten,
                    "trang_thai": next_status,
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
                    "employee_id": employee.id,
                    "full_name": employee.ho_ten,
                    "trang_thai": "SUCCESS",
                    "recipient_email": recipient,
                })
        except Exception as exc:
            log.refresh_from_db()
            if log.trang_thai == BirthdayEmailStatus.SENDING:
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
                "employee_id": employee.id,
                "full_name": employee.ho_ten,
                "trang_thai": "RETRY",
                "error": _safe_error(exc),
            })

    processed_keys = set()
    for retry_log in retry_logs:
        key = (retry_log.employee_id, retry_log.sent_date)
        processed_keys.add(key)
        process_delivery(retry_log.employee, retry_log.sent_date, existing_log=retry_log)

    for employee in eligible_employees:
        key = (employee.id, target_date)
        if key in processed_keys:
            continue
        process_delivery(employee, target_date)

    return results
