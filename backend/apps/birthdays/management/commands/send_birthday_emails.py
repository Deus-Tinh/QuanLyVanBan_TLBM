from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from birthdays.services import send_automated_birthday_emails


class Command(BaseCommand):
    help = "Quet danh sach CBNV co sinh nhat trong ngay va gui email chuc mung tu dong."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help="Ngay can quet gui mail chuc mung YYYY-MM-DD (mac dinh: ngay hien tai)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Bat buoc gui lai ngay ca khi da gui thanh cong truoc do",
        )
        parser.add_argument(
            "--retries",
            type=int,
            default=3,
            help="So lan thu lai toi da (mac dinh: 3)",
        )
        parser.add_argument(
            "--leap-strategy",
            type=str,
            default="FEB_28",
            choices=["FEB_28", "MAR_01"],
            help="Quy tac xu ly ngay 29/02 trong nam khong nhuan (FEB_28 hoac MAR_01)",
        )

    def handle(self, *args, **options):
        date_str = options.get("date")
        force = options.get("force", False)
        retries = options.get("retries", 3)
        leap_strategy = options.get("leap_strategy", "FEB_28")

        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                self.stderr.write(self.style.ERROR(f"Dinh dang ngay khong hop le: '{date_str}'. Vui long dung YYYY-MM-DD."))
                return
        else:
            target_date = timezone.localdate()

        self.stdout.write(f"[*] Bat dau tien trinh gui email sinh nhat tu dong ngay {target_date.strftime('%d/%m/%Y')}...")

        results = send_automated_birthday_emails(
            target_date=target_date,
            force=force,
            max_retries=retries,
            leap_year_strategy=leap_strategy,
        )

        for detail in results["details"]:
            status = detail["status"]
            name = detail["full_name"]
            if status == "SUCCESS":
                self.stdout.write(self.style.SUCCESS(f"  [+] Gui thanh cong: {name} ({detail.get('recipient_email')})"))
            elif status == "SKIPPED":
                self.stdout.write(self.style.WARNING(f"  [-] Bo qua: {name} - Ly do: {detail.get('reason')}"))
            elif status == "FAILED":
                self.stdout.write(self.style.ERROR(f"  [!] Loi khi gui: {name} - Loi: {detail.get('error')}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Hoan tat quet sinh nhat ngay {results['target_date']}: "
                f"Tong so: {results['total_eligible']} | "
                f"Da gui: {results['sent_count']} | "
                f"Bo qua: {results['skipped_count']} | "
                f"Loi: {results['failed_count']}"
            )
        )
