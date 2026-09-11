import React, { useState, useRef, useEffect } from 'react';
import { THEME_OPTIONS } from '../../utils/constants';
import { ThemeMode } from '../../types/theme';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

export default function ThemeSelector({ currentTheme, onSelectTheme }: ThemeSelectorProps) {
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

  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="header-action-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Đổi chủ đề giao diện (Dark / Light / Glass)"
        aria-label="Đổi chủ đề"
      >
        <i className={`fa-solid ${activeOption.icon}`} />
      </button>

      {isOpen && (
        <div
          className="dropdown-menu-wrapper"
          style={{ width: '230px', padding: '8px' }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Chủ đề giao diện
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {THEME_OPTIONS.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                >
                  <i
                    className={`fa-solid ${theme.icon}`}
                    style={{ width: '18px', textAlign: 'center' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem' }}>{theme.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {theme.description}
                    </div>
                  </div>
                  {isSelected && (
                    <i className="fa-solid fa-check" style={{ fontSize: '0.8rem' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
