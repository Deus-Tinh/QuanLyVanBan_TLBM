from django.contrib import admin
from .models import DanhMucTaiLieu, LoaiTaiLieu, TaiLieuChiTiet


@admin.register(DanhMucTaiLieu)
class DanhMucTaiLieuAdmin(admin.ModelAdmin):
    list_display = ('stt_uu_tien', 'ky_hieu', 'ten_tai_lieu', 'nguoi_lap', 'ngay_lap', 'created_at')
    search_fields = ('ten_tai_lieu', 'ky_hieu', 'ghi_chu')
    ordering = ('stt_uu_tien',)


@admin.register(LoaiTaiLieu)
class LoaiTaiLieuAdmin(admin.ModelAdmin):
    list_display = ('id', 'ten_loai', 'dm_tai_lieu', 'is_public', 'ngay_lap', 'created_at')
    list_filter = ('dm_tai_lieu', 'is_public')
    search_fields = ('ten_loai', 'ghi_chu')
    ordering = ('id',)


@admin.register(TaiLieuChiTiet)
class TaiLieuChiTietAdmin(admin.ModelAdmin):
    list_display = ('id', 'ky_hieu', 'tieu_de', 'dm_tai_lieu', 'hieu_luc', 'ngay_dang', 'hien_thi', 'nguoi_tao')
    list_filter = ('hieu_luc', 'hien_thi', 'dm_tai_lieu', 'ngay_dang')
    search_fields = ('tieu_de', 'ky_hieu', 'noi_ban_hanh', 'ghi_chu')
    filter_horizontal = ('loai_tai_lieu',)
    ordering = ('-ngay_dang', '-id')
