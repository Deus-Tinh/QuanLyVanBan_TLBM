import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DocumentItem, DocumentDetail } from '@app-types/document';
import { Button } from '@components/common/Button';
import { formatDate } from '@lib/dateUtils';
import { authService } from '@lib/authService';
import apiClient from '@lib/apiClient';
import { getAbsoluteFileUrl } from '@lib/fileUtils';
import { resolveDocumentApiUrl } from '@lib/routes';

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
  loai?: 'DEN' | 'DI' | 'MAT';
}

/**
 * Lấy style cho tag "Thay thế cho" đồng bộ tông màu với cột Hiệu lực bên tay phải:
 * - Còn hiệu lực / Hết hiệu lực và thay thế: Màu xanh lá (emerald)
 * - Hiệu lực 1 phần: Màu tím (purple)
 * - Hết hiệu lực: Màu đỏ (rose/danger)
 */
const getReplacementBadgeClass = (hieuLuc?: string) => {
  switch (hieuLuc) {
    case 'CON_HIEU_LUC':
    case 'HET_VA_THAY_THE':
      return {
        badge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
        icon: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'CON_HIEU_LUC_1_PHAN':
      return {
        badge: 'text-purple-700 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30',
        icon: 'text-purple-600 dark:text-purple-400',
      };
    case 'HET_HIEU_LUC':
      return {
        badge: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30',
        icon: 'text-rose-600 dark:text-rose-400',
      };
    default:
      return {
        badge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
        icon: 'text-emerald-600 dark:text-emerald-400',
      };
  }
};

/**
 * Render badge hiển thị văn bản thay thế hoặc bị thay thế.
 * Rút gọn khi 1 văn bản thay thế nhiều văn bản khác: hiển thị số hiệu đầu + "... (+X)"
 * Rê chuột vào sẽ xem đầy đủ tooltip toàn bộ danh sách số hiệu tránh vỡ bảng.
 */
const renderReplacementBadgeGroup = (
  items: string[],
  type: 'thay_the' | 'bi_thay',
  hieuLuc?: string,
  isFallback: boolean = false
) => {
  if (!items || items.length === 0) return null;
  const isThayThe = type === 'thay_the';
  const repStyle = isThayThe ? getReplacementBadgeClass(hieuLuc) : null;
  const count = items.length;

  if (count === 1) {
    const targetSoHieu = items[0];
    const singleTitle = isFallback
      ? `Thay thế cho văn bản: ${targetSoHieu}`
      : isThayThe
      ? `Văn bản này thay thế cho văn bản cũ: ${targetSoHieu}`
      : `Văn bản này đã bị thay thế bởi: ${targetSoHieu}`;

    return (
      <div
        className={
          isThayThe
            ? `inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${repStyle?.badge} max-w-full transition-all duration-150 hover:-translate-y-[0.5px] hover:shadow-xs cursor-default`
            : 'inline-flex items-center gap-1 text-xs font-medium text-warning-text bg-warning/10 px-2 py-0.5 rounded-md border border-warning/30 max-w-full transition-all duration-150 hover:-translate-y-[0.5px] hover:shadow-xs cursor-default'
        }
        title={singleTitle}
      >
        <i
          className={
            isThayThe
              ? `fa-solid fa-repeat text-xs ${repStyle?.icon}`
              : 'fa-solid fa-triangle-exclamation text-warning text-xs'
          }
        />
        <span className="truncate">
          {isThayThe ? 'Thay thế cho: ' : 'Bị thay bởi: '}
          <strong className="font-mono">{targetSoHieu}</strong>
        </span>
      </div>
    );
  }

  // Khi có nhiều hơn 1 văn bản:
  // Nếu 2 văn bản đầu ngắn (tổng <= 20 ký tự), hiển thị cả 2; nếu dài thì hiển thị 1
  const canShowTwo = count >= 2 && items[0].length + items[1].length <= 20;
  const visibleCount = canShowTwo ? 2 : 1;
  const displayedItems = items.slice(0, visibleCount);
  const remainingCount = count - visibleCount;
  const allListStr = items.join(', ');

  const multiTitle = isThayThe
    ? `Văn bản này thay thế cho các văn bản: ${allListStr}`
    : `Văn bản này đã bị thay thế bởi các văn bản: ${allListStr}`;

  return (
    <div
      className={
        isThayThe
          ? `inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${repStyle?.badge} max-w-full transition-all duration-150 hover:-translate-y-[0.5px] hover:shadow-xs cursor-default`
          : 'inline-flex items-center gap-1 text-xs font-medium text-warning-text bg-warning/10 px-2 py-0.5 rounded-md border border-warning/30 max-w-full transition-all duration-150 hover:-translate-y-[0.5px] hover:shadow-xs cursor-default'
      }
      title={multiTitle}
    >
      <i
        className={
          isThayThe
            ? `fa-solid fa-repeat text-xs ${repStyle?.icon}`
            : 'fa-solid fa-triangle-exclamation text-warning text-xs'
        }
      />
      <span className="truncate">
        {isThayThe ? 'Thay thế cho: ' : 'Bị thay bởi: '}
        <strong className="font-mono">{displayedItems.join(', ')}</strong>
      </span>
      {remainingCount > 0 && (
        <span
          className="shrink-0 font-semibold text-[11px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 ml-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/20"
          title={`Còn ${remainingCount} văn bản: ${items.slice(visibleCount).join(', ')}`}
        >
          ... (+{remainingCount})
        </span>
      )}
    </div>
  );
};

/**
 * Định dạng mốc thời gian hiển thị (Đi / Đến / Lưu).
 * Nếu trường ngày có giờ là 00:00:00 (do nhập bằng input date không kèm giờ)
 * và có fallbackDateStr (created_at), hệ thống sẽ mượn giờ:phút:giây từ created_at
 * để bảo đảm không hiển thị "00:00:00" cho người dùng.
 */
const formatDocumentEventTime = (primaryDateStr?: string | null, fallbackDateStr?: string | null): string => {
  if (!primaryDateStr && !fallbackDateStr) return '—';
  const targetStr = primaryDateStr || fallbackDateStr!;
  const d = new Date(targetStr);
  if (isNaN(d.getTime())) return '—';

  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && fallbackDateStr) {
    const fallbackD = new Date(fallbackDateStr);
    if (!isNaN(fallbackD.getTime()) && (fallbackD.getHours() !== 0 || fallbackD.getMinutes() !== 0 || fallbackD.getSeconds() !== 0)) {
      d.setHours(fallbackD.getHours(), fallbackD.getMinutes(), fallbackD.getSeconds());
    }
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  totalCount,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
  onViewDetail,
  onViewHistory,
  onEdit,
  onDelete,
  isConfidential = false,
  loai = 'DEN',
}) => {
  // Lấy thông tin phiên làm việc hiện tại để phân quyền hiển thị tác vụ
  const currentSession = useMemo(() => authService.getSession(), []);

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

  // Mở tệp đính kèm trực tiếp trong tab mới
  const handleOpenAttachment = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    if (doc.first_attachment_url) {
      const fullUrl = getAbsoluteFileUrl(doc.first_attachment_url);
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const apiUrl = resolveDocumentApiUrl(doc.id, loai || doc.loai);
      const res = await apiClient.get<DocumentDetail>(apiUrl);
      if (res && res.attachments && res.attachments.length > 0 && res.attachments[0].file) {
        const fullUrl = getAbsoluteFileUrl(res.attachments[0].file);
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      } else {
        onViewDetail(doc.id);
      }
    } catch {
      onViewDetail(doc.id);
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-xl shadow-sm overflow-hidden transition-all duration-normal">
      {/* Bảng Dữ Liệu */}
      <div className="overflow-x-auto min-h-[380px] pb-24">
        <table className="w-full text-left text-sm border-separate border-spacing-0 min-w-[950px]">
          <thead>
            <tr className="bg-surface-elevated/70 text-xs font-bold text-muted uppercase tracking-wider border-b border-border-subtle">
              <th className="px-4 py-3 text-center w-16">{loai === 'MAT' ? 'STT' : loai === 'DI' ? 'Số đi' : 'Số đến'}</th>
              <th className="px-4 py-3 w-40">Số, ký hiệu</th>
              <th className="px-4 py-3 w-48">Mốc thời gian</th>
              <th className="px-4 py-3 min-w-[280px]">Trích yếu nội dung</th>
              <th className="px-4 py-3 w-48">{loai === 'DI' || loai === 'MAT' ? 'Người ký' : 'Nơi ban hành'}</th>
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
                      {loai === 'MAT' ? 'Không tìm thấy văn bản mật nào' : loai === 'DI' ? 'Không tìm thấy văn bản đi nào' : 'Không tìm thấy văn bản đến nào'}
                    </span>
                    <span className="text-xs text-muted max-w-sm">
                      Không có văn bản nào phù hợp với điều kiện tìm kiếm. Hãy thử chọn năm khác hoặc đặt lại bộ lọc.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              /* Danh sách văn bản */
              documents.map((doc, index) => {
                const isExpired = doc.hieu_luc === 'HET_HIEU_LUC';
                const isActiveRow = activeMenuId === doc.id;
                const isNearBottom = documents.length >= 5 && index >= documents.length - 2 && index >= 3;

                // Phân quyền sửa & xóa văn bản:
                // 1. Văn bản Mật (MAT): CHỈ Admin mới có quyền Sửa và Xóa. Mọi cán bộ khác (kể cả người tạo) chỉ có quyền Xem (Read-Only).
                // 2. Văn bản Đến/Đi hết hiệu lực: CHỈ Admin mới có quyền Sửa và Xóa. Cán bộ chỉ định chỉ có quyền Xem.
                // 3. Văn bản Đến/Đi còn hiệu lực: Admin và Cán bộ được chỉ định (người tạo) có cả quyền Sửa và Xóa. Cán bộ thường chỉ có quyền Xem.
                const isDocConfidential = isConfidential || doc.pham_vi === 'HAN_CHE' || doc.loai === 'MAT' || loai === 'MAT';
                const isAdmin =
                  currentSession?.role === 'admin' ||
                  currentSession?.username === 'admin';
                const isCreator = Boolean(
                  currentSession?.username &&
                  doc.nguoi_tao_username &&
                  currentSession.username === doc.nguoi_tao_username
                );

                let defaultCanEdit = false;
                let defaultCanDelete = false;

                if (!currentSession) {
                  // Fallback khi không có session đăng nhập (ví dụ môi trường test component độc lập):
                  // Cho phép tác vụ trên văn bản Đến/Đi còn hiệu lực
                  if (!isDocConfidential && !isExpired) {
                    defaultCanEdit = true;
                    defaultCanDelete = true;
                  }
                } else if (isAdmin) {
                  defaultCanEdit = true;
                  defaultCanDelete = true;
                } else if (!isDocConfidential && isCreator && !isExpired) {
                  // Cán bộ được chỉ định trên văn bản Đến/Đi còn hiệu lực
                  defaultCanEdit = true;
                  defaultCanDelete = true;
                }

                let userCanEdit = doc.can_edit !== undefined ? doc.can_edit : defaultCanEdit;
                let userCanDelete = doc.can_delete !== undefined ? doc.can_delete : defaultCanDelete;

                // Văn bản Mật (Bảo mật nghiêm ngặt): Tuyệt đối CHỈ Admin mới có quyền Sửa và Xóa. Cán bộ chỉ có quyền Xem.
                if (isDocConfidential && !isAdmin) {
                  userCanEdit = false;
                  userCanDelete = false;
                }

                const canEdit = Boolean(onEdit) && userCanEdit;
                const canDelete = Boolean(onDelete) && userCanDelete;

                // Tông màu hàng theo yêu cầu:
                // - Toàn bộ hàng trắng đồng nhất, di chuột vào sáng trắng/xám nhẹ
                // - Trừ văn bản hết hiệu lực để màu xám cho dễ nhận biết
                const rowHighlightClass = isExpired
                  ? 'bg-slate-100/90 dark:bg-slate-800/40 text-muted hover:bg-slate-200/90 hover:shadow-md hover:relative hover:z-20 hover:-translate-y-[1px]'
                  : 'bg-white dark:bg-surface hover:bg-blue-50/80 dark:hover:bg-slate-800/80 hover:shadow-[0_6px_20px_rgba(37,99,235,0.09)] dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)] hover:-translate-y-[1.5px] hover:relative hover:z-20';

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onViewDetail(doc.id)}
                    className={`${rowHighlightClass} cursor-pointer transition-all duration-150 ease-out group ${
                      isActiveRow ? 'relative z-30 ring-2 ring-primary/40' : ''
                    }`}
                    title="Bấm vào hàng để xem chi tiết văn bản"
                  >
                    {/* 1. Số đến / STT */}
                    <td className="px-4 py-3.5 text-center font-bold text-primary whitespace-nowrap text-sm">
                      {loai === 'MAT' ? (
                        <span className="text-primary font-bold text-sm">#{doc.so_thu_tu ? doc.so_thu_tu : (page - 1) * pageSize + index + 1}</span>
                      ) : (
                        doc.so_thu_tu ? `#${doc.so_thu_tu}` : '—'
                      )}
                    </td>

                    {/* 2. Số, ký hiệu */}
                    <td className="px-4 py-3.5 font-semibold text-main whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetail(doc.id)}
                          className="text-left font-semibold text-main group-hover:text-primary transition-colors flex items-center gap-1.5"
                          title="Bấm để xem chi tiết văn bản"
                        >
                          <i className="fa-solid fa-file-contract text-primary/70 group-hover:text-primary group-hover:scale-110 text-xs shrink-0 transition-transform duration-150" />
                          <span>{doc.so_hieu}</span>
                        </button>
                        {doc.pham_vi === 'HAN_CHE' && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0 transition-all duration-150 hover:-translate-y-[0.5px] hover:shadow-xs cursor-default"
                            title="Văn bản hạn chế (Bảo mật)"
                          >
                            <i className="fa-solid fa-shield-halved text-[11px] text-rose-600 dark:text-rose-400" />
                            <span>Hạn chế</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Mốc thời gian (Đồng bộ đẹp 14px: Đi/Đến/Lưu & Ký ngày) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {loai === 'DI' ? (
                        <div className="text-sm font-semibold text-main flex items-center gap-1.5">
                          <i className="fa-regular fa-clock text-primary text-xs" />
                          <span>Đi: {formatDocumentEventTime(doc.ngay_ban_hanh, doc.created_at)}</span>
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-main flex items-center gap-1.5">
                          <i className="fa-regular fa-clock text-primary text-xs" />
                          <span>{loai === 'MAT' ? 'Lưu: ' : 'Đến: '}{formatDocumentEventTime(doc.ngay_den || doc.ngay_ban_hanh, doc.created_at)}</span>
                        </div>
                      )}
                      <div className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
                        <i className="fa-regular fa-calendar text-muted text-xs" />
                        <span>Ký ngày: {formatDate(doc.ngay_van_ban)}</span>
                      </div>
                    </td>

                    {/* 4. Trích yếu nội dung */}
                    <td className="px-4 py-3.5">
                      <div
                        className="line-clamp-2 text-main group-hover:text-primary dark:group-hover:text-blue-300 text-sm leading-relaxed transition-colors"
                        title={doc.trich_yeu}
                      >
                        {doc.trich_yeu}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {doc.attachment_count > 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenAttachment(e, doc)}
                            className="inline-flex items-center gap-1.5 text-xs text-main dark:text-slate-200 bg-surface-elevated hover:bg-surface-elevated/90 px-2.5 py-0.5 rounded-md border border-border-subtle hover:border-border transition-colors cursor-pointer"
                            title="Bấm để mở xem tệp đính kèm trong tab mới"
                          >
                            <i className="fa-solid fa-paperclip text-xs text-secondary" />
                            <span>{doc.attachment_count} tệp đính kèm</span>
                            <i className="fa-solid fa-arrow-up-right-from-square text-[0.65rem] text-secondary" />
                          </button>
                        )}
                        {(() => {
                          const hasDirectionalData = Boolean(
                            (doc.thay_the_cho && doc.thay_the_cho.length > 0) ||
                            (doc.bi_thay_boi && doc.bi_thay_boi.length > 0)
                          );

                          if (hasDirectionalData) {
                            return (
                              <>
                                {/* 1. Các văn bản mà tài liệu này đi thay thế */}
                                {renderReplacementBadgeGroup(doc.thay_the_cho || [], 'thay_the', doc.hieu_luc)}

                                {/* 2. Các văn bản mới đã đến thay thế tài liệu này */}
                                {renderReplacementBadgeGroup(doc.bi_thay_boi || [], 'bi_thay')}
                              </>
                            );
                          }

                          // Fallback khi chưa có dữ liệu 2 chiều
                          const repList: string[] = (doc.danh_sach_thay_the && doc.danh_sach_thay_the.length > 0)
                            ? doc.danh_sach_thay_the
                            : (doc.link_thay_the ? doc.link_thay_the.split(',').map((s) => s.trim()).filter(Boolean) : []);

                          if (repList.length === 0) return null;

                          return renderReplacementBadgeGroup(repList, 'thay_the', doc.hieu_luc, true);
                        })()}
                      </div>
                    </td>

                    {/* 5. Nơi ban hành / Người ký (Nâng lên 14px) */}
                    <td className="px-4 py-3.5 text-sm text-secondary whitespace-nowrap">
                      {loai === 'DI' || loai === 'MAT' ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-main text-sm" title={doc.nguoi_ky || ''}>
                            <i className="fa-solid fa-pen-nib text-primary/70 text-xs" />
                            <span>{doc.nguoi_ky || '—'}</span>
                          </div>
                          {doc.chuc_vu && (
                            <div className="text-sm text-muted mt-0.5 pl-4 truncate max-w-[180px]" title={doc.chuc_vu}>
                              {doc.chuc_vu}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm" title={doc.noi_ban_hanh || ''}>
                          <i className="fa-solid fa-building-columns text-muted text-xs" />
                          <span className="truncate max-w-[180px]">{doc.noi_ban_hanh || '—'}</span>
                        </div>
                      )}
                    </td>

                    {/* 6. Trạng thái Hiệu lực (Badge nâng lên 14px) */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {doc.hieu_luc === 'CON_HIEU_LUC' && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Còn hiệu lực
                          </span>
                          {doc.ngay_het_hieu_luc && (
                            <div className="text-sm text-muted mt-0.5" title={`Hết hạn vào: ${formatDate(doc.ngay_het_hieu_luc)}`}>
                              Hết hạn: {formatDate(doc.ngay_het_hieu_luc)}
                            </div>
                          )}
                        </div>
                      )}
                      {doc.hieu_luc === 'CON_HIEU_LUC_1_PHAN' && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Còn hiệu lực 1 phần
                          </span>
                          {doc.ngay_het_hieu_luc && (
                            <div className="text-sm text-muted mt-0.5" title={`Hết hạn vào: ${formatDate(doc.ngay_het_hieu_luc)}`}>
                              Hết hạn: {formatDate(doc.ngay_het_hieu_luc)}
                            </div>
                          )}
                        </div>
                      )}
                      {(doc.hieu_luc === 'HET_HIEU_LUC' || doc.hieu_luc === 'HET_VA_THAY_THE') && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Hết hiệu lực
                          </span>
                          {doc.ngay_het_hieu_luc && (
                            <div className="text-sm text-danger/80 font-medium mt-0.5" title={`Đã hết hạn từ: ${formatDate(doc.ngay_het_hieu_luc)}`}>
                              Hết hạn: {formatDate(doc.ngay_het_hieu_luc)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 7. Tác vụ: Menu 3 chấm ⋮ */}
                    <td
                      className={`px-4 py-3.5 text-center relative ${isActiveRow ? 'z-50' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
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
                          <div
                            className={`absolute right-3 ${isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                              } w-52 bg-surface-elevated border border-border-subtle rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 select-none`}
                          >
                            {/* 1. Nút Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewDetail(doc.id);
                              }}
                              className="w-full text-left px-3.5 py-2 text-sm text-main hover:bg-primary-subtle hover:text-primary flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <i className="fa-solid fa-eye text-primary w-4 text-xs" />
                              <span>Xem chi tiết</span>
                            </button>

                            {/* 2. Nút Lịch sử xem */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewHistory(doc.id);
                              }}
                              className="w-full text-left px-3.5 py-2 text-sm text-main hover:bg-info-subtle hover:text-info flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <i className="fa-solid fa-clock-rotate-left text-info w-4 text-xs" />
                              <span>Lịch sử xem</span>
                            </button>

                            {/* 3. Nút Chỉnh sửa */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit!(doc);
                                }}
                                className="w-full text-left px-3.5 py-2 text-sm text-main hover:bg-warning-subtle hover:text-warning-text flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <i className="fa-solid fa-pen-to-square text-warning-text w-4 text-xs" />
                                <span>Chỉnh sửa</span>
                              </button>
                            )}

                            {/* 5. Nút Xóa văn bản */}
                            {canDelete && (
                              <>
                                <div className="border-t border-border-subtle/50 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onDelete!(doc.id, doc.so_hieu);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-sm text-danger hover:bg-danger-subtle flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <i className="fa-solid fa-trash-can w-4 text-xs" />
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
      <div className="px-4 py-3 border-t border-border-subtle bg-surface-elevated/40 flex flex-wrap items-center justify-between gap-3 text-sm">
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
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all ${page === p
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
