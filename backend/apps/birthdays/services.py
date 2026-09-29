import calendar
import os
import socket
import uuid
from datetime import date
from smtplib import (
    SMTPAuthenticationError,
    SMTPConnectError,
    SMTPDataError,
    SMTPHeloError,
    SMTPNotSupportedError,
    SMTPRecipientsRefused,
    SMTPSenderRefused,
)

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from django.utils.html import escape
from accounts.models import StaffProfile
from .models import BirthdayEmailLog, BirthdayEmailStatus

PRE_ACCEPTANCE_SMTP_ERRORS = (
    SMTPAuthenticationError,
    SMTPConnectError,
    SMTPDataError,
    SMTPHeloError,
    SMTPNotSupportedError,
    SMTPRecipientsRefused,
    SMTPSenderRefused,
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


def serialize_staff_birthday(staff: StaffProfile) -> dict:
    """
    Chỉ trả đúng các trường tối thiểu trong hợp đồng API sinh nhật.
    Không công bố năm sinh, tuổi, email, số điện thoại hay tài khoản.
    """
    birth_date = staff.birthday
    return {
        "id": staff.id,
        "ho_ten": staff.full_name,
        "ngay": birth_date.day if birth_date else None,
        "thang": birth_date.month if birth_date else None,
        "chuc_vu": staff.position or "",
        "don_vi": staff.department or "",
    }


def generate_birthday_email_html(staff: StaffProfile, card_template: str = "golden") -> str:
    """
    Tạo nội dung HTML sang trọng, chuẩn mực cho thiệp chúc mừng sinh nhật gửi qua email.
    
    TUÂN THỦ QUY ĐỊNH BẢO MẬT:
    - Tuyệt đối không hiển thị tuổi hoặc năm sinh trong nội dung thư chúc mừng.
    """
    department_name = staff.department or "Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)"
    day_month_str = f"{staff.birthday.day:02d}/{staff.birthday.month:02d}" if staff.birthday else ""
    safe_name = escape(staff.full_name)
    safe_department = escape(department_name)
    safe_unit = escape(staff.department or "Cơ quan")
    safe_position = escape(staff.position or "Cán bộ")

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


def _email_log(staff: StaffProfile, sent_date: date, recipient: str, subject: str) -> BirthdayEmailLog:
    log, _ = BirthdayEmailLog.objects.get_or_create(
        staff=staff,
        birthday_year=sent_date.year,
        defaults={
            "sent_date": sent_date,
            "recipient_email": recipient or "unknown",
            "subject": subject,
            "card_template": "golden",
            "status": BirthdayEmailStatus.PENDING,
        },
    )
    return log


def _safe_error(error: Exception) -> str:
    # SMTP exception messages can contain server text and user identifiers.
    smtp_code = getattr(error, "smtp_code", None)
    if smtp_code is not None:
        return f"{type(error).__name__} (SMTP {smtp_code})"
    return type(error).__name__


def _claim_delivery(log: BirthdayEmailLog, recipient: str, subject: str, max_retries: int) -> bool:
    """
    Claim delivery of a birthday email using select_for_update within transaction.atomic.
    Only rows in eligible states (PENDING, SKIPPED, or FAILED with retry_count <= max_retries)
    can be claimed. Sets a new unique attempt_id and records worker metadata for each claim.
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
            locked_log.status in (BirthdayEmailStatus.PENDING, BirthdayEmailStatus.SKIPPED)
            or (
                locked_log.status == BirthdayEmailStatus.FAILED
                and locked_log.retry_count <= max_retries
            )
        )
        if not is_eligible:
            log.refresh_from_db()
            return False

        attempt_id = uuid.uuid4()
        now = timezone.now()
        locked_log.status = BirthdayEmailStatus.PROCESSING
        locked_log.attempt_id = attempt_id
        locked_log.worker_pid = os.getpid()
        locked_log.worker_host = socket.gethostname()
        locked_log.recipient_email = recipient
        locked_log.subject = subject
        locked_log.skip_reason = ""
        locked_log.error_message = ""
        locked_log.processed_at = now
        locked_log.save(
            update_fields=[
                "status",
                "attempt_id",
                "worker_pid",
                "worker_host",
                "recipient_email",
                "subject",
                "skip_reason",
                "error_message",
                "processed_at",
            ]
        )

    log.refresh_from_db()
    return True


def _record_delivery_result(
    log: BirthdayEmailLog,
    attempt_id: uuid.UUID | str | None,
    new_status: str,
    error_message: str = "",
    *,
    sent_at=None,
) -> bool:
    """
    Record the delivery outcome under a row lock (select_for_update).
    Only the worker that owns the current attempt_id and only if the record
    is currently in PROCESSING status can update the result.
    Prevents old workers from overwriting new attempts or reconciled records.
    """
    if attempt_id is None:
        return False

    with transaction.atomic():
        locked_log = (
            BirthdayEmailLog.objects.select_for_update()
            .filter(pk=log.pk)
            .first()
        )
        if not locked_log:
            return False

        if locked_log.status != BirthdayEmailStatus.PROCESSING:
            return False

        if locked_log.attempt_id is None or str(locked_log.attempt_id) != str(attempt_id):
            return False

        now = timezone.now()
        locked_log.status = new_status
        locked_log.processed_at = now

        update_fields = ["status", "processed_at"]

        if new_status == BirthdayEmailStatus.SUCCESS:
            locked_log.sent_at = sent_at or now
            locked_log.error_message = ""
            update_fields.extend(["sent_at", "error_message"])
        elif new_status == BirthdayEmailStatus.FAILED:
            locked_log.retry_count = locked_log.retry_count + 1
            locked_log.error_message = error_message
            update_fields.extend(["retry_count", "error_message"])
        elif new_status == BirthdayEmailStatus.UNCERTAIN:
            locked_log.error_message = error_message
            update_fields.append("error_message")
        else:
            locked_log.error_message = error_message
            update_fields.append("error_message")

        locked_log.save(update_fields=update_fields)

    log.refresh_from_db()
    return True


def _record_delivery_error(
    log: BirthdayEmailLog,
    error: Exception,
    *,
    certain_not_sent: bool,
    attempt_id: uuid.UUID | str | None = None,
) -> bool:
    # SMTP may accept a message and then disconnect before the client sees its
    # response. Ambiguous failures must not be retried without reconciliation.
    status = BirthdayEmailStatus.FAILED if certain_not_sent else BirthdayEmailStatus.UNCERTAIN
    target_attempt = attempt_id if attempt_id is not None else log.attempt_id
    return _record_delivery_result(
        log=log,
        attempt_id=target_attempt,
        new_status=status,
        error_message=_safe_error(error),
    )


def send_automated_birthday_emails(
    target_date: date = None,
    max_retries: int = 3,
    leap_year_strategy: str = None,
    allow_test_email_backend: bool = False,
) -> dict:
    """
    Send each active employee at most one accepted birthday message per year.

    A durable PROCESSING claim prevents concurrent sends. A process crash or
    ambiguous SMTP result leaves PROCESSING/UNCERTAIN for manual reconciliation.
    Only failures known to precede SMTP acceptance are retried automatically.
    """
    if target_date is None:
        target_date = timezone.localdate()
    if not 0 <= max_retries <= 10:
        raise ValueError("max_retries must be between 0 and 10")
    smtp_backend = "django.core.mail.backends.smtp.EmailBackend"
    memory_backend = "django.core.mail.backends.locmem.EmailBackend"
    if settings.EMAIL_BACKEND != smtp_backend and not (
        allow_test_email_backend and settings.EMAIL_BACKEND == memory_backend
    ):
        raise ImproperlyConfigured("Birthday email delivery requires an SMTP backend.")
    if settings.EMAIL_BACKEND == smtp_backend and (
        not os.getenv("EMAIL_HOST")
        or not os.getenv("DEFAULT_FROM_EMAIL")
        or settings.EMAIL_HOST.endswith(".invalid")
        or settings.DEFAULT_FROM_EMAIL.endswith(".invalid")
    ):
        raise ImproperlyConfigured("Configure EMAIL_HOST and DEFAULT_FROM_EMAIL for SMTP delivery.")
    if leap_year_strategy is None:
        leap_year_strategy = settings.BIRTHDAY_LEAP_DAY_STRATEGY
    if leap_year_strategy not in ("SKIP", "FEB_28", "MAR_01"):
        raise ValueError("Invalid leap-year birthday strategy")

    active_staff = (
        StaffProfile.objects.filter(user__is_active=True)
        .exclude(birthday__isnull=True)
        .select_related("user")
    )
    eligible_staff = [
        staff
        for staff in active_staff
        if is_birthday_on_date(staff.birthday, target_date, leap_year_strategy=leap_year_strategy)
    ]

    results = {
        "target_date": target_date.strftime("%d/%m/%Y"),
        "total_eligible": len(eligible_staff),
        "sent_count": 0,
        "skipped_count": 0,
        "failed_count": 0,
        "uncertain_count": 0,
        "details": [],
    }
    sender_email = settings.DEFAULT_FROM_EMAIL

    for staff in eligible_staff:
        log = None
        try:
            recipient = (staff.user.email or "").strip()
            subject = f"[QLVB&TL] Thư chúc mừng sinh nhật cán bộ nhân viên: {staff.full_name}"
            log = _email_log(staff, target_date, recipient, subject)

            try:
                validate_email(recipient)
            except ValidationError:
                # An invalid current address never overwrites a prior successful or
                # potentially accepted attempt.
                BirthdayEmailLog.objects.filter(
                    pk=log.pk,
                    status__in=(
                        BirthdayEmailStatus.PENDING,
                        BirthdayEmailStatus.FAILED,
                        BirthdayEmailStatus.SKIPPED,
                    ),
                ).update(
                    status=BirthdayEmailStatus.SKIPPED,
                    recipient_email=recipient or "unknown",
                    skip_reason="Địa chỉ email không hợp lệ hoặc bị để trống.",
                    processed_at=timezone.now(),
                )
                results["skipped_count"] += 1
                results["details"].append({
                    "staff_id": staff.id,
                    "full_name": staff.full_name,
                    "status": "SKIPPED",
                    "reason": "Email không hợp lệ hoặc bị trống.",
                })
                continue

            html_content = generate_birthday_email_html(staff)
            # retry_count records failed delivery attempts; max_retries is the
            # number of extra attempts permitted after the first attempt.
            for _ in range(max_retries + 1):
                if not _claim_delivery(log, recipient, subject, max_retries):
                    reason = {
                        BirthdayEmailStatus.SUCCESS: "Đã gửi thành công trước đó.",
                        BirthdayEmailStatus.PROCESSING: "Đang gửi hoặc cần đối soát sau khi tiến trình dừng.",
                        BirthdayEmailStatus.UNCERTAIN: "Kết quả SMTP chưa rõ, cần đối soát trước khi gửi lại.",
                        BirthdayEmailStatus.FAILED: "Đã hết số lần thử lại.",
                    }.get(log.status, "Không thể nhận quyền gửi.")
                    results["skipped_count"] += 1
                    results["details"].append({
                        "staff_id": staff.id,
                        "full_name": staff.full_name,
                        "status": "SKIPPED",
                        "reason": reason,
                    })
                    break

                current_attempt_id = log.attempt_id
                send_error = None
                certain_not_sent = False
                try:
                    accepted = send_mail(
                        subject=subject,
                        message=f"Kính chúc đồng chí {staff.full_name} sinh nhật vui vẻ, hạnh phúc và thành công!",
                        from_email=sender_email,
                        recipient_list=[recipient],
                        html_message=html_content,
                        fail_silently=False,
                    )
                    if accepted != 1:
                        send_error = RuntimeError("SMTP did not accept the message.")
                        certain_not_sent = True
                except PRE_ACCEPTANCE_SMTP_ERRORS as exc:
                    send_error = exc
                    certain_not_sent = True
                except Exception as exc:
                    send_error = exc

                if send_error is not None:
                    try:
                        recorded = _record_delivery_error(
                            log,
                            send_error,
                            certain_not_sent=certain_not_sent,
                            attempt_id=current_attempt_id,
                        )
                    except Exception as exc:
                        # The durable claim remains PROCESSING when a database write
                        # fails. A later job will not risk sending the message again.
                        results["failed_count"] += 1
                        results["uncertain_count"] += 1
                        results["details"].append({
                            "staff_id": staff.id,
                            "full_name": staff.full_name,
                            "status": "UNCERTAIN",
                            "error": f"Không thể ghi nhật ký gửi: {_safe_error(exc)}",
                        })
                        break

                    if not recorded:
                        results["failed_count"] += 1
                        results["uncertain_count"] += 1
                        results["details"].append({
                            "staff_id": staff.id,
                            "full_name": staff.full_name,
                            "status": "UNCERTAIN",
                            "error": "Phiên gửi bị hủy hoặc đã được đối soát.",
                        })
                        break

                    if certain_not_sent and log.retry_count <= max_retries:
                        continue

                    results["failed_count"] += 1
                    if not certain_not_sent:
                        results["uncertain_count"] += 1
                    results["details"].append({
                        "staff_id": staff.id,
                        "full_name": staff.full_name,
                        "status": log.status,
                        "error": _safe_error(send_error),
                    })
                    break

                now = timezone.now()
                try:
                    saved = _record_delivery_result(
                        log=log,
                        attempt_id=current_attempt_id,
                        new_status=BirthdayEmailStatus.SUCCESS,
                        sent_at=now,
                    )
                except Exception:
                    saved = False

                if not saved:
                    # SMTP accepted the message. Keep the durable PROCESSING claim
                    # if the success update was not recorded; do not resend.
                    results["failed_count"] += 1
                    results["uncertain_count"] += 1
                    results["details"].append({
                        "staff_id": staff.id,
                        "full_name": staff.full_name,
                        "status": "UNCERTAIN",
                        "error": "SMTP accepted the message but the success log could not be recorded.",
                    })
                    break

                results["sent_count"] += 1
                results["details"].append({
                    "staff_id": staff.id,
                    "full_name": staff.full_name,
                    "status": "SUCCESS",
                    "recipient_email": recipient,
                })
                break

        except Exception as exc:
            # Keep processing the rest of the batch. If a claim was already
            # written, quarantine it instead of risking a duplicate delivery.
            if log is not None and getattr(log, "attempt_id", None):
                try:
                    _record_delivery_result(
                        log=log,
                        attempt_id=log.attempt_id,
                        new_status=BirthdayEmailStatus.UNCERTAIN,
                        error_message=_safe_error(exc),
                    )
                except Exception:
                    pass
            results["failed_count"] += 1
            results["uncertain_count"] += 1
            results["details"].append({
                "staff_id": staff.id,
                "full_name": staff.full_name,
                "status": "UNCERTAIN",
                "error": _safe_error(exc),
            })
    return results
