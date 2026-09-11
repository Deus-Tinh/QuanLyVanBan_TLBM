import React from 'react';
import { THEMES } from '../../utils/constants';
import { useDropdown } from '../../hooks/useDropdown';

export default function ThemeSelector({ currentTheme, onSelectTheme }) {
  const { isOpen, toggle, close, ref } = useDropdown();

  const currentThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  const themeShortNames = {
    skeuomorphism: 'Skeuo 3D',
    dark: 'Dark Mesh',
    light: 'Executive Light',
  };

  return (
    <div className="theme-selector-container" ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="tactile-btn theme-toggle-btn"
        onClick={toggle}
        title={`Phong cách giao diện: ${currentThemeObj.name}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '12px',
          background: 'var(--inset-well-bg)',
          border: '1px solid var(--liquid-glass-border)',
          color: 'var(--text-main)',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <i className={`fa-solid ${currentThemeObj.icon}`} style={{ color: '#f59e0b' }} />
        <span className="theme-name-label desktop-only">{themeShortNames[currentThemeObj.id] || currentThemeObj.name}</span>
        <i className="fa-solid fa-chevron-down desktop-only" style={{ fontSize: '0.65rem', opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div
          className="theme-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '280px',
            background: 'var(--deck-bg)',
            border: '1px solid var(--deck-border)',
            borderRadius: '16px',
            boxShadow: 'var(--deck-shadow)',
            padding: '8px',
            zIndex: 1100,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}
          >
            Chọn phong cách hiển thị
          </div>

          {THEMES.map((theme) => {
            const isActive = theme.id === currentTheme;
            return (
              <button
                key={theme.id}
                type="button"
                className={`theme-option-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTheme(theme.id);
                  close();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid var(--gold-accent, #eab308)' : '1px solid transparent',
                  background: isActive ? 'var(--blue-pill-bg, #1e40af)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--inset-well-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  <i className={`fa-solid ${theme.icon}`} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{theme.name}</div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      opacity: isActive ? 0.9 : 0.7,
                      marginTop: '2px',
                      lineHeight: 1.3,
                    }}
                  >
                    {theme.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
