import React from 'react';
import { useDropdown } from '../../hooks/useDropdown';

export default function UserDropdown() {
  const { isOpen, toggle, close, ref } = useDropdown();

  return (
    <div className="user-dropdown-container" ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="user-profile-btn"
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '12px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: '0 4px 10px rgba(30, 64, 175, 0.3)',
          }}
        >
          TK
        </div>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }} className="user-info-text desktop-only">
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Châu Tuấn Kiệt</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PM · Nhóm 1</span>
        </div>
        <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }} />
      </button>

      {isOpen && (
        <div
          className="user-profile-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '240px',
            background: 'var(--deck-bg)',
            border: '1px solid var(--deck-border)',
            borderRadius: '16px',
            boxShadow: 'var(--deck-shadow)',
            padding: '10px',
            zIndex: 1100,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--liquid-glass-border-bottom)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>Châu Tuấn Kiệt</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kiet.ct@itc.edu.vn</div>
          </div>

          <div style={{ padding: '6px 0' }}>
            <button
              type="button"
              onClick={close}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
            >
              <i className="fa-solid fa-user-tie" style={{ color: '#2563eb' }} />
              <span>Hồ sơ cá nhân & Chức danh</span>
            </button>
            <button
              type="button"
              onClick={close}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
            >
              <i className="fa-solid fa-bell" style={{ color: '#f59e0b' }} />
              <span>Tùy chọn nhận thông báo</span>
            </button>
            <button
              type="button"
              onClick={close}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                color: '#ef4444',
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderRadius: '8px',
                marginTop: '4px',
              }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket" />
              <span>Đăng xuất phiên làm việc</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
