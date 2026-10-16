/** Danh sách hồ sơ: "Cần tôi ký duyệt", "Tôi đã gửi trình", "Hồ sơ theo quyền" (#80 mục E). */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@components/common';
import { DangTai, LoiTai, MucDoBadge, Rong, TrangThaiBadge } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { dinhDangNgay, LOP_O_NHAP, moTaVanBan } from '@lib/signing/dinhDang';
import { useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';

type Hop = 'can_toi_ky' | 'toi_gui' | 'tat_ca';
const TRANG_THAI = ['NHAP', 'CHO_KY', 'HOAN_THANH', 'TU_CHOI', 'HUY'];

export default function DanhSachPage({ hop }: { hop: Hop }) {
  const { t, loi, lang } = useSigningT();
  const [loc, setLoc] = useState('');
  const ds = useTai(() => signingApi.danhSach(hop, loc || undefined), [hop, loc]);
  const rong = { can_toi_ky: 'danhSach.rongCanToiKy', toi_gui: 'danhSach.rongToiGui', tat_ca: 'danhSach.rongTatCa' }[hop];

  return (
    <div className="space-y-4">
      {hop !== 'can_toi_ky' && (
        <label className="flex flex-wrap items-center gap-3 text-sm font-semibold text-secondary">
          <span className="whitespace-nowrap">{t('danhSach.locTrangThai')}</span>
          <select className={`${LOP_O_NHAP} sm:w-64`} value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="">{t('danhSach.tatCaTrangThai')}</option>
            {TRANG_THAI.map((s) => <option key={s} value={s}>{t(`trangThai.${s}`)}</option>)}
          </select>
        </label>
      )}
      <Card className="overflow-hidden">
        {ds.dangTai && <DangTai />}
        {ds.loi && <div className="px-4"><LoiTai thongBao={loi(ds.loi)} onThuLai={ds.tai} /></div>}
        {!ds.dangTai && !ds.loi && ds.duLieu?.length === 0 && <Rong>{t(rong)}</Rong>}
        {!ds.dangTai && !ds.loi && !!ds.duLieu?.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-elevated text-secondary text-xs uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">{t('danhSach.maHoSo')}</th>
                  <th className="px-4 py-3">{t('danhSach.vanBan')}</th>
                  <th className="px-4 py-3">{t('danhSach.quyTrinh')}</th>
                  <th className="px-4 py-3">{t('danhSach.mucDo')}</th>
                  <th className="px-4 py-3">{t('danhSach.trangThai')}</th>
                  <th className="px-4 py-3">{t('danhSach.dangCho')}</th>
                  <th className="px-4 py-3">{t('danhSach.nguoiTao')}</th>
                  <th className="px-4 py-3">{t('danhSach.hanChot')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ds.duLieu.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-bold">
                      <Link to={`/approvals/${h.id}`} className="text-primary hover:underline">#{h.id}</Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-main" title={moTaVanBan(h.van_ban, h.van_ban_id)}>
                      {moTaVanBan(h.van_ban, h.van_ban_id)}
                    </td>
                    <td className="px-4 py-3 text-secondary">{h.ten_quy_trinh}</td>
                    <td className="px-4 py-3"><MucDoBadge mucDo={h.muc_do} /></td>
                    <td className="px-4 py-3"><TrangThaiBadge trangThai={h.trang_thai} /></td>
                    <td className="px-4 py-3 text-secondary">{h.dang_cho.map((d) => d.ten_nguoi_ky).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-secondary">{h.ten_nguoi_tao}</td>
                    <td className="px-4 py-3 text-secondary">{dinhDangNgay(h.han_chot, lang)}</td>
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
