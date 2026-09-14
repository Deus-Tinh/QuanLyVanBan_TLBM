import React, { useState } from 'react';
import { MAIN_MODULES } from '../../utils/constants';
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
}

export default function AppSidebar({
  isMobileOpen,
  onCloseMobile,
  committedPage,
  previewPage,
  onNavigate,
  onHoverPreview,
  onHoverLeave,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const [hoveredModId, setHoveredModId] = useState<string | null>(null);

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

  return (
    <aside
      className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      onMouseLeave={() => {
        setHoveredModId(null);
        onHoverLeave();
      }}
    >
      {/* 2. Dãy 6 Icon Phân Hệ Chuẩn Dock Nổi có Menu xổ xuống các mục con */}
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
