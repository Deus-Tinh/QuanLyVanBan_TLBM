import React from 'react';
import WorkAlert from '../components/WorkAlert';

/** Trang chi tiết xử lý công việc — Mốc 5 sẽ thay phần thân bằng giao diện đầy đủ. */

interface TaskDetailPageProps {
  taskId: number;
  onBack: () => void;
}

export default function TaskDetailPage({ taskId, onBack }: TaskDetailPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-arrow-left" />
          Quay lại danh sách
        </button>
      </div>
      <WorkAlert
        variant="info"
        title={`Công việc #${taskId}`}
        message="Trang chi tiết xử lý công việc (nộp bằng chứng, duyệt, ý kiến) đang được làm ở Mốc 5."
      />
    </div>
  );
}
