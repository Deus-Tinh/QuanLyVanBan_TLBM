import uuid
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Case, CharField, Exists, F, OuterRef, Q, Value, When
from django.utils import timezone


# ==========================================================================
# HẰNG SỐ & VALIDATOR FILE
# Dùng chung cho file đính kèm lúc giao việc và file bằng chứng hoàn thành.
# ==========================================================================

ALLOWED_FILE_EXTENSIONS = {"pdf", "doc", "docx", "jpg", "jpeg", "png"}
IMAGE_FILE_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # dung lượng phải NHỎ HƠN 20MB

# Vai trò "người tạo" không lưu trong TaskParticipant, chỉ dùng khi tính quyền.
ROLE_CREATOR = "NGUOI_TAO"


def validate_work_file(file):
    """Kiểm tra định dạng và dung lượng file tải lên."""
    file_name = Path(file.name).name
    extension = Path(file_name).suffix.lower().lstrip(".")

    if extension not in ALLOWED_FILE_EXTENSIONS:
        raise ValidationError(
            f'File "{file_name}" không đúng định dạng. '
            "Hãy chọn file PDF, DOC/DOCX, JPG, JPEG hoặc PNG."
        )

    if file.size >= MAX_FILE_SIZE:
        size_mb = file.size / (1024 * 1024)
        raise ValidationError(
            f'File "{file_name}" có dung lượng {size_mb:.1f} MB, vượt giới hạn. '
            "Hãy chọn file dưới 20 MB hoặc nén file trước khi tải lên."
        )

    # Chỉ kiểm tra nội dung ảnh với file mới tải lên (file đã lưu thì đã được kiểm tra trước đó).
    is_new_upload = not getattr(file, "_committed", False)
    if extension in IMAGE_FILE_EXTENSIONS and is_new_upload:
        from PIL import Image

        try:
            file.seek(0)
            Image.open(file).verify()
        except Exception:
            raise ValidationError(
                f'File "{file_name}" có đuôi .{extension} nhưng không phải ảnh hợp lệ. '
                "Hãy mở thử file trên máy, lưu lại dưới dạng JPG hoặc PNG rồi tải lên lại."
            )
        finally:
            file.seek(0)


def attachment_upload_to(instance, filename):
    """
    Lưu vào media/06_tasks/<năm>/<tháng>/ theo quy định của PM.
    Tên file trên đĩa là chuỗi ngẫu nhiên để tránh trùng tên và lỗi ký tự tiếng Việt;
    tên gốc được giữ ở cột original_name.
    """
    extension = Path(filename).suffix.lower()
    return f"06_tasks/{timezone.localdate():%Y/%m}/{uuid.uuid4().hex}{extension}"


def delete_stored_files_on_commit(file_names):
    """
    Xóa file vật lý sau khi transaction commit thành công.
    Django không tự xóa file khi xóa bản ghi; nếu transaction lỗi thì file vẫn được giữ lại.
    """
    names = [name for name in file_names if name]
    if not names:
        return

    def _delete():
        from django.core.files.storage import default_storage

        for name in names:
            try:
                default_storage.delete(name)
            except OSError:
                # File đã mất trên đĩa thì bỏ qua, không làm hỏng thao tác xóa dữ liệu.
                pass

    transaction.on_commit(_delete)


# ==========================================================================
# LỰA CHỌN (CHOICES)
# ==========================================================================

class TaskStatus(models.TextChoices):
    """Trạng thái công việc — giá trị TÍNH TOÁN, không lưu trong DB."""

    CHO_XU_LY = "CHO_XU_LY", "Chờ xử lý"
    DANG_XU_LY = "DANG_XU_LY", "Đang xử lý"
    CHO_DUYET = "CHO_DUYET", "Chờ duyệt"
    HOAN_THANH = "HOAN_THANH", "Hoàn thành"
    CHUA_HOAN_THANH = "CHUA_HOAN_THANH", "Chưa hoàn thành"
    QUA_HAN = "QUA_HAN", "Quá hạn"


FROZEN_STATUSES = {TaskStatus.CHUA_HOAN_THANH, TaskStatus.QUA_HAN}


class TaskRuleError(Exception):
    """
    Thao tác bị chặn theo quy tắc nghiệp vụ.
    - kind = "forbidden": sai vai trò (view trả 403)
    - kind = "invalid_state": đúng vai trò nhưng trạng thái không cho phép (view trả 400)
    Thông báo luôn nêu lý do và cách khắc phục.
    """

    FORBIDDEN = "forbidden"
    INVALID_STATE = "invalid_state"

    def __init__(self, message, kind=FORBIDDEN):
        super().__init__(message)
        self.message = message
        self.kind = kind


FROZEN_MESSAGE = (
    "Công việc đã hết hạn khi chưa nộp bằng chứng nên đã bị khóa, không thể {action}. "
    "Nếu vẫn cần thực hiện, hãy đề nghị người tạo giao công việc mới."
)


class ParticipantRole(models.TextChoices):
    CHU_TRI = "CHU_TRI", "Chủ trì giải quyết công việc"
    CHI_DAO = "CHI_DAO", "Chỉ đạo - Theo dõi tiến độ xử lý công việc"
    THAM_GIA = "THAM_GIA", "Cán bộ tham gia giải quyết công việc"


# Người được duyệt / hủy duyệt: người tạo, chủ trì, chỉ đạo.
APPROVER_ROLES = {ROLE_CREATOR, ParticipantRole.CHU_TRI, ParticipantRole.CHI_DAO}


class AttachmentKind(models.TextChoices):
    GIAO_VIEC = "GIAO_VIEC", "Đính kèm lúc giao việc"
    BANG_CHUNG = "BANG_CHUNG", "Bằng chứng hoàn thành"


# ==========================================================================
# QUERYSET
# ==========================================================================

class TaskQuerySet(models.QuerySet):
    def with_status(self, today=None):
        """
        Gắn cột `status` tính ngay trong DB để lọc theo trạng thái và phân trang không bị sai.
        Thứ tự When quyết định độ ưu tiên — KHÔNG đổi thứ tự nếu chưa hỏi trưởng nhóm.
        """
        today = today or timezone.localdate()
        evidences = TaskAttachment.objects.filter(
            task=OuterRef("pk"),
            kind=AttachmentKind.BANG_CHUNG,
        )
        return self.annotate(has_evidence=Exists(evidences)).annotate(
            status=Case(
                When(approved_at__isnull=False, then=Value(TaskStatus.HOAN_THANH)),
                # Đã nộp bằng chứng thì không bị đóng băng, kể cả khi quá hạn.
                When(has_evidence=True, then=Value(TaskStatus.CHO_DUYET)),
                When(
                    due_date__lt=today,
                    first_opened_at__isnull=False,
                    then=Value(TaskStatus.CHUA_HOAN_THANH),
                ),
                When(due_date__lt=today, then=Value(TaskStatus.QUA_HAN)),
                When(first_opened_at__isnull=False, then=Value(TaskStatus.DANG_XU_LY)),
                default=Value(TaskStatus.CHO_XU_LY),
                output_field=CharField(),
            )
        )

    def visible_to(self, user):
        """
        Công việc người dùng được xem:
        - Quản trị viên (is_superuser): tất cả, kể cả công việc đang ẩn.
        - Người tạo: luôn thấy công việc của mình.
        - Chủ trì / chỉ đạo / tham gia: chỉ thấy khi công việc đang hiển thị (is_public).
        """
        if user is None or not user.is_authenticated:
            return self.none()
        if user.is_superuser:
            return self

        is_participant = Exists(
            TaskParticipant.objects.filter(task=OuterRef("pk"), user=user)
        )
        return self.alias(is_participant=is_participant).filter(
            Q(created_by=user) | Q(is_public=True, is_participant=True)
        )


# ==========================================================================
# MODEL
# ==========================================================================

class Task(models.Model):
    title = models.TextField("Nội dung công việc")
    created_date = models.DateField("Ngày tạo", default=timezone.localdate)
    due_date = models.DateField("Ngày xử lý")
    requirement = models.TextField("Yêu cầu xử lý")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người tạo",
        on_delete=models.PROTECT,
        related_name="work_created_tasks",
    )
    is_public = models.BooleanField("Trạng thái hiển thị", default=True)
    # TODO: FK toi van ban cua nhom 2 - cho ten model
    # Công việc có thể phát sinh từ Văn bản đến / Văn bản đi. Khi nhóm 2 chốt tên model, thêm:
    # van_ban = models.ForeignKey("<app>.<Model>", verbose_name="Văn bản liên quan",
    #                             on_delete=models.SET_NULL, null=True, blank=True, related_name="work_tasks")

    # Mốc hệ thống phục vụ tính trạng thái (đầy đủ giờ - phút - giây).
    first_opened_at = models.DateTimeField("Thời điểm mở lần đầu", null=True, blank=True)
    first_opened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người mở lần đầu",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    approved_at = models.DateTimeField("Thời điểm duyệt", null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người duyệt",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    created_at = models.DateTimeField("Tạo lúc", auto_now_add=True)
    updated_at = models.DateTimeField("Cập nhật lúc", auto_now=True)

    objects = TaskQuerySet.as_manager()

    class Meta:
        verbose_name = "Công việc"
        verbose_name_plural = "Công việc"
        ordering = ["-created_date", "-created_at"]
        indexes = [
            models.Index(fields=["created_date"], name="work_task_created_date_idx"),
            models.Index(fields=["due_date"], name="work_task_due_date_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(due_date__gte=F("created_date")),
                name="work_task_due_after_created",
                violation_error_message=(
                    "Ngày xử lý đang trước ngày tạo. "
                    "Hãy chọn ngày xử lý bằng hoặc sau ngày tạo."
                ),
            ),
        ]

    def __str__(self):
        return self.title[:80]

    def roles_of(self, user):
        """Tập vai trò của user trong công việc: NGUOI_TAO, CHU_TRI, CHI_DAO, THAM_GIA."""
        roles = set()
        if user is None or not user.is_authenticated:
            return roles
        if self.created_by_id == user.id:
            roles.add(ROLE_CREATOR)
        # Dùng .all() để tận dụng prefetch_related khi có.
        for participant in self.participants.all():
            if participant.user_id == user.id:
                roles.add(participant.role)
        return roles

    def get_status(self):
        """Trạng thái đã annotate bởi with_status(); nếu chưa có thì truy vấn lại DB."""
        status = getattr(self, "status", None)
        if status is None:
            status = Task.objects.with_status().values_list("status", flat=True).get(pk=self.pk)
            self.status = status
        return status

    def evidence_files(self):
        # Dùng .all() rồi lọc bằng Python để tận dụng prefetch_related khi có.
        return [item for item in self.attachments.all() if item.kind == AttachmentKind.BANG_CHUNG]

    def is_overdue(self):
        return self.due_date < timezone.localdate()

    # ----------------------------------------------------------------------
    # QUY TẮC QUYỀN
    # check_*: ném TaskRuleError kèm thông báo có hướng khắc phục.
    # can_*:   trả True/False, dùng để sinh cờ `permissions` cho frontend.
    # View và serializer CHỈ dùng các hàm này, không tự viết lại điều kiện.
    # ----------------------------------------------------------------------

    def check_edit(self, user):
        roles = self.roles_of(user)
        if not roles & {ROLE_CREATOR, ParticipantRole.CHU_TRI}:
            raise TaskRuleError(
                "Chỉ người tạo hoặc người chủ trì mới được sửa công việc này. "
                "Nếu cần thay đổi, hãy liên hệ người tạo hoặc người chủ trì."
            )
        status = self.get_status()
        if status == TaskStatus.CHO_DUYET:
            raise TaskRuleError(
                "Công việc đang chờ duyệt nên không thể sửa. "
                "Nếu thông tin sai nghiêm trọng, hãy xóa công việc và tạo lại.",
                TaskRuleError.INVALID_STATE,
            )
        if status == TaskStatus.HOAN_THANH:
            raise TaskRuleError(
                "Công việc đã hoàn thành nên không thể sửa. "
                "Nếu thông tin sai nghiêm trọng, hãy xóa công việc và tạo lại.",
                TaskRuleError.INVALID_STATE,
            )
        if status in FROZEN_STATUSES:
            raise TaskRuleError(FROZEN_MESSAGE.format(action="sửa"), TaskRuleError.INVALID_STATE)

    def check_delete(self, user):
        if not self.roles_of(user) & {ROLE_CREATOR, ParticipantRole.CHU_TRI}:
            raise TaskRuleError(
                "Chỉ người tạo hoặc người chủ trì mới được xóa công việc này. "
                "Nếu cần xóa, hãy liên hệ người tạo hoặc người chủ trì."
            )

    def can_mark_opened(self, user):
        """Chỉ chủ trì / chỉ đạo / tham gia mở lần đầu, và chỉ khi chưa quá hạn, mới tính là 'đã mở'."""
        roles = self.roles_of(user)
        return (
            bool(roles & {ParticipantRole.CHU_TRI, ParticipantRole.CHI_DAO, ParticipantRole.THAM_GIA})
            and self.first_opened_at is None
            and not self.is_overdue()
        )

    def check_submit_evidence(self, user):
        if not self.roles_of(user) & {ParticipantRole.CHU_TRI, ParticipantRole.THAM_GIA}:
            raise TaskRuleError(
                "Chỉ người chủ trì hoặc cán bộ tham gia mới được đính kèm file kết quả vào ý kiến. "
                "Hãy bỏ file và gửi ý kiến dạng chữ, hoặc báo người chủ trì nộp kết quả."
            )
        status = self.get_status()
        if status == TaskStatus.HOAN_THANH:
            raise TaskRuleError(
                "Công việc đã được duyệt hoàn thành nên không thể đính kèm thêm file kết quả. "
                "Hãy gửi ý kiến không kèm file, hoặc đề nghị người có quyền duyệt hủy duyệt trước.",
                TaskRuleError.INVALID_STATE,
            )
        if status in FROZEN_STATUSES:
            raise TaskRuleError(
                FROZEN_MESSAGE.format(action="nộp kết quả"), TaskRuleError.INVALID_STATE
            )

    def check_delete_evidence(self, user, attachment):
        if attachment.task_id != self.pk or attachment.kind != AttachmentKind.BANG_CHUNG:
            raise TaskRuleError(
                "File này không phải file bằng chứng của công việc. "
                "File đính kèm lúc giao việc chỉ xóa được trong màn hình sửa công việc.",
                TaskRuleError.INVALID_STATE,
            )
        if user is None or attachment.uploaded_by_id != user.id:
            raise TaskRuleError(
                "Bạn chỉ được xóa file bằng chứng do chính mình tải lên. "
                "Nếu file này sai, hãy báo người đã tải file để họ xóa."
            )
        if self.get_status() == TaskStatus.HOAN_THANH:
            raise TaskRuleError(
                "Công việc đã được duyệt nên không thể xóa file bằng chứng. "
                "Nếu cần thay file, hãy đề nghị người chủ trì hoặc người chỉ đạo hủy duyệt trước.",
                TaskRuleError.INVALID_STATE,
            )
        if self.is_overdue() and len(self.evidence_files()) <= 1:
            raise TaskRuleError(
                "Công việc đã quá hạn, không thể xóa file bằng chứng cuối cùng. "
                "Hãy nộp file mới trước rồi xóa file cũ sau.",
                TaskRuleError.INVALID_STATE,
            )

    def check_approve(self, user):
        if not self.roles_of(user) & APPROVER_ROLES:
            raise TaskRuleError(
                "Chỉ người tạo, người chủ trì hoặc người chỉ đạo mới được duyệt công việc. "
                "Hãy báo một trong những người này vào duyệt."
            )
        status = self.get_status()
        if status == TaskStatus.HOAN_THANH:
            raise TaskRuleError(
                "Công việc đã được duyệt trước đó. Hãy tải lại trang để xem trạng thái mới nhất.",
                TaskRuleError.INVALID_STATE,
            )
        if status in FROZEN_STATUSES:
            raise TaskRuleError(FROZEN_MESSAGE.format(action="duyệt"), TaskRuleError.INVALID_STATE)
        if status != TaskStatus.CHO_DUYET:
            raise TaskRuleError(
                "Công việc chưa có file kết quả nào nên chưa thể duyệt. "
                "Hãy chờ người chủ trì hoặc cán bộ tham gia gửi ý kiến kèm file kết quả.",
                TaskRuleError.INVALID_STATE,
            )

    def check_unapprove(self, user):
        if not self.roles_of(user) & APPROVER_ROLES:
            raise TaskRuleError(
                "Chỉ người tạo, người chủ trì hoặc người chỉ đạo mới được hủy duyệt công việc. "
                "Hãy báo một trong những người này nếu cần thu hồi kết quả duyệt."
            )
        if self.get_status() != TaskStatus.HOAN_THANH:
            raise TaskRuleError(
                "Công việc chưa được duyệt nên không có gì để hủy duyệt. "
                "Hãy tải lại trang để xem trạng thái mới nhất.",
                TaskRuleError.INVALID_STATE,
            )

    def check_comment(self, user):
        if not self.roles_of(user):
            raise TaskRuleError(
                "Chỉ người liên quan đến công việc mới được ghi ý kiến. "
                "Nếu bạn cần góp ý, hãy đề nghị người tạo thêm bạn vào công việc."
            )
        if self.get_status() in FROZEN_STATUSES:
            raise TaskRuleError(FROZEN_MESSAGE.format(action="ghi thêm ý kiến"), TaskRuleError.INVALID_STATE)

    def _passes(self, check, *args):
        try:
            check(*args)
        except TaskRuleError:
            return False
        return True

    def can_edit(self, user):
        return self._passes(self.check_edit, user)

    def can_delete(self, user):
        return self._passes(self.check_delete, user)

    def can_submit_evidence(self, user):
        return self._passes(self.check_submit_evidence, user)

    def can_delete_evidence(self, user, attachment):
        return self._passes(self.check_delete_evidence, user, attachment)

    def can_approve(self, user):
        return self._passes(self.check_approve, user)

    def can_unapprove(self, user):
        return self._passes(self.check_unapprove, user)

    def can_comment(self, user):
        return self._passes(self.check_comment, user)


class TaskParticipant(models.Model):
    task = models.ForeignKey(
        Task,
        verbose_name="Công việc",
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Cán bộ",
        on_delete=models.PROTECT,
        related_name="work_participations",
    )
    role = models.CharField("Vai trò", max_length=20, choices=ParticipantRole.choices)

    class Meta:
        verbose_name = "Người liên quan"
        verbose_name_plural = "Người liên quan"
        indexes = [
            models.Index(fields=["user", "role"], name="work_participant_user_role_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["task", "user"],
                name="work_participant_one_role_per_user",
                violation_error_message=(
                    "Một cán bộ chỉ được giữ một vai trò trong cùng công việc. "
                    "Hãy bỏ cán bộ này khỏi các vai trò còn lại."
                ),
            ),
            models.UniqueConstraint(
                fields=["task"],
                condition=Q(role=ParticipantRole.CHU_TRI),
                name="work_participant_one_host",
                violation_error_message=(
                    "Mỗi công việc chỉ có một người chủ trì. "
                    "Hãy giữ lại một người chủ trì và chuyển những người còn lại sang vai trò khác."
                ),
            ),
        ]

    def __str__(self):
        return f"{self.get_role_display()}: {self.user}"


class TaskComment(models.Model):
    task = models.ForeignKey(
        Task,
        verbose_name="Công việc",
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người ghi",
        on_delete=models.PROTECT,
        related_name="+",
    )
    content = models.TextField("Nội dung ý kiến")
    created_at = models.DateTimeField("Ghi lúc", auto_now_add=True)

    class Meta:
        verbose_name = "Ý kiến"
        verbose_name_plural = "Ý kiến"
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["task", "created_at"], name="work_comment_task_created_idx"),
        ]

    def __str__(self):
        return self.content[:80]


class TaskAttachment(models.Model):
    task = models.ForeignKey(
        Task,
        verbose_name="Công việc",
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    kind = models.CharField("Loại file", max_length=20, choices=AttachmentKind.choices)
    # File bằng chứng luôn nằm trong một ý kiến: nộp kết quả = ghi ý kiến kèm file.
    comment = models.ForeignKey(
        TaskComment,
        verbose_name="Ý kiến chứa file",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attachments",
    )
    file = models.FileField(
        "File",
        upload_to=attachment_upload_to,
        max_length=255,
        validators=[validate_work_file],
    )
    original_name = models.CharField("Tên file gốc", max_length=255, blank=True)
    size = models.PositiveBigIntegerField("Dung lượng (byte)", default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Người tải lên",
        on_delete=models.PROTECT,
        related_name="+",
    )
    uploaded_at = models.DateTimeField("Tải lên lúc", auto_now_add=True)

    class Meta:
        verbose_name = "File đính kèm"
        verbose_name_plural = "File đính kèm"
        ordering = ["uploaded_at", "id"]
        indexes = [
            models.Index(fields=["task", "kind"], name="work_attachment_task_kind_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(kind=AttachmentKind.GIAO_VIEC, comment__isnull=True)
                    | Q(kind=AttachmentKind.BANG_CHUNG, comment__isnull=False)
                ),
                name="work_attachment_evidence_in_comment",
                violation_error_message=(
                    "File bằng chứng phải nằm trong một ý kiến, còn file giao việc thì không. "
                    "Hãy nộp kết quả bằng cách ghi ý kiến kèm file trên trang chi tiết công việc."
                ),
            ),
        ]

    def __str__(self):
        return self.original_name or Path(self.file.name).name

    def save(self, *args, **kwargs):
        # Ghi lại tên gốc và dung lượng TRƯỚC khi upload_to đổi tên file.
        if self.file and not self.file._committed:
            if not self.original_name:
                self.original_name = Path(self.file.name).name[:255]
            self.size = self.file.size
        super().save(*args, **kwargs)
