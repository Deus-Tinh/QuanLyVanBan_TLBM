from datetime import date

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from birthdays.services import send_automated_birthday_emails


class Command(BaseCommand):
    help = "Gửi email sinh nhật CBNV theo ngày dương lịch của dự án."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            help="Ngày cần gửi YYYY-MM-DD (mặc định: ngày hiện tại theo TIME_ZONE của dự án)",
        )
        parser.add_argument(
            "--retries",
            type=int,
            default=3,
            help="Số lần thử lại tối đa sau lần gửi đầu (mặc định: 3)",
        )
        parser.add_argument(
            "--allow-locmem",
            action="store_true",
            help="Chỉ dùng trong kiểm thử với backend email trong bộ nhớ",
        )

    def handle(self, *args, **options):
        if not 0 <= options["retries"] <= 10:
            raise CommandError("--retries phải từ 0 đến 10.")
        if settings.EMAIL_BACKEND != "django.core.mail.backends.smtp.EmailBackend" and not (
            settings.EMAIL_BACKEND == "django.core.mail.backends.locmem.EmailBackend"
            and options["allow_locmem"]
        ):
            raise CommandError(
                "Cần cấu hình EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend "
                "trước khi gửi email sinh nhật."
            )

        if options["date"]:
            try:
                target_date = date.fromisoformat(options["date"])
            except ValueError as exc:
                raise CommandError("--date phải theo định dạng YYYY-MM-DD.") from exc
        else:
            target_date = timezone.localdate()

        self.stdout.write(f"Bắt đầu gửi email sinh nhật ngày {target_date:%d/%m/%Y}.")
        results = send_automated_birthday_emails(
            target_date=target_date,
            max_retries=options["retries"],
            allow_test_email_backend=options["allow_locmem"],
        )

        for detail in results["details"]:
            status = detail["status"]
            name = detail["full_name"]
            if status == "SUCCESS":
                self.stdout.write(self.style.SUCCESS(f"Đã gửi: {name}"))
            elif status == "SKIPPED":
                self.stdout.write(self.style.WARNING(f"Bỏ qua: {name} - {detail['reason']}"))
            else:
                self.stderr.write(self.style.ERROR(f"Cần xử lý: {name} - {detail['error']}"))

        self.stdout.write(
            f"Tổng: {results['total_eligible']} | "
            f"Đã gửi: {results['sent_count']} | "
            f"Bỏ qua: {results['skipped_count']} | "
            f"Thất bại: {results['failed_count']} | "
            f"Cần đối soát: {results['uncertain_count']}"
        )
        if results["failed_count"]:
            raise CommandError("Có email chưa được xác nhận gửi thành công; xem nhật ký BirthdayEmailLog.")
