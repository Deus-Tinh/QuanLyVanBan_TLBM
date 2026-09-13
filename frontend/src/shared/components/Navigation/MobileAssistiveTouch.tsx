import React, { useState, useEffect, useRef } from 'react';
import { ActivePageId } from '../../types/navigation';
import { ThemeMode } from '../../types/theme';
import { MAIN_MODULES } from '../../utils/constants';

interface MobileAssistiveTouchProps {
  activePage: ActivePageId;
  onNavigate: (pageId: ActivePageId) => void;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

export default function MobileAssistiveTouch({
  activePage,
  onNavigate,
  currentTheme,
  onSelectTheme,
}: MobileAssistiveTouchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const dimTimerRef = useRef<number | null>(null);

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
    if (!isOpen) {
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
  }, [isOpen]);

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
    onSelectTheme(nextTheme);
  };

  return (
    <aside className="mobile-assistive-touch" aria-label="Phím Home ảo AssistiveTouch">
      {/* 1. NÚT HOME ẢO (AssistiveTouch FAB) */}
      <button
        type="button"
        className={`assistive-fab ${isDimmed ? 'is-dimmed' : ''} ${isOpen ? 'is-active' : ''}`}
        onClick={() => {
          setIsOpen((prev) => !prev);
          resetDimTimer();
        }}
        title="Mở menu hệ thống (AssistiveTouch)"
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
