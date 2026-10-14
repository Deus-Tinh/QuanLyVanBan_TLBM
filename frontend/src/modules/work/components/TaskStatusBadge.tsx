import React from 'react';
import { TASK_STATUS_LABELS, TaskStatus } from '../types/task';

interface StatusStyle {
  icon: string;
  color: string;
  background: string;
}

const STATUS_STYLES: Record<TaskStatus, StatusStyle> = {
  CHO_XU_LY: {
    icon: 'fa-regular fa-hourglass-half',
    color: 'var(--color-task-badge-gray-text)',
    background: 'var(--color-task-badge-gray-bg)',
  },
  // Theo yêu cầu GVHD: chỉ còn 3 màu — xanh lá (hoàn thành), đỏ (quá hạn),
  // còn lại dùng y hệt bộ trắng xám của "Chờ xử lý". Giữ nguyên icon.
  DANG_XU_LY: {
    icon: 'fa-solid fa-pen-ruler',
    color: 'var(--color-task-badge-gray-text)',
    background: 'var(--color-task-badge-gray-bg)',
  },
  CHO_DUYET: {
    icon: 'fa-regular fa-clock',
    color: 'var(--color-task-badge-gray-text)',
    background: 'var(--color-task-badge-gray-bg)',
  },
  HOAN_THANH: {
    icon: 'fa-solid fa-circle-check',
    color: 'var(--color-task-badge-green-text)',
    background: 'var(--color-task-badge-green-bg)',
  },
  CHUA_HOAN_THANH: {
    icon: 'fa-solid fa-triangle-exclamation',
    color: 'var(--color-task-badge-gray-text)',
    background: 'var(--color-task-badge-gray-bg)',
  },
  QUA_HAN: {
    icon: 'fa-solid fa-circle-exclamation',
    color: 'var(--color-task-badge-red-text)',
    background: 'var(--color-task-badge-red-bg)',
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
