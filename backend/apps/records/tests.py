from datetime import datetime, timezone
from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import DatabaseError, IntegrityError, transaction
from django.test import TestCase

from records.models import HoSo, LoaiVanBan
from records.document_queries import DocumentDataUnavailable


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
            with self.assertRaises(DatabaseError):
                HoSo.objects.filter(pk=dossier.pk).delete()
        self.assertTrue(HoSo.objects.filter(pk=dossier.pk).exists())

    def test_system_dossier_flag_cannot_be_lowered(self):
        call_command("ensure_common_hoso", verbosity=0)
        dossier = HoSo.objects.get(is_he_thong=True)

        dossier.is_he_thong = False
        with self.assertRaises(ValueError):
            dossier.save(update_fields=["is_he_thong"])

        dossier.refresh_from_db()
        self.assertTrue(dossier.is_he_thong)

        with transaction.atomic():
            with self.assertRaises(DatabaseError):
                HoSo.objects.filter(pk=dossier.pk).update(is_he_thong=False)

        dossier.refresh_from_db()
        self.assertTrue(dossier.is_he_thong)

    def test_model_normalizes_codes_and_document_type_names(self):
        dossier = HoSo.objects.create(
            so_ky_hieu="  HS-TRIM  ",
            ten_ho_so="Hồ sơ chuẩn hóa",
            nguoi_lap=self.user,
        )
        document_type = LoaiVanBan.objects.create(
            ho_so=dossier,
            ten_loai="  Quyết định  ",
        )

        self.assertEqual(dossier.so_ky_hieu, "HS-TRIM")
        self.assertEqual(document_type.ten_loai, "Quyết định")

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                HoSo.objects.create(
                    so_ky_hieu=" HS-TRIM ",
                    ten_ho_so="Hồ sơ trùng",
                    nguoi_lap=self.user,
                )

    def test_model_rejects_blank_codes_and_document_type_names(self):
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                HoSo.objects.create(
                    so_ky_hieu="   ",
                    ten_ho_so="Hồ sơ không hợp lệ",
                    nguoi_lap=self.user,
                )

        dossier = HoSo.objects.create(
            so_ky_hieu="HS-VALID",
            ten_ho_so="Hồ sơ hợp lệ",
            nguoi_lap=self.user,
        )
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                LoaiVanBan.objects.create(ho_so=dossier, ten_loai="   ")

    def test_document_type_names_are_unique_per_dossier_after_trim_and_lower(self):
        dossier = HoSo.objects.create(so_ky_hieu="A", ten_ho_so="A", nguoi_lap=self.user)
        LoaiVanBan.objects.create(ho_so=dossier, ten_loai="Quyết định")
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                LoaiVanBan.objects.create(ho_so=dossier, ten_loai=" quyết định ")

class RecordsApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model._default_manager.create_user(
            username="api-user",
            password="test-only",
        )
        self.client.force_authenticate(user=self.user)
        self.dossier_list_url = reverse(
            "records:dossier-list-create"
        )

    def create_dossier(self, **overrides):
        data = {
            "so_ky_hieu": "HS-001",
            "ten_ho_so": "Hồ sơ kiểm thử",
            "nguoi_lap": self.user,
            "ngay_lap": datetime(
                2026,
                9,
                30,
                tzinfo=timezone.utc,
            ),
        }
        data.update(overrides)
        return HoSo.objects.create(**data)

    def test_authentication_is_required(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.dossier_list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_dossier_rejects_blank_code(self):
        response = self.client.post(
            self.dossier_list_url,
            {
                "so_ky_hieu": "   ",
                "ten_ho_so": "Hồ sơ không hợp lệ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("so_ky_hieu", response.data)

    def test_dossier_crud_and_response_contract(self):
        create_response = self.client.post(
            self.dossier_list_url,
            {
                "stt_uu_tien": None,
                "so_ky_hieu": " HS-API-001 ",
                "ten_ho_so": " Hồ sơ API ",
                "ngay_lap": "2026-09-30",
                "ghi_chu": "",
            },
            format="json",
        )

        self.assertEqual(
            create_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            create_response.data["so_ky_hieu"],
            "HS-API-001",
        )
        self.assertEqual(
            create_response.data["nguoi_lap"],
            "api-user",
        )

        dossier_id = create_response.data["id"]
        detail_url = reverse(
            "records:dossier-detail",
            args=[dossier_id],
        )

        detail_response = self.client.get(detail_url)
        self.assertEqual(
            detail_response.status_code,
            status.HTTP_200_OK,
        )

        update_response = self.client.patch(
            detail_url,
            {"ten_ho_so": "Hồ sơ API đã sửa"},
            format="json",
        )
        self.assertEqual(
            update_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            update_response.data["ten_ho_so"],
            "Hồ sơ API đã sửa",
        )

        delete_response = self.client.delete(detail_url)
        self.assertEqual(
            delete_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

    def test_list_supports_search_year_and_pagination(self):
        self.create_dossier(
            so_ky_hieu="HS-2025",
            ten_ho_so="Hồ sơ năm 2025",
            ngay_lap=datetime(
                2025,
                1,
                1,
                tzinfo=timezone.utc,
            ),
        )
        self.create_dossier(
            so_ky_hieu="HS-2026",
            ten_ho_so="Hồ sơ năm 2026",
        )

        response = self.client.get(
            self.dossier_list_url,
            {
                "search": "2025",
                "year": "2025",
                "page_size": 1,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["so_ky_hieu"],
            "HS-2025",
        )

    def test_system_dossier_cannot_be_deleted(self):
        dossier = self.create_dossier(
            so_ky_hieu="HSC",
            ten_ho_so="Hồ sơ chung",
            is_he_thong=True,
        )

        response = self.client.delete(
            reverse(
                "records:dossier-detail",
                args=[dossier.pk],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_409_CONFLICT,
        )
        self.assertTrue(
            HoSo.objects.filter(pk=dossier.pk).exists()
        )

    def test_dossier_with_document_types_cannot_be_deleted(self):
        dossier = self.create_dossier()
        LoaiVanBan.objects.create(
            ho_so=dossier,
            ten_loai="Quyết định",
        )

        response = self.client.delete(
            reverse(
                "records:dossier-detail",
                args=[dossier.pk],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_409_CONFLICT,
        )

    def test_document_type_crud_and_duplicate_validation(self):
        dossier = self.create_dossier()

        list_url = reverse(
            "records:document-type-list-create",
            args=[dossier.pk],
        )

        create_response = self.client.post(
            list_url,
            {
                "ten_loai": " Quyết định ",
                "ngay_lap": "2026-09-30",
                "ghi_chu": "",
            },
            format="json",
        )

        self.assertEqual(
            create_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            create_response.data["ten_loai"],
            "Quyết định",
        )
        self.assertEqual(
            create_response.data["ho_so"],
            dossier.pk,
        )

        duplicate_response = self.client.post(
            list_url,
            {
                "ten_loai": " quyết ĐỊNH ",
                "ngay_lap": None,
                "ghi_chu": "",
            },
            format="json",
        )
        self.assertEqual(
            duplicate_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        document_type_id = create_response.data["id"]
        detail_url = reverse(
            "records:document-type-detail",
            args=[document_type_id],
        )

        update_response = self.client.patch(
            detail_url,
            {"ten_loai": "Thông báo"},
            format="json",
        )
        self.assertEqual(
            update_response.status_code,
            status.HTTP_200_OK,
        )

        delete_response = self.client.delete(detail_url)
        self.assertEqual(
            delete_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

    def test_document_type_rejects_blank_name(self):
        dossier = self.create_dossier()
        response = self.client.post(
            reverse(
                "records:document-type-list-create",
                args=[dossier.pk],
            ),
            {"ten_loai": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ten_loai", response.data)

    @patch("records.views.query_dossier_documents")
    def test_dossier_document_list_contract_and_filters(self, query_documents):
        dossier = self.create_dossier()
        query_documents.return_value = (
            1,
            [{
                "key": "vanbanden:17",
                "id": 17,
                "document_type": "vanbanden",
                "so_hieu": "17/CV-TLBM",
                "trich_yeu": "Thông báo kiểm thử",
                "ngay_van_ban": datetime(2026, 10, 4, tzinfo=timezone.utc),
                "nam": 2026,
            }],
        )
        response = self.client.get(
            reverse("records:dossier-document-list", args=[dossier.pk]),
            {
                "search": "Thông báo",
                "year": "2026",
                "type": "vanbanden",
                "page": "1",
                "page_size": "10",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["key"], "vanbanden:17")
        query_documents.assert_called_once_with(
            dossier_id=dossier.pk,
            user=self.user,
            search="Thông báo",
            year=2026,
            document_type="vanbanden",
            page=1,
            page_size=10,
        )

    @patch("records.views.query_dossier_documents")
    def test_dossier_document_list_validates_filters(self, query_documents):
        dossier = self.create_dossier()
        response = self.client.get(
            reverse("records:dossier-document-list", args=[dossier.pk]),
            {"type": "khong-hop-le", "page": "0"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("type", response.data)
        self.assertIn("page", response.data)
        query_documents.assert_not_called()

    @patch("records.views.query_dossier_documents")
    def test_dossier_document_list_reports_missing_shared_schema(self, query_documents):
        dossier = self.create_dossier()
        query_documents.side_effect = DocumentDataUnavailable("documents_vanbanden")
        response = self.client.get(
            reverse("records:dossier-document-list", args=[dossier.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    @patch("records.views.query_dossier_documents")
    def test_dossier_document_list_requires_authentication(self, query_documents):
        dossier = self.create_dossier()
        self.client.force_authenticate(user=None)
        response = self.client.get(
            reverse("records:dossier-document-list", args=[dossier.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        query_documents.assert_not_called()
