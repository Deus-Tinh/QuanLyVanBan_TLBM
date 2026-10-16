"""
Email thông báo người trong luồng ký (signing/email.py): chỉ gửi sau commit, rollback thì không gửi,
người không có email bị bỏ qua, mở cấp kế tiếp báo đúng người, từ chối báo người tạo; bản ghi
signing_notification (IN_APP/EMAIL) và trạng thái DA_GUI/THAT_BAI.
"""

from unittest import mock

from django.contrib.auth import get_user_model
from django.core import mail
from django.db import transaction
from django.test import TestCase, override_settings

from signing import email as thong_bao
from signing import enums
from signing.models import SigningNotification

from .test_hanh_dong_ky_phase8 import KyBase

User = get_user_model()


class GuiMailTests(TestCase):
    def setUp(self):
        self.co_email = User.objects.create_user("co_email", email="nhan@vidu.test")
        self.khong_email = User.objects.create_user("khong_email")

    def test_sends_only_after_commit(self):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            thong_bao.gui_mail_sau_commit([self.co_email], "Tiêu đề", "Nội dung")
            self.assertEqual(len(mail.outbox), 0)  # chưa commit thì chưa gửi
        self.assertEqual(len(callbacks), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "[QLVB] Tiêu đề")
        self.assertEqual(mail.outbox[0].to, ["nhan@vidu.test"])

    def test_rollback_does_not_send(self):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            try:
                with transaction.atomic():
                    thong_bao.gui_mail_sau_commit([self.co_email], "Tiêu đề", "Nội dung")
                    raise RuntimeError("rollback")
            except RuntimeError:
                pass
        self.assertEqual(callbacks, [])
        self.assertEqual(len(mail.outbox), 0)

    def test_recipient_without_email_is_skipped(self):
        with self.assertLogs("signing.email", "WARNING"):
            self.assertEqual(thong_bao.gui_mail([self.khong_email], "Tiêu đề", "Nội dung"), 0)
        self.assertEqual(thong_bao.gui_mail([self.co_email, self.khong_email], "Tiêu đề", "Nội dung"), 1)
        self.assertEqual(mail.outbox[0].to, ["nhan@vidu.test"])

    def test_send_error_is_logged_not_raised(self):
        with mock.patch("signing.email.send_mail", side_effect=OSError("smtp down")), \
                self.assertLogs("signing.email", "ERROR"):
            self.assertEqual(thong_bao.gui_mail([self.co_email], "Tiêu đề", "Nội dung"), 0)


@override_settings(FRONTEND_URL="http://qlvb.test")
class ThongBaoLuongKyTests(KyBase):
    """Quy trình mẫu: cấp 1 ky1 (ký nháy chặn) + ky2 (ký chính); cấp 2 ky3."""

    def setUp(self):
        with self.captureOnCommitCallbacks(execute=True):
            super().setUp()

    def _gan_email(self):
        for user in (self.tao, self.ky1, self.ky2, self.ky3):
            User.objects.filter(pk=user.pk).update(email=f"{user.username}@vidu.test")

    def thu_cua(self, user):
        return [m for m in mail.outbox if m.to == [f"{user.username}@vidu.test"]]

    def ky_va_gui(self, user):
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            r = self.ky(user)
        self.assertEqual(r.status_code, 200, r.data)
        return r

    def test_users_without_email_get_in_app_only(self):
        # KyBase gửi hồ sơ khi người ký chưa có email: chỉ có bản ghi IN_APP, không có email
        self.assertEqual(len(mail.outbox), 0)
        ban_ghi = SigningNotification.objects.filter(trinh_ky_id=self.pk)
        self.assertEqual(set(ban_ghi.values_list("kenh", flat=True)), {enums.KenhThongBao.IN_APP})
        self.assertEqual(ban_ghi.get().nguoi_nhan_id, self.ky1.pk)  # chỉ ký nháy chặn được mở

    def test_sequential_next_level_signer_gets_exactly_one_email(self):
        self._gan_email()
        self.ky_va_gui(self.ky1)  # mở ký chính cùng cấp
        self.assertEqual(len(self.thu_cua(self.ky2)), 1)
        self.ky_va_gui(self.ky2)  # cấp 1 xong: mở cấp 2
        self.assertEqual(len(mail.outbox), 1)
        thu = self.thu_cua(self.ky3)
        self.assertEqual(len(thu), 1)
        self.assertTrue(thu[0].subject.startswith("[QLVB] Đến lượt bạn ký: #"))
        self.assertIn(f"http://qlvb.test/approvals/{self.pk}", thu[0].body)
        self.assertIn("Hạn xử lý: ", thu[0].body)  # cấp 2 có so_gio_xu_ly
        email = SigningNotification.objects.get(nguoi_nhan=self.ky3, kenh=enums.KenhThongBao.EMAIL)
        self.assertEqual((email.trang_thai, email.loai_thong_bao), (enums.TrangThaiThongBao.DA_GUI, "DEN_LUOT_KY"))
        self.assertIsNotNone(email.thoi_diem_gui)
        self.ky_va_gui(self.ky3)  # hoàn thành: người tạo nhận email
        tieu_de = [m.subject for m in self.thu_cua(self.tao)]
        self.assertEqual(tieu_de, [f"[QLVB] Hồ sơ #{self.pk} (10/QD) đã hoàn thành"])  # số hiệu văn bản mẫu

    def test_reject_notifies_creator(self):
        self._gan_email()
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            r = self.hanh_dong(self.ky1, "tu-choi", ly_do_tu_choi="Sai số liệu")
        self.assertEqual(r.status_code, 200, r.data)
        thu = self.thu_cua(self.tao)
        self.assertEqual(len(thu), 1)
        self.assertIn("bị từ chối", thu[0].subject)
        self.assertIn("Ghi chú: Sai số liệu", thu[0].body)

    def test_request_changes_notifies_creator(self):
        self._gan_email()
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            r = self.hanh_dong(self.ky1, "yeu-cau-sua", tieu_de="Sửa", ly_do="Thiếu phụ lục")
        self.assertEqual(r.status_code, 200, r.data)
        thu = self.thu_cua(self.tao)
        self.assertEqual(len(thu), 1)
        self.assertIn("cần chỉnh sửa", thu[0].subject)

    def test_failed_send_marks_record_failed(self):
        self._gan_email()
        with mock.patch("signing.email.send_mail", side_effect=OSError("smtp down")), \
                self.assertLogs("signing.email", "ERROR"):
            self.ky_va_gui(self.ky1)
        email = SigningNotification.objects.get(nguoi_nhan=self.ky2, kenh=enums.KenhThongBao.EMAIL)
        self.assertEqual(email.trang_thai, enums.TrangThaiThongBao.THAT_BAI)
        self.assertIn("smtp down", email.loi_gui)
        self.assertFalse(thong_bao.gui_thong_bao_email(email.pk))  # không gửi lại bản ghi đã xử lý

    def test_rollback_creates_no_record_and_sends_nothing(self):
        self._gan_email()
        mail.outbox.clear()
        with mock.patch("signing.services.hanh_dong_ky.ghi_nhat_ky", side_effect=RuntimeError("loi")):
            with self.captureOnCommitCallbacks(execute=True), self.assertRaises(RuntimeError):
                self.ky(self.ky1)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(SigningNotification.objects.filter(nguoi_nhan=self.ky2).exists())
