from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import DEFAULT_DB_ALIAS, IntegrityError, transaction

from records.models import HoSo


class Command(BaseCommand):
    help = "Tạo Hồ sơ chung đúng một lần sau khi tài khoản admin đã tồn tại."

    def add_arguments(self, parser):
        parser.add_argument("--database", default=DEFAULT_DB_ALIAS)

    def handle(self, *args, **options):
        using = options["database"]
        user_model = get_user_model()
        admin = user_model._default_manager.db_manager(using).filter(
            **{user_model.USERNAME_FIELD: "admin"}
        ).first()
        if admin is None:
            raise CommandError("Chưa có tài khoản admin; chưa thể tạo Hồ sơ chung.")

        try:
            with transaction.atomic(using=using):
                if HoSo.objects.using(using).filter(is_he_thong=True).exists():
                    self.stdout.write("Hồ sơ chung đã tồn tại.")
                    return
                if HoSo.objects.using(using).filter(so_ky_hieu="HSC").exists():
                    raise CommandError("Mã HSC đã tồn tại nhưng chưa là hồ sơ hệ thống; cần kiểm tra dữ liệu.")
                HoSo(
                    stt_uu_tien=1,
                    so_ky_hieu="HSC",
                    ten_ho_so="Hồ sơ chung",
                    nguoi_lap=admin,
                    is_he_thong=True,
                    ghi_chu="Hồ sơ chung mặc định của hệ thống - không được xóa",
                ).save(using=using)
        except IntegrityError as exc:
            raise CommandError("Không thể tạo Hồ sơ chung (có thể STT 1 đã được sử dụng).") from exc
        self.stdout.write(self.style.SUCCESS("Đã tạo Hồ sơ chung."))
