import React, { useState, useEffect } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from '../Header/AppHeader';
import TopSubNav from '../Navigation/TopSubNav';
import AppFooter from './AppFooter';
import { ActivePageId } from '../../types/navigation';
import { ThemeMode } from '../../types/theme';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: ActivePageId;
  committedPage: ActivePageId;
  hoveredPage: ActivePageId | null;
  onHoverPage: (page: ActivePageId | null) => void;
  onNavigate: (pageId: ActivePageId) => void;
}

export default function MainLayout({
  children,
  activePage,
  committedPage,
  hoveredPage,
  onHoverPage,
  onNavigate,
}: MainLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('tlbm_theme') as ThemeMode) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tlbm_theme', theme);
  }, [theme]);

  // Tự động đóng mobile drawer nếu chuyển sang màn hình desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-shell">
      {/* Lớp phủ mờ backdrop trên thiết bị di động */}
      {isMobileOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Đóng menu điều hướng"
        />
      )}

      {/* 1. Thanh điều hướng Navbar bên trái: Rê chuột chuyển hẳn sang trang tương ứng, rời chuột lập tức quay về */}
      <AppSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        activePage={activePage}
        committedPage={committedPage}
        hoveredPage={hoveredPage}
        onHoverPage={onHoverPage}
        onNavigate={onNavigate}
      />

      {/* 2. Khung nội dung chính & Thanh Header đỉnh */}
      <div className="main-container">
        <AppHeader
          currentTheme={theme}
          onSelectTheme={setTheme}
          onToggleMobileSidebar={() => setIsMobileOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Thanh điều hướng phân hệ phụ nằm ngang */}
        <TopSubNav
          activePage={activePage}
          isHoveredPreview={Boolean(hoveredPage)}
          onNavigate={onNavigate}
        />

        {/* Viewport nội dung trang động: Hiển thị trọn vẹn trang tương ứng khi rê chuột */}
        <main className={`page-viewport ${hoveredPage ? 'is-page-previewing' : ''}`}>
          <div className="page-content-wrapper">{children}</div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
