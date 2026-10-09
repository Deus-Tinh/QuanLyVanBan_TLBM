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
}

// Mỗi trạng thái có nền + chữ riêng (chốt với trưởng nhóm); icon kèm theo để Chờ duyệt / Chưa hoàn thành không nhầm tông.
const STATUS_STYLES: Record<TaskStatus, StatusStyle> = {
  CHO_XU_LY: {
    icon: 'fa-regular fa-hourglass-half',
    color: '#6B7280',
    background: '#F3F4F6',
  },
  DANG_XU_LY: {
    icon: 'fa-solid fa-pen-ruler',
    color: '#1D4ED8',
    background: '#DBEAFE',
  },
  CHO_DUYET: {
    icon: 'fa-regular fa-clock',
    color: '#6D28D9',
    background: '#EDE9FE',
  },
  HOAN_THANH: {
    icon: 'fa-solid fa-circle-check',
    color: '#065F46',
    background: '#D1FAE5',
  },
  CHUA_HOAN_THANH: {
    icon: 'fa-solid fa-triangle-exclamation',
    color: '#D97706',
    background: '#FEF3C7',
  },
  QUA_HAN: {
    icon: 'fa-solid fa-circle-exclamation',
    color: '#DC2626',
    background: '#FEE2E2',
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
