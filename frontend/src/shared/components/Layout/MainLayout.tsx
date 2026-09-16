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

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('tlbm_sidebar_open', 'false');
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('tlbm_sidebar_open', String(next));
      return next;
    });
  };

  // Điều hướng trang mà không thu menu lại theo yêu cầu
  const handleItemNavigate = (pageId: ActivePageId) => {
    handleNavigate(pageId);
  };

  // Cài đặt phím Home ảo AssistiveTouch trên thiết bị di động
  const [isAssistiveTouchEnabled, setIsAssistiveTouchEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tlbm_enable_assistive_touch') === 'true';
  });

  // Lắng nghe sự thay đổi cài đặt từ SettingsPage
  useEffect(() => {
    // Xóa bỏ cài đặt dock cũ nếu có trong localStorage
    localStorage.removeItem('tlbm_sidebar_style');

    const handleSettingsUpdate = () => {
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

  return (
    <div className="app-shell w-screen h-screen overflow-hidden flex bg-app relative">
      {/* 1. Lớp phủ mờ Backdrop trên toàn màn hình bên phải (trừ menu) khi Sidebar mở */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop backdrop-blur-sm z-[1100] cursor-pointer transition-opacity duration-300 animate-in fade-in"
          onClick={handleCloseSidebar}
          aria-label="Thu gọn menu điều hướng"
          title="Bấm vào vùng mờ bên phải để thu gọn menu"
        />
      )}

      {/* 2. Thanh điều hướng Sidebar dạng Drawer trượt từ bên trái ra:
             - Nằm đè lên lớp backdrop mờ (z-[1200] > z-[1100]) nên menu hoàn toàn rõ nét.
             - Màn hình bên phải (trừ menu) bị mờ bởi backdrop.
             - Chỉ thu menu lại khi người dùng bấm vào phần mờ bên phải.
             - Không thu menu lại khi người dùng bấm vào các mục con.
      */}
      <div
        className={`fixed inset-y-0 left-0 z-[1200] w-[290px] h-full transition-transform duration-300 ease-in-out shadow-2xl bg-surface-elevated ${
          isSidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="h-full overflow-hidden w-[290px]">
          <AppSidebar
            isMobileOpen={isSidebarOpen}
            onCloseMobile={handleCloseSidebar}
            activePage={currentActivePage}
            committedPage={effectiveCommittedPage}
            previewPage={previewPage}
            onNavigate={handleItemNavigate}
            onHoverPreview={onHoverPreview}
            onHoverLeave={onHoverLeave}
          />
        </div>
      </div>

      {/* 3. Khung nội dung chính & Thanh Header đỉnh */}
      <div className="main-container flex-1 min-w-0 flex flex-col h-full overflow-hidden w-full">
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

        {/* Thanh điều hướng phân hệ phụ nằm ngang - Ẩn khi vào trang Trợ lý AI */}
        {currentActivePage !== 'ai_assistant' && location.pathname !== '/ai-assistant' && (
          <TopSubNav
            activePage={currentActivePage}
            isHoveredPreview={previewPage !== null}
            onNavigate={handleNavigate}
          />
        )}

        {/* Viewport nội dung trang động: ổn định, êm ái, chuyên nghiệp */}
        {(() => {
          const isAiPage = currentActivePage === 'ai_assistant' || location.pathname === '/ai-assistant';
          return (
            <main className={`page-viewport flex-1 flex flex-col bg-app ${
              isAiPage ? 'overflow-hidden h-full' : 'overflow-y-auto overflow-x-hidden'
            }`}>
              <div className={`page-content-wrapper flex-1 w-full mx-auto ${
                isAiPage ? 'p-0 max-w-none h-full flex flex-col overflow-hidden' : 'p-4 sm:p-6 max-w-[1600px]'
              }`}>
                {children || <Outlet />}
              </div>
              {!isAiPage && <AppFooter />}
            </main>
          );
        })()}
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

      {/* 5. Box AI Trợ Lý nổi - Tự động ẩn khi người dùng đang ở trang Trợ lý AI toàn màn hình */}
      {currentActivePage !== 'ai_assistant' && location.pathname !== '/ai-assistant' && (
        <FloatingAIBox onNavigate={handleNavigate} />
      )}
    </div>
  );
}
