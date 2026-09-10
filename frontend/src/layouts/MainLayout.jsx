/* ==========================================================================
   TLBM - MAIN LAYOUT WRAPPER (Architecture Standard)
   QuanLyVanBan_TLBM — Nhóm 1: Layout & Core Foundation
   Trưởng nhóm / PM: Châu Tuấn Kiệt
   ========================================================================== */

import React, { useState } from 'react';
import AppSidebar from '../components/Layout/AppSidebar';
import AppHeader from '../components/Layout/AppHeader';
import AppFooter from '../components/Layout/AppFooter';
import MobileOverlay from '../components/Layout/MobileOverlay';
import AIChatWidget from '../components/AI/AIChatWidget';
import { useTheme } from '../hooks/useTheme';

export default function MainLayout({
  children,
  activePage = 'birthday',
  onNavigate = () => {},
}) {
  const { theme, changeTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-layout-container">
      {/* Mobile Backdrop Overlay */}
      <MobileOverlay
        isOpen={isMobileSidebarOpen}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Sidebar Navigation */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      {/* Main App Content Viewport */}
      <div className={`app-main-viewport ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header */}
        <AppHeader
          currentTheme={theme}
          onSelectTheme={changeTheme}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="app-page-content">
          {children}
        </main>

        {/* System Footer */}
        <AppFooter />
      </div>

      {/* 3D AI Assistant Widget */}
      <AIChatWidget />
    </div>
  );
}
