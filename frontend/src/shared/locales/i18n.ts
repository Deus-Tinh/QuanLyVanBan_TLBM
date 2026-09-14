import commonJson from './common.json';

export type CommonTranslation = typeof commonJson;

/**
 * Helper tra cứu chuỗi i18n theo key path (ví dụ: 'pages.dashboard.title', 'common.backToDashboard')
 */
export function t(key: string, replacements?: Record<string, string>): string {
  const parts = key.split('.');
  let current: any = commonJson;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return key; // Trả về fallback key nếu không tìm thấy
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  let result = current;
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{${k}}`, 'g'), v);
    });
  }

  return result;
}

export default commonJson;
