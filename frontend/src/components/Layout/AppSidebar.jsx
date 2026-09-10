import React, { useRef, useEffect } from 'react';
import { NAV_GROUPS } from '../../utils/constants';
import { useTranslation } from '../../i18n/LanguageContext';

export default function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activePage,
  onNavigate,
}) {
  const { t } = useTranslation();
  const contentRef = useRef(null);
  const activeItemRef = useRef(null);

  // Khi thu gọn: cuộn icon Active vào giữa tầm mắt. Khi mở rộng: luôn bắt đầu trọn vẹn từ icon đầu tiên (Bàn làm việc)
  useEffect(() => {
    if (isCollapsed) {
      if (activeItemRef.current) {
        activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [isCollapsed, activePage]);

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      id="appSidebar"
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width, 84px)' : 'var(--sidebar-width, 280px)',
        transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease',
      }}
    >
      {/* Sidebar Header & Brand */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <button
            type="button"
            className="brand-icon-wrapper"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Mở rộng menu điều hướng" : "Thu gọn menu điều hướng"}
            aria-label="Thu gọn / Mở rộng menu"
          >
            <i className={`fa-solid ${isCollapsed ? 'fa-folder' : 'fa-folder-closed'}`} />
          </button>
          {!isCollapsed && (
            <div className="brand-info">
              <span className="brand-title">TLBM CORP</span>
              <span className="brand-subtitle">QLVB &amp; ĐIỀU HÀNH</span>
            </div>
          )}
        </div>

        {/* Nút đóng Sidebar trên Mobile */}
        <button
          type="button"
          className="btn-close-sidebar-mobile mobile-only"
          onClick={onCloseMobile}
          title="Đóng menu"
          style={{
            display: isMobileOpen ? 'flex' : 'none',
            background: 'var(--inset-well-bg)',
            border: 'none',
            borderRadius: '10px',
            width: '32px',
            height: '32px',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* Navigation Links */}
      <div 
        ref={contentRef}
        className="sidebar-content"
        style={{
          scrollbarWidth: isCollapsed ? 'none' : 'thin',
          msOverflowStyle: isCollapsed ? 'none' : 'auto',
          padding: isCollapsed ? 0 : undefined,
        }}
      >
        {NAV_GROUPS.map((group, gIdx) => (
          <div 
            key={gIdx} 
            className="nav-group-wrapper" 
            style={{ marginBottom: isCollapsed ? '0px' : '10px' }}
          >
            {!isCollapsed && (
              <div className="nav-section-title">{group.title}</div>
            )}
            <ul className="nav-list" style={{ listStyle: 'none', padding: 0, margin: isCollapsed ? '0' : '4px 0' }}>
              {group.items.map((item) => {
                const isActive = (item.id === 'sinh-nhat' && activePage === 'birthday') ||
                                 (item.id === 'dashboard' && activePage === 'dashboard');
                const labelText = item.id === 'sinh-nhat' 
                  ? t('nav.birthdays') 
                  : (item.id === 'dashboard' ? t('nav.dashboard') : item.label);

                return (
                  <li 
                    key={item.id} 
                    ref={isActive ? activeItemRef : null}
                    className="nav-item" 
                    style={{ 
                      marginBottom: isCollapsed ? 0 : '4px',
                      display: isCollapsed ? 'flex' : 'block',
                      justifyContent: 'center',
                      alignItems: isCollapsed ? 'center' : undefined,
                      height: isCollapsed ? 'calc((100vh - 126px) / 6)' : 'auto',
                    }}
                  >
                    <button
                      type="button"
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (item.id === 'sinh-nhat') onNavigate('birthday');
                        if (item.id === 'dashboard') onNavigate('dashboard');
                        if (isMobileOpen) onCloseMobile();
                      }}
                      title={isCollapsed ? labelText : undefined}
                      style={{
                        width: isCollapsed ? '40px' : '100%',
                        height: isCollapsed ? '40px' : 'auto',
                        minHeight: isCollapsed ? '40px' : 'auto',
                        cursor: 'pointer',
                        textAlign: isCollapsed ? 'center' : 'left',
                        fontFamily: 'inherit',
                        border: 'none',
                      }}
                    >
                      <div className="nav-link-content">
                        <i className={`fa-solid ${item.icon} menu-icon`} />
                        {!isCollapsed && (
                          <span className="nav-title-text">{labelText}</span>
                        )}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className={`nav-badge badge-${item.badgeType || 'primary'}`}>
                          {item.badge}
                        </span>
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
      <div className="sidebar-bottom-status" style={{
        padding: isCollapsed ? '12px 0' : '12px 16px',
        borderTop: '1px solid var(--liquid-glass-border-bottom)',
        background: 'var(--inset-well-bg)',
        flexShrink: 0,
        marginTop: 'auto',
      }}>
        {!isCollapsed ? (
          <div className="system-pill-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot" style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
            }} />
            <div className="status-text" style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Production 2026</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SSL Secured</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }} title="Hệ thống hoạt động ổn định">
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block',
            }} />
          </div>
        )}
      </div>
    </aside>
  );
}
