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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Theo dõi vị trí con trỏ chuột toàn màn hình cho TẤT CẢ CÁC TRANG:
  useEffect(() => {
    const handlePointerTrack = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isInsideSidebar =
        target?.closest('.sidebar-slide-wrapper') !== null ||
        target?.closest('.header-menu-btn') !== null;

      const sidebarThreshold = sidebarStyle === 'facebook' ? 295 : 86;

      if (e.clientX <= 24 || isInsideSidebar) {
        setIsSidebarHovered(true);
      } else if (e.clientX > sidebarThreshold && !isInsideSidebar && !isMobileOpen) {
        setIsSidebarHovered(false);
        onHoverLeave();
      }
    };

    const handleWindowLeave = () => {
      if (!isMobileOpen) {
        setIsSidebarHovered(false);
        onHoverLeave();
      }
    };

    window.addEventListener('mousemove', handlePointerTrack);
    window.addEventListener('mouseleave', handleWindowLeave);
    window.addEventListener('blur', handleWindowLeave);

    return () => {
      window.removeEventListener('mousemove', handlePointerTrack);
      window.removeEventListener('mouseleave', handleWindowLeave);
      window.removeEventListener('blur', handleWindowLeave);
    };
  }, [onHoverLeave, isMobileOpen, sidebarStyle]);

  // Bộ phần tử Sidebar trượt ẩn/hiện dùng chung cho toàn bộ các trang
  const renderSidebarElements = () => (
    <>
      {/* VÙNG CẢM ỨNG MÉP TRÁI */}
      <div
        className="fixed left-0 top-0 bottom-0 w-5 z-[299] cursor-pointer"
        onClick={() => setIsSidebarHovered((prev) => !prev)}
        onMouseEnter={() => setIsSidebarHovered(true)}
        title="Rê chuột hoặc bấm vào mép trái để mở menu"
      />

      {/* Chỉ báo nhỏ ở mép trái */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 rounded-r-md bg-primary shadow-glow transition-all duration-fast z-[298] cursor-pointer h-16 pointer-events-auto ${
          isSidebarHovered ? 'w-2 opacity-90' : 'w-1 opacity-45'
        }`}
        onClick={() => setIsSidebarHovered((prev) => !prev)}
        title="Bấm để mở menu điều hướng"
      />

      {/* Lớp phủ mờ backdrop khi menu được mở rộng */}
      {(isMobileOpen || (isSidebarHovered && typeof window !== 'undefined' && window.innerWidth <= 992)) && (
        <div
          className="fixed inset-0 bg-backdrop backdrop-blur-sm z-[1100] cursor-pointer transition-opacity duration-normal"
          onClick={() => {
            setIsMobileOpen(false);
            setIsSidebarHovered(false);
          }}
          aria-label="Đóng menu điều hướng"
        />
      )}

      {/* THANH BÊN TRÁI: Trượt xổ ra mượt mà */}
      <div
        className={`sidebar-slide-wrapper fixed left-0 top-0 bottom-0 z-[1200] max-w-[85vw] h-screen flex border-r border-border-subtle transition-transform duration-normal ease-out ${
          sidebarStyle === 'facebook' ? 'w-[300px] bg-surface-elevated' : 'w-auto bg-sidebar'
        } ${
          isSidebarHovered || isMobileOpen
            ? 'translate-x-0 shadow-2xl pointer-events-auto'
            : '-translate-x-full pointer-events-none'
        }`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => {
          setIsSidebarHovered(false);
          onHoverLeave();
        }}
      >
        <AppSidebar
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => {
            setIsMobileOpen(false);
            setIsSidebarHovered(false);
          }}
          activePage={currentActivePage}
          committedPage={effectiveCommittedPage}
          previewPage={previewPage}
          onNavigate={(pageId) => {
            handleNavigate(pageId);
            setIsSidebarHovered(false);
            setIsMobileOpen(false);
          }}
          onHoverPreview={onHoverPreview}
          onHoverLeave={onHoverLeave}
          sidebarStyle={sidebarStyle}
          onToggleSidebarStyle={handleToggleSidebarStyle}
        />
      </div>
    </>
  );

  return (
    <div className="app-shell w-screen h-screen overflow-hidden relative flex bg-app">
      {/* Thanh điều hướng Navbar bên trái */}
      {renderSidebarElements()}

      {/* 2. Khung nội dung chính & Thanh Header đỉnh */}
      <div className="main-container w-full flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <AppHeader
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onToggleTheme={onToggleTheme}
          preferredLightTheme={preferredLightTheme}
          preferredDarkTheme={preferredDarkTheme}
          isSidebarOpen={isSidebarHovered || isMobileOpen}
          onHoverSidebar={() => {
            setIsSidebarHovered(true);
          }}
          onToggleMobileSidebar={() => {
            setIsMobileOpen((prev) => !prev);
            setIsSidebarHovered((prev) => !prev);
          }}
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

      {/* 3. Phím Home ảo AssistiveTouch dành riêng cho thiết bị di động */}
      {isAssistiveTouchEnabled && (
        <MobileAssistiveTouch
          activePage={currentActivePage}
          onNavigate={handleNavigate}
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onToggleTheme={onToggleTheme}
        />
      )}

      {/* 4. Box AI Trợ Lý nổi tự do có thể kéo thả */}
      <FloatingAIBox onNavigate={handleNavigate} />
    </div>
  );
}
