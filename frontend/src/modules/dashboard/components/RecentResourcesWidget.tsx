import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';

export interface ResourceItem {
  code: string;
  title: string;
  ext: string;
  color: string;
}

interface RecentResourcesWidgetProps {
  resources?: ResourceItem[];
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  { code: 'BM-01/NS', title: 'Phiếu đề xuất tiếp nhận cán bộ nhân viên mới', ext: 'DOCX', color: 'var(--color-info)' },
  { code: 'BM-02/TC', title: 'Mẫu thanh toán tạm ứng công tác phí nội bộ', ext: 'XLSX', color: 'var(--color-success)' },
  { code: 'TL-03/BM', title: 'Quy trình xử lý văn bản đến và văn bản đi', ext: 'PDF', color: 'var(--color-danger)' },
  { code: 'BM-04/HC', title: 'Mẫu đăng ký phòng họp và trang thiết bị', ext: 'DOCX', color: 'var(--color-info)' },
  { code: 'TL-05/IT', title: 'Hướng dẫn cài đặt ứng dụng bảo mật TLBM', ext: 'PDF', color: 'var(--color-danger)' },
];

export default function RecentResourcesWidget({
  resources = DEFAULT_RESOURCES,
}: RecentResourcesWidgetProps) {
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
            {resources.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '9px 6px', fontWeight: 600, color: 'var(--color-info)' }}>{row.code}</td>
                <td style={{ padding: '9px 6px', color: 'var(--text-main)' }}>{row.title}</td>
                <td style={{ padding: '9px 6px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: row.color,
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
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
          onClick={() => navigate('/resources')}
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
  );
}
