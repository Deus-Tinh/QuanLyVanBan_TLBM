import React from 'react';
import { useTranslation } from '../../locales/i18n';

export default function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer px-6 py-3 border-t border-border-subtle bg-surface text-xs text-muted flex flex-wrap justify-between items-center gap-2">
      <div>
        <strong className="text-main">{t('app.name') || 'TLBM System'}</strong> — Hệ Thống Quản Lý Văn Bản & Tài Liệu Mật
      </div>
      <div>
        <span>Phiên bản v2.0 • Bản quyền © {new Date().getFullYear()} TLBM System</span>
      </div>
    </footer>
  );
}
