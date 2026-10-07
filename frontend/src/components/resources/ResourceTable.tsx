import React from 'react';
import { ResourceItem, HieuLucType } from '@app-types/resource';
import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';

export interface ResourceTableProps {
  items: ResourceItem[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onViewDetail: (item: ResourceItem) => void;
  onEdit?: (item: ResourceItem) => void;
  onDelete?: (item: ResourceItem) => void;
  onDownloadFile?: (item: ResourceItem) => void;
  onExportExcel?: () => void;
  isExporting?: boolean;
  onPageSizeChange?: (size: number) => void;
  currentCategoryName?: string;
  currentTypeName?: string;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({
  items,
  isLoading = false,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
  onDownloadFile,
  onExportExcel,
  isExporting = false,
  onPageSizeChange,
  currentCategoryName,
  currentTypeName,
}) => {
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

  // Trích xuất tên file từ URL / path
  const getFileName = (url?: string) => {
    if (!url) return 'Tệp đính kèm';
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    return parts[parts.length - 1] || 'Tệp đính kèm';
  };

  // Render Badge trạng thái hiệu lực
  const renderStatusBadge = (hieuLuc: HieuLucType, linkThayThe?: string) => {
    switch (hieuLuc) {
      case 'CON_HIEU_LUC':
        return (
          <Badge variant="success" size="sm" withDot>
            Còn hiệu lực
          </Badge>
        );
      case 'CON_HIEU_LUC_1_PHAN':
        return (
          <Badge variant="info" size="sm" withDot>
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
          <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
            <Badge variant="warning" size="sm" withDot>
              Hết và thay thế
            </Badge>
            {linkThayThe && (
              <a
                href={linkThayThe}
                target="_blank"
                rel="noopener noreferrer"
                className="w-5 h-5 inline-flex items-center justify-center text-xs text-primary hover:text-primary-hover hover:bg-primary/10 rounded transition-colors"
                title="Xem văn bản thay thế"
                onClick={(e) => e.stopPropagation()}
              >
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
              </a>
            )}
          </div>
        );
      default:
        return (
          <Badge variant="secondary" size="sm">
            {hieuLuc}
          </Badge>
        );
    }
  };

  // Tính toán khoảng bản ghi đang hiển thị
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Tạo mảng số trang hiển thị
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
    <div className="w-full space-y-4">
      {/* Thanh công cụ phía trên bảng */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-border-subtle shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-main flex items-center gap-1.5">
              <i className="fa-solid fa-folder-open text-primary" />
              <span>{currentCategoryName || 'Toàn bộ kho tài liệu'}</span>
            </span>
            {currentTypeName && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-primary-subtle text-primary font-semibold border border-primary/20">
                <i className="fa-solid fa-chevron-right text-[8px] opacity-70" />
                <span>{currentTypeName}</span>
              </span>
            )}
          </div>
          <span className="text-xs text-secondary font-medium sm:border-l sm:border-border-subtle sm:pl-2">
            Tổng số: <strong className="text-primary font-bold">{totalCount}</strong> tài liệu
            {startItem > 0 && (
              <span className="text-muted ml-1">
                (Hiển thị {startItem} - {endItem})
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {onExportExcel && (
            <Button
              variant="outline"
              size="sm"
              icon={isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}
              isLoading={isExporting}
              disabled={isExporting}
              onClick={onExportExcel}
              className="text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
            </Button>
          )}

          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <label htmlFor="pageSizeSelect" className="hidden sm:inline">Hiển thị:</label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-2 py-1 bg-surface-elevated text-main text-xs rounded-md border border-border-subtle focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
                <option value={100}>100 dòng</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu chính */}
      <div className="w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-xs">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-surface-elevated text-xs font-bold text-muted uppercase tracking-wider border-b border-border-subtle select-none">
            <tr>
              <th className="px-3.5 py-3.5 text-center w-14 shrink-0">STT</th>
              <th className="px-4 py-3.5 w-40 min-w-[150px] whitespace-nowrap">Ký hiệu</th>
              <th className="px-4 py-3.5 min-w-[280px]">Tiêu đề tài liệu</th>
              <th className="px-4 py-3.5 w-52 min-w-[200px]">Nơi ban hành</th>
              <th className="px-3.5 py-3.5 w-32 min-w-[110px] text-center whitespace-nowrap">Ngày đăng</th>
              <th className="px-4 py-3.5 w-44 min-w-[160px] text-center whitespace-nowrap">Hiệu lực</th>
              <th className="px-3.5 py-3.5 w-32 min-w-[120px] text-center whitespace-nowrap">Tệp đính kèm</th>
              <th className="px-3.5 py-3.5 w-32 min-w-[120px] text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3.5 py-4 text-center">
                    <div className="h-4 w-6 bg-surface-elevated rounded mx-auto" />
                  </td>
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
                    <div className="h-5 w-20 bg-surface-elevated rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-7 w-24 bg-surface-elevated rounded mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-7 w-20 bg-surface-elevated rounded mx-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-surface-elevated text-muted flex items-center justify-center text-2xl">
                      <i className="fa-solid fa-folder-open" />
                    </div>
                    <div className="max-w-sm">
                      <h4 className="text-base font-semibold text-main mb-1">
                        Chưa có tài liệu nào
                      </h4>
                      <p className="text-xs text-secondary">
                        Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại hoặc chưa có dữ liệu được đăng tải.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              // Danh sách dòng tài liệu
              items.map((item, index) => {
                // QUY CHUẨN ĐẶC BIỆT TỪ ĐỀ ÁN:
                // Các dòng tài liệu có trạng thái "Hết hiệu lực" hoặc "Hết hiệu lực và thay thế"
                // phải tự động đổi màu nền tối hơn (dim/muted color) để dễ phân biệt trực quan.
                const isExpired =
                  item.hieu_luc === 'HET_HIEU_LUC' || item.hieu_luc === 'HET_VA_THAY_THE';
                const rowClass = isExpired
                  ? 'bg-slate-100/70 dark:bg-slate-800/60 opacity-75 text-slate-500'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-main';

                const stt = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-fast ${rowClass}`}
                  >
                    {/* STT */}
                    <td className="px-3.5 py-4 text-center align-middle font-medium text-xs text-muted">
                      {stt}
                    </td>

                    {/* Ký hiệu */}
                    <td className="px-4 py-4 align-middle whitespace-nowrap">
                      {item.ky_hieu ? (
                        <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-md bg-surface-elevated text-main font-mono text-xs font-semibold border border-border-subtle shadow-2xs tracking-tight">
                          {item.ky_hieu}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">-</span>
                      )}
                    </td>

                    {/* Tiêu đề & Danh mục */}
                    <td className="px-4 py-4 align-middle">
                      <div
                        className="font-bold text-sm text-main hover:text-primary transition-colors cursor-pointer leading-snug line-clamp-2"
                        onClick={() => onViewDetail(item)}
                        title={item.tieu_de}
                      >
                        {item.tieu_de}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {(!currentCategoryName || currentCategoryName.includes('Toàn bộ')) && item.dm_tai_lieu_name && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-primary-subtle text-primary font-medium border border-primary/20">
                            <i className="fa-solid fa-folder text-[9px]" />
                            {item.dm_tai_lieu_name}
                          </span>
                        )}
                        {item.loai_tai_lieu_names && item.loai_tai_lieu_names.length > 0 &&
                          item.loai_tai_lieu_names.map((tName, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/80 dark:border-blue-800"
                            >
                              <i className="fa-solid fa-folder-tree text-[9px] text-blue-500" />
                              {tName}
                            </span>
                          ))}
                      </div>
                    </td>

                    {/* Nơi ban hành */}
                    <td className="px-4 py-4 align-middle">
                      <div className="text-xs font-medium text-main/90 flex items-center gap-1.5">
                        <i className="fa-regular fa-building text-muted/70 text-[11px] shrink-0" />
                        <span className="leading-snug">{item.noi_ban_hanh || <span className="text-muted">-</span>}</span>
                      </div>
                    </td>

                    {/* Ngày đăng */}
                    <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                      <span className="text-xs text-secondary font-mono inline-flex items-center justify-center gap-1">
                        <i className="fa-regular fa-calendar text-[10px] text-muted/80" />
                        {formatDate(item.ngay_dang)}
                      </span>
                    </td>

                    {/* Trạng thái hiệu lực */}
                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                      {renderStatusBadge(item.hieu_luc, item.link_thay_the)}
                    </td>

                    {/* Tải tệp đính kèm */}
                    <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                      {item.file_dinh_kem ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onDownloadFile) {
                              onDownloadFile(item);
                            } else {
                              window.open(item.file_dinh_kem, '_blank');
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-primary hover:text-white hover:bg-primary bg-primary/10 border border-primary/20 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title={`Tải: ${getFileName(item.file_dinh_kem)}`}
                        >
                          <i className="fa-solid fa-download text-[11px]" />
                          <span>Tải về</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted/60">-</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          className="w-8 h-8 inline-flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                          title="Xem chi tiết"
                        >
                          <i className="fa-solid fa-eye text-sm" />
                        </button>

                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="w-8 h-8 inline-flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
                            title="Chỉnh sửa tài liệu"
                          >
                            <i className="fa-solid fa-pen-to-square text-sm" />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="w-8 h-8 inline-flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                            title="Xóa tài liệu"
                          >
                            <i className="fa-solid fa-trash-can text-sm" />
                          </button>
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

      {/* Thanh phân trang phía dưới bảng */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-secondary">
            Trang <span className="font-semibold text-main">{currentPage}</span> /{' '}
            <span className="font-semibold text-main">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1 select-none">
            {/* Nút Về trang trước */}
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang trước"
            >
              <i className="fa-solid fa-chevron-left text-[11px]" />
            </button>

            {/* Các số trang */}
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
                  className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isActive
                      ? 'bg-primary text-white shadow-xs font-bold border border-primary'
                      : 'border border-border-subtle bg-surface hover:bg-surface-elevated text-secondary hover:text-main'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Nút Sang trang sau */}
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border-subtle bg-surface hover:bg-surface-elevated text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Trang sau"
            >
              <i className="fa-solid fa-chevron-right text-[11px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
