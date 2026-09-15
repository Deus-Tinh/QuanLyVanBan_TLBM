import React from 'react';
import { useTranslation } from '../../../shared/locales/i18n';

export default function BirthdaysWidget() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
      {/* Widget Sinh Nhật T, T+1 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-cake-candles" style={{ color: 'var(--color-pink)', fontSize: '1.1rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              {t('dashboardDetails.birthdaysTitle')}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-success-subtle)',
              color: 'var(--color-success)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {t('dashboardDetails.birthdaysVerified')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Sinh nhật hôm nay */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-pink-subtle)',
              border: '1px solid var(--color-pink-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🎂</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Nguyễn Văn Hiếu
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Nhóm 1 · Ban Công nghệ Thông tin
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-pink)',
                background: 'var(--bg-surface)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid var(--color-pink-border)',
              }}
            >
              {t('dashboardDetails.today')}
            </span>
          </div>

          {/* Sinh nhật ngày mai */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🎈</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Lê Trí Kiệt
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Trưởng Nhóm 2 · Phân hệ Văn bản
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-info)',
                background: 'var(--color-info-subtle)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid var(--color-info-border)',
              }}
            >
              {t('dashboardDetails.tomorrow')}
            </span>
          </div>
        </div>
      </div>

      {/* Widget Phòng Họp */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-calendar-check" style={{ color: 'var(--color-success)', fontSize: '1.1rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
              {t('dashboardDetails.meetingRoomsToday')}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-success-subtle)',
              color: 'var(--color-success)',
              fontWeight: 700,
            }}
          >
            {t('dashboardDetails.birthdaysVerified')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                Phòng Họp A201 (Hội nghị Ban Giám Đốc)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                08:30 - 11:30 · Chủ trì: NCS.ThS. Trần Phương Duy
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {t('dashboardDetails.inProgress')}
            </span>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                Phòng Họp B105 (Họp Sprint Review Nhóm 1 - 8)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                14:00 - 16:30 · Điều phối: Châu Tuấn Kiệt (PM)
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning-text)' }}>
              {t('dashboardDetails.upcoming')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
