import React, { useState, useEffect } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from '../Header/AppHeader';
import AppFooter from './AppFooter';
import { ActivePageId } from '../../types/navigation';
import { ThemeMode } from '../../types/theme';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: ActivePageId;
  onNavigate: (pageId: ActivePageId) => void;
}

export default function MainLayout({
  children,
  activePage,
  onNavigate,
}: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('tlbm_theme') as ThemeMode) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tlbm_theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      {/* 1. Thanh điều hướng Navbar bên trái */}
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        activePage={activePage}
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

        {/* Viewport nội dung trang động (cuộn độc lập, Header & Sidebar cố định) */}
        <main className="page-viewport">
          <div className="page-content-wrapper">
            {children}
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
