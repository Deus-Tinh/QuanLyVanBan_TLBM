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
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  onNavigate?: (pageId: ActivePageId) => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
}

export default function AppHeader({
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  onToggleSidebar,
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
    <header className="h-14 px-4 bg-header border-b border-subtle flex items-center justify-between shrink-0 z-30 backdrop-blur-md transition-colors duration-normal">
      {/* 1. Left Section: 3-bar Menu Trigger - Bấm vào để Mở / Đóng cố định thanh menu */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors duration-fast cursor-pointer ${
            isSidebarOpen ? 'text-primary bg-primary-subtle' : ''
          }`}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Thu gọn thanh điều hướng (Bấm để đóng)' : 'Mở thanh điều hướng cố định (Bấm để mở)'}
          aria-label={isSidebarOpen ? 'Thu gọn thanh điều hướng' : 'Mở thanh điều hướng'}
        >
          <i className="fa-solid fa-bars text-base" />
        </button>
      </div>

      {/* 2. Right Section: Live Clock, Notifications, Theme, Language, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Đồng hồ hành chính chuẩn Thầy Duy */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-text-secondary select-none shadow-xs"
          title={t('header.clockTitle')}
        >
          <i className="fa-regular fa-clock text-primary" />
          <span className="font-mono font-semibold text-text-main text-xs">{timeString}</span>
          <span className="text-text-muted text-[11px] border-l border-subtle pl-2">{dateString}</span>
        </div>

        {/* Thông báo 3 luồng: Đến, Đi, Mật */}
        <NotificationStreams />

        {/* Đổi nhanh Theme Sáng / Tối trực tiếp 1-chạm */}
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
