import uuid
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
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
    """Lưu file bằng tên ngẫu nhiên để tránh trùng tên và lỗi ký tự tiếng Việt."""
    extension = Path(filename).suffix.lower()
    return f"work/tasks/{instance.task_id}/{instance.kind.lower()}/{uuid.uuid4().hex}{extension}"


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


class ParticipantRole(models.TextChoices):
    CHU_TRI = "CHU_TRI", "Chủ trì giải quyết công việc"
    CHI_DAO = "CHI_DAO", "Chỉ đạo - Theo dõi tiến độ xử lý công việc"
    THAM_GIA = "THAM_GIA", "Cán bộ tham gia giải quyết công việc"


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

    def __str__(self):
        return self.original_name or Path(self.file.name).name

    def save(self, *args, **kwargs):
        # Ghi lại tên gốc và dung lượng TRƯỚC khi upload_to đổi tên file.
        if self.file and not self.file._committed:
            if not self.original_name:
                self.original_name = Path(self.file.name).name[:255]
            self.size = self.file.size
        super().save(*args, **kwargs)
