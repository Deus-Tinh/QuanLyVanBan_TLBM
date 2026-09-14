import React, { useState, useEffect } from 'react';
import NotificationStreams from './NotificationStreams';
import ThemeSelector from './ThemeSelector';
import UserDropdown from './UserDropdown';
import { ThemeMode } from '../../types/theme';
import { ActivePageId } from '../../types/navigation';

interface AppHeaderProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  onToggleMobileSidebar: () => void;
  onNavigate?: (page: ActivePageId) => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
}

export default function AppHeader({
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  onToggleMobileSidebar,
  onNavigate,
  preferredLightTheme,
  preferredDarkTheme,
}: AppHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Live Administrative Clock: HH:mm:ss DD/MM/YYYY
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPad = (n: number) => n.toString().padStart(2, '0');
  const timeString = `${formatPad(currentTime.getHours())}:${formatPad(
    currentTime.getMinutes()
  )}:${formatPad(currentTime.getSeconds())}`;
  const dateString = `${formatPad(currentTime.getDate())}/${formatPad(
    currentTime.getMonth() + 1
  )}/${currentTime.getFullYear()}`;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Đang tìm kiếm toàn hệ thống: "${searchQuery}"`);
    }
  };

  return (
    <header className="app-header">
      {/* 1. Left Section: Mobile toggle & Global Search */}
      <div className="header-left">

        <form className="global-search-bar" onSubmit={handleSearchSubmit}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Tìm kiếm số hiệu VB, trích yếu, công việc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* 2. Right Section: Live Clock, Notifications, Theme, User */}
      <div className="header-right">
        {/* Đồng hồ hành chính chuẩn Thầy Duy */}
        <div className="live-clock-card" title="Đồng hồ hành chính thời gian thực">
          <i className="fa-regular fa-clock" />
          <span className="clock-digits">{timeString}</span>
          <span className="clock-date">{dateString}</span>
        </div>

        {/* Thông báo 3 luồng: Đến, Đi, Mật */}
        <NotificationStreams />

        {/* Đổi nhanh Theme Sáng / Tối trực tiếp 1-chạm (Không mở popup che khuất) */}
        <ThemeSelector
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onToggleTheme={onToggleTheme}
          preferredLightTheme={preferredLightTheme}
          preferredDarkTheme={preferredDarkTheme}
        />

        {/* Hồ sơ cá nhân người dùng */}
        <UserDropdown onNavigate={onNavigate} />
      </div>
    </header>
  );
}
