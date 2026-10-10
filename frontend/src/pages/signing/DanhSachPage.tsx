/** Danh sách hồ sơ: "Cần tôi ký duyệt", "Tôi đã gửi trình", "Hồ sơ theo quyền" (#80 mục E) kèm bộ lọc. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@components/common';
import { DangTai, LoiTai, MucDoBadge, Rong, TrangThaiBadge } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { dinhDangNgay, LOP_O_NHAP, moTaVanBan } from '@lib/signing/dinhDang';
import { useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';
import type { BoLocHoSo } from '@lib/signing/types';

type Hop = 'can_toi_ky' | 'toi_gui' | 'tat_ca';
const TRANG_THAI = ['NHAP', 'CHO_KY', 'HOAN_THANH', 'TU_CHOI', 'HUY'];
const MUC_DO = ['THUONG', 'KHAN', 'HOA_TOC'];

function BoLoc({ hop, loc, onDoi }: { hop: Hop; loc: BoLocHoSo; onDoi: (loc: BoLocHoSo) => void }) {
  const { t } = useSigningT();
  const [tuKhoa, setTuKhoa] = useState(loc.q ?? '');
  const quyTrinh = useTai(() => signingApi.quyTrinh(), []);
  const dat = (thay_doi: BoLocHoSo) => onDoi({ ...loc, ...thay_doi });
  const coLoc = Object.values(loc).some(Boolean);
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); dat({ q: tuKhoa.trim() }); }}>
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs text-secondary">
        {t('danhSach.timKiem')}
        <input className={LOP_O_NHAP} type="search" value={tuKhoa} placeholder={t('danhSach.goiYTim')}
          onChange={(e) => setTuKhoa(e.target.value)} />
      </label>
      {hop !== 'can_toi_ky' && (
        <label className="flex flex-col gap-1 text-xs text-secondary">
          {t('danhSach.trangThai')}
          <select className={`${LOP_O_NHAP} w-auto`} value={loc.trang_thai ?? ''} onChange={(e) => dat({ trang_thai: e.target.value })}>
            <option value="">{t('danhSach.tatCaTrangThai')}</option>
            {TRANG_THAI.map((s) => <option key={s} value={s}>{t(`trangThai.${s}`)}</option>)}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-xs text-secondary">
        {t('danhSach.mucDo')}
        <select className={`${LOP_O_NHAP} w-auto`} value={loc.muc_do ?? ''} onChange={(e) => dat({ muc_do: e.target.value })}>
          <option value="">{t('danhSach.tatCa')}</option>
          {MUC_DO.map((m) => <option key={m} value={m}>{t(`mucDo.${m}`)}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-secondary">
        {t('danhSach.quyTrinh')}
        <select className={`${LOP_O_NHAP} w-auto max-w-56`} value={loc.quy_trinh ?? ''} onChange={(e) => dat({ quy_trinh: e.target.value })}>
          <option value="">{t('danhSach.tatCa')}</option>
          {quyTrinh.duLieu?.map((q) => <option key={q.id} value={String(q.id)}>{q.ten_quy_trinh} (v{q.phien_ban})</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-secondary">
        {t('danhSach.tuNgay')}
        <input className={`${LOP_O_NHAP} w-auto`} type="date" value={loc.tu_ngay ?? ''} onChange={(e) => dat({ tu_ngay: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-secondary">
        {t('danhSach.denNgay')}
        <input className={`${LOP_O_NHAP} w-auto`} type="date" value={loc.den_ngay ?? ''} onChange={(e) => dat({ den_ngay: e.target.value })} />
      </label>
      <Button type="submit" icon="fa-magnifying-glass">{t('danhSach.loc')}</Button>
      {coLoc && (
        <Button type="button" variant="secondary" icon="fa-xmark" onClick={() => { setTuKhoa(''); onDoi({}); }}>
          {t('danhSach.xoaLoc')}
        </Button>
      )}
    </form>
  );
}

export default function DanhSachPage({ hop }: { hop: Hop }) {
  const { t, loi, lang } = useSigningT();
  const [loc, setLoc] = useState<BoLocHoSo>({});
  const ds = useTai(() => signingApi.danhSach(hop, loc), [hop, loc]);
  const rong = { can_toi_ky: 'danhSach.rongCanToiKy', toi_gui: 'danhSach.rongToiGui', tat_ca: 'danhSach.rongTatCa' }[hop];
  const coLoc = Object.values(loc).some(Boolean);

  return (
    <Card className="p-4 space-y-3">
      <BoLoc hop={hop} loc={loc} onDoi={setLoc} />
      {ds.dangTai && <DangTai />}
      {ds.loi && <LoiTai thongBao={loi(ds.loi)} onThuLai={ds.tai} />}
      {!ds.dangTai && !ds.loi && ds.duLieu?.length === 0 && <Rong>{t(coLoc ? 'danhSach.khongKhopLoc' : rong)}</Rong>}
      {!ds.dangTai && !ds.loi && !!ds.duLieu?.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs text-secondary">
                <th className="px-2 py-2">{t('danhSach.maHoSo')}</th>
                <th className="px-2 py-2">{t('danhSach.vanBan')}</th>
                <th className="px-2 py-2">{t('danhSach.quyTrinh')}</th>
                <th className="px-2 py-2">{t('danhSach.mucDo')}</th>
                <th className="px-2 py-2">{t('danhSach.trangThai')}</th>
                <th className="px-2 py-2">{t('danhSach.dangCho')}</th>
                <th className="px-2 py-2">{t('danhSach.nguoiTao')}</th>
                <th className="px-2 py-2">{t('danhSach.hanChot')}</th>
              </tr>
            </thead>
            <tbody>
              {ds.duLieu.map((h) => (
                <tr key={h.id} className="border-b border-border-subtle hover:bg-surface-hover">
                  <td className="px-2 py-2 font-bold">
                    <Link to={`/approvals/${h.id}`} className="text-primary hover:underline">#{h.id}</Link>
                  </td>
                  <td className="px-2 py-2 max-w-md xl:max-w-2xl truncate text-main" title={moTaVanBan(h.van_ban, h.van_ban_id)}>
                    {moTaVanBan(h.van_ban, h.van_ban_id)}
                  </td>
                  <td className="px-2 py-2 text-secondary">{h.ten_quy_trinh}</td>
                  <td className="px-2 py-2"><MucDoBadge mucDo={h.muc_do} /></td>
                  <td className="px-2 py-2"><TrangThaiBadge trangThai={h.trang_thai} /></td>
                  <td className="px-2 py-2 text-secondary">{h.dang_cho.map((d) => d.ten_nguoi_ky).join(', ') || '—'}</td>
                  <td className="px-2 py-2 text-secondary">{h.ten_nguoi_tao}</td>
                  <td className="px-2 py-2 text-secondary">{dinhDangNgay(h.han_chot, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
