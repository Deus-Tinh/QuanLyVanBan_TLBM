/**
 * Phân hệ Trình ký duyệt nội bộ (Nhóm 5, #80 mục E) dưới đường dẫn /approvals/*.
 * Tab chỉ là bộ lọc hiển thị; quyền đọc/ghi do server kiểm ở từng API.
 */
import { lazy, Suspense, useMemo } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Button } from '@components/common';
import { DangTai, LoiTai } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { coQuyen, SigningContext, useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';

const DanhSachPage = lazy(() => import('./DanhSachPage'));
const TaoHoSoPage = lazy(() => import('./TaoHoSoPage'));
const ChiTietPage = lazy(() => import('./ChiTietPage'));
const QuyTrinhPage = lazy(() => import('./QuyTrinhPage'));
const KhoaPage = lazy(() => import('./KhoaPage'));
const ThongBaoPage = lazy(() => import('./ThongBaoPage'));

export default function SigningModule() {
  const { t, loi } = useSigningT();
  const toi = useTai(() => signingApi.toi());
  const dieuHuong = useNavigate();
  const ngu_canh = useMemo(() => ({ toi: toi.duLieu, taiLaiToi: toi.tai }), [toi.duLieu, toi.tai]);

  const tab = [
    { den: '/approvals', nhan: t('nav.canToiKy'), icon: 'fa-pen-nib', end: true },
    { den: '/approvals/toi-gui', nhan: t('nav.toiGui'), icon: 'fa-paper-plane' },
    { den: '/approvals/tat-ca', nhan: t('nav.tatCa'), icon: 'fa-folder-open' },
    { den: '/approvals/thong-bao', nhan: t('nav.thongBao'), icon: 'fa-bell' },
    ...(coQuyen(toi.duLieu, 'manage_signing_process') || coQuyen(toi.duLieu, 'view_trinhky')
      ? [{ den: '/approvals/quy-trinh', nhan: t('nav.quyTrinh'), icon: 'fa-diagram-project' }] : []),
    ...(coQuyen(toi.duLieu, 'sign_trinhky') ? [{ den: '/approvals/khoa', nhan: t('nav.khoaCuaToi'), icon: 'fa-key' }] : []),
  ];

  return (
    <SigningContext.Provider value={ngu_canh}>
      <div className="w-full space-y-5 p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-sm font-bold text-primary">
                <i className="fa-solid fa-file-signature text-base" aria-hidden="true" />
              </span>
              <h1 className="m-0 text-xl font-bold text-main md:text-2xl">{t('tieuDe')}</h1>
            </div>
            <p className="m-0 text-xs text-secondary md:text-sm">{t('moTa')}</p>
          </div>
          {coQuyen(toi.duLieu, 'add_trinhky') && (
            <Button size="sm" icon="fa-plus" onClick={() => dieuHuong('/approvals/tao-moi')}>{t('nav.taoMoi')}</Button>
          )}
        </header>
        <nav className="flex flex-wrap gap-1 border-b border-border-subtle" aria-label={t('tieuDe')}>
          {tab.map((m) => (
            <NavLink key={m.den} to={m.den} end={m.end}
              className={({ isActive }) => `-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors duration-fast ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-main'}`}>
              <i className={`fa-solid ${m.icon}`} aria-hidden="true" />{m.nhan}
            </NavLink>
          ))}
        </nav>
        {toi.dangTai && !toi.duLieu && <DangTai />}
        {toi.loi && <LoiTai thongBao={loi(toi.loi)} onThuLai={toi.tai} />}
        {toi.duLieu && (
          <Suspense fallback={<DangTai />}>
            <Routes>
              <Route index element={<DanhSachPage key="can_toi_ky" hop="can_toi_ky" />} />
              <Route path="toi-gui" element={<DanhSachPage key="toi_gui" hop="toi_gui" />} />
              <Route path="tat-ca" element={<DanhSachPage key="tat_ca" hop="tat_ca" />} />
              <Route path="tao-moi" element={<TaoHoSoPage />} />
              <Route path="quy-trinh" element={<QuyTrinhPage />} />
              <Route path="khoa" element={<KhoaPage />} />
              <Route path="thong-bao" element={<ThongBaoPage />} />
              <Route path=":id" element={<ChiTietPage />} />
            </Routes>
          </Suspense>
        )}
      </div>
    </SigningContext.Provider>
  );
}
