"""Lệnh `tao_du_lieu_mau_trinh_ky`: đủ trạng thái hồ sơ, lịch sử, thông báo; chạy lại không nhân bản."""

import io
import os
import shutil
import tempfile
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings

from signing import enums
from signing.models import (
    SigningAttempt, SigningAuditLog, SigningKey, SigningNotification, SigningProcess, SigningRequest,
    SigningRequestStepSigner,
)
from signing.services import trinh_ky

from .helpers import tao_don_vi

User = get_user_model()
MAT_KHAU = "mat-khau-thu-nghiem-1"


def chay(test, *args, **env):
    """Chạy lệnh; tác vụ sau commit (gửi email, tạo tệp hoàn tất) được thực thi như khi chạy thật."""
    out = io.StringIO()
    with mock.patch.dict(os.environ, env, clear=False), test.captureOnCommitCallbacks(execute=True):
        call_command("tao_du_lieu_mau_trinh_ky", *args, stdout=out)
    return out.getvalue()


class DuLieuMauTests(TestCase):
    def setUp(self):
        self.thu_muc = tempfile.mkdtemp()
        self._cai_dat = override_settings(SIGNING_DOCUMENT_ROOT=self.thu_muc)
        self._cai_dat.enable()
        tao_don_vi()

    def tearDown(self):
        self._cai_dat.disable()
        shutil.rmtree(self.thu_muc, ignore_errors=True)

    def ho_so(self, ma):
        return SigningRequest.objects.get(ghi_chu__startswith=f"Dữ liệu mẫu {ma}:", ho_so_goc__isnull=True)

    def test_requires_demo_password_to_create_accounts(self):
        with mock.patch.dict(os.environ, {"DEMO_PASSWORD": ""}):
            with self.assertRaisesMessage(CommandError, "DEMO_PASSWORD"):
                call_command("tao_du_lieu_mau_trinh_ky", stdout=io.StringIO())
        self.assertFalse(SigningRequest.objects.exists())

    def test_creates_all_states_and_is_idempotent(self):
        chay(self, DEMO_PASSWORD=MAT_KHAU)
        for username in ("vanthu", "chuyenvien", "truongphong", "giamdoc"):  # admin đã có sẵn: giữ mật khẩu
            self.assertTrue(User.objects.get(username=username).check_password(MAT_KHAU), username)
        self.assertEqual(SigningProcess.objects.filter(ma_quy_trinh__startswith="QT-TK-").count(), 4)
        self.assertEqual(SigningProcess.objects.filter(ma_quy_trinh="QT-TK-NHAP").get().trang_thai, "NHAP")

        tt = enums.TrangThaiYeuCau
        mong_doi = {"M01": tt.NHAP, "M02": tt.CHO_KY, "M03": tt.CHO_KY, "M04": tt.HOAN_THANH, "M05": tt.TU_CHOI,
                    "M06": tt.CHO_KY, "M07": tt.CHO_KY, "M08": tt.HUY, "M09": tt.CHO_KY, "M10": tt.CHO_KY}
        for ma, trang_thai in mong_doi.items():
            self.assertEqual(self.ho_so(ma).trang_thai, trang_thai, ma)
        # Trả sửa, sửa xong trình lượt 2, trình lại sau từ chối
        self.assertEqual(trinh_ky.luot_hien_hanh(self.ho_so("M06")).trang_thai, "YEU_CAU_SUA")
        self.assertEqual(trinh_ky.luot_hien_hanh(self.ho_so("M07")).so_luot, 2)
        self.assertEqual(SigningRequest.objects.filter(ho_so_goc=self.ho_so("M05"), trang_thai="NHAP").count(), 1)
        # Hoàn tất có tệp hoàn tất; ủy quyền ghi người giao
        self.assertEqual(trinh_ky.luot_hien_hanh(self.ho_so("M04")).trang_thai_tep_hoan_tat, "THANH_CONG")
        dong = SigningRequestStepSigner.objects.get(buoc_ky__luot_trinh__trinh_ky=self.ho_so("M10"),
                                                    uy_quyen_tu__username="truongphong")
        self.assertEqual(dong.nguoi_ky.username, "giamdoc")
        # Người dùng thấy hồ sơ ở hộp "cần tôi ký"
        giamdoc, truongphong = User.objects.get(username="giamdoc"), User.objects.get(username="truongphong")
        self.assertIn(self.ho_so("M03"), trinh_ky.dang_cho_toi_ky(giamdoc))
        self.assertIn(self.ho_so("M10"), trinh_ky.dang_cho_toi_ky(giamdoc))
        self.assertIn(self.ho_so("M02"), trinh_ky.dang_cho_toi_ky(truongphong))
        # Lịch sử và thông báo tương ứng
        self.assertTrue(SigningAuditLog.objects.filter(trinh_ky=self.ho_so("M10"), hanh_dong="UY_QUYEN_KY").exists())
        loai = set(SigningNotification.objects.values_list("loai_thong_bao", flat=True))
        self.assertTrue({"CAN_KY", "HOAN_THANH", "TU_CHOI", "YEU_CAU_SUA", "HUY", "UY_QUYEN", "TIN_NHAN",
                         "QUA_HAN"} <= loai, loai)
        # Khóa tạm đã thu hồi: không ai còn khóa hoạt động do lệnh tạo
        self.assertFalse(SigningKey.objects.filter(trang_thai=enums.TrangThaiKhoa.HOAT_DONG).exists())

        dem = (SigningRequest.objects.count(), SigningAttempt.objects.count(), SigningNotification.objects.count(),
               SigningKey.objects.count(), User.objects.count())
        out = chay(self, DEMO_PASSWORD="")  # chạy lại: tài khoản đã có nên không cần mật khẩu, không tạo thêm gì
        self.assertIn("0 hồ sơ mẫu mới", out)
        self.assertEqual(dem, (SigningRequest.objects.count(), SigningAttempt.objects.count(),
                               SigningNotification.objects.count(), SigningKey.objects.count(), User.objects.count()))
        self.assertTrue(User.objects.get(username="vanthu").check_password(MAT_KHAU))

    def test_existing_admin_password_is_kept(self):
        admin = User.objects.filter(username="admin").first() or User.objects.create_user("admin", is_superuser=True)
        admin.set_password("mat-khau-quan-tri")
        admin.save()
        chay(self, DEMO_PASSWORD=MAT_KHAU)
        chay(self, "--dat-lai-mat-khau", DEMO_PASSWORD="mat-khau-moi-2")
        self.assertTrue(User.objects.get(username="admin").check_password("mat-khau-quan-tri"))
        self.assertTrue(User.objects.get(username="giamdoc").check_password("mat-khau-moi-2"))
