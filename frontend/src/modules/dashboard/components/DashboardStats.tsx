import React from 'react';
import { useTranslation } from '../../../shared/locales/i18n';

interface DashboardStatsProps {
  incomingCount?: number;
  outgoingCount?: number;
  confidentialCount?: number;
  tasksCount?: number;
}

export default function DashboardStats({
  incomingCount = 1248,
  outgoingCount = 856,
  confidentialCount = 24,
  tasksCount = 18,
}: DashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊 {t('dashboardDetails.kpiTitle')}</span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-subtle)',
              border: '1px solid var(--color-primary-border)',
              color: 'var(--color-primary)',
              fontWeight: 600,
            }}
          >
            Mock Data (Prototype)
          </span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-success-subtle)',
            border: '1px solid var(--color-success-border)',
            color: 'var(--color-success)',
            fontWeight: 700,
          }}
        >
          {t('dashboardDetails.kpiVerifiedTag')}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '18px',
        }}
      >
        {/* Card 1: VB Đến */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
            }}
          >
            <i className="fa-solid fa-inbox" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t('dashboardDetails.incomingCard')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {incomingCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>
              {t('dashboardDetails.incomingToday')}
            </div>
          </div>
        </div>

        {/* Card 2: VB Đi */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-success-subtle)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
            }}
          >
            <i className="fa-solid fa-paper-plane" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t('dashboardDetails.outgoingCard')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {outgoingCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>
              {t('dashboardDetails.outgoingStatus')}
            </div>
          </div>
        </div>

        {/* Card 3: VB Mật */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
            }}
          >
            <i className="fa-solid fa-shield-halved" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t('dashboardDetails.confidentialCard')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {confidentialCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-danger)', fontWeight: 600 }}>
              {t('dashboardDetails.confidentialStatus')}
            </div>
          </div>
        </div>

        {/* Card 4: Công Việc */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-purple-subtle)',
              color: 'var(--color-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
            }}
          >
            <i className="fa-solid fa-list-check" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t('dashboardDetails.tasksCard')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {tasksCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-warning)', fontWeight: 600 }}>
              {t('dashboardDetails.tasksNearDeadline')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
