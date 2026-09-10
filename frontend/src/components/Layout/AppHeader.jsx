import React, { useState, useEffect } from 'react';
import NotificationStreams from '../Header/NotificationStreams';
import ThemeSelector from '../Header/ThemeSelector';
import UserDropdown from '../Header/UserDropdown';
import { formatDateTimeFull } from '../../utils/dateFormatter';

export default function AppHeader({
  currentTheme,
  onSelectTheme,
  onToggleMobileSidebar,
}) {
  const [currentTime, setCurrentTime] = useState(() => formatDateTimeFull(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatDateTimeFull(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="app-header">
      {/* Left Area: Mobile toggle & Breadcrumb Title */}
      <div className="header-left">
        <button
          type="button"
          className="mobile-hamburger-btn mobile-only"
          onClick={onToggleMobileSidebar}
          title="Mở thanh điều hướng"
        >
          <i className="fa-solid fa-bars" />
        </button>

        <div className="header-titles">
          <div className="header-breadcrumb">
            <i className="fa-solid fa-house" />
            <span>Trang chủ</span>
            <i className="fa-solid fa-chevron-right separator" />
            <span>Tiện ích &amp; Phúc lợi</span>
            <i className="fa-solid fa-chevron-right separator" />
            <span className="current">Phân hệ 7.2 Quản lý Sinh nhật</span>
          </div>
          <h1 className="header-page-title">
            QUẢN LÝ SINH NHẬT CÁN BỘ NHÂN VIÊN (CBNV)
          </h1>
        </div>
      </div>

      {/* Right Area: Realtime Clock, 3 Notification Streams, Theme Selector, User */}
      <div className="header-right">
        {/* Realtime Clock */}
        <div className="header-live-clock desktop-only" title="Thời gian hệ thống chuẩn">
          <i className="fa-regular fa-clock" style={{ color: '#2563eb' }} />
          <span className="clock-digits">{currentTime}</span>
        </div>

        {/* 3 Notification Streams */}
        <NotificationStreams />

        {/* 3 Selectable Themes */}
        <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

        {/* User Profile */}
        <UserDropdown />
      </div>
    </header>
  );
}
