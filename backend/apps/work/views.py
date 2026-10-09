import datetime
import logging

import django

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import get_connection, send_mass_mail
from django.db import transaction
from django.db.models import Exists, OuterRef, Prefetch, Q
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import (
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from work.models import (
    AttachmentKind,
    ParticipantRole,
    Task,
    TaskAttachment,
    TaskDonVi,
    TaskComment,
    TaskParticipant,
    TaskRuleError,
    TaskStatus,
    delete_stored_files_on_commit,
)
from work.serializers import (
    CommentSerializer,
    employee_full_name,
    EmployeeSerializer,
    LatestTaskSerializer,
    MeSerializer,
    TaskDetailSerializer,
    TaskListSerializer,
    TaskWriteSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)

TASK_NOT_FOUND_MESSAGE = (
    "Không tìm thấy công việc, hoặc bạn không có quyền xem công việc này. "
    "Hãy quay lại danh sách và tải lại trang."
)


# ==========================================================================
# ===== KHU VỰC: Phân trang, lớp nền =====
# ==========================================================================

class TaskPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "pageSize"
    max_page_size = 100
    invalid_page_message = (
        "Trang {page_number} không tồn tại. Hãy quay về trang 1 hoặc chọn trang nhỏ hơn."
    )

    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            "page": self.page.number,
            "pageSize": self.page.paginator.per_page,
            "totalPages": self.page.paginator.num_pages,
            "results": data,
        })


class WorkApiMixin:
    """Cấu hình chung cho mọi API của module Công việc."""

    # Dùng đúng cơ chế đăng nhập chung của dự án: JWT do `accounts/login/` cấp.
    # Không còn lớp xác thực giả lập: request không có token thì trả 401 (issue #65-1).
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def permission_denied(self, request, message=None, code=None):
        if request.authenticators and not request.successful_authenticator:
            raise NotAuthenticated(
                "Bạn chưa đăng nhập. Hãy đăng nhập để lấy token rồi thử lại."
            )
        super().permission_denied(request, message=message, code=code)


def raise_rule_error(error):
    """Đổi TaskRuleError của models.py thành lỗi HTTP: sai vai trò → 403, sai trạng thái → 400."""
    if error.kind == TaskRuleError.INVALID_STATE:
        raise ValidationError({"detail": error.message})
    raise PermissionDenied(error.message)


def parse_date_param(request, name, label):
    raw = request.query_params.get(name, "").strip()
    if not raw:
        return None
    try:
        return datetime.date.fromisoformat(raw)
    except ValueError:
        raise ValidationError({name: [f"{label} không hợp lệ. Hãy chọn lại {label.lower()} trên lịch."]})


class TaskViewSet(
    WorkApiMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    /api/work/tasks/ — công việc.
    Quyền xem được lọc ở get_queryset (không thấy → 404).
    Quyền thao tác kiểm tra bằng các hàm check_* trong models.py.
    """

    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    # JSON đứng đầu để trang API trên trình duyệt điền sẵn form; upload file vẫn dùng multipart.
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = TaskPagination
    lookup_value_regex = r"\d+"

    def get_queryset(self):
        participants = Prefetch(
            "participants",
            queryset=TaskParticipant.objects.select_related("user").order_by("id"),
        )
        queryset = (
            Task.objects.visible_to(self.request.user)
            .with_status()
            .select_related("created_by", "first_opened_by", "approved_by")
            .prefetch_related(participants)
            .order_by("-created_date", "-created_at", "-id")
        )
        if self.action != "list":
            attachments = Prefetch(
                "attachments",
                queryset=TaskAttachment.objects.filter(is_deleted=False)
                .select_related("uploaded_by")
                .order_by("uploaded_at", "id"),
            )
            queryset = queryset.prefetch_related(attachments, "don_vi_links")
        return queryset

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise NotFound(TASK_NOT_FOUND_MESSAGE)

    def get_serializer_class(self):
        if self.action == "list":
            return TaskListSerializer
        if self.action in ("create", "partial_update"):
            return TaskWriteSerializer
        return TaskDetailSerializer

    def detail_response(self, pk, http_status=status.HTTP_200_OK):
        """Đọc lại công việc từ DB (trạng thái mới nhất) rồi trả về dạng chi tiết."""
        task = self.get_queryset().get(pk=pk)
        serializer = TaskDetailSerializer(task, context=self.get_serializer_context())
        return Response(serializer.data, status=http_status)

    # ----------------------------------------------------------------------
    # API trang chủ (nhóm 1): GET /api/work/tasks/latest/?limit=5
    # ----------------------------------------------------------------------
    @action(detail=False, methods=["get"])
    def latest(self, request):
        raw_limit = request.query_params.get("limit", "5")
        if not raw_limit.isdigit() or not 1 <= int(raw_limit) <= 20:
            raise ValidationError({"limit": ["Số công việc cần lấy phải từ 1 đến 20. Hãy gửi lại limit trong khoảng này."]})
        tasks = (
            Task.objects.visible_to(request.user)
            .with_status()
            .order_by("-created_date", "-created_at", "-id")[: int(raw_limit)]
        )
        return Response(LatestTaskSerializer(tasks, many=True).data)

    # ======================================================================
    # ===== KHU VỰC: Danh sách, chi tiết, thêm / sửa / xóa =====
    # ======================================================================

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action != "list":
            return queryset

        params = self.request.query_params

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(title__icontains=search)

        status_value = params.get("status", "").strip()
        if status_value:
            if status_value not in TaskStatus.values:
                raise ValidationError({
                    "status": [f"Tình trạng \"{status_value}\" không hợp lệ. Hãy chọn một tình trạng trong danh sách."]
                })
            # Lọc trên cột annotate → điều kiện nằm trong câu SQL, phân trang đếm đúng.
            queryset = queryset.filter(status=status_value)

        created_from = parse_date_param(self.request, "createdFrom", "Từ ngày tạo")
        created_to = parse_date_param(self.request, "createdTo", "Đến ngày tạo")
        if created_from and created_to and created_from > created_to:
            raise ValidationError({
                "createdFrom": ["Từ ngày tạo đang sau đến ngày tạo. Hãy chọn lại khoảng ngày tạo."]
            })
        if created_from:
            queryset = queryset.filter(created_date__gte=created_from)
        if created_to:
            queryset = queryset.filter(created_date__lte=created_to)

        return queryset

    def create(self, request, *args, **kwargs):
        # Chỉ người đã đăng nhập mới tạo được công việc (permission_classes = IsAuthenticated).
        # TODO(#65-2, cho C2 Nhom 7): thay bang require_permission("add_congviec") khi RBAC len staging.
        serializer = TaskWriteSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        # Chỉ gửi khi dữ liệu đã lưu chắc chắn; gửi lỗi cũng không làm hỏng việc tạo công việc.
        transaction.on_commit(lambda: send_new_task_mail(task.pk))
        return self.detail_response(task.pk, status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()
        try:
            task.check_edit(request.user)
        except TaskRuleError as error:
            raise_rule_error(error)

        serializer = TaskWriteSerializer(
            task,
            data=request.data,
            partial=True,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return self.detail_response(task.pk)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        try:
            task.check_delete(request.user)
        except TaskRuleError as error:
            raise_rule_error(error)

        with transaction.atomic():
            file_names = list(task.attachments.values_list("file", flat=True))
            task.delete()
            delete_stored_files_on_commit(file_names)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ======================================================================
    # ===== KHU VỰC: Mở chi tiết, bằng chứng, duyệt, ý kiến =====
    # ======================================================================

    @action(detail=True, methods=["post"])
    def open(self, request, pk=None):
        """Trang chi tiết gọi khi vừa mở. Ghi nhận 'đã mở' nếu đủ điều kiện, trả về chi tiết."""
        task = self.get_object()
        if task.can_mark_opened(request.user):
            # UPDATE có điều kiện: nhiều người mở cùng lúc thì chỉ người đầu tiên được ghi nhận.
            Task.objects.filter(
                pk=task.pk,
                first_opened_at__isnull=True,
                due_date__gte=timezone.localdate(),
            ).update(first_opened_at=timezone.now(), first_opened_by=request.user)
        return self.detail_response(task.pk)

    @action(detail=True, methods=["delete"], url_path=r"evidences/(?P<attachment_id>\d+)")
    def delete_evidence(self, request, pk=None, attachment_id=None):
        task = self.get_object()
        attachment = next((item for item in task.attachments.all() if item.pk == int(attachment_id)), None)
        if attachment is None:
            raise NotFound(
                "Không tìm thấy file bằng chứng. Có thể file đã bị xóa trước đó, hãy tải lại trang."
            )
        try:
            task.check_delete_evidence(request.user, attachment)
        except TaskRuleError as error:
            raise_rule_error(error)

        # Xóa mềm theo chuẩn CSDL (cột is_deleted): giữ bản ghi và file, chỉ thôi hiển thị.
        attachment.is_deleted = True
        attachment.save(update_fields=["is_deleted"])
        return self.detail_response(task.pk)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        task = self.get_object()
        try:
            task.check_approve(request.user)
        except TaskRuleError as error:
            raise_rule_error(error)

        has_evidence = Exists(
            TaskAttachment.objects.filter(task=OuterRef("pk"), kind=AttachmentKind.BANG_CHUNG)
        )
        with transaction.atomic():
            updated = (
                Task.objects.filter(pk=task.pk, approved_at__isnull=True)
                .filter(has_evidence)
                .update(approved_at=timezone.now(), approved_by=request.user)
            )
        if not updated:
            raise ValidationError({
                "detail": "Trạng thái công việc vừa thay đổi nên chưa duyệt được. Hãy tải lại trang rồi thử lại."
            })
        return self.detail_response(task.pk)

    @action(detail=True, methods=["post"])
    def unapprove(self, request, pk=None):
        task = self.get_object()
        try:
            task.check_unapprove(request.user)
        except TaskRuleError as error:
            raise_rule_error(error)

        with transaction.atomic():
            updated = Task.objects.filter(pk=task.pk, approved_at__isnull=False).update(
                approved_at=None,
                approved_by=None,
            )
        if not updated:
            raise ValidationError({
                "detail": "Công việc vừa được người khác hủy duyệt. Hãy tải lại trang để xem trạng thái mới nhất."
            })
        return self.detail_response(task.pk)

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        """
        GET: danh sách ý kiến (cũ trước, mới sau) kèm file.
        POST: ghi ý kiến, có thể kèm file kết quả; đây là cách duy nhất để nộp bằng chứng hoàn thành.
        """
        task = self.get_object()
        context = {**self.get_serializer_context(), "task": task}

        if request.method == "GET":
            attachments = Prefetch(
                "attachments",
                queryset=TaskAttachment.objects.filter(is_deleted=False)
                .select_related("uploaded_by")
                .order_by("uploaded_at", "id"),
            )
            items = (
                TaskComment.objects.filter(task=task)
                .select_related("author")
                .prefetch_related(attachments)
                .order_by("created_at", "id")
            )
            return Response(CommentSerializer(items, many=True, context=context).data)

        try:
            task.check_comment(request.user)
        except TaskRuleError as error:
            raise_rule_error(error)

        serializer = CommentSerializer(data=request.data, context=context)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("files"):
            try:
                task.check_submit_evidence(request.user)
            except TaskRuleError as error:
                raise_rule_error(error)

        with transaction.atomic():
            comment = serializer.save(task=task, author=request.user)

        # Đọc lại công việc để cờ canDelete của file mới tính theo trạng thái mới nhất.
        fresh_task = self.get_queryset().get(pk=task.pk)
        data = CommentSerializer(comment, context={**context, "task": fresh_task}).data
        return Response(data, status=status.HTTP_201_CREATED)


def work_mail_connection():
    """
    Kết nối gửi mail theo cấu hình MAILERS["default"] trong settings.py.

    - Django >= 6.1 tự đọc MAILERS, và get_connection(backend=...) đã bị bỏ (báo RuntimeError),
      nên trả None để dùng kết nối mặc định.
    - Django 5.2 (bản ghim trong requirements) chưa hiểu MAILERS, mặc định là SMTP, nên phải
      tạo kết nối theo backend khai báo trong MAILERS (console khi phát triển).
    """
    if django.VERSION >= (6, 1):
        return None

    mailers = getattr(settings, "MAILERS", None)
    backend = None
    if isinstance(mailers, dict):
        backend = mailers.get("default", {}).get("BACKEND")
    return get_connection(backend=backend)


def send_new_task_mail(task_id):
    """
    Báo công việc mới cho người liên quan (chủ trì, chỉ đạo, cán bộ tham gia), trừ người tạo.
    - Chỉ gửi lúc tạo mới, không gửi khi sửa.
    - Công việc đang ẩn thì không gửi, vì người nhận chưa mở được công việc.
    - Người chưa khai báo email thì bỏ qua.
    Trả về số thư đã gửi.
    """
    task = (
        Task.objects.select_related("created_by")
        .prefetch_related(Prefetch("participants", queryset=TaskParticipant.objects.select_related("user")))
        .filter(pk=task_id)
        .first()
    )
    if task is None or not task.is_public:
        return 0

    creator_name = employee_full_name(task.created_by)
    host = next((p.user for p in task.participants.all() if p.role == ParticipantRole.CHU_TRI), None)
    subject = f"[Công việc] Bạn được giao công việc mới: {task.title[:80]}"

    messages = []
    notified = set()
    for participant in task.participants.all():
        user = participant.user
        if user.pk == task.created_by_id or user.pk in notified or not user.email:
            continue
        notified.add(user.pk)
        body = "\n".join([
            f"Xin chào {employee_full_name(user)},",
            "",
            f"{creator_name} vừa giao một công việc mới. Vai trò của bạn: {participant.get_role_display()}.",
            "",
            f"Nội dung công việc: {task.title}",
            f"Yêu cầu xử lý: {task.requirement}",
            f"Ngày tạo: {task.created_date:%d/%m/%Y}",
            f"Hạn xử lý: {task.due_date:%d/%m/%Y}",
            f"Người chủ trì: {employee_full_name(host) if host else '—'}",
            "",
            'Hãy đăng nhập hệ thống, vào mục "Quản Lý Công Việc" để xem chi tiết và xử lý.',
            "",
            "Đây là thư tự động, vui lòng không trả lời thư này.",
        ])
        messages.append((subject, body, None, [user.email]))

    if not messages:
        return 0
    try:
        return send_mass_mail(messages, connection=work_mail_connection())
    except Exception:
        logger.exception("Không gửi được mail báo công việc mới #%s", task_id)
        return 0


class AttachmentViewSet(WorkApiMixin, viewsets.GenericViewSet):
    """/api/work/attachments/{id}/download/ — tải file, có kiểm tra quyền xem công việc."""

    lookup_value_regex = r"\d+"

    def get_queryset(self):
        visible_tasks = Task.objects.visible_to(self.request.user)
        return TaskAttachment.objects.filter(task__in=visible_tasks, is_deleted=False)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        attachment = self.get_queryset().filter(pk=pk).first()
        if attachment is None:
            raise NotFound(
                "Không tìm thấy file, hoặc bạn không có quyền xem công việc chứa file này. "
                "Hãy tải lại trang chi tiết công việc rồi thử lại."
            )
        try:
            file_handle = attachment.file.open("rb")
        except (FileNotFoundError, OSError):
            raise NotFound(
                "File không còn trên máy chủ. Hãy báo người đã tải file lên để nộp lại file."
            )
        return FileResponse(file_handle, as_attachment=True, filename=attachment.original_name)


# ==========================================================================
# ===== KHU VỰC: Cán bộ nhân viên, người dùng hiện tại =====
# ==========================================================================

class EmployeeViewSet(WorkApiMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    /api/work/employees/?search= — danh sách CBNV cho ô chọn người.
    Trả mảng phẳng (ô chọn người của frontend cần mảng), không theo phân trang chung của dự án.
    """

    serializer_class = EmployeeSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = User.objects.filter(is_active=True).order_by("ho_ten", "username")
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(ho_ten__icontains=search)
            )
        return queryset


class MeView(WorkApiMixin, APIView):
    """/api/work/me/ — người dùng đang đăng nhập (đang giả lập)."""

    def get(self, request):
        return Response(MeSerializer(request.user).data)
