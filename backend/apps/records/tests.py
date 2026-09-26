from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase

from records.models import HoSo, LoaiVanBan


class RecordsModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.user = user_model._default_manager.create_user(username="admin", password="test-only")

    def test_priority_is_assigned_in_order(self):
        first = HoSo.objects.create(so_ky_hieu="A", ten_ho_so="A", nguoi_lap=self.user)
        second = HoSo.objects.create(so_ky_hieu="B", ten_ho_so="B", nguoi_lap=self.user)
        self.assertEqual([first.stt_uu_tien, second.stt_uu_tien], [1, 2])

    def test_system_dossier_seed_is_idempotent_and_protected(self):
        call_command("ensure_common_hoso", verbosity=0)
        call_command("ensure_common_hoso", verbosity=0)
        self.assertEqual(HoSo.objects.filter(is_he_thong=True).count(), 1)
        dossier = HoSo.objects.get(is_he_thong=True)
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                HoSo.objects.filter(pk=dossier.pk).delete()
        self.assertTrue(HoSo.objects.filter(pk=dossier.pk).exists())

    def test_document_type_names_are_unique_per_dossier_after_trim_and_lower(self):
        dossier = HoSo.objects.create(so_ky_hieu="A", ten_ho_so="A", nguoi_lap=self.user)
        LoaiVanBan.objects.create(ho_so=dossier, ten_loai="Quyết định")
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                LoaiVanBan.objects.create(ho_so=dossier, ten_loai=" quyết định ")
