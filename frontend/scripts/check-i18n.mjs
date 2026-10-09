// Kiểm tra vi.json và en.json có cùng tập key (so sánh theo đường dẫn key đã làm phẳng).
import { readFileSync } from 'node:fs';

const load = (lang) => JSON.parse(readFileSync(new URL(`../src/i18n/${lang}.json`, import.meta.url), 'utf8'));

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

const vi = new Set(flatten(load('vi')));
const en = new Set(flatten(load('en')));

const missingInEn = [...vi].filter((key) => !en.has(key));
const missingInVi = [...en].filter((key) => !vi.has(key));

for (const key of missingInEn) console.error(`Thiếu trong en.json: ${key}`);
for (const key of missingInVi) console.error(`Thiếu trong vi.json: ${key}`);

if (missingInEn.length || missingInVi.length) {
  console.error(`i18n lệch: ${missingInEn.length} key thiếu ở en, ${missingInVi.length} key thiếu ở vi.`);
  process.exit(1);
}

console.log(`i18n khớp: ${vi.size} key.`);
