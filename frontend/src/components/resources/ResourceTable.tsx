import React, { useState, useEffect, useRef } from 'react';
import { ResourceItem, HieuLucType } from '@app-types/resource';
import { Badge } from '@components/common/Badge';

export interface ResourceTableProps {
  items: ResourceItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onViewDetail: (item: ResourceItem) => void;
  onEdit?: (item: ResourceItem) => void;
  onDelete?: (item: ResourceItem) => void;
  onDownloadFile?: (item: ResourceItem, fileName?: string, filePath?: string) => void;
  onPageSizeChange?: (size: number) => void;
  onClearFilters?: () => void;
  // Khi bấm dòng: chuyển sang xem Thư mục/Loại tài liệu của mục đó
  onDrillDown?: (categoryId: number, typeId?: number) => void;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({
  items,
  isLoading = false,
  error = null,
  onRetry,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
  onDownloadFile,
  onPageSizeChange,
  onClearFilters,
  onDrillDown,
}) => {
  // Dropdown menu "⋯" theo từng dòng
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  // Vị trí fixed của dropdown menu — giải quyết lỗi bị clip bởi overflow-x-auto
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  // Dropdown danh sách tệp cho dòng có nhiều tệp
  const [activeFileMenuId, setActiveFileMenuId] = useState<number | null>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-root]')) {
        setActiveMenuId(null);
        setMenuPos(null);
        setActiveFileMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Mở menu ⋯ với vị trí fixed (không bị cắt bởi overflow)
  const openActionMenu = (e: React.MouseEvent<HTMLButtonElement>, itemId: number) => {
    e.stopPropagation();
    if (activeMenuId === itemId) {
      setActiveMenuId(null);
      setMenuPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    });
    setActiveMenuId(itemId);
  };

  // Format ngày dd/mm/yyyy
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format dung lượng tệp
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  };

  // Trích xuất đuôi tệp
  const getFileExt = (urlOrName?: string) => {
    if (!urlOrName) return 'FILE';
    const clean = urlOrName.split('?')[0];
    const parts = clean.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return 'FILE';
  };

  // Lấy icon font-awesome theo đuôi file
  const getFileIcon = (ext: string) => {
    switch (ext) {
      case 'PDF':
        return 'fa-file-pdf text-rose-500';
      case 'DOC':
      case 'DOCX':
        return 'fa-file-word text-blue-500';
      case 'XLS':
      case 'XLSX':
        return 'fa-file-excel text-emerald-500';
      case 'ZIP':
      case 'RAR':
      case '7Z':
        return 'fa-file-zipper text-amber-500';
      case 'JPG':
      case 'JPEG':
      case 'PNG':
        return 'fa-file-image text-purple-500';
      default:
        return 'fa-file-lines text-secondary';
    }
  };

  // Badge trạng thái hiệu lực
  const renderStatusBadge = (hieuLuc: HieuLucType) => {
    switch (hieuLuc) {
      case 'CON_HIEU_LUC':
        return (
          <Badge variant="success" size="sm" withDot>
            Còn hiệu lực
          </Badge>
        );
      case 'CON_HIEU_LUC_1_PHAN':
        return (
          <Badge variant="warning" size="sm" withDot>
            Còn hiệu lực 1 phần
          </Badge>
        );
      case 'HET_HIEU_LUC':
        return (
          <Badge variant="danger" size="sm" withDot>
            Hết hiệu lực
          </Badge>
        );
      case 'HET_VA_THAY_THE':
        return (
          <Badge variant="warning" size="sm" withDot>
            Hết và thay thế
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" size="sm">
            {hieuLuc}
          </Badge>
        );
    }
  };

  // Danh sách trang cho thanh phân trang
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="w-full space-y-3" ref={tableContainerRef}>
      {/* Khung Bảng dữ liệu chính */}
      <div className="w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-xs">
        <table className="w-full text-left text-sm border-collapse min-w-[850px]">
          <thead className="bg-surface-elevated text-xs font-bold text-muted uppercase tracking-wider border-b border-border-subtle select-none">
            <tr>
              <th className="px-4 py-3.5 w-36 min-w-[130px] whitespace-nowrap">Ký hiệu</th>
              <th className="px-4 py-3.5 min-w-[260px]">Tiêu đề</th>
              <th className="px-4 py-3.5 w-48 min-w-[170px]">Nơi ban hành</th>
              <th className="px-3.5 py-3.5 w-32 min-w-[110px] text-center whitespace-nowrap">Ngày đăng</th>
              <th className="px-4 py-3.5 w-44 min-w-[150px] text-center whitespace-nowrap">Hiệu lực</th>
              <th className="px-3.5 py-3.5 w-40 min-w-[140px] text-center whitespace-nowrap">Tệp</th>
              <th className="px-3.5 py-3.5 w-20 min-w-[80px] text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              // Trạng thái Loading (Skeleton)
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 bg-surface-elevated rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-3/4 bg-surface-elevated rounded mb-1.5" />
                    <div className="h-3 w-1/3 bg-surface-elevated rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-28 bg-surface-elevated rounded" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-4 w-16 bg-surface-elevated rounded mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-5 w-24 bg-surface-elevated rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-7 w-20 bg-surface-elevated rounded mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-7 w-8 bg-surface-elevated rounded mx-auto" />
                  </td>
                </tr>
              ))
            ) : error ? (
              // Trạng thái Lỗi
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-danger-subtle text-danger flex items-center justify-center text-2xl">
                      <i className="fa-solid fa-triangle-exclamation" />
                    </div>
                    <div className="max-w-sm space-y-1">
                      <h4 className="text-base font-semibold text-main">{error}</h4>
                      <p className="text-xs text-secondary">
                        Đã có lỗi xảy ra khi tải danh sách tài liệu. Vui lòng thử lại.
                      </p>
                    </div>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-rotate-right text-[11px]" />
                        <span>Thử lại</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              // Trạng thái Rỗng
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-surface-elevated text-muted flex items-center justify-center text-2xl">
                      <i className="fa-solid fa-folder-open" />
                    </div>
                    <div className="max-w-sm space-y-1">
                      <h4 className="text-base font-semibold text-main">
                        Không có tài liệu phù hợp
                      </h4>
                      <p className="text-xs text-secondary">
                        Thử điều chỉnh từ khóa hoặc xóa các bộ lọc để xem toàn bộ tài liệu trong thư mục.
                      </p>
                    </div>
                    {onClearFilters && (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-subtle text-primary border border-primary/30 hover:bg-primary/15 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-rotate-left text-[11px]" />
                        <span>Xóa bộ lọc</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Danh sách dòng tài liệu
              items.map((item) => {
                // RÀNG BUỘC ĐẶC BIỆT: HẾT HIỆU LỰC / HẾT VÀ THAY THẾ LÀM MỜ TOÀN BỘ DÒNG
                const isExpired =
                  item.hieu_luc === 'HET_HIEU_LUC' || item.hieu_luc === 'HET_VA_THAY_THE';

                const rowClass = isExpired
                  ? 'bg-slate-100/70 dark:bg-slate-800/60 opacity-60 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/80'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-main';

                const ext = getFileExt(item.file_dinh_kem);
                const hasMultipleFiles = Boolean(item.attachments && item.attachments.length > 1);

                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      // Bấm dòng → Drill-down vào thư mục + loại tài liệu của mục đó
                      if (onDrillDown) {
                        const firstType = item.loai_tai_lieu?.[0];
                        onDrillDown(item.dm_tai_lieu, firstType);
                      }
                    }}
                    className={`transition-colors duration-fast cursor-pointer select-none ${rowClass}`}
                    title="Bấm để đi vào thư mục của tài liệu"
                  >
                    {/* Cột 1: Ký hiệu (monospace thường, không viền/pill) */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <span className="font-mono text-xs text-secondary font-medium">
                        {item.ky_hieu || '-'}
                      </span>
                    </td>

                    {/* Cột 2: Tiêu đề + Loại tài liệu + Link thay thế */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="font-semibold text-sm text-main hover:text-primary transition-colors leading-snug line-clamp-2">
                        {item.tieu_de}
                      </div>

                      {/* Danh sách Loại tài liệu dạng tag nhỏ */}
                      {item.loai_tai_lieu_names && item.loai_tai_lieu_names.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {item.loai_tai_lieu_names.map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-surface-elevated text-secondary border border-border-subtle/60"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dòng Link thay thế dưới tiêu đề nếu Hết và thay thế */}
                      {item.hieu_luc === 'HET_VA_THAY_THE' && item.link_thay_the && (
                        <div className="mt-1.5 opacity-100">
                          <a
                            href={item.link_thay_the}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium hover:text-primary-hover"
                            title="Mở văn bản thay thế mới"
                          >
                            <span>&rarr; Xem văn bản thay thế</span>
                            <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Cột 3: Nơi ban hành */}
                    <td className="px-4 py-3.5 align-middle text-xs text-secondary">
                      {item.noi_ban_hanh || '-'}
                    </td>

                    {/* Cột 4: Ngày đăng (dd/mm/yyyy thường, bỏ icon) */}
                    <td className="px-3.5 py-3.5 text-center align-middle whitespace-nowrap text-xs text-secondary">
                      {formatDate(item.ngay_dang)}
                    </td>

                    {/* Cột 5: Hiệu lực (Badge giữ độ nét 100%) */}
                    <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap opacity-100">
                      {renderStatusBadge(item.hieu_luc)}
                    </td>

                    {/* Cột 6: Tệp đính kèm */}
                    <td
                      className="px-3.5 py-3.5 text-center align-middle whitespace-nowrap opacity-100"
                      onClick={(e) => e.stopPropagation()}
                      data-dropdown-root
                    >
                      {hasMultipleFiles ? (
                        // Trường hợp nhiều tệp: hiện badge số tệp và dropdown tải từng tệp
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveFileMenuId(activeFileMenuId === item.id ? null : item.id)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-elevated hover:bg-border-subtle/50 text-main border border-border-subtle transition-colors cursor-pointer"
                            title="Xem danh sách tệp đính kèm"
                            aria-label={`Có ${item.attachments?.length} tệp đính kèm`}
                          >
                            <i className="fa-solid fa-paperclip text-primary text-[11px]" />
                            <span>{item.attachments?.length} tệp</span>
                            <i className="fa-solid fa-chevron-down text-[9px] text-muted" />
                          </button>

                          {activeFileMenuId === item.id && (
                            <div className="absolute right-0 mt-1 w-64 rounded-xl bg-surface border border-border-subtle shadow-lg z-20 py-1.5 animate-fade-in text-left">
                              <div className="px-3 py-1.5 text-[11px] font-bold text-muted border-b border-border-subtle uppercase">
                                Danh sách tệp đính kèm
                              </div>
                              <div className="max-h-48 overflow-y-auto divide-y divide-border-subtle/50">
                                {item.attachments?.map((att, attIdx) => {
                                  const attExt = getFileExt(att.name || att.path);
                                  return (
                                    <div
                                      key={attIdx}
                                      className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-surface-elevated transition-colors text-xs"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <i className={`fa-solid ${getFileIcon(attExt)} text-sm shrink-0`} />
                                        <span className="truncate text-main font-medium" title={att.name}>
                                          {att.name}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => onDownloadFile?.(item, att.name, att.path)}
                                        className="shrink-0 p-1 text-primary hover:text-primary-hover hover:bg-primary-subtle rounded transition-colors"
                                        title="Tải về"
                                        aria-label={`Tải về ${att.name}`}
                                      >
                                        <i className="fa-solid fa-download text-xs" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : item.file_dinh_kem ? (
                        // Trường hợp 1 tệp: hiện icon + Ext + nút Tải về
                        <div className="inline-flex items-center gap-1.5 text-xs">
                          <i className={`fa-solid ${getFileIcon(ext)} text-sm`} />
                          <span className="font-semibold text-secondary text-[11px]">{ext}</span>
                          <button
                            type="button"
                            onClick={() => onDownloadFile?.(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary-hover hover:bg-primary-subtle rounded-md transition-colors cursor-pointer ml-1"
                            title="Tải về tệp đính kèm"
                            aria-label={`Tải về tệp ${ext}`}
                          >
                            <i className="fa-solid fa-download text-[11px]" />
                            <span>Tải về</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-xs italic">-</span>
                      )}
                    </td>

                    {/* Cột 7: Thao tác — Menu "⋯": Xem chi tiết, Chỉnh sửa, Xóa */}
                    <td
                      className="px-3.5 py-3.5 text-center align-middle whitespace-nowrap opacity-100"
                      onClick={(e) => e.stopPropagation()}
                      data-dropdown-root
                    >
                      <div className="relative inline-block text-left" data-dropdown-root>
                        <button
                          type="button"
                          onClick={(e) => openActionMenu(e, item.id)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors cursor-pointer"
                          title="Thao tác"
                          aria-label={`Thao tác với tài liệu ${item.ky_hieu || item.tieu_de}`}
                          aria-haspopup="true"
                          aria-expanded={activeMenuId === item.id}
                        >
                          <i className="fa-solid fa-ellipsis text-sm" />
                        </button>
                      </div>

                      {/* Dropdown fixed — render bên ngoài overflow container qua portal style */}
                      {activeMenuId === item.id && menuPos && (
                        <div
                          data-dropdown-root
                          className="fixed z-50 w-44 rounded-xl bg-surface border border-border-subtle shadow-xl py-1 animate-fade-in text-left"
                          style={{ top: menuPos.top, right: menuPos.right }}
                        >
                          {/* Mục 1: Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setMenuPos(null);
                              onViewDetail(item);
                            }}
                            className="w-full px-3 py-2 text-xs text-left text-main hover:bg-surface-elevated flex items-center gap-2 transition-colors cursor-pointer"
                            aria-label="Xem chi tiết tài liệu"
                          >
                            <i className="fa-solid fa-eye text-muted text-xs" />
                            <span>Xem chi tiết</span>
                          </button>

                          {/* Mục 2: Truy cập Thư mục + Loại */}
                          {onDrillDown && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setMenuPos(null);
                                const firstType = item.loai_tai_lieu?.[0];
                                onDrillDown(item.dm_tai_lieu, firstType);
                              }}
                              className="w-full px-3 py-2 text-xs text-left text-main hover:bg-surface-elevated flex items-center gap-2 transition-colors cursor-pointer"
                              aria-label="Truy cập thư mục của tài liệu"
                            >
                              <i className="fa-solid fa-folder-open text-primary text-xs" />
                              <span className="text-primary font-medium">Vào Thư mục</span>
                            </button>
                          )}

                          {/* Phân cách trước nhóm chỉnh sửa/xóa */}
                          {(onEdit || onDelete) && (
                            <div className="my-1 border-t border-border-subtle" />
                          )}

                          {/* Mục 3: Chỉnh sửa */}
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setMenuPos(null);
                                onEdit(item);
                              }}
                              className="w-full px-3 py-2 text-xs text-left text-main hover:bg-surface-elevated flex items-center gap-2 transition-colors cursor-pointer"
                              aria-label="Chỉnh sửa tài liệu"
                            >
                              <i className="fa-solid fa-pen-to-square text-muted text-xs" />
                              <span>Chỉnh sửa</span>
                            </button>
                          )}

                          {/* Mục 4: Xóa tài liệu */}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setMenuPos(null);
                                onDelete(item);
                              }}
                              className="w-full px-3 py-2 text-xs text-left text-danger hover:bg-danger-subtle flex items-center gap-2 transition-colors cursor-pointer font-medium"
                              aria-label="Xóa tài liệu"
                            >
                              <i className="fa-solid fa-trash-can text-danger text-xs" />
                              <span>Xóa tài liệu</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Chân bảng: Chọn số dòng hiển thị + Thanh phân trang */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-secondary">
        {/* Bên trái chân bảng: Dropdown chọn số dòng */}
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="px-2 py-1 bg-surface border border-border-subtle rounded-md text-main text-xs focus:outline-hidden focus:border-primary cursor-pointer"
            aria-label="Chọn số dòng hiển thị trên mỗi trang"
          >
            <option value={5}>5 dòng</option>
            <option value={10}>10 dòng</option>
            <option value={20}>20 dòng</option>
            <option value={50}>50 dòng</option>
          </select>
          <span>/ trang</span>
        </div>

        {/* Bên phải chân bảng: Phân trang (Trước / 1 2 3 / Sau) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 select-none">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang trước"
              aria-label="Trang trước"
            >
              <i className="fa-solid fa-chevron-left text-[11px]" />
            </button>

            {getPageNumbers().map((p, i) => {
              if (p === '...') {
                return (
                  <span key={`dots-${i}`} className="px-2 py-1 text-xs text-muted font-bold">
                    ...
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  disabled={isLoading}
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-xs font-bold border border-primary'
                      : 'border border-border-subtle bg-surface hover:bg-surface-elevated text-secondary hover:text-main'
                  }`}
                  aria-label={`Trang ${pageNum}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang sau"
              aria-label="Trang sau"
            >
              <i className="fa-solid fa-chevron-right text-[11px]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
