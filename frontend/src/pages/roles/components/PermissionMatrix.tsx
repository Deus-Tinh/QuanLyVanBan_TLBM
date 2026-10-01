import React from 'react';
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

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ permissions, selectedIds, onToggle }) => {
  const { t } = useTranslation();
  const groups = groupByModule(permissions);

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-secondary">
        <i className="fa-solid fa-folder-open text-3xl text-muted mb-2 block" />
        {t('roles.table.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
