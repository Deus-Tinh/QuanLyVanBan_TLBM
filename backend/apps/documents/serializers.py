"""
Serializers cho Module Văn Bản (Đến / Đi / Mật) — Kiến trúc 3 Model.

Hỗ trợ:
- Serializer riêng biệt cho từng phân hệ: VanBanDen, VanBanDi, VanBanMat
- Serializer hợp nhất cho API facade (DocumentListSerializer, DocumentDetailSerializer, DocumentCreateUpdateSerializer)
- Serializer tệp đính kèm và lịch sử người xem
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    HieuLuc,
    LoaiVanBan,
    VanBanDen,
    VanBanDenAttachment,
    VanBanDi,
    VanBanDiAttachment,
    VanBanMat,
    VanBanMatAttachment,
    DocumentViewLog,
    get_document_model,
)

User = get_user_model()


class TolerantPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    Bỏ qua an toàn các ID người dùng không tồn tại trong DB,
    tránh làm đứt gãy luồng thêm văn bản khi các nhóm khác chưa hoàn thiện dữ liệu CBNV.
    """

    def to_internal_value(self, data):
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError:
            return None


# ═══════════════════════════════════════════════════════════════════
# Attachment Serializers
# ═══════════════════════════════════════════════════════════════════

class DocumentAttachmentSerializer(serializers.ModelSerializer):
    """Serializer dùng chung cho file đính kèm của cả 3 loại văn bản."""

    file_name = serializers.CharField(source="name", read_only=True)
    uploaded_at = serializers.DateTimeField(source="created_time", read_only=True)

    class Meta:
        model = VanBanDenAttachment
        fields = ["id", "file", "name", "file_name", "path", "file_size", "is_deleted", "uploaded_at", "created_time"]
        read_only_fields = ["id", "name", "file_name", "path", "file_size", "uploaded_at", "created_time"]


class VanBanDenAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VanBanDenAttachment
        fields = ["id", "file", "name", "path", "file_size", "is_deleted", "created_time"]
        read_only_fields = ["id", "name", "path", "file_size", "created_time"]


class VanBanDiAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VanBanDiAttachment
        fields = ["id", "file", "name", "path", "file_size", "is_deleted", "created_time"]
        read_only_fields = ["id", "name", "path", "file_size", "created_time"]


class VanBanMatAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VanBanMatAttachment
        fields = ["id", "file", "name", "path", "file_size", "is_deleted", "created_time"]
        read_only_fields = ["id", "name", "path", "file_size", "created_time"]


# ═══════════════════════════════════════════════════════════════════
# Unified Document Serializers (GET list, GET detail, POST/PUT)
# ═══════════════════════════════════════════════════════════════════

class DocumentListSerializer(serializers.Serializer):
    """
    Serializer cho danh sách văn bản (GET list).
    Trả về định dạng chuẩn cho bảng hiển thị trên frontend.
    Hỗ trợ đồng nhất dữ liệu từ VanBanDen, VanBanDi, VanBanMat.
    """

    id = serializers.IntegerField(read_only=True)
    loai = serializers.CharField(read_only=True)
    loai_display = serializers.SerializerMethodField()
    nam = serializers.IntegerField(read_only=True)
    so_hieu = serializers.CharField(read_only=True)
    so_thu_tu = serializers.IntegerField(read_only=True, default=None)
    ngay_den = serializers.DateTimeField(read_only=True, default=None)
    ngay_ban_hanh = serializers.DateTimeField(read_only=True, default=None)
    ngay_van_ban = serializers.DateTimeField(read_only=True, default=None)
    trich_yeu = serializers.CharField(read_only=True)
    noi_ban_hanh = serializers.CharField(read_only=True, default="")
    nguoi_ky = serializers.CharField(read_only=True, default="")
    hieu_luc = serializers.CharField(read_only=True)
    hieu_luc_display = serializers.CharField(source="get_hieu_luc_display", read_only=True)
    link_thay_the = serializers.CharField(read_only=True, default="")
    hien_thi = serializers.BooleanField(read_only=True)
    nguoi_tao_name = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    def get_loai_display(self, obj):
        if hasattr(obj, "get_loai_display"):
            return obj.get_loai_display()
        loai = getattr(obj, "loai", "DEN")
        return dict(LoaiVanBan.choices).get(loai, loai)

    def get_nguoi_tao_name(self, obj):
        if hasattr(obj, "nguoi_tao") and obj.nguoi_tao:
            full_name = obj.nguoi_tao.get_full_name()
            return full_name if full_name else obj.nguoi_tao.username
        return None

    def get_attachment_count(self, obj):
        if hasattr(obj, "attachments"):
            return obj.attachments.count()
        return 0


class DocumentDetailSerializer(serializers.Serializer):
    """
    Serializer cho chi tiết văn bản (GET detail).
    Đầy đủ mọi trường + danh sách file đính kèm.
    """

    id = serializers.IntegerField(read_only=True)
    loai = serializers.CharField(read_only=True)
    loai_display = serializers.SerializerMethodField()
    nam = serializers.IntegerField(read_only=True)
    so_hieu = serializers.CharField(read_only=True)
    so_thu_tu = serializers.IntegerField(read_only=True, default=None)
    ngay_den = serializers.DateTimeField(read_only=True, default=None)
    ngay_ban_hanh = serializers.DateTimeField(read_only=True, default=None)
    ngay_van_ban = serializers.DateTimeField(read_only=True, default=None)
    trich_yeu = serializers.CharField(read_only=True)
    noi_ban_hanh = serializers.CharField(read_only=True, default="")
    nguoi_ky = serializers.CharField(read_only=True, default="")
    chuc_vu = serializers.CharField(read_only=True, default="")
    hieu_luc = serializers.CharField(read_only=True)
    hieu_luc_display = serializers.CharField(source="get_hieu_luc_display", read_only=True)
    ngay_het_hieu_luc = serializers.DateTimeField(read_only=True, default=None)
    link_thay_the = serializers.CharField(read_only=True, default="")
    ghi_chu = serializers.CharField(read_only=True, default="")
    hien_thi = serializers.BooleanField(read_only=True)
    gui_mail_toan_he_thong = serializers.BooleanField(read_only=True)
    attachments = serializers.SerializerMethodField()
    nguoi_tao_name = serializers.SerializerMethodField()
    nguoi_tao_username = serializers.CharField(source="nguoi_tao.username", read_only=True, default=None)
    nguoi_nhan_list = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_loai_display(self, obj):
        if hasattr(obj, "get_loai_display"):
            return obj.get_loai_display()
        loai = getattr(obj, "loai", "DEN")
        return dict(LoaiVanBan.choices).get(loai, loai)

    def get_attachments(self, obj):
        if hasattr(obj, "attachments"):
            return DocumentAttachmentSerializer(obj.attachments.filter(is_deleted=False), many=True).data
        return []

    def get_nguoi_tao_name(self, obj):
        if hasattr(obj, "nguoi_tao") and obj.nguoi_tao:
            full_name = obj.nguoi_tao.get_full_name()
            return full_name if full_name else obj.nguoi_tao.username
        return None

    def get_nguoi_nhan_list(self, obj):
        if hasattr(obj, "nguoi_nhan"):
            return [
                {
                    "id": u.pk,
                    "username": u.username,
                    "full_name": u.get_full_name() or u.username,
                }
                for u in obj.nguoi_nhan.all()
            ]
        return []


class DocumentCreateUpdateSerializer(serializers.Serializer):
    """
    Serializer cho tạo mới / cập nhật văn bản (POST, PUT, PATCH).
    Nhận dữ liệu từ request, validate nghiệp vụ, và lưu vào đúng model tương ứng
    (VanBanDen, VanBanDi, hoặc VanBanMat).
    """

    id = serializers.IntegerField(read_only=True)
    loai = serializers.ChoiceField(choices=LoaiVanBan.choices, default=LoaiVanBan.DEN)
    nam = serializers.IntegerField(required=False)
    so_hieu = serializers.CharField(max_length=255)
    so_thu_tu = serializers.IntegerField(read_only=True)
    ngay_den = serializers.DateTimeField(required=False, allow_null=True)
    ngay_ban_hanh = serializers.DateTimeField(required=False, allow_null=True)
    ngay_van_ban = serializers.DateTimeField(required=False, allow_null=True)
    trich_yeu = serializers.CharField()
    noi_ban_hanh = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    nguoi_ky = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    chuc_vu = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    hieu_luc = serializers.ChoiceField(choices=HieuLuc.choices, default=HieuLuc.CON_HIEU_LUC)
    ngay_het_hieu_luc = serializers.DateTimeField(required=False, allow_null=True)
    link_thay_the = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    ghi_chu = serializers.CharField(required=False, allow_blank=True, default="")
    hien_thi = serializers.BooleanField(default=True)
    gui_mail_toan_he_thong = serializers.BooleanField(default=False)
    nguoi_nhan = TolerantPrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False,
    )

    def validate_nguoi_nhan(self, value):
        return [u for u in value if u is not None]

    def validate(self, attrs):
        loai = attrs.get("loai") or (getattr(self.instance, "loai", None) if self.instance else LoaiVanBan.DEN)

        if loai == LoaiVanBan.DI:
            if not attrs.get("ngay_ban_hanh") and not (
                self.instance and getattr(self.instance, "ngay_ban_hanh", None)
            ):
                raise serializers.ValidationError(
                    {"ngay_ban_hanh": "Ngày ban hành là bắt buộc với Văn bản Đi."}
                )

        return attrs

    def create(self, validated_data):
        nguoi_nhan = validated_data.pop("nguoi_nhan", [])
        loai = validated_data.pop("loai", LoaiVanBan.DEN)
        model = get_document_model(loai)

        # VB Mật không có so_thu_tu
        if str(loai).upper() in ("MAT", "VANBANMAT"):
            validated_data.pop("so_thu_tu", None)

        instance = model.objects.create(**validated_data)
        if nguoi_nhan:
            instance.nguoi_nhan.set(nguoi_nhan)
        return instance

    def update(self, instance, validated_data):
        nguoi_nhan = validated_data.pop("nguoi_nhan", None)
        validated_data.pop("loai", None)
        validated_data.pop("so_thu_tu", None)  # Read-only!

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if nguoi_nhan is not None:
            instance.nguoi_nhan.set(nguoi_nhan)
        return instance


# ═══════════════════════════════════════════════════════════════════
# Dedicated Model Serializers
# ═══════════════════════════════════════════════════════════════════

class VanBanDenSerializer(serializers.ModelSerializer):
    loai_display = serializers.CharField(source="get_loai_display", read_only=True)
    hieu_luc_display = serializers.CharField(source="get_hieu_luc_display", read_only=True)
    attachments = VanBanDenAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = VanBanDen
        fields = "__all__"
        read_only_fields = ["id", "so_thu_tu", "created_at", "updated_at"]


class VanBanDiSerializer(serializers.ModelSerializer):
    loai_display = serializers.CharField(source="get_loai_display", read_only=True)
    hieu_luc_display = serializers.CharField(source="get_hieu_luc_display", read_only=True)
    attachments = VanBanDiAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = VanBanDi
        fields = "__all__"
        read_only_fields = ["id", "so_thu_tu", "created_at", "updated_at"]


class VanBanMatSerializer(serializers.ModelSerializer):
    loai_display = serializers.CharField(source="get_loai_display", read_only=True)
    hieu_luc_display = serializers.CharField(source="get_hieu_luc_display", read_only=True)
    attachments = VanBanMatAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = VanBanMat
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


# ═══════════════════════════════════════════════════════════════════
# DocumentViewLog Serializer
# ═══════════════════════════════════════════════════════════════════

class DocumentViewLogSerializer(serializers.ModelSerializer):
    """Serializer cho lịch sử xem văn bản (API viewers)."""

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()
    chuc_danh = serializers.SerializerMethodField()
    don_vi = serializers.SerializerMethodField()

    class Meta:
        model = DocumentViewLog
        fields = [
            "id",
            "user_id",
            "username",
            "full_name",
            "chuc_danh",
            "don_vi",
            "viewed_at",
        ]

    def get_full_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name else obj.user.username

    def get_chuc_danh(self, obj):
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "position", "") if profile else ""

    def get_don_vi(self, obj):
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "department", "") if profile else ""
