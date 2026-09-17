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

const DEFAULT_DOCUMENTS: DocumentItem[] = [];

export default function IncomingDocumentsWidget({
  documents = DEFAULT_DOCUMENTS,
}: IncomingDocumentsWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col h-full">
      {/* Header: Solid Navy Blue */}
      <div className="bg-primary text-white px-3 py-1.5 flex justify-between items-center select-none">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <i className="fa-solid fa-inbox text-[11px]" />
          <span>Văn bản đến</span>
        </div>
        <span className="text-[11px] font-normal text-white/80">
          Cập nhật: Mới nhất
        </span>
      </div>

      {/* Rows or Empty State */}
      <div className="flex-1 divide-y divide-border-subtle/70 min-h-[140px] flex flex-col">
        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted">
            <i className="fa-solid fa-inbox text-2xl mb-2 opacity-40 text-primary" />
            <span className="text-xs font-medium">Chưa có dữ liệu văn bản đến</span>
          </div>
        ) : (
          documents.map((doc, idx) => (
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
          ))
        )}
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


