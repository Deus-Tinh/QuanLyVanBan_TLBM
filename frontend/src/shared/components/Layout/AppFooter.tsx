import React from 'react';
import { useTranslation } from '../../locales/i18n';

export default function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <div>
        <strong>{t('app.name')}</strong> · {t('app.course')}
      </div>
      <div>
        {t('footer.advisorPrefix')}: <strong>{t('app.advisor')}</strong> | {t('footer.layoutLead')}: <strong>Nhóm 1 (PM: Châu Tuấn Kiệt)</strong> · <span style={{ color: '#d97706', fontWeight: 600 }}>● {t('footer.group1Notice')}</span>
      </div>
    </footer>
  );
}
