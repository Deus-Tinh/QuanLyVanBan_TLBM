from django.contrib.auth.models import Group, Permission
from rest_framework import serializers

from .models import GroupInfo, PermissionInfo


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionInfo
        fields = ["id", "name", "codename", "module_ten"]
        read_only_fields = fields


class GroupSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=150,
        error_messages={
            "blank": "roles.messages.nameRequired",
            "required": "roles.messages.nameRequired",
        },
    )
    user_count = serializers.IntegerField(source="user_set.count", read_only=True)
    permission_count = serializers.IntegerField(source="permissions.count", read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        source="permissions",
        queryset=Permission.objects.all(),
        many=True,
        required=False,
        error_messages={
            "does_not_exist": "roles.messages.permissionInvalid",
            "incorrect_type": "roles.messages.permissionInvalid",
        },
    )

    ma_nhom_quyen = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "ma_nhom_quyen", "user_count", "permission_count", "permission_ids"]
        read_only_fields = ["id"]

    def get_ma_nhom_quyen(self, obj):
        return GroupInfo.objects.filter(pk=obj.pk).values_list("ma_nhom_quyen", flat=True).first()

    def validate_name(self, value):
        name_stripped = value.strip()
        if not name_stripped:
            raise serializers.ValidationError("roles.messages.nameRequired")
        qs = Group.objects.filter(name__iexact=name_stripped)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("roles.messages.nameExists")
        return name_stripped
