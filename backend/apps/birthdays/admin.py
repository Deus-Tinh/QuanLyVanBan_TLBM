import os
import socket

from django import forms
from django.contrib import admin, messages
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone

from .models import BirthdayEmailLog, BirthdayEmailStatus


def is_local_host(host):
    """Kiểm tra máy chủ có phải là máy chủ cục bộ hiện tại hay không."""
    if not host:
        return True
    return host in ("localhost", "127.0.0.1", socket.gethostname())


def is_pid_alive(pid, host=None):
    """Kiểm tra tiến trình có đang hoạt động trên hệ điều hành hay không."""
    if not pid:
        return False
    if not is_local_host(host):
        return False
    try:
        pid = int(pid)
        if os.name == "nt":
            import ctypes
            kernel32 = ctypes.windll.kernel32
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            STILL_ACTIVE = 259
            handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
            if not handle:
                return False
            exit_code = ctypes.c_ulong()
            success = kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code))
            kernel32.CloseHandle(handle)
            return bool(success and exit_code.value == STILL_ACTIVE)
        else:
            os.kill(pid, 0)
            return True
    except PermissionError:
        return True
    except (ProcessLookupError, OSError, ValueError):
        return False


class NeedsReconciliationFilter(admin.SimpleListFilter):
    """Bộ lọc hỗ trợ quản trị viên nhanh chóng nhận diện các lượt gửi cần đối soát."""

    title = "Yêu cầu đối soát"
    parameter_name = "reconciliation_needed"

    def lookups(self, request, model_admin):
        return [
            ("yes", "Cần đối soát (PROCESSING / UNCERTAIN)"),
            ("no", "Không cần đối soát"),
        ]

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.filter(
                status__in=[BirthdayEmailStatus.PROCESSING, BirthdayEmailStatus.UNCERTAIN]
            )
        if self.value() == "no":
            return queryset.exclude(
                status__in=[BirthdayEmailStatus.PROCESSING, BirthdayEmailStatus.UNCERTAIN]
            )
        return queryset


class BirthdayEmailReconciliationForm(forms.ModelForm):
    _loaded_attempt_id_val = forms.CharField(required=False, widget=forms.HiddenInput)
    _loaded_status_val = forms.CharField(required=False, widget=forms.HiddenInput)

    evidence = forms.CharField(
        required=False,
        label="Bằng chứng từ nhà cung cấp SMTP",
        widget=forms.Textarea(attrs={"rows": 3}),
        help_text="Ghi rõ mã lỗi hoặc xác nhận từ máy chủ SMTP trước khi chuyển trạng thái.",
    )
    worker_stopped = forms.BooleanField(
        required=False,
        label="Xác nhận worker đã dừng",
        help_text="Bắt buộc đánh dấu khi chuyển từ Đang xử lý (PROCESSING) sang Cần đối soát (UNCERTAIN).",
    )

    class Meta:
        model = BirthdayEmailLog
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.initial.setdefault("_loaded_attempt_id_val", str(self.instance.attempt_id or ""))
            self.initial.setdefault("_loaded_status_val", str(self.instance.status or ""))

            if self.is_bound and "_loaded_attempt_id_val" in self.data:
                raw_attempt = self.data.get("_loaded_attempt_id_val")
                self._loaded_attempt_id = raw_attempt if raw_attempt else None
            elif not hasattr(self, "_loaded_attempt_id"):
                self._loaded_attempt_id = self.instance.attempt_id

            if self.is_bound and "_loaded_status_val" in self.data:
                raw_status = self.data.get("_loaded_status_val")
                self._loaded_status = raw_status if raw_status else None
            elif not hasattr(self, "_loaded_status"):
                db_status = BirthdayEmailLog.objects.filter(pk=self.instance.pk).values_list("status", flat=True).first()
                self._loaded_status = db_status if db_status is not None else self.instance.status

    def clean(self):
        cleaned = super().clean()
        if not self.instance.pk:
            return cleaned

        try:
            previous = BirthdayEmailLog.objects.get(pk=self.instance.pk)
        except BirthdayEmailLog.DoesNotExist:
            raise forms.ValidationError("Bản ghi không còn tồn tại trong cơ sở dữ liệu.")

        # So sánh attempt_id (kể cả khi attempt_id ban đầu là None)
        if hasattr(self, "_loaded_attempt_id"):
            loaded_attempt = getattr(self, "_loaded_attempt_id", None)
            if str(previous.attempt_id or "") != str(loaded_attempt or ""):
                self.add_error(
                    "status",
                    "Mã phiên gửi (attempt_id) đã thay đổi trong cơ sở dữ liệu do worker hoặc quản trị viên khác thực thi. Vui lòng tải lại trang.",
                )

        # So sánh trạng thái từ lúc mở form
        if hasattr(self, "_loaded_status"):
            loaded_status = getattr(self, "_loaded_status", None)
            if loaded_status is not None and previous.status != loaded_status:
                self.add_error(
                    "status",
                    f"Trạng thái bản ghi đã thay đổi trong cơ sở dữ liệu (từ {loaded_status} sang {previous.status}). Vui lòng tải lại trang.",
                )

        status = cleaned.get("status", previous.status)

        if previous.status == BirthdayEmailStatus.SUCCESS and cleaned.get("sent_at") != previous.sent_at:
            self.add_error("sent_at", "Không được sửa nhật ký đã gửi thành công.")

        if status != previous.status:
            if previous.status == BirthdayEmailStatus.SUCCESS:
                self.add_error("status", "Không được sửa nhật ký đã gửi thành công.")
            elif previous.status == BirthdayEmailStatus.PROCESSING:
                if status == BirthdayEmailStatus.FAILED:
                    self.add_error("status", "Không được chuyển trực tiếp từ PROCESSING sang FAILED.")
                elif is_pid_alive(previous.worker_pid, previous.worker_host):
                    self.add_error("status", "Tiến trình worker vẫn đang chạy, không thể chuyển sang trạng thái chưa rõ.")
                elif status == BirthdayEmailStatus.UNCERTAIN:
                    if not cleaned.get("worker_stopped"):
                        self.add_error("worker_stopped", "Cần xác nhận worker đã dừng.")
                    elif not is_local_host(previous.worker_host) and previous.worker_host:
                        if not cleaned.get("evidence", "").strip():
                            self.add_error(
                                "evidence",
                                "Worker chạy trên máy chủ khác, không thể kiểm tra tiến trình cục bộ. "
                                "Bắt buộc ghi rõ bằng chứng xác minh worker đã dừng.",
                            )
                elif status == BirthdayEmailStatus.SUCCESS:
                    if not cleaned.get("evidence", "").strip():
                        self.add_error("evidence", "Cần ghi bằng chứng đối soát từ nhà cung cấp SMTP.")
                    if not cleaned.get("sent_at"):
                        self.add_error("sent_at", "Cần ghi thời điểm SMTP chấp nhận thư.")
                else:
                    self.add_error("status", "Chuyển đổi trạng thái không hợp lệ từ PROCESSING.")
            elif previous.status == BirthdayEmailStatus.UNCERTAIN:
                if status not in (BirthdayEmailStatus.SUCCESS, BirthdayEmailStatus.FAILED):
                    self.add_error("status", "Chỉ được đối soát trạng thái chưa rõ sang thành công hoặc thất bại.")
                else:
                    if not cleaned.get("evidence", "").strip():
                        self.add_error("evidence", "Cần ghi bằng chứng đối soát từ nhà cung cấp SMTP.")
                    if status == BirthdayEmailStatus.SUCCESS and not cleaned.get("sent_at"):
                        self.add_error("sent_at", "Cần ghi thời điểm SMTP chấp nhận thư.")
            else:
                self.add_error("status", "Chỉ được đối soát trạng thái đang xử lý hoặc chưa rõ.")
        return cleaned


@admin.register(BirthdayEmailLog)
class BirthdayEmailLogAdmin(admin.ModelAdmin):
    form = BirthdayEmailReconciliationForm
    actions = None  # Không cung cấp thao tác gửi lại hàng loạt khi trạng thái chưa được xác minh
    list_display = (
        "staff",
        "birthday_year",
        "sent_date",
        "recipient_email",
        "status",
        "needs_reconciliation",
        "worker_info",
        "retry_count",
        "sent_at",
    )
    list_filter = (
        NeedsReconciliationFilter,
        "status",
        "sent_date",
        "card_template",
    )
    search_fields = (
        "staff__full_name",
        "recipient_email",
        "subject",
        "attempt_id",
        "worker_host",
    )
    readonly_fields = (
        "staff",
        "birthday_year",
        "sent_date",
        "recipient_email",
        "subject",
        "card_template",
        "retry_count",
        "attempt_id",
        "worker_pid",
        "worker_host",
        "worker_status",
        "created_at",
        "processed_at",
        "error_message",
        "skip_reason",
        "reconciliation_note",
        "reconciled_at",
    )
    fieldsets = (
        (
            "Thông tin người nhận & Sinh nhật",
            {
                "fields": (
                    "staff",
                    "recipient_email",
                    "sent_date",
                    "birthday_year",
                    "subject",
                    "card_template",
                )
            },
        ),
        (
            "Trạng thái gửi & Worker",
            {
                "fields": (
                    "status",
                    "retry_count",
                    "attempt_id",
                    "worker_pid",
                    "worker_host",
                    "worker_status",
                    "created_at",
                    "processed_at",
                    "sent_at",
                )
            },
        ),
        (
            "Chi tiết lỗi & Lý do bỏ qua",
            {
                "fields": (
                    "error_message",
                    "skip_reason",
                )
            },
        ),
        (
            "Đối soát trạng thái gửi (Quản trị viên)",
            {
                "fields": (
                    "worker_stopped",
                    "evidence",
                    "reconciliation_note",
                    "reconciled_at",
                    "_loaded_attempt_id_val",
                    "_loaded_status_val",
                ),
                "description": (
                    "Chỉ đối soát khi worker đã dừng hoặc đã có thông tin xác nhận từ nhà cung cấp SMTP. "
                    "Không được phép gửi lại hoặc thay đổi bản ghi khi chưa xác minh trạng thái."
                ),
            },
        ),
    )

    @admin.display(description="Cần đối soát", boolean=True)
    def needs_reconciliation(self, obj):
        """Đánh dấu trực quan các bản ghi ở trạng thái cần quản trị viên đối soát."""
        return obj.status in (BirthdayEmailStatus.PROCESSING, BirthdayEmailStatus.UNCERTAIN)

    @admin.display(description="Worker")
    def worker_info(self, obj):
        """Hiển thị tóm tắt worker_host:worker_pid."""
        if not obj.worker_pid and not obj.worker_host:
            return "-"
        return f"{obj.worker_host or 'localhost'}:{obj.worker_pid or '?'}"

    @admin.display(description="Trạng thái tiến trình worker")
    def worker_status(self, obj):
        """Kiểm tra và hiển thị trạng thái thực tế của tiến trình worker."""
        if not obj.worker_pid:
            return "Không có thông tin PID"
        alive = is_pid_alive(obj.worker_pid, obj.worker_host)
        if alive:
            return f"Đang chạy (PID {obj.worker_pid} trên {obj.worker_host or 'localhost'})"
        return f"Đã dừng (PID {obj.worker_pid})"

    def save_model(self, request, obj, form, change):
        if change:
            with transaction.atomic():
                locked_log = BirthdayEmailLog.objects.select_for_update().get(pk=obj.pk)
                loaded_attempt = getattr(form, "_loaded_attempt_id", None)
                loaded_status = getattr(form, "_loaded_status", None)

                # 1. So sánh attempt_id (kể cả khi attempt_id ban đầu là None)
                if hasattr(form, "_loaded_attempt_id") and str(locked_log.attempt_id or "") != str(loaded_attempt or ""):
                    raise forms.ValidationError(
                        "Mã phiên gửi (attempt_id) đã thay đổi trong cơ sở dữ liệu do worker hoặc quản trị viên khác thực thi. "
                        "Thao tác bị từ chối để tránh ghi đè dữ liệu."
                    )

                # 2. So sánh trạng thái từ lúc mở form
                if loaded_status is not None and locked_log.status != loaded_status:
                    raise forms.ValidationError(
                        f"Trạng thái bản ghi đã thay đổi trong cơ sở dữ liệu (từ {loaded_status} sang {locked_log.status}). "
                        "Thao tác bị từ chối để tránh ghi đè dữ liệu."
                    )

                # 3. Tính bất biến của SUCCESS: Không cho phép sửa đổi hoặc chuyển đổi trạng thái đã thành công
                if locked_log.status == BirthdayEmailStatus.SUCCESS:
                    if obj.status != BirthdayEmailStatus.SUCCESS or (obj.sent_at and locked_log.sent_at and obj.sent_at != locked_log.sent_at):
                        raise forms.ValidationError(
                            "Không được sửa nhật ký đã gửi thành công."
                        )

                # 4. Không cho phép ghi PROCESSING về PENDING khi worker vừa claim hoặc đang xử lý
                if locked_log.status == BirthdayEmailStatus.PROCESSING and obj.status == BirthdayEmailStatus.PENDING:
                    raise forms.ValidationError(
                        "Không được chuyển nhật ký từ PROCESSING về PENDING khi worker đang hoặc đã xử lý."
                    )

                # 5. Nếu bản ghi đang PROCESSING mà tiến trình worker vẫn đang chạy, cấm chuyển trạng thái
                if locked_log.status == BirthdayEmailStatus.PROCESSING and obj.status != BirthdayEmailStatus.PROCESSING:
                    if is_pid_alive(locked_log.worker_pid, locked_log.worker_host):
                        raise forms.ValidationError(
                            "Tiến trình worker vẫn đang chạy, không thể thay đổi trạng thái."
                        )

                # 6. Kiểm tra lại toàn bộ điều kiện chuyển trạng thái hợp lệ dựa trên dữ liệu mới nhất của locked_log
                if obj.status != locked_log.status:
                    cleaned_data = getattr(form, "cleaned_data", {}) or {}
                    evidence = cleaned_data.get("evidence", "").strip() if cleaned_data else ""
                    worker_stopped = cleaned_data.get("worker_stopped", False) if cleaned_data else False
                    sent_at = cleaned_data.get("sent_at") if cleaned_data else obj.sent_at

                    if locked_log.status == BirthdayEmailStatus.PROCESSING:
                        if obj.status == BirthdayEmailStatus.FAILED:
                            raise forms.ValidationError(
                                "Không được chuyển trực tiếp từ PROCESSING sang FAILED."
                            )
                        elif obj.status == BirthdayEmailStatus.UNCERTAIN:
                            if not worker_stopped:
                                raise forms.ValidationError("Cần xác nhận worker đã dừng.")
                            if not is_local_host(locked_log.worker_host) and locked_log.worker_host:
                                if not evidence:
                                    raise forms.ValidationError(
                                        "Worker chạy trên máy chủ khác, không thể kiểm tra tiến trình cục bộ. "
                                        "Bắt buộc ghi rõ bằng chứng xác minh worker đã dừng."
                                    )
                        elif obj.status == BirthdayEmailStatus.SUCCESS:
                            if not evidence:
                                raise forms.ValidationError("Cần ghi bằng chứng đối soát từ nhà cung cấp SMTP.")
                            if not sent_at:
                                raise forms.ValidationError("Cần ghi thời điểm SMTP chấp nhận thư.")
                        else:
                            raise forms.ValidationError("Chuyển đổi trạng thái không hợp lệ từ PROCESSING.")

                    elif locked_log.status == BirthdayEmailStatus.UNCERTAIN:
                        if obj.status not in (BirthdayEmailStatus.SUCCESS, BirthdayEmailStatus.FAILED):
                            raise forms.ValidationError(
                                "Chỉ được đối soát trạng thái chưa rõ sang thành công hoặc thất bại."
                            )
                        if not evidence:
                            raise forms.ValidationError("Cần ghi bằng chứng đối soát từ nhà cung cấp SMTP.")
                        if obj.status == BirthdayEmailStatus.SUCCESS and not sent_at:
                            raise forms.ValidationError("Cần ghi thời điểm SMTP chấp nhận thư.")

                    else:
                        raise forms.ValidationError(
                            "Chỉ được đối soát trạng thái đang xử lý hoặc chưa rõ."
                        )

                    # Áp dụng các thay đổi đối soát hợp lệ
                    if evidence:
                        obj.reconciliation_note = evidence
                    obj.reconciled_at = timezone.now()
                    # Vô hiệu hóa attempt_id hiện tại để worker cũ không thể ghi đè
                    obj.attempt_id = None

                super().save_model(request, obj, form, change)
        else:
            super().save_model(request, obj, form, change)

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        try:
            return super().changeform_view(request, object_id, form_url, extra_context)
        except forms.ValidationError as exc:
            if hasattr(exc, "message_dict"):
                messages_list = [f"{field}: {', '.join(errs)}" for field, errs in exc.message_dict.items()]
                msg = "; ".join(messages_list)
            elif hasattr(exc, "messages"):
                msg = "; ".join(exc.messages)
            elif hasattr(exc, "message"):
                msg = str(exc.message)
            else:
                msg = str(exc)
            self.message_user(
                request,
                f"Thao tác bị từ chối do xung đột dữ liệu: {msg}",
                level=messages.ERROR,
                fail_silently=True,
            )
            redirect_url = (
                request.path
                if request and hasattr(request, "path") and request.path
                else f"/admin/birthdays/birthdayemaillog/{object_id}/change/"
            )
            return HttpResponseRedirect(redirect_url)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
