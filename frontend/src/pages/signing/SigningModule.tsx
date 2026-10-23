/**
 * Phân hệ Trình ký duyệt nội bộ (Nhóm 5, #80 mục E) dưới đường dẫn /approvals/*.
 * Tab chỉ là bộ lọc hiển thị; quyền đọc/ghi do server kiểm ở từng API.
 */
import { lazy, Suspense, useMemo } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { DangTai, LoiTai } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { coQuyen, SigningContext, useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';

const DanhSachPage = lazy(() => import('./DanhSachPage'));
const TaoHoSoPage = lazy(() => import('./TaoHoSoPage'));
const ChiTietPage = lazy(() => import('./ChiTietPage'));
const QuyTrinhPage = lazy(() => import('./QuyTrinhPage'));
const KhoaPage = lazy(() => import('./KhoaPage'));

export default function SigningModule() {
  const { t, loi } = useSigningT();
  const toi = useTai(() => signingApi.toi());
  const ngu_canh = useMemo(() => ({ toi: toi.duLieu, taiLaiToi: toi.tai }), [toi.duLieu, toi.tai]);

  const tab = [
    { den: '/approvals', nhan: t('nav.canToiKy'), icon: 'fa-pen-nib', end: true },
    { den: '/approvals/toi-gui', nhan: t('nav.toiGui'), icon: 'fa-paper-plane' },
    { den: '/approvals/tat-ca', nhan: t('nav.tatCa'), icon: 'fa-folder-open' },
    ...(coQuyen(toi.duLieu, 'add_trinhky') ? [{ den: '/approvals/tao-moi', nhan: t('nav.taoMoi'), icon: 'fa-plus' }] : []),
    ...(coQuyen(toi.duLieu, 'manage_signing_process') || coQuyen(toi.duLieu, 'view_trinhky')
      ? [{ den: '/approvals/quy-trinh', nhan: t('nav.quyTrinh'), icon: 'fa-diagram-project' }] : []),
    ...(coQuyen(toi.duLieu, 'sign_trinhky') ? [{ den: '/approvals/khoa', nhan: t('nav.khoaCuaToi'), icon: 'fa-key' }] : []),
  ];

  return (
    <SigningContext.Provider value={ngu_canh}>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-main flex items-center gap-2.5">
              <i className="fa-solid fa-file-signature text-primary" aria-hidden="true" />{t('tieuDe')}
            </h1>
            <p className="text-secondary text-sm mt-1">{t('moTa')}</p>
          </div>
        </header>
        <nav className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-px" aria-label={t('tieuDe')}>
          {tab.map((m) => (
            <NavLink key={m.den} to={m.den} end={m.end}
              className={({ isActive }) => `flex items-center gap-2.5 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
                isActive ? 'text-primary border-primary bg-primary-subtle'
                  : 'text-secondary border-transparent hover:text-main hover:bg-surface-hover'}`}>
              <i className={`fa-solid ${m.icon}`} aria-hidden="true" />{m.nhan}
            </NavLink>
          ))}
        </nav>
        {toi.dangTai && !toi.duLieu && <DangTai />}
        {toi.loi && <LoiTai thongBao={loi(toi.loi)} onThuLai={toi.tai} />}
        {toi.duLieu && (
          <Suspense fallback={<DangTai />}>
            <Routes>
              <Route index element={<DanhSachPage hop="can_toi_ky" />} />
              <Route path="toi-gui" element={<DanhSachPage hop="toi_gui" />} />
              <Route path="tat-ca" element={<DanhSachPage hop="tat_ca" />} />
              <Route path="tao-moi" element={<TaoHoSoPage />} />
              <Route path="quy-trinh" element={<QuyTrinhPage />} />
              <Route path="khoa" element={<KhoaPage />} />
              <Route path=":id" element={<ChiTietPage />} />
            </Routes>
          </Suspense>
        )}
      </div>
    </SigningContext.Provider>
  );
}
