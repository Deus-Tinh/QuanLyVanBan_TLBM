/** Tiện ích hiển thị dùng chung của phân hệ Trình ký. */

export const LOP_O_NHAP =
  'w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2 text-sm text-main placeholder:text-muted ' +
  'focus:outline-none focus:border-focus focus:ring-2 focus:ring-primary-subtle';

/** Chữ thường, bỏ dấu tiếng Việt (đ -> d) để tìm không phân biệt hoa thường và dấu (như server). */
export function boDau(chuoi: string): string {
  return chuoi.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
}

export function dinhDangNgay(iso: string | null | undefined, lang: 'vi' | 'en'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function moTaVanBan(vb: { so_hieu?: string; trich_yeu?: string } | undefined, van_ban_id: number): string {
  const phan = [vb?.so_hieu, vb?.trich_yeu].filter(Boolean);
  return phan.length ? phan.join(' — ') : `#${van_ban_id}`;
}

export function taiXuong(blob: Blob, ten: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ten;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Người ký chưa ký trên lượt đã kết thúc (từ chối, hủy) không còn phải ký; lượt đang trả sửa thì tạm dừng. */
export function trangThaiNguoiKy(luot: string, nguoi: string, da_mo: boolean): string {
  if (nguoi !== 'CHO_KY') return nguoi;
  if (luot === 'TU_CHOI' || luot === 'HUY') return 'KHONG_CAN_KY';
  if (luot === 'YEU_CAU_SUA') return 'TAM_DUNG';
  return da_mo ? 'CHO_KY' : 'CHUA_MO';
}
