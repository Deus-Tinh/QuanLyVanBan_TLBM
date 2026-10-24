/**
 * Thành phần giao diện dùng chung của phân hệ Trình ký: badge trạng thái, hộp thoại, thông báo, trạng thái tải.
 * CSS theo Design Tokens (class Tailwind ngữ nghĩa), không mã màu cứng.
 */
import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge, Button } from '@components/common';
import type { BadgeProps } from '@components/common/Badge';
import { useSigningT } from '@lib/signing/i18n';

const MAU_TRANG_THAI: Record<string, BadgeProps['variant']> = {
  NHAP: 'secondary', CHO_KY: 'warning', HOAN_THANH: 'success', TU_CHOI: 'danger', HUY: 'secondary',
  YEU_CAU_SUA: 'purple', CHUA_MO: 'secondary', DANG_KY: 'primary', TAM_DUNG: 'purple', DA_KY: 'success',
  HOAT_DONG: 'success', NGUNG: 'secondary', CHO_KICH_HOAT: 'info', DA_XOAY_VONG: 'secondary', THU_HOI: 'danger',
  HET_HAN: 'secondary', KHONG_CAN_KY: 'secondary',
};

/** `nhom = 'trangThaiCap'` cho trạng thái cấp ký (HOAN_THANH của cấp là "Đã xong", khác hồ sơ hoàn tất).
 * `size = 'md'` cho cột trạng thái của bảng và tiêu đề hồ sơ (cỡ sm khó đọc cạnh chữ 14px). */
export function TrangThaiBadge({ trangThai, nhom = 'trangThai', size = 'sm' }: {
  trangThai: string; nhom?: 'trangThai' | 'trangThaiCap'; size?: 'sm' | 'md' }) {
  const { t } = useSigningT();
  return (
    <Badge variant={MAU_TRANG_THAI[trangThai] || 'secondary'} size={size} withDot>
      {t(`${nhom}.${trangThai}`)}
    </Badge>
  );
}

/** Trạng thái hồ sơ trên danh sách: hồ sơ chờ ký mà lượt đang trả lại để sửa hiện "trả lại"; kèm dấu quá hạn. */
export function TrangThaiHoSo({ hoSo }: { hoSo: { trang_thai: string; trang_thai_luot?: string | null; qua_han?: boolean } }) {
  const { t } = useSigningT();
  const tra_lai = hoSo.trang_thai === 'CHO_KY' && hoSo.trang_thai_luot === 'YEU_CAU_SUA';
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-1">
      <TrangThaiBadge trangThai={tra_lai ? 'YEU_CAU_SUA' : hoSo.trang_thai} size="md" />
      {hoSo.qua_han && (
        <Badge variant="danger" size="md">
          <i className="fa-regular fa-clock mr-1" aria-hidden="true" />{t('danhSach.quaHan')}
        </Badge>
      )}
    </span>
  );
}

export function ThongBao({ loai = 'loi', children }: { loai?: 'loi' | 'thanh_cong' | 'thong_tin' | 'canh_bao';
  children: React.ReactNode }) {
  const kieu = {
    loi: 'bg-danger-subtle border-danger-border text-danger',
    thanh_cong: 'bg-success-subtle border-success-border text-success',
    thong_tin: 'bg-info-subtle border-info-border text-info',
    canh_bao: 'bg-warning-subtle border-warning-border text-warning-text',
  }[loai];
  const icon = { loi: 'fa-circle-exclamation', thanh_cong: 'fa-circle-check', thong_tin: 'fa-circle-info',
    canh_bao: 'fa-triangle-exclamation' }[loai];
  return (
    <div role={loai === 'loi' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${kieu}`}>
      <i className={`fa-solid ${icon} mt-0.5`} aria-hidden="true" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function DangTai() {
  const { t } = useSigningT();
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-secondary text-sm" role="status">
      <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> {t('chung.dangTai')}
    </div>
  );
}

export function Rong({ icon = 'fa-inbox', children }: { icon?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted text-sm text-center">
      <i className={`fa-solid ${icon} text-2xl`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function LoiTai({ thongBao, onThuLai }: { thongBao: string; onThuLai?: () => void }) {
  const { t } = useSigningT();
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <ThongBao>{thongBao}</ThongBao>
      {onThuLai && <Button variant="secondary" size="sm" icon="fa-rotate-right" onClick={onThuLai}>{t('chung.thuLai')}</Button>}
    </div>
  );
}

export function HopThoai({ moTieuDe, mo, onDong, children, chanDuoi }: {
  moTieuDe: string; mo: boolean; onDong: () => void; children: React.ReactNode; chanDuoi?: React.ReactNode;
}) {
  const id = useId();
  const { t } = useSigningT();
  useEffect(() => {
    if (!mo) return undefined;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onDong();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [mo, onDong]);
  if (!mo) return null;
  // Render vào body như modal dùng chung (phủ cả header, sidebar); khung hộp thoại tự giữ cỡ chữ phân hệ (signing-zoom)
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-backdrop p-4 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby={id}
        className="signing-zoom w-full max-w-2xl rounded-2xl border border-border-subtle bg-surface-elevated shadow-xl animate-slide-in-bottom">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 id={id} className="text-xl font-bold text-main">{moTieuDe}</h2>
          <button type="button" onClick={onDong} className="rounded-full p-1.5 text-secondary hover:text-main hover:bg-surface-hover transition-colors" aria-label={t('chung.dong')}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
        {chanDuoi && <div className="flex justify-end gap-2.5 border-t border-border-subtle px-6 py-4">{chanDuoi}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function TruongNhap({ nhan, children, ghiChu }: { nhan: string; children: React.ReactNode; ghiChu?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-main">{nhan}</span>
      {children}
      {ghiChu && <span className="block text-xs text-muted">{ghiChu}</span>}
    </label>
  );
}

/** Ô chọn tệp có nhãn theo ngôn ngữ giao diện (ô file gốc hiện "Choose File" theo trình duyệt).
 * Đặt trong `<label>` (TruongNhap) hoặc bọc `<label>` riêng để bấm cả khung mở hộp chọn tệp. */
export function OChonTep({ accept, onChon, nhan }: { accept: string; onChon: (tep: File | undefined) => void; nhan?: string }) {
  const { t } = useSigningT();
  const [ten, setTen] = useState('');
  return (
    <span className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-surface px-2 py-1.5 text-sm focus-within:border-focus focus-within:ring-2 focus-within:ring-primary-subtle">
      <input type="file" accept={accept} aria-label={nhan} className="sr-only"
        onChange={(e) => { const tep = e.target.files?.[0]; setTen(tep?.name ?? ''); onChon(tep); }} />
      <span className="shrink-0 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1 font-medium text-main">
        {t('chung.chonTep')}
      </span>
      <span className={`min-w-0 truncate ${ten ? 'text-main' : 'text-muted'}`}>{ten || t('chung.chuaChonTep')}</span>
    </span>
  );
}
