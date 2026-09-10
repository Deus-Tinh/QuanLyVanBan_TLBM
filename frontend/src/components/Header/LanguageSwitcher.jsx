/* ==========================================================================
   TLBM - LANGUAGE SWITCHER COMPONENT
   QuanLyVanBan_TLBM — Nhóm 1: Layout & Core Foundation
   Trưởng nhóm / PM: Châu Tuấn Kiệt
   ========================================================================== */

import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useDropdown } from '../../hooks/useDropdown';

export default function LanguageSwitcher() {
  const { language, changeLanguage, supportedLanguages, t } = useTranslation();
  const { isOpen, toggle, close, ref } = useDropdown();

  const currentLangObj = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <div className="language-switcher-container" ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="tactile-btn language-toggle-btn"
        onClick={toggle}
        title={t('header.languageSelect')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 9px',
          borderRadius: '10px',
          background: 'var(--inset-well-bg)',
          border: '1px solid var(--liquid-glass-border)',
          color: 'var(--text-main)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{currentLangObj.flag}</span>
        <span className="lang-name-label desktop-only">{currentLangObj.code.toUpperCase()}</span>
        <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div
          className="language-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '200px',
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
            {t('header.languageSelect')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {supportedLanguages.map((l) => {
              const isSelected = l.code === language;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(l.code);
                    close();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isSelected ? 'var(--liquid-glass-bg)' : 'transparent',
                    boxShadow: isSelected ? 'var(--liquid-glass-shadow)' : 'none',
                    color: isSelected ? 'var(--color-primary, #2563eb)' : 'var(--text-main)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{l.flag}</span>
                    <span>{l.label}</span>
                  </div>
                  {isSelected && (
                    <i className="fa-solid fa-check" style={{ color: 'var(--color-primary, #2563eb)' }} />
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
