import React, { useState } from 'react';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';

interface PasswordChangePageProps {
  onNavigate: (page: ActivePageId) => void;
}

export default function PasswordChangePage({ onNavigate }: PasswordChangePageProps) {
  const { t } = useTranslation();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('passwordChange.submitBtn'));
  };

  return (
    <div style={{ maxWidth: '820px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <span>🔑</span>
            <span>{t('passwordChange.title')}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              ({t('passwordChange.moduleTag')})
            </span>
          </h2>

          <span
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-warning-subtle)',
              border: '1px solid var(--color-warning-border)',
              color: 'var(--color-warning-text)',
              fontWeight: 700,
            }}
          >
            {t('common.group1Developing')}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('passwordChange.currentPassword')}:
            </label>
            <input
              type="password"
              placeholder={t('passwordChange.currentPasswordPlaceholder')}
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('passwordChange.newPassword')}:
            </label>
            <input
              type="password"
              placeholder={t('passwordChange.newPasswordPlaceholder')}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('passwordChange.confirmPassword')}:
            </label>
            <input
              type="password"
              placeholder={t('passwordChange.confirmPasswordPlaceholder')}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--color-primary-glow)',
              }}
            >
              {t('passwordChange.submitBtn')}
            </button>

            <button
              type="button"
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate('dashboard')}
            >
              {t('common.backToDashboard')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
