import { useSyncExternalStore } from 'react';
import viJson from './vi.json';
import enJson from './en.json';

export type SupportedLanguage = 'vi' | 'en';
export type TranslationSchema = typeof viJson;

const DICTIONARIES: Record<SupportedLanguage, TranslationSchema> = {
  vi: viJson,
  en: enJson as unknown as TranslationSchema,
};

const STORAGE_KEY = 'tlbm_lang';

// Trạng thái ngôn ngữ hiện tại
let currentLang: SupportedLanguage = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
    if (saved === 'vi' || saved === 'en') {
      return saved;
    }
  }
  return 'vi';
})();

// Đồng bộ thuộc tính HTML lang ngay khi khởi tạo
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', currentLang);
}

// Bộ lắng nghe sự kiện thay đổi ngôn ngữ
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): SupportedLanguage {
  return currentLang;
}

/**
 * Lấy mã ngôn ngữ hiện tại ('vi' | 'en')
 */
export function getLanguage(): SupportedLanguage {
  return currentLang;
}

/**
 * Đổi ngôn ngữ hệ thống ('vi' | 'en'), lưu vào localStorage và thông báo đến toàn bộ component
 */
export function setLanguage(lang: SupportedLanguage): void {
  if (lang === currentLang) return;
  currentLang = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
  }
  // Kích hoạt re-render cho tất cả subscribers
  listeners.forEach((listener) => listener());
}

/**
 * Tra cứu chuỗi dịch theo dot notation (ví dụ: 'header.searchPlaceholder', 'pages.dashboard.title')
 */
export function t(
  key: string,
  replacements?: Record<string, string>,
  langOverride?: SupportedLanguage
): string {
  const lang = langOverride || currentLang;
  const dict = DICTIONARIES[lang] || DICTIONARIES.vi;
  const fallbackDict = DICTIONARIES.vi;

  const resolvePath = (obj: any, path: string) => {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        return undefined;
      }
    }
    return typeof cur === 'string' ? cur : undefined;
  };

  let result = resolvePath(dict, key) ?? resolvePath(fallbackDict, key) ?? key;

  if (replacements && typeof result === 'string') {
    Object.entries(replacements).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{${k}}`, 'g'), v);
    });
  }

  return result;
}

function getServerSnapshot(): SupportedLanguage {
  return 'vi';
}

/**
 * Custom React Hook phản ứng tức thì khi người dùng bấm chuyển đổi giữa Tiếng Việt và Tiếng Anh
 */
export function useTranslation() {
  const lang: SupportedLanguage = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const translations = DICTIONARIES[lang];

  return {
    currentLang: lang,
    setLanguage,
    t: (key: string, replacements?: Record<string, string>) => t(key, replacements, lang),
    translations,
  };
}

export default viJson;
