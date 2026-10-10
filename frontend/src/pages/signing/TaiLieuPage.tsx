/**
 * Trang tài liệu: mọi tệp của các hồ sơ người dùng được xem — bản dự thảo, tệp từng lượt trình, tệp hoàn tất — kèm tìm
 * kiếm, lọc loại tệp và khoảng ngày, tải về (kiểm quyền ở máy chủ). Tệp lưu ở máy chủ theo trinh_ky/ và hoan_tat/<năm>/<tháng>/.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '@components/common';
import { DangTai, LoiTai, Rong, ThongBao, TrangThaiBadge } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { dinhDangNgay, LOP_O_NHAP } from '@lib/signing/dinhDang';
import { useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';
import type { BoLocTaiLieu, LoaiTepTaiLieu, TepTaiLieu } from '@lib/signing/types';

const LOAI: LoaiTepTaiLieu[] = ['DU_THAO', 'LUOT', 'HOAN_TAT'];
const BIEU_TUONG: Record<LoaiTepTaiLieu, string> = {
  DU_THAO: 'fa-file-pen text-secondary', LUOT: 'fa-file-pdf text-danger', HOAN_TAT: 'fa-file-circle-check text-success',
};
const LOP_NHAN = 'mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-secondary';

function luuTep(blob: Blob, ten: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ten;
  a.click();
  URL.revokeObjectURL(url);
}

function layTep(tep: TepTaiLieu): Promise<Blob> {
  if (tep.loai === 'HOAN_TAT') return signingApi.tepHoanTat(tep.trinh_ky);
  if (tep.loai === 'LUOT' && tep.luot) return signingApi.tepCuaLuot(tep.trinh_ky, tep.luot);
  return signingApi.tepGoc(tep.trinh_ky);
}

export default function TaiLieuPage() {
  const { t, loi, lang } = useSigningT();
  const [loc, setLoc] = useState<BoLocTaiLieu>({});
  const [tuKhoa, setTuKhoa] = useState('');
  const [thongBao, setThongBao] = useState('');
  const ds = useTai(() => signingApi.taiLieu(loc), [loc]);
  const dat = (thay_doi: BoLocTaiLieu) => setLoc((cu) => ({ ...cu, ...thay_doi }));
  const coLoc = Object.values(loc).some(Boolean);

  const tai = async (tep: TepTaiLieu) => {
    setThongBao('');
    try {
      luuTep(await layTep(tep), tep.ten_tep);
    } catch (err) {
      setThongBao(loi(err));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <form className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-12"
          onSubmit={(e) => { e.preventDefault(); dat({ q: tuKhoa.trim() }); }}>
          <label className="block lg:col-span-4">
            <span className={LOP_NHAN}><i className="fa-solid fa-magnifying-glass text-primary" aria-hidden="true" />{t('danhSach.timKiem')}</span>
            <span className="relative block">
              <input className={`${LOP_O_NHAP} pl-9`} type="search" value={tuKhoa} placeholder={t('taiLieu.goiYTim')}
                onChange={(e) => setTuKhoa(e.target.value)} />
              <i className="fa-solid fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" aria-hidden="true" />
            </span>
          </label>
          <label className="block lg:col-span-2">
            <span className={LOP_NHAN}><i className="fa-solid fa-file text-primary" aria-hidden="true" />{t('taiLieu.loaiTep')}</span>
            <select className={LOP_O_NHAP} value={loc.loai ?? ''} onChange={(e) => dat({ loai: e.target.value as LoaiTepTaiLieu | '' })}>
              <option value="">{t('danhSach.tatCa')}</option>
              {LOAI.map((l) => <option key={l} value={l}>{t(`taiLieu.loai.${l}`)}</option>)}
            </select>
          </label>
          <label className="block lg:col-span-2">
            <span className={LOP_NHAN}>{t('danhSach.tuNgay')}</span>
            <input className={LOP_O_NHAP} type="date" value={loc.tu_ngay ?? ''} onChange={(e) => dat({ tu_ngay: e.target.value })} />
          </label>
          <label className="block lg:col-span-2">
            <span className={LOP_NHAN}>{t('danhSach.denNgay')}</span>
            <input className={LOP_O_NHAP} type="date" value={loc.den_ngay ?? ''} onChange={(e) => dat({ den_ngay: e.target.value })} />
          </label>
          <div className="flex gap-2 lg:col-span-2">
            <Button type="submit" size="sm" icon="fa-filter">{t('danhSach.loc')}</Button>
            {coLoc && (
              <Button type="button" size="sm" variant="secondary" icon="fa-rotate-left" onClick={() => { setTuKhoa(''); setLoc({}); }}>
                {t('danhSach.xoaLoc')}
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card className="p-4 space-y-3">
        {thongBao && <ThongBao>{thongBao}</ThongBao>}
        {ds.dangTai && <DangTai />}
        {ds.loi && <LoiTai thongBao={loi(ds.loi)} onThuLai={ds.tai} />}
        {!ds.dangTai && !ds.loi && ds.duLieu?.length === 0 && (
          <Rong icon="fa-folder-open">{t(coLoc ? 'taiLieu.khongKhopLoc' : 'taiLieu.rong')}</Rong>
        )}
        {!ds.dangTai && !ds.loi && !!ds.duLieu?.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated/70 text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 min-w-[220px]">{t('taiLieu.tep')}</th>
                  <th className="px-4 py-3 text-center w-28">{t('taiLieu.loaiTep')}</th>
                  <th className="px-4 py-3 text-center w-24">{t('danhSach.maHoSo')}</th>
                  <th className="px-4 py-3 min-w-[200px]">{t('danhSach.vanBan')}</th>
                  <th className="px-4 py-3 w-40">{t('danhSach.quyTrinh')}</th>
                  <th className="px-4 py-3 text-center w-28">{t('taiLieu.phienBan')}</th>
                  <th className="px-4 py-3 text-center w-32">{t('chiTiet.maBam')}</th>
                  <th className="px-4 py-3 w-36">{t('taiLieu.ngay')}</th>
                  <th className="px-4 py-3 text-center w-24">{t('danhSach.thaoTac')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {ds.duLieu.map((tep) => {
                  const van_ban = [tep.van_ban.so_hieu, tep.van_ban.trich_yeu].filter(Boolean).join(' — ');
                  return (
                    <tr key={`${tep.loai}-${tep.trinh_ky}-${tep.luot ?? 0}`} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-main">
                        <div className="flex items-center gap-2">
                          <i className={`fa-solid ${BIEU_TUONG[tep.loai]} text-sm shrink-0`} aria-hidden="true" />
                          <span className="truncate max-w-xs">{tep.ten_tep}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap"><Badge variant="info" size="sm">{t(`taiLieu.loai.${tep.loai}`)}</Badge></td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <Link to={`/approvals/${tep.trinh_ky}`} className="font-bold text-primary hover:underline">#{tep.trinh_ky}</Link>
                        <span className="ml-1.5"><TrangThaiBadge trangThai={tep.trang_thai_ho_so} /></span>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs xl:max-w-md truncate text-main" title={van_ban}>{van_ban || '—'}</td>
                      <td className="px-4 py-3.5 text-secondary">{tep.ten_quy_trinh}</td>
                      <td className="px-4 py-3.5 text-center text-secondary whitespace-nowrap">
                        {tep.so_luot ? t('taiLieu.luotBan', { so: tep.so_luot, ban: tep.phien_ban ?? '' }) : tep.phien_ban}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-muted" title={tep.ma_bam}>{tep.ma_bam.slice(0, 10)}…</td>
                      <td className="px-4 py-3.5 text-secondary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <i className="fa-regular fa-calendar text-muted text-xs" aria-hidden="true" />
                          <span>{dinhDangNgay(tep.thoi_diem, lang)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <Button size="sm" variant="ghost" icon="fa-download" onClick={() => tai(tep)} title={t('chung.taiVe')}>{t('chung.taiVe')}</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
