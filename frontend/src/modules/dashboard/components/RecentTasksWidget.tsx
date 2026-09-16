import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../shared/components/ui';

export interface TaskItem {
  id: string;
  title: string;
  due: string;
  status: 'processing' | 'completed' | 'overdue' | 'pending';
  statusLabel: string;
  variant: 'success' | 'warning' | 'info' | 'danger';
}

interface RecentTasksWidgetProps {
  tasks?: TaskItem[];
}

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: '1',
    title: 'Rà soát dự thảo quy chế văn thư lưu trữ điện tử năm 2026',
    due: '18/09/2026',
    status: 'processing',
    statusLabel: 'Đang xử lý',
    variant: 'warning',
  },
  {
    id: '2',
    title: 'Phê duyệt kế hoạch công tác kiểm tra an toàn bảo mật định kỳ',
    due: '15/09/2026',
    status: 'completed',
    statusLabel: 'Đã hoàn thành',
    variant: 'success',
  },
  {
    id: '3',
    title: 'Tổng hợp báo cáo số liệu tiếp nhận văn bản liên ngành tháng 9',
    due: '14/09/2026',
    status: 'overdue',
    statusLabel: 'Quá hạn xử lý',
    variant: 'danger',
  },
  {
    id: '4',
    title: 'Hoàn thiện hồ sơ trình ký ban giám đốc về dự án hạ tầng số',
    due: '20/09/2026',
    status: 'pending',
    statusLabel: 'Đang chờ duyệt',
    variant: 'info',
  },
];

type TaskFilter = 'processing' | 'completed' | 'overdue' | 'pending';

export default function RecentTasksWidget({
  tasks = DEFAULT_TASKS,
}: RecentTasksWidgetProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TaskFilter>('processing');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col">
      {/* Header: Solid Navy Blue */}
      <div className="bg-[#0a3871] text-white px-3 py-1.5 flex justify-between items-center select-none">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <i className="fa-solid fa-list-check text-[11px]" />
          <span>Danh sách nhiệm vụ</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="text-xs text-white/90 hover:text-white font-medium cursor-pointer"
        >
          Xem thêm »
        </button>
      </div>

      {/* Radio Filter Bar */}
      <div className="bg-surface-elevated/50 border-b border-border-subtle/70 px-3 py-2 flex items-center gap-5 flex-wrap text-xs select-none">
        <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-main">
          <input
            type="radio"
            name="task_status_filter"
            checked={filter === 'processing'}
            onChange={() => setFilter('processing')}
            className="accent-[#0a3871] cursor-pointer"
          />
          <span>Đang xử lý</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-main">
          <input
            type="radio"
            name="task_status_filter"
            checked={filter === 'completed'}
            onChange={() => setFilter('completed')}
            className="accent-[#0a3871] cursor-pointer"
          />
          <span>Đã hoàn thành</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-main">
          <input
            type="radio"
            name="task_status_filter"
            checked={filter === 'overdue'}
            onChange={() => setFilter('overdue')}
            className="accent-[#0a3871] cursor-pointer"
          />
          <span>Quá hạn xử lý</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-main">
          <input
            type="radio"
            name="task_status_filter"
            checked={filter === 'pending'}
            onChange={() => setFilter('pending')}
            className="accent-[#0a3871] cursor-pointer"
          />
          <span>Đang chờ duyệt</span>
        </label>
      </div>

      {/* Task List */}
      <div className="divide-y divide-border-subtle/70 min-h-[90px]">
        {filteredTasks.length === 0 ? (
          <div className="p-4 text-xs text-muted text-left italic">
            Không có nhiệm vụ nào
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate('/tasks')}
              className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-surface-hover transition-colors cursor-pointer group text-xs"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-semibold text-main group-hover:text-primary transition-colors truncate">
                  {t.title}
                </div>
              </div>
              <div className="text-muted text-[11px] shrink-0 whitespace-nowrap">
                {t.due}
              </div>
              <div className="shrink-0 text-right min-w-fit">
                <Badge variant={t.variant} size="sm">
                  {t.statusLabel}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


