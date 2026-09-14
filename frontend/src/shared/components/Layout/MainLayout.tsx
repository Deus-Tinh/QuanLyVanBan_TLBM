import React, { useState, useEffect } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from '../Header/AppHeader';
import ThemeSelector from '../Header/ThemeSelector';
import TopSubNav from '../Navigation/TopSubNav';
import MobileAssistiveTouch from '../Navigation/MobileAssistiveTouch';
import FloatingAIBox from '../AI/FloatingAIBox';
import AppFooter from './AppFooter';
import { ActivePageId } from '../../types/navigation';
import { ThemeMode } from '../../types/theme';
import { useTranslation } from '../../locales/i18n';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: ActivePageId;
  committedPage: ActivePageId;
  previewPage: ActivePageId | null;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
  onNavigate: (pageId: ActivePageId) => void;
  onHoverPreview: (pageId: ActivePageId) => void;
  onHoverLeave: () => void;
}

export default function MainLayout({
  children,
  activePage,
  committedPage,
  previewPage,
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  preferredLightTheme,
  preferredDarkTheme,
  onNavigate,
  onHoverPreview,
  onHoverLeave,
}: MainLayoutProps) {
  const { t } = useTranslation();
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

  // Cài đặt phím Home ảo AssistiveTouch trên thiết bị di động (mặc định tắt, bật trong cài đặt)
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
  // - Khi tiến sát mép trái (<= 24px) hoặc đang ở trong sidebar / flyout: Giữ sidebar mở
  // - Khi rời khỏi toàn bộ sidebar và menu xổ xuống: TỰ ĐỘNG THỤT VỀ (nếu không ghim click)
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
      {/* VÙNG CẢM ỨNG MÉP TRÁI: Rê chuột vào mép trái màn hình thì thanh Sidebar trượt xổ ra */}
      <div
        className="sidebar-edge-hotspot"
        onClick={() => setIsSidebarHovered((prev) => !prev)}
        onMouseEnter={() => setIsSidebarHovered(true)}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '20px',
          zIndex: 299,
          cursor: 'pointer',
        }}
        title="Rê chuột hoặc bấm vào mép trái để mở menu"
      />

      {/* Chỉ báo nhỏ ở mép trái giúp người dùng dễ dàng nhận biết vị trí thanh sidebar ẩn */}
      <div
        className="sidebar-edge-indicator"
        onClick={() => setIsSidebarHovered((prev) => !prev)}
        style={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: isSidebarHovered ? '8px' : '4px',
          height: '64px',
          borderRadius: '0 6px 6px 0',
          background: 'var(--color-primary)',
          boxShadow: '0 0 10px var(--color-primary-glow)',
          opacity: isSidebarHovered ? 0.9 : 0.45,
          zIndex: 298,
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        title="Bấm để mở menu điều hướng"
      />

      {/* Lớp phủ mờ backdrop khi menu được mở rộng */}
      {(isMobileOpen || (isSidebarHovered && typeof window !== 'undefined' && window.innerWidth <= 992)) && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => {
            setIsMobileOpen(false);
            setIsSidebarHovered(false);
          }}
          aria-label="Đóng menu điều hướng"
        />
      )}

      {/* THANH BÊN TRÁI: Bị ẩn kéo sang trái (-100%), khi rê chuột vào thì trượt xổ ra mượt mà */}
      <div
        className="sidebar-slide-wrapper"
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => {
          setIsSidebarHovered(false);
          onHoverLeave();
        }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 300,
          width: sidebarStyle === 'facebook' ? '300px' : 'auto',
          maxWidth: '85vw',
          transform: isSidebarHovered || isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease',
          boxShadow: isSidebarHovered || isMobileOpen ? '12px 0 40px rgba(0, 0, 0, 0.55)' : 'none',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          height: '100vh',
          display: 'flex',
          pointerEvents: isSidebarHovered || isMobileOpen ? 'auto' : 'none',
        }}
      >
        <AppSidebar
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => {
            setIsMobileOpen(false);
            setIsSidebarHovered(false);
          }}
          activePage={activePage}
          committedPage={committedPage}
          previewPage={previewPage}
          onNavigate={(pageId) => {
            onNavigate(pageId);
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

  // 1. Khi vào trang Trợ Lý AI: Tối giản, toàn màn hình, chỉ có nút Theme & Chat
  if (activePage === 'ai_assistant') {
    return (
      <div
        className="ai-immersive-shell"
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-app)',
          position: 'relative',
        }}
      >
        {renderSidebarElements()}

        {/* Nút chuyển chế độ Sáng / Tối duy nhất nằm gọn gàng ở góc trên bên phải màn hình */}
        <div
          className="ai-theme-floating-btn"
          style={{
            position: 'fixed',
            top: '12px',
            right: '18px',
            zIndex: 9999,
          }}
        >
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
            onToggleTheme={onToggleTheme}
            preferredLightTheme={preferredLightTheme}
            preferredDarkTheme={preferredDarkTheme}
          />
        </div>

        {/* Toàn bộ không gian màn hình dành trọn vẹn 100% tràn viền cho trang Chat AI */}
        <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 0, width: '100%', height: '100%' }}>
          {children}
        </main>

        {/* 3. Phím Home ảo AssistiveTouch dành cho thiết bị di động & điều hướng nhanh (Tùy chọn cấu hình trong Cài Đặt) */}
        {isAssistiveTouchEnabled && (
          <MobileAssistiveTouch
            activePage={activePage}
            onNavigate={onNavigate}
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
            onToggleTheme={onToggleTheme}
          />
        )}
      </div>
    );
  }

  // 2. TẤT CẢ CÁC TRANG CÒN LẠI: Thanh Sidebar bên trái cũng tự động ẩn và trượt xổ ra khi rê chuột
  return (
    <div className="app-shell" style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* Thanh điều hướng Navbar bên trái: Tự động ẩn kéo sang trái (-100%), rê chuột trượt xổ ra */}
      {renderSidebarElements()}

      {/* 2. Khung nội dung chính & Thanh Header đỉnh (Chiếm trọn vẹn 100% không gian màn hình) */}
      <div className="main-container" style={{ width: '100%', flex: 1, minWidth: 0 }}>
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
          onNavigate={onNavigate}
        />

        {/* Thanh điều hướng phân hệ phụ nằm ngang */}
        <TopSubNav
          activePage={activePage}
          isHoveredPreview={previewPage !== null}
          onNavigate={onNavigate}
        />

        {/* Viewport nội dung trang động: ổn định, êm ái, chuyên nghiệp */}
        <main className="page-viewport">
          <div className="page-content-wrapper">{children}</div>
          <AppFooter />
        </main>
      </div>

      {/* 3. Phím Home ảo AssistiveTouch dành riêng cho thiết bị di động (Tùy chọn cấu hình trong Cài Đặt) */}
      {isAssistiveTouchEnabled && (
        <MobileAssistiveTouch
          activePage={activePage}
          onNavigate={onNavigate}
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onToggleTheme={onToggleTheme}
        />
      )}

      {/* 4. Box AI Trợ Lý nổi tự do có thể kéo thả bất kỳ vị trí nào trên giao diện */}
      <FloatingAIBox onNavigate={onNavigate} />
    </div>
  );
}
