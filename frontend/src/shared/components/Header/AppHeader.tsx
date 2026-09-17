import React from 'react';
import NotificationStreams from './NotificationStreams';
import ThemeSelector from './ThemeSelector';
import LanguageSwitcher from './LanguageSwitcher';
import UserDropdown from './UserDropdown';
import { ThemeMode } from '../../types/theme';
import { ActivePageId } from '../../types/navigation';

interface AppHeaderProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  onToggleSidebar: () => void;
  onHoverSidebar?: () => void;
  isSidebarOpen?: boolean;
  interfaceStyle?: 'classic' | 'modern';
  onNavigate?: (pageId: ActivePageId) => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
}

import { Logo } from '../common/Logo';

export default function AppHeader({
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  onToggleSidebar,
  onHoverSidebar,
  isSidebarOpen,
  interfaceStyle = 'classic',
  onNavigate,
  preferredLightTheme,
  preferredDarkTheme,
}: AppHeaderProps) {
  return (
    <header className="h-14 px-4 bg-header border-b border-subtle flex items-center justify-between shrink-0 z-30 backdrop-blur-md transition-colors duration-normal">
      {/* 1. Left Section: 3-bar Menu Trigger & Bao Long Logo */}
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button
            type="button"
            className={`header-menu-btn w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors duration-fast cursor-pointer shrink-0 ${
              interfaceStyle === 'modern' ? 'lg:hidden' : ''
            }`}
            onClick={onToggleSidebar}
            onMouseEnter={onHoverSidebar}
            title="Mở thanh điều hướng (Bấm hoặc vuốt từ trái sang phải)"
            aria-label="Mở thanh điều hướng"
          >
            <i className="fa-solid fa-bars text-base" />
          </button>
        )}
        <div
          className="flex items-center cursor-pointer transition-opacity hover:opacity-85"
          onClick={() => onNavigate?.('dashboard')}
          onMouseEnter={interfaceStyle === 'modern' ? onHoverSidebar : undefined}
          title="Bảo Long Insurance - Về Trang Chủ"
        >
          <Logo size="md" />
        </div>
      </div>

      {/* 2. Right Section: Notifications, Theme, Language, User */}
      <div className="flex items-center gap-2 sm:gap-3">
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
