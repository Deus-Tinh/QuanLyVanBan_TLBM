import React, { useState, useEffect, useCallback } from 'react';
import { DocumentDetail } from '@app-types/document';
import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { formatDateTime, formatDate, formatFileSize } from '@lib/dateUtils';
import apiClient from '@lib/apiClient';

export interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number | null;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  documentId,
}) => {
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chi tiết văn bản (Backend tự động ghi nhận vào DocumentViewLog khi gọi endpoint này)
  const fetchDetail = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<DocumentDetail>(`/api/documents/${id}/`);
      setDocument(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Không thể tải chi tiết văn bản.';
      setError(errMsg);
      setDocument(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDetail(documentId);
    } else {
      setDocument(null);
      setError(null);
    }
  }, [isOpen, documentId, fetchDetail]);

  // Đóng bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Lấy icon tương ứng loại file
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'fa-solid fa-file-pdf text-danger';
    if (ext === 'doc' || ext === 'docx') return 'fa-solid fa-file-word text-primary';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'fa-solid fa-file-image text-warning-text';
    return 'fa-solid fa-file text-secondary';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-subtle rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface-subtle">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-primary-subtle text-primary flex items-center justify-center font-bold text-sm shrink-0">
              <i className="fa-solid fa-file-lines" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-main m-0 truncate">
                  Chi Tiết Văn Bản Đến
                </h2>
                {document?.so_hieu && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-primary-subtle text-primary">
                    {document.so_hieu}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary m-0 truncate">
                Xem toàn bộ thông tin chi tiết và danh sách tệp đính kèm.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-main hover:bg-surface-elevated transition-colors shrink-0"
            title="Đóng (ESC)"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Nội dung chi tiết (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {isLoading && (
            <div className="py-16 text-center text-secondary">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-primary mb-2 block" />
              <span className="text-xs">Đang tải thông tin văn bản...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-danger-subtle text-danger border border-danger-border rounded-xl p-4 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-base" />
                <span>{error}</span>
              </div>
              {documentId && (
                <button
                  type="button"
                  onClick={() => fetchDetail(documentId)}
                  className="underline font-semibold hover:text-danger-hover"
                >
                  Thử lại
                </button>
              )}
            </div>
          )}

          {document && !isLoading && (
            <>
              {/* Trích yếu nội dung */}
              <div className="bg-surface-subtle border border-border-subtle rounded-xl p-4">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1.5">
                  Trích yếu nội dung
                </span>
                <p className="text-sm md:text-base font-medium text-main leading-relaxed m-0 whitespace-pre-wrap">
                  {document.trich_yeu}
                </p>
              </div>

              {/* Lưới thông tin văn bản */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cột trái */}
                <div className="space-y-3 bg-surface border border-border-subtle rounded-xl p-4">
                  <h3 className="text-xs font-bold text-main uppercase tracking-wider pb-2 border-b border-border-subtle m-0 flex items-center gap-2">
                    <i className="fa-solid fa-hashtag text-primary" /> Thông số đến
                  </h3>

                  <div className="flex justify-between items-center text-xs py-1 border-b border-border-subtle/50">
                    <span className="text-secondary">Số đến (STT năm):</span>
                    <span className="font-bold text-main font-mono">
                      {document.so_thu_tu !== null && document.so_thu_tu !== undefined
                        ? `#${document.so_thu_tu}`
                        : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs py-1 border-b border-border-subtle/50">
                    <span className="text-secondary">Năm sổ sách:</span>
                    <span className="font-semibold text-main">{document.nam}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs py-1 border-b border-border-subtle/50">
                    <span className="text-secondary">Ngày đến:</span>
                    <span className="font-semibold text-main font-mono">
                      {document.ngay_den ? formatDateTime(document.ngay_den) : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-secondary">Ngày văn bản:</span>
                    <span className="font-semibold text-main">
                      {document.ngay_van_ban ? formatDate(document.ngay_van_ban) : '—'}
                    </span>
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-3 bg-surface border border-border-subtle rounded-xl p-4">
                  <h3 className="text-xs font-bold text-main uppercase tracking-wider pb-2 border-b border-border-subtle m-0 flex items-center gap-2">
                    <i className="fa-solid fa-building text-primary" /> Cơ quan ban hành & Hiệu lực
                  </h3>

                  <div className="flex justify-between items-center text-xs py-1 border-b border-border-subtle/50">
                    <span className="text-secondary">Nơi ban hành:</span>
                    <span className="font-semibold text-main text-right">
                      {document.noi_ban_hanh || '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs py-1 border-b border-border-subtle/50">
                    <span className="text-secondary">Người ký / Chức vụ:</span>
                    <span className="font-semibold text-main text-right">
                      {document.nguoi_ky ? `${document.nguoi_ky}${document.chuc_vu ? ` (${document.chuc_vu})` : ''}` : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs py-1 border-b border-border-subtle/50">
                    <span className="text-secondary">Trạng thái hiệu lực:</span>
                    <Badge
                      variant={
                        document.hieu_luc === 'CON_HIEU_LUC'
                          ? 'success'
                          : document.hieu_luc === 'HET_HIEU_LUC'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {document.hieu_luc_display || document.hieu_luc}
                    </Badge>
                  </div>

                  {document.ngay_het_hieu_luc && (
                    <div className="flex justify-between items-center text-xs py-1">
                      <span className="text-secondary">Ngày hết hiệu lực:</span>
                      <span className="font-semibold text-warning-text font-mono">
                        {formatDate(document.ngay_het_hieu_luc)}
                      </span>
                    </div>
                  )}

                  {document.link_thay_the && (
                    <div className="flex justify-between items-center text-xs py-1">
                      <span className="text-secondary">VB thay thế:</span>
                      <a
                        href={document.link_thay_the}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate max-w-[180px]"
                      >
                        {document.link_thay_the}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Ghi chú nếu có */}
              {document.ghi_chu && (
                <div className="bg-surface border border-border-subtle rounded-xl p-3.5 text-xs">
                  <span className="font-semibold text-secondary block mb-1">Ghi chú:</span>
                  <p className="text-main m-0 leading-relaxed">{document.ghi_chu}</p>
                </div>
              )}

              {/* Danh sách tệp đính kèm */}
              <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <h3 className="text-xs font-bold text-main uppercase tracking-wider m-0 flex items-center gap-2">
                    <i className="fa-solid fa-paperclip text-primary" /> Tệp đính kèm (
                    {document.attachments?.length || 0})
                  </h3>
                </div>

                {document.attachments && document.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {document.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-subtle hover:bg-surface-elevated transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <i className={`${getFileIcon(att.file_name)} text-lg shrink-0`} />
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-main block truncate" title={att.file_name}>
                              {att.file_name}
                            </span>
                            <span className="text-[10px] text-muted block">
                              {formatFileSize(att.file_size)} • {formatDate(att.uploaded_at)}
                            </span>
                          </div>
                        </div>

                        <a
                          href={att.file}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs rounded-md bg-primary-subtle text-primary font-medium hover:bg-primary hover:text-white transition-colors shrink-0"
                          title="Tải / Mở tệp"
                        >
                          <i className="fa-solid fa-arrow-down mr-1" /> Mở
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted m-0 italic py-2">
                    Không có tệp đính kèm nào cho văn bản này.
                  </p>
                )}
              </div>

              {/* Footer metadata */}
              <div className="text-[11px] text-muted flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle/50">
                <span>
                  Người tạo: <strong>{document.nguoi_tao_name || 'Hệ thống'}</strong> lúc{' '}
                  {formatDateTime(document.created_at)}
                </span>
                <span>Cập nhật gần nhất: {formatDateTime(document.updated_at)}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3.5 border-t border-border-subtle bg-surface-subtle flex items-center justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;
