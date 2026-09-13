import React from 'react';
import { MAIN_MODULES } from '../../utils/constants';
import { ActivePageId } from '../../types/navigation';

interface AppSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activePage: ActivePageId;
  committedPage: ActivePageId;
  hoveredPage: ActivePageId | null;
  onHoverPage: (page: ActivePageId | null) => void;
  onNavigate: (pageId: ActivePageId) => void;
}

export default function AppSidebar({
  isMobileOpen,
  onCloseMobile,
  activePage,
  committedPage,
  hoveredPage,
  onHoverPage,
  onNavigate,
}: AppSidebarProps) {
  return (
    <aside
      className={`app-sidebar collapsed ${isMobileOpen ? 'mobile-open' : ''}`}
      onMouseLeave={() => onHoverPage(null)}
    >
      {/* 1. Brand Logo Header (Icon Logo vuông vắn, độc lập) */}
      <div className="sidebar-header">
        <div
          className="sidebar-toggle-btn-collapsed"
          title="Hệ Thống Quản Lý Văn Bản & Tài Liệu Mật (TLBM)"
        >
          <div className="brand-icon-box">
            <i className="fa-solid fa-file-shield brand-icon-main" />
          </div>
        </div>

        {/* Nút đóng drawer trên Mobile nếu mở */}
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

      {/* 2. Vùng 6 Phân Hệ Lớn (Dạng Icon Riêng Biệt, Tự Phân Bổ Bố Cục Đều Dọc Màn Hình) */}
      <div className="sidebar-nav-container-distributed">
        <div className="sidebar-nav-scroll-viewport">
          {MAIN_MODULES.map((mod) => {
            // Phân hệ gốc đang được kích hoạt chính thức (committed)
            const isCommitted =
              mod.subItems.some((s) => s.id === committedPage) || mod.defaultPage === committedPage;

            // Phân hệ đang được rê chuột vào xem trước
            const isHovered = Boolean(
              hoveredPage &&
                (mod.subItems.some((s) => s.id === hoveredPage) || mod.defaultPage === hoveredPage)
            );

            // Tính tổng số lượng badge thông báo của các mục con
            const numericBadges = mod.subItems
              .map((s) => (typeof s.badge === 'number' ? s.badge : 0))
              .reduce((a, b) => a + b, 0);

            return (
              <button
                key={mod.id}
                data-module-id={mod.id}
                type="button"
                className={`nav-item-btn ${isCommitted ? 'active committed-active' : ''} ${
                  isHovered && !isCommitted ? 'hover-preview-lighter' : ''
                }`}
                onClick={() => {
                  onNavigate(mod.defaultPage);
                  onCloseMobile();
                }}
                onMouseEnter={() => onHoverPage(mod.defaultPage)}
                onMouseLeave={() => onHoverPage(null)}
                title={`${mod.label} (${mod.teamTag} • ${mod.subItems.length} mục)\n${
                  isCommitted
                    ? '• Trang đang chọn chính thức (Giữ màu gốc)'
                    : '- Rê chuột: Chuyển hẳn trang xem thử (màu nhạt hơn)\n- Rời chuột: Lập tức quay về trang gốc\n- Nhấp chuột: Ở lại trang này'
                }`}
              >
                <span className="nav-item-icon">
                  <i className={`fa-solid ${mod.icon}`} />
                  {numericBadges > 0 && (
                    <span className="nav-item-mini-badge">{numericBadges}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Phía dưới cùng: Điểm trạng thái hoạt động online mini */}
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
