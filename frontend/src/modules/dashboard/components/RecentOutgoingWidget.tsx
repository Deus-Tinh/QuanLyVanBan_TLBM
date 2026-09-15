import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';
import { DocumentItem } from './IncomingDocumentsWidget';

interface RecentOutgoingWidgetProps {
  documents?: DocumentItem[];
}

const DEFAULT_OUTGOING: DocumentItem[] = [
  { code: '210/TB-BL', title: 'Thông báo kết luận cuộc họp giao ban quý 3', date: '11/09/2026' },
  { code: '89/QĐ-BL', title: 'Quyết định ban hành khung an ninh thông tin', date: '10/09/2026' },
  { code: '62/TTr-ITC', title: 'Tờ trình phê duyệt kinh phí trang bị máy chủ', date: '09/09/2026' },
  { code: '55/CV-BL', title: 'Công văn gửi các đơn vị phòng ban cấp 2', date: '08/09/2026' },
  { code: '31/QĐ-BL', title: 'Quyết định phân công nhiệm vụ đồ án Django', date: '06/09/2026' },
];

export default function RecentOutgoingWidget({
  documents = DEFAULT_OUTGOING,
}: RecentOutgoingWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
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
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.98rem',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
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
            {documents.map((row, idx) => (
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
          onClick={() => navigate('/documents/outgoing')}
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
  );
}
