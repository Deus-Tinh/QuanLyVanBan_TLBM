import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentItem } from './IncomingDocumentsWidget';

interface RecentOutgoingWidgetProps {
  documents?: DocumentItem[];
}

const DEFAULT_OUTGOING: DocumentItem[] = [
  { code: '10438/368/2026/QĐ-TGĐ', title: 'Quyết định về việc chấm dứt Hợp đồng lao động theo nguyện vọng cá nhân đối với Ông Nguyễn Đình Đăng...', date: '02/03/2026' },
  { code: '10434/367/2026/QĐ-TGĐ', title: 'Quyết định về việc Tiếp nhận thử việc Bà Lê Huỳnh Yến Phương làm Nhân viên Chăm sóc Khách hàng...', date: '26/02/2026' },
  { code: '10433/357/2026/QĐ-TGĐ', title: 'Quyết định về việc Tái bổ nhiệm Bà Võ Thị Thời giữ chức danh Phó Giám đốc kiêm Trưởng phòng kinh doanh...', date: '26/02/2026' },
  { code: '10440/13/2026/TB-HĐQT', title: 'Thông báo về việc thăm viếng tang Lễ', date: '20/02/2026' },
  { code: '10439/12/2026/TB-HĐQT', title: 'Thông báo về việc thăm viếng tang Lễ', date: '20/02/2026' },
];

export default function RecentOutgoingWidget({
  documents = DEFAULT_OUTGOING,
}: RecentOutgoingWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col h-full">
      {/* Header: Solid Navy Blue */}
      <div className="bg-[#0a3871] text-white px-3 py-1.5 flex justify-between items-center select-none">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <i className="fa-solid fa-paper-plane text-[11px]" />
          <span>Văn bản đi</span>
        </div>
        <span className="text-[11px] font-normal text-white/80">
          Cập nhật: 02/03/2026
        </span>
      </div>

      {/* Rows */}
      <div className="flex-1 divide-y divide-border-subtle/70">
        {documents.map((doc, idx) => (
          <div
            key={idx}
            onClick={() => navigate('/documents/outgoing')}
            className="p-2.5 px-3 hover:bg-surface-hover transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
              <span className="text-secondary font-medium">
                Số ký hiệu: <span className="text-primary font-semibold group-hover:underline">{doc.code}</span>
              </span>
              <span className="text-muted text-[11px] shrink-0">{doc.date}</span>
            </div>
            <div className="text-xs text-secondary line-clamp-1 group-hover:text-main transition-colors" title={doc.title}>
              {doc.title}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: Xem thêm » on the left */}
      <div className="p-2 px-3 bg-surface-elevated/40 border-t border-border-subtle/70 text-left">
        <button
          type="button"
          onClick={() => navigate('/documents/outgoing')}
          className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          <span>Xem thêm »</span>
        </button>
      </div>
    </div>
  );
}


