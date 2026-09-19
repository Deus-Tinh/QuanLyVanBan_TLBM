import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ActivePageId } from '@app-types/navigation';
import { useTranslation } from '@i18n/translate';

interface UserDropdownProps {
  onNavigate?: (page: ActivePageId) => void;
}

interface SessionUser {
  fullName?: string;
  username?: string;
  roleTitle?: string;
  avatar?: string;
  email?: string;
}

export default function UserDropdown({ onNavigate }: UserDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeWithAnimation = useCallback(() => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
    if (closingTimerRef.current) {
      clearTimeout(closingTimerRef.current);
    }
    closingTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closingTimerRef.current = null;
    }, 180);
  }, [isOpen, isClosing]);

  const openDropdown = () => {
    if (closingTimerRef.current) {
      clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
    setIsClosing(false);
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeWithAnimation();
    } else {
      openDropdown();
    }
  };

  useEffect(() => {
    return () => {
      if (closingTimerRef.current) {
        clearTimeout(closingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeWithAnimation();
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [closeWithAnimation]);

  const handleItemClick = (pageId: ActivePageId) => {
    closeWithAnimation();
    if (onNavigate) {
      onNavigate(pageId);
    }
  };

  const [session, setSession] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem('tlbm_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAuth = () => {
      try {
        const raw = localStorage.getItem('tlbm_session');
        setSession(raw ? JSON.parse(raw) : null);
      } catch {
        setSession(null);
      }
    };
    window.addEventListener('tlbm_auth_changed', handleAuth);
    window.addEventListener('storage', handleAuth);
    return () => {
      window.removeEventListener('tlbm_auth_changed', handleAuth);
      window.removeEventListener('storage', handleAuth);
    };
  }, []);

  const displayName = session?.fullName || session?.username;
  const displayRoleOrEmail = session?.roleTitle || session?.email || '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-full hover:bg-surface-hover border border-transparent hover:border-subtle transition-all duration-fast"
        onClick={toggleDropdown}
        title={session ? 'Hồ sơ người dùng' : 'Tài khoản khách (Chưa đăng nhập)'}
        aria-label={session ? 'Hồ sơ người dùng' : 'Tài khoản khách'}
      >
        {session ? (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">
            {session.avatar ? (
              <img src={session.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <i className="fa-solid fa-user" />
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-subtle text-text-muted flex items-center justify-center text-xs">
            <i className="fa-regular fa-user" />
          </div>
        )}

        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-semibold text-text-main leading-tight">
            {displayName || t('userMenu.guest') || 'Chưa đăng nhập'}
          </span>
        </div>
        <i className={`fa-solid fa-chevron-down text-xs text-text-muted ml-0.5 transition-transform duration-200 ${isOpen && !isClosing ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {(isOpen || isClosing) && (
        <div className={`dropdown-animate absolute right-0 top-full mt-2 w-72 rounded-2xl bg-surface-elevated border border-border-subtle shadow-2xl p-2 z-[10001] flex flex-col backdrop-blur-none ${isClosing ? 'dropdown-exit' : ''}`}>
            <div className="p-3 border-b border-subtle mb-1.5">
              {session ? (
                <>
                  <div className="font-bold text-base text-text-main">{displayName}</div>
                  {displayRoleOrEmail && (
                    <div className="text-sm text-text-muted truncate mt-0.5 font-medium">
                      {displayRoleOrEmail}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-bold text-base text-text-muted flex items-center gap-2">
                    <i className="fa-regular fa-circle-user text-sm" />
                    <span>{t('userMenu.notLoggedIn') || 'Chưa đăng nhập'}</span>
                  </div>
                  <div className="text-sm text-text-muted truncate mt-0.5 font-medium">
                    {t('userMenu.pleaseLogin') || 'Vui lòng đăng nhập để tiếp tục'}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              {session ? (
                <>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-text-secondary hover:text-text-main hover:bg-surface-hover font-medium transition-colors text-left cursor-pointer"
                    onClick={() => handleItemClick('profile')}
                  >
                    <i className="w-5 text-center fa-regular fa-user text-sm text-text-muted" />
                    <span>{t('userMenu.profile')}</span>
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-text-secondary hover:text-text-main hover:bg-surface-hover font-medium transition-colors text-left cursor-pointer"
                    onClick={() => handleItemClick('password_change')}
                  >
                    <i className="w-5 text-center fa-solid fa-key text-sm text-text-muted" />
                    <span>{t('userMenu.passwordChange')}</span>
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-text-secondary hover:text-text-main hover:bg-surface-hover font-medium transition-colors text-left cursor-pointer"
                    onClick={() => handleItemClick('settings')}
                  >
                    <i className="w-5 text-center fa-solid fa-gear text-sm text-text-muted" />
                    <span>{t('userMenu.settings')}</span>
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-text-secondary hover:text-text-main hover:bg-surface-hover font-medium transition-colors text-left cursor-pointer"
                    onClick={() => handleItemClick('login')}
                  >
                    <i className="w-5 text-center fa-solid fa-right-to-bracket text-sm text-text-muted" />
                    <span>{t('userMenu.loginDemo')}</span>
                  </button>
                  <hr className="my-1 border-0 border-t border-subtle" />
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-danger hover:bg-danger-subtle font-semibold transition-colors text-left cursor-pointer"
                    onClick={() => {
                      if (confirm(t('userMenu.logoutConfirm'))) {
                        localStorage.removeItem('tlbm_session');
                        window.dispatchEvent(new Event('tlbm_auth_changed'));
                        handleItemClick('login');
                      } else {
                        closeWithAnimation();
                      }
                    }}
                  >
                    <i className="w-5 text-center fa-solid fa-arrow-right-from-bracket text-sm" />
                    <span>{t('userMenu.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-primary font-semibold hover:bg-primary/10 transition-colors text-left cursor-pointer"
                    onClick={() => handleItemClick('login')}
                  >
                    <i className="w-5 text-center fa-solid fa-right-to-bracket text-sm" />
                    <span>{t('userMenu.login') || 'Đăng nhập'}</span>
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-text-secondary hover:text-text-main hover:bg-surface-hover font-medium transition-colors text-left cursor-pointer"
                    onClick={() => handleItemClick('login')}
                  >
                    <i className="w-5 text-center fa-solid fa-user-shield text-sm text-text-muted" />
                    <span>{t('userMenu.loginDemo')}</span>
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl text-text-secondary hover:text-text-main hover:bg-surface-hover font-medium transition-colors text-left cursor-pointer"
                    onClick={() => handleItemClick('settings')}
                  >
                    <i className="w-5 text-center fa-solid fa-gear text-sm text-text-muted" />
                    <span>{t('userMenu.settings')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
      )}
    </div>
  );
}



