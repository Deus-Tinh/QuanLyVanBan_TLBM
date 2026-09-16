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
  isHoveredPreview: _isHoveredPreview,
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
      className="h-11 px-4 bg-surface border-b border-subtle flex items-center justify-between shrink-0 overflow-x-auto select-none"
      aria-label="Điều hướng phân hệ con"
    >
      <div className="flex items-center justify-between w-full min-w-max gap-4">
        {/* 1. Tiêu đề Phân hệ cha (Trái) */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg bg-primary-subtle text-primary flex items-center justify-center text-xs shadow-sm"
            title={`${activeModuleLabel} (${activeModule.teamTag})`}
          >
            <i className={`fa-solid ${activeModule.icon}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-text-main hidden sm:inline">
              {activeModuleLabel}
            </span>
            <span className="text-xs font-semibold text-text-main sm:hidden">
              {activeModule.shortLabel || activeModuleLabel}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated border border-subtle text-text-muted font-medium">
              {activeModule.teamTag}
            </span>
          </div>
          <div className="h-4 w-px bg-subtle mx-2" />
        </div>

        {/* 2. Danh sách các Tab con nằm ngang (Giữa) */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {activeModule.subItems.map((sub) => {
            const isSelected = activePage === sub.id;
            const subLabel = getSubItemLabel(sub.id, sub.label);
            return (
              <button
                key={sub.id}
                type="button"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors duration-fast cursor-pointer ${
                  isSelected
                    ? 'bg-primary-subtle text-primary font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-text-main hover:bg-surface-hover'
                }`}
                onClick={() => onNavigate(sub.id)}
                title={`${subLabel} (Bấm để ở lại trang này)`}
              >
                <i className={`fa-solid ${sub.icon} text-xs`} />
                <span>{subLabel}</span>

                {sub.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-white">
                    {sub.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Breadcrumb định hướng nhanh (Phải) */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-text-muted">
          <span>{t('navigation.system')}</span>
          <i className="fa-solid fa-angle-right text-[10px]" />
          <span>{activeModuleLabel}</span>
          <i className="fa-solid fa-angle-right text-[10px]" />
          <span className="text-text-main font-medium">{activeSubLabel}</span>
        </div>
      </div>
    </nav>
  );
}
