import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge, Button } from '../../../shared/components/ui';

interface PasswordChangePageProps {
  onNavigate?: (page: ActivePageId) => void;
}

export default function PasswordChangePage({ onNavigate }: PasswordChangePageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('passwordChange.submitBtn'));
  };

  return (
    <div className="max-w-4xl mx-auto my-5 flex flex-col gap-5">
      <Card className="p-7 sm:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2.5">
          <h2 className="text-xl font-extrabold text-main flex items-center gap-2.5 m-0">
            <span>🔑</span>
            <span>{t('passwordChange.title')}</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-3.5">
          <div>
            <label className="text-sm font-semibold text-secondary block mb-1.5">
              {t('passwordChange.currentPassword')}:
            </label>
            <input
              type="password"
              placeholder={t('passwordChange.currentPasswordPlaceholder')}
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sm border border-border-subtle bg-surface-elevated text-main text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-fast placeholder:text-muted"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-secondary block mb-1.5">
              {t('passwordChange.newPassword')}:
            </label>
            <input
              type="password"
              placeholder={t('passwordChange.newPasswordPlaceholder')}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sm border border-border-subtle bg-surface-elevated text-main text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-fast placeholder:text-muted"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-secondary block mb-1.5">
              {t('passwordChange.confirmPassword')}:
            </label>
            <input
              type="password"
              placeholder={t('passwordChange.confirmPasswordPlaceholder')}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sm border border-border-subtle bg-surface-elevated text-main text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-fast placeholder:text-muted"
            />
          </div>

          <div className="flex gap-3 mt-2.5 flex-wrap">
            <Button
              type="submit"
              variant="primary"
              size="md"
            >
              {t('passwordChange.submitBtn')}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                if (onNavigate) onNavigate('dashboard');
                navigate('/dashboard');
              }}
            >
              {t('common.backToDashboard')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
