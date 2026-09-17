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

  // Trạng thái mở/đóng Sidebar: Mặc định mở trên desktop (>= 1024px)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('tlbm_sidebar_open');
    if (saved !== null) {
      return saved === 'true';
    }
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  // Trạng thái rê chuột mở sidebar (Chỉ áp dụng ở Giao diện Hiện đại)
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);

  // Phong cách giao diện: 'classic' | 'modern'
  const [interfaceStyle, setInterfaceStyle] = useState<'classic' | 'modern'>(() => {
    return (localStorage.getItem('tlbm_interface_style') as 'classic' | 'modern') || 'classic';
  });

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setIsSidebarHovered(false);
    localStorage.setItem('tlbm_sidebar_open', 'false');
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('tlbm_sidebar_open', String(next));
      return next;
    });
  };

  // Điều hướng trang và thu gọn thanh menu, đảm bảo không lưu lại lớp phủ mờ trên màn hình
  const handleItemNavigate = (pageId: ActivePageId) => {
    handleNavigate(pageId);
    handleCloseSidebar();
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
      const savedStyle = (localStorage.getItem('tlbm_interface_style') as 'classic' | 'modern') || 'classic';
      setInterfaceStyle(savedStyle);
      document.documentElement.setAttribute('data-ui-style', savedStyle);
    };

    handleSettingsUpdate();

    window.addEventListener('tlbm_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('tlbm_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  // CHỈ Ở GIAO DIỆN HIỆN ĐẠI: Rê chuột sang mép trái (<= 24px) thì menu trượt xổ ra, rê chuột ra ngoài thì thu lại
  useEffect(() => {
    if (interfaceStyle !== 'modern') {
      return;
    }

    const handlePointerTrack = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isInsideSidebar =
        target?.closest('.sidebar-slide-wrapper') !== null ||
        target?.closest('.header-menu-btn') !== null;

      const sidebarThreshold = 300;

      // Rê chuột sát mép trái (<= 24px) hoặc bên trong sidebar -> Mở menu
      if (e.clientX <= 24 || isInsideSidebar) {
        setIsSidebarHovered(true);
      } else if (e.clientX > sidebarThreshold && !isInsideSidebar && !isSidebarOpen) {
        // Khi rê chuột ra ngoài khu vực menu sang bên phải -> Thu menu lại
        setIsSidebarHovered(false);
        onHoverLeave();
      }
    };

    const handleWindowLeave = () => {
      if (!isSidebarOpen) {
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
  }, [interfaceStyle, isSidebarOpen, onHoverLeave]);

  const isEffectiveSidebarOpen = isSidebarOpen || (interfaceStyle === 'modern' && isSidebarHovered);

  // CỬ CHỈ VUỐT TRÊN THIẾT BỊ DI ĐỘNG (MOBILE SWIPE GESTURES):
  // - Khi ở chế độ phone/di động: vuốt từ trái sang phải để mở menu điều hướng
  // - Khi menu đang mở: vuốt từ phải sang trái để thu gọn menu
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTrackingTouch = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isTrackingTouch = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTrackingTouch || e.changedTouches.length !== 1) return;
      isTrackingTouch = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const duration = Date.now() - touchStartTime;

      // Giới hạn thời gian vuốt trong 600ms để đảm bảo cử chỉ dứt khoát
      if (duration > 600) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Thao tác vuốt ngang rõ rệt: khoảng cách ngang tối thiểu 40px và áp đảo hướng dọc
      if (absX >= 40 && absX > absY * 1.2) {
        // TRƯỜNG HỢP 1: Menu đang đóng -> Vuốt từ trái sang phải (deltaX > 0)
        // Bắt đầu từ nửa trái màn hình (hoặc mép trái <= 150px)
        if (!isEffectiveSidebarOpen && deltaX > 0) {
          const maxLeftStart = Math.max(120, window.innerWidth * 0.5);
          if (touchStartX <= maxLeftStart) {
            setIsSidebarOpen(true);
            localStorage.setItem('tlbm_sidebar_open', 'true');
          }
        }
        // TRƯỜNG HỢP 2: Menu đang mở -> Vuốt từ phải sang trái (deltaX < 0) để thu gọn menu
        else if (isEffectiveSidebarOpen && deltaX < 0) {
          handleCloseSidebar();
        }
      }
    };

    const handleTouchCancel = () => {
      isTrackingTouch = false;
    };

    // Hỗ trợ kiểm thử trên trình duyệt desktop ở kích thước màn hình nhỏ (< 1024px)
    let mouseStartX = 0;
    let mouseStartY = 0;
    let isMouseTracking = false;

    const handleMouseDown = (e: MouseEvent) => {
      if (window.innerWidth >= 1024) return;
      if (!isEffectiveSidebarOpen && e.clientX <= 40) {
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        isMouseTracking = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseTracking) return;
      isMouseTracking = false;
      const deltaX = e.clientX - mouseStartX;
      const deltaY = e.clientY - mouseStartY;
      if (deltaX >= 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        setIsSidebarOpen(true);
        localStorage.setItem('tlbm_sidebar_open', 'true');
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEffectiveSidebarOpen]);

  return (
    <div className="app-shell w-screen h-screen overflow-hidden flex bg-app relative">
      {/* Vùng cảm ứng mép trái dành riêng cho Giao diện Hiện đại */}
      {interfaceStyle === 'modern' && (
        <>
          <div
            className="fixed left-0 top-0 bottom-0 w-6 z-[299] cursor-pointer"
            onMouseEnter={() => setIsSidebarHovered(true)}
            title="Rê chuột sang mép trái để mở menu"
          />
          <div
            className={`fixed left-0 top-1/2 -translate-y-1/2 rounded-r-md bg-primary shadow-glow transition-all duration-fast z-[298] cursor-pointer h-16 pointer-events-auto ${
              isEffectiveSidebarOpen ? 'w-2 opacity-90' : 'w-1 opacity-45'
            }`}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onClick={handleToggleSidebar}
            title="Rê chuột sang mép trái để mở menu"
          />
        </>
      )}

      {/* 1. Lớp phủ Backdrop trong suốt/nhẹ trên màn hình bên phải khi Sidebar mở - Không dùng backdrop-blur để không gây mờ màn hình */}
      {isEffectiveSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-[1100] cursor-pointer transition-opacity duration-300 animate-in fade-in"
          onClick={handleCloseSidebar}
          aria-label="Thu gọn menu điều hướng"
          title="Bấm vào bên ngoài để thu gọn menu"
        />
      )}

      {/* 2. Thanh điều hướng Sidebar dạng Drawer trượt từ bên trái ra */}
      <div
        className={`sidebar-slide-wrapper fixed inset-y-0 left-0 z-[1200] w-[290px] h-full transition-transform duration-300 ease-in-out shadow-2xl bg-surface-elevated ${
          isEffectiveSidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
        onMouseEnter={() => {
          if (interfaceStyle === 'modern') {
            setIsSidebarHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (interfaceStyle === 'modern' && !isSidebarOpen) {
            setIsSidebarHovered(false);
            onHoverLeave();
          }
        }}
      >
        <div className="h-full overflow-hidden w-[290px]">
          <AppSidebar
            isMobileOpen={isEffectiveSidebarOpen}
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
          isSidebarOpen={isEffectiveSidebarOpen}
          interfaceStyle={interfaceStyle}
          onToggleSidebar={handleToggleSidebar}
          onHoverSidebar={() => {
            if (interfaceStyle === 'modern') {
              setIsSidebarHovered(true);
            }
          }}
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
