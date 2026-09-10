/* ==========================================================================
   TLBM I18N - LANGUAGE CONTEXT & PROVIDER
   QuanLyVanBan_TLBM — Nhóm 1: Layout & Core Foundation
   Trưởng nhóm / PM: Châu Tuấn Kiệt
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translate, SUPPORTED_LANGUAGES } from './utils';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'tlbm_system_language';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'vi' || saved === 'en') {
        return saved;
      }
    } catch {
      // Bỏ qua nếu lỗi localStorage
    }
    return 'vi'; // Mặc định Tiếng Việt
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.setAttribute('lang', language);
    } catch {
      // Bỏ qua nếu lỗi localStorage
    }
  }, [language]);

  const changeLanguage = (newLang) => {
    if (newLang === 'vi' || newLang === 'en') {
      setLanguage(newLang);
    }
  };

  /**
   * Hàm dịch t(...) dùng trực tiếp trong component
   * @param {string} path - 'common.save' hoặc 'birthday.todayTitle'
   * @param {object} params - { age: 25, name: 'Kiet' }
   */
  const t = (path, params = {}) => {
    return translate(language, path, params);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback an toàn nếu render ngoài Provider
    return {
      language: 'vi',
      changeLanguage: () => {},
      t: (path, params = {}) => translate('vi', path, params),
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
}
