import React, { useState, useEffect } from 'react';
import NotificationStreams from './NotificationStreams';
import ThemeSelector from './ThemeSelector';
import LanguageSwitcher from './LanguageSwitcher';
import UserDropdown from './UserDropdown';
import { useTranslation } from '../../locales/i18n';
import { ThemeMode } from '../../types/theme';
import { ActivePageId } from '../../types/navigation';

interface AppHeaderProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  onToggleMobileSidebar: () => void;
  onHoverSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigate?: (page: ActivePageId) => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
}

export default function AppHeader({
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  onToggleMobileSidebar,
  onHoverSidebar,
  isSidebarOpen,
  onNavigate,
  preferredLightTheme,
  preferredDarkTheme,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

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

  return (
    <header className="app-header">
      {/* 1. Left Section: 3-bar Menu Trigger */}
      <div className="header-left">
        <button
          type="button"
          className={`header-menu-btn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onToggleMobileSidebar}
          onMouseEnter={onHoverSidebar}
          title={t('header.menuTooltip')}
          aria-label={t('header.menuAria')}
        >
          <i className="fa-solid fa-bars" />
        </button>
      </div>

      {/* 2. Right Section: Live Clock, Notifications, Theme, Language, User */}
      <div className="header-right">
        {/* Đồng hồ hành chính chuẩn Thầy Duy */}
        <div className="live-clock-card" title={t('header.clockTitle')}>
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

        {/* Chuyển đổi ngôn ngữ Tiếng Việt / Tiếng Anh */}
        <LanguageSwitcher />

        {/* Hồ sơ cá nhân người dùng */}
        <UserDropdown onNavigate={onNavigate} />
      </div>
    </header>
  );
}
