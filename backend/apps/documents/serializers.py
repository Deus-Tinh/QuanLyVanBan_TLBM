"""
Serializers cho Module Văn Bản.

Lưu ý quan trọng:
- so_thu_tu là read_only → Frontend không gửi lên, backend tự sinh.
- Khi loai='MAT': so_thu_tu = None (VB Mật không có số thứ tự).
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Document, DocumentAttachment, DocumentViewLog

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


class DocumentAttachmentSerializer(serializers.ModelSerializer):
    """Serializer cho file đính kèm."""

    class Meta:
        model = DocumentAttachment
        fields = ["id", "file", "file_name", "file_size", "uploaded_at"]
        read_only_fields = ["id", "file_name", "file_size", "uploaded_at"]


class DocumentListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách văn bản (GET list).
    Nhẹ hơn — chỉ trả các trường hiển thị trên bảng.
    """

    loai_display = serializers.CharField(source="get_loai_display", read_only=True)
    hieu_luc_display = serializers.CharField(source="get_hieu_luc_display", read_only=True)
    nguoi_tao_name = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "loai",
            "loai_display",
            "nam",
            "so_hieu",
            "so_thu_tu",
            "ngay_den",
            "ngay_ban_hanh",
            "ngay_van_ban",
            "trich_yeu",
            "noi_ban_hanh",
            "nguoi_ky",
            "hieu_luc",
            "hieu_luc_display",
            "link_thay_the",
            "hien_thi",
            "nguoi_tao_name",
            "attachment_count",
            "created_at",
        ]

    def get_nguoi_tao_name(self, obj):
        if obj.nguoi_tao:
            full_name = obj.nguoi_tao.get_full_name()
            return full_name if full_name else obj.nguoi_tao.username
        return None

    def get_attachment_count(self, obj):
        return obj.attachments.count()


class DocumentDetailSerializer(serializers.ModelSerializer):
    """
    Serializer cho chi tiết văn bản (GET detail).
    Đầy đủ mọi trường + danh sách file đính kèm.
    """

    loai_display = serializers.CharField(source="get_loai_display", read_only=True)
    hieu_luc_display = serializers.CharField(source="get_hieu_luc_display", read_only=True)
    attachments = DocumentAttachmentSerializer(many=True, read_only=True)
    nguoi_tao_name = serializers.SerializerMethodField()
    nguoi_tao_username = serializers.CharField(source="nguoi_tao.username", read_only=True, default=None)
    nguoi_nhan_list = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "loai",
            "loai_display",
            "nam",
            "so_hieu",
            "so_thu_tu",
            "ngay_den",
            "ngay_ban_hanh",
            "ngay_van_ban",
            "trich_yeu",
            "noi_ban_hanh",
            "nguoi_ky",
            "chuc_vu",
            "hieu_luc",
            "hieu_luc_display",
            "ngay_het_hieu_luc",
            "link_thay_the",
            "ghi_chu",
            "hien_thi",
            "gui_mail_toan_he_thong",
            "attachments",
            "nguoi_tao_name",
            "nguoi_tao_username",
            "nguoi_nhan_list",
            "created_at",
            "updated_at",
        ]

    def get_nguoi_tao_name(self, obj):
        if obj.nguoi_tao:
            full_name = obj.nguoi_tao.get_full_name()
            return full_name if full_name else obj.nguoi_tao.username
        return None

    def get_nguoi_nhan_list(self, obj):
        return [
            {
                "id": u.pk,
                "username": u.username,
                "full_name": u.get_full_name() or u.username,
            }
            for u in obj.nguoi_nhan.all()
        ]


class DocumentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer cho tạo mới / cập nhật văn bản (POST, PUT, PATCH).

    Lưu ý:
    - so_thu_tu là read_only → backend tự sinh trong view/service.
    - nguoi_tao tự lấy từ request.user.
    """

    nguoi_nhan = TolerantPrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False,
    )

    class Meta:
        model = Document
        fields = [
            "loai",
            "nam",
            "so_hieu",
            "so_thu_tu",
            "ngay_den",
            "ngay_ban_hanh",
            "ngay_van_ban",
            "trich_yeu",
            "noi_ban_hanh",
            "nguoi_ky",
            "chuc_vu",
            "hieu_luc",
            "ngay_het_hieu_luc",
            "link_thay_the",
            "ghi_chu",
            "hien_thi",
            "gui_mail_toan_he_thong",
            "nguoi_nhan",
        ]
        read_only_fields = ["so_thu_tu"]

    def validate_nguoi_nhan(self, value):
        return [u for u in value if u is not None]

    def validate(self, attrs):
        """Validate logic nghiệp vụ theo loại văn bản."""
        loai = attrs.get("loai") or (self.instance.loai if self.instance else None)

        # VB Đến bắt buộc có ngay_den
        if loai == Document.LoaiVanBan.DEN:
            # Khi tạo mới, ngay_den sẽ được tự set nếu không truyền
            pass

        # VB Đi bắt buộc có ngay_ban_hanh
        if loai == Document.LoaiVanBan.DI:
            if not attrs.get("ngay_ban_hanh") and not (
                self.instance and self.instance.ngay_ban_hanh
            ):
                raise serializers.ValidationError(
                    {"ngay_ban_hanh": "Ngày ban hành là bắt buộc với Văn bản Đi."}
                )

        return attrs


class DocumentViewLogSerializer(serializers.ModelSerializer):
    """Serializer cho lịch sử xem văn bản — Đô (API viewers)."""

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()
    # TODO: Thêm chuc_danh và don_vi khi Nhóm 7 có model tương ứng
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
        """
        Chức danh người xem.
        TODO: Khi Nhóm 7 có model CBNV với trường chuc_danh,
        thay bằng: return obj.user.profile.chuc_danh
        """
        return ""

    def get_don_vi(self, obj):
        """
        Đơn vị / phòng ban người xem.
        TODO: Khi Nhóm 7 có model Organization liên kết User,
        thay bằng: return obj.user.organization.name
        """
        return ""
