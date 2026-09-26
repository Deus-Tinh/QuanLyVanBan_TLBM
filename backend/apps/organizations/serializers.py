import re
from django.db import IntegrityError, OperationalError, transaction
from django.db.models import Max
from rest_framework import serializers

from .models import KhoiKhuVuc, DonVi


class KhoiKhuVucSerializer(serializers.ModelSerializer):
    """
    Serializer handling Tier-1 Region/Block data using pure translation keys.
    """
    don_vi_count = serializers.IntegerField(
        source="don_vi_list.count",
        read_only=True,
    )
    ten = serializers.CharField(
        error_messages={
            "blank": "organizations.messages.nameRequired",
            "required": "organizations.messages.nameRequired",
        }
    )

    class Meta:
        model = KhoiKhuVuc
        fields = ["id", "ten", "don_vi_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_ten(self, value):
        ten_stripped = value.strip()
        if not ten_stripped:
            raise serializers.ValidationError("organizations.messages.nameRequired")
        instance = self.instance
        qs = KhoiKhuVuc.objects.filter(ten__iexact=ten_stripped)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("organizations.messages.nameExists")
        return ten_stripped


class DonViSerializer(serializers.ModelSerializer):
    """
    Serializer handling Tier-2 Unit/Department data using pure translation keys.
    """
    khoi_ten = serializers.CharField(
        source="khoi.ten",
        read_only=True,
    )
    khoi = serializers.PrimaryKeyRelatedField(
        queryset=KhoiKhuVuc.objects.all(),
        error_messages={
            "required": "organizations.messages.regionRequired",
            "null": "organizations.messages.regionRequired",
            "does_not_exist": "organizations.messages.regionNotFound",
            "incorrect_type": "organizations.messages.regionNotFound",
        },
    )
    stt_uu_tien = serializers.IntegerField(
        required=False,
        allow_null=True,
        error_messages={
            "invalid": "organizations.messages.priorityPositive",
        },
    )
    ten = serializers.CharField(
        error_messages={
            "blank": "organizations.messages.nameRequired",
            "required": "organizations.messages.nameRequired",
        },
    )
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        error_messages={
            "invalid": "organizations.messages.emailInvalid",
        },
    )

    class Meta:
        model = DonVi
        fields = [
            "id",
            "khoi",
            "khoi_ten",
            "stt_uu_tien",
            "ten",
            "dia_chi",
            "dien_thoai",
            "email",
            "is_public",
            "ghi_chu",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_ten(self, value):
        ten_stripped = value.strip()
        if not ten_stripped:
            raise serializers.ValidationError("organizations.messages.nameRequired")
        return ten_stripped

    def validate_dien_thoai(self, value):
        if not value:
            return ""
        dien_thoai_cleaned = re.sub(r"[\s.-]", "", value)
        phone_pattern = r"^0[235789]\d{8,9}$"
        if not re.match(phone_pattern, dien_thoai_cleaned):
            raise serializers.ValidationError("organizations.messages.phoneInvalid")
        return value.strip()

    def to_internal_value(self, data):
        # Chuyển đổi chuỗi rỗng từ form frontend thành None để kích hoạt tự động sinh STT
        if isinstance(data, dict) and data.get("stt_uu_tien") == "":
            data = data.copy()
            data["stt_uu_tien"] = None
        return super().to_internal_value(data)

    def validate_stt_uu_tien(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("organizations.messages.priorityPositive")
        return value

    def validate(self, attrs):
        stt = attrs.get("stt_uu_tien")
        instance = self.instance

        if stt is not None:
            qs = DonVi.objects.filter(stt_uu_tien=stt)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"stt_uu_tien": "organizations.messages.priorityExists"}
                )

        return attrs

    def create(self, validated_data):
        if validated_data.get("stt_uu_tien") is not None:
            try:
                with transaction.atomic():
                    return super().create(validated_data)
            except IntegrityError as exc:
                raise serializers.ValidationError(
                    {"stt_uu_tien": "organizations.messages.priorityExists"}
                ) from exc

        for attempt in range(3):
            try:
                with transaction.atomic():
                    # Lock the current highest row before reading MAX on databases
                    # that support row-level locking. The retry also handles an
                    # empty table and backends where select_for_update is a no-op.
                    DonVi.objects.select_for_update().order_by(
                        "-stt_uu_tien"
                    ).first()
                    max_stt = DonVi.objects.aggregate(max_val=Max("stt_uu_tien"))["max_val"]
                    validated_data["stt_uu_tien"] = (max_stt or 0) + 1
                    return super().create(validated_data)
            except (IntegrityError, OperationalError) as exc:
                if isinstance(exc, OperationalError) and "locked" not in str(exc).lower():
                    raise
                if attempt == 2:
                    raise serializers.ValidationError(
                        {"stt_uu_tien": "organizations.messages.priorityConflict"}
                    ) from exc

        raise serializers.ValidationError(
            {"stt_uu_tien": "organizations.messages.priorityConflict"}
        )
