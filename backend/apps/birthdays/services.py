import calendar
import re
from datetime import date
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from accounts.models import StaffProfile
from .models import BirthdayEmailLog, BirthdayEmailStatus

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_birthday_on_date(birth_date: date, target_date: date, leap_year_strategy: str = "FEB_28") -> bool:
    """
    Xác định xem ngày `target_date` có phải là ngày sinh nhật của `birth_date` hay không.
    Hỗ trợ xử lý trường hợp đặc biệt: người sinh ngày 29/02 trong năm không nhuận.
    
    Quy tắc cấu hình leap_year_strategy:
    - "FEB_28": Chúc mừng vào ngày 28/02 nếu năm đích không nhuận (mặc định theo đề xuất).
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


def user_can_view_sensitive_cbnv(user) -> bool:
    """
    Kiểm tra xem người dùng hiện tại có quyền xem thông tin nhạy cảm (năm sinh, tuổi)
    của Cán bộ Nhân viên (CBNV) hay không theo chuẩn RBAC của hệ thống.
    """
    if not user or not getattr(user, "is_authenticated", False):
        return False
    return (
        getattr(user, "is_superuser", False)
        or getattr(user, "is_staff", False)
        or getattr(getattr(user, "profile", None), "role", "") == "admin"
        or user.has_perm("accounts.view_sensitive_cbnv")
    )


def serialize_staff_birthday(staff: StaffProfile, target_date: date = None, can_view_sensitive: bool = False) -> dict:
    """
    Serialize thông tin CBNV cho API Lịch sinh nhật và danh sách ngày.
    
    NGUYÊN TẮC BẢO MẬT BẮT BUỘC:
    - Nếu không có quyền: Tuyệt đối KHÔNG trả về `birth_date` (có năm), `birth_year`, `nam_sinh`, `age`, `tuoi`.
    - Chỉ trả về các trường công khai an toàn: `id`, `ho_ten`, `ngay`, `thang`, `chuc_vu`, `don_vi`, v.v.
    """
    today = timezone.localdate()
    birth_date = staff.birthday
    is_today = False
    if birth_date:
        is_today = is_birthday_on_date(birth_date, today)

    data = {
        "id": staff.id,
        "ho_ten": staff.full_name,
        "full_name": staff.full_name,
        "username": staff.user.username if staff.user else "",
        "ngay": birth_date.day if birth_date else None,
        "day": birth_date.day if birth_date else None,
        "thang": birth_date.month if birth_date else None,
        "month": birth_date.month if birth_date else None,
        "birth_day_month": f"{birth_date.day:02d}/{birth_date.month:02d}" if birth_date else "",
        "chuc_vu": staff.position or "Cán bộ chuyên viên",
        "position": staff.position or "Cán bộ chuyên viên",
        "don_vi": staff.department or "Cơ quan",
        "department": staff.department or "Cơ quan",
        "email": staff.user.email if staff.user else "",
        "phone": staff.phone,
        "avatar_url": staff.avatar_url,
        "is_today": is_today,
        "wishes_count": staff.birthday_wishes.count(),
    }

    if can_view_sensitive and birth_date:
        ref_year = target_date.year if target_date else today.year
        age = ref_year - birth_date.year
        data["birth_year"] = birth_date.year
        data["nam_sinh"] = birth_date.year
        data["birth_date"] = birth_date.isoformat()
        data["formatted_birth_date"] = birth_date.strftime("%d/%m/%Y")
        data["age"] = max(0, age)
        data["tuoi"] = max(0, age)

    return data


def generate_birthday_email_html(staff: StaffProfile, card_template: str = "golden") -> str:
    """
    Tạo nội dung HTML sang trọng, chuẩn mực cho thiệp chúc mừng sinh nhật gửi qua email.
    
    TUÂN THỦ QUY ĐỊNH BẢO MẬT:
    - Tuyệt đối không hiển thị tuổi hoặc năm sinh trong nội dung thư chúc mừng.
    """
    department_name = staff.department or "Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)"
    day_month_str = f"{staff.birthday.day:02d}/{staff.birthday.month:02d}" if staff.birthday else ""

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
                Kính gửi Đồng chí <span class="staff-highlight">{staff.full_name}</span>
            </div>
            <p>
                Nhân dịp ngày sinh nhật ({day_month_str}), Ban Giám hiệu, Công đoàn cùng toàn thể cán bộ nhân viên <strong>{department_name}</strong> thân ái gửi đến đồng chí lời chúc mừng nồng nhiệt và tốt đẹp nhất!
            </p>
            <div class="message-box">
                "Kính chúc đồng chí luôn dồi dào sức khỏe, ngập tràn niềm vui, hạnh phúc bền lâu và luôn hoàn thành xuất sắc mọi trọng trách công tác được giao phó!"
            </div>
            <p style="font-size: 13px; color: #64748b;">
                Đơn vị: <strong>{staff.department or "Cơ quan"}</strong> · Chức vụ: <strong>{staff.position or "Cán bộ"}</strong>
            </p>
            <div class="footer-signature">
                <p>Thư gửi tự động từ <strong>Hệ Thống Tiện Ích Hành Chính QLVB&amp;TL</strong></p>
                <p>© 2026 Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)</p>
            </div>
        </div>
    </div>
</body>
</html>"""


def send_automated_birthday_emails(
    target_date: date = None,
    force: bool = False,
    max_retries: int = 3,
    leap_year_strategy: str = "FEB_28",
) -> dict:
    """
    Quét toàn bộ CBNV đang công tác có ngày sinh nhật trong ngày và gửi email chúc mừng tự động.
    
    TÍNH NĂNG QUAN TRỌNG:
    1. Idempotency: Không gửi trùng lặp cho cùng một nhân viên trong cùng ngày (Unique constraint + lock).
    2. Retry: Tự động thử lại nếu lần gửi trước thất bại (tối đa `max_retries` lần).
    3. Error Isolation: Lỗi email của một người không làm dừng batch gửi của những người khác.
    4. Hỗ trợ quy tắc ngày 29/02 trong năm không nhuận.
    """
    if target_date is None:
        target_date = timezone.localdate()

    # Lấy danh sách CBNV đang hoạt động có ngày sinh
    active_staff = (
        StaffProfile.objects.filter(user__is_active=True)
        .exclude(birthday__isnull=True)
        .select_related("user")
    )

    # Lọc những nhân sự có ngày sinh nhật vào target_date
    eligible_staff = [
        staff for staff in active_staff
        if is_birthday_on_date(staff.birthday, target_date, leap_year_strategy=leap_year_strategy)
    ]

    results = {
        "target_date": target_date.strftime("%d/%m/%Y"),
        "total_eligible": len(eligible_staff),
        "sent_count": 0,
        "skipped_count": 0,
        "failed_count": 0,
        "details": [],
    }

    sender_email = getattr(settings, "DEFAULT_FROM_EMAIL", "qlvb-admin@itc.edu.vn")

    for staff in eligible_staff:
        recipient = (staff.user.email if staff.user else "").strip()

        # Kiểm tra email hợp lệ
        if not recipient or not EMAIL_REGEX.match(recipient):
            BirthdayEmailLog.objects.update_or_create(
                staff=staff,
                sent_date=target_date,
                defaults={
                    "recipient_email": recipient or "unknown",
                    "subject": f"[QLVB&TL] Thư chúc mừng sinh nhật cán bộ nhân viên: {staff.full_name}",
                    "card_template": "golden",
                    "status": BirthdayEmailStatus.SKIPPED,
                    "skip_reason": "Địa chỉ email không hợp lệ hoặc bị để trống trong hồ sơ CBNV.",
                    "error_message": "",
                },
            )
            results["skipped_count"] += 1
            results["details"].append({
                "staff_id": staff.id,
                "full_name": staff.full_name,
                "status": "SKIPPED",
                "reason": "Email không hợp lệ hoặc bị trống.",
            })
            continue

        subject = f"[QLVB&TL] Thư chúc mừng sinh nhật cán bộ nhân viên: {staff.full_name}"
        html_content = generate_birthday_email_html(staff, card_template="golden")

        should_send = False
        log_entry = None

        with transaction.atomic():
            log_entry, created = BirthdayEmailLog.objects.select_for_update().get_or_create(
                staff=staff,
                sent_date=target_date,
                defaults={
                    "recipient_email": recipient,
                    "subject": subject,
                    "card_template": "golden",
                    "status": BirthdayEmailStatus.PROCESSING,
                    "retry_count": 0,
                    "skip_reason": "",
                    "error_message": "",
                },
            )

            if not created:
                if log_entry.status == BirthdayEmailStatus.SUCCESS and not force:
                    results["skipped_count"] += 1
                    results["details"].append({
                        "staff_id": staff.id,
                        "full_name": staff.full_name,
                        "status": "SKIPPED",
                        "reason": "Đã gửi thư chúc mừng sinh nhật thành công trước đó.",
                    })
                    continue

                if log_entry.status == BirthdayEmailStatus.PROCESSING and not force:
                    results["skipped_count"] += 1
                    results["details"].append({
                        "staff_id": staff.id,
                        "full_name": staff.full_name,
                        "status": "SKIPPED",
                        "reason": "Đang có một tiến trình khác gửi email cho nhân viên này.",
                    })
                    continue

                if (
                    log_entry.status == BirthdayEmailStatus.FAILED
                    and log_entry.retry_count >= max_retries
                    and not force
                ):
                    results["skipped_count"] += 1
                    results["details"].append({
                        "staff_id": staff.id,
                        "full_name": staff.full_name,
                        "status": "SKIPPED",
                        "reason": f"Đã vượt quá số lần thử lại tối đa ({max_retries} lần).",
                    })
                    continue

                log_entry.status = BirthdayEmailStatus.PROCESSING
                log_entry.recipient_email = recipient
                log_entry.subject = subject
                log_entry.skip_reason = ""
                log_entry.save(update_fields=["status", "recipient_email", "subject", "skip_reason", "processed_at"])

            should_send = True

        if not should_send:
            continue

        try:
            send_mail(
                subject=subject,
                message=f"Kính chúc đồng chí {staff.full_name} sinh nhật vui vẻ, hạnh phúc và thành công!",
                from_email=sender_email,
                recipient_list=[recipient],
                html_message=html_content,
                fail_silently=False,
            )

            now_time = timezone.now()
            log_entry.status = BirthdayEmailStatus.SUCCESS
            log_entry.sent_at = now_time
            log_entry.processed_at = now_time
            log_entry.error_message = ""
            log_entry.save(update_fields=["status", "sent_at", "processed_at", "error_message"])

            results["sent_count"] += 1
            results["details"].append({
                "staff_id": staff.id,
                "full_name": staff.full_name,
                "status": "SUCCESS",
                "recipient_email": recipient,
            })
        except Exception as exc:
            now_time = timezone.now()
            log_entry.status = BirthdayEmailStatus.FAILED
            log_entry.retry_count += 1
            log_entry.processed_at = now_time
            log_entry.error_message = str(exc)
            log_entry.save(update_fields=["status", "retry_count", "processed_at", "error_message"])

            results["failed_count"] += 1
            results["details"].append({
                "staff_id": staff.id,
                "full_name": staff.full_name,
                "status": "FAILED",
                "error": str(exc),
            })

    return results
