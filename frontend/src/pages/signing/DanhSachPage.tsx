/**
 * Danh sách hồ sơ: "Cần tôi ký duyệt", "Tôi đã gửi trình", "Hồ sơ theo quyền" (#80 mục E) kèm bộ lọc:
 * thẻ lọc nhanh có số lượng (đang chờ ký, bị trả lại, quá hạn, hoàn tất…) và thanh lọc chi tiết cùng kiểu trang Văn bản
 * (từ khóa, mức độ, quy trình, khoảng ngày).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@components/common';
import { DangTai, LoiTai, MucDoBadge, Rong, TrangThaiBadge } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { dinhDangNgay, LOP_O_NHAP, moTaVanBan } from '@lib/signing/dinhDang';
import { useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';
import type { BoLocHoSo, LocNhanh } from '@lib/signing/types';

type Hop = 'can_toi_ky' | 'toi_gui' | 'tat_ca';
const MUC_DO = ['THUONG', 'KHAN', 'HOA_TOC'];
const THE_NHANH: { khoa: LocNhanh | ''; icon: string }[] = [
  { khoa: '', icon: 'fa-layer-group' },
  { khoa: 'cho_ky', icon: 'fa-hourglass-half' },
  { khoa: 'tra_lai', icon: 'fa-rotate-left' },
  { khoa: 'qua_han', icon: 'fa-triangle-exclamation' },
  { khoa: 'nhap', icon: 'fa-file-pen' },
  { khoa: 'hoan_thanh', icon: 'fa-circle-check' },
  { khoa: 'tu_choi', icon: 'fa-circle-xmark' },
  { khoa: 'huy', icon: 'fa-ban' },
];
const LOP_NHAN = 'mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-secondary';

function TheNhanh({ hop, chon, onChon }: { hop: Hop; chon: string; onChon: (khoa: LocNhanh | '') => void }) {
  const { t } = useSigningT();
  const dem = useTai(() => signingApi.thongKe(hop), [hop]);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('danhSach.locNhanh')}>
      {THE_NHANH.map(({ khoa, icon }) => {
        const so = dem.duLieu ? dem.duLieu[khoa || 'tat_ca'] : undefined;
        const dangChon = chon === khoa;
        if (khoa && !dangChon && so === 0) return null;  // ẩn thẻ rỗng cho gọn
        return (
          <button key={khoa || 'tat_ca'} type="button" aria-pressed={dangChon} onClick={() => onChon(khoa)}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              dangChon
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-border-subtle bg-surface text-secondary hover:border-primary/40 hover:text-main hover:bg-surface-hover'}`}>
            <i className={`fa-solid ${icon}`} aria-hidden="true" />
            <span>{t(`danhSach.nhanh.${khoa || 'tat_ca'}`)}</span>
            {so !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                dangChon ? 'bg-white/20 text-white' : 'bg-surface-elevated text-secondary'}`}>
                {so}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function BoLoc({ hop, loc, onDoi }: { hop: Hop; loc: BoLocHoSo; onDoi: (loc: BoLocHoSo) => void }) {
  const { t } = useSigningT();
  const [tuKhoa, setTuKhoa] = useState(loc.q ?? '');
  const quyTrinh = useTai(() => signingApi.quyTrinh(), []);
  const dat = (thay_doi: BoLocHoSo) => onDoi({ ...loc, ...thay_doi });
  const coLoc = Object.values(loc).some(Boolean);
  return (
    <div className="space-y-3">
      <TheNhanh hop={hop} chon={loc.nhanh ?? ''} onChon={(khoa) => dat({ nhanh: khoa })} />
      <form className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-12"
        onSubmit={(e) => { e.preventDefault(); dat({ q: tuKhoa.trim() }); }}>
        <label className="block lg:col-span-6">
          <span className={LOP_NHAN}><i className="fa-solid fa-magnifying-glass text-primary" aria-hidden="true" />{t('danhSach.timKiem')}</span>
          <span className="relative block">
            <input className={`${LOP_O_NHAP} pl-9`} type="search" value={tuKhoa} placeholder={t('danhSach.goiYTim')}
              onChange={(e) => setTuKhoa(e.target.value)} />
            <i className="fa-solid fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" aria-hidden="true" />
            {tuKhoa && (
              <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-xs text-muted hover:text-main"
                aria-label={t('danhSach.xoaTuKhoa')} onClick={() => { setTuKhoa(''); dat({ q: '' }); }}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            )}
          </span>
        </label>
        <label className="block lg:col-span-3">
          <span className={LOP_NHAN}><i className="fa-solid fa-bolt text-primary" aria-hidden="true" />{t('danhSach.mucDo')}</span>
          <select className={LOP_O_NHAP} value={loc.muc_do ?? ''} onChange={(e) => dat({ muc_do: e.target.value })}>
            <option value="">{t('danhSach.tatCa')}</option>
            {MUC_DO.map((m) => <option key={m} value={m}>{t(`mucDo.${m}`)}</option>)}
          </select>
        </label>
        <label className="block lg:col-span-3">
          <span className={LOP_NHAN}><i className="fa-solid fa-diagram-project text-primary" aria-hidden="true" />{t('danhSach.quyTrinh')}</span>
          <select className={LOP_O_NHAP} value={loc.quy_trinh ?? ''} onChange={(e) => dat({ quy_trinh: e.target.value })}>
            <option value="">{t('danhSach.tatCa')}</option>
            {quyTrinh.duLieu?.map((q) => <option key={q.id} value={String(q.id)}>{q.ten_quy_trinh} (v{q.phien_ban})</option>)}
          </select>
        </label>
        <label className="block lg:col-span-3">
          <span className={LOP_NHAN}>{t('danhSach.tuNgay')}</span>
          <input className={LOP_O_NHAP} type="date" value={loc.tu_ngay ?? ''} onChange={(e) => dat({ tu_ngay: e.target.value })} />
        </label>
        <label className="block lg:col-span-3">
          <span className={LOP_NHAN}>{t('danhSach.denNgay')}</span>
          <input className={LOP_O_NHAP} type="date" value={loc.den_ngay ?? ''} onChange={(e) => dat({ den_ngay: e.target.value })} />
        </label>
        <div className="flex gap-2 lg:col-span-6">
          <Button type="submit" size="sm" icon="fa-filter">{t('danhSach.loc')}</Button>
          {coLoc && (
            <Button type="button" size="sm" variant="secondary" icon="fa-rotate-left" onClick={() => { setTuKhoa(''); onDoi({}); }}>
              {t('danhSach.xoaLoc')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function DanhSachPage({ hop }: { hop: Hop }) {
  const { t, loi, lang } = useSigningT();
  const [loc, setLoc] = useState<BoLocHoSo>({});
  const ds = useTai(() => signingApi.danhSach(hop, loc), [hop, loc]);
  const rong = { can_toi_ky: 'danhSach.rongCanToiKy', toi_gui: 'danhSach.rongToiGui', tat_ca: 'danhSach.rongTatCa' }[hop];
  const coLoc = Object.values(loc).some(Boolean);

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <BoLoc hop={hop} loc={loc} onDoi={setLoc} />
      </Card>
      <Card className="p-4 space-y-3">
        {ds.dangTai && <DangTai />}
        {ds.loi && <LoiTai thongBao={loi(ds.loi)} onThuLai={ds.tai} />}
        {!ds.dangTai && !ds.loi && ds.duLieu?.length === 0 && <Rong>{t(coLoc ? 'danhSach.khongKhopLoc' : rong)}</Rong>}
        {!ds.dangTai && !ds.loi && !!ds.duLieu?.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated/70 text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 text-center w-20">{t('danhSach.maHoSo')}</th>
                  <th className="px-4 py-3 min-w-[260px]">{t('danhSach.vanBan')}</th>
                  <th className="px-4 py-3 w-44">{t('danhSach.quyTrinh')}</th>
                  <th className="px-4 py-3 text-center w-32">{t('danhSach.mucDo')}</th>
                  <th className="px-4 py-3 text-center w-36">{t('danhSach.trangThai')}</th>
                  <th className="px-4 py-3 w-40">{t('danhSach.dangCho')}</th>
                  <th className="px-4 py-3 w-36">{t('danhSach.nguoiTao')}</th>
                  <th className="px-4 py-3 w-36">{t('danhSach.hanChot')}</th>
                  <th className="px-4 py-3 text-center w-20">{t('danhSach.thaoTac')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {ds.duLieu.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3.5 text-center font-bold text-primary whitespace-nowrap">
                      <Link to={`/approvals/${h.id}`} className="hover:underline">#{h.id}</Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link to={`/approvals/${h.id}`} className="font-semibold text-main hover:text-primary transition-colors flex items-center gap-1.5 text-base" title={moTaVanBan(h.van_ban, h.van_ban_id)}>
                        <i className="fa-solid fa-file-contract text-primary/70 text-sm shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-xs xl:max-w-md">{moTaVanBan(h.van_ban, h.van_ban_id)}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-secondary">{h.ten_quy_trinh}</td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap"><MucDoBadge mucDo={h.muc_do} /></td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap"><TrangThaiBadge trangThai={h.trang_thai} /></td>
                    <td className="px-4 py-3.5 text-secondary">{h.dang_cho.map((d) => d.ten_nguoi_ky).join(', ') || '—'}</td>
                    <td className="px-4 py-3.5 text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-regular fa-user text-muted text-xs" aria-hidden="true" />
                        <span>{h.ten_nguoi_tao}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-regular fa-calendar text-muted text-xs" aria-hidden="true" />
                        <span>{dinhDangNgay(h.han_chot, lang)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <Link to={`/approvals/${h.id}`} className="inline-flex items-center justify-center p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary-subtle transition-colors" title={t('chiTiet.xemChiTiet')}>
                        <i className="fa-solid fa-eye text-sm" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
