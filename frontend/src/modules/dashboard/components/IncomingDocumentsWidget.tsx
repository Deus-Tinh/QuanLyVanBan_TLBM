import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';

export interface DocumentItem {
  code: string;
  title: string;
  date: string;
}

interface IncomingDocumentsWidgetProps {
  documents?: DocumentItem[];
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { code: '128/QĐ-BGDĐT', title: 'Hướng dẫn công tác năm học mới 2026', date: '11/09/2026' },
  { code: '45/CV-UBND', title: 'Tăng cường an toàn thông tin CSDL nhà nước', date: '10/09/2026' },
  { code: '09/TB-ITC', title: 'Thông báo lịch bảo vệ đồ án chuyên ngành', date: '09/09/2026' },
  { code: '77/HD-TCHQ', title: 'Quy trình kiểm tra hồ sơ điện tử liên ngành', date: '08/09/2026' },
  { code: '14/KH-ITC', title: 'Kế hoạch triển khai hệ thống quản lý văn bản', date: '07/09/2026' },
];

export default function IncomingDocumentsWidget({
  documents = DEFAULT_DOCUMENTS,
}: IncomingDocumentsWidgetProps) {
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
            {documents.map((row, idx) => (
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
          onClick={() => navigate('/documents/incoming')}
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
  );
}
