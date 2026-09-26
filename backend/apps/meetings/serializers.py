"""
Serializers cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
"""

from rest_framework import serializers
from meetings.models import PhongHop


class PhongHopSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD cho Danh mục phòng họp (PhongHop).
    """

    class Meta:
        model = PhongHop
        fields = [
            "id",
            "ten_phong",
            "vi_tri",
            "suc_chua",
            "thiet_bi",
            "is_public",
            "ghi_chu",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_ten_phong(self, value):
        cleaned_name = value.strip()
        if not cleaned_name:
            raise serializers.ValidationError("Tên phòng họp không được để trống hoặc chỉ chứa khoảng trắng.")

        # Kiểm tra trùng tên phòng họp (không phân biệt chữ hoa/thường)
        qs = PhongHop.objects.filter(ten_phong__iexact=cleaned_name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f"Phòng họp với tên '{cleaned_name}' đã tồn tại trong hệ thống.")

        return cleaned_name

    def validate_suc_chua(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError("Sức chứa phòng họp phải là số nguyên dương lớn hơn hoặc bằng 1.")
        return value
