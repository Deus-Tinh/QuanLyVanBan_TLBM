import React, { useState, useRef, useEffect } from 'react';
import { CURRENT_USER } from '../../utils/constants';
import { ActivePageId } from '../../types/navigation';
import { useTranslation } from '../../locales/i18n';

interface UserDropdownProps {
  onNavigate?: (page: ActivePageId) => void;
}

export default function UserDropdown({ onNavigate }: UserDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleItemClick = (pageId: ActivePageId) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(pageId);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="user-pill-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Hồ sơ người dùng"
        aria-label="Hồ sơ người dùng"
      >
        <div className="user-avatar-circle">{CURRENT_USER.avatar}</div>
        <div className="user-meta-info">
          <span className="user-name-label">{CURRENT_USER.fullName}</span>
          <span className="user-role-label">{t('userMenu.role')}</span>
        </div>
        <i
          className="fa-solid fa-chevron-down"
          style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="dropdown-mobile-backdrop"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10000,
              background: 'var(--bg-backdrop, rgba(0, 0, 0, 0.35))',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
          <div className="dropdown-menu-wrapper user-dropdown-panel" style={{ zIndex: 10001 }}>
          <div className="user-panel-header">
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{CURRENT_USER.fullName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {CURRENT_USER.email}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                marginTop: '4px',
              }}
            >
              {CURRENT_USER.team}
            </div>
          </div>

          <div className="user-panel-menu">
            <button
              type="button"
              className="user-menu-link"
              onClick={() => handleItemClick('profile')}
            >
              <i className="fa-regular fa-user" />
              <span>{t('userMenu.profile')}</span>
            </button>
            <button
              type="button"
              className="user-menu-link"
              onClick={() => handleItemClick('password_change')}
            >
              <i className="fa-solid fa-key" />
              <span>{t('userMenu.passwordChange')}</span>
            </button>
            <button
              type="button"
              className="user-menu-link"
              onClick={() => handleItemClick('settings')}
            >
              <i className="fa-solid fa-gear" />
              <span>{t('userMenu.settings')}</span>
            </button>
            <button
              type="button"
              className="user-menu-link"
              onClick={() => handleItemClick('login')}
            >
              <i className="fa-solid fa-right-to-bracket" />
              <span>{t('userMenu.loginDemo')}</span>
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
            <button
              type="button"
              className="user-menu-link logout"
              onClick={() => {
                if (confirm(t('userMenu.logoutConfirm'))) {
                  handleItemClick('login');
                }
                setIsOpen(false);
              }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket" />
              <span>{t('userMenu.logout')}</span>
            </button>
          </div>
        </div>
      </>
      )}
    </div>
  );
}
