"""
Bộ lọc nâng cao cho API Văn bản — Nguyễn Anh Đô (Backend Service).

Hỗ trợ:
- Tìm kiếm từ khóa (q / keyword): theo số hiệu, trích yếu, nơi ban hành
- Lọc theo loại văn bản (loai / type): hỗ trợ hoa/thường (DEN, den, DI, di, MAT, mat)
- Lọc theo năm (nam / year)
- Lọc theo khoảng ngày (tu_ngay / from_date, den_ngay / to_date) — theo ngay_den cho VB Đến
- Lọc theo hiệu lực (hieu_luc / status): hỗ trợ hoa/thường
- Lọc theo trạng thái hiển thị (hien_thi / is_public)
- Phân trang chuẩn: 10, 20, 50 bản ghi/trang
"""

import django_filters
from django.db.models import Q

from .models import Document


class DocumentFilter(django_filters.FilterSet):
    """
    Bộ lọc đa tiêu chí cho danh sách văn bản.
    Hỗ trợ cả tên tham số Tiếng Việt và Tiếng Anh (alias),
    và không phân biệt chữ hoa/thường cho các tham số enum.

    Query params:
        ?loai=DEN hoặc ?type=den
        ?q=thông báo hoặc ?keyword=thông báo
        ?nam=2026 hoặc ?year=2026
        ?tu_ngay=2026-09-01 hoặc ?from_date=2026-09-01
        ?den_ngay=2026-09-30 hoặc ?to_date=2026-09-30
        ?hieu_luc=CON_HIEU_LUC hoặc ?status=con_hieu_luc
        ?hien_thi=true hoặc ?is_public=true
    """

    # ── Từ khóa tìm kiếm ──────────────────────────────────────────
    q = django_filters.CharFilter(
        method="filter_search",
        label="Tìm kiếm",
        help_text="Tìm theo số hiệu, trích yếu, nơi ban hành",
    )
    keyword = django_filters.CharFilter(
        method="filter_search",
        label="Keyword (English alias)",
    )

    # ── Loại văn bản (case-insensitive + English alias) ─────────────
    loai = django_filters.CharFilter(
        method="filter_loai",
        label="Loại văn bản",
    )
    type = django_filters.CharFilter(
        method="filter_loai",
        label="Type (English alias)",
    )

    # ── Năm ───────────────────────────────────────────────────────
    nam = django_filters.NumberFilter(
        field_name="nam",
        label="Năm",
    )
    year = django_filters.NumberFilter(
        field_name="nam",
        label="Year (English alias)",
    )

    # ── Khoảng ngày ────────────────────────────────────────────────
    tu_ngay = django_filters.DateTimeFilter(
        method="filter_tu_ngay",
        label="Từ ngày",
        help_text="Lọc từ ngày (theo ngay_den cho VB Đến, ngay_ban_hanh cho VB Đi/Mật)",
    )
    from_date = django_filters.DateTimeFilter(
        method="filter_tu_ngay",
        label="From date (English alias)",
    )
    den_ngay = django_filters.DateTimeFilter(
        method="filter_den_ngay",
        label="Đến ngày",
        help_text="Lọc đến ngày",
    )
    to_date = django_filters.DateTimeFilter(
        method="filter_den_ngay",
        label="To date (English alias)",
    )

    # ── Hiệu lực (case-insensitive + English alias) ────────────────
    hieu_luc = django_filters.CharFilter(
        method="filter_hieu_luc",
        label="Hiệu lực",
    )
    status = django_filters.CharFilter(
        method="filter_hieu_luc",
        label="Status (English alias)",
    )

    # ── Trạng thái hiển thị ───────────────────────────────────────
    hien_thi = django_filters.BooleanFilter(
        field_name="hien_thi",
        label="Trạng thái hiển thị",
    )
    is_public = django_filters.BooleanFilter(
        field_name="hien_thi",
        label="Is public (English alias)",
    )

    class Meta:
        model = Document
        fields = ["loai", "type", "nam", "year", "hieu_luc", "status", "hien_thi", "is_public"]

    def filter_search(self, queryset, name, value):
        """Tìm kiếm từ khóa trên nhiều trường (icontains)."""
        if not value:
            return queryset
        return queryset.filter(
            Q(so_hieu__icontains=value)
            | Q(trich_yeu__icontains=value)
            | Q(noi_ban_hanh__icontains=value)
        )

    def filter_loai(self, queryset, name, value):
        """Lọc loại văn bản, không phân biệt hoa/thường."""
        if not value:
            return queryset
        return queryset.filter(loai__iexact=value.strip())

    def filter_hieu_luc(self, queryset, name, value):
        """Lọc hiệu lực, không phân biệt hoa/thường."""
        if not value:
            return queryset
        return queryset.filter(hieu_luc__iexact=value.strip())

    def _get_loai_value(self):
        val = self.data.get("loai") or self.data.get("type", "")
        return str(val).strip().upper()

    def filter_tu_ngay(self, queryset, name, value):
        """Lọc từ ngày: VB Đến dùng ngay_den, VB Đi/Mật dùng ngay_ban_hanh."""
        if not value:
            return queryset
        loai = self._get_loai_value()
        if loai == Document.LoaiVanBan.DEN:
            return queryset.filter(ngay_den__gte=value)
        else:
            return queryset.filter(ngay_ban_hanh__gte=value)

    def filter_den_ngay(self, queryset, name, value):
        """Lọc đến ngày: VB Đến dùng ngay_den, VB Đi/Mật dùng ngay_ban_hanh."""
        if not value:
            return queryset
        loai = self._get_loai_value()
        if loai == Document.LoaiVanBan.DEN:
            return queryset.filter(ngay_den__lte=value)
        else:
            return queryset.filter(ngay_ban_hanh__lte=value)


class ViewerFilter(django_filters.FilterSet):
    """
    Bộ lọc cho danh sách người đã xem văn bản.

    Query params:
        ?search=Nguyễn hoặc ?name=Nguyễn     → Tìm theo tên người xem
        ?don_vi=CNTT hoặc ?department=CNTT  → Tìm theo đơn vị / phòng ban
    """

    search = django_filters.CharFilter(
        method="filter_search_viewer",
        label="Tìm kiếm tên",
    )
    name = django_filters.CharFilter(
        method="filter_search_viewer",
        label="Name (English alias)",
    )
    don_vi = django_filters.CharFilter(
        method="filter_don_vi",
        label="Đơn vị / Phòng ban",
    )
    department = django_filters.CharFilter(
        method="filter_don_vi",
        label="Department (English alias)",
    )

    def filter_search_viewer(self, queryset, name, value):
        """Tìm kiếm theo tên người xem."""
        if not value:
            return queryset

        return queryset.filter(
            Q(user__first_name__icontains=value)
            | Q(user__last_name__icontains=value)
            | Q(user__username__icontains=value)
        )

    def filter_don_vi(self, queryset, name, value):
        """
        Tìm kiếm theo đơn vị / phòng ban.
        Hiện tại dùng tạm text search trên user fields.
        Sẽ cập nhật khi Nhóm 7 có model Organization.
        """
        if not value:
            return queryset

        return queryset.filter(
            Q(user__username__icontains=value)
            | Q(user__first_name__icontains=value)
            | Q(user__last_name__icontains=value)
        )
