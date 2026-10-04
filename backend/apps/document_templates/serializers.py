from rest_framework import serializers
from .models import DanhMucTaiLieu, LoaiTaiLieu, TaiLieuChiTiet


class DanhMucTaiLieuSerializer(serializers.ModelSerializer):
    """Serializer cho Danh mục Tài liệu (Cấp 1)"""
    nguoi_lap_name = serializers.SerializerMethodField()

    class Meta:
        model = DanhMucTaiLieu
        fields = [
            'id',
            'stt_uu_tien',
            'ky_hieu',
            'ten_tai_lieu',
            'nguoi_lap',
            'nguoi_lap_name',
            'ngay_lap',
            'ghi_chu',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'nguoi_lap', 'created_at', 'updated_at']

    def get_nguoi_lap_name(self, obj):
        if not obj.nguoi_lap:
            return None
        return obj.nguoi_lap.get_full_name() or obj.nguoi_lap.username


class LoaiTaiLieuSerializer(serializers.ModelSerializer):
    """Serializer cho Loại tài liệu (Cấp 2)"""
    dm_tai_lieu_name = serializers.CharField(source='dm_tai_lieu.ten_tai_lieu', read_only=True)

    class Meta:
        model = LoaiTaiLieu
        fields = [
            'id',
            'dm_tai_lieu',
            'dm_tai_lieu_name',
            'ten_loai',
            'is_public',
            'ngay_lap',
            'ghi_chu',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaiLieuChiTietSerializer(serializers.ModelSerializer):
    """
    Serializer cho Chi tiết tài liệu chung (khớp interface ResourceItem của frontend)
    """
    dm_tai_lieu_name = serializers.CharField(source='dm_tai_lieu.ten_tai_lieu', read_only=True)
    loai_tai_lieu = serializers.PrimaryKeyRelatedField(
        queryset=LoaiTaiLieu.objects.all(),
        many=True,
        required=False
    )
    loai_tai_lieu_names = serializers.SerializerMethodField()
    nguoi_tao_name = serializers.SerializerMethodField()

    class Meta:
        model = TaiLieuChiTiet
        fields = [
            'id',
            'dm_tai_lieu',
            'dm_tai_lieu_name',
            'loai_tai_lieu',
            'loai_tai_lieu_names',
            'ky_hieu',
            'tieu_de',
            'ngay_dang',
            'noi_ban_hanh',
            'hieu_luc',
            'ngay_het_hieu_luc',
            'link_thay_the',
            'ghi_chu',
            'file_dinh_kem',
            'hien_thi',
            'nguoi_tao',
            'nguoi_tao_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'nguoi_tao', 'created_at', 'updated_at']

    def get_loai_tai_lieu_names(self, obj):
        return [loai.ten_loai for loai in obj.loai_tai_lieu.all()]

    def get_nguoi_tao_name(self, obj):
        if not obj.nguoi_tao:
            return None
        return obj.nguoi_tao.get_full_name() or obj.nguoi_tao.username

    def validate(self, attrs):
        hieu_luc = attrs.get('hieu_luc') or (self.instance.hieu_luc if self.instance else 'CON_HIEU_LUC')
        link_thay_the = attrs.get('link_thay_the') or (self.instance.link_thay_the if self.instance else '')
        if hieu_luc == 'HET_VA_THAY_THE' and not (link_thay_the and link_thay_the.strip()):
            raise serializers.ValidationError({
                'link_thay_the': 'Vui lòng cung cấp link văn bản thay thế khi chọn trạng thái Hết hiệu lực và thay thế.'
            })
        return attrs
