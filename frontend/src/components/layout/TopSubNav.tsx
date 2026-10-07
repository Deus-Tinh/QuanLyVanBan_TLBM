import React from 'react';
import { ActivePageId } from '@app-types/navigation';
import { MAIN_MODULES } from '@lib/constants';
import { useTranslation } from '@i18n/translate';

interface TopSubNavProps {
  activePage: ActivePageId;
  isHoveredPreview?: boolean;
  onNavigate: (page: ActivePageId) => void;
}

export default function TopSubNav({
  activePage,
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

  const isAccountPage = activePage === 'password_change' || activePage === 'profile' || activePage === 'settings';
  const accountMeta: Record<string, { icon: string; title: string }> = {
    password_change: { icon: 'fa-key', title: t('passwordChange.title') },
    profile: { icon: 'fa-user-gear', title: t('profile.title') },
    settings: { icon: 'fa-gear', title: t('settings.title') },
  };

  return (
    <nav
      className="top-subnav h-11 px-4 sm:px-6 bg-app flex items-center justify-between shrink-0 overflow-x-auto select-none"
      aria-label="Điều hướng phân hệ con"
    >
      <div className="flex items-center gap-4 w-full min-w-max">
        {/* 1. Breadcrumb định hướng nhanh */}
        {isAccountPage ? (
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-xl bg-primary-subtle text-primary flex items-center justify-center text-sm shadow-2xs"
              title={accountMeta[activePage]?.title}
            >
              <i className={`fa-solid ${accountMeta[activePage]?.icon || 'fa-user'}`} />
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <button
                type="button"
                className="hover:text-primary transition-colors cursor-pointer font-medium"
                onClick={() => onNavigate('dashboard')}
              >
                {t('navigation.dashboard') || 'Trang Chủ'}
              </button>
              <i className="fa-solid fa-angle-right text-xs text-text-muted" />
              <span className="text-text-main font-bold">
                {accountMeta[activePage]?.title}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-xl bg-primary-subtle text-primary flex items-center justify-center text-sm shadow-2xs"
              title={`${activeModuleLabel} (${activeModule.teamTag})`}
            >
              <i className={`fa-solid ${activeModule.icon}`} />
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {activeModule.id === 'dashboard' ? (
                <span className="text-text-main font-bold text-sm flex items-center gap-1.5">
                  <span>{t('navigation.dashboard') || 'Trang Chủ'}</span>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className="hover:text-primary transition-colors cursor-pointer font-medium"
                    onClick={() => onNavigate('dashboard')}
                    title="Về Trang Chủ"
                  >
                    {t('navigation.dashboard') || 'Trang Chủ'}
                  </button>
                  <i className="fa-solid fa-angle-right text-xs text-text-muted" />
                  <button
                    type="button"
                    className="hover:text-primary transition-colors cursor-pointer font-medium"
                    onClick={() => onNavigate(activeModule.defaultPage)}
                    title={`Chuyển tới ${activeModuleLabel}`}
                  >
                    {activeModuleLabel}
                  </button>
                  {activeSubLabel !== activeModuleLabel && (
                    <>
                      <i className="fa-solid fa-angle-right text-xs text-text-muted" />
                      <span className="text-text-main font-bold">{activeSubLabel}</span>
                    </>
                  )}
                </>
              )}
            </div>
            {activeModule.subItems.length > 1 && (
              <div className="h-5 w-px bg-subtle mx-2" />
            )}
          </div>
        )}

        {/* 2. Danh sách các Tab con nằm ngang (Chỉ hiển thị khi phân hệ có nhiều hơn 1 mục con) */}
        {activeModule.subItems.length > 1 && (
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
        )}
      </div>
    </nav>
  );
}



