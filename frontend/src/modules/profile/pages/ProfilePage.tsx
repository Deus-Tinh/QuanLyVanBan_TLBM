import React from 'react';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';

interface ProfilePageProps {
  onNavigate: (page: ActivePageId) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { t } = useTranslation();

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
            <span>👤</span>
            <span>{t('profile.title')}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              ({t('profile.moduleTag')})
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px 18px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('profile.fullName')}:</span>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '4px' }}>
              {t('profile.sampleName')}
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('profile.role')}:</span>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)', marginTop: '4px' }}>
              {t('profile.sampleRole')}
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('profile.department')}:</span>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '4px' }}>
              {t('profile.sampleDept')}
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('profile.email')}:</span>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '4px' }}>
              {t('profile.sampleEmail')}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={() => onNavigate('dashboard')}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>{t('common.backToDashboard')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
