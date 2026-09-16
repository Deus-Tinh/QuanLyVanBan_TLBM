import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppHeader from '../Header/AppHeader';
import TopSubNav from '../Navigation/TopSubNav';
import MobileAssistiveTouch from '../Navigation/MobileAssistiveTouch';
import FloatingAIBox from '../AI/FloatingAIBox';
import AppFooter from './AppFooter';
import { ActivePageId } from '../../types/navigation';
import { ThemeMode } from '../../types/theme';
import { pathToPageId, pageIdToPath } from '../../utils/routes';

interface MainLayoutProps {
  children?: React.ReactNode;
  activePage?: ActivePageId;
  committedPage?: ActivePageId;
  previewPage?: ActivePageId | null;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
  onNavigate?: (pageId: ActivePageId) => void;
  onHoverPreview?: (pageId: ActivePageId) => void;
  onHoverLeave?: () => void;
}

export default function MainLayout({
  children,
  activePage,
  committedPage,
  previewPage = null,
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  preferredLightTheme,
  preferredDarkTheme,
  onNavigate,
  onHoverPreview = () => {},
  onHoverLeave = () => {},
}: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentActivePage = activePage || pathToPageId(location.pathname);
  const effectiveCommittedPage = committedPage || currentActivePage;

  const handleNavigate = (pageId: ActivePageId) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    navigate(pageIdToPath(pageId));
  };

  // Trạng thái mở/đóng Sidebar: Mặc định mở trên desktop (>= 1024px), điều khiển hoàn toàn bằng nút bấm (Click)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('tlbm_sidebar_open');
    if (saved !== null) {
      return saved === 'true';
    }
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('tlbm_sidebar_open', String(next));
      return next;
    });
  };

  // Đóng sidebar khi điều hướng trên màn hình nhỏ
  const handleItemNavigate = (pageId: ActivePageId) => {
    handleNavigate(pageId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Cài đặt phong cách thanh menu (Facebook Style vs Dock Style)
  const [sidebarStyle, setSidebarStyle] = useState<'facebook' | 'dock'>(() => {
    return (localStorage.getItem('tlbm_sidebar_style') as 'facebook' | 'dock') || 'facebook';
  });

  // Cài đặt phím Home ảo AssistiveTouch trên thiết bị di động
  const [isAssistiveTouchEnabled, setIsAssistiveTouchEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tlbm_enable_assistive_touch') === 'true';
  });

  // Lắng nghe sự thay đổi cài đặt từ SettingsPage
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const savedStyle = localStorage.getItem('tlbm_sidebar_style') as 'facebook' | 'dock';
      if (savedStyle && (savedStyle === 'facebook' || savedStyle === 'dock')) {
        setSidebarStyle(savedStyle);
      }
      const savedTouch = localStorage.getItem('tlbm_enable_assistive_touch');
      setIsAssistiveTouchEnabled(savedTouch === 'true');
    };

    window.addEventListener('tlbm_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('tlbm_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const handleToggleSidebarStyle = (style: 'facebook' | 'dock') => {
    setSidebarStyle(style);
    localStorage.setItem('tlbm_sidebar_style', style);
    window.dispatchEvent(new Event('tlbm_settings_updated'));
  };

  return (
    <div className="app-shell w-screen h-screen overflow-hidden flex bg-app relative">
      {/* 1. Lớp phủ mờ Backdrop trên Mobile / Tablet khi Sidebar mở ra */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop backdrop-blur-sm z-[1100] lg:hidden cursor-pointer transition-opacity duration-normal"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Đóng menu điều hướng"
        />
      )}

      {/* 2. Thanh điều hướng Sidebar bên trái:
             - Desktop (lg:): CỐ ĐỊNH dạng cột (Fixed column layout), đứng cạnh nội dung chính, KHÔNG che phủ dashboard!
             - Mobile (<lg:): Drawer trượt nổi xổ ra khi bấm nút hamburger.
             - Điều khiển 100% bằng nút bấm (Click), hoàn toàn KHÔNG tự bung khi rê chuột.
      */}
      <div
        className={`h-full z-[1200] lg:z-30 shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? `${
                sidebarStyle === 'facebook' ? 'w-[290px]' : 'w-18'
              } fixed lg:static inset-y-0 left-0 shadow-2xl lg:shadow-none`
            : 'w-0 -translate-x-full lg:translate-x-0 overflow-hidden pointer-events-none'
        }`}
      >
        <div
          className={`h-full overflow-hidden ${
            sidebarStyle === 'facebook' ? 'w-[290px]' : 'w-18'
          }`}
        >
          <AppSidebar
            isMobileOpen={isSidebarOpen}
            onCloseMobile={() => setIsSidebarOpen(false)}
            activePage={currentActivePage}
            committedPage={effectiveCommittedPage}
            previewPage={previewPage}
            onNavigate={handleItemNavigate}
            onHoverPreview={onHoverPreview}
            onHoverLeave={onHoverLeave}
            sidebarStyle={sidebarStyle}
            onToggleSidebarStyle={handleToggleSidebarStyle}
          />
        </div>
      </div>

      {/* 3. Khung nội dung chính & Thanh Header đỉnh */}
      <div className="main-container flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <AppHeader
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onToggleTheme={onToggleTheme}
          preferredLightTheme={preferredLightTheme}
          preferredDarkTheme={preferredDarkTheme}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onNavigate={handleNavigate}
        />

        {/* Thanh điều hướng phân hệ phụ nằm ngang */}
        <TopSubNav
          activePage={currentActivePage}
          isHoveredPreview={previewPage !== null}
          onNavigate={handleNavigate}
        />

        {/* Viewport nội dung trang động: ổn định, êm ái, chuyên nghiệp */}
        <main className="page-viewport flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-app">
          <div className="page-content-wrapper flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
            {children || <Outlet />}
          </div>
          <AppFooter />
        </main>
      </div>

      {/* 4. Phím Home ảo AssistiveTouch dành riêng cho thiết bị di động */}
      {isAssistiveTouchEnabled && (
        <MobileAssistiveTouch
          activePage={currentActivePage}
          onNavigate={handleNavigate}
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onToggleTheme={onToggleTheme}
        />
      )}

      {/* 5. Box AI Trợ Lý nổi tự do có thể kéo thả */}
      <FloatingAIBox onNavigate={handleNavigate} />
    </div>
  );
}
