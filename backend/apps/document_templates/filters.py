import django_filters
from django.db.models import Q
from .models import TaiLieuChiTiet


class TaiLieuChiTietFilter(django_filters.FilterSet):
    """
    Bộ lọc đa tiêu chí cho Danh sách tài liệu chung:
    - dm_tai_lieu: Lọc theo Danh mục Cấp 1
    - loai_tai_lieu: Lọc theo Loại tài liệu Cấp 2 (M2M)
    - nam: Lọc theo năm của ngày đăng (ngay_dang__year)
    - hieu_luc: Lọc theo trạng thái hiệu lực
    - hien_thi: Lọc theo phạm vi hiển thị
    - don_vi_id: Lọc theo đơn vị phòng ban sở hữu
    - search: Tìm kiếm theo tiêu đề, ký hiệu, nơi ban hành
    """
    dm_tai_lieu = django_filters.NumberFilter(field_name='dm_tai_lieu_id')
    loai_tai_lieu = django_filters.NumberFilter(field_name='loai_tai_lieu__id')
    nam = django_filters.NumberFilter(field_name='ngay_dang', lookup_expr='year')
    hieu_luc = django_filters.CharFilter(method='filter_hieu_luc')
    hien_thi = django_filters.CharFilter(field_name='hien_thi')
    don_vi_id = django_filters.NumberFilter(field_name='don_vi_id')
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = TaiLieuChiTiet
        fields = ['dm_tai_lieu', 'loai_tai_lieu', 'nam', 'hieu_luc', 'hien_thi', 'don_vi_id', 'search']

    def filter_hieu_luc(self, queryset, name, value):
        if not value:
            return queryset
        val = value.strip()
        from django.utils import timezone
        today = timezone.localdate()

        if val == 'CON_HIEU_LUC':
            return queryset.filter(
                Q(hieu_luc='CON_HIEU_LUC', ngay_het_hieu_luc__isnull=True) |
                Q(ngay_het_hieu_luc__gt=today, hieu_luc__in=['CON_HIEU_LUC', 'HET_HIEU_LUC', 'HET_VA_THAY_THE'])
            ).distinct()
        elif val == 'CON_HIEU_LUC_1_PHAN':
            return queryset.filter(
                Q(hieu_luc='CON_HIEU_LUC_1_PHAN') &
                (Q(ngay_het_hieu_luc__isnull=True) | Q(ngay_het_hieu_luc__gt=today))
            ).distinct()
        elif val == 'HET_HIEU_LUC':
            return queryset.filter(
                Q(ngay_het_hieu_luc__lte=today, hieu_luc__in=['CON_HIEU_LUC', 'HET_HIEU_LUC']) |
                Q(hieu_luc='HET_HIEU_LUC', ngay_het_hieu_luc__isnull=True)
            ).distinct()
        elif val == 'HET_VA_THAY_THE':
            return queryset.filter(
                Q(hieu_luc='HET_VA_THAY_THE') &
                (Q(ngay_het_hieu_luc__isnull=True) | Q(ngay_het_hieu_luc__lte=today))
            ).distinct()
        return queryset.filter(hieu_luc=val)

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        val = value.strip()
        return queryset.filter(
            Q(tieu_de__icontains=val) |
            Q(ky_hieu__icontains=val) |
            Q(noi_ban_hanh__icontains=val) |
            Q(ghi_chu__icontains=val)
        ).distinct()
