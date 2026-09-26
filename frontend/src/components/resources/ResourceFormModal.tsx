import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import {
  ResourceItem,
  ResourceCategory,
  ResourceType,
  HieuLucType,
  HienThiType,
} from '@app-types/resource';
import { Button } from '@components/common/Button';

export interface ResourceFormData {
  dm_tai_lieu: number | '';
  loai_tai_lieu: number[];
  ky_hieu: string;
  tieu_de: string;
  ngay_dang: string;
  noi_ban_hanh: string;
  hieu_luc: HieuLucType;
  ngay_het_hieu_luc: string;
  link_thay_the: string;
  ghi_chu: string;
  hien_thi: HienThiType;
  file?: File | null;
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
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip', '.rar'];

interface FormContentProps {
  onClose: () => void;
  onSubmit: (data: { formData: FormData; payload: ResourceFormData }) => Promise<void> | void;
  initialData?: ResourceItem | null;
  categories: ResourceCategory[];
  types: ResourceType[];
  isLoading: boolean;
}

const FormContent: React.FC<FormContentProps> = ({
  onClose,
  onSubmit,
  initialData,
  categories,
  types,
  isLoading,
}) => {
  const isEditMode = Boolean(initialData);

  // Khởi tạo state trực tiếp từ initialData mà không cần useEffect (React 19 pattern)
  const [formData, setFormData] = useState<ResourceFormData>(() => {
    if (initialData) {
      return {
        dm_tai_lieu: initialData.dm_tai_lieu,
        loai_tai_lieu: initialData.loai_tai_lieu || [],
        ky_hieu: initialData.ky_hieu || '',
        tieu_de: initialData.tieu_de || '',
        ngay_dang: initialData.ngay_dang || new Date().toISOString().split('T')[0],
        noi_ban_hanh: initialData.noi_ban_hanh || '',
        hieu_luc: initialData.hieu_luc || 'CON_HIEU_LUC',
        ngay_het_hieu_luc: initialData.ngay_het_hieu_luc || '',
        link_thay_the: initialData.link_thay_the || '',
        ghi_chu: initialData.ghi_chu || '',
        hien_thi: initialData.hien_thi || 'TAT_CA',
        file: null,
      };
    }
    return {
      dm_tai_lieu: categories.length > 0 ? categories[0].id : '',
      loai_tai_lieu: [],
      ky_hieu: '',
      tieu_de: '',
      ngay_dang: new Date().toISOString().split('T')[0],
      noi_ban_hanh: '',
      hieu_luc: 'CON_HIEU_LUC',
      ngay_het_hieu_luc: '',
      link_thay_the: '',
      ghi_chu: '',
      hien_thi: 'TAT_CA',
      file: null,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);

  // Danh sách Loại Cấp 2 tương ứng với Danh mục Cấp 1 đã chọn (Cascading)
  const availableTypes = useMemo(() => {
    if (!formData.dm_tai_lieu) return [];
    return types.filter((t) => t.dm_tai_lieu === Number(formData.dm_tai_lieu));
  }, [formData.dm_tai_lieu, types]);

  // Khi đổi Danh mục Cấp 1, tự động lọc lại Loại Cấp 2 đã chọn
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newDmId = e.target.value ? Number(e.target.value) : '';
    setFormData((prev) => {
      const validTypes = types
        .filter((t) => t.dm_tai_lieu === newDmId)
        .map((t) => t.id);
      const filteredSelected = prev.loai_tai_lieu.filter((id) => validTypes.includes(id));

      return {
        ...prev,
        dm_tai_lieu: newDmId,
        loai_tai_lieu: filteredSelected,
      };
    });

    if (errors.dm_tai_lieu) {
      setErrors((prev) => ({ ...prev, dm_tai_lieu: '' }));
    }
  };

  // Chọn / Bỏ chọn Loại Cấp 2 (Multi-select)
  const handleToggleType = (typeId: number) => {
    setFormData((prev) => {
      const exists = prev.loai_tai_lieu.includes(typeId);
      const updated = exists
        ? prev.loai_tai_lieu.filter((id) => id !== typeId)
        : [...prev.loai_tai_lieu, typeId];
      return { ...prev, loai_tai_lieu: updated };
    });

    if (errors.loai_tai_lieu) {
      setErrors((prev) => ({ ...prev, loai_tai_lieu: '' }));
    }
  };

  // Xử lý chọn File và Validation kích thước, định dạng
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFormData((prev) => ({ ...prev, file: null }));
      setFileError(null);
      return;
    }

    // Kiểm tra định dạng đuôi file
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(
        `Định dạng tệp ${ext} không được hỗ trợ. Vui lòng chọn tệp PDF, DOC, DOCX, JPG, PNG, ZIP hoặc RAR.`
      );
      setFormData((prev) => ({ ...prev, file: null }));
      e.target.value = '';
      return;
    }

    // Kiểm tra kích thước file <= 20MB (Yêu cầu đặc tả)
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        `Cảnh báo: Dung lượng tệp (${(selectedFile.size / (1024 * 1024)).toFixed(
          1
        )}MB) vượt quá giới hạn cho phép (${MAX_FILE_SIZE_MB}MB). Vui lòng nén hoặc chọn tệp nhỏ hơn.`
      );
      setFormData((prev) => ({ ...prev, file: null }));
      e.target.value = '';
      return;
    }

    // Hợp lệ
    setFileError(null);
    setFormData((prev) => ({ ...prev, file: selectedFile }));
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  // Validate toàn bộ Form trước khi submit
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dm_tai_lieu) {
      newErrors.dm_tai_lieu = 'Vui lòng chọn Danh mục Cấp 1.';
    }

    if (availableTypes.length > 0 && formData.loai_tai_lieu.length === 0) {
      newErrors.loai_tai_lieu = 'Vui lòng chọn ít nhất một Loại tài liệu Cấp 2.';
    }

    if (!formData.tieu_de.trim()) {
      newErrors.tieu_de = 'Tiêu đề tài liệu không được để trống.';
    }

    if (!formData.ngay_dang) {
      newErrors.ngay_dang = 'Vui lòng chọn ngày đăng.';
    }

    if (!formData.hieu_luc) {
      newErrors.hieu_luc = 'Vui lòng chọn trạng thái hiệu lực.';
    }

    if (
      (formData.hieu_luc === 'HET_HIEU_LUC' || formData.hieu_luc === 'HET_VA_THAY_THE') &&
      !formData.ngay_het_hieu_luc
    ) {
      newErrors.ngay_het_hieu_luc = 'Tài liệu hết hiệu lực bắt buộc phải có ngày hết hiệu lực.';
    }

    if (!isEditMode && !formData.file) {
      newErrors.file = 'Vui lòng tải lên tệp đính kèm cho tài liệu mới.';
    }

    if (fileError) {
      newErrors.file = fileError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Chuẩn bị FormData cho Multipart upload API
    const fd = new FormData();
    fd.append('dm_tai_lieu', String(formData.dm_tai_lieu));
    formData.loai_tai_lieu.forEach((id) => fd.append('loai_tai_lieu', String(id)));
    fd.append('tieu_de', formData.tieu_de.trim());
    fd.append('ngay_dang', formData.ngay_dang);
    fd.append('hieu_luc', formData.hieu_luc);
    fd.append('hien_thi', formData.hien_thi);

    if (formData.ky_hieu.trim()) fd.append('ky_hieu', formData.ky_hieu.trim());
    if (formData.noi_ban_hanh.trim()) fd.append('noi_ban_hanh', formData.noi_ban_hanh.trim());
    if (formData.ngay_het_hieu_luc) fd.append('ngay_het_hieu_luc', formData.ngay_het_hieu_luc);
    if (formData.link_thay_the.trim()) fd.append('link_thay_the', formData.link_thay_the.trim());
    if (formData.ghi_chu.trim()) fd.append('ghi_chu', formData.ghi_chu.trim());

    if (formData.file) {
      fd.append('file_dinh_kem', formData.file);
    }

    await onSubmit({
      formData: fd,
      payload: formData,
    });
  };

  return (
    <div
      className="w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl border border-border-subtle shadow-xl flex flex-col overflow-hidden animate-slide-in-bottom"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Modal - Cố định ở trên cùng */}
      <div className="flex items-center justify-between px-[27px] py-[21px] border-b border-border-subtle bg-surface shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary flex items-center justify-center text-base">
            <i className={`fa-solid ${isEditMode ? 'fa-pen-to-square' : 'fa-plus'}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-main leading-tight">
              {isEditMode ? 'Chỉnh sửa Tài liệu & Biểu mẫu' : 'Thêm mới Tài liệu & Biểu mẫu'}
            </h3>
            <p className="text-xs text-muted">
              {isEditMode
                ? `Cập nhật thông tin tài liệu #${initialData?.id}`
                : 'Nhập đầy đủ các thông tin bắt buộc (*) để ban hành tài liệu'}
            </p>
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

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Vùng cuộn riêng cho các trường Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Nhóm 1: Phân loại Cấp 1 & Cấp 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-elevated/40 border border-border-subtle/70">
          {/* Danh mục Cấp 1 */}
          <div>
            <label htmlFor="dm_tai_lieu" className="text-xs font-bold text-main block mb-1.5">
              Danh mục Cấp 1 <span className="text-danger">*</span>
            </label>
            <select
              id="dm_tai_lieu"
              value={formData.dm_tai_lieu}
              onChange={handleCategoryChange}
              className={`w-full px-3 py-2 text-sm rounded-lg bg-surface border text-main focus:outline-none focus:border-primary transition-colors ${
                errors.dm_tai_lieu ? 'border-danger' : 'border-border-subtle'
              }`}
            >
              <option value="">-- Chọn danh mục Cấp 1 --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.stt_uu_tien}. {c.ten_tai_lieu} {c.ky_hieu ? `(${c.ky_hieu})` : ''}
                </option>
              ))}
            </select>
            {errors.dm_tai_lieu && (
              <p className="text-xs text-danger mt-1">{errors.dm_tai_lieu}</p>
            )}
          </div>

          {/* Loại Cấp 2 (Tự động lọc theo Cấp 1) */}
          <div>
            <label className="text-xs font-bold text-main block mb-1.5">
              Loại tài liệu Cấp 2 <span className="text-danger">*</span>
              <span className="text-xs text-muted font-normal ml-1">
                ({availableTypes.length} loại tương ứng)
              </span>
            </label>
            {availableTypes.length === 0 ? (
              <div className="text-xs text-muted italic py-2 px-3 bg-surface rounded-lg border border-border-subtle">
                {formData.dm_tai_lieu
                  ? 'Danh mục này chưa có Loại Cấp 2 nào.'
                  : 'Vui lòng chọn Danh mục Cấp 1 trước.'}
              </div>
            ) : (
              <div className="max-h-28 overflow-y-auto p-2 bg-surface rounded-lg border border-border-subtle space-y-1.5">
                {availableTypes.map((type) => {
                  const checked = formData.loai_tai_lieu.includes(type.id);
                  return (
                    <label
                      key={type.id}
                      className="flex items-center gap-2 text-xs text-main cursor-pointer hover:bg-surface-elevated p-1 rounded transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleType(type.id)}
                        className="rounded text-primary focus:ring-0 cursor-pointer"
                      />
                      <span>{type.ten_loai}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {errors.loai_tai_lieu && (
              <p className="text-xs text-danger mt-1">{errors.loai_tai_lieu}</p>
            )}
          </div>
        </div>

        {/* Nhóm 2: Thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ký hiệu */}
          <div>
            <label htmlFor="ky_hieu" className="text-xs font-bold text-main block mb-1.5">
              Số / Ký hiệu tài liệu
            </label>
            <input
              id="ky_hieu"
              type="text"
              value={formData.ky_hieu}
              onChange={(e) => setFormData({ ...formData, ky_hieu: e.target.value })}
              placeholder="VD: 15/QĐ-BL, BM-01..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-subtle text-main focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {/* Nơi ban hành */}
          <div>
            <label htmlFor="noi_ban_hanh" className="text-xs font-bold text-main block mb-1.5">
              Nơi ban hành
            </label>
            <input
              id="noi_ban_hanh"
              type="text"
              value={formData.noi_ban_hanh}
              onChange={(e) => setFormData({ ...formData, noi_ban_hanh: e.target.value })}
              placeholder="VD: Ban Giám Đốc, Phòng Nhân sự..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-subtle text-main focus:outline-none focus:border-primary"
            />
          </div>

          {/* Ngày đăng */}
          <div>
            <label htmlFor="ngay_dang" className="text-xs font-bold text-main block mb-1.5">
              Ngày đăng / Ban hành <span className="text-danger">*</span>
            </label>
            <input
              id="ngay_dang"
              type="date"
              value={formData.ngay_dang}
              onChange={(e) => setFormData({ ...formData, ngay_dang: e.target.value })}
              className={`w-full px-3 py-2 text-sm rounded-lg bg-surface border text-main focus:outline-none focus:border-primary font-mono ${
                errors.ngay_dang ? 'border-danger' : 'border-border-subtle'
              }`}
            />
            {errors.ngay_dang && (
              <p className="text-xs text-danger mt-1">{errors.ngay_dang}</p>
            )}
          </div>
        </div>

        {/* Tiêu đề tài liệu */}
        <div>
          <label htmlFor="tieu_de" className="text-xs font-bold text-main block mb-1.5">
            Tiêu đề tài liệu <span className="text-danger">*</span>
          </label>
          <input
            id="tieu_de"
            type="text"
            value={formData.tieu_de}
            onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
            placeholder="Nhập tên hoặc trích yếu đầy đủ của tài liệu, biểu mẫu..."
            className={`w-full px-3 py-2 text-sm rounded-lg bg-surface border text-main focus:outline-none focus:border-primary ${
              errors.tieu_de ? 'border-danger' : 'border-border-subtle'
            }`}
          />
          {errors.tieu_de && <p className="text-xs text-danger mt-1">{errors.tieu_de}</p>}
        </div>

        {/* Nhóm 3: Hiệu lực và Pháp lý */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-elevated/40 border border-border-subtle/70">
          {/* Trạng thái hiệu lực */}
          <div>
            <label htmlFor="hieu_luc" className="text-xs font-bold text-main block mb-1.5">
              Trạng thái hiệu lực <span className="text-danger">*</span>
            </label>
            <select
              id="hieu_luc"
              value={formData.hieu_luc}
              onChange={(e) =>
                setFormData({ ...formData, hieu_luc: e.target.value as HieuLucType })
              }
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-subtle text-main focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="CON_HIEU_LUC">Còn hiệu lực</option>
              <option value="HET_HIEU_LUC">Hết hiệu lực</option>
              <option value="HET_VA_THAY_THE">Hết hiệu lực và thay thế</option>
            </select>
          </div>

          {/* Ngày hết hiệu lực (chỉ hiện khi hết hiệu lực) */}
          <div>
            <label htmlFor="ngay_het_hieu_luc" className="text-xs font-bold text-main block mb-1.5">
              Ngày hết hiệu lực{' '}
              {formData.hieu_luc !== 'CON_HIEU_LUC' && <span className="text-danger">*</span>}
            </label>
            <input
              id="ngay_het_hieu_luc"
              type="date"
              disabled={formData.hieu_luc === 'CON_HIEU_LUC'}
              value={formData.ngay_het_hieu_luc}
              onChange={(e) => setFormData({ ...formData, ngay_het_hieu_luc: e.target.value })}
              className={`w-full px-3 py-2 text-sm rounded-lg bg-surface border text-main focus:outline-none focus:border-primary font-mono disabled:opacity-50 disabled:bg-surface-elevated ${
                errors.ngay_het_hieu_luc ? 'border-danger' : 'border-border-subtle'
              }`}
            />
            {errors.ngay_het_hieu_luc && (
              <p className="text-xs text-danger mt-1">{errors.ngay_het_hieu_luc}</p>
            )}
          </div>

          {/* Phạm vi hiển thị */}
          <div>
            <label htmlFor="hien_thi" className="text-xs font-bold text-main block mb-1.5">
              Phạm vi hiển thị <span className="text-danger">*</span>
            </label>
            <select
              id="hien_thi"
              value={formData.hien_thi}
              onChange={(e) =>
                setFormData({ ...formData, hien_thi: e.target.value as HienThiType })
              }
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-subtle text-main focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="TAT_CA">Tất cả cán bộ nhân viên</option>
              <option value="NOI_BO_PHONG_BAN">Nội bộ phòng ban</option>
            </select>
          </div>

          {/* Link thay thế (khi chọn Hết và thay thế) */}
          {formData.hieu_luc === 'HET_VA_THAY_THE' && (
            <div className="md:col-span-3">
              <label htmlFor="link_thay_the" className="text-xs font-bold text-warning-text block mb-1.5">
                <i className="fa-solid fa-link mr-1" /> Link văn bản thay thế
              </label>
              <input
                id="link_thay_the"
                type="url"
                value={formData.link_thay_the}
                onChange={(e) => setFormData({ ...formData, link_thay_the: e.target.value })}
                placeholder="https://... hoặc đường dẫn văn bản thay thế mới"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-subtle text-main focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Nhóm 4: Tải tệp đính kèm & Validation kích thước */}
        <div>
          <label htmlFor="file_dinh_kem" className="text-xs font-bold text-main block mb-1.5">
            Tệp tài liệu đính kèm {!isEditMode && <span className="text-danger">*</span>}
            <span className="text-xs text-muted font-normal ml-2">
              (Tối đa {MAX_FILE_SIZE_MB}MB; chấp nhận PDF, DOC, DOCX, JPG, PNG, ZIP, RAR)
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <input
              id="file_dinh_kem"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
              onChange={handleFileChange}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-subtle text-main file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover file:cursor-pointer cursor-pointer"
            />

            {/* Thông báo file cũ đang có khi ở chế độ Edit */}
            {isEditMode && !formData.file && initialData?.file_dinh_kem && (
              <div className="text-xs text-secondary flex items-center gap-1.5">
                <i className="fa-solid fa-file-check text-emerald-500" />
                <span>Tệp hiện tại: <strong>{initialData.file_dinh_kem.split('/').pop()}</strong></span>
                <span className="text-muted">(Nếu không muốn đổi tệp thì để trống trường này)</span>
              </div>
            )}

            {/* Cảnh báo lỗi File kích thước hoặc định dạng */}
            {(fileError || errors.file) && (
              <div className="p-2.5 rounded-lg bg-danger-subtle border border-danger-border flex items-start gap-2">
                <i className="fa-solid fa-circle-exclamation text-danger mt-0.5 text-xs" />
                <p className="text-xs text-danger font-medium">
                  {fileError || errors.file}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nhóm 5: Ghi chú */}
        <div>
          <label htmlFor="ghi_chu" className="text-xs font-bold text-main block mb-1.5">
            Ghi chú thêm
          </label>
          <textarea
            id="ghi_chu"
            rows={3}
            value={formData.ghi_chu}
            onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
            placeholder="Ghi chú nội dung ban hành, lưu ý khi áp dụng..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-subtle text-main focus:outline-none focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* Footer nút hành động - Cố định ở đáy modal */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-surface-elevated/40 shrink-0 z-10">
          <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isLoading}
            icon={isEditMode ? 'fa-floppy-disk' : 'fa-check'}
          >
            {isEditMode ? 'Lưu thay đổi' : 'Ban hành tài liệu'}
          </Button>
        </div>
      </form>
    </div>
  );
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
  // Lắng nghe phím ESC để đóng modal
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

  // Sử dụng key dựa trên initialData?.id hoặc 'create' để reset form state sạch sẽ
  const formKey = initialData ? `edit-${initialData.id}` : 'create';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <FormContent
        key={formKey}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        categories={categories}
        types={types}
        isLoading={isLoading}
      />
    </div>
  );
};
