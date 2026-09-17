import React, { useState, useEffect } from 'react';
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
  onHoverPreview?: (pageId: ActivePageId) => void;
  onHoverLeave?: () => void;
  sidebarStyle?: 'facebook' | 'dock';
  onToggleSidebarStyle?: (style: 'facebook' | 'dock') => void;
}

// Màu gradient cho từng phân hệ qua Tailwind tokens
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
  onCloseMobile,
  committedPage,
  previewPage,
  onNavigate,
  onHoverPreview = () => {},
}: AppSidebarProps) {
  const { t } = useTranslation();

  // Trạng thái mở accordion của các module
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

  return (
    <aside
      className="w-[290px] h-screen flex flex-col bg-surface-elevated border-r border-subtle select-none overflow-hidden"
      aria-label="Thanh điều hướng cố định"
    >
      {/* Header Sidebar: Tiêu đề & Nút đóng menu */}
      <div className="p-3 border-b border-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 px-1">
          <i className="fa-solid fa-bars-staggered text-primary text-sm" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Menu điều hướng
          </span>
        </div>
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-surface border border-subtle text-text-muted hover:text-text-main flex items-center justify-center text-xs cursor-pointer transition-colors"
          onClick={onCloseMobile}
          aria-label="Thu gọn menu"
          title="Thu gọn menu"
        >
          <i className="fa-solid fa-xmark" />
        </button>
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
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold truncate whitespace-nowrap">{modLabel}</span>
                      {totalBadges > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-danger text-white shrink-0 whitespace-nowrap">
                          {totalBadges}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-text-main shrink-0"
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
                            // Không thu menu lại khi người dùng bấm vào mục con
                          }}
                          onMouseEnter={() => onHoverPreview(sub.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] shrink-0">
                            <i className={`fa-solid ${sub.icon}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs truncate whitespace-nowrap">{subLabel}</span>
                              {sub.badge !== undefined && (
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap ${
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
      </div>

      {/* Chân trang Sidebar: Tình trạng hệ thống */}
      <div className="p-3 border-t border-subtle flex items-center justify-between shrink-0 bg-surface/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
          <i className="fa-solid fa-shield-halved text-primary text-sm" />
          <span>TLBM System</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>Online v2.0</span>
        </div>
      </div>
    </aside>
  );
}
