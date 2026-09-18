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
    <header className="h-16 px-4 bg-header border-b border-subtle flex items-center justify-between shrink-0 z-30 backdrop-blur-md transition-colors duration-normal">
      {/* 1. Left Section: 3-bar Menu Trigger & Bao Long Logo */}
      <div className="flex items-center gap-3.5">
        {!isSidebarOpen && (
          <button
            type="button"
            className="header-menu-btn w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors duration-fast cursor-pointer shrink-0"
            onClick={onToggleSidebar}
            onMouseEnter={onHoverSidebar}
            title="Mở thanh điều hướng (Bấm hoặc rê chuột)"
            aria-label="Mở thanh điều hướng"
          >
            <i className="fa-solid fa-bars text-lg" />
          </button>
        )}
        <div
          className="flex items-center cursor-pointer transition-transform hover:scale-[1.03]"
          onClick={() => onNavigate?.('dashboard')}
          onMouseEnter={interfaceStyle === 'modern' ? onHoverSidebar : undefined}
          title="Bảo Long Insurance - Về Trang Chủ"
        >
          <Logo size="xl" className="h-11 sm:h-12" />
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
