import React from 'react';
import { useTranslation, SupportedLanguage } from '../../locales/i18n';

export default function LanguageSwitcher() {
  const { currentLang, setLanguage } = useTranslation();

  const handleToggle = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  return (
    <div className="lang-switcher-pill" role="group" aria-label="Language switcher">
      <button
        type="button"
        className={`lang-switch-btn ${currentLang === 'vi' ? 'active' : ''}`}
        onClick={() => handleToggle('vi')}
        title="Tiếng Việt (Việt Nam)"
        aria-label="Chuyển sang Tiếng Việt"
        aria-pressed={currentLang === 'vi'}
      >
        <span className="lang-flag">🇻🇳</span>
        <span className="lang-text">VI</span>
      </button>

      <button
        type="button"
        className={`lang-switch-btn ${currentLang === 'en' ? 'active' : ''}`}
        onClick={() => handleToggle('en')}
        title="English (International)"
        aria-label="Switch to English"
        aria-pressed={currentLang === 'en'}
      >
        <span className="lang-flag">🇬🇧</span>
        <span className="lang-text">EN</span>
      </button>
    </div>
  );
}
