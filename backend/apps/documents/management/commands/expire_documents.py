"""
Django Management Command: expire_documents

Quét và tự động chuyển trạng thái các văn bản đã tới hoặc quá ngày hết hiệu lực
sang 'HET_HIEU_LUC'.

Cách dùng:
    python manage.py expire_documents
    python manage.py expire_documents --dry-run
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from documents.models import Document
from documents.services import check_and_update_expired_documents


class Command(BaseCommand):
    help = "Quét và chuyển trạng thái các văn bản đã quá ngày hết hiệu lực sang HET_HIEU_LUC"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Chỉ kiểm tra và đếm số lượng văn bản hết hạn mà không lưu thay đổi vào CSDL",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        now = timezone.now()

        expired_qs = Document.objects.filter(
            hieu_luc=Document.HieuLuc.CON_HIEU_LUC,
            ngay_het_hieu_luc__isnull=False,
            ngay_het_hieu_luc__lte=now,
        )
        count = expired_qs.count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"[DRY-RUN] Tim thay {count} van ban da qua ngay het hieu luc (chua cap nhat DB)."
                )
            )
            for doc in expired_qs:
                self.stdout.write(f"  - [ID: {doc.id}] So hieu: {doc.so_hieu} | Het han: {doc.ngay_het_hieu_luc}")
            return

        updated = check_and_update_expired_documents()
        self.stdout.write(
            self.style.SUCCESS(
                f"Da cap nhat thanh cong {updated} van ban sang trang thai Het hieu luc."
            )
        )
