import React, { useState } from 'react';
import { useTranslation } from '@i18n/translate';
import { Permission } from '@app-types/authorization';

interface PermissionMatrixProps {
  permissions: Permission[];
  selectedIds: Set<number>;
  onToggle: (permId: number) => void;
}

interface ModuleGroup {
  key: string;
  label: string;
  items: Permission[];
}

// Backend (SQL_Fix4) trả sẵn module_ten tiếng Việt cho từng quyền -> gom nhóm theo đó,
// giữ đúng thứ tự module của đặc tả; module mới của nhóm khác tự xuất hiện, không cần sửa code ở đây.
function groupByModule(permissions: Permission[]): ModuleGroup[] {
  const map = new Map<string, ModuleGroup>();
  for (const perm of permissions) {
    const key = perm.module_ten || '—';
    if (!map.has(key)) {
      map.set(key, { key, label: key, items: [] });
    }
    map.get(key)!.items.push(perm);
  }
  return Array.from(map.values());
}

// Bỏ dấu tiếng Việt và hoa/thường để tìm "chuc vu" vẫn ra "Chức vụ".
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function matchesQuery(perm: Permission, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return [perm.name, perm.codename, perm.module_ten].some((field) => normalizeText(field || '').includes(normalizedQuery));
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ permissions, selectedIds, onToggle }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const normalizedQuery = normalizeText(query.trim());
  const groups = groupByModule(permissions.filter((perm) => matchesQuery(perm, normalizedQuery)));

  if (permissions.length === 0) {
    return (
      <div className="text-center py-12 text-secondary">
        <i className="fa-solid fa-folder-open text-3xl text-muted mb-2 block" />
        {t('roles.table.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('roles.matrixSearchPlaceholder')}
          aria-label={t('roles.matrixSearchPlaceholder')}
          className="w-full pl-10 pr-3.5 py-2 text-sm bg-surface border border-border rounded-lg text-main placeholder-muted focus:outline-none focus:border-primary"
        />
      </div>

      {groups.length === 0 && (
        <div className="text-center py-8 text-secondary">
          <i className="fa-solid fa-magnifying-glass text-2xl text-muted mb-2 block" />
          {t('roles.matrixSearchEmpty')}
        </div>
      )}

      {groups.map((group, idx) => (
        <div key={group.key}>
          <h4 className="font-bold text-danger mb-2 text-sm">
            {idx + 1}. {group.label}
          </h4>
          <div className="space-y-1 pl-2">
            {group.items.map((perm) => (
              <label
                key={perm.id}
                className="flex items-center justify-between gap-3 py-1 px-2 -mx-2 text-sm text-main cursor-pointer select-none hover:bg-surface-hover rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-arrow-right-long text-muted text-xs" />
                  {perm.name}
                </span>
                <input
                  type="checkbox"
                  checked={selectedIds.has(perm.id)}
                  onChange={() => onToggle(perm.id)}
                  className="h-4 w-4 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer shrink-0"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
