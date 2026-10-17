import React from 'react';
import { TaskListItem } from '../types/task';
import { isoToDisplay } from './DateInput';
import { employeeMeta } from './EmployeeSelect';
import TaskActionCell from './TaskActionCell';
import TaskAssigneeCell from './TaskAssigneeCell';
import TaskStatusBadge from './TaskStatusBadge';

/** Bảng danh sách công việc 9 cột. Màn hình hẹp thì cuộn ngang. */

interface TaskTableProps {
  tasks: TaskListItem[];
  /** Số thứ tự của dòng đầu tiên, để cột TT đánh số liên tục qua các trang. */
  startIndex: number;
  busy?: boolean;
  onOpenTask: (task: TaskListItem) => void;
  onEdit: (task: TaskListItem) => void;
  onDelete: (task: TaskListItem) => void;
  onApprove: (task: TaskListItem) => void;
  onUnapprove: (task: TaskListItem) => void;
}

const COLUMNS: { label: string; width?: string }[] = [
  { label: 'TT', width: '40px' },
  { label: 'Nội dung công việc', width: '188px' },
  { label: 'Người giao', width: '124px' },
  { label: 'Yêu cầu xử lý', width: '178px' },
  { label: 'Người thực hiện', width: '150px' },
  { label: 'Ngày giao', width: '86px' },
  { label: 'Hạn xử lý', width: '86px' },
  { label: 'Trạng thái', width: '116px' },
  { label: 'Tác vụ', width: '120px' },
];

const cellStyle: React.CSSProperties = {
  padding: '10px 8px',
  borderBottom: '1px solid var(--border-subtle)',
  verticalAlign: 'top',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
};

const clampStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  whiteSpace: 'pre-line',
};

export default function TaskTable({
  tasks,
  startIndex,
  busy = false,
  onOpenTask,
  onEdit,
  onDelete,
  onApprove,
  onUnapprove,
}: TaskTableProps) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
      <table style={{ width: '100%', minWidth: '960px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          {COLUMNS.map((column) => (
            <col key={column.label} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr style={{ background: 'var(--bg-surface-hover)' }}>
            {COLUMNS.map((column) => (
              <th
                key={column.label}
                scope="col"
                style={{
                  padding: '10px 8px',
                  textAlign: column.label === 'TT' ? 'center' : 'left',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ opacity: busy ? 0.55 : 1, transition: 'opacity var(--transition-fast)' }}>
          {tasks.map((task, index) => {
            const hidden = !task.isPublic;
            return (
              <tr
                key={task.id}
                style={{ background: hidden ? 'var(--color-purple-subtle)' : 'var(--bg-surface)' }}
              >
                <td style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {startIndex + index}
                </td>

                <td style={cellStyle}>
                  <button
                    type="button"
                    onClick={() => onOpenTask(task)}
                    title="Xem chi tiết công việc"
                    style={{
                      ...clampStyle,
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                  >
                    {task.title}
                  </button>
                  {hidden && (
                    <span
                      title="Chỉ người tạo và quản trị viên nhìn thấy công việc này"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '6px',
                        padding: '1px 8px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-purple-border)',
                        color: 'var(--color-purple)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      <i className="fa-solid fa-eye-slash" />
                      Đang ẩn
                    </span>
                  )}
                </td>

                <td style={cellStyle}>
                  <div style={{ fontWeight: 600 }}>{task.creator.fullName}</div>
                  {employeeMeta(task.creator) && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {employeeMeta(task.creator)}
                    </div>
                  )}
                </td>

                <td style={cellStyle}>
                  <div style={{ ...clampStyle, color: 'var(--text-secondary)' }} title={task.requirement}>
                    {task.requirement}
                  </div>
                </td>

                <td style={cellStyle}>
                  <TaskAssigneeCell host={task.host} participants={task.participants} />
                </td>

                <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{isoToDisplay(task.createdDate)}</td>
                <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{isoToDisplay(task.dueDate)}</td>

                <td style={cellStyle}>
                  <TaskStatusBadge status={task.status} label={task.statusLabel} size="sm" />
                </td>

                <td style={cellStyle}>
                  <TaskActionCell
                    task={task}
                    disabled={busy}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onApprove={onApprove}
                    onUnapprove={onUnapprove}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
