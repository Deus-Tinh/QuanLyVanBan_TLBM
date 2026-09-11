import React, { useState, useEffect } from 'react';
import NotificationStreams from '../Header/NotificationStreams';
import ThemeSelector from '../Header/ThemeSelector';
import LanguageSwitcher from '../Header/LanguageSwitcher';
import UserDropdown from '../Header/UserDropdown';
import { padZero } from '../../utils/dateFormatter';
import { useTranslation } from '../../i18n/LanguageContext';

export default function AppHeader({
  currentTheme,
  onSelectTheme,
  onToggleMobileSidebar,
  activePage = 'birthday',
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timePart = `${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`;
  const datePart = `${padZero(now.getDate())}/${padZero(now.getMonth() + 1)}/${now.getFullYear()}`;

  const pageTitle = activePage === 'dashboard'
    ? t('header.pageTitleDashboard')
    : t('header.pageTitleBirthday');

  const breadcrumbCurrent = activePage === 'dashboard'
    ? t('header.breadcrumbDashboard')
    : t('header.breadcrumbBirthday');

  return (
    <header className="app-header">
      {/* Left Side: Mobile toggle & Breadcrumb Title */}
      <div className="header-left-side">
        <button
          type="button"
          className="btn-mobile-sidebar mobile-only"
          onClick={onToggleMobileSidebar}
          title="Mở thanh điều hướng"
        >
          <i className="fa-solid fa-bars" />
        </button>

        {/* Tiêu đề ngắn gọn thương hiệu trên Mobile */}
        <span className="heading-short mobile-only">QLVB &amp; TL</span>

        <div className="page-context-title desktop-only">
          <h1 className="page-main-heading">
            <span className="heading-full">{pageTitle}</span>
          </h1>
          <div className="header-breadcrumb">
            <i className="fa-solid fa-house" />
            <span>{t('header.breadcrumbHome')}</span>
            <i className="fa-solid fa-chevron-right separator" style={{ fontSize: '0.62rem', opacity: 0.5 }} />
            <span>{t('header.breadcrumbUtilities')}</span>
            <i className="fa-solid fa-chevron-right separator" style={{ fontSize: '0.62rem', opacity: 0.5 }} />
            <span className="current" style={{ color: 'var(--color-primary, #2563eb)', fontWeight: 700 }}>
              {breadcrumbCurrent}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Clock, Streams, Language, Theme, User */}
      <div className="header-right-side">
        {/* Realtime Clock */}
        <div className="header-live-clock desktop-only" title={t('header.liveClockTitle')} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 9px',
          borderRadius: '12px',
          background: 'var(--inset-well-bg)',
          boxShadow: 'var(--inset-well-shadow)',
          border: '1px solid var(--liquid-glass-border)',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          <i className="fa-regular fa-clock" style={{ color: 'var(--color-primary, #2563eb)' }} />
          <span className="clock-digits" style={{ whiteSpace: 'nowrap' }}>
            <span>{timePart}</span>
            <span className="clock-date-part" style={{ opacity: 0.75, fontWeight: 500 }}> • {datePart}</span>
          </span>
        </div>

        {/* 3 Notification Streams */}
        <NotificationStreams />

        {/* Language Switcher (VI / EN) */}
        <LanguageSwitcher />

        {/* 4 Selectable Themes */}
        <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

        {/* User Profile */}
        <UserDropdown />
      </div>
    </header>
  );
}
