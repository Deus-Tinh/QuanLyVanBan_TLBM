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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-full hover:bg-surface-hover border border-transparent hover:border-subtle transition-all duration-fast"
        onClick={() => setIsOpen(!isOpen)}
        title="Hồ sơ người dùng"
        aria-label="Hồ sơ người dùng"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">
          {CURRENT_USER.avatar}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-text-main leading-tight">
            {CURRENT_USER.fullName}
          </span>
        </div>
        <i className="fa-solid fa-chevron-down text-[10px] text-text-muted ml-0.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[10000] bg-backdrop backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-elevated border border-subtle shadow-glass p-1.5 z-[10001] flex flex-col">
            <div className="p-2.5 border-b border-subtle mb-1">
              <div className="font-semibold text-sm text-text-main">{CURRENT_USER.fullName}</div>
              <div className="text-xs text-text-muted truncate">{CURRENT_USER.email}</div>
            </div>

            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors text-left"
                onClick={() => handleItemClick('profile')}
              >
                <i className="w-4 text-center fa-regular fa-user text-xs" />
                <span>{t('userMenu.profile')}</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors text-left"
                onClick={() => handleItemClick('password_change')}
              >
                <i className="w-4 text-center fa-solid fa-key text-xs" />
                <span>{t('userMenu.passwordChange')}</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors text-left"
                onClick={() => handleItemClick('settings')}
              >
                <i className="w-4 text-center fa-solid fa-gear text-xs" />
                <span>{t('userMenu.settings')}</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors text-left"
                onClick={() => handleItemClick('login')}
              >
                <i className="w-4 text-center fa-solid fa-right-to-bracket text-xs" />
                <span>{t('userMenu.loginDemo')}</span>
              </button>
              <hr className="my-1 border-0 border-t border-subtle" />
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-danger hover:bg-danger-subtle transition-colors text-left"
                onClick={() => {
                  if (confirm(t('userMenu.logoutConfirm'))) {
                    handleItemClick('login');
                  }
                  setIsOpen(false);
                }}
              >
                <i className="w-4 text-center fa-solid fa-arrow-right-from-bracket text-xs" />
                <span>{t('userMenu.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
