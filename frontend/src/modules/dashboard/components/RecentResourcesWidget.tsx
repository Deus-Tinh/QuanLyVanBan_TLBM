import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../shared/components/ui';

export interface ResourceItem {
  code: string;
  title: string;
  ext: string;
  variant: 'info' | 'success' | 'danger' | 'warning' | 'primary';
}

interface RecentResourcesWidgetProps {
  resources?: ResourceItem[];
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  { code: 'BM-01/NS', title: 'Phiếu đề xuất tiếp nhận cán bộ nhân viên mới', ext: 'DOCX', variant: 'info' },
  { code: 'BM-02/TC', title: 'Mẫu thanh toán tạm ứng công tác phí nội bộ', ext: 'XLSX', variant: 'success' },
  { code: 'TL-03/BM', title: 'Quy trình xử lý văn bản đến và văn bản đi điện tử', ext: 'PDF', variant: 'danger' },
  { code: 'BM-04/HC', title: 'Mẫu đăng ký phòng họp và trang thiết bị hội trường', ext: 'DOCX', variant: 'info' },
  { code: 'TL-05/IT', title: 'Hướng dẫn cài đặt ứng dụng bảo mật chữ ký số', ext: 'PDF', variant: 'danger' },
];

export default function RecentResourcesWidget({
  resources = DEFAULT_RESOURCES,
}: RecentResourcesWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col">
      {/* Header bar: Deep Slate / Navy */}
      <div className="bg-[#1e4d7b] text-white px-3.5 py-2 flex justify-between items-center select-none">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
          <i className="fa-solid fa-file-lines text-blue-200" />
          <span>Biểu mẫu & Tài nguyên chung</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/resources')}
          className="text-xs text-blue-100 hover:text-white font-medium cursor-pointer"
        >
          Xem thêm »
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-border-subtle text-xs">
        {resources.map((row, idx) => (
          <div
            key={idx}
            onClick={() => navigate('/resources')}
            className="p-2.5 px-3.5 flex items-center justify-between gap-3 hover:bg-surface-hover transition-colors duration-fast cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-semibold text-primary group-hover:underline shrink-0 text-xs">
                {row.code}
              </span>
              <span className="text-secondary truncate text-xs" title={row.title}>
                {row.title}
              </span>
            </div>
            <div className="shrink-0">
              <Badge variant={row.variant} size="sm">
                {row.ext}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

