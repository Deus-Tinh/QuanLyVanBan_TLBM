import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';

export interface TaskItem {
  title: string;
  due: string;
  status: string;
  color: string;
}

interface RecentTasksWidgetProps {
  tasks?: TaskItem[];
}

const DEFAULT_TASKS: TaskItem[] = [
  { title: 'Hoàn thiện bộ khung Layout Header Navbar (Nhóm 1)', due: '12/09/2026', status: 'Hoàn thành', color: 'var(--color-success)' },
  { title: 'Xây dựng API Văn bản đến và Văn bản đi (Nhóm 2)', due: '15/09/2026', status: 'Đang làm', color: 'var(--color-warning-text)' },
  { title: 'Thiết kế danh mục Hồ sơ cấp 1 & cấp 2 (Nhóm 3)', due: '16/09/2026', status: 'Chờ duyệt', color: 'var(--color-info)' },
  { title: 'Cập nhật kho tài liệu biểu mẫu chung (Nhóm 4)', due: '18/09/2026', status: 'Đang làm', color: 'var(--color-warning-text)' },
  { title: 'Tích hợp chữ ký số và sơ đồ trình ký (Nhóm 5)', due: '20/09/2026', status: 'Mới tạo', color: 'var(--text-muted)' },
];

export default function RecentTasksWidget({
  tasks = DEFAULT_TASKS,
}: RecentTasksWidgetProps) {
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
            {tasks.map((row, idx) => (
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
          onClick={() => navigate('/tasks')}
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
  );
}
