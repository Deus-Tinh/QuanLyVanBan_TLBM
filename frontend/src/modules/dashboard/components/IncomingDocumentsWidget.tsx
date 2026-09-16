import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface DocumentItem {
  code: string;
  title: string;
  date: string;
}

interface IncomingDocumentsWidgetProps {
  documents?: DocumentItem[];
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { code: '4234/SCB-TGĐ.25.00', title: 'Công văn về việc đăng ký mua 17 xe chở tiền cũ hiệu Mitsubishi Pajero bán thanh lý của SCB', date: '15/12/2025' },
  { code: '2955/SCB-TGĐ.25.00', title: 'Công văn về việc thanh lý tài sản của SCB tại Hà Nội', date: '29/09/2025' },
  { code: '4919/SCB-TGĐ.24.00', title: 'Công văn về việc đăng ký mua 17 xe ô tô chuyên dùng cũ bán thanh lý lần 3/2024 của SCB', date: '07/10/2024' },
  { code: '4190/SCB-TGĐ.24.00', title: 'Công văn về việc đăng ký mua 17 xe ô tô chuyên dùng cũ bán thanh lý lần 2/2024 của SCB', date: '22/08/2024' },
  { code: '2736/SCB-TGĐ.24.00', title: 'Công văn về việc đăng ký mua 23 xe ô tô chuyên dùng bán thanh lý lần 1/2024 của SCB', date: '10/06/2024' },
];

export default function IncomingDocumentsWidget({
  documents = DEFAULT_DOCUMENTS,
}: IncomingDocumentsWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col h-full">
      {/* Header: Solid Navy Blue */}
      <div className="bg-[#0a3871] text-white px-3 py-1.5 flex justify-between items-center select-none">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <i className="fa-solid fa-inbox text-[11px]" />
          <span>Văn bản đến</span>
        </div>
        <span className="text-[11px] font-normal text-white/80">
          Cập nhật: 15/12/2025
        </span>
      </div>

      {/* Rows */}
      <div className="flex-1 divide-y divide-border-subtle/70">
        {documents.map((doc, idx) => (
          <div
            key={idx}
            onClick={() => navigate('/documents/incoming')}
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
          onClick={() => navigate('/documents/incoming')}
          className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          <span>Xem thêm »</span>
        </button>
      </div>
    </div>
  );
}


