import React from 'react';
import { NAV_GROUPS } from '../../utils/constants';

export default function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activePage,
  onNavigate,
}) {
  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width, 84px)' : 'var(--sidebar-width, 280px)',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease',
      }}
    >
      {/* Sidebar Header / Brand */}
      <div className="sidebar-brand-area">
        <div className="brand-logo-wrapper">
          <div className="brand-logo-icon">
            <i className="fa-solid fa-landmark" />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <div className="brand-title">TLBM CORP</div>
              <div className="brand-subtitle">QLVB &amp; Điều Hành</div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          className="sidebar-collapse-btn desktop-only"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`} />
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebar-close-btn mobile-only"
          onClick={onCloseMobile}
          title="Đóng menu"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="sidebar-nav-scroll">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="nav-group">
            {!isCollapsed && <div className="nav-group-title">{group.title}</div>}
            <ul className="nav-items-list">
              {group.items.map((item) => {
                const isActive = (item.id === 'sinh-nhat' && activePage === 'birthday') ||
                                 (item.id === 'dashboard' && activePage === 'dashboard');
                return (
                  <li key={item.id} className="nav-item">
                    <button
                      type="button"
                      className={`nav-link-btn ${isActive ? 'active-pill' : ''}`}
                      onClick={() => {
                        if (item.id === 'sinh-nhat') onNavigate('birthday');
                        if (item.id === 'dashboard') onNavigate('dashboard');
                        if (isMobileOpen) onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="nav-icon-box">
                        <i className={`fa-solid ${item.icon}`} />
                      </span>
                      {!isCollapsed && (
                        <>
                          <span className="nav-label-text">{item.label}</span>
                          {item.badge && (
                            <span className={`nav-badge badge-${item.badgeType || 'primary'}`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer System Status */}
      <div className="sidebar-bottom-card">
        {!isCollapsed ? (
          <div className="system-pill-info">
            <span className="live-indicator-dot" />
            <div className="status-text">
              <span className="env-tag">Máy chủ Production 2026</span>
              <span className="time-tag">Bảo mật SSL / VPN</span>
            </div>
          </div>
        ) : (
          <div className="system-pill-dot-only" title="Máy chủ Production 2026: Đang hoạt động">
            <span className="live-indicator-dot" />
          </div>
        )}
      </div>
    </aside>
  );
}
