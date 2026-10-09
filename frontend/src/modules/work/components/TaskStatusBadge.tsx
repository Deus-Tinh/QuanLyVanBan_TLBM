import React from 'react';
import { TASK_STATUS_LABELS, TaskStatus } from '../types/task';
import './TaskStatusBadge.css';

interface StatusStyle {
  icon: string;
  color: string;
  background: string;
}

const STATUS_STYLES: Record<TaskStatus, StatusStyle> = {
  CHO_XU_LY: {
    icon: 'fa-regular fa-hourglass-half',
    color: 'var(--badge-gray-text)',
    background: 'var(--badge-gray-bg)',
  },
  DANG_XU_LY: {
    icon: 'fa-solid fa-pen-ruler',
    color: 'var(--badge-blue-text)',
    background: 'var(--badge-blue-bg)',
  },
  CHO_DUYET: {
    icon: 'fa-regular fa-clock',
    color: 'var(--badge-purple-text)',
    background: 'var(--badge-purple-bg)',
  },
  HOAN_THANH: {
    icon: 'fa-solid fa-circle-check',
    color: 'var(--badge-green-text)',
    background: 'var(--badge-green-bg)',
  },
  CHUA_HOAN_THANH: {
    icon: 'fa-solid fa-triangle-exclamation',
    color: 'var(--badge-amber-text)',
    background: 'var(--badge-amber-bg)',
  },
  QUA_HAN: {
    icon: 'fa-solid fa-circle-exclamation',
    color: 'var(--badge-red-text)',
    background: 'var(--badge-red-bg)',
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
        borderRadius: '9999px',
        background: style.background,
        color: style.color,
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 500,
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
