import React, { useState, useEffect } from 'react';
import { MAIN_MODULES, CURRENT_USER } from '../../utils/constants';
import { ActivePageId } from '../../types/navigation';
import { useTranslation } from '../../locales/i18n';

interface AppSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activePage: ActivePageId;
  committedPage: ActivePageId;
  previewPage: ActivePageId | null;
  onNavigate: (pageId: ActivePageId) => void;
  onHoverPreview: (pageId: ActivePageId) => void;
  onHoverLeave: () => void;
  sidebarStyle?: 'facebook' | 'dock';
  onToggleSidebarStyle?: (style: 'facebook' | 'dock') => void;
}

// Màu gradient phong cách Facebook cho từng phân hệ
const FB_MODULE_GRADIENTS: Record<string, { bg: string; icon: string }> = {
  records_resources: {
    bg: 'linear-gradient(135deg, #1877f2 0%, #0d5bbd 100%)', // FB Blue
    icon: 'fa-folder-tree',
  },
  documents_operations: {
    bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', // Electric Cyan Blue
    icon: 'fa-file-signature',
  },
  communications_notices: {
    bg: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)', // Red/Coral Alert
    icon: 'fa-bullhorn',
  },
  system_administration: {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber/Orange
    icon: 'fa-chart-pie',
  },
  workflow_tasks: {
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Violet/Indigo
    icon: 'fa-list-check',
  },
  archive_digital: {
    bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink/Fuchsia
    icon: 'fa-box-archive',
  },
};

export default function AppSidebar({
  isMobileOpen,
  onCloseMobile,
  committedPage,
  previewPage,
  onNavigate,
  onHoverPreview,
  onHoverLeave,
  sidebarStyle = 'facebook',
  onToggleSidebarStyle,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const [hoveredModId, setHoveredModId] = useState<string | null>(null);

  // Trạng thái mở accordion của các module trong phong cách Facebook
  const [expandedModIds, setExpandedModIds] = useState<Record<string, boolean>>(() => {
    // Tự động mở phân hệ chứa trang đang hoạt động
    const initial: Record<string, boolean> = {};
    MAIN_MODULES.forEach((mod) => {
      if (mod.subItems.some((s) => s.id === committedPage)) {
        initial[mod.id] = true;
      }
    });
    return initial;
  });

  // Tự động mở accordion của module khi committedPage thay đổi
  useEffect(() => {
    MAIN_MODULES.forEach((mod) => {
      if (mod.subItems.some((s) => s.id === committedPage)) {
        setExpandedModIds((prev) => ({ ...prev, [mod.id]: true }));
      }
    });
  }, [committedPage]);

  const toggleExpand = (modId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedModIds((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const getModuleLabel = (modId: string, fallback: string) => {
    const key = modId === 'records_resources' ? 'records' : modId;
    return t(`navigation.${key}`) !== `navigation.${key}` ? t(`navigation.${key}`) : fallback;
  };

  const getSubItemLabel = (subId: string, fallback: string) => {
    const navKey = `navigation.${subId}`;
    const pageTitleKey = `pages.${subId}.title`;
    if (t(navKey) !== navKey) return t(navKey);
    if (t(pageTitleKey) !== pageTitleKey) return t(pageTitleKey);
    return fallback;
  };

  const getSubItemDesc = (subId: string, fallback?: string) => {
    const descKey = `pages.${subId}.desc`;
    if (t(descKey) !== descKey) return t(descKey);
    return fallback || '';
  };

  // 1. GIAO DIỆN PHONG CÁCH FACEBOOK
  if (sidebarStyle === 'facebook') {
    return (
      <aside
        className={`app-sidebar sidebar-style-facebook ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Thanh điều hướng phong cách Facebook"
      >
        {/* Phần Header Sidebar: Thẻ thông tin cá nhân (Profile Card) chuẩn Facebook */}
        <div className="fb-sidebar-header">
          <div
            className="fb-user-card"
            onClick={() => {
              onNavigate('profile');
              onCloseMobile();
            }}
            role="button"
            tabIndex={0}
            title={t('navigation.profile') || 'Hồ sơ người dùng'}
          >
            <div className="fb-user-avatar-wrap">
              <div className="fb-user-avatar">{CURRENT_USER.avatar}</div>
              <span className="fb-user-online-badge" />
            </div>
            <div className="fb-user-info">
              <div className="fb-user-name">{CURRENT_USER.fullName}</div>
              <div className="fb-user-role">{CURRENT_USER.role.split('·')[0]}</div>
            </div>
            <i className="fa-solid fa-chevron-right fb-user-card-arrow" />
          </div>

          {/* Nút đóng trên mobile */}
          {isMobileOpen && (
            <button
              type="button"
              className="fb-mobile-close-btn"
              onClick={onCloseMobile}
              aria-label="Đóng menu"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* Nội dung danh sách điều hướng có thể cuộn */}
        <div className="fb-sidebar-scrollable">
          {/* Phân nhóm: Danh mục phân hệ chính */}
          <div className="fb-section-label">
            <span>{t('navigation.records') !== 'navigation.records' ? t('navigation.records') : 'Phân hệ quản lý'}</span>
          </div>

          <div className="fb-modules-list">
            {MAIN_MODULES.map((mod) => {
              const isModActive = mod.subItems.some((s) => s.id === committedPage);
              const isModPreview =
                previewPage !== null && mod.subItems.some((s) => s.id === previewPage);
              const isExpanded = !!expandedModIds[mod.id];
              const modLabel = getModuleLabel(mod.id, mod.label);
              const styling = FB_MODULE_GRADIENTS[mod.id] || {
                bg: 'linear-gradient(135deg, #1877f2 0%, #0d5bbd 100%)',
                icon: mod.icon,
              };

              // Tổng số badge
              const totalBadges = mod.subItems
                .map((s) => (typeof s.badge === 'number' ? s.badge : 0))
                .reduce((a, b) => a + b, 0);

              return (
                <div
                  key={mod.id}
                  className={`fb-module-group ${isModActive ? 'active-group' : ''} ${
                    isExpanded ? 'expanded' : ''
                  }`}
                >
                  {/* Hàng Phân Hệ chính kiểu Facebook */}
                  <div
                    className={`fb-module-row ${isModActive ? 'active' : ''} ${
                      isModPreview && !isModActive ? 'previewing' : ''
                    }`}
                    onClick={() => {
                      // Nếu chưa mở, vừa mở rộng vừa chuyển trang mặc định
                      if (!isExpanded) {
                        toggleExpand(mod.id);
                      }
                      onNavigate(mod.defaultPage);
                      onCloseMobile();
                    }}
                    onMouseEnter={() => onHoverPreview(mod.defaultPage)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Hộp icon bo tròn rực rỡ chuẩn icon apps của FB */}
                    <div
                      className="fb-module-icon-box"
                      style={{ background: styling.bg }}
                    >
                      <i className={`fa-solid ${mod.icon}`} />
                    </div>

                    <div className="fb-module-content">
                      <div className="fb-module-title-row">
                        <span className="fb-module-title">{modLabel}</span>
                        {totalBadges > 0 && (
                          <span className="fb-badge-count">{totalBadges}</span>
                        )}
                      </div>
                      <span className="fb-module-team">{mod.teamTag}</span>
                    </div>

                    {/* Nút bấm mũi tên mở rộng / thu gọn danh mục con */}
                    <button
                      type="button"
                      className="fb-accordion-toggle-btn"
                      onClick={(e) => toggleExpand(mod.id, e)}
                      aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                      title={isExpanded ? 'Thu gọn các mục con' : 'Mở danh sách mục con'}
                    >
                      <i
                        className={`fa-solid fa-chevron-down fb-chevron-icon ${
                          isExpanded ? 'rotated' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Danh sách mục con thả xuống dạng Accordion */}
                  {isExpanded && (
                    <div className="fb-subitems-accordion">
                      {mod.subItems.map((sub) => {
                        const isSubActive = committedPage === sub.id;
                        const isSubPreview = previewPage === sub.id;
                        const subLabel = getSubItemLabel(sub.id, sub.label);
                        const subDesc = getSubItemDesc(sub.id, sub.description);

                        return (
                          <div
                            key={sub.id}
                            className={`fb-subitem-row ${isSubActive ? 'active' : ''} ${
                              isSubPreview ? 'previewing' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(sub.id);
                              onCloseMobile();
                            }}
                            onMouseEnter={() => onHoverPreview(sub.id)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="fb-subitem-indicator" />
                            <div className={`fb-subitem-mini-icon badge-${sub.badgeColor || 'blue'}`}>
                              <i className={`fa-solid ${sub.icon}`} />
                            </div>
                            <div className="fb-subitem-text">
                              <div className="fb-subitem-name-row">
                                <span className="fb-subitem-name">{subLabel}</span>
                                {sub.badge !== undefined && (
                                  <span
                                    className={`fb-subitem-badge badge-${
                                      sub.badgeColor || 'blue'
                                    }`}
                                  >
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              {subDesc && (
                                <span className="fb-subitem-desc" title={subDesc}>
                                  {subDesc}
                                </span>
                              )}
                            </div>
                            {isSubActive && (
                              <i className="fa-solid fa-circle-check fb-active-check" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="fb-divider" />

          {/* Phần Lối tắt nhanh chuẩn Facebook (Shortcuts) */}
          <div className="fb-section-label">
            <span>{t('settings.shortcutsTitle') || 'Lối tắt của bạn'}</span>
          </div>

          <div className="fb-shortcuts-list">
            {/* Lối tắt 1: Hồ sơ cá nhân */}
            <div
              className={`fb-shortcut-row ${committedPage === 'profile' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('profile');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className="fb-shortcut-icon"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
              >
                <i className="fa-solid fa-user-gear" />
              </div>
              <span className="fb-shortcut-name">
                {t('navigation.profile') || 'Hồ sơ cá nhân'}
              </span>
            </div>

            {/* Lối tắt 2: Đổi mật khẩu */}
            <div
              className={`fb-shortcut-row ${committedPage === 'password_change' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('password_change');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className="fb-shortcut-icon"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' }}
              >
                <i className="fa-solid fa-key" />
              </div>
              <span className="fb-shortcut-name">
                {t('navigation.passwordChange') || 'Đổi mật khẩu'}
              </span>
            </div>

            {/* Lối tắt 3: Cài đặt hệ thống */}
            <div
              className={`fb-shortcut-row ${committedPage === 'settings' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('settings');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className="fb-shortcut-icon"
                style={{ background: 'linear-gradient(135deg, #64748b 0%, #334155 100%)' }}
              >
                <i className="fa-solid fa-gear" />
              </div>
              <span className="fb-shortcut-name">
                {t('navigation.settings') || 'Cài đặt hệ thống'}
              </span>
            </div>

            {/* Lối tắt 4: Trợ lý AI TLBM */}
            <div
              className={`fb-shortcut-row ${committedPage === 'ai_assistant' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('ai_assistant');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className="fb-shortcut-icon"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}
              >
                <i className="fa-solid fa-wand-magic-sparkles" />
              </div>
              <span className="fb-shortcut-name">
                {t('navigation.ai') || 'Trợ Lý AI TLBM'}
              </span>
            </div>
          </div>
        </div>

        {/* Chân trang Sidebar: Bộ chuyển đổi giao diện nhanh & Tình trạng hệ thống */}
        <div className="fb-sidebar-footer">
          <button
            type="button"
            className="fb-switch-style-btn"
            onClick={() => {
              if (onToggleSidebarStyle) {
                onToggleSidebarStyle('dock');
              }
            }}
            title="Chuyển sang kiểu Dock thu nhỏ tối giản"
          >
            <i className="fa-solid fa-layer-group" />
            <span>{t('settings.sidebarStyleDock') || 'Kiểu Dock thu nhỏ'}</span>
          </button>

          <div className="fb-footer-status">
            <span className="live-status-ping" />
            <span className="fb-status-text">TLBM v2.0 · Online</span>
          </div>
        </div>
      </aside>
    );
  }

  // 2. GIAO DIỆN PHONG CÁCH DOCK THU NHỎ (COMPACT DOCK)
  return (
    <aside
      className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      onMouseLeave={() => {
        setHoveredModId(null);
        onHoverLeave();
      }}
    >
      {/* Dãy 6 Icon Phân Hệ Chuẩn Dock Nổi có Menu xổ xuống các mục con */}
      <div className="sidebar-nav-container-distributed">
        <div className="sidebar-nav-scroll-viewport">
          {MAIN_MODULES.map((mod) => {
            const isCommittedActive = mod.subItems.some((item) => item.id === committedPage);
            const isPreviewHovered =
              previewPage !== null && mod.subItems.some((item) => item.id === previewPage);

            let btnClasses = 'nav-item-btn';
            if (isCommittedActive) {
              btnClasses += ' committed-active active';
            }
            if (isPreviewHovered && !isCommittedActive) {
              btnClasses += ' hover-preview-lighter';
            }

            // Tính tổng số lượng badge thông báo
            const numericBadges = mod.subItems
              .map((s) => (typeof s.badge === 'number' ? s.badge : 0))
              .reduce((a, b) => a + b, 0);

            const modLabel = getModuleLabel(mod.id, mod.label);
            const isDropdownVisible = hoveredModId === mod.id;

            return (
              <div
                key={mod.id}
                className={`nav-item-wrapper ${isDropdownVisible ? 'has-dropdown-open' : ''}`}
                onMouseEnter={() => {
                  setHoveredModId(mod.id);
                  onHoverPreview(mod.defaultPage);
                }}
                onMouseLeave={() => {
                  setHoveredModId(null);
                }}
              >
                <button
                  type="button"
                  className={btnClasses}
                  onClick={() => {
                    onNavigate(mod.defaultPage);
                    onCloseMobile();
                    setHoveredModId(null);
                  }}
                  title={`${modLabel} (Rê chuột để mở danh sách mục con)`}
                >
                  <span className="nav-item-icon">
                    <i className={`fa-solid ${mod.icon}`} />
                    {numericBadges > 0 && (
                      <span className="nav-item-mini-badge">{numericBadges}</span>
                    )}
                  </span>
                  <span className="nav-item-mobile-label">
                    <span className="mobile-label-title">{modLabel}</span>
                    <span className="mobile-label-team">{mod.teamTag}</span>
                  </span>
                </button>

                {/* MENU XỔ XUỐNG CÁC MỤC CON KHI RÊ CHUỘT VÀO ICON */}
                <div
                  className={`nav-subitems-flyout ${isDropdownVisible ? 'visible' : ''}`}
                  role="menu"
                  aria-label={`Danh mục con của ${modLabel}`}
                >
                  <div className="flyout-header">
                    <div className="flyout-title-wrap">
                      <span className="flyout-title">{modLabel}</span>
                      <span className="flyout-team-tag">{mod.teamTag}</span>
                    </div>
                    <span className="flyout-count">
                      {mod.subItems.length} {t('common.filterAll')}
                    </span>
                  </div>

                  <div className="flyout-items-list">
                    {mod.subItems.map((sub) => {
                      const isSubActive = committedPage === sub.id;
                      const isSubPreview = previewPage === sub.id;
                      const subLabel = getSubItemLabel(sub.id, sub.label);
                      const subDesc = getSubItemDesc(sub.id, sub.description);

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          role="menuitem"
                          className={`flyout-sub-item ${isSubActive ? 'active' : ''} ${isSubPreview ? 'previewing' : ''}`}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            onHoverPreview(sub.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(sub.id);
                            onCloseMobile();
                            setHoveredModId(null);
                          }}
                        >
                          <div className={`flyout-sub-icon badge-${sub.badgeColor || 'blue'}`}>
                            <i className={`fa-solid ${sub.icon}`} />
                          </div>
                          <div className="flyout-sub-content">
                            <div className="flyout-sub-row">
                              <span className="flyout-sub-name">{subLabel}</span>
                              {sub.badge !== undefined && (
                                <span className={`flyout-sub-badge badge-${sub.badgeColor || 'blue'}`}>
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                            {subDesc && (
                              <span className="flyout-sub-desc" title={subDesc}>
                                {subDesc}
                              </span>
                            )}
                          </div>
                          {isSubActive && (
                            <i className="fa-solid fa-circle-check flyout-active-check" />
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

      {/* Phía dưới cùng: Trạng thái & Nút chuyển sang kiểu Facebook */}
      <div className="sidebar-collapsed-bottom">
        <button
          type="button"
          className="dock-switch-style-btn"
          onClick={() => {
            if (onToggleSidebarStyle) {
              onToggleSidebarStyle('facebook');
            }
          }}
          title="Chuyển sang kiểu menu Facebook"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}
        >
          <i className="fa-brands fa-facebook" style={{ color: 'var(--color-primary)' }} />
        </button>

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

