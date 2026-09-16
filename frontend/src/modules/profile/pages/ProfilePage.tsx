import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge, Button } from '../../../shared/components/ui';

interface ProfilePageProps {
  onNavigate?: (page: ActivePageId) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto my-5 flex flex-col gap-5">
      <Card className="p-7 sm:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2.5">
          <h2 className="text-xl font-extrabold text-main flex items-center gap-2.5 m-0">
            <span>👤</span>
            <span>{t('profile.title')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 px-4.5 bg-surface-elevated border border-border-subtle rounded-lg">
            <span className="text-xs text-muted font-medium">{t('profile.fullName')}:</span>
            <div className="font-bold text-base text-main mt-1">
              {t('profile.sampleName')}
            </div>
          </div>

          <div className="p-3.5 px-4.5 bg-surface-elevated border border-border-subtle rounded-lg">
            <span className="text-xs text-muted font-medium">{t('profile.role')}:</span>
            <div className="font-bold text-base text-primary mt-1">
              {t('profile.sampleRole')}
            </div>
          </div>

          <div className="p-3.5 px-4.5 bg-surface-elevated border border-border-subtle rounded-lg">
            <span className="text-xs text-muted font-medium">{t('profile.department')}:</span>
            <div className="font-bold text-base text-main mt-1">
              {t('profile.sampleDept')}
            </div>
          </div>

          <div className="p-3.5 px-4.5 bg-surface-elevated border border-border-subtle rounded-lg">
            <span className="text-xs text-muted font-medium">{t('profile.email')}:</span>
            <div className="font-bold text-base text-main mt-1">
              {t('profile.sampleEmail')}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Button
            variant="primary"
            size="md"
            icon="fa-arrow-left"
            onClick={() => {
              if (onNavigate) onNavigate('dashboard');
              navigate('/dashboard');
            }}
          >
            {t('common.backToDashboard')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
