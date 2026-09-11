import React, { useState, useRef, useEffect } from 'react';
import { CURRENT_USER } from '../../utils/constants';
import { ActivePageId } from '../../types/navigation';

interface UserDropdownProps {
  onNavigate?: (page: ActivePageId) => void;
}

export default function UserDropdown({ onNavigate }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          <span className="user-role-label">PM · Nhóm 1</span>
        </div>
        <i
          className="fa-solid fa-chevron-down"
          style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}
        />
      </button>

      {isOpen && (
        <div className="dropdown-menu-wrapper user-dropdown-panel">
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
              <span>Thông tin tài khoản</span>
            </button>
            <button
              type="button"
              className="user-menu-link"
              onClick={() => handleItemClick('password_change')}
            >
              <i className="fa-solid fa-key" />
              <span>Đổi mật khẩu</span>
            </button>
            <button
              type="button"
              className="user-menu-link"
              onClick={() => handleItemClick('login')}
            >
              <i className="fa-solid fa-right-to-bracket" />
              <span>Trang đăng nhập (2 trường hợp)</span>
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
            <button
              type="button"
              className="user-menu-link logout"
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống TLBM?')) {
                  handleItemClick('login');
                }
                setIsOpen(false);
              }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
