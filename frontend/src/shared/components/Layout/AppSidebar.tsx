import React from 'react';
import { MAIN_MODULES } from '../../utils/constants';
import { ActivePageId } from '../../types/navigation';

interface AppSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activePage: ActivePageId;
  onNavigate: (pageId: ActivePageId) => void;
}

export default function AppSidebar({
  isMobileOpen,
  onCloseMobile,
  activePage,
  onNavigate,
}: AppSidebarProps) {
  // Xác định phân hệ cha đang chứa trang hiện tại
  const activeModule =
    MAIN_MODULES.find((mod) => mod.subItems.some((item) => item.id === activePage)) ||
    MAIN_MODULES[0];

  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* 1. Điểm neo thương hiệu đỉnh (Logo TLBM nhỏ gọn, thanh lịch) */}
      <div className="sidebar-header">
        <div className="sidebar-brand-wrapper">
          <div
            className="sidebar-brand-box"
            title="Hệ Thống Quản Lý Văn Bản & Tài Liệu Mật (TLBM)"
          >
            <i className="fa-solid fa-file-shield" />
          </div>
          <div className="sidebar-brand-mobile-text">
            <span className="brand-title">TLBM</span>
            <span className="brand-subtitle">Quản Lý & Mật Mã</span>
          </div>
        </div>

        {/* Nút đóng drawer trên Mobile */}
        {isMobileOpen && (
          <button
            type="button"
            className="sidebar-close-mobile-btn"
            onClick={onCloseMobile}
            title="Đóng menu"
            aria-label="Đóng menu"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      {/* 2. Dãy 6 Icon Phân Hệ Chuẩn Dock Nổi (Có Menu Bay Flyout xem trước) */}
      <div className="sidebar-nav-container-distributed">
        <div className="sidebar-nav-scroll-viewport">
          {MAIN_MODULES.map((mod) => {
            const isModuleActive = activeModule.id === mod.id;

            // Tính tổng số lượng badge thông báo
            const numericBadges = mod.subItems
              .map((s) => (typeof s.badge === 'number' ? s.badge : 0))
              .reduce((a, b) => a + b, 0);

            return (
              <div key={mod.id} className="nav-item-wrapper">
                <button
                  type="button"
                  className={`nav-item-btn ${isModuleActive ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate(mod.defaultPage);
                    onCloseMobile();
                  }}
                  title={mod.label}
                >
                  <span className="nav-item-icon">
                    <i className={`fa-solid ${mod.icon}`} />
                    {numericBadges > 0 && (
                      <span className="nav-item-mini-badge">{numericBadges}</span>
                    )}
                  </span>
                  <span className="nav-item-mobile-label">
                    <span className="mobile-label-title">{mod.label}</span>
                    <span className="mobile-label-team">{mod.teamTag}</span>
                  </span>
                </button>

                {/* Menu Bay Flyout Card (Hiện mượt khi rê chuột: xem trước & bấm chọn nhanh mục con) */}
                <div className="nav-flyout-card">
                  <div className="flyout-header">
                    <span className="flyout-title">{mod.label}</span>
                    <span className="flyout-tag">{mod.teamTag}</span>
                  </div>
                  <div className="flyout-items">
                    {mod.subItems.map((sub) => {
                      const isSubActive = activePage === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          className={`flyout-sub-item ${isSubActive ? 'active' : ''}`}
                          onClick={() => {
                            onNavigate(sub.id);
                            onCloseMobile();
                          }}
                        >
                          <i className={`fa-solid ${sub.icon}`} />
                          <span className="flyout-sub-label">{sub.label}</span>
                          {sub.badge !== undefined && (
                            <span className={`flyout-badge badge-${sub.badgeColor || 'blue'}`}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Phía dưới cùng: Trạng thái trực tuyến mini */}
      <div className="sidebar-collapsed-bottom">
        <div
          className="sidebar-bottom-status-dot"
          title="Hệ thống trực tuyến v2.0 (Nhóm 1)"
        >
          <span className="live-status-ping" />
        </div>
      </div>
    </aside>
  );
}
