"""Lệnh tao_tai_khoan_demo: đúng 5 tài khoản quy định, mật khẩu lấy từ DEMO_PASSWORD, chạy lặp không tạo trùng."""

import os
from io import StringIO
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.test import TestCase

User = get_user_model()
TEN_DEMO = {"admin", "vanthu", "chuyenvien", "truongphong", "giamdoc"}
MAT_KHAU = "mat-khau-kiem-thu"


class TaoTaiKhoanDemoTests(TestCase):
    def chay(self, mat_khau=MAT_KHAU, **kw):
        with mock.patch.dict(os.environ, {"DEMO_PASSWORD": mat_khau}):
            call_command("tao_tai_khoan_demo", stdout=StringIO(), **kw)

    def test_missing_password_raises(self):
        with self.assertRaises(CommandError):
            self.chay("")
        self.assertFalse(User.objects.filter(username__in=TEN_DEMO).exists())

    def test_creates_five_accounts_idempotently(self):
        self.chay(email_domain="vidu.test")
        self.chay(email_domain="vidu.test")
        users = {u.username: u for u in User.objects.filter(username__in=TEN_DEMO)}
        self.assertEqual(set(users), TEN_DEMO)
        self.assertTrue(all(u.check_password(MAT_KHAU) for u in users.values()))
        self.assertTrue(users["admin"].is_superuser and users["admin"].is_staff)
        self.assertFalse(any(users[t].is_staff for t in TEN_DEMO - {"admin"}))
        self.assertEqual(users["giamdoc"].ho_ten, "Giám đốc")
        self.assertEqual(users["vanthu"].email, "vanthu@vidu.test")
        self.assertEqual(users["truongphong"].groups.get().name, "Trưởng phòng")
