import React, { useState } from 'react';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';

interface DashboardPageProps {
  onNavigate: (page: ActivePageId) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Welcome Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-subtle), transparent)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backdropFilter: 'var(--backdrop-blur)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {t('dashboardDetails.greeting')}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-subtle)',
                border: '1px solid var(--color-primary-border)',
                color: 'var(--color-primary)',
                fontWeight: 700,
              }}
            >
              {t('dashboardDetails.roleBadge')}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.92rem' }}>
            {t('dashboardDetails.leadDescription')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={() => onNavigate('documents_incoming')}
          >
            <i className="fa-solid fa-plus" />
            <span>{t('dashboardDetails.receiveDocBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. KHỐI TÌM KIẾM VĂN BẢN ĐẾN VÀ ĐI (Nhiệm vụ Trang chủ Nhóm 1) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
              {t('dashboardDetails.quickSearchTitle')}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-warning-subtle)',
              border: '1px solid var(--color-warning-border)',
              color: 'var(--color-warning-text)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <i className="fa-solid fa-triangle-exclamation" />
            {t('common.group1Developing')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSearchFilter('all')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'all' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('dashboardDetails.filterAll')}
            </button>
            <button
              type="button"
              onClick={() => setSearchFilter('incoming')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'incoming' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'incoming' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('dashboardDetails.filterIncoming')}
            </button>
            <button
              type="button"
              onClick={() => setSearchFilter('outgoing')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'outgoing' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'outgoing' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('dashboardDetails.filterOutgoing')}
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 'min(100%, 240px)', position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('dashboardDetails.searchPlaceholder')}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
              }}
            />
            <i
              className="fa-solid fa-search"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => alert(t('dashboardDetails.searchDevAlert'))}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
          >
            <i className="fa-solid fa-magnifying-glass" />
            <span>{t('dashboardDetails.searchBtn')}</span>
          </button>
        </div>
      </div>

      {/* 3. KPI METRICS DECK & THỐNG KÊ SỐ VĂN BẢN ĐI/ĐẾN THEO NĂM */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
            📊 {t('dashboardDetails.kpiTitle')}
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
                1,248
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
                856
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
                24
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
                18
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                {t('dashboardDetails.tasksNearDeadline')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. KHỐI WIDGET: THÔNG BÁO SINH NHẬT THEO NGÀY T, T + 1 & PHÒNG HỌP */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-pink)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--color-pink-border)' }}>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-info)', background: 'var(--color-info-subtle)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--color-info-border)' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
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

      {/* 5. DANH SÁCH 5 VĂN BẢN ĐẾN & 5 VĂN BẢN ĐI (Có nút Xem thêm) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
        {/* Top 5 Văn Bản Đến */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-inbox" style={{ color: 'var(--color-info)' }} />
                <span>{t('dashboardDetails.recentIncomingTitle')}</span>
              </div>
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
              {t('dashboardDetails.completedGroup1')}
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>{t('dashboardDetails.docNumber')}</th>
                  <th style={{ padding: '8px 6px' }}>{t('dashboardDetails.docSummary')}</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>{t('dashboardDetails.docDate')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: '128/QĐ-BGDĐT', title: 'Hướng dẫn công tác năm học mới 2026', date: '11/09/2026' },
                  { code: '45/CV-UBND', title: 'Tăng cường an toàn thông tin CSDL nhà nước', date: '10/09/2026' },
                  { code: '09/TB-ITC', title: 'Thông báo lịch bảo vệ đồ án chuyên ngành', date: '09/09/2026' },
                  { code: '77/HD-TCHQ', title: 'Quy trình kiểm tra hồ sơ điện tử liên ngành', date: '08/09/2026' },
                  { code: '14/KH-ITC', title: 'Kế hoạch triển khai hệ thống quản lý văn bản', date: '07/09/2026' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: 'var(--color-primary)' }}>{row.code}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-muted)' }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('documents_incoming')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('dashboardDetails.viewMoreIncoming')}</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>

        {/* Top 5 Văn Bản Đi */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-paper-plane" style={{ color: 'var(--color-success)' }} />
                <span>{t('dashboardDetails.recentOutgoingTitle')}</span>
              </div>
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
              {t('dashboardDetails.completedGroup1')}
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>{t('dashboardDetails.docNumber')}</th>
                  <th style={{ padding: '8px 6px' }}>{t('dashboardDetails.docSummary')}</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>{t('dashboardDetails.docDate')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: '210/TB-BL', title: 'Thông báo kết luận cuộc họp giao ban quý 3', date: '11/09/2026' },
                  { code: '89/QĐ-BL', title: 'Quyết định ban hành khung an ninh thông tin', date: '10/09/2026' },
                  { code: '62/TTr-ITC', title: 'Tờ trình phê duyệt kinh phí trang bị máy chủ', date: '09/09/2026' },
                  { code: '55/CV-BL', title: 'Công văn gửi các đơn vị phòng ban cấp 2', date: '08/09/2026' },
                  { code: '31/QĐ-BL', title: 'Quyết định phân công nhiệm vụ đồ án Django', date: '06/09/2026' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: 'var(--color-success)' }}>{row.code}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-muted)' }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('documents_outgoing')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-success)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('dashboardDetails.viewMoreOutgoing')}</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. DANH SÁCH 5 CÔNG VIỆC & 5 TÀI LIỆU, BIỂU MẪU CHUNG (Có nút Xem thêm) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
        {/* Top 5 Công Việc */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-list-check" style={{ color: 'var(--color-purple)' }} />
                <span>{t('dashboardDetails.recentTasksTitle')}</span>
              </div>
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
              {t('dashboardDetails.completedGroup1')}
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>{t('dashboardDetails.taskTitle')}</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>{t('dashboardDetails.taskDue')}</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>{t('dashboardDetails.taskStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: 'Hoàn thiện bộ khung Layout Header Navbar (Nhóm 1)', due: '12/09/2026', status: 'Hoàn thành', color: 'var(--color-success)' },
                  { title: 'Xây dựng API Văn bản đến và Văn bản đi (Nhóm 2)', due: '15/09/2026', status: 'Đang làm', color: 'var(--color-warning-text)' },
                  { title: 'Thiết kế danh mục Hồ sơ cấp 1 & cấp 2 (Nhóm 3)', due: '16/09/2026', status: 'Chờ duyệt', color: 'var(--color-info)' },
                  { title: 'Cập nhật kho tài liệu biểu mẫu chung (Nhóm 4)', due: '18/09/2026', status: 'Đang làm', color: 'var(--color-warning-text)' },
                  { title: 'Tích hợp chữ ký số và sơ đồ trình ký (Nhóm 5)', due: '20/09/2026', status: 'Mới tạo', color: 'var(--text-muted)' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-muted)' }}>{row.due}</td>
                    <td style={{ padding: '9px 6px', color: row.color, fontWeight: 700 }}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-purple)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('dashboardDetails.viewMoreTasks')}</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>

        {/* Top 5 Tài Liệu, Biểu Mẫu Chung */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-file-lines" style={{ color: 'var(--color-info)' }} />
                <span>{t('dashboardDetails.recentResourcesTitle')}</span>
              </div>
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
              {t('dashboardDetails.completedGroup1')}
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>{t('dashboardDetails.resourceCode')}</th>
                  <th style={{ padding: '8px 6px' }}>{t('dashboardDetails.resourceName')}</th>
                  <th style={{ padding: '8px 6px', width: '80px' }}>{t('dashboardDetails.resourceFormat')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: 'BM-01/NS', title: 'Phiếu đề xuất tiếp nhận cán bộ nhân viên mới', ext: 'DOCX', color: 'var(--color-info)' },
                  { code: 'BM-02/TC', title: 'Mẫu thanh toán tạm ứng công tác phí nội bộ', ext: 'XLSX', color: 'var(--color-success)' },
                  { code: 'TL-03/BM', title: 'Quy trình xử lý văn bản đến và văn bản đi', ext: 'PDF', color: 'var(--color-danger)' },
                  { code: 'BM-04/HC', title: 'Mẫu đăng ký phòng họp và trang thiết bị', ext: 'DOCX', color: 'var(--color-info)' },
                  { code: 'TL-05/IT', title: 'Hướng dẫn cài đặt ứng dụng bảo mật TLBM', ext: 'PDF', color: 'var(--color-danger)' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: 'var(--color-info)' }}>{row.code}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px' }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: row.color, color: '#fff', fontWeight: 700 }}>
                        {row.ext}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-info)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('dashboardDetails.viewMoreResources')}</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

