/**
 * Danh sách hồ sơ: "Cần tôi ký duyệt", "Tôi đã gửi trình", "Hồ sơ theo quyền" (#80 mục E) kèm bộ lọc:
 * thẻ lọc nhanh có số lượng (đang chờ ký, bị trả lại, quá hạn, hoàn tất…), ô tìm kiếm tự áp dụng và
 * phần "Lọc thêm" thu gọn (mức độ, quy trình, khoảng ngày). Hộp rỗng và chưa lọc thì không hiện khối lọc.
 * Danh sách phân trang phía server (10 hồ sơ mỗi trang); đổi bộ lọc hoặc hộp thì về trang 1.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@components/common';
import { DangTai, LoiTai, Rong, TrangThaiHoSo } from '@components/signing/ChungUI';
import { PhanTrang } from '@components/signing/PhanTrang';
import { SO_HO_SO_MOI_TRANG, signingApi } from '@lib/signing/api';
import { dinhDangNgay, LOP_O_NHAP, moTaVanBan } from '@lib/signing/dinhDang';
import { useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';
import type { BoLocHoSo, LocNhanh, ThongKeHoSo } from '@lib/signing/types';

type Hop = 'can_toi_ky' | 'toi_gui' | 'tat_ca';
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
const TRE_TIM_KIEM_MS = 300;

function TheNhanh({ thongKe, chon, onChon }: { thongKe: ThongKeHoSo | null; chon: string; onChon: (khoa: LocNhanh | '') => void }) {
  const { t } = useSigningT();
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('danhSach.locNhanh')}>
      {THE_NHANH.map(({ khoa, icon }) => {
        const so = thongKe ? thongKe[khoa || 'tat_ca'] : undefined;
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

function BoLoc({ thongKe, loc, capNhat, xoaHet }: {
  thongKe: ThongKeHoSo | null; loc: BoLocHoSo; capNhat: (thay_doi: BoLocHoSo) => void; xoaHet: () => void;
}) {
  const { t } = useSigningT();
  const [tuKhoa, setTuKhoa] = useState(loc.q ?? '');
  const [moLocThem, setMoLocThem] = useState(false);
  const quyTrinh = useTai(() => signingApi.quyTrinh(), []);
  const coLoc = Object.values(loc).some(Boolean);
  const soLocThem = [loc.quy_trinh, loc.tu_ngay, loc.den_ngay].filter(Boolean).length;

  useEffect(() => {
    const q = tuKhoa.trim();
    if (q === (loc.q ?? '')) return undefined;
    const hen = setTimeout(() => capNhat({ q }), TRE_TIM_KIEM_MS);
    return () => clearTimeout(hen);
  }, [tuKhoa, loc.q, capNhat]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 basis-full lg:flex-1 lg:basis-0">
          <TheNhanh thongKe={thongKe} chon={loc.nhanh ?? ''} onChon={(khoa) => capNhat({ nhanh: khoa })} />
        </div>
        <span className="relative block w-full sm:w-72">
          <input className={`${LOP_O_NHAP} pl-9`} type="search" value={tuKhoa} placeholder={t('danhSach.goiYTim')}
            aria-label={t('danhSach.timKiem')} onChange={(e) => setTuKhoa(e.target.value)} />
          <i className="fa-solid fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" aria-hidden="true" />
          {tuKhoa && (
            <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-xs text-muted hover:text-main"
              aria-label={t('danhSach.xoaTuKhoa')} onClick={() => { setTuKhoa(''); capNhat({ q: '' }); }}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          )}
        </span>
        <Button type="button" size="sm" variant="secondary" icon="fa-sliders" aria-expanded={moLocThem}
          onClick={() => setMoLocThem((m) => !m)}>
          {t('danhSach.locThem')}{soLocThem > 0 && ` (${soLocThem})`}
        </Button>
        {coLoc && (
          <Button type="button" size="sm" variant="secondary" icon="fa-rotate-left" onClick={() => { setTuKhoa(''); xoaHet(); }}>
            {t('danhSach.xoaLoc')}
          </Button>
        )}
      </div>
      {moLocThem && (
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className={LOP_NHAN}><i className="fa-solid fa-diagram-project text-primary" aria-hidden="true" />{t('danhSach.quyTrinh')}</span>
            <select className={LOP_O_NHAP} value={loc.quy_trinh ?? ''} onChange={(e) => capNhat({ quy_trinh: e.target.value })}>
              <option value="">{t('danhSach.tatCa')}</option>
              {quyTrinh.duLieu?.map((q) => <option key={q.id} value={String(q.id)}>{q.ten_quy_trinh} (v{q.phien_ban})</option>)}
            </select>
          </label>
          <label className="block">
            <span className={LOP_NHAN}>{t('danhSach.tuNgay')}</span>
            <input className={LOP_O_NHAP} type="date" value={loc.tu_ngay ?? ''} onChange={(e) => capNhat({ tu_ngay: e.target.value })} />
          </label>
          <label className="block">
            <span className={LOP_NHAN}>{t('danhSach.denNgay')}</span>
            <input className={LOP_O_NHAP} type="date" value={loc.den_ngay ?? ''} onChange={(e) => capNhat({ den_ngay: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}

export default function DanhSachPage({ hop }: { hop: Hop }) {
  const { t, loi, lang } = useSigningT();
  const [loc, setLoc] = useState<BoLocHoSo>({});
  const [trang, setTrang] = useState(1);
  const [hopDangXem, setHopDangXem] = useState(hop);
  if (hopDangXem !== hop) {  // đổi hộp: về trang 1
    setHopDangXem(hop);
    setTrang(1);
  }
  const dem = useTai(() => signingApi.thongKe(hop), [hop]);
  const ds = useTai(() => signingApi.danhSach(hop, loc, trang), [hop, loc, trang]);
  const hoSo = ds.duLieu?.results;
  const rong = { can_toi_ky: 'danhSach.rongCanToiKy', toi_gui: 'danhSach.rongToiGui', tat_ca: 'danhSach.rongTatCa' }[hop];
  const coLoc = Object.values(loc).some(Boolean);
  const hopRong = dem.duLieu?.tat_ca === 0 && !coLoc;
  const capNhat = useCallback((thay_doi: BoLocHoSo) => {
    setLoc((cu) => ({ ...cu, ...thay_doi }));
    setTrang(1);
  }, []);
  const xoaHet = useCallback(() => {
    setLoc({});
    setTrang(1);
  }, []);

  return (
    <div className="space-y-4">
      {!hopRong && (
        <Card className="p-4">
          <BoLoc thongKe={dem.duLieu} loc={loc} capNhat={capNhat} xoaHet={xoaHet} />
        </Card>
      )}
      <Card className="p-4 space-y-3">
        {ds.dangTai && <DangTai />}
        {ds.loi && <LoiTai thongBao={loi(ds.loi)} onThuLai={ds.tai} />}
        {!ds.dangTai && !ds.loi && hoSo?.length === 0 && <Rong>{t(coLoc ? 'danhSach.khongKhopLoc' : rong)}</Rong>}
        {!ds.dangTai && !ds.loi && !!hoSo?.length && (
          <>
          {/* Màn hình hẹp: thẻ thay cho bảng để luôn thấy trạng thái, người đang chờ, hạn chót */}
          <ul className="space-y-2 md:hidden" aria-label={t('danhSach.vanBan')}>
            {hoSo.map((h) => (
              <li key={h.id} className="rounded-lg border border-border-subtle p-3">
                <Link to={`/approvals/${h.id}`} className="block font-semibold text-main hover:text-primary break-words">
                  {moTaVanBan(h.van_ban, h.van_ban_id)}
                </Link>
                <div className="mt-1 text-xs text-muted break-words">#{h.id} · {h.ten_quy_trinh}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2"><TrangThaiHoSo hoSo={h} /></div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-secondary">
                  <dt>{t('danhSach.dangCho')}</dt>
                  <dd className="text-main break-words">{h.dang_cho.map((d) => d.ten_nguoi_ky).join(', ') || '—'}</dd>
                  <dt>{t('danhSach.nguoiTao')}</dt><dd className="text-main break-words">{h.ten_nguoi_tao}</dd>
                  <dt>{t('danhSach.hanChot')}</dt><dd className="text-main">{dinhDangNgay(h.han_chot, lang)}</dd>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm text-left table-fixed min-w-[48rem]">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated/70 text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="px-3.5 py-2 text-left w-[50%]">{t('danhSach.vanBan')}</th>
                  <th className="px-2 py-2 text-center whitespace-nowrap w-[14%]">{t('danhSach.trangThai')}</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap w-[14%]">{t('danhSach.dangCho')}</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap w-[12%]">{t('danhSach.nguoiTao')}</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap w-[10%]">{t('danhSach.hanChot')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {hoSo.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-3.5 py-2 truncate">
                      <Link to={`/approvals/${h.id}`} className="font-semibold text-main hover:text-primary transition-colors flex items-center gap-1.5 text-base truncate" title={moTaVanBan(h.van_ban, h.van_ban_id)}>
                        <i className="fa-solid fa-file-contract text-primary/70 text-sm shrink-0" aria-hidden="true" />
                        <span className="truncate">{moTaVanBan(h.van_ban, h.van_ban_id)}</span>
                      </Link>
                      <div className="mt-0.5 truncate text-xs text-muted" title={h.ten_quy_trinh}>#{h.id} · {h.ten_quy_trinh}</div>
                    </td>
                    <td className="px-2 py-2 text-center"><TrangThaiHoSo hoSo={h} /></td>
                    <td className="px-2.5 py-2 text-secondary whitespace-nowrap truncate">{h.dang_cho.map((d) => d.ten_nguoi_ky).join(', ') || '—'}</td>
                    <td className="px-2.5 py-2 text-secondary whitespace-nowrap truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <i className="fa-regular fa-user text-muted text-xs shrink-0" aria-hidden="true" />
                        <span className="truncate">{h.ten_nguoi_tao}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-2 text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-regular fa-calendar text-muted text-xs shrink-0" aria-hidden="true" />
                        <span>{dinhDangNgay(h.han_chot, lang)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PhanTrang trang={trang} soMoiTrang={SO_HO_SO_MOI_TRANG} tong={ds.duLieu?.count ?? 0} onDoi={setTrang} />
          </>
        )}
      </Card>
    </div>
  );
}
