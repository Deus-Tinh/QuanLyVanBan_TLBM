/* ==========================================================================
   TLBM I18N - UTILITIES
   QuanLyVanBan_TLBM — Nhóm 1: Layout & Core Foundation
   Trưởng nhóm / PM: Châu Tuấn Kiệt
   ========================================================================== */

import { translations } from './translations';

/**
 * Lấy text theo chuỗi path dạng dot-notation (ví dụ: 'nav.birthdays' hoặc 'birthday.todayTitle')
 * @param {string} lang - 'vi' | 'en'
 * @param {string} path - Key phân cấp dot-notation
 * @param {object} params - Các tham số nội suy (ví dụ { age: 30, name: 'Nguyễn Văn A' })
 * @returns {string} - Chuỗi văn bản đã dịch hoặc fallback path nếu không tìm thấy
 */
export function translate(lang, path, params = {}) {
  const dictionary = translations[lang] || translations.vi;
  const keys = path.split('.');
  
  let current = dictionary;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Fallback sang tiếng Việt nếu tiếng Anh bị thiếu key
      let fallback = translations.vi;
      for (const fKey of keys) {
        if (fallback && typeof fallback === 'object' && fKey in fallback) {
          fallback = fallback[fKey];
        } else {
          return path; // Trả về chính path nếu cả 2 đều không có
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  // Thay thế tham số {paramName}
  let result = current;
  Object.keys(params).forEach((paramKey) => {
    result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
  });

  return result;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];
