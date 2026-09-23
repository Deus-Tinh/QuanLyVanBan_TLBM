import React, { useEffect } from 'react';
import { ResourceItem, HieuLucType } from '@app-types/resource';
import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';

export interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ResourceItem | null;
  onDownloadFile?: (item: ResourceItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onDownloadFile,
}) => {
  // Lắng nghe phím ESC để đóng Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

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

  // Trích xuất tên tệp
  const getFileName = (url?: string) => {
    if (!url) return 'Tệp đính kèm';
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    return parts[parts.length - 1] || 'Tệp đính kèm';
  };

  // Lấy icon tương ứng với đuôi file
  const getFileIcon = (url?: string) => {
    if (!url) return 'fa-file';
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'fa-file-pdf text-red-500';
      case 'doc':
      case 'docx':
        return 'fa-file-word text-blue-500';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel text-emerald-500';
      case 'zip':
      case 'rar':
      case '7z':
        return 'fa-file-zipper text-amber-500';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'fa-file-image text-purple-500';
      default:
        return 'fa-file-lines text-secondary';
    }
  };

  // Render Badge trạng thái hiệu lực
  const renderStatusBadge = (hieuLuc: HieuLucType) => {
    switch (hieuLuc) {
      case 'CON_HIEU_LUC':
        return (
          <Badge variant="success" size="md" withDot>
            Còn hiệu lực
          </Badge>
        );
      case 'HET_HIEU_LUC':
        return (
          <Badge variant="danger" size="md" withDot>
            Hết hiệu lực
          </Badge>
        );
      case 'HET_VA_THAY_THE':
        return (
          <Badge variant="warning" size="md" withDot>
            Hết hiệu lực và thay thế
          </Badge>
        );
      default:
        return <Badge variant="secondary" size="md">{hieuLuc}</Badge>;
    }
  };

  const fileName = getFileName(item.file_dinh_kem);
  const fileIcon = getFileIcon(item.file_dinh_kem);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl border border-border-subtle shadow-xl flex flex-col overflow-hidden animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal - Cố định ở trên cùng */}
        <div className="flex items-center justify-between px-[27px] py-[21px] border-b border-border-subtle bg-surface shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary flex items-center justify-center text-base">
              <i className="fa-solid fa-file-lines" />
            </div>
            <div>
              <h3 className="text-base font-bold text-main leading-tight">
                Chi tiết Tài liệu & Biểu mẫu
              </h3>
              <p className="text-xs text-muted">ID văn bản: #{item.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Nội dung chi tiết - Vùng cuộn riêng */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Tiêu đề chính */}
          <div className="bg-surface-elevated p-4 rounded-xl border border-border-subtle/80">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
              Tiêu đề tài liệu
            </span>
            <h2 className="text-lg font-bold text-main leading-snug">
              {item.tieu_de}
            </h2>
          </div>

          {/* Khung 2 cột */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cột 1: Thông tin phân loại và ban hành */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider border-b border-border-subtle pb-2">
                Thông tin phân loại & Ban hành
              </h4>

              <div>
                <label className="text-xs text-muted block mb-0.5">Số ký hiệu:</label>
                <div className="font-mono text-sm font-semibold text-main">
                  {item.ky_hieu || <span className="text-muted font-sans font-normal italic">Không có</span>}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-0.5">Danh mục Cấp 1:</label>
                <div className="text-sm font-semibold text-main">
                  {item.dm_tai_lieu_name || `Danh mục #${item.dm_tai_lieu}`}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Loại tài liệu Cấp 2:</label>
                <div className="flex flex-wrap gap-1.5">
                  {item.loai_tai_lieu_names && item.loai_tai_lieu_names.length > 0 ? (
                    item.loai_tai_lieu_names.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded-md bg-surface-elevated border border-border-subtle text-secondary"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted italic">Không có phân loại con</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-0.5">Nơi ban hành:</label>
                <div className="text-sm text-main">
                  {item.noi_ban_hanh || <span className="text-muted italic">Không có thông tin</span>}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-0.5">Người đăng / Người lập:</label>
                <div className="text-sm text-main flex items-center gap-1.5">
                  <i className="fa-solid fa-user-circle text-muted text-xs" />
                  <span>{item.nguoi_tao_name || 'Hệ thống'}</span>
                </div>
              </div>
            </div>

            {/* Cột 2: Hiệu lực và Pháp lý */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider border-b border-border-subtle pb-2">
                Hiệu lực & Phạm vi áp dụng
              </h4>

              <div>
                <label className="text-xs text-muted block mb-1">Trạng thái hiệu lực:</label>
                <div>{renderStatusBadge(item.hieu_luc)}</div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-0.5">Ngày đăng / Ngày ban hành:</label>
                <div className="text-sm font-mono text-main">
                  {formatDate(item.ngay_dang)}
                </div>
              </div>

              {item.ngay_het_hieu_luc && (
                <div>
                  <label className="text-xs text-muted block mb-0.5">Ngày hết hiệu lực:</label>
                  <div className="text-sm font-mono text-danger font-medium">
                    {formatDate(item.ngay_het_hieu_luc)}
                  </div>
                </div>
              )}

              {item.link_thay_the && (
                <div>
                  <label className="text-xs text-muted block mb-0.5">Văn bản thay thế:</label>
                  <a
                    href={item.link_thay_the}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 break-all font-medium"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                    <span>{item.link_thay_the}</span>
                  </a>
                </div>
              )}

              <div>
                <label className="text-xs text-muted block mb-0.5">Phạm vi hiển thị:</label>
                <div className="text-sm font-medium text-main">
                  {item.hien_thi === 'TAT_CA' ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <i className="fa-solid fa-globe text-xs" />
                      Tất cả cán bộ nhân viên
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <i className="fa-solid fa-building text-xs" />
                      Nội bộ phòng ban
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          {item.ghi_chu && (
            <div className="p-3.5 bg-surface-elevated/60 rounded-xl border border-border-subtle">
              <label className="text-xs font-semibold text-muted block mb-1">
                <i className="fa-solid fa-note-sticky mr-1.5" /> Ghi chú:
              </label>
              <p className="text-xs text-main whitespace-pre-wrap leading-relaxed">
                {item.ghi_chu}
              </p>
            </div>
          )}

          {/* Tệp đính kèm */}
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
              Tệp tài liệu đính kèm
            </label>
            {item.file_dinh_kem ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface border border-border-subtle flex items-center justify-center text-xl shrink-0">
                    <i className={`fa-solid ${fileIcon}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-main truncate max-w-md">
                      {fileName}
                    </p>
                    <p className="text-xs text-muted">
                      Định dạng chuẩn hệ thống QLVB &amp; TLBM
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <a
                    href={item.file_dinh_kem}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-elevated text-secondary hover:text-main border border-border-subtle transition-all"
                  >
                    <i className="fa-solid fa-eye text-xs" />
                    <span>Xem trực tiếp</span>
                  </a>

                  <Button
                    variant="primary"
                    size="sm"
                    icon="fa-download"
                    onClick={() => {
                      if (onDownloadFile) {
                        onDownloadFile(item);
                      } else {
                        window.open(item.file_dinh_kem, '_blank');
                      }
                    }}
                  >
                    Tải về máy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl border border-dashed border-border-subtle text-xs text-muted">
                Không có tệp đính kèm cho tài liệu này.
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal - Cố định ở đáy */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-border-subtle bg-surface-elevated/40 shrink-0 z-10">
          <Button variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>
          {item.file_dinh_kem && (
            <Button
              variant="primary"
              size="md"
              icon="fa-download"
              onClick={() => {
                if (onDownloadFile) {
                  onDownloadFile(item);
                } else {
                  window.open(item.file_dinh_kem, '_blank');
                }
              }}
            >
              Tải tệp đính kèm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
