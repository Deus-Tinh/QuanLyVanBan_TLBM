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

  // Gom nhóm các chủ đề theo danh mục
  const categories = [
    { key: 'classic', label: 'Kinh Điển & Văn Phòng' },
    { key: 'glass', label: 'Kính Mờ & Khúc Xạ (Glassmorphism)' },
    { key: 'tactile', label: 'Khối Nổi 3D & Xúc Giác (3D Morphism)' },
    { key: 'expressive', label: 'Đồ Họa Nghệ Thuật & Đột Phá' },
  ] as const;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="header-action-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`Chủ đề hiện tại: ${activeOption.name} (Nhấp để đổi phong cách)`}
        aria-label="Đổi chủ đề"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <i className={`fa-solid ${activeOption.icon}`} />
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: activeOption.borderPreview || 'var(--color-primary)',
            boxShadow: '0 0 6px var(--color-primary)',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="dropdown-menu-wrapper"
          style={{
            width: '460px',
            maxWidth: '92vw',
            maxHeight: '82vh',
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {/* Header Popover */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '14px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: 'var(--text-main)',
                }}
              >
                Phong Cách Giao Diện (10 Chủ Đề)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Tùy biến toàn bộ hệ thống theo phong cách bạn thích
              </div>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                color: '#ffffff',
              }}
            >
              {activeOption.name}
            </span>
          </div>

          {/* Danh mục và các thẻ giao diện */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categories.map((cat) => {
              const themesInCat = THEME_OPTIONS.filter((t) => t.category === cat.key);
              if (themesInCat.length === 0) return null;

              return (
                <div key={cat.key}>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '4px',
                        height: '10px',
                        background: 'var(--color-primary)',
                        borderRadius: '2px',
                      }}
                    />
                    {cat.label}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                    }}
                  >
                    {themesInCat.map((theme, idx) => {
                      const isSelected = currentTheme === theme.id;
                      const isLastOdd =
                        themesInCat.length % 2 !== 0 && idx === themesInCat.length - 1;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: isSelected
                              ? 'rgba(59, 130, 246, 0.16)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: isSelected
                              ? '2px solid var(--color-primary)'
                              : '1px solid var(--border-subtle)',
                            color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                            textAlign: 'left',
                            width: '100%',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            position: 'relative',
                            boxShadow: isSelected ? '0 0 14px var(--color-primary-glow)' : 'none',
                            gridColumn: isLastOdd ? 'span 2' : 'span 1',
                          }}
                          onClick={() => {
                            onSelectTheme(theme.id);
                            setIsOpen(false);
                          }}
                        >
                          {/* Vòng tròn swatch mẫu màu đặc trưng của theme */}
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              background: theme.previewGradient,
                              border: `1px solid ${theme.borderPreview || 'rgba(255,255,255,0.2)'}`,
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              color: isSelected ? 'var(--color-primary)' : 'inherit',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                            }}
                          >
                            <i className={`fa-solid ${theme.icon}`} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: isSelected ? 700 : 600,
                                color: isSelected ? 'var(--color-primary)' : 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {theme.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--text-muted)',
                                lineHeight: 1.25,
                                marginTop: '2px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {theme.description}
                            </div>
                          </div>

                          {isSelected && (
                            <i
                              className="fa-solid fa-check"
                              style={{
                                color: 'var(--color-primary)',
                                fontSize: '0.85rem',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
