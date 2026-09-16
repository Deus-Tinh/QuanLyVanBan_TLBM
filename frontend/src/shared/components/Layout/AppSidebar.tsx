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

// Màu gradient phong cách Facebook cho từng phân hệ qua Tailwind tokens
const FB_MODULE_GRADIENTS: Record<string, { bgClass: string; icon: string }> = {
  records_resources: {
    bgClass: 'bg-fb-blue',
    icon: 'fa-folder-tree',
  },
  documents_operations: {
    bgClass: 'bg-fb-cyan',
    icon: 'fa-file-signature',
  },
  communications_notices: {
    bgClass: 'bg-fb-coral',
    icon: 'fa-bullhorn',
  },
  system_administration: {
    bgClass: 'bg-fb-amber',
    icon: 'fa-chart-pie',
  },
  workflow_tasks: {
    bgClass: 'bg-fb-violet',
    icon: 'fa-list-check',
  },
  archive_digital: {
    bgClass: 'bg-fb-pink',
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
        className="w-[300px] h-screen flex flex-col bg-surface-elevated border-r border-subtle transition-all duration-normal select-none overflow-hidden"
        aria-label="Thanh điều hướng phong cách Facebook"
      >
        {/* Phần Header Sidebar: Thẻ thông tin cá nhân (Profile Card) chuẩn Facebook */}
        <div className="p-3 border-b border-subtle flex items-center justify-between shrink-0">
          <div
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors duration-fast flex-1 min-w-0"
            onClick={() => {
              onNavigate('profile');
              onCloseMobile();
            }}
            role="button"
            tabIndex={0}
            title={t('navigation.profile') || 'Hồ sơ người dùng'}
          >
            <div className="relative w-10 h-10 shrink-0">
              <div className="w-10 h-10 rounded-full bg-surface border border-subtle flex items-center justify-center text-base shadow-xs">
                {CURRENT_USER.avatar}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="text-sm font-bold text-text-main truncate">{CURRENT_USER.fullName}</div>
              <div className="text-xs text-text-muted truncate">{CURRENT_USER.role.split('·')[0]}</div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-text-muted" />
          </div>

          {/* Nút đóng trên mobile */}
          {isMobileOpen && (
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-surface border border-subtle text-text-muted hover:text-text-main flex items-center justify-center text-xs ml-2 shrink-0"
              onClick={onCloseMobile}
              aria-label="Đóng menu"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* Nội dung danh sách điều hướng có thể cuộn */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* Phân nhóm: Danh mục phân hệ chính */}
          <div className="px-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {t('navigation.records') !== 'navigation.records' ? t('navigation.records') : 'Phân hệ quản lý'}
          </div>

          <div className="space-y-1">
            {MAIN_MODULES.map((mod) => {
              const isModActive = mod.subItems.some((s) => s.id === committedPage);
              const isModPreview =
                previewPage !== null && mod.subItems.some((s) => s.id === previewPage);
              const isExpanded = !!expandedModIds[mod.id];
              const modLabel = getModuleLabel(mod.id, mod.label);
              const styling = FB_MODULE_GRADIENTS[mod.id] || {
                bgClass: 'bg-fb-blue',
                icon: mod.icon,
              };

              const totalBadges = mod.subItems
                .map((s) => (typeof s.badge === 'number' ? s.badge : 0))
                .reduce((a, b) => a + b, 0);

              return (
                <div key={mod.id} className="rounded-xl overflow-hidden transition-colors">
                  {/* Hàng Phân Hệ chính kiểu Facebook */}
                  <div
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors duration-fast ${
                      isModActive
                        ? 'bg-primary-subtle text-primary font-semibold'
                        : isModPreview
                        ? 'bg-surface-hover text-text-main'
                        : 'hover:bg-surface-hover text-text-main'
                    }`}
                    onClick={() => {
                      toggleExpand(mod.id);
                    }}
                    onMouseEnter={() => onHoverPreview(mod.defaultPage)}
                    role="button"
                    tabIndex={0}
                    title={`${modLabel} (${isExpanded ? 'Bấm để thu gọn' : 'Bấm để xem các mục con'})`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shrink-0 shadow-xs ${styling.bgClass}`}
                    >
                      <i className={`fa-solid ${mod.icon}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">{modLabel}</span>
                        {totalBadges > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-danger text-white">
                            {totalBadges}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">{mod.teamTag}</span>
                    </div>

                    <button
                      type="button"
                      className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-text-main"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(mod.id);
                      }}
                      aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                      title={isExpanded ? 'Thu gọn các mục con' : 'Mở danh sách mục con'}
                    >
                      <i
                        className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-fast ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Danh sách mục con thả xuống dạng Accordion */}
                  {isExpanded && (
                    <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-subtle ml-6 my-1">
                      {mod.subItems.map((sub) => {
                        const isSubActive = committedPage === sub.id;
                        const isSubPreview = previewPage === sub.id;
                        const subLabel = getSubItemLabel(sub.id, sub.label);
                        const subDesc = getSubItemDesc(sub.id, sub.description);

                        return (
                          <div
                            key={sub.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors duration-fast ${
                              isSubActive
                                ? 'bg-primary text-white font-medium shadow-xs'
                                : isSubPreview
                                ? 'bg-surface-hover text-text-main'
                                : 'hover:bg-surface-hover text-text-secondary hover:text-text-main'
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
                            <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] shrink-0">
                              <i className={`fa-solid ${sub.icon}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs truncate">{subLabel}</span>
                                {sub.badge !== undefined && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                      isSubActive
                                        ? 'bg-white text-primary'
                                        : 'bg-primary-subtle text-primary'
                                    }`}
                                  >
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              {subDesc && (
                                <span
                                  className={`text-[10px] truncate block ${
                                    isSubActive ? 'text-white/80' : 'text-text-muted'
                                  }`}
                                  title={subDesc}
                                >
                                  {subDesc}
                                </span>
                              )}
                            </div>
                            {isSubActive && (
                              <i className="fa-solid fa-circle-check text-xs ml-1 text-white" />
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

          <div className="h-px bg-subtle my-2" />

          {/* Phần Lối tắt nhanh chuẩn Facebook (Shortcuts) */}
          <div className="px-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {t('settings.shortcutsTitle') || 'Lối tắt của bạn'}
          </div>

          <div className="space-y-1">
            <div
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors duration-fast ${
                committedPage === 'profile'
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'hover:bg-surface-hover text-text-main'
              }`}
              onClick={() => {
                onNavigate('profile');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div className="w-9 h-9 rounded-xl bg-shortcut-blue flex items-center justify-center text-white text-sm shrink-0 shadow-xs">
                <i className="fa-solid fa-user-gear" />
              </div>
              <span className="text-xs font-semibold truncate">
                {t('userMenu.profile') !== 'userMenu.profile' ? t('userMenu.profile') : 'Hồ sơ cá nhân'}
              </span>
            </div>

            <div
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors duration-fast ${
                committedPage === 'password_change'
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'hover:bg-surface-hover text-text-main'
              }`}
              onClick={() => {
                onNavigate('password_change');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div className="w-9 h-9 rounded-xl bg-shortcut-amber flex items-center justify-center text-white text-sm shrink-0 shadow-xs">
                <i className="fa-solid fa-key" />
              </div>
              <span className="text-xs font-semibold truncate">
                {t('userMenu.passwordChange') !== 'userMenu.passwordChange'
                  ? t('userMenu.passwordChange')
                  : 'Đổi mật khẩu'}
              </span>
            </div>

            <div
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors duration-fast ${
                committedPage === 'settings'
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'hover:bg-surface-hover text-text-main'
              }`}
              onClick={() => {
                onNavigate('settings');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div className="w-9 h-9 rounded-xl bg-shortcut-slate flex items-center justify-center text-white text-sm shrink-0 shadow-xs">
                <i className="fa-solid fa-gear" />
              </div>
              <span className="text-xs font-semibold truncate">
                {t('userMenu.settings') !== 'userMenu.settings' ? t('userMenu.settings') : 'Cài đặt hệ thống'}
              </span>
            </div>

            <div
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors duration-fast ${
                committedPage === 'ai_assistant'
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'hover:bg-surface-hover text-text-main'
              }`}
              onClick={() => {
                onNavigate('ai_assistant');
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
            >
              <div className="w-9 h-9 rounded-xl bg-shortcut-purple flex items-center justify-center text-white text-sm shrink-0 shadow-xs">
                <i className="fa-solid fa-wand-magic-sparkles" />
              </div>
              <span className="text-xs font-semibold truncate">
                {t('navigation.ai') !== 'navigation.ai' ? t('navigation.ai') : 'Trợ Lý AI TLBM'}
              </span>
            </div>
          </div>
        </div>

        {/* Chân trang Sidebar: Bộ chuyển đổi giao diện nhanh & Tình trạng hệ thống */}
        <div className="p-3 border-t border-subtle flex items-center justify-between shrink-0 bg-surface/30">
          <button
            type="button"
            className="flex items-center gap-2 text-xs text-text-muted hover:text-text-main font-medium py-1 px-2 rounded-lg hover:bg-surface-hover transition-colors"
            onClick={() => {
              if (onToggleSidebarStyle) {
                onToggleSidebarStyle('dock');
              }
            }}
            title="Chuyển sang kiểu Dock thu nhỏ tối giản"
          >
            <i className="fa-solid fa-layer-group text-primary" />
            <span>{t('settings.sidebarStyleDock') || 'Kiểu Dock'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>TLBM v2.0</span>
          </div>
        </div>
      </aside>
    );
  }

  // 2. GIAO DIỆN PHONG CÁCH DOCK THU NHỎ (COMPACT DOCK)
  return (
    <aside
      className="w-18 h-screen flex flex-col justify-between items-center py-3 bg-sidebar border-r border-subtle select-none"
      onMouseLeave={() => {
        setHoveredModId(null);
        onHoverLeave();
      }}
    >
      {/* Dãy 6 Icon Phân Hệ Chuẩn Dock Nổi có Menu xổ xuống các mục con */}
      <div className="w-full flex-1 flex flex-col items-center gap-2 overflow-y-auto py-2">
        {MAIN_MODULES.map((mod) => {
          const isCommittedActive = mod.subItems.some((item) => item.id === committedPage);
          const isPreviewHovered =
            previewPage !== null && mod.subItems.some((item) => item.id === previewPage);

          const numericBadges = mod.subItems
            .map((s) => (typeof s.badge === 'number' ? s.badge : 0))
            .reduce((a, b) => a + b, 0);

          const modLabel = getModuleLabel(mod.id, mod.label);
          const isDropdownVisible = hoveredModId === mod.id;

          return (
            <div
              key={mod.id}
              className="relative group flex items-center justify-center"
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
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-fast relative cursor-pointer ${
                  isCommittedActive
                    ? 'bg-primary text-white shadow-md'
                    : isPreviewHovered
                    ? 'bg-surface-hover text-text-main'
                    : 'text-text-secondary hover:text-text-main hover:bg-surface-hover'
                }`}
                onClick={() => {
                  onNavigate(mod.defaultPage);
                  onCloseMobile();
                  setHoveredModId(null);
                }}
                title={`${modLabel} (Rê chuột để mở danh sách mục con)`}
              >
                <i className={`fa-solid ${mod.icon} text-base`} />
                {numericBadges > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-danger text-white ring-2 ring-sidebar">
                    {numericBadges}
                  </span>
                )}
              </button>

              {/* MENU XỔ XUỐNG CÁC MỤC CON KHI RÊ CHUỘT VÀO ICON */}
              {isDropdownVisible && (
                <div
                  className="absolute left-full top-0 ml-2 w-64 rounded-xl bg-surface-elevated border border-subtle shadow-glass p-2 z-[1300] flex flex-col gap-1 animate-in fade-in duration-150"
                  role="menu"
                  aria-label={`Danh mục con của ${modLabel}`}
                >
                  <div className="px-2 py-1.5 border-b border-subtle flex items-center justify-between text-xs">
                    <span className="font-bold text-text-main">{modLabel}</span>
                    <span className="text-[10px] px-1 rounded bg-surface border border-subtle text-text-muted">
                      {mod.teamTag}
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto flex flex-col gap-0.5 pt-1">
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
                          className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors duration-fast ${
                            isSubActive
                              ? 'bg-primary text-white font-medium'
                              : isSubPreview
                              ? 'bg-surface-hover text-text-main'
                              : 'hover:bg-surface-hover text-text-secondary hover:text-text-main'
                          }`}
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
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] shrink-0">
                            <i className={`fa-solid ${sub.icon}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs truncate">{subLabel}</span>
                              {sub.badge !== undefined && (
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    isSubActive ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'
                                  }`}
                                >
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                            {subDesc && (
                              <span
                                className={`text-[10px] truncate block ${
                                  isSubActive ? 'text-white/80' : 'text-text-muted'
                                }`}
                                title={subDesc}
                              >
                                {subDesc}
                              </span>
                            )}
                          </div>
                          {isSubActive && (
                            <i className="fa-solid fa-circle-check text-xs ml-1 text-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Phía dưới cùng: Trạng thái & Nút chuyển sang kiểu Facebook */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-subtle w-full">
        <button
          type="button"
          className="w-10 h-10 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover flex items-center justify-center transition-colors cursor-pointer"
          onClick={() => {
            if (onToggleSidebarStyle) {
              onToggleSidebarStyle('facebook');
            }
          }}
          title="Chuyển sang kiểu menu Facebook"
        >
          <i className="fa-brands fa-facebook text-primary text-base" />
        </button>

        <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" title="Hệ thống trực tuyến v2.0 (Nhóm 1)" />
      </div>
    </aside>
  );
}
