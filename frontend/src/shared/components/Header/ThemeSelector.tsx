import React from 'react';
import { ThemeMode } from '../../types/theme';
import { THEME_OPTIONS, isLightThemeMode } from '../../utils/constants';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
}

export default function ThemeSelector({
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  preferredLightTheme = 'light',
  preferredDarkTheme = 'dark',
}: ThemeSelectorProps) {
  const isLight = isLightThemeMode(currentTheme);
  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];
  const lightOption = THEME_OPTIONS.find((t) => t.id === preferredLightTheme) || THEME_OPTIONS[1];
  const darkOption = THEME_OPTIONS.find((t) => t.id === preferredDarkTheme) || THEME_OPTIONS[0];

  const handleToggle = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      onSelectTheme(isLight ? preferredDarkTheme : preferredLightTheme);
    }
  };

  const nextModeName = isLight ? `Tối (${darkOption.name})` : `Sáng (${lightOption.name})`;

  return (
    <div className="theme-toggle-container">
      <button
        type="button"
        className={`header-action-btn theme-quick-toggle-btn ${isLight ? 'is-light-mode' : 'is-dark-mode'}`}
        onClick={handleToggle}
        title={`Đang hiển thị: ${activeOption.name} · Nhấp để chuyển sang Giao diện ${nextModeName}`}
        aria-label={`Chuyển sang giao diện ${nextModeName}`}
      >
        <i
          className={`fa-solid ${isLight ? 'fa-sun' : 'fa-moon'} theme-toggle-icon`}
          style={{
            color: isLight ? '#f59e0b' : '#38bdf8',
            fontSize: '1.08rem',
            filter: isLight
              ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
              : 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        {/* Điểm nhấn chế độ */}
        <span
          style={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isLight ? '#f59e0b' : '#38bdf8',
            boxShadow: isLight
              ? '0 0 6px #f59e0b'
              : '0 0 6px #38bdf8',
          }}
        />
      </button>
    </div>
  );
}
