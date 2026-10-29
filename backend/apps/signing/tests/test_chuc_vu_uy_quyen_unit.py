from types import SimpleNamespace

from django.test import SimpleTestCase

from signing.services.uy_quyen import chuc_vu_goc


class ChucVuUyQuyenTests(SimpleTestCase):
    def test_preserves_original_snapshot_for_redelegation(self):
        dong = SimpleNamespace(chuc_vu_goc_uy_quyen_id=12, uy_quyen_tu_id=1,
                               uy_quyen_tu=SimpleNamespace(chuc_vu_id=13), chuc_vu_id=14,
                               nguoi_ky=SimpleNamespace(chuc_vu_id=15))
        self.assertEqual(chuc_vu_goc(dong), 12)

    def test_legacy_delegation_without_original_snapshot_fails_closed(self):
        dong = SimpleNamespace(chuc_vu_goc_uy_quyen_id=None, uy_quyen_tu_id=1,
                               uy_quyen_tu=SimpleNamespace(chuc_vu_id=13), chuc_vu_id=14,
                               nguoi_ky=SimpleNamespace(chuc_vu_id=15))
        self.assertIsNone(chuc_vu_goc(dong))

    def test_signer_without_position_snapshot_fails_closed(self):
        dong = SimpleNamespace(chuc_vu_goc_uy_quyen_id=None, uy_quyen_tu_id=None, chuc_vu_id=None,
                               nguoi_ky=SimpleNamespace(chuc_vu_id=15))
        self.assertIsNone(chuc_vu_goc(dong))
