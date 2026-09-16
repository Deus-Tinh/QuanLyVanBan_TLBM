import React from 'react';
import { useTranslation } from '../../locales/i18n';

export default function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer px-6 py-3 border-t border-border-subtle bg-surface text-xs text-muted flex flex-wrap justify-between items-center gap-2">
      <div>
        <strong className="text-main">{t('app.name')}</strong> · {t('app.course')}
      </div>
      <div>
        {t('footer.advisorPrefix')}: <strong className="text-main">{t('app.advisor')}</strong> | {t('footer.layoutLead')}: <strong className="text-main">Nhóm 1 (PM: Châu Tuấn Kiệt)</strong> ·{' '}
        <span className="text-warning-text font-semibold">
          ● {t('footer.group1Notice')}
        </span>
      </div>
    </footer>
  );
}
