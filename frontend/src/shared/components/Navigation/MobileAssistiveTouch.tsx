import React, { useState, useEffect, useRef } from 'react';
import { ActivePageId } from '../../types/navigation';
import { ThemeMode } from '../../types/theme';
import { MAIN_MODULES } from '../../utils/constants';

interface MobileAssistiveTouchProps {
  activePage: ActivePageId;
  onNavigate: (pageId: ActivePageId) => void;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
}

export default function MobileAssistiveTouch({
  activePage,
  onNavigate,
  currentTheme,
  onSelectTheme,
  onToggleTheme,
}: MobileAssistiveTouchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const dimTimerRef = useRef<number | null>(null);

  // Vị trí tọa độ kéo thả tự do của nút Home ảo (lưu vào localStorage)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('tlbm_assistive_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
    hasMoved: false,
  });

  // Xác định phân hệ cha đang chứa trang hiện tại
  const activeModule =
    MAIN_MODULES.find((mod) => mod.subItems.some((item) => item.id === activePage)) ||
    MAIN_MODULES[0];

  // Cơ chế tự động mờ phím Home ảo sau 3.5s nếu không tương tác
  const resetDimTimer = () => {
    setIsDimmed(false);
    if (dimTimerRef.current) {
      window.clearTimeout(dimTimerRef.current);
    }
    if (!isOpen && !isDragging) {
      dimTimerRef.current = window.setTimeout(() => {
        setIsDimmed(true);
      }, 3500);
    }
  };

  useEffect(() => {
    resetDimTimer();

    const handleUserActivity = () => resetDimTimer();
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    return () => {
      if (dimTimerRef.current) {
        window.clearTimeout(dimTimerRef.current);
      }
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [isOpen, isDragging]);

  // Xử lý kéo thả nút Home ảo tự do trên màn hình (Touch & Mouse)
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - dragRef.current.startX;
      const deltaY = clientY - dragRef.current.startY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragRef.current.hasMoved = true;
      }

      const newX = Math.min(Math.max(8, dragRef.current.initialPosX + deltaX), window.innerWidth - 64);
      const newY = Math.min(Math.max(8, dragRef.current.initialPosY + deltaY), window.innerHeight - 64);
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (dragRef.current.hasMoved) {
        setPosition((currentPos) => {
          if (currentPos) {
            localStorage.setItem('tlbm_assistive_pos', JSON.stringify(currentPos));
          }
          return currentPos;
        });
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging]);

  // Giữ vị trí nằm trong khung hình khi đổi kích thước cửa sổ
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        return {
          x: Math.min(prev.x, window.innerWidth - 64),
          y: Math.min(prev.y, window.innerHeight - 64),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
      onSelectTheme(nextTheme);
    }
  };

  return (
    <aside className="mobile-assistive-touch" aria-label="Phím Home ảo AssistiveTouch">
      {/* 1. NÚT HOME ẢO (AssistiveTouch FAB - Kéo thả tự do như iOS) */}
      <button
        type="button"
        className={`assistive-fab ${isDimmed && !isDragging ? 'is-dimmed' : ''} ${isOpen ? 'is-active' : ''}`}
        style={
          position
            ? {
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                bottom: 'auto',
                right: 'auto',
                touchAction: 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: 10000,
              }
            : {
                position: 'fixed',
                bottom: '24px',
                right: '18px',
                touchAction: 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: 10000,
              }
        }
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialPosX: rect.left,
            initialPosY: rect.top,
            hasMoved: false,
          };
          setIsDragging(true);
          resetDimTimer();
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          dragRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            initialPosX: rect.left,
            initialPosY: rect.top,
            hasMoved: false,
          };
          setIsDragging(true);
          resetDimTimer();
        }}
        onClick={() => {
          if (!dragRef.current.hasMoved) {
            setIsOpen((prev) => !prev);
            resetDimTimer();
          }
        }}
        title="Mở menu hệ thống (AssistiveTouch) · Nhấn để mở, giữ để kéo thả"
        aria-label="Phím Home ảo"
      >
        <span className="fab-outer-ring">
          <span className="fab-inner-core">
            <span className="fab-center-dot" />
          </span>
        </span>
      </button>

      {/* 2. BẢNG ĐIỀU KHIỂN MODAL DẠNG KÍNH MỜ (Khi bung ra) */}
      {isOpen && (
        <div
          className="assistive-modal-backdrop"
          onClick={() => setIsOpen(false)}
          aria-label="Đóng menu"
        >
          <div
            className="assistive-modal-card"
            onClick={(e) => e.stopPropagation()} // Ngăn click bên trong làm đóng bảng
          >
            {/* Header nhỏ thông tin hệ thống */}
            <div className="assistive-card-header">
              <div className="assistive-header-brand">
                <div className="assistive-header-icon">
                  <i className="fa-solid fa-file-shield" />
                </div>
                <div className="assistive-header-title-box">
                  <span className="assistive-title">TLBM Mobile</span>
                  <span className="assistive-sub">Menu Hệ Thống</span>
                </div>
              </div>

              <div className="assistive-status-chip">
                <span className="status-dot" />
                <span>Trực tuyến</span>
              </div>
            </div>

            {/* Lưới 6 Phân hệ biểu tượng phong cách Apple */}
            <div className="assistive-grid">
              {MAIN_MODULES.map((mod) => {
                const isSelected = activeModule.id === mod.id;
                const numericBadges = mod.subItems
                  .map((s) => (typeof s.badge === 'number' ? s.badge : 0))
                  .reduce((a, b) => a + b, 0);

                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`assistive-grid-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onNavigate(mod.defaultPage);
                      setIsOpen(false);
                    }}
                  >
                    <div className="assistive-icon-container">
                      <i className={`fa-solid ${mod.icon}`} />
                      {numericBadges > 0 && (
                        <span className="assistive-item-badge">{numericBadges}</span>
                      )}
                    </div>
                    <span className="assistive-item-label">{mod.label}</span>
                    <span className="assistive-item-team">{mod.teamTag}</span>
                  </button>
                );
              })}
            </div>

            {/* Thanh thao tác nhanh ở đáy: Đổi Theme & Đóng nhanh */}
            <div className="assistive-footer-actions">
              <button
                type="button"
                className="assistive-action-pill"
                onClick={handleToggleTheme}
                title="Chuyển đổi giao diện Sáng / Tối"
              >
                <i
                  className={`fa-solid ${
                    currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'
                  }`}
                />
                <span>
                  {currentTheme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
                </span>
              </button>

              <button
                type="button"
                className="assistive-close-circle"
                onClick={() => setIsOpen(false)}
                title="Đóng bảng AssistiveTouch"
                aria-label="Đóng bảng"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
