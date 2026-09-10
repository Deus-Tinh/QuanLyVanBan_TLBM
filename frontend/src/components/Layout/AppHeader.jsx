import React, { useState, useEffect } from 'react';
import NotificationStreams from '../Header/NotificationStreams';
import ThemeSelector from '../Header/ThemeSelector';
import LanguageSwitcher from '../Header/LanguageSwitcher';
import UserDropdown from '../Header/UserDropdown';
import { formatDateTimeFull } from '../../utils/dateFormatter';
import { useTranslation } from '../../i18n/LanguageContext';

export default function AppHeader({
  currentTheme,
  onSelectTheme,
  onToggleMobileSidebar,
}) {
  const { t } = useTranslation();
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
            <span>{t('header.breadcrumbHome')}</span>
            <i className="fa-solid fa-chevron-right separator" />
            <span>{t('header.breadcrumbUtilities')}</span>
            <i className="fa-solid fa-chevron-right separator" />
            <span className="current">{t('header.breadcrumbBirthday')}</span>
          </div>
          <h1 className="header-page-title">
            {t('header.pageTitleBirthday')}
          </h1>
        </div>
      </div>

      {/* Right Area: Realtime Clock, 3 Notification Streams, Language Switcher, Theme Selector, User */}
      <div className="header-right">
        {/* Realtime Clock */}
        <div className="header-live-clock desktop-only" title={t('header.liveClockTitle')}>
          <i className="fa-regular fa-clock" style={{ color: 'var(--color-primary, #2563eb)' }} />
          <span className="clock-digits">{currentTime}</span>
        </div>

        {/* 3 Notification Streams */}
        <NotificationStreams />

        {/* Language Switcher (VI / EN) */}
        <LanguageSwitcher />

        {/* 3 Selectable Themes */}
        <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

        {/* User Profile */}
        <UserDropdown />
      </div>
    </header>
  );
}
