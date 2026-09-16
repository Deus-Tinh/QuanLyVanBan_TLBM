import React from 'react';
import { TASK_STATUS_LABELS, TaskStatus } from '../types/task';

/**
 * Nhãn màu hiển thị trạng thái công việc.
 * Trạng thái do backend tính, frontend chỉ hiển thị — không tự suy ra từ ngày tháng.
 */

interface StatusStyle {
  icon: string;
  color: string;
  background: string;
  border: string;
}

// Chờ duyệt và Chưa hoàn thành cùng tông vàng/cam nên mỗi trạng thái có thêm icon riêng để không nhầm.
const STATUS_STYLES: Record<TaskStatus, StatusStyle> = {
  CHO_XU_LY: {
    icon: 'fa-regular fa-hourglass-half',
    color: 'var(--text-secondary)',
    background: 'var(--bg-surface-hover)',
    border: 'var(--border-subtle)',
  },
  DANG_XU_LY: {
    icon: 'fa-solid fa-pen-ruler',
    color: 'var(--color-primary)',
    background: 'var(--color-primary-subtle)',
    border: 'var(--color-primary-border)',
  },
  CHO_DUYET: {
    icon: 'fa-regular fa-clock',
    color: 'var(--color-warning-text)',
    background: 'var(--color-warning-subtle)',
    border: 'var(--color-warning-border)',
  },
  HOAN_THANH: {
    icon: 'fa-solid fa-circle-check',
    color: 'var(--color-success)',
    background: 'var(--color-success-subtle)',
    border: 'var(--color-success-border)',
  },
  CHUA_HOAN_THANH: {
    icon: 'fa-solid fa-triangle-exclamation',
    color: 'var(--color-warning-hover)',
    background: 'var(--color-warning-subtle)',
    border: 'var(--color-warning)',
  },
  QUA_HAN: {
    icon: 'fa-solid fa-circle-exclamation',
    color: 'var(--color-danger)',
    background: 'var(--color-danger-subtle)',
    border: 'var(--color-danger-border)',
  },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  /** Nhãn do API trả về; bỏ trống thì dùng nhãn mặc định trong types/task.ts. */
  label?: string;
  size?: 'sm' | 'md';
}

export default function TaskStatusBadge({ status, label, size = 'md' }: TaskStatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.CHO_XU_LY;
  const text = label || TASK_STATUS_LABELS[status] || status;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        background: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: size === 'sm' ? '0.72rem' : '0.78rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
      }}
      title={text}
    >
      <i className={style.icon} style={{ fontSize: '0.72em' }} />
      <span>{text}</span>
    </span>
  );
}
