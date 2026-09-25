import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem } from '@app-types/document';
import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { formatDateTime, formatDate } from '@lib/dateUtils';

export interface DocumentTableProps {
  documents: DocumentItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  isLoading?: boolean;
  onViewDetail: (id: number) => void;
  onViewHistory: (id: number) => void;
  onEdit?: (doc: DocumentItem) => void;
  onDelete?: (id: number, soHieu: string) => void;
  isConfidential?: boolean;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  onViewDetail,
  onViewHistory,
  onEdit,
  onDelete,
  isConfidential = false,
}) => {
  // Quản lý menu 3 chấm ⋮ mở trên dòng nào
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Đóng menu khi click ra ngoài hoặc nhấn phím ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIdx = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  // Tạo mảng số trang hiển thị
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-xl shadow-sm overflow-hidden transition-all duration-normal">
      {/* Bảng Dữ Liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-surface-elevated/70 text-xs font-bold text-muted uppercase tracking-wider border-b border-border-subtle">
              <th className="px-4 py-3 text-center w-16">Số đến</th>
              <th className="px-4 py-3 w-40">Số, ký hiệu</th>
              <th className="px-4 py-3 w-48">Mốc thời gian</th>
              <th className="px-4 py-3 min-w-[280px]">Trích yếu nội dung</th>
              <th className="px-4 py-3 w-48">Nơi ban hành</th>
              <th className="px-4 py-3 w-40 text-center">Hiệu lực</th>
              <th className="px-4 py-3 w-20 text-center">Tác vụ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border-subtle/70">
            {/* Trạng thái Loading Shimmer */}
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-4 bg-muted/20 rounded w-8 mx-auto" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 bg-muted/20 rounded w-28" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 bg-muted/20 rounded w-32 mb-1.5" />
                    <div className="h-3 bg-muted/15 rounded w-24" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 bg-muted/20 rounded w-full mb-1" />
                    <div className="h-3 bg-muted/15 rounded w-3/4" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 bg-muted/20 rounded w-28" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-6 bg-muted/20 rounded-full w-24 mx-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-7 w-7 bg-muted/20 rounded mx-auto" />
                  </td>
                </tr>
              ))
            ) : documents.length === 0 ? (
              /* Trạng thái Không có dữ liệu (Empty State) */
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-muted text-xl mb-1 border border-border-subtle">
                      <i className="fa-solid fa-folder-open text-muted" />
                    </div>
                    <span className="text-sm font-semibold text-secondary">
                      Không tìm thấy văn bản đến nào
                    </span>
                    <span className="text-xs text-muted max-w-sm">
                      Không có văn bản nào phù hợp với điều kiện tìm kiếm. Hãy thử chọn năm khác hoặc đặt lại bộ lọc.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              /* Danh sách văn bản */
              documents.map((doc) => {
                const isExpired = doc.hieu_luc === 'HET_HIEU_LUC';
                const isReplaced = doc.hieu_luc === 'HET_VA_THAY_THE';

                // Yêu cầu đặc tả: Dòng hết hiệu lực bôi màu tối
                const rowHighlightClass = isExpired
                  ? 'bg-slate-500/10 dark:bg-black/40 opacity-75 border-l-4 border-l-danger'
                  : isReplaced
                  ? 'bg-amber-500/5 dark:bg-black/30 border-l-4 border-l-warning'
                  : 'hover:bg-surface-hover/80 transition-colors border-l-4 border-l-transparent';

                return (
                  <tr key={doc.id} className={`${rowHighlightClass} transition-colors group`}>
                    {/* 1. Số đến */}
                    <td className="px-4 py-3.5 text-center font-bold text-primary whitespace-nowrap">
                      {doc.so_thu_tu ? `#${doc.so_thu_tu}` : '—'}
                    </td>

                    {/* 2. Số, ký hiệu */}
                    <td className="px-4 py-3.5 font-semibold text-main whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetail(doc.id)}
                        className="text-left font-semibold text-main hover:text-primary hover:underline transition-colors flex items-center gap-1.5"
                        title="Bấm để xem chi tiết văn bản"
                      >
                        <i className="fa-solid fa-file-contract text-primary/70 text-xs shrink-0" />
                        <span>{doc.so_hieu}</span>
                      </button>
                    </td>

                    {/* 3. Mốc thời gian (Ngày đến & Ngày văn bản) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-xs font-semibold text-main flex items-center gap-1.5">
                        <i className="fa-regular fa-clock text-primary text-[0.7rem]" />
                        <span>Đến: {formatDateTime(doc.ngay_den)}</span>
                      </div>
                      <div className="text-[0.7rem] text-muted flex items-center gap-1.5 mt-0.5">
                        <i className="fa-regular fa-calendar text-muted text-[0.7rem]" />
                        <span>Ký ngày: {formatDate(doc.ngay_van_ban)}</span>
                      </div>
                    </td>

                    {/* 4. Trích yếu nội dung */}
                    <td className="px-4 py-3.5">
                      <div
                        className="line-clamp-2 text-main text-xs leading-relaxed cursor-pointer hover:text-primary transition-colors"
                        title={doc.trich_yeu}
                        onClick={() => onViewDetail(doc.id)}
                      >
                        {doc.trich_yeu}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {doc.attachment_count > 0 && (
                          <div className="inline-flex items-center gap-1 text-[0.68rem] text-secondary bg-surface-elevated px-2 py-0.5 rounded-md border border-border-subtle">
                            <i className="fa-solid fa-paperclip text-primary text-[0.65rem]" />
                            <span>{doc.attachment_count} tệp đính kèm</span>
                          </div>
                        )}
                        {doc.link_thay_the && doc.hieu_luc === 'CON_HIEU_LUC' && (
                          <div
                            className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20"
                            title={`Thay thế cho văn bản: ${doc.link_thay_the}`}
                          >
                            <i className="fa-solid fa-repeat text-primary text-[0.65rem]" />
                            <span>Thay thế: <strong className="font-mono">{doc.link_thay_the}</strong></span>
                          </div>
                        )}
                        {doc.link_thay_the && doc.hieu_luc === 'HET_VA_THAY_THE' && (
                          <div
                            className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-warning-text bg-warning/10 px-2 py-0.5 rounded-md border border-warning/30"
                            title={`Bị thay thế bởi văn bản: ${doc.link_thay_the}`}
                          >
                            <i className="fa-solid fa-triangle-exclamation text-warning text-[0.65rem]" />
                            <span>Bị thay bởi: <strong className="font-mono">{doc.link_thay_the}</strong></span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. Nơi ban hành */}
                    <td className="px-4 py-3.5 text-xs text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5" title={doc.noi_ban_hanh || ''}>
                        <i className="fa-solid fa-building-columns text-muted text-[0.7rem]" />
                        <span className="truncate max-w-[180px]">{doc.noi_ban_hanh || '—'}</span>
                      </div>
                    </td>

                    {/* 6. Trạng thái Hiệu lực (Badge) */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {doc.hieu_luc === 'CON_HIEU_LUC' && (
                        <Badge variant="success" size="sm" withDot>
                          Còn hiệu lực
                        </Badge>
                      )}
                      {doc.hieu_luc === 'HET_HIEU_LUC' && (
                        <Badge variant="danger" size="sm" withDot>
                          Hết hiệu lực
                        </Badge>
                      )}
                      {doc.hieu_luc === 'HET_VA_THAY_THE' && (
                        <Badge variant="warning" size="sm" withDot>
                          Đã thay thế
                        </Badge>
                      )}
                    </td>

                    {/* 7. Tác vụ: Menu 3 chấm ⋮ */}
                    <td className="px-4 py-3.5 text-center relative">
                      <div className="inline-block text-left" ref={activeMenuId === doc.id ? menuRef : null}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors"
                          title="Tác vụ"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-base" />
                        </button>

                        {/* Dropdown Menu Popup */}
                        {activeMenuId === doc.id && (
                          <div className="absolute right-3 mt-1 w-48 bg-surface-elevated border border-border-subtle rounded-xl shadow-lg z-50 py-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                            {/* Nút Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewDetail(doc.id);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-main hover:bg-primary-subtle hover:text-primary flex items-center gap-2.5 transition-colors"
                            >
                              <i className="fa-solid fa-eye text-primary w-4" />
                              <span>Xem chi tiết</span>
                            </button>

                            {/* Nút Người đã xem */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewHistory(doc.id);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-main hover:bg-info-subtle hover:text-info flex items-center gap-2.5 transition-colors"
                            >
                              <i className="fa-solid fa-user-check text-info w-4" />
                              <span>Người đã xem</span>
                            </button>

                            {/* Nút Sửa (ẩn nếu là văn bản mật) */}
                            {!isConfidential && onEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit(doc);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-main hover:bg-warning-subtle hover:text-warning-text flex items-center gap-2.5 transition-colors"
                              >
                                <i className="fa-solid fa-pen-to-square text-warning-text w-4" />
                                <span>Chỉnh sửa</span>
                              </button>
                            )}

                            {/* Nút Xóa (ẩn nếu là văn bản mật) */}
                            {!isConfidential && onDelete && (
                              <>
                                <div className="border-t border-border-subtle/50 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onDelete(doc.id, doc.so_hieu);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-danger hover:bg-danger-subtle flex items-center gap-2.5 transition-colors"
                                >
                                  <i className="fa-solid fa-trash-can w-4" />
                                  <span>Xóa văn bản</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh Phân Trang (Pagination Footer) */}
      <div className="px-4 py-3 border-t border-border-subtle bg-surface-elevated/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-muted flex items-center gap-2">
          <span>
            Hiển thị <span className="font-semibold text-main">{startIdx}</span> -{' '}
            <span className="font-semibold text-main">{endIdx}</span> trên tổng số{' '}
            <span className="font-semibold text-main">{totalCount}</span> văn bản
          </span>
        </div>

        {/* Nút chuyển trang */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="!px-2 !py-1"
            title="Trang trước"
          >
            <i className="fa-solid fa-chevron-left text-[0.7rem]" />
          </Button>

          {getPageNumbers().map((p, i) =>
            typeof p === 'number' ? (
              <button
                key={i}
                type="button"
                onClick={() => onPageChange(p)}
                disabled={isLoading}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all ${
                  page === p
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-secondary hover:text-main hover:bg-surface-elevated'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={i} className="px-1 text-muted">
                {p}
              </span>
            )
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="!px-2 !py-1"
            title="Trang kế tiếp"
          >
            <i className="fa-solid fa-chevron-right text-[0.7rem]" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentTable;
