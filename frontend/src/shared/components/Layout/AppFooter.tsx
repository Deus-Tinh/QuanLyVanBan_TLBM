import React from 'react';
import { useTranslation } from '../../locales/i18n';
import { Logo } from '../common/Logo';

export default function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer px-6 py-3 border-t border-border-subtle bg-surface text-xs text-muted flex flex-wrap justify-between items-center gap-3 select-none">
      <div className="flex items-center gap-2.5">
        <Logo size="xs" className="opacity-75" />
        <div>
          <strong className="text-main">{t('app.name') || 'Bảo Long Insurance'}</strong> — Hệ Thống Quản Lý Văn Bản &amp; Tài Liệu Mật
        </div>
      </div>
      <div>
        <span>Phiên bản v2.0 • Bản quyền © {new Date().getFullYear()} Bảo Long Insurance</span>
      </div>
    </footer>
  );
}
