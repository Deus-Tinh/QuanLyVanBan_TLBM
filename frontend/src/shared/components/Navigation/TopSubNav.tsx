import React from 'react';
import { ActivePageId } from '../../types/navigation';
import { MAIN_MODULES } from '../../utils/constants';
import { useTranslation } from '../../locales/i18n';

interface TopSubNavProps {
  activePage: ActivePageId;
  isHoveredPreview?: boolean;
  onNavigate: (page: ActivePageId) => void;
}

export default function TopSubNav({
  activePage,
  isHoveredPreview,
  onNavigate,
}: TopSubNavProps) {
  const { t } = useTranslation();

  // Phân hệ cha tương ứng với trang đang hiển thị
  const activeModule =
    MAIN_MODULES.find((mod) => mod.subItems.some((item) => item.id === activePage)) ||
    MAIN_MODULES[0];

  const currentSubItem =
    activeModule.subItems.find((item) => item.id === activePage) || activeModule.subItems[0];

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

  const activeModuleLabel = getModuleLabel(activeModule.id, activeModule.label);
  const activeSubLabel = getSubItemLabel(currentSubItem.id, currentSubItem.label);

  return (
    <nav
      className="top-sub-nav"
      aria-label="Điều hướng phân hệ con"
    >
      <div className="top-sub-nav-inner">
        {/* 1. Tiêu đề Phân hệ cha (Trái) */}
        <div className="top-sub-nav-module-badge">
          <div className="module-icon-box" title={`${activeModuleLabel} (${activeModule.teamTag})`}>
            <i className={`fa-solid ${activeModule.icon}`} />
          </div>
          <div className="module-info">
            <span className="module-name">{activeModuleLabel}</span>
            <span className="module-name-short">{activeModule.shortLabel || activeModuleLabel}</span>
            <span className="module-team-tag">{activeModule.teamTag}</span>
          </div>
          <div className="module-divider" />
        </div>

        {/* 2. Danh sách các Tab con nằm ngang (Giữa) */}
        <div className="top-sub-nav-tabs">
          {activeModule.subItems.map((sub) => {
            const isSelected = activePage === sub.id;
            const subLabel = getSubItemLabel(sub.id, sub.label);
            return (
              <button
                key={sub.id}
                type="button"
                className={`sub-nav-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => onNavigate(sub.id)}
                title={`${subLabel} (Bấm để ở lại trang này)`}
              >
                <i className={`fa-solid ${sub.icon} tab-icon`} />
                <span className="tab-label">{subLabel}</span>

                {sub.badge !== undefined && (
                  <span className={`tab-badge badge-${sub.badgeColor || 'blue'}`}>
                    {sub.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Breadcrumb định hướng nhanh (Phải) */}
        <div className="top-sub-nav-breadcrumb">
          <span className="crumb-root">{t('navigation.system')}</span>
          <i className="fa-solid fa-angle-right crumb-sep" />
          <span className="crumb-mod">{activeModuleLabel}</span>
          <i className="fa-solid fa-angle-right crumb-sep" />
          <span className="crumb-active">{activeSubLabel}</span>
        </div>
      </div>
    </nav>
  );
}
