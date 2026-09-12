import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { NAV_GROUPS } from '../../utils/constants';
import { ActivePageId } from '../../types/navigation';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activePage: ActivePageId;
  onNavigate: (pageId: ActivePageId) => void;
}

// Cố định số lượng icon hiển thị trong tầm nhìn luôn đúng 6 icon
const VISIBLE_COUNT = 6;
const ITEM_GAP = 6; // Khoảng cách giữa các icon (px)

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupId: group.id,
    groupTitle: group.groupTitle,
    teamTag: group.teamTag,
  }))
);

export default function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activePage,
  onNavigate,
}: AppSidebarProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [itemHeight, setItemHeight] = useState<number>(54);
  const [canScrollUp, setCanScrollUp] = useState<boolean>(false);
  const [canScrollDown, setCanScrollDown] = useState<boolean>(true);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Tính toán kích thước itemHeight tự động để luôn vừa khít đúng 6 icon dàn đều toàn bộ chiều cao thanh
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const calculateItemHeight = () => {
      const containerH = el.clientHeight;
      if (containerH > 0) {
        // Chiều cao trừ đi 5 khoảng cách (5 * ITEM_GAP), chia đều cho đúng 6 icon
        const totalGap = (VISIBLE_COUNT - 1) * ITEM_GAP;
        const calculated = Math.max(38, Math.floor((containerH - totalGap) / VISIBLE_COUNT));
        setItemHeight(calculated);
      }
    };

    calculateItemHeight();
    const ro = new ResizeObserver(calculateItemHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lắng nghe cuộn để cập nhật trạng thái các nút lướt và thanh chỉ báo vị trí mini
  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      setScrollProgress(0);
      return;
    }
    setCanScrollUp(el.scrollTop > 8);
    setCanScrollDown(el.scrollTop < maxScroll - 8);
    setScrollProgress(Math.min(1, Math.max(0, el.scrollTop / maxScroll)));
  };

  // Tự động lướt mượt đến mục Active nếu nó nằm ngoài tầm nhìn 6 icon
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const activeEl = el.querySelector(`[data-nav-id="${activePage}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePage]);

  // Nút lướt mượt lên 1 icon
  const handleScrollUp = () => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollBy({
      top: -(itemHeight + ITEM_GAP),
      behavior: 'smooth',
    });
  };

  // Nút lướt mượt xuống 1 icon
  const handleScrollDown = () => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollBy({
      top: itemHeight + ITEM_GAP,
      behavior: 'smooth',
    });
  };

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${
        isMobileOpen ? 'mobile-open' : ''
      }`}
    >
      {/* 1. Brand Logo Header */}
      <div className="sidebar-header">
        {isCollapsed && !isMobileOpen ? (
          <button
            type="button"
            className="sidebar-toggle-btn-collapsed"
            onClick={onToggleCollapse}
            title="Mở rộng menu (Nhấp để mở)"
            aria-label="Mở rộng menu"
          >
            <div className="brand-icon-box">
              <i className="fa-solid fa-file-shield brand-icon-main" />
              <i className="fa-solid fa-angles-right brand-icon-hover" />
            </div>
          </button>
        ) : (
          <>
            <div className="brand-logo">
              <div className="brand-icon-box">
                <i className="fa-solid fa-file-shield" />
              </div>
              <div className="brand-text">
                <span className="brand-title">TLBM SYSTEM</span>
                <span className="brand-subtitle">Quản Lý Văn Bản &amp; TL</span>
              </div>
            </div>

            {/* Nút thu gọn trên Desktop */}
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={onToggleCollapse}
              title="Thu gọn menu"
              aria-label="Thu gọn menu"
            >
              <i className="fa-solid fa-angles-left" />
            </button>

            {/* Nút đóng drawer trên Mobile */}
            <button
              type="button"
              className="sidebar-close-mobile-btn"
              onClick={onCloseMobile}
              title="Đóng menu điều hướng"
              aria-label="Đóng menu điều hướng"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </>
        )}
      </div>

      {/* 2. Vùng 6 Icon Dàn Đều Toàn Bộ Chiều Cao & Cuộn Tự Do Siêu Mượt */}
      <div className="sidebar-nav-container-distributed">
        {/* Nút lướt mượt lên phía trên */}
        <button
          type="button"
          className={`sidebar-nav-edge-btn top ${!canScrollUp ? 'disabled' : ''}`}
          disabled={!canScrollUp}
          onClick={handleScrollUp}
          title={canScrollUp ? 'Cuộn lên mục phía trên' : undefined}
          aria-label="Cuộn lên"
        >
          <i className="fa-solid fa-chevron-up" />
        </button>

        {/* Viewport cuộn mượt tự nhiên, bảo đảm lúc nào cũng hiển thị đúng 6 icon dàn đều */}
        <div
          ref={viewportRef}
          className="sidebar-nav-scroll-viewport"
          onScroll={handleScroll}
          style={{ gap: `${ITEM_GAP}px` }}
        >
          {ALL_NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                data-nav-id={item.id}
                type="button"
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                style={{ height: `${itemHeight}px`, minHeight: `${itemHeight}px` }}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed && !isMobileOpen ? `${item.label} (${item.teamTag})` : undefined}
              >
                <span className="nav-item-icon">
                  <i className={`fa-solid ${item.icon}`} />
                </span>

                {(!isCollapsed || isMobileOpen) && (
                  <>
                    <div className="nav-item-text-wrap">
                      <span className="nav-item-label">{item.label}</span>
                      <span className="nav-item-subtag">{item.teamTag}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`nav-item-badge ${item.badgeColor || 'blue'}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Nút lướt mượt xuống phía dưới */}
        <button
          type="button"
          className={`sidebar-nav-edge-btn bottom ${!canScrollDown ? 'disabled' : ''}`}
          disabled={!canScrollDown}
          onClick={handleScrollDown}
          title={canScrollDown ? 'Cuộn xuống mục phía dưới' : undefined}
          aria-label="Cuộn xuống"
        >
          <i className="fa-solid fa-chevron-down" />
        </button>

        {/* Thanh trượt định vị mini tinh tế ở mép phải */}
        <div className="sidebar-nav-track-mini" title="Vị trí thanh menu">
          <div
            className="sidebar-nav-thumb-mini"
            style={{
              top: `${scrollProgress * 75}%`,
            }}
          />
        </div>
      </div>

      {/* 3. Sidebar Footer */}
      {(!isCollapsed || isMobileOpen) && (
        <div className="sidebar-footer">
          <div className="sidebar-status-dot" />
          <span>Hệ thống trực tuyến v2.0 (Nhóm 1)</span>
        </div>
      )}
    </aside>
  );
}
