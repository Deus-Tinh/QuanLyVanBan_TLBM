import React, { useState, useEffect, useMemo, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  ResourceItem,
  ResourceCategory,
  ResourceType,
  HieuLucType,
  HienThiType,
} from '@app-types/resource';
import { Button } from '@components/common/Button';
import { useTranslation } from '@i18n/translate';
import { authService } from '@lib/authService';
import { apiClient } from '@lib/apiClient';
import { ConfirmationModal } from './ConfirmationModal';

export interface ResourceFormData {
  dm_tai_lieu: number | '';
  loai_tai_lieu: number[];
  ky_hieu: string;
  tieu_de: string;
  ngay_dang: string;
  noi_ban_hanh: string;
  nguoi_tao_name?: string;
  hieu_luc: HieuLucType;
  ngay_het_hieu_luc: string;
  link_thay_the: string;
  ghi_chu: string;
  hien_thi: HienThiType;
  file?: File | null;
  files?: File[];
  deleted_attachment_ids?: number[];
}

export interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    formData: FormData;
    payload: ResourceFormData;
  }) => Promise<void> | void;
  initialData?: ResourceItem | null;
  categories?: ResourceCategory[];
  types?: ResourceType[];
  isLoading?: boolean;
}

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.jpg',
  '.jpeg',
  '.png',
  '.zip',
  '.rar',
];

const getFileDisplay = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return {
        icon: 'fa-solid fa-file-pdf',
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50',
      };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return {
        icon: 'fa-solid fa-file-excel',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
      };
    case 'doc':
    case 'docx':
      return {
        icon: 'fa-solid fa-file-word',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
      };
    case 'png':
    case 'jpg':
    case 'jpeg':
      return {
        icon: 'fa-solid fa-file-image',
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50',
      };
    case 'zip':
    case 'rar':
      return {
        icon: 'fa-solid fa-file-zipper',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
      };
    default:
      return {
        icon: 'fa-solid fa-file',
        color: 'text-gray-500',
        bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      };
  }
};

const formatSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  types = [],
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const isEditMode = Boolean(initialData);

  const defaultAuthor =
    authService.getSession()?.fullName ||
    authService.getSession()?.username ||
    '';

  // Form State
  const [formData, setFormData] = useState<ResourceFormData>({
    dm_tai_lieu: categories.length > 0 ? categories[0].id : '',
    loai_tai_lieu: [],
    ky_hieu: '',
    tieu_de: '',
    ngay_dang: new Date().toISOString().split('T')[0],
    noi_ban_hanh: '',
    nguoi_tao_name: defaultAuthor,
    hieu_luc: 'CON_HIEU_LUC',
    ngay_het_hieu_luc: '',
    link_thay_the: '',
    ghi_chu: '',
    hien_thi: 'TAT_CA',
    file: null,
    files: [],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<
    { id?: number; name: string; size?: number; path?: string }[]
  >([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  const [staffSuggestions, setStaffSuggestions] = useState<
    { id: number; ho_ten: string; chuc_vu_ten?: string; don_vi_ten?: string }[]
  >([]);

  // Tải danh sách CBNV từ CSDL để gợi ý khi nhập người tạo
  useEffect(() => {
    if (isOpen) {
      apiClient.get<any>('/api/accounts/staffs/')
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.results || []);
          setStaffSuggestions(list);
        })
        .catch(() => setStaffSuggestions([]));
    }
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo form khi mở modal
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isOpen) {
      if (initialData) {
        setFormData({
          dm_tai_lieu: initialData.dm_tai_lieu,
          loai_tai_lieu: initialData.loai_tai_lieu || [],
          ky_hieu: initialData.ky_hieu || '',
          tieu_de: initialData.tieu_de || '',
          ngay_dang: initialData.ngay_dang || new Date().toISOString().split('T')[0],
          noi_ban_hanh: initialData.noi_ban_hanh || '',
          nguoi_tao_name: initialData.nguoi_tao_name || defaultAuthor,
          hieu_luc: initialData.hieu_luc || 'CON_HIEU_LUC',
          ngay_het_hieu_luc: initialData.ngay_het_hieu_luc || '',
          link_thay_the: initialData.link_thay_the || '',
          ghi_chu: initialData.ghi_chu || '',
          hien_thi: initialData.hien_thi || 'TAT_CA',
          file: null,
          files: [],
        });
        if (initialData.attachments && initialData.attachments.length > 0) {
          setExistingFiles(
            initialData.attachments.map((att) => ({
              id: att.id,
              name: att.name,
              size: att.file_size,
              path: att.path,
            }))
          );
        } else if (initialData.file_dinh_kem) {
          const fallbackName =
            initialData.file_dinh_kem.startsWith('blob:')
              ? `${initialData.tieu_de || 'Tệp đính kèm'}.pdf`
              : initialData.file_dinh_kem.split('?')[0].split('/').pop() || 'Tệp đính kèm';
          setExistingFiles([{ name: fallbackName, path: initialData.file_dinh_kem }]);
        } else {
          setExistingFiles([]);
        }
      } else {
        setFormData({
          dm_tai_lieu: categories.length > 0 ? categories[0].id : '',
          loai_tai_lieu: [],
          ky_hieu: '',
          tieu_de: '',
          ngay_dang: new Date().toISOString().split('T')[0],
          noi_ban_hanh: '',
          nguoi_tao_name: defaultAuthor,
          hieu_luc: 'CON_HIEU_LUC',
          ngay_het_hieu_luc: '',
          link_thay_the: '',
          ghi_chu: '',
          hien_thi: 'TAT_CA',
          file: null,
          files: [],
        });
        setExistingFiles([]);
      }
      setSelectedFiles([]);
      setDeletedAttachmentIds([]);
      setErrors({});
      setFileError(null);
      setIsDirty(false);
      setIsConfirmDiscardOpen(false);
    }
  }, [isOpen, initialData, categories, defaultAuthor]);

  // Đóng an toàn có xác nhận nếu đã chỉnh sửa dữ liệu
  const handleSafeClose = useCallback(() => {
    if (isDirty) {
      setIsConfirmDiscardOpen(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  // Lắng nghe phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isConfirmDiscardOpen) return;
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirmDiscardOpen, handleSafeClose]);

  // Danh sách Loại tài liệu theo Thư mục đã chọn (Cascading)
  const availableTypes = useMemo(() => {
    if (!formData.dm_tai_lieu) return [];
    return types.filter((t) => t.dm_tai_lieu === Number(formData.dm_tai_lieu));
  }, [types, formData.dm_tai_lieu]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Xử lý thay đổi Thư mục (reset Loại tài liệu)
  const handleCategoryChange = (catId: number | '') => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      dm_tai_lieu: catId,
      loai_tai_lieu: [],
    }));
    if (errors.dm_tai_lieu) {
      setErrors((prev) => ({ ...prev, dm_tai_lieu: '' }));
    }
  };

  // Xử lý toggle checkbox Loại tài liệu (Multi-select)
  const handleTypeToggle = (typeId: number) => {
    setIsDirty(true);
    setFormData((prev) => {
      const exists = prev.loai_tai_lieu.includes(typeId);
      const next = exists
        ? prev.loai_tai_lieu.filter((id) => id !== typeId)
        : [...prev.loai_tai_lieu, typeId];
      return { ...prev, loai_tai_lieu: next };
    });
    if (errors.loai_tai_lieu) {
      setErrors((prev) => ({ ...prev, loai_tai_lieu: '' }));
    }
  };

  // Xử lý kiểm tra và thêm nhiều file
  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setFileError(null);
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errMessages: string[] = [];

    for (const file of fileArray) {
      const fileNameLower = file.name.toLowerCase();
      const isAllowedExt = ALLOWED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));

      if (!isAllowedExt) {
        errMessages.push(`Tệp "${file.name}" không đúng định dạng cho phép.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errMessages.push(`Tệp "${file.name}" vượt quá ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (errMessages.length > 0) {
      setFileError(errMessages.join(' '));
    }

    if (validFiles.length > 0) {
      setIsDirty(true);
      setSelectedFiles((prev) => {
        const filtered = validFiles.filter(
          (vf) => !prev.some((pf) => pf.name === vf.name && pf.size === vf.size)
        );
        const next = [...prev, ...filtered];
        setFormData((f) => ({ ...f, files: next, file: next[0] || null }));
        return next;
      });
      if (errors.file) {
        setErrors((prev) => ({ ...prev, file: '' }));
      }
    }
  };

  // Chọn file qua input
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Kéo thả file
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setIsDirty(true);
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setFormData((f) => ({ ...f, files: next, file: next[0] || null }));
      return next;
    });
  };

  const handleRemoveExistingFile = (index: number) => {
    setIsDirty(true);
    setExistingFiles((prev) => {
      const target = prev[index];
      if (target?.id) {
        setDeletedAttachmentIds((dIds) => [...dIds, target.id!]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Validate form trước khi submit
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dm_tai_lieu) {
      newErrors.dm_tai_lieu = 'Vui lòng chọn Thư mục';
    }

    if (formData.loai_tai_lieu.length === 0) {
      newErrors.loai_tai_lieu = 'Vui lòng chọn ít nhất một Loại tài liệu';
    }

    if (!formData.tieu_de.trim()) {
      newErrors.tieu_de = 'Vui lòng nhập Tiêu đề tài liệu';
    }

    if (!formData.ngay_dang) {
      newErrors.ngay_dang = 'Vui lòng chọn Ngày đăng';
    }

    // Ràng buộc nghiêm ngặt khi Hết và thay thế
    if (formData.hieu_luc === 'HET_VA_THAY_THE') {
      if (!formData.ngay_het_hieu_luc) {
        newErrors.ngay_het_hieu_luc = 'Vui lòng nhập Ngày hết hiệu lực khi thay thế văn bản';
      }
      if (!formData.link_thay_the.trim()) {
        newErrors.link_thay_the = 'Vui lòng nhập Link tài liệu thay thế mới';
      }
    }

    // Bắt buộc có tệp khi tạo mới
    const totalFilesCount = selectedFiles.length + existingFiles.length;
    if (!isEditMode && totalFilesCount === 0) {
      newErrors.file = 'Vui lòng đính kèm ít nhất một tệp tài liệu';
    }

    setErrors(newErrors);

    // Tự động focus và cuộn tới trường lỗi đầu tiên
    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      const errorEl = document.getElementById(`field-${firstErrorKey}`);
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorEl.focus();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  // Xử lý gửi form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) return;

    const data = new FormData();
    data.append('dm_tai_lieu', String(formData.dm_tai_lieu));
    formData.loai_tai_lieu.forEach((tId) => {
      data.append('loai_tai_lieu', String(tId));
    });
    data.append('ky_hieu', formData.ky_hieu.trim());
    data.append('tieu_de', formData.tieu_de.trim());
    data.append('ngay_dang', formData.ngay_dang);
    data.append('noi_ban_hanh', formData.noi_ban_hanh.trim());
    data.append('hieu_luc', formData.hieu_luc);
    data.append('hien_thi', formData.hien_thi);
    data.append('ghi_chu', formData.ghi_chu.trim());

    if (formData.ngay_het_hieu_luc) {
      data.append('ngay_het_hieu_luc', formData.ngay_het_hieu_luc);
    }
    if (formData.link_thay_the) {
      data.append('link_thay_the', formData.link_thay_the.trim());
    }

    // Gửi toàn bộ các tệp mới đính kèm
    selectedFiles.forEach((file) => {
      data.append('files', file);
      data.append('file_dinh_kem', file);
    });

    // Gửi danh sách ID tệp bị xóa (nếu có)
    deletedAttachmentIds.forEach((id) => {
      data.append('deleted_attachment_ids', String(id));
    });

    await onSubmit({
      formData: data,
      payload: {
        ...formData,
        files: selectedFiles,
        deleted_attachment_ids: deletedAttachmentIds,
      },
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-surface rounded-2xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-elevated shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-main">
              {isEditMode ? t('resourceManagement.formTitleEdit') : t('resourceManagement.formTitleAdd')}
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              {t('resourceManagement.formSubtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface transition-colors cursor-pointer"
            aria-label="Đóng form"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Nội dung Form cuộn dọc theo 4 khối đánh số */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* KHỐI 1: Phân loại (Thư mục -> Loại tài liệu) */}
          <div className="space-y-4 p-4 rounded-xl bg-surface-elevated/60 border border-border-subtle">
            <div className="flex items-center gap-2 border-b border-border-subtle/80 pb-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                {t('resourceManagement.block1Classification')}
              </h3>
            </div>

            {/* Thư mục (*) */}
            <div>
              <label
                htmlFor="field-dm_tai_lieu"
                className="text-xs font-semibold text-main block mb-1"
              >
                {t('resourceManagement.fieldFolder')} <span className="text-danger">*</span>
              </label>
              <select
                id="field-dm_tai_lieu"
                value={formData.dm_tai_lieu}
                onChange={(e) =>
                  handleCategoryChange(e.target.value ? Number(e.target.value) : '')
                }
                disabled={categories.length === 0}
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">{categories.length === 0 ? '-- Chưa có Thư mục nào --' : '-- Chọn Thư mục --'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.ten_tai_lieu}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 shrink-0" />
                  <span>Hệ thống chưa có Thư mục nào. Vui lòng đóng cửa sổ này và tạo Thư mục trong mục <b>Danh mục</b> trước.</span>
                </div>
              )}
              {errors.dm_tai_lieu && (
                <p className="text-danger text-xs mt-1 font-medium">{errors.dm_tai_lieu}</p>
              )}
            </div>

            {/* Loại tài liệu (*) (Multi-select) */}
            <div id="field-loai_tai_lieu">
              <label className="text-xs font-semibold text-main block mb-1">
                {t('resourceManagement.fieldType')} <span className="text-danger">*</span>
                <span className="text-muted font-normal text-xs ml-1">(chọn một hoặc nhiều loại)</span>
              </label>

              {!formData.dm_tai_lieu ? (
                <div className="p-3 rounded-lg bg-surface border border-dashed border-border-subtle text-xs text-muted italic">
                  Vui lòng chọn Thư mục trước để hiển thị danh sách Loại tài liệu tương ứng.
                </div>
              ) : availableTypes.length === 0 ? (
                <div className="p-3 rounded-lg bg-surface border border-dashed border-border-subtle text-xs text-muted italic">
                  Thư mục này chưa có Loại tài liệu nào.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-surface border border-border-subtle max-h-36 overflow-y-auto">
                  {availableTypes.map((type) => {
                    const isChecked = formData.loai_tai_lieu.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-primary-subtle text-primary font-semibold'
                            : 'hover:bg-surface-elevated text-secondary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTypeToggle(type.id)}
                          className="rounded border-border-subtle text-primary focus:ring-0 cursor-pointer"
                        />
                        <span className="truncate">{type.ten_loai}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.loai_tai_lieu && (
                <p className="text-danger text-xs mt-1 font-medium">{errors.loai_tai_lieu}</p>
              )}
            </div>
          </div>

          {/* KHỐI 2: Thông tin văn bản */}
          <div className="space-y-4 p-4 rounded-xl bg-surface-elevated/60 border border-border-subtle">
            <div className="flex items-center gap-2 border-b border-border-subtle/80 pb-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                {t('resourceManagement.block2Info')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Ký hiệu */}
              <div>
                <label
                  htmlFor="field-ky_hieu"
                  className="text-xs font-semibold text-main block mb-1"
                >
                  {t('resourceManagement.fieldCode')}
                </label>
                <input
                  id="field-ky_hieu"
                  type="text"
                  placeholder="VD: 01/QĐ-BL-2026"
                  value={formData.ky_hieu}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData((prev) => ({ ...prev, ky_hieu: e.target.value }));
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main font-mono focus:outline-hidden focus:border-primary transition-colors"
                />
              </div>

              {/* Ngày đăng (*) */}
              <div>
                <label
                  htmlFor="field-ngay_dang"
                  className="text-xs font-semibold text-main block mb-1"
                >
                  {t('resourceManagement.fieldPostedDate')} <span className="text-danger">*</span>
                </label>
                <input
                  id="field-ngay_dang"
                  type="date"
                  value={formData.ngay_dang}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData((prev) => ({ ...prev, ngay_dang: e.target.value }));
                    if (errors.ngay_dang) setErrors((prev) => ({ ...prev, ngay_dang: '' }));
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
                />
                {errors.ngay_dang && (
                  <p className="text-danger text-xs mt-1 font-medium">{errors.ngay_dang}</p>
                )}
              </div>
            </div>

            {/* Tiêu đề (*) */}
            <div>
              <label
                htmlFor="field-tieu_de"
                className="text-xs font-semibold text-main block mb-1"
              >
                {t('resourceManagement.fieldTitle')} <span className="text-danger">*</span>
              </label>
              <textarea
                id="field-tieu_de"
                rows={2}
                placeholder="Nhập trích yếu hoặc tiêu đề văn bản..."
                value={formData.tieu_de}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData((prev) => ({ ...prev, tieu_de: e.target.value }));
                  if (errors.tieu_de) setErrors((prev) => ({ ...prev, tieu_de: '' }));
                }}
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors resize-none leading-relaxed"
              />
              {errors.tieu_de && (
                <p className="text-danger text-xs mt-1 font-medium">{errors.tieu_de}</p>
              )}
            </div>

            {/* Grid 2 cột: Nơi ban hành & Người tạo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nơi ban hành */}
              <div>
                <label
                  htmlFor="field-noi_ban_hanh"
                  className="text-xs font-semibold text-main block mb-1"
                >
                  {t('resourceManagement.fieldIssuingAuthority')}
                </label>
                <input
                  id="field-noi_ban_hanh"
                  type="text"
                  placeholder="VD: Ban Giám Đốc, Khối Nghiệp Vụ..."
                  value={formData.noi_ban_hanh}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData((prev) => ({ ...prev, noi_ban_hanh: e.target.value }));
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors"
                />
              </div>

              {/* Người tạo tài liệu (Tự do set theo Cán bộ hoặc Nhân viên) */}
              <div>
                <label
                  htmlFor="field-nguoi_tao_name"
                  className="text-xs font-semibold text-main block mb-1"
                >
                  Người tạo tài liệu <span className="text-muted font-normal text-xs">(nhập tự do hoặc chọn theo CBNV)</span>
                </label>
                <div className="relative">
                  <input
                    id="field-nguoi_tao_name"
                    type="text"
                    list="cbnv-staff-list"
                    placeholder="Nhập họ tên người tạo hoặc chọn cán bộ..."
                    value={formData.nguoi_tao_name || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((prev) => ({ ...prev, nguoi_tao_name: e.target.value }));
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors"
                  />
                  <datalist id="cbnv-staff-list">
                    {staffSuggestions.map((s) => (
                      <option key={s.id} value={s.ho_ten}>
                        {s.ho_ten}{s.chuc_vu_ten ? ` — ${s.chuc_vu_ten}` : ''}{s.don_vi_ten ? ` (${s.don_vi_ten})` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 3: Hiệu lực & Phạm vi */}
          <div className="space-y-4 p-4 rounded-xl bg-surface-elevated/60 border border-border-subtle">
            <div className="flex items-center gap-2 border-b border-border-subtle/80 pb-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                {t('resourceManagement.block4Properties')}
              </h3>
            </div>

            {/* 4 lựa chọn Hiệu lực */}
            <div>
              <label className="text-xs font-semibold text-main block mb-2">
                Trạng thái hiệu lực <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'CON_HIEU_LUC', label: 'Còn hiệu lực', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
                  { value: 'CON_HIEU_LUC_1_PHAN', label: 'Còn HL 1 phần', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
                  { value: 'HET_HIEU_LUC', label: 'Hết hiệu lực', color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
                  { value: 'HET_VA_THAY_THE', label: 'Hết & thay thế', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
                ].map((st) => {
                  const isSelected = formData.hieu_luc === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setFormData((prev) => ({
                          ...prev,
                          hieu_luc: st.value as HieuLucType,
                        }));
                      }}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? `${st.color} ring-2 ring-primary/40 font-bold shadow-2xs`
                          : 'bg-surface border-border-subtle text-secondary hover:bg-surface-elevated'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phạm vi áp dụng */}
            <div>
              <label className="text-xs font-semibold text-main block mb-1">
                Phạm vi áp dụng
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer text-main">
                  <input
                    type="radio"
                    name="hien_thi"
                    value="TAT_CA"
                    checked={formData.hien_thi === 'TAT_CA'}
                    onChange={() => {
                      setIsDirty(true);
                      setFormData((prev) => ({ ...prev, hien_thi: 'TAT_CA' }));
                    }}
                    className="text-primary focus:ring-0 cursor-pointer"
                  />
                  <span>Tất cả phòng ban</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-main">
                  <input
                    type="radio"
                    name="hien_thi"
                    value="NOI_BO_PHONG_BAN"
                    checked={formData.hien_thi === 'NOI_BO_PHONG_BAN'}
                    onChange={() => {
                      setIsDirty(true);
                      setFormData((prev) => ({ ...prev, hien_thi: 'NOI_BO_PHONG_BAN' }));
                    }}
                    className="text-primary focus:ring-0 cursor-pointer"
                  />
                  <span>Nội bộ phòng ban</span>
                </label>
              </div>
            </div>

            {/* Điều kiện động khi chọn Hết và thay thế hoặc Hết hiệu lực */}
            {(formData.hieu_luc === 'HET_VA_THAY_THE' ||
              formData.hieu_luc === 'HET_HIEU_LUC') && (
              <div className="pt-2 border-t border-border-subtle/80 space-y-3">
                {/* Ngày hết hiệu lực */}
                <div>
                  <label
                    htmlFor="field-ngay_het_hieu_luc"
                    className="text-xs font-semibold text-main block mb-1"
                  >
                    Ngày hết hiệu lực{' '}
                    {formData.hieu_luc === 'HET_VA_THAY_THE' && (
                      <span className="text-danger">*</span>
                    )}
                  </label>
                  <input
                    id="field-ngay_het_hieu_luc"
                    type="date"
                    value={formData.ngay_het_hieu_luc}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((prev) => ({
                        ...prev,
                        ngay_het_hieu_luc: e.target.value,
                      }));
                      if (errors.ngay_het_hieu_luc) {
                        setErrors((prev) => ({ ...prev, ngay_het_hieu_luc: '' }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
                  />
                  {errors.ngay_het_hieu_luc && (
                    <p className="text-danger text-xs mt-1 font-medium">
                      {errors.ngay_het_hieu_luc}
                    </p>
                  )}
                </div>

                {/* Link thay thế (Chỉ bắt buộc khi Hết và thay thế) */}
                {formData.hieu_luc === 'HET_VA_THAY_THE' && (
                  <div>
                    <label
                      htmlFor="field-link_thay_the"
                      className="text-xs font-semibold text-main block mb-1"
                    >
                      Link tài liệu thay thế mới <span className="text-danger">*</span>
                    </label>
                    <input
                      id="field-link_thay_the"
                      type="url"
                      placeholder="https://example.com/files/van-ban-moi.pdf"
                      value={formData.link_thay_the}
                      onChange={(e) => {
                        setIsDirty(true);
                        setFormData((prev) => ({
                          ...prev,
                          link_thay_the: e.target.value,
                        }));
                        if (errors.link_thay_the) {
                          setErrors((prev) => ({ ...prev, link_thay_the: '' }));
                        }
                      }}
                      className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors font-mono"
                    />
                    {errors.link_thay_the && (
                      <p className="text-danger text-xs mt-1 font-medium">
                        {errors.link_thay_the}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KHỐI 4: Tệp đính kèm (*) */}
          <div
            id="field-file"
            className="space-y-3 p-4 rounded-xl bg-surface-elevated/60 border border-border-subtle"
          >
            <div className="flex items-center gap-2 border-b border-border-subtle/80 pb-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h3 className="text-xs font-bold text-main uppercase tracking-wider">
                {t('resourceManagement.block3Attachment')} {!isEditMode && <span className="text-danger">*</span>}
              </h3>
            </div>

            {/* Vùng kéo-thả tệp */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`p-5 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-primary bg-primary-subtle/30'
                  : 'border-border-subtle bg-surface hover:bg-surface-elevated'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary flex items-center justify-center mx-auto mb-2 text-base">
                <i className="fa-solid fa-cloud-arrow-up" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-main mb-1">
                Kéo thả các tệp vào đây hoặc <span className="text-primary underline">chọn tệp từ thiết bị</span>
              </p>
              <p className="text-[11px] text-muted">
                Hỗ trợ PDF, Excel (XLSX, XLS), DOCX, Ảnh, ZIP · Tối đa 20MB/tệp · Cho phép chọn nhiều tệp
              </p>
            </div>

            {/* Danh sách tệp đã chọn hoặc tệp hiện có */}
            {(existingFiles.length > 0 || selectedFiles.length > 0) && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-main">
                    Tệp đính kèm ({existingFiles.length + selectedFiles.length})
                  </span>
                  {selectedFiles.length > 0 && (
                    <span className="text-[11px] text-primary font-medium">
                      +{selectedFiles.length} tệp mới
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {/* Danh sách tệp hiện có */}
                  {existingFiles.map((file, idx) => {
                    const display = getFileDisplay(file.name);
                    return (
                      <div
                        key={`existing-${file.id || idx}`}
                        className={`p-2.5 rounded-lg border ${display.bg} flex items-center justify-between gap-3 text-xs transition-colors`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <i className={`${display.icon} ${display.color} text-sm shrink-0`} />
                          <span className="truncate font-medium text-main" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-muted shrink-0 font-medium">
                            Hiện có
                          </span>
                          {file.size && (
                            <span className="text-[11px] text-muted font-mono shrink-0">
                              ({formatSize(file.size)})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExistingFile(idx)}
                          className="p-1 text-muted hover:text-danger rounded transition-colors"
                          title="Xóa tệp này"
                          aria-label="Xóa tệp"
                        >
                          <i className="fa-solid fa-trash-can text-xs" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Danh sách tệp mới tải lên */}
                  {selectedFiles.map((file, idx) => {
                    const display = getFileDisplay(file.name);
                    return (
                      <div
                        key={`selected-${file.name}-${idx}`}
                        className={`p-2.5 rounded-lg border ${display.bg} flex items-center justify-between gap-3 text-xs transition-colors`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <i className={`${display.icon} ${display.color} text-sm shrink-0`} />
                          <span className="truncate font-medium text-main" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20 shrink-0">
                            Mới thêm
                          </span>
                          <span className="text-[11px] text-muted font-mono shrink-0">
                            ({formatSize(file.size)})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          className="p-1 text-muted hover:text-danger rounded transition-colors"
                          title="Xóa tệp này"
                          aria-label="Xóa tệp"
                        >
                          <i className="fa-solid fa-trash-can text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {fileError && <p className="text-danger text-xs font-medium">{fileError}</p>}
            {errors.file && <p className="text-danger text-xs font-medium">{errors.file}</p>}
          </div>

          {/* Ghi chú */}
          <div>
            <label
              htmlFor="field-ghi_chu"
              className="text-xs font-semibold text-main block mb-1"
            >
              Ghi chú bổ sung
            </label>
            <input
              id="field-ghi_chu"
              type="text"
              placeholder="Nhập ghi chú (nếu có)..."
              value={formData.ghi_chu}
              onChange={(e) => {
                setIsDirty(true);
                setFormData((prev) => ({ ...prev, ghi_chu: e.target.value }));
              }}
              className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary transition-colors"
            />
          </div>
        </form>

        {/* Footer cố định */}
        <div className="px-6 py-4 border-t border-border-subtle bg-surface-elevated flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={handleSafeClose}
            disabled={isLoading}
            className="text-xs"
          >
            {t('resourceManagement.cancel')}
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={isLoading ? 'fa-spinner fa-spin' : 'fa-check'}
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading || categories.length === 0}
            className="text-xs shadow-sm"
          >
            {isEditMode ? t('resourceManagement.saveChanges') : t('resourceManagement.save')}
          </Button>
        </div>

        {/* Modal xác nhận hủy các thay đổi chưa lưu */}
        <ConfirmationModal
          isOpen={isConfirmDiscardOpen}
          onClose={() => setIsConfirmDiscardOpen(false)}
          onConfirm={() => {
            setIsConfirmDiscardOpen(false);
            setIsDirty(false);
            onClose();
          }}
          title={t('resourceManagement.confirmDiscardTitle')}
          message={t('resourceManagement.confirmDiscardMsg')}
          subMessage={t('resourceManagement.confirmDiscardSub')}
          confirmText={t('resourceManagement.confirmDiscardBtn')}
          cancelText={t('resourceManagement.continueEditingBtn')}
          variant="warning"
          headerIcon="fa-triangle-exclamation"
          confirmIcon="fa-arrow-rotate-left"
        />
      </div>
    </div>,
    document.body
  );
};
