from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from documents.models import PhamVi, VanBanDen, VanBanDi


class ReleaseDashboardTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.owner = user_model.objects.create_user(username="document-owner")
        cls.viewer = user_model.objects.create_user(username="document-viewer")
        cls.admin = user_model.objects.create_superuser(username="dashboard-admin")
        now = timezone.now()
        cls.incoming = VanBanDen.objects.create(
            so_hieu="INTERNAL-IN", trich_yeu="Internal incoming", ngay_den=now,
            nguoi_tao=cls.owner, noi_ban_hanh="Issuing unit",
        )
        cls.private_incoming = VanBanDen.objects.create(
            so_hieu="RESTRICTED-IN", trich_yeu="Restricted incoming", ngay_den=now,
            nguoi_tao=cls.owner, pham_vi=PhamVi.HAN_CHE,
        )
        cls.outgoing = VanBanDi.objects.create(
            so_hieu="INTERNAL-OUT", trich_yeu="Internal outgoing", ngay_ban_hanh=now,
            nguoi_tao=cls.owner,
        )
        cls.private_outgoing = VanBanDi.objects.create(
            so_hieu="RESTRICTED-OUT", trich_yeu="Restricted outgoing", ngay_ban_hanh=now,
            nguoi_tao=cls.owner, pham_vi=PhamVi.HAN_CHE,
        )
        cls.private_outgoing.nguoi_nhan.add(cls.viewer)

    def setUp(self):
        self.client = APIClient()
        # Release databases have canonical documents tables without sample
        # dashboard tables. Simulate that inventory on the isolated test DB.
        release_tables = [
            name for name in connection.introspection.table_names()
            if not name.startswith("dashboard_")
        ]
        inventory = patch(
            "dashboard.views.connection.introspection.table_names",
            return_value=release_tables,
        )
        inventory.start()
        self.addCleanup(inventory.stop)

    def overview(self, user):
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, 200)
        return response.data

    def test_release_uses_canonical_documents_without_legacy_tables(self):
        data = self.overview(self.owner)
        self.assertEqual(data["kpis"]["incomingCount"], 2)
        self.assertEqual(data["kpis"]["outgoingCount"], 2)
        self.assertEqual(data["kpis"]["confidentialCount"], 2)
        self.assertEqual(data["meetingRooms"], [])
        self.assertEqual(data["recentIncoming"], data["recent_incoming"])
        self.assertEqual(data["recentOutgoing"], data["recent_outgoing"])

    def test_recipient_can_see_only_allowed_restricted_documents(self):
        data = self.overview(self.viewer)
        self.assertEqual(data["kpis"]["incomingCount"], 1)
        self.assertEqual(data["kpis"]["outgoingCount"], 2)
        self.assertEqual(data["kpis"]["confidentialCount"], 1)
        self.assertNotIn("RESTRICTED-IN", [item["code"] for item in data["recentIncoming"]])
        restricted = next(item for item in data["recentOutgoing"] if item["code"] == "RESTRICTED-OUT")
        self.assertEqual(restricted["recipient"], self.viewer.ho_ten)

    def test_superuser_cannot_bypass_restricted_document_acl(self):
        data = self.overview(self.admin)
        self.assertEqual(data["kpis"]["incomingCount"], 1)
        self.assertEqual(data["kpis"]["outgoingCount"], 1)
        self.assertEqual(data["kpis"]["confidentialCount"], 0)
        self.assertEqual([item["code"] for item in data["recentIncoming"]], ["INTERNAL-IN"])
        self.assertEqual([item["code"] for item in data["recentOutgoing"]], ["INTERNAL-OUT"])

    def test_hidden_internal_document_is_excluded_for_normal_user(self):
        self.incoming.hien_thi = False
        self.incoming.save(update_fields=["hien_thi"])
        data = self.overview(self.viewer)
        self.assertEqual(data["kpis"]["incomingCount"], 0)
        self.assertEqual(data["recentIncoming"], [])
