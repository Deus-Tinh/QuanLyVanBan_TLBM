import React, { useState } from 'react';
import AppSidebar from './components/Layout/AppSidebar';
import AppHeader from './components/Layout/AppHeader';
import AppFooter from './components/Layout/AppFooter';
import MobileOverlay from './components/Layout/MobileOverlay';
import AIChatWidget from './components/AI/AIChatWidget';
import BirthdayPage from './pages/BirthdayPage';
import DashboardPage from './pages/DashboardPage';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, changeTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('birthday'); // 'birthday' or 'dashboard'

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
        onNavigate={(page) => setActivePage(page)}
      />

      {/* Main App Content Body */}
      <div className={`app-main-viewport ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header */}
        <AppHeader
          currentTheme={theme}
          onSelectTheme={changeTheme}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="app-page-content">
          {activePage === 'birthday' ? (
            <BirthdayPage />
          ) : (
            <DashboardPage onNavigate={(page) => setActivePage(page)} />
          )}
        </main>

        {/* Chân trang Footer */}
        <AppFooter />
      </div>

      {/* 3D Round AI Assistant Floating Action Button */}
      <AIChatWidget />
    </div>
  );
}
