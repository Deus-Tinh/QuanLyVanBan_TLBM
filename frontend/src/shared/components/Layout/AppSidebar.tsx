import React from 'react';
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

  const getModuleLabel = (modId: string, fallback: string) => {
    const key = modId === 'records_resources' ? 'records' : modId;
    return t(`navigation.${key}`) !== `navigation.${key}` ? t(`navigation.${key}`) : fallback;
  };
  return (
    <aside
      className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      onMouseLeave={onHoverLeave}
    >
      {/* Dãy 6 Icon Phân Hệ Chuẩn Dock Nổi (Xóa nền, Rê chuột tới đâu chuyển trang tới đó) */}

      {/* 2. Dãy 6 Icon Phân Hệ Chuẩn Dock Nổi (Xóa nền, Rê chuột tới đâu chuyển trang tới đó) */}
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

            return (
              <div key={mod.id} className="nav-item-wrapper">
                <button
                  type="button"
                  className={btnClasses}
                  onMouseEnter={() => onHoverPreview(mod.defaultPage)}
                  onClick={() => {
                    onNavigate(mod.defaultPage);
                    onCloseMobile();
                  }}
                  title={`${modLabel} (Rê chuột để xem trước, Bấm để ở lại trang)`}
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
