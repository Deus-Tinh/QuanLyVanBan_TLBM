import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@components/common';

export interface ResourceItem {
  code: string;
  title: string;
  ext: string;
  variant: 'info' | 'success' | 'danger' | 'warning' | 'primary';
}

interface RecentResourcesWidgetProps {
  resources?: ResourceItem[];
}

const DEFAULT_RESOURCES: ResourceItem[] = [];

export default function RecentResourcesWidget({
  resources = DEFAULT_RESOURCES,
}: RecentResourcesWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col">
      {/* Header bar: Standardized Solid Blue */}
      <div className="bg-primary text-white px-3 py-1.5 flex justify-between items-center select-none">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <i className="fa-solid fa-file-lines text-[11px]" />
          <span>Biểu mẫu & Tài nguyên chung</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/resources')}
          className="text-xs text-white/90 hover:text-white font-medium cursor-pointer"
        >
          Xem thêm »
        </button>
      </div>

      {/* List or Empty State */}
      <div className="divide-y divide-border-subtle text-xs min-h-[60px] flex flex-col justify-center">
        {resources.length === 0 ? (
          <div className="p-4 text-xs text-muted text-center flex flex-col items-center justify-center gap-1">
            <i className="fa-solid fa-file-lines text-lg opacity-40 text-blue-500" />
            <span>Kho tài liệu và biểu mẫu hiện đang trống</span>
          </div>
        ) : (
          resources.map((row, idx) => (
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
          ))
        )}
      </div>
    </div>
  );
}


