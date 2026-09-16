import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const isAIPage = location.pathname === '/ai-assistant';
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/documents/incoming?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <header className="h-14 px-4 bg-header border-b border-subtle flex items-center justify-between shrink-0 z-30 backdrop-blur-md transition-colors duration-normal">
      {/* 1. Left Section: 3-bar Menu Trigger & Thanh tìm kiếm văn bản */}
      <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
        {!isSidebarOpen && (
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors duration-fast cursor-pointer shrink-0"
            onClick={onToggleSidebar}
            title="Mở thanh điều hướng (Bấm để mở)"
            aria-label="Mở thanh điều hướng"
          >
            <i className="fa-solid fa-bars text-base" />
          </button>
        )}

        {/* Thanh tìm kiếm văn bản đưa lên phần bên trái Header - Ẩn khi vào trang AI Assistant */}
        {!isAIPage && (
          <div className="relative w-full max-w-[420px] hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm văn bản đến/đi theo số ký hiệu hoặc trích yếu..."
              className="w-full pl-3.5 pr-8 py-1.5 rounded-sm border border-border-subtle bg-surface text-main text-xs focus:outline-none focus:border-[#0a3871] focus:ring-1 focus:ring-[#0a3871] transition-all placeholder:text-muted shadow-xs"
            />
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer p-0.5"
              title="Tìm kiếm"
            >
              <i className="fa-solid fa-magnifying-glass text-xs" />
            </button>
          </div>
        )}
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
