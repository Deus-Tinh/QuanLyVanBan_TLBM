import React from 'react';
import { ActivePageId } from '../../types/navigation';
import { MAIN_MODULES } from '../../utils/constants';

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
  // Phân hệ cha tương ứng với trang đang hiển thị
  const activeModule =
    MAIN_MODULES.find((mod) => mod.subItems.some((item) => item.id === activePage)) ||
    MAIN_MODULES[0];

  const currentSubItem =
    activeModule.subItems.find((item) => item.id === activePage) || activeModule.subItems[0];

  return (
    <nav
      className="top-sub-nav"
      aria-label="Điều hướng phân hệ con"
    >
      <div className="top-sub-nav-inner">
        {/* 1. Tiêu đề Phân hệ cha (Trái) */}
        <div className="top-sub-nav-module-badge">
          <div className="module-icon-box" title={`${activeModule.label} (${activeModule.teamTag})`}>
            <i className={`fa-solid ${activeModule.icon}`} />
          </div>
          <div className="module-info">
            <span className="module-name">{activeModule.label}</span>
            <span className="module-name-short">{activeModule.shortLabel || activeModule.label}</span>
            <span className="module-team-tag">{activeModule.teamTag}</span>
          </div>
          <div className="module-divider" />
        </div>

        {/* 2. Danh sách các Tab con nằm ngang (Giữa) */}
        <div className="top-sub-nav-tabs">
          {activeModule.subItems.map((sub) => {
            const isSelected = activePage === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                className={`sub-nav-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => onNavigate(sub.id)}
                title={`${sub.description || sub.label} (Bấm để ở lại trang này)`}
              >
                <i className={`fa-solid ${sub.icon} tab-icon`} />
                <span className="tab-label">{sub.label}</span>

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
          <span className="crumb-root">Hệ Thống</span>
          <i className="fa-solid fa-angle-right crumb-sep" />
          <span className="crumb-mod">{activeModule.shortLabel}</span>
          <i className="fa-solid fa-angle-right crumb-sep" />
          <span className="crumb-active">{currentSubItem?.label || 'Chi tiết'}</span>
        </div>
      </div>
    </nav>
  );
}
