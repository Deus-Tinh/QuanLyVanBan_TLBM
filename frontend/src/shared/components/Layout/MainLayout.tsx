import React, { useState, useEffect, useRef } from 'react';
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

  // Trạng thái mở/đóng Sidebar: Mặc định ở dạng thanh Icon Rail thu gọn 72px (hiển thị đầy đủ icon phân bổ đều, không tự xổ khi rê chuột)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('tlbm_sidebar_open_v2');
    if (saved !== null) {
      return saved === 'true';
    }
    return false;
  });

  // Trạng thái Ghim cố định Sidebar trên Desktop (không bị backdrop che khuất, làm việc liên tục)
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    const saved = localStorage.getItem('tlbm_sidebar_pinned');
    return saved === 'true';
  });

  const handleTogglePinSidebar = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem('tlbm_sidebar_pinned', String(next));
      if (next) {
        setIsSidebarOpen(true);
        localStorage.setItem('tlbm_sidebar_open_v2', 'true');
      }
      return next;
    });
  };

  // Phong cách giao diện: 'classic' | 'modern' (Mặc định Hiện đại Glassmorphism)
  const [interfaceStyle, setInterfaceStyle] = useState<'classic' | 'modern'>(() => {
    return (localStorage.getItem('tlbm_interface_style') as 'classic' | 'modern') || 'modern';
  });

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('tlbm_sidebar_open_v2', 'false');
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
    localStorage.setItem('tlbm_sidebar_open_v2', 'true');
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('tlbm_sidebar_open_v2', String(next));
      return next;
    });
  };

  // Trạng thái hover để mở rộng thanh Sidebar tự động khi rê chuột
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSidebarMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  const handleSidebarMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
    }
    hoverLeaveTimerRef.current = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
      }
    };
  }, []);

  // Điều hướng trang: Tự động đóng trạng thái hover và đóng sidebar nếu chưa ghim
  const handleItemNavigate = (pageId: ActivePageId) => {
    handleNavigate(pageId);
    setIsSidebarHovered(false);
    if (!isSidebarPinned || (typeof window !== 'undefined' && window.innerWidth < 1024)) {
      handleCloseSidebar();
    }
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
      const savedStyle = (localStorage.getItem('tlbm_interface_style') as 'classic' | 'modern') || 'modern';
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

  // Menu hiển thị mở rộng khi: đã ghim, hoặc người dùng chủ động mở, hoặc đang rê chuột vào
  const isEffectiveSidebarOpen = isSidebarPinned || isSidebarOpen || isSidebarHovered;

  // Cảm biến rê chuột mép trái màn hình lớn (Desktop): Rê sát mép trái (<= 24px) tự động trượt mở siêu mượt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      if (!isEffectiveSidebarOpen && e.clientX <= 24) {
        handleSidebarMouseEnter();
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [isEffectiveSidebarOpen]);

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
    <div
      className="app-shell w-screen h-screen overflow-hidden flex relative bg-app"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* 1. Lớp phủ Backdrop trong suốt/nhẹ: Chỉ hiển thị khi menu mở dạng drawer tạm thời (chưa ghim) */}
      {isEffectiveSidebarOpen && (!isSidebarPinned || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
        <div
          className="fixed inset-0 bg-black/15 z-[1100] cursor-pointer transition-opacity duration-300 animate-in fade-in"
          onClick={handleCloseSidebar}
          aria-label="Thu gọn menu điều hướng"
          title="Bấm vào bên ngoài để thu gọn menu"
        />
      )}

      {/* Vùng cảm ứng mép trái màn hình: Mở rộng vùng chạm (24px) kèm vạch chỉ báo viền mờ tinh tế */}
      {!isEffectiveSidebarOpen && (
        <div
          className="fixed inset-y-0 left-0 w-6 z-[1150] pointer-events-auto cursor-pointer group"
          onMouseEnter={handleSidebarMouseEnter}
          aria-label="Rê chuột để mở menu điều hướng"
        >
          {/* Vạch phát sáng nhẹ báo hiệu chạm mép trái */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-24 rounded-r-full bg-primary/30 group-hover:bg-primary group-hover:w-2 transition-all duration-300 shadow-xs" />
        </div>
      )}

      {/* 2. Thanh điều hướng Sidebar: Trượt êm bằng đường cong gia tốc Deceleration Curve (cubic-bezier) */}
      <div
        className={`sidebar-slide-wrapper fixed inset-y-0 left-0 z-[1200] h-full transform-gpu bg-surface-elevated border-r border-subtle ${
          isEffectiveSidebarOpen
            ? 'w-[290px] translate-x-0 pointer-events-auto shadow-2xl'
            : 'w-[290px] -translate-x-full pointer-events-none'
        }`}
        style={{
          transition: 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
          willChange: 'transform',
        }}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <div className="h-full overflow-hidden w-full">
          <AppSidebar
            isMobileOpen={isEffectiveSidebarOpen}
            onCloseMobile={handleCloseSidebar}
            activePage={currentActivePage}
            committedPage={effectiveCommittedPage}
            previewPage={previewPage}
            onNavigate={handleItemNavigate}
            onHoverPreview={onHoverPreview}
            onHoverLeave={onHoverLeave}
            isCollapsed={false}
            onExpandSidebar={handleOpenSidebar}
            isPinned={isSidebarPinned}
            onTogglePin={handleTogglePinSidebar}
          />
        </div>
      </div>

      {/* 3. Khung nội dung chính & Thanh Header đỉnh - Toàn màn hình khi thanh đóng */}
      <div
        className={`main-container flex-1 min-w-0 flex flex-col h-full overflow-hidden w-full ${
          isSidebarPinned && isEffectiveSidebarOpen ? 'lg:pl-[290px]' : 'pl-0'
        }`}
        style={{
          transition: 'padding-left 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <AppHeader
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onToggleTheme={onToggleTheme}
          preferredLightTheme={preferredLightTheme}
          preferredDarkTheme={preferredDarkTheme}
          isSidebarOpen={isEffectiveSidebarOpen}
          interfaceStyle={interfaceStyle}
          onToggleSidebar={handleToggleSidebar}
          onHoverSidebar={handleSidebarMouseEnter}
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
