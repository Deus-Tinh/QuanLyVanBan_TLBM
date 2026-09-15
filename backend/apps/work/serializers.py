from django.contrib.auth import get_user_model
from django.db import transaction
from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers

from .models import (
    AttachmentKind,
    ParticipantRole,
    Task,
    TaskAttachment,
    TaskComment,
    TaskParticipant,
    TaskStatus,
    delete_stored_files_on_commit,
    validate_work_file,
)

User = get_user_model()

# Chức vụ tạm thời — auth.User chưa có chức vụ. Thay khi nhóm 7 có model CBNV.
POSITION_PLACEHOLDER = "Nhân viên"


def employee_full_name(user):
    """Tên hiển thị kiểu Việt Nam: Họ (last_name) + Tên (first_name); chưa khai báo thì dùng username."""
    full_name = f"{user.last_name} {user.first_name}".strip()
    return full_name or user.username


def work_file_field():
    return serializers.FileField(
        validators=[validate_work_file],
        error_messages={
            "invalid": "Dữ liệu gửi lên không phải file. Hãy chọn lại file từ máy.",
            "empty": "File đang trống (0 byte). Hãy kiểm tra lại file trên máy rồi chọn lại.",
            "no_name": "Không đọc được tên file. Hãy đổi tên file rồi chọn lại.",
            "max_length": "Tên file quá dài. Hãy đổi tên file ngắn hơn 100 ký tự rồi chọn lại.",
        },
    )


# ==========================================================================
# ===== KHU VỰC: Dùng chung — CBNV rút gọn, file đính kèm, API trang chủ =====
# ==========================================================================

class EmployeeBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    fullName = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()

    def get_fullName(self, user):
        return employee_full_name(user)

    def get_position(self, user):
        return POSITION_PLACEHOLDER


class AttachmentSerializer(serializers.ModelSerializer):
    fileName = serializers.CharField(source="original_name", read_only=True)
    uploadedBy = EmployeeBriefSerializer(source="uploaded_by", read_only=True)
    uploadedAt = serializers.DateTimeField(source="uploaded_at", read_only=True)
    downloadUrl = serializers.SerializerMethodField()
    canDelete = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = ["id", "kind", "fileName", "size", "uploadedBy", "uploadedAt", "downloadUrl", "canDelete"]

    def get_downloadUrl(self, obj):
        url = reverse("work:attachment-download", kwargs={"pk": obj.pk})
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_canDelete(self, obj):
        # Chỉ file bằng chứng mới có nút xóa riêng; file giao việc xóa trong màn hình sửa.
        task = self.context.get("task")
        request = self.context.get("request")
        if task is None or request is None or obj.kind != AttachmentKind.BANG_CHUNG:
            return False
        return task.can_delete_evidence(request.user, obj)


class LatestTaskSerializer(serializers.ModelSerializer):
    """API 5 công việc mới nhất cho trang chủ (nhóm 1)."""

    createdDate = serializers.DateField(source="created_date", read_only=True)
    dueDate = serializers.DateField(source="due_date", read_only=True)
    status = serializers.CharField(read_only=True)
    statusLabel = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ["id", "title", "createdDate", "dueDate", "status", "statusLabel"]

    def get_statusLabel(self, obj):
        return TaskStatus(obj.get_status()).label


# ==========================================================================
# ===== KHU VỰC: Danh sách, chi tiết, thêm / sửa công việc =====
# ==========================================================================

class TaskListSerializer(serializers.ModelSerializer):
    createdDate = serializers.DateField(source="created_date", read_only=True)
    dueDate = serializers.DateField(source="due_date", read_only=True)
    status = serializers.SerializerMethodField()
    statusLabel = serializers.SerializerMethodField()
    isPublic = serializers.BooleanField(source="is_public", read_only=True)
    creator = EmployeeBriefSerializer(source="created_by", read_only=True)
    host = serializers.SerializerMethodField()
    directors = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    myRoles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "requirement",
            "createdDate",
            "dueDate",
            "status",
            "statusLabel",
            "isPublic",
            "creator",
            "host",
            "directors",
            "participants",
            "myRoles",
            "permissions",
        ]

    def _current_user(self):
        request = self.context.get("request")
        return request.user if request else None

    def _people(self, obj, role):
        users = [p.user for p in obj.participants.all() if p.role == role]
        return EmployeeBriefSerializer(users, many=True).data

    def get_status(self, obj):
        return obj.get_status()

    def get_statusLabel(self, obj):
        return TaskStatus(obj.get_status()).label

    def get_host(self, obj):
        hosts = self._people(obj, ParticipantRole.CHU_TRI)
        return hosts[0] if hosts else None

    def get_directors(self, obj):
        return self._people(obj, ParticipantRole.CHI_DAO)

    def get_participants(self, obj):
        return self._people(obj, ParticipantRole.THAM_GIA)

    def get_myRoles(self, obj):
        return sorted(obj.roles_of(self._current_user()))

    def get_permissions(self, obj):
        user = self._current_user()
        return {
            "canEdit": obj.can_edit(user),
            "canDelete": obj.can_delete(user),
            "canApprove": obj.can_approve(user),
            "canUnapprove": obj.can_unapprove(user),
        }


class TaskDetailSerializer(TaskListSerializer):
    firstOpenedAt = serializers.DateTimeField(source="first_opened_at", read_only=True)
    firstOpenedBy = EmployeeBriefSerializer(source="first_opened_by", read_only=True)
    firstEvidenceAt = serializers.SerializerMethodField()
    approvedAt = serializers.DateTimeField(source="approved_at", read_only=True)
    approvedBy = EmployeeBriefSerializer(source="approved_by", read_only=True)
    attachments = serializers.SerializerMethodField()
    evidences = serializers.SerializerMethodField()
    commentCount = serializers.SerializerMethodField()

    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + [
            "firstOpenedAt",
            "firstOpenedBy",
            "firstEvidenceAt",
            "approvedAt",
            "approvedBy",
            "attachments",
            "evidences",
            "commentCount",
        ]

    def _files(self, obj, kind):
        files = [item for item in obj.attachments.all() if item.kind == kind]
        context = {**self.context, "task": obj}
        return AttachmentSerializer(files, many=True, context=context).data

    def get_attachments(self, obj):
        return self._files(obj, AttachmentKind.GIAO_VIEC)

    def get_evidences(self, obj):
        return self._files(obj, AttachmentKind.BANG_CHUNG)

    def get_firstEvidenceAt(self, obj):
        evidences = obj.evidence_files()
        if not evidences:
            return None
        first = min(evidences, key=lambda item: item.uploaded_at)
        return serializers.DateTimeField().to_representation(first.uploaded_at)

    def get_commentCount(self, obj):
        return obj.comments.count()

    def get_permissions(self, obj):
        user = self._current_user()
        return {
            **super().get_permissions(obj),
            "canSubmitEvidence": obj.can_submit_evidence(user),
            "canComment": obj.can_comment(user),
        }


class TaskWriteSerializer(serializers.Serializer):
    """Dùng chung cho Thêm (POST) và Sửa (PATCH). Dữ liệu gửi dạng multipart/form-data."""

    PEOPLE_FIELDS = ("host", "directors", "participants")

    title = serializers.CharField(
        error_messages={
            "required": "Hãy nhập nội dung công việc.",
            "blank": "Nội dung công việc đang trống. Hãy nhập nội dung công việc.",
        },
    )
    createdDate = serializers.DateField(
        source="created_date",
        required=False,
        error_messages={"invalid": "Ngày tạo không hợp lệ. Hãy chọn lại ngày tạo trên lịch."},
    )
    dueDate = serializers.DateField(
        source="due_date",
        error_messages={
            "required": "Hãy chọn ngày xử lý.",
            "null": "Hãy chọn ngày xử lý.",
            "invalid": "Ngày xử lý không hợp lệ. Hãy chọn lại ngày xử lý trên lịch.",
        },
    )
    requirement = serializers.CharField(
        error_messages={
            "required": "Hãy nhập yêu cầu xử lý.",
            "blank": "Yêu cầu xử lý đang trống. Hãy nhập yêu cầu xử lý.",
        },
    )
    hostId = serializers.PrimaryKeyRelatedField(
        source="host",
        queryset=User.objects.filter(is_active=True),
        error_messages={
            "required": "Hãy chọn người chủ trì giải quyết công việc.",
            "null": "Hãy chọn người chủ trì giải quyết công việc.",
            "does_not_exist": "Không tìm thấy cán bộ chủ trì đã chọn. Hãy tải lại danh sách cán bộ rồi chọn lại.",
            "incorrect_type": "Người chủ trì không hợp lệ. Hãy chọn lại người chủ trì trong danh sách.",
        },
    )
    directorIds = serializers.PrimaryKeyRelatedField(
        source="directors",
        many=True,
        allow_empty=False,
        queryset=User.objects.filter(is_active=True),
        error_messages={
            "required": "Hãy chọn ít nhất một người chỉ đạo - theo dõi tiến độ.",
            "empty": "Hãy chọn ít nhất một người chỉ đạo - theo dõi tiến độ.",
        },
    )
    participantIds = serializers.PrimaryKeyRelatedField(
        source="participants",
        many=True,
        allow_empty=False,
        queryset=User.objects.filter(is_active=True),
        error_messages={
            "required": "Hãy chọn ít nhất một cán bộ tham gia giải quyết công việc.",
            "empty": "Hãy chọn ít nhất một cán bộ tham gia giải quyết công việc.",
        },
    )
    isPublic = serializers.BooleanField(source="is_public", required=False, default=True)
    attachments = serializers.ListField(child=work_file_field(), required=False)
    removeAttachmentIds = serializers.ListField(
        source="remove_attachment_ids",
        child=serializers.IntegerField(),
        required=False,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Thông báo lỗi cho từng id sai trong danh sách nhiều người.
        for name, label in (("directorIds", "người chỉ đạo"), ("participantIds", "cán bộ tham gia")):
            self.fields[name].child_relation.error_messages.update({
                "does_not_exist": f"Không tìm thấy {label} đã chọn. Hãy tải lại danh sách cán bộ rồi chọn lại.",
                "incorrect_type": f"Danh sách {label} không hợp lệ. Hãy chọn lại {label} trong danh sách.",
            })

    def to_representation(self, instance):
        """Dữ liệu hiện tại theo đúng định dạng gửi lên — dùng để điền sẵn form PATCH của trang API trên trình duyệt."""
        people = list(instance.participants.all())
        return {
            "title": instance.title,
            "createdDate": instance.created_date.isoformat(),
            "dueDate": instance.due_date.isoformat(),
            "requirement": instance.requirement,
            "hostId": next((p.user_id for p in people if p.role == ParticipantRole.CHU_TRI), None),
            "directorIds": [p.user_id for p in people if p.role == ParticipantRole.CHI_DAO],
            "participantIds": [p.user_id for p in people if p.role == ParticipantRole.THAM_GIA],
            "isPublic": instance.is_public,
        }

    def validate(self, attrs):
        instance = self.instance
        today = timezone.localdate()
        errors = {}

        created_date = attrs.get("created_date", instance.created_date if instance else today)
        due_date = attrs.get("due_date", instance.due_date if instance else None)

        # Quy tắc "không chọn ngày quá khứ" chỉ áp dụng khi tạo mới.
        if instance is None and created_date < today:
            errors["createdDate"] = (
                "Ngày tạo không được ở trong quá khứ. Hãy chọn hôm nay hoặc một ngày sau hôm nay."
            )

        if due_date is not None and due_date < created_date:
            errors["dueDate"] = (
                "Ngày xử lý đang trước ngày tạo. Hãy chọn ngày xử lý bằng hoặc sau ngày tạo."
            )
        elif instance is not None and "due_date" in attrs and due_date < today:
            errors["dueDate"] = (
                "Hạn xử lý đã ở trong quá khứ nên công việc sẽ bị khóa ngay sau khi lưu. "
                "Hãy chọn hạn xử lý từ hôm nay trở đi."
            )

        people_sent = [name for name in self.PEOPLE_FIELDS if name in attrs]
        if instance is not None and 0 < len(people_sent) < len(self.PEOPLE_FIELDS):
            errors["non_field_errors"] = [
                "Khi thay đổi người liên quan, hãy gửi đủ cả người chủ trì, người chỉ đạo và cán bộ tham gia."
            ]
        elif people_sent:
            errors.update(self._validate_one_role_per_person(attrs))

        remove_ids = attrs.get("remove_attachment_ids") or []
        if remove_ids:
            if instance is None:
                errors["removeAttachmentIds"] = "Công việc mới chưa có file để xóa. Hãy bỏ trường này khi tạo mới."
            else:
                valid_ids = set(
                    instance.attachments.filter(kind=AttachmentKind.GIAO_VIEC).values_list("id", flat=True)
                )
                invalid_ids = [str(item) for item in remove_ids if item not in valid_ids]
                if invalid_ids:
                    errors["removeAttachmentIds"] = (
                        f"File đính kèm có id {', '.join(invalid_ids)} không thuộc công việc này. "
                        "Hãy tải lại trang rồi thử lại."
                    )

        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def _validate_one_role_per_person(self, attrs):
        # Bỏ id trùng trong cùng một danh sách (chọn 2 lần cùng một người).
        attrs["directors"] = list({user.pk: user for user in attrs["directors"]}.values())
        attrs["participants"] = list({user.pk: user for user in attrs["participants"]}.values())

        seen = {attrs["host"].pk: "chủ trì"}
        for field_name, users, label in (
            ("directorIds", attrs["directors"], "chỉ đạo - theo dõi tiến độ"),
            ("participantIds", attrs["participants"], "cán bộ tham gia"),
        ):
            for user in users:
                if user.pk in seen:
                    return {
                        field_name: (
                            f"Cán bộ {employee_full_name(user)} đang được chọn ở cả vai trò "
                            f"{seen[user.pk]} và {label}. Mỗi cán bộ chỉ giữ một vai trò trong công việc, "
                            "hãy bỏ cán bộ này khỏi một trong hai vai trò."
                        )
                    }
                seen[user.pk] = label
        return {}

    def _save_people(self, task, attrs):
        if not all(name in attrs for name in self.PEOPLE_FIELDS):
            return
        task.participants.all().delete()
        rows = [TaskParticipant(task=task, user=attrs["host"], role=ParticipantRole.CHU_TRI)]
        rows += [TaskParticipant(task=task, user=u, role=ParticipantRole.CHI_DAO) for u in attrs["directors"]]
        rows += [TaskParticipant(task=task, user=u, role=ParticipantRole.THAM_GIA) for u in attrs["participants"]]
        TaskParticipant.objects.bulk_create(rows)

    def _save_files(self, task, files, user):
        for uploaded in files:
            TaskAttachment.objects.create(
                task=task,
                kind=AttachmentKind.GIAO_VIEC,
                file=uploaded,
                uploaded_by=user,
            )

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        files = validated_data.pop("attachments", [])
        people = {name: validated_data.pop(name) for name in self.PEOPLE_FIELDS}
        validated_data.pop("remove_attachment_ids", None)

        task = Task.objects.create(created_by=user, **validated_data)
        self._save_people(task, people)
        self._save_files(task, files, user)
        return task

    @transaction.atomic
    def update(self, instance, validated_data):
        user = self.context["request"].user
        files = validated_data.pop("attachments", [])
        people = {name: validated_data.pop(name) for name in self.PEOPLE_FIELDS if name in validated_data}
        remove_ids = validated_data.pop("remove_attachment_ids", [])

        for field_name, value in validated_data.items():
            setattr(instance, field_name, value)
        instance.save()

        self._save_people(instance, people)

        if remove_ids:
            removed = instance.attachments.filter(kind=AttachmentKind.GIAO_VIEC, id__in=remove_ids)
            delete_stored_files_on_commit([item.file.name for item in removed])
            removed.delete()

        self._save_files(instance, files, user)
        return instance


# ==========================================================================
# ===== KHU VỰC: Bằng chứng hoàn thành, ý kiến =====
# ==========================================================================

class EvidenceUploadSerializer(serializers.Serializer):
    files = serializers.ListField(
        child=work_file_field(),
        allow_empty=False,
        error_messages={
            "required": "Chưa có file bằng chứng nào được chọn. Hãy chọn ít nhất một file rồi bấm nộp.",
            "empty": "Chưa có file bằng chứng nào được chọn. Hãy chọn ít nhất một file rồi bấm nộp.",
        },
    )


class CommentSerializer(serializers.ModelSerializer):
    content = serializers.CharField(
        max_length=5000,
        error_messages={
            "required": "Hãy nhập nội dung ý kiến trước khi gửi.",
            "blank": "Nội dung ý kiến đang trống. Hãy nhập nội dung trước khi gửi.",
            "max_length": "Ý kiến dài quá 5000 ký tự. Hãy rút gọn hoặc tách thành nhiều ý kiến.",
        },
    )
    author = EmployeeBriefSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = TaskComment
        fields = ["id", "content", "author", "createdAt"]


# ==========================================================================
# ===== KHU VỰC: Cán bộ nhân viên, người dùng hiện tại =====
# ==========================================================================

class EmployeeSerializer(EmployeeBriefSerializer):
    username = serializers.CharField(read_only=True)


class MeSerializer(EmployeeSerializer):
    isAdmin = serializers.BooleanField(source="is_superuser", read_only=True)
