import os
import socket
import threading
import uuid
from datetime import date
from smtplib import SMTPConnectError
from unittest.mock import patch

from django import forms
from django.contrib import admin
from django.contrib.auth.models import User
from django.core import mail
from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection, transaction
from django.test import RequestFactory, TestCase, TransactionTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import StaffProfile
from birthdays.admin import BirthdayEmailLogAdmin
from birthdays.models import BirthdayEmailLog, BirthdayEmailStatus
from birthdays.services import generate_birthday_email_html, is_birthday_on_date, send_automated_birthday_emails


class BirthdaySystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Người dùng thường
        self.user_staff = User.objects.create_user(
            username="staff1", password="password123", email="staff1@itc.edu.vn"
        )
        self.profile_staff = StaffProfile.objects.create(
            user=self.user_staff,
            full_name="Nguyễn Văn An",
            department="Khoa CNTT",
            position="Giảng viên",
            role="staff",
            birthday=date(1990, 5, 20),
        )

        # Quản trị viên
        self.user_admin = User.objects.create_superuser(
            username="admin1", password="password123", email="admin1@itc.edu.vn"
        )
        self.profile_admin = StaffProfile.objects.create(
            user=self.user_admin,
            full_name="Trần Thị Bình",
            department="Ban Giám hiệu",
            position="Phó Hiệu trưởng",
            role="admin",
            birthday=date(1985, 5, 20),
        )

        # Người sinh ngày 29/02
        self.user_leap = User.objects.create_user(
            username="leapuser", password="password123", email="leap@itc.edu.vn"
        )
        self.profile_leap = StaffProfile.objects.create(
            user=self.user_leap,
            full_name="Lê Nhuận",
            department="Phòng Đào tạo",
            position="Chuyên viên",
            role="staff",
            birthday=date(1996, 2, 29),
        )

    def test_leap_year_handling(self):
        """Kiểm tra xử lý ngày 29/02 trong năm nhuận và năm không nhuận."""
        birth_29_feb = date(1996, 2, 29)

        # Năm nhuận 2024: đúng ngày 29/02 là True
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2024, 2, 29)))

        # Mặc định theo quy tắc FEB_28: sinh 29/02 thì mừng ngày 28/02 trong năm không nhuận.
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2025, 2, 28)))
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 3, 1)))

        # Năm không nhuận 2025: quy tắc FEB_28
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2025, 2, 28), leap_year_strategy="FEB_28"))
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 3, 1), leap_year_strategy="FEB_28"))

        # Năm không nhuận 2025: quy tắc MAR_01
        self.assertTrue(is_birthday_on_date(birth_29_feb, date(2025, 3, 1), leap_year_strategy="MAR_01"))

        # Quy tắc SKIP: không tự chuyển ngày trong năm không nhuận.
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 2, 28), leap_year_strategy="SKIP"))
        self.assertFalse(is_birthday_on_date(birth_29_feb, date(2025, 3, 1), leap_year_strategy="SKIP"))

    def test_calendar_api_privacy(self):
        """Lịch chỉ trả số lượng theo ngày, không trả thông tin CBNV."""
        self.client.force_authenticate(user=self.user_staff)
        url = reverse("birthdays:calendar")
        response = self.client.get(url, {"month": 5, "year": 2026})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("20", data["days"])

        self.assertEqual(data["days"]["20"], 2)
        self.assertEqual(data["total_staff"], 2)
        self.assertNotIn("employees", data)

    def test_calendar_api_admin_sees_counts_only(self):
        """Cả tài khoản quản trị cũng nhận hợp đồng lịch chỉ có số lượng."""
        self.client.force_authenticate(user=self.user_admin)
        url = reverse("birthdays:calendar")
        response = self.client.get(url, {"month": 5, "year": 2026})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["days"]["20"], 2)
        self.assertNotIn("employees", data)

    def test_day_birthdays_api_pagination(self):
        """Kiểm tra API danh sách sinh nhật theo ngày có phân trang."""
        self.client.force_authenticate(user=self.user_staff)
        url = reverse("birthdays:day_birthdays")
        response = self.client.get(url, {"month": 5, "day": 20, "year": 2026, "page": 1, "page_size": 1})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total"], 2)
        self.assertEqual(len(data["employees"]), 1)
        self.assertTrue(data["has_next"])
        self.assertEqual(
            set(data["employees"][0]),
            {"id", "ho_ten", "ngay", "thang", "chuc_vu", "don_vi"},
        )
        self.assertEqual(data["employees"][0]["id"], self.profile_admin.id)

    def test_send_automated_birthday_emails_idempotency(self):
        """Kiểm tra gửi email tự động và tính chất chống gửi trùng lặp (idempotency)."""
        target_date = date(2026, 5, 20)

        # Lượt 1: Gửi thành công cho 2 nhân sự
        results1 = send_automated_birthday_emails(target_date=target_date, allow_test_email_backend=True)
        self.assertEqual(results1["sent_count"], 2)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(BirthdayEmailLog.objects.filter(status=BirthdayEmailStatus.SUCCESS).count(), 2)

        # Lượt 2: Chạy lại cùng ngày phải bỏ qua, không gửi trùng.
        mail.outbox.clear()
        results2 = send_automated_birthday_emails(target_date=target_date, allow_test_email_backend=True)
        self.assertEqual(results2["sent_count"], 0)
        self.assertEqual(results2["skipped_count"], 2)
        self.assertEqual(len(mail.outbox), 0)

    def test_inactive_staff_is_excluded_from_calendar_and_day(self):
        self.user_admin.is_active = False
        self.user_admin.save(update_fields=["is_active"])
        self.client.force_authenticate(user=self.user_staff)

        calendar_response = self.client.get(reverse("birthdays:calendar"), {"month": 5, "year": 2026})
        day_response = self.client.get(
            reverse("birthdays:day_birthdays"), {"month": 5, "day": 20, "year": 2026}
        )
        self.assertEqual(calendar_response.json()["days"]["20"], 1)
        self.assertEqual(day_response.json()["total"], 1)
        self.assertEqual(day_response.json()["employees"][0]["id"], self.profile_staff.id)

    def test_birthday_api_requires_authentication(self):
        self.assertEqual(self.client.get(reverse("birthdays:calendar")).status_code, 401)
        self.assertEqual(self.client.get(reverse("birthdays:day_birthdays")).status_code, 401)

    def test_day_api_rejects_invalid_date_and_page_size(self):
        self.client.force_authenticate(user=self.user_staff)
        url = reverse("birthdays:day_birthdays")
        self.assertEqual(self.client.get(url, {"month": 2, "day": 30, "year": 2025}).status_code, 400)
        self.assertEqual(self.client.get(url, {"month": 5, "day": 20, "year": 2026, "page_size": 51}).status_code, 400)

    def test_non_leap_february_29_is_observed_on_february_28(self):
        self.client.force_authenticate(user=self.user_staff)
        response = self.client.get(reverse("birthdays:calendar"), {"month": 2, "year": 2025})
        day_response = self.client.get(
            reverse("birthdays:day_birthdays"), {"month": 2, "day": 28, "year": 2025}
        )
        self.assertEqual(response.json()["days"]["28"], 1)
        self.assertEqual(day_response.json()["employees"][0]["id"], self.profile_leap.id)

    @override_settings(BIRTHDAY_LEAP_DAY_STRATEGY="MAR_01")
    def test_configured_leap_day_policy_matches_calendar_and_day(self):
        self.client.force_authenticate(user=self.user_staff)
        calendar_response = self.client.get(reverse("birthdays:calendar"), {"month": 3, "year": 2025})
        day_response = self.client.get(
            reverse("birthdays:day_birthdays"), {"month": 3, "day": 1, "year": 2025}
        )
        self.assertEqual(calendar_response.json()["days"]["1"], 1)
        self.assertEqual(day_response.json()["employees"][0]["id"], self.profile_leap.id)

    def test_email_log_is_admin_only(self):
        self.client.force_authenticate(user=self.user_staff)
        self.assertEqual(self.client.get(reverse("birthdays:logs")).status_code, 403)
        self.client.force_authenticate(user=self.user_admin)
        self.assertEqual(self.client.get(reverse("birthdays:logs")).status_code, 200)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class BirthdayEmailDeliveryTests(TestCase):
    def setUp(self):
        self.birthday = date(2026, 5, 20)
        self.user = User.objects.create_user(username="email-staff", email="staff@example.com")
        self.staff = StaffProfile.objects.create(
            user=self.user,
            full_name="Nguyễn Văn An",
            department="Phòng Đào tạo",
            position="Chuyên viên",
            birthday=date(1990, 5, 20),
        )

    def test_failed_pre_acceptance_attempt_is_retried(self):
        with patch(
            "birthdays.services.send_mail",
            side_effect=[SMTPConnectError(421, "connection rejected"), 1],
        ) as send:
            result = send_automated_birthday_emails(self.birthday, max_retries=1, allow_test_email_backend=True)

        self.assertEqual(send.call_count, 2)
        self.assertEqual(result["sent_count"], 1)
        log = BirthdayEmailLog.objects.get(staff=self.staff)
        self.assertEqual(log.status, BirthdayEmailStatus.SUCCESS)
        self.assertEqual(log.retry_count, 1)
        self.assertEqual(log.birthday_year, 2026)

    def test_ambiguous_failure_is_quarantined_without_resend(self):
        with patch("birthdays.services.send_mail", side_effect=RuntimeError("secret=password")) as send:
            first = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)
            second = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)

        self.assertEqual(send.call_count, 1)
        self.assertEqual(first["uncertain_count"], 1)
        self.assertEqual(second["skipped_count"], 1)
        log = BirthdayEmailLog.objects.get(staff=self.staff)
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)
        self.assertEqual(log.error_message, "RuntimeError")
        self.assertNotIn("password", str(first))

    def test_overlapping_invocation_does_not_send_twice(self):
        def send_with_overlap(**kwargs):
            nested = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)
            self.assertEqual(nested["sent_count"], 0)
            self.assertEqual(nested["skipped_count"], 1)
            return 1

        with patch("birthdays.services.send_mail", side_effect=send_with_overlap) as send:
            result = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)

        self.assertEqual(send.call_count, 1)
        self.assertEqual(result["sent_count"], 1)

    def test_one_staff_failure_does_not_stop_next_staff(self):
        second_user = User.objects.create_user(username="email-staff-2", email="second@example.com")
        StaffProfile.objects.create(
            user=second_user,
            full_name="Trần Thị Bình",
            birthday=date(1985, 5, 20),
        )
        with patch("birthdays.services.send_mail", side_effect=[RuntimeError("disconnected"), 1]):
            result = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)

        self.assertEqual(result["failed_count"], 1)
        self.assertEqual(result["sent_count"], 1)

    def test_invalid_address_is_skipped_without_sending(self):
        self.user.email = "invalid-address"
        self.user.save(update_fields=["email"])
        with patch("birthdays.services.send_mail") as send:
            result = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)

        send.assert_not_called()
        self.assertEqual(result["skipped_count"], 1)
        self.assertEqual(BirthdayEmailLog.objects.get(staff=self.staff).status, BirthdayEmailStatus.SKIPPED)

    def test_leap_policy_change_cannot_send_twice_in_one_year(self):
        self.staff.birthday = date(1996, 2, 29)
        self.staff.save(update_fields=["birthday"])
        with patch("birthdays.services.send_mail", return_value=1) as send:
            first = send_automated_birthday_emails(
                date(2025, 2, 28), leap_year_strategy="FEB_28", allow_test_email_backend=True
            )
            second = send_automated_birthday_emails(
                date(2025, 3, 1), leap_year_strategy="MAR_01", allow_test_email_backend=True
            )

        self.assertEqual(first["sent_count"], 1)
        self.assertEqual(second["sent_count"], 0)
        self.assertEqual(send.call_count, 1)
        self.assertEqual(BirthdayEmailLog.objects.get(staff=self.staff).birthday_year, 2025)

    def test_dynamic_email_fields_are_html_escaped(self):
        self.staff.full_name = "<script>alert(1)</script>"
        self.staff.department = "<img src=x>"
        self.staff.position = "<b>Chief</b>"
        html = generate_birthday_email_html(self.staff)

        self.assertNotIn("<script>", html)
        self.assertNotIn("<img src=x>", html)
        self.assertNotIn("<b>Chief</b>", html)
        self.assertIn("&lt;script&gt;", html)
        self.assertIn("&lt;img src=x&gt;", html)
        self.assertIn("&lt;b&gt;Chief&lt;/b&gt;", html)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.console.EmailBackend")
    def test_command_rejects_console_delivery(self):
        with self.assertRaises(CommandError):
            call_command("send_birthday_emails")

    def test_service_requires_explicit_memory_backend_opt_in(self):
        with self.assertRaises(ImproperlyConfigured):
            send_automated_birthday_emails(self.birthday)

    def test_retry_limit_rejects_unbounded_attempts(self):
        with self.assertRaises(ValueError):
            send_automated_birthday_emails(self.birthday, max_retries=11, allow_test_email_backend=True)

    def test_admin_reconciliation_requires_evidence_and_success_is_immutable(self):
        operator = User.objects.create_superuser("operator", "operator@example.com", "test-password")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Birthday",
            status=BirthdayEmailStatus.UNCERTAIN,
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)
        form_type = log_admin.get_form(request, obj=log)
        accepted_at = timezone.localtime()
        timestamp_fields = {
            "sent_at_0": accepted_at.strftime("%Y-%m-%d"),
            "sent_at_1": accepted_at.strftime("%H:%M:%S"),
        }

        without_evidence = form_type(
            data={"status": BirthdayEmailStatus.SUCCESS, **timestamp_fields},
            instance=log,
        )
        self.assertFalse(without_evidence.is_valid())

        with_evidence = form_type(
            data={
                "status": BirthdayEmailStatus.SUCCESS,
                **timestamp_fields,
                "evidence": "SMTP provider confirms acceptance for this recipient.",
            },
            instance=log,
        )
        self.assertTrue(with_evidence.is_valid(), with_evidence.errors)
        log_admin.save_model(request, with_evidence.save(commit=False), with_evidence, change=True)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.SUCCESS)
        self.assertIn("provider confirms", log.reconciliation_note)
        self.assertIsNotNone(log.reconciled_at)

        change_success = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.FAILED, **timestamp_fields, "evidence": "wrong"},
            instance=log,
        )
        self.assertFalse(change_success.is_valid())

    def test_admin_cannot_change_processing_to_failed(self):
        """Admin form cấm tuyệt đối chuyển trực tiếp PROCESSING sang FAILED."""
        operator = User.objects.create_superuser("admin_test1", "admin1@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Processing to Failed",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=os.getpid(),
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.FAILED, "evidence": "SMTP rejected"},
            instance=log,
        )
        self.assertFalse(form.is_valid())
        self.assertIn("status", form.errors)
        self.assertTrue(any("không được" in e.lower() or "không thể" in e.lower() for e in form.errors["status"]))

    def test_admin_cannot_change_processing_to_uncertain_if_worker_alive(self):
        """Không cho phép chuyển PROCESSING sang UNCERTAIN nếu tiến trình worker vẫn đang chạy."""
        operator = User.objects.create_superuser("admin_test2", "admin2@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Worker Alive",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=os.getpid(),
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertFalse(form.is_valid())
        self.assertTrue(any("vẫn đang chạy" in str(e).lower() or "chưa dừng" in str(e).lower() for e in form.errors.get("status", [])))

    def test_admin_can_change_processing_to_uncertain_when_worker_stopped(self):
        """Cho phép chuyển PROCESSING sang UNCERTAIN khi worker đã dừng và có xác nhận."""
        operator = User.objects.create_superuser("admin_test3", "admin3@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Worker Stopped",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=99999999,  # PID chắc chắn không tồn tại
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertTrue(form.is_valid(), form.errors)
        log_admin.save_model(request, form.save(commit=False), form, change=True)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)

    def test_admin_task_5_1_display_and_unverified_resend_protection(self):
        """Task 5.1: Admin hiển thị attempt_id, worker_pid, worker_host, nhận diện đối soát, và không có action gửi lại."""
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # 1. attempt_id, worker_pid, worker_host phải là readonly_fields
        self.assertIn("attempt_id", log_admin.readonly_fields)
        self.assertIn("worker_pid", log_admin.readonly_fields)
        self.assertIn("worker_host", log_admin.readonly_fields)
        self.assertIn("worker_status", log_admin.readonly_fields)

        # 2. Không cung cấp action gửi lại (actions = None)
        self.assertIsNone(log_admin.actions)

        # 3. Nhận diện các lượt gửi cần đối soát
        log_proc = BirthdayEmailLog(status=BirthdayEmailStatus.PROCESSING)
        log_uncert = BirthdayEmailLog(status=BirthdayEmailStatus.UNCERTAIN)
        log_success = BirthdayEmailLog(status=BirthdayEmailStatus.SUCCESS)
        log_failed = BirthdayEmailLog(status=BirthdayEmailStatus.FAILED)

        self.assertTrue(log_admin.needs_reconciliation(log_proc))
        self.assertTrue(log_admin.needs_reconciliation(log_uncert))
        self.assertFalse(log_admin.needs_reconciliation(log_success))
        self.assertFalse(log_admin.needs_reconciliation(log_failed))

        # 4. Hiển thị thông tin worker
        log_worker = BirthdayEmailLog(worker_pid=1234, worker_host="server01")
        self.assertEqual(log_admin.worker_info(log_worker), "server01:1234")

    def test_admin_save_model_clears_attempt_id_to_neutralize_stale_workers(self):
        """Task 5.2: Admin đối soát trạng thái thì attempt_id phải bị xóa dưới khóa DB để worker cũ không thể ghi đè."""
        first_attempt = uuid.uuid4()
        operator = User.objects.create_superuser("admin_5_2_1", "admin521@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test 5.2 Stale Worker Protection",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=first_attempt,
            worker_pid=99999999,  # đã dừng
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertTrue(form.is_valid(), form.errors)
        log_admin.save_model(request, form.save(commit=False), form, change=True)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)
        # attempt_id đã bị xóa
        self.assertIsNone(log.attempt_id)

        # Worker cũ thức dậy cố ghi nhận kết quả FAILED với first_attempt -> phải bị chặn
        from birthdays.services import _record_delivery_result
        saved = _record_delivery_result(log, first_attempt, BirthdayEmailStatus.FAILED, "timeout")
        self.assertFalse(saved)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)

    def test_admin_remote_worker_requires_evidence_for_uncertain(self):
        """Task 5.2: Worker trên máy chủ khác không thể kiểm tra PID cục bộ, bắt buộc phải có bằng chứng đối soát."""
        operator = User.objects.create_superuser("admin_5_2_2", "admin522@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test 5.2 Remote Worker",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=12345,
            worker_host="remote-worker-node-99",
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # Chưa có evidence -> không hợp lệ dù đã tick worker_stopped
        form_no_ev = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertFalse(form_no_ev.is_valid())
        self.assertIn("evidence", form_no_ev.errors)

        # Có evidence xác nhận worker đã dừng -> hợp lệ
        form_with_ev = log_admin.get_form(request, obj=log)(
            data={
                "status": BirthdayEmailStatus.UNCERTAIN,
                "worker_stopped": True,
                "evidence": "Xác nhận từ kỹ sư hệ thống: worker trên node-99 đã bị kill lúc 10:00",
            },
            instance=log,
        )
        self.assertTrue(form_with_ev.is_valid(), form_with_ev.errors)

    def test_admin_detects_concurrent_db_modification_during_form_edit(self):
        """Task 5.2: Nếu trong lúc admin mở form mà worker đã cập nhật DB thì form phải từ chối lưu."""
        operator = User.objects.create_superuser("admin_5_2_3", "admin523@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        initial_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test 5.2 Concurrency",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=initial_attempt,
            worker_pid=99999999,
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )

        # Giả lập worker hoàn tất ngầm trong DB trước khi admin nhấn Submit
        BirthdayEmailLog.objects.filter(pk=log.pk).update(
            status=BirthdayEmailStatus.SUCCESS,
            sent_at=timezone.now(),
        )

        self.assertFalse(form.is_valid())
        self.assertTrue(any("thành công" in str(e).lower() or "không được" in str(e).lower() or "thay đổi" in str(e).lower() for e in form.errors.get("status", [])))

    def test_worker_does_not_overwrite_reconciled_log_due_to_attempt_id(self):
        """Worker kiểm tra attempt_id dưới khóa; không được ghi đè nếu admin đã đối soát."""
        first_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Attempt ID Protection",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=first_attempt,
        )
        # Giả lập Admin đã can thiệp đối soát thành công
        log.status = BirthdayEmailStatus.SUCCESS
        log.attempt_id = None
        log.reconciled_at = timezone.now()
        log.reconciliation_note = "Admin manual reconciliation via SMTP provider logs."
        log.save()

        # Worker với attempt_id cũ hoàn tất và cố cập nhật FAILED
        from birthdays.services import _record_delivery_result
        success = _record_delivery_result(
            log=log,
            attempt_id=first_attempt,
            new_status=BirthdayEmailStatus.FAILED,
            error_message="SMTP network failure",
        )
        self.assertFalse(success)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.SUCCESS)
        self.assertIn("Admin manual reconciliation", log.reconciliation_note)

    def test_claim_delivery_generates_attempt_id_and_worker_metadata(self):
        """_claim_delivery phải tạo attempt_id mới và lưu thông tin worker."""
        from birthdays.services import _claim_delivery
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Claim Attempt ID",
            status=BirthdayEmailStatus.PENDING,
        )
        claimed = _claim_delivery(log, self.user.email, "Test Claim Attempt ID", max_retries=1)
        self.assertTrue(claimed)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.PROCESSING)
        self.assertIsNotNone(log.attempt_id)
        self.assertEqual(log.worker_pid, os.getpid())
        self.assertEqual(log.worker_host, socket.gethostname())

        # Thử claim lại khi đang PROCESSING -> phải thất bại
        second_claim = _claim_delivery(log, self.user.email, "Test Claim Attempt ID", max_retries=1)
        self.assertFalse(second_claim)

    def test_claim_delivery_rejects_uncertain_status(self):
        """Bản ghi ở trạng thái UNCERTAIN không được tự động claim gửi lại."""
        from birthdays.services import _claim_delivery
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Uncertain Not Claimed",
            status=BirthdayEmailStatus.UNCERTAIN,
        )
        claimed = _claim_delivery(log, self.user.email, "Test Subject", max_retries=1)
        self.assertFalse(claimed)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)

    def test_worker_with_old_attempt_cannot_overwrite_newer_attempt(self):
        """Worker cũ không được phép ghi đè kết quả của attempt mới."""
        from birthdays.services import _claim_delivery, _record_delivery_result
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Multi Attempt",
            status=BirthdayEmailStatus.PENDING,
        )
        # Attempt 1
        self.assertTrue(_claim_delivery(log, self.user.email, "Subject", max_retries=2))
        attempt_1 = log.attempt_id
        # Giả sử attempt 1 bị lỗi mạng rõ ràng -> FAILED
        self.assertTrue(_record_delivery_result(log, attempt_1, BirthdayEmailStatus.FAILED, "Network drop"))

        # Attempt 2 được claim
        self.assertTrue(_claim_delivery(log, self.user.email, "Subject", max_retries=2))
        attempt_2 = log.attempt_id
        self.assertNotEqual(attempt_1, attempt_2)

        # Worker 1 (mang attempt_1 cũ) cố ghi đè kết quả
        stale_update = _record_delivery_result(log, attempt_1, BirthdayEmailStatus.SUCCESS)
        self.assertFalse(stale_update)
        log.refresh_from_db()
        # Trạng thái vẫn phải là PROCESSING của attempt_2
        self.assertEqual(log.status, BirthdayEmailStatus.PROCESSING)
        self.assertEqual(log.attempt_id, attempt_2)

    # =========================================================================
    # Task 5.3: Kiểm thử độc lập quy trình đối soát email sinh nhật trong Admin
    # =========================================================================

    def test_task_5_3_processing_cannot_transition_to_failed_or_pending(self):
        """Case 1 (PROCESSING): Admin không thể chuyển PROCESSING sang FAILED hoặc PENDING (gửi lại)."""
        operator = User.objects.create_superuser("admin_5_3_1", "admin531@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Processing Restricted Transitions",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=99999999,
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # 1.1: Chuyển sang FAILED -> bị từ chối
        form_failed = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.FAILED, "evidence": "SMTP network error"},
            instance=log,
        )
        self.assertFalse(form_failed.is_valid())
        self.assertIn("status", form_failed.errors)

        # 1.2: Chuyển sang PENDING (yêu cầu gửi lại tùy tiện) -> bị từ chối
        form_pending = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.PENDING},
            instance=log,
        )
        self.assertFalse(form_pending.is_valid())
        self.assertIn("status", form_pending.errors)

    def test_task_5_3_uncertain_retains_status_and_blocks_auto_resend(self):
        """Case 2 (UNCERTAIN): Bản ghi UNCERTAIN không bị tự động gửi lại trong service và command."""
        from birthdays.services import send_automated_birthday_emails
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Uncertain Retention",
            status=BirthdayEmailStatus.UNCERTAIN,
            attempt_id=uuid.uuid4(),
        )
        with patch("birthdays.services.send_mail") as mock_send:
            summary = send_automated_birthday_emails(
                self.birthday,
                allow_test_email_backend=True,
            )
            # send_mail không được gọi cho bản ghi UNCERTAIN
            mock_send.assert_not_called()

        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)
        self.assertGreaterEqual(summary["skipped_count"], 1)

    def test_task_5_3_admin_stale_attempt_id_cannot_modify_new_attempt(self):
        """Case 3 (ATTEMPT_ID): Thao tác admin giữ attempt_id cũ không được thay đổi bản ghi thuộc attempt mới."""
        operator = User.objects.create_superuser("admin_5_3_3", "admin533@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        old_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Stale Attempt",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=old_attempt,
            worker_pid=99999999,
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )

        # Worker nhận attempt mới ngầm trong database
        new_attempt = uuid.uuid4()
        BirthdayEmailLog.objects.filter(pk=log.pk).update(attempt_id=new_attempt)

        # Admin submit form mang attempt cũ -> form phải từ chối
        self.assertFalse(form.is_valid())
        self.assertTrue(any("attempt_id" in str(e).lower() for e in form.errors.get("status", [])))

    def test_task_5_3_worker_verification_requires_proper_evidence(self):
        """Case 4 (WORKER): Không dùng riêng confirm_worker_stopped=True làm bằng chứng khi worker còn sống hoặc remote."""
        operator = User.objects.create_superuser("admin_5_3_4", "admin534@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # 4.1: Worker cùng host nhưng PID đang chạy thật (os.getpid()) -> tick worker_stopped=True vẫn BỊ CHẶN
        log_alive = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Alive Worker",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=os.getpid(),
            worker_host=socket.gethostname(),
        )
        form_alive = log_admin.get_form(request, obj=log_alive)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log_alive,
        )
        self.assertFalse(form_alive.is_valid())
        self.assertTrue(any("vẫn đang chạy" in str(e).lower() or "chưa dừng" in str(e).lower() for e in form_alive.errors.get("status", [])))

        # 4.2: Worker host khác (remote) -> tick worker_stopped=True mà thiếu evidence vẫn BỊ CHẶN
        user_remote = User.objects.create_user("remote_staff_user", "remote@example.com", "pass")
        staff_remote = StaffProfile.objects.create(
            user=user_remote,
            full_name="Nhân viên Từ Xa",
            department="Chi nhánh",
            position="Chuyên viên",
            birthday=self.birthday,
        )
        log_remote = BirthdayEmailLog.objects.create(
            staff=staff_remote,
            sent_date=self.birthday,
            recipient_email=user_remote.email,
            subject="Test Remote Worker",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=1234,
            worker_host="remote-cluster-worker-01",
        )
        form_remote = log_admin.get_form(request, obj=log_remote)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log_remote,
        )
        self.assertFalse(form_remote.is_valid())
        self.assertIn("evidence", form_remote.errors)

    def test_task_5_3_admin_permissions_unauthorized_user_blocked(self):
        """Case 5 (ADMIN PERMISSIONS): Người dùng không có quyền change không được phép thực hiện đối soát."""
        regular_user = User.objects.create_user("staff_member_53", "staff53@example.com", "password123")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = regular_user
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Permissions",
            status=BirthdayEmailStatus.UNCERTAIN,
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # 5.1: has_change_permission trả về False cho user thông thường
        self.assertFalse(log_admin.has_change_permission(request, obj=log))

        # 5.2: has_add_permission và has_delete_permission luôn trả về False cho mọi user
        self.assertFalse(log_admin.has_add_permission(request))
        self.assertFalse(log_admin.has_delete_permission(request, obj=log))

        # 5.3: User có quyền staff nhưng không có change_birthdayemaillog cũng bị chặn
        staff_no_perm = User.objects.create_user("staff_no_perm_53", "staffnp53@example.com", "pass", is_staff=True)
        request.user = staff_no_perm
        self.assertFalse(log_admin.has_change_permission(request, obj=log))

        # 5.4: Superuser có quyền đối soát
        superuser = User.objects.create_superuser("super_admin_53", "super53@example.com", "pass")
        request.user = superuser
        self.assertTrue(log_admin.has_change_permission(request, obj=log))

    def test_task_5_3_concurrent_update_prevents_unauthorized_overwrite(self):
        """Case 6 (CONCURRENT UPDATE): Mô phỏng admin và worker cập nhật cùng một bản ghi, ngăn chặn ghi đè."""
        operator = User.objects.create_superuser("admin_5_3_6", "admin536@example.com", "test-pass")
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = operator
        initial_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Concurrency Update",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=initial_attempt,
            worker_pid=99999999,
            worker_host=socket.gethostname(),
        )
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # 6.1: Admin đối soát PROCESSING -> UNCERTAIN
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertTrue(form.is_valid(), form.errors)
        log_admin.save_model(request, form.save(commit=False), form, change=True)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)
        self.assertIsNone(log.attempt_id)

        # 6.2: Worker đồng thời hoàn tất cố cập nhật SUCCESS với initial_attempt -> bị từ chối
        from birthdays.services import _record_delivery_result
        worker_saved = _record_delivery_result(
            log=log,
            attempt_id=initial_attempt,
            new_status=BirthdayEmailStatus.SUCCESS,
        )
        self.assertFalse(worker_saved)
        log.refresh_from_db()
        # Trạng thái UNCERTAIN của Admin không bị ghi đè trái phép
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)

    def test_task_5_3_mock_smtp_no_real_email_sent(self):
        """Case 7 (SMTP): Kiểm thử toàn bộ quy trình với mock send_mail, không gửi email thật ra ngoài."""
        from birthdays.services import send_automated_birthday_emails
        with patch("birthdays.services.send_mail") as mock_send_mail:
            mock_send_mail.return_value = 1  # Giả lập SMTP chấp nhận 1 message
            summary = send_automated_birthday_emails(
                self.birthday,
                allow_test_email_backend=True,
            )
            self.assertGreaterEqual(summary["sent_count"], 1)
            mock_send_mail.assert_called()
            # Kiểm tra tham số gửi an toàn
            call_kwargs = mock_send_mail.call_args[1]
            self.assertIn("html_message", call_kwargs)
            self.assertEqual(call_kwargs["recipient_list"], [self.user.email])


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class BirthdayEmailConcurrencyTests(TransactionTestCase):
    """
    Kiểm thử đồng thời (Concurrency) và Race Condition cho phân hệ gửi & đối soát email sinh nhật (Task 6.1).
    Sử dụng TransactionTestCase để hỗ trợ đa luồng và commit giao dịch thực tế.

    LƯU Ý MÔI TRƯỜNG CƠ SỞ DỮ LIỆU:
    - Trên SQLite: SQLite không hỗ trợ khóa hàng thực tế (row-level locking), chỉ khóa mức file/table.
      Cơ chế select_for_update() được SQLite thực thi nhưng không cô lập hàng riêng biệt.
    - Trên PostgreSQL: Cơ chế select_for_update() khóa hàng thực tế (FOR UPDATE). Bộ test này sẵn sàng
      chạy trên PostgreSQL staging/production để xác minh triệt để khóa hàng không bị deadlock hay race condition.
    """
    reset_sequences = True

    def setUp(self):
        self.birthday = date(2026, 5, 20)
        self.user = User.objects.create_user(username="concur_staff", email="concur_staff@example.com")
        self.admin_user = User.objects.create_superuser("concur_admin", "admin_concur@example.com", "pass123")
        self.staff = StaffProfile.objects.create(
            user=self.user,
            full_name="Đặng Văn Đồng Thời",
            department="Trung tâm CNTT",
            position="Kỹ sư Hệ thống",
            birthday=date(1992, 5, 20),
        )

    def test_1_concurrent_worker_claim_only_one_succeeds(self):
        """1. Hai worker đồng thời claim cùng một email: Chỉ đúng 1 worker claim thành công.

        LƯU Ý:
        - Trên PostgreSQL: has_select_for_update = True. Hai thread đồng thời claim cùng 1 record.
          PostgreSQL khóa hàng (FOR UPDATE), worker 1 claim thành công, worker 2 đợi hàng mở khóa,
          đọc trạng thái mới (PROCESSING) và nhận False.
        - Trên SQLite: has_select_for_update = False. SQLite không có row-level lock (chỉ có database lock),
          nên 2 transaction cùng ghi đồng thời sẽ gây OperationalError. Do đó trên SQLite, test kiểm tra
          tính loại trừ tương hỗ (sau khi worker 1 claim, worker 2 claim sẽ trả về False).
        """
        from birthdays.services import _claim_delivery

        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Concurrent Worker Claim",
            status=BirthdayEmailStatus.PENDING,
        )

        if connection.features.has_select_for_update:
            # Chạy đa luồng thực tế trên PostgreSQL
            results = []
            barrier = threading.Barrier(2)

            def worker_claim():
                barrier.wait()
                from django.db import connection as thread_conn
                try:
                    claimed = _claim_delivery(log, self.user.email, "Test Subject", max_retries=1)
                    results.append(claimed)
                finally:
                    thread_conn.close()

            t1 = threading.Thread(target=worker_claim)
            t2 = threading.Thread(target=worker_claim)
            t1.start()
            t2.start()
            t1.join()
            t2.join()

            self.assertEqual(results.count(True), 1)
            self.assertEqual(results.count(False), 1)
        else:
            # Trên SQLite: Kiểm tra logic loại trừ tuần tự chính xác
            claimed_1 = _claim_delivery(log, self.user.email, "Test Subject", max_retries=1)
            self.assertTrue(claimed_1)

            claimed_2 = _claim_delivery(log, self.user.email, "Test Subject", max_retries=1)
            self.assertFalse(claimed_2)

        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.PROCESSING)
        self.assertIsNotNone(log.attempt_id)

    def test_2_stale_worker_result_cannot_overwrite_new_attempt(self):
        """2. Worker cũ trả kết quả sau khi attempt_id đã thay đổi: Kết quả cũ bị từ chối, không ghi đè."""
        from birthdays.services import _claim_delivery, _record_delivery_result
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Stale Worker",
            status=BirthdayEmailStatus.PENDING,
        )
        # Attempt 1
        self.assertTrue(_claim_delivery(log, self.user.email, "Subject", max_retries=2))
        attempt_1 = log.attempt_id
        # Worker 1 bị timeout, hệ thống đánh dấu FAILED
        self.assertTrue(_record_delivery_result(log, attempt_1, BirthdayEmailStatus.FAILED, "Timeout"))

        # Attempt 2 được claim bởi worker mới
        self.assertTrue(_claim_delivery(log, self.user.email, "Subject", max_retries=2))
        attempt_2 = log.attempt_id
        self.assertNotEqual(attempt_1, attempt_2)

        # Worker 1 quay lại cố ghi nhận SUCCESS với attempt_1 cũ
        saved = _record_delivery_result(log, attempt_1, BirthdayEmailStatus.SUCCESS)
        self.assertFalse(saved)

        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.PROCESSING)
        self.assertEqual(log.attempt_id, attempt_2)

    def test_3_admin_reconciliation_blocked_while_worker_actively_sending(self):
        """3. Admin đối soát trong khi worker vẫn đang gửi: Không được chuyển trạng thái không an toàn."""
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Active Worker Protection",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=uuid.uuid4(),
            worker_pid=os.getpid(),  # tiến trình hiện tại đang sống
            worker_host=socket.gethostname(),
        )
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = self.admin_user
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # 3.1: Chuyển FAILED -> Bị chặn
        form_failed = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.FAILED, "evidence": "Admin assumed failed"},
            instance=log,
        )
        self.assertFalse(form_failed.is_valid())

        # 3.2: Chuyển PENDING (kích hoạt gửi lại) -> Bị chặn
        form_pending = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.PENDING},
            instance=log,
        )
        self.assertFalse(form_pending.is_valid())

        # 3.3: Chuyển UNCERTAIN khi worker vẫn đang chạy -> Bị chặn
        form_uncert = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertFalse(form_uncert.is_valid())
        self.assertTrue(any("vẫn đang chạy" in str(e).lower() for e in form_uncert.errors.get("status", [])))

    def test_4_worker_interrupted_after_smtp_acceptance_retains_processing_and_blocks_resend(self):
        """4. Worker bị gián đoạn sau khi SMTP chấp nhận: Giữ PROCESSING, không tự động gửi lại."""
        stale_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Worker Interrupted Post-SMTP",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=stale_attempt,
            worker_pid=99999999,
            worker_host=socket.gethostname(),
        )

        with patch("birthdays.services.send_mail") as mock_send:
            summary = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)
            mock_send.assert_not_called()

        log.refresh_from_db()
        # Trạng thái giữ nguyên PROCESSING cho quản trị viên đối soát, không bị gửi lại
        self.assertEqual(log.status, BirthdayEmailStatus.PROCESSING)
        self.assertEqual(log.attempt_id, stale_attempt)
        self.assertGreaterEqual(summary["skipped_count"], 1)

    def test_5_concurrent_scheduler_runs_prevent_duplicate_emails(self):
        """5. Scheduler chạy đồng thời hoặc chạy lại: Không tạo lượt gửi trùng.

        LƯU Ý:
        - Trên PostgreSQL (has_select_for_update = True): Chạy 2 thread đồng thời kích hoạt scheduler.
          Khóa hàng bảo đảm chỉ đúng 1 scheduler gửi thư thành công, scheduler còn lại bỏ qua.
        - Trên SQLite (has_select_for_update = False): Do SQLite khóa toàn bộ database khi ghi đồng thời,
          test kiểm tra bảo vệ chạy lại (re-run idempotency) để xác minh không gửi trùng.
        """
        if connection.features.has_select_for_update:
            results = []
            errors = []
            barrier = threading.Barrier(2)

            def run_scheduler():
                barrier.wait()
                from django.db import connection as thread_conn
                try:
                    with patch("birthdays.services.send_mail", return_value=1):
                        summary = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)
                        results.append(summary)
                except Exception as exc:
                    errors.append(exc)
                finally:
                    thread_conn.close()

            t1 = threading.Thread(target=run_scheduler)
            t2 = threading.Thread(target=run_scheduler)
            t1.start()
            t2.start()
            t1.join()
            t2.join()

            total_sent = sum(r["sent_count"] for r in results)
            self.assertEqual(total_sent, 1)
        else:
            # Lần chạy 1
            with patch("birthdays.services.send_mail", return_value=1) as mock_send_1:
                summary_1 = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)
                self.assertEqual(summary_1["sent_count"], 1)
                self.assertEqual(mock_send_1.call_count, 1)

            # Lần chạy lại 2 (Scheduler re-run)
            with patch("birthdays.services.send_mail", return_value=1) as mock_send_2:
                summary_2 = send_automated_birthday_emails(self.birthday, allow_test_email_backend=True)
                self.assertEqual(summary_2["sent_count"], 0)
                self.assertGreaterEqual(summary_2["skipped_count"], 1)
                mock_send_2.assert_not_called()

        logs = BirthdayEmailLog.objects.filter(staff=self.staff, sent_date=self.birthday)
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs.first().status, BirthdayEmailStatus.SUCCESS)

    def test_6_concurrent_admin_reconciliation_prevents_stale_overwrite(self):
        """6. Hai request quản trị cùng đối soát một bản ghi: Tránh ghi đè trạng thái và kiểm tra attempt_id."""
        first_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Concurrent Admin Reconciliation",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=first_attempt,
            worker_pid=99999999,
            worker_host=socket.gethostname(),
        )
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = self.admin_user
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # Admin A và Admin B đều mở form trên trình duyệt cùng lúc
        form_a = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertTrue(form_a.is_valid())

        form_b = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertTrue(form_b.is_valid())

        # Admin A submit trước -> thành công
        log_admin.save_model(request, form_a.save(commit=False), form_a, change=True)
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)
        self.assertIsNone(log.attempt_id)

        # Admin B submit sau -> bản ghi đã thay đổi attempt_id, save_model phải raise ValidationError
        with self.assertRaises(forms.ValidationError):
            log_admin.save_model(request, form_b.save(commit=False), form_b, change=True)

        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.UNCERTAIN)

    def test_7_select_for_update_sql_verification_for_postgresql(self):
        """7. Chuẩn bị PostgreSQL: Xác minh truy vấn select_for_update() cấu hình đúng khóa hàng."""
        with transaction.atomic():
            qs = BirthdayEmailLog.objects.select_for_update().filter(pk=1)
            # 1. ORM query object phải bật cờ select_for_update
            self.assertTrue(qs.query.select_for_update)

            # 2. Kiểm tra câu lệnh SQL tùy theo backend cơ sở dữ liệu
            sql_string = str(qs.query).upper()
            if connection.features.has_select_for_update:
                # Trên PostgreSQL: connection.features.has_select_for_update = True
                # Sinh mệnh đề FOR UPDATE để khóa hàng thực tế trong transaction
                self.assertIn("FOR UPDATE", sql_string)
            else:
                # Trên SQLite: connection.features.has_select_for_update = False
                # SQLite chỉ hỗ trợ khóa cấp cơ sở dữ liệu/bảng, Django SQL compiler lược bỏ FOR UPDATE.
                self.assertFalse(connection.features.has_select_for_update)
                self.assertNotIn("FOR UPDATE", sql_string)

    @patch("birthdays.services.send_mail")
    def test_8_admin_cannot_overwrite_claimed_processing_to_pending_when_loaded_attempt_none(self, mock_send):
        """8. Race condition 1: Log ban đầu PENDING (_loaded_attempt_id=None).
        Worker claim thành PROCESSING (attempt_id mới).
        Admin submit form cũ không được ghi đè PROCESSING về PENDING.
        """
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Race Condition Claimed Processing to Pending",
            status=BirthdayEmailStatus.PENDING,
            attempt_id=None,
        )
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = self.admin_user
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # Admin mở form khi attempt_id là None
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.PENDING},
            instance=log,
        )
        self.assertIsNone(form._loaded_attempt_id)
        self.assertEqual(form._loaded_status, BirthdayEmailStatus.PENDING)
        self.assertTrue(form.is_valid())

        # Mô phỏng worker claim trong background ngay sau khi admin mở/validate form
        worker_attempt = uuid.uuid4()
        log.status = BirthdayEmailStatus.PROCESSING
        log.attempt_id = worker_attempt
        log.worker_pid = os.getpid()
        log.worker_host = socket.gethostname()
        log.save()

        # Admin cố gắng lưu dữ liệu cũ (PENDING) -> save_model phải khóa bản ghi và từ chối
        with self.assertRaises(forms.ValidationError):
            log_admin.save_model(request, form.save(commit=False), form, change=True)

        # Xác minh dữ liệu không bị ghi đè: vẫn giữ nguyên PROCESSING và attempt_id của worker
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.PROCESSING)
        self.assertEqual(log.attempt_id, worker_attempt)
        mock_send.assert_not_called()

    @patch("birthdays.services.send_mail")
    def test_9_admin_cannot_overwrite_completed_success_to_uncertain_after_worker_finishes(self, mock_send):
        """9. Race condition 2: Admin mở form khi PROCESSING định đối soát UNCERTAIN.
        Worker gửi thành công cập nhật DB thành SUCCESS.
        Admin submit form không được ghi đè SUCCESS thành UNCERTAIN.
        """
        worker_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Race Condition Overwrite Success to Uncertain",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=worker_attempt,
            worker_pid=99999999,  # worker cũ không còn chạy
            worker_host=socket.gethostname(),
        )
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = self.admin_user
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # Admin mở form và chuẩn bị đối soát sang UNCERTAIN
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.UNCERTAIN, "worker_stopped": True},
            instance=log,
        )
        self.assertTrue(form.is_valid())

        # Worker hoàn tất gửi thư và cập nhật trạng thái SUCCESS trong DB
        sent_time = timezone.now()
        log.status = BirthdayEmailStatus.SUCCESS
        log.sent_at = sent_time
        log.save()

        # Admin submit form -> save_model khóa bản ghi bằng select_for_update,
        # phát hiện trạng thái đã đổi thành SUCCESS và từ chối ghi đè
        with self.assertRaises(forms.ValidationError):
            log_admin.save_model(request, form.save(commit=False), form, change=True)

        # Xác minh tính bất biến của SUCCESS: không bị đổi sang UNCERTAIN
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.SUCCESS)
        self.assertEqual(log.sent_at, sent_time)
        mock_send.assert_not_called()

    @patch("birthdays.services.send_mail")
    def test_10_clean_detects_conflict_when_loaded_attempt_id_is_none(self, mock_send):
        """10. Kiểm tra form.clean() phát hiện xung đột khi _loaded_attempt_id ban đầu là None.
        Không coi None là lý do bỏ qua kiểm tra attempt_id.
        """
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=self.birthday,
            recipient_email=self.user.email,
            subject="Test Clean Loaded Attempt None",
            status=BirthdayEmailStatus.PENDING,
            attempt_id=None,
        )
        request = RequestFactory().get("/admin/birthdays/birthdayemaillog/")
        request.user = self.admin_user
        log_admin = BirthdayEmailLogAdmin(BirthdayEmailLog, admin.site)

        # Khởi tạo form khi DB có attempt_id=None
        form = log_admin.get_form(request, obj=log)(
            data={"status": BirthdayEmailStatus.PENDING},
            instance=log,
        )
        self.assertIsNone(form._loaded_attempt_id)

        # Worker claim trong DB gán attempt_id mới
        new_attempt = uuid.uuid4()
        log.attempt_id = new_attempt
        log.status = BirthdayEmailStatus.PROCESSING
        log.save()

        # clean() phải phát hiện previous.attempt_id != _loaded_attempt_id (kể cả khi ban đầu là None)
        self.assertFalse(form.is_valid())
        self.assertTrue(any("attempt_id" in str(e) for e in form.errors.get("status", [])))
        mock_send.assert_not_called()

    @override_settings(ALLOWED_HOSTS=["*"])
    @patch("birthdays.services.send_mail")
    def test_11_changeform_view_handles_conflict_gracefully_without_http_500(self, mock_send):
        """11. Django Admin xử lý từ chối thao tác xung đột bằng thông báo và redirect, tránh HTTP 500."""
        from django.test import Client

        client = Client(SERVER_NAME="localhost")
        client.force_login(self.admin_user)
        worker_attempt = uuid.uuid4()
        log = BirthdayEmailLog.objects.create(
            staff=self.staff,
            sent_date=date(2027, 5, 20),
            recipient_email=self.user.email,
            subject="Test Admin UI Graceful Rejection",
            status=BirthdayEmailStatus.PROCESSING,
            attempt_id=worker_attempt,
            worker_pid=99999999,
            worker_host=socket.gethostname(),
        )

        change_url = reverse("admin:birthdays_birthdayemaillog_change", args=[log.pk])

        post_data = {
            "status": BirthdayEmailStatus.UNCERTAIN,
            "worker_stopped": "on",
            "_loaded_attempt_id_val": str(worker_attempt),
            "_loaded_status_val": BirthdayEmailStatus.PROCESSING,
        }

        # Mô phỏng save_model phát hiện xung đột dữ liệu và ném forms.ValidationError
        with patch.object(
            BirthdayEmailLogAdmin,
            "save_model",
            side_effect=forms.ValidationError("Mã phiên gửi (attempt_id) đã thay đổi trong cơ sở dữ liệu."),
        ):
            response_post = client.post(change_url, data=post_data)

        # 1. Phải không trả về lỗi HTTP 500 (trả về HTTP 302 chuyển hướng về changeform)
        self.assertNotEqual(response_post.status_code, 500)
        self.assertEqual(response_post.status_code, 302)
        self.assertIn(change_url, response_post.url)

        # 2. Xác minh thông báo từ chối được đính kèm vào messages framework
        messages_list = [str(m) for m in response_post.wsgi_request._messages]
        self.assertTrue(any("từ chối" in m.lower() or "xung đột" in m.lower() for m in messages_list))

        # 3. Xác minh bản ghi trong DB vẫn giữ nguyên, không bị lỗi dữ liệu
        log.refresh_from_db()
        self.assertEqual(log.status, BirthdayEmailStatus.PROCESSING)
        self.assertEqual(log.attempt_id, worker_attempt)
        mock_send.assert_not_called()
