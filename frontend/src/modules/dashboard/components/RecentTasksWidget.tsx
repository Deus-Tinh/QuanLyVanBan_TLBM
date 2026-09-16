import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../shared/components/ui';

export interface TaskItem {
  title: string;
  due: string;
  status: string;
  variant: 'success' | 'warning' | 'info' | 'secondary';
}

interface RecentTasksWidgetProps {
  tasks?: TaskItem[];
}

const DEFAULT_TASKS: TaskItem[] = [
  { title: 'Hoàn thiện bộ khung Layout Header Navbar (Nhóm 1)', due: '12/09/2026', status: 'Hoàn thành', variant: 'success' },
  { title: 'Xây dựng API Văn bản đến và Văn bản đi (Nhóm 2)', due: '15/09/2026', status: 'Đang làm', variant: 'warning' },
  { title: 'Thiết kế danh mục Hồ sơ cấp 1 & cấp 2 (Nhóm 3)', due: '16/09/2026', status: 'Chờ duyệt', variant: 'info' },
  { title: 'Cập nhật kho tài liệu biểu mẫu chung (Nhóm 4)', due: '18/09/2026', status: 'Đang làm', variant: 'warning' },
  { title: 'Tích hợp chữ ký số và sơ đồ trình ký (Nhóm 5)', due: '20/09/2026', status: 'Mới tạo', variant: 'secondary' },
];

export default function RecentTasksWidget({
  tasks = DEFAULT_TASKS,
}: RecentTasksWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
        <div className="font-bold text-sm text-main flex items-center gap-1.5">
          <i className="fa-solid fa-list-check text-purple" />
          <span>{t('dashboardDetails.recentTasksTitle')}</span>
        </div>
        <Badge variant="success" size="sm">
          {t('dashboardDetails.completedGroup1')}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('dashboardDetails.taskTitle')}</TableHead>
            <TableHead className="w-24">{t('dashboardDetails.taskDue')}</TableHead>
            <TableHead className="w-28 text-center">{t('dashboardDetails.taskStatus')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-semibold text-main">{row.title}</TableCell>
              <TableCell className="text-muted">{row.due}</TableCell>
              <TableCell className="text-center">
                <Badge variant={row.variant} size="sm">
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3.5 text-right">
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple hover:opacity-80 transition-colors duration-fast cursor-pointer"
        >
          <span>{t('dashboardDetails.viewMoreTasks')}</span>
          <i className="fa-solid fa-arrow-right text-[0.7rem]" />
        </button>
      </div>
    </Card>
  );
}
