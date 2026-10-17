import React from 'react';
import { DocumentFilterParams, DocumentStatus } from '@app-types/document';
import { Button } from '@components/common/Button';

export interface FilterBarProps {
  filters: DocumentFilterParams;
  onFilterChange: (newFilters: DocumentFilterParams) => void;
  onSearch: () => void;
  onReset: () => void;
  isLoading?: boolean;
  availableYears?: number[];
  availableFolders?: string[];
  availableDocTypes?: string[];
  folderDocTypesMap?: Record<string, string[]>;
  documentType?: 'DEN' | 'DI' | 'MAT';
}

const CURRENT_YEAR = new Date().getFullYear();

// Danh mục loại văn bản mặc định phổ biến
const DEFAULT_DOC_TYPES = [
  'Công văn',
  'Quyết định',
  'Thông báo',
  'Kế hoạch',
  'Hướng dẫn',
  'Báo cáo',
  'Tờ trình',
  'Chỉ thị',
  'Nghị quyết',
];

// Bảng ánh xạ nghiệp vụ phân cấp dự phòng: Danh mục hồ sơ -> Loại văn bản tương ứng
const FOLDER_TO_DOC_TYPES_MAP: Record<string, string[]> = {
  'Hồ sơ Hành chính - Quản trị': ['Công văn', 'Thông báo', 'Tờ trình'],
  'Hồ sơ Tổ chức - Cán bộ': ['Quyết định', 'Thông báo', 'Hướng dẫn'],
  'Hồ sơ Kế hoạch - Tài chính': ['Kế hoạch', 'Quyết định', 'Báo cáo'],
  'Hồ sơ Chuyên môn - Nghiệp vụ': ['Hướng dẫn', 'Công văn', 'Kế hoạch'],
  'Hồ sơ Thanh tra - Pháp chế': ['Quyết định', 'Chỉ thị', 'Nghị quyết'],
  'Hồ sơ Kế hoạch - Dự án': ['Kế hoạch', 'Báo cáo', 'Quyết định'],
  'Hồ sơ Lưu trữ cơ quan': ['Công văn', 'Quyết định', 'Thông báo'],
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onReset,
  isLoading = false,
  availableYears,
  availableFolders,
  availableDocTypes,
  folderDocTypesMap,
  documentType = 'DEN',
}) => {
  // Chỉ hiển thị các năm thực tế có văn bản trong hệ thống
  const yearOptions = availableYears && availableYears.length > 0 ? availableYears : [CURRENT_YEAR];
  
  // Danh sách hồ sơ hiển thị: ưu tiên hồ sơ thực tế có văn bản trong hệ thống
  const folderOptions = React.useMemo(() => {
    if (availableFolders && availableFolders.length > 0) {
      return availableFolders;
    }
    return Object.keys(FOLDER_TO_DOC_TYPES_MAP);
  }, [availableFolders]);

  // Lọc Loại văn bản tương ứng theo Danh mục hồ sơ được chọn
  const filteredDocTypeOptions = React.useMemo(() => {
    const allDocTypes = (availableDocTypes && availableDocTypes.length > 0)
      ? availableDocTypes
      : DEFAULT_DOC_TYPES;

    if (!filters.ho_so) {
      // Chưa chọn hồ sơ: hiển thị tất cả loại văn bản có trong hệ thống
      return allDocTypes;
    }

    // 1. Ưu tiên lấy từ bản đồ động các văn bản thực tế trong CSDL
    const dynamicTypes = folderDocTypesMap?.[filters.ho_so];
    if (dynamicTypes && dynamicTypes.length > 0) {
      return dynamicTypes;
    }

    // 2. Dự phòng lấy từ bảng ánh xạ nghiệp vụ chuẩn
    const fallbackTypes = FOLDER_TO_DOC_TYPES_MAP[filters.ho_so];
    if (fallbackTypes && fallbackTypes.length > 0) {
      return fallbackTypes;
    }

    // 3. Nếu hồ sơ tự do chưa phân loại: hiển thị tất cả loại văn bản
    return allDocTypes;
  }, [filters.ho_so, availableDocTypes, folderDocTypesMap]);

  const handleFolderChange = (folderValue: string) => {
    const nextFilters: DocumentFilterParams = {
      ...filters,
      ho_so: folderValue || undefined,
      page: 1,
    };
    // Khóa nghiệp vụ: Phải chọn danh mục hồ sơ rồi mới được chọn loại văn bản.
    // Nếu bỏ chọn hồ sơ (chọn "Tất cả") -> tự động reset loại văn bản về undefined.
    if (!folderValue) {
      nextFilters.loai_van_ban = undefined;
    } else if (filters.loai_van_ban) {
      const allowedDynamic = folderDocTypesMap?.[folderValue];
      const allowedStatic = FOLDER_TO_DOC_TYPES_MAP[folderValue];
      const allowedList = allowedDynamic || allowedStatic;
      if (allowedList && !allowedList.includes(String(filters.loai_van_ban))) {
        nextFilters.loai_van_ban = undefined;
      }
    }
    onFilterChange(nextFilters);
  };

  const handleInputChange = (field: keyof DocumentFilterParams, value: unknown) => {
    onFilterChange({
      ...filters,
      [field]: value,
      page: 1, // Reset về trang 1 khi thay đổi điều kiện lọc
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm transition-all duration-normal mb-5 space-y-3.5">
      {/* Hàng 1: Từ khóa + Danh mục Hồ sơ + Loại văn bản */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* 1. Ô tìm kiếm từ khóa (4 cột) */}
        <div className="lg:col-span-4">
          <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center gap-1.5">
            <i className="fa-solid fa-magnifying-glass text-primary text-[0.75rem]" />
            Từ khóa tìm kiếm
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.q || ''}
              onChange={(e) => handleInputChange('q', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Số hiệu, trích yếu, nơi ban hành..."
              className="w-full bg-surface-elevated text-main text-sm rounded-lg px-3.5 py-2 pl-9 border border-border-subtle hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted"
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none" />
            {filters.q && (
              <button
                type="button"
                onClick={() => handleInputChange('q', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs p-1"
                title="Xóa từ khóa"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Dropdown Danh mục Hồ sơ (4 cột - Bước 1) */}
        <div className="lg:col-span-4">
          <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] inline-flex items-center justify-center font-bold">1</span>
              <i className="fa-solid fa-folder text-primary text-[0.75rem]" />
              <span className="text-secondary font-semibold">Danh mục hồ sơ</span>
            </span>
            <span className="text-[10px] text-muted italic flex items-center gap-1">
              Phân cấp theo hồ sơ
            </span>
          </label>
          <select
            value={filters.ho_so || ''}
            onChange={(e) => handleFolderChange(e.target.value)}
            className="w-full bg-surface-elevated text-main text-sm rounded-lg px-3 py-2 border border-border-subtle hover:border-primary/40 focus:border-primary focus:outline-none transition-all cursor-pointer"
            title="Chọn danh mục hồ sơ để lọc văn bản"
          >
            <option value="">Tất cả danh mục hồ sơ</option>
            {folderOptions.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Dropdown Loại văn bản (4 cột - tương ứng theo Danh mục hồ sơ, Khóa khi chưa chọn hồ sơ) */}
        <div className="lg:col-span-4">
          <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center font-bold ${
                filters.ho_so ? 'bg-primary/10 text-primary' : 'bg-hover text-muted'
              }`}>2</span>
              <i className={`fa-solid fa-file-lines text-[0.75rem] ${filters.ho_so ? 'text-primary' : 'text-muted'}`} />
              <span className={filters.ho_so ? 'text-secondary font-semibold' : 'text-muted font-normal'}>Loại văn bản</span>
            </span>
            {filters.ho_so ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium italic flex items-center gap-1">
                <i className="fa-solid fa-arrow-turn-down text-[9px]" /> Theo hồ sơ đã chọn
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic flex items-center gap-1">
                <i className="fa-solid fa-lock text-[9px]" /> Khóa (Cần chọn hồ sơ trước)
              </span>
            )}
          </label>
          <select
            disabled={!filters.ho_so}
            value={filters.loai_van_ban !== undefined ? String(filters.loai_van_ban) : ''}
            onChange={(e) => handleInputChange('loai_van_ban', e.target.value)}
            className="w-full text-sm bg-surface-elevated text-main rounded-lg px-3 py-2 border border-border-subtle hover:border-primary/40 focus:border-primary focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-hover/60"
            title={filters.ho_so ? "Chọn loại văn bản tương ứng" : "Khóa: Vui lòng chọn danh mục hồ sơ ở bước 1 trước"}
          >
            <option value="">{filters.ho_so ? 'Tất cả loại văn bản trong hồ sơ' : '— Vui lòng chọn danh mục hồ sơ trước —'}</option>
            {filteredDocTypeOptions.map((docType) => (
              <option key={docType} value={docType}>
                {docType}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hàng 2: Năm phát hành + Khoảng ngày đến + Trạng thái hiệu lực (3 trạng thái) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* 4. Chọn Năm (3 cột) */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center gap-1.5">
            <i className="fa-solid fa-calendar-days text-primary text-[0.75rem]" />
            Năm phát hành
          </label>
          <select
            value={filters.nam || ''}
            onChange={(e) => handleInputChange('nam', e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-surface-elevated text-main text-sm rounded-lg px-3 py-2 border border-border-subtle hover:border-primary/40 focus:border-primary focus:outline-none transition-all cursor-pointer"
          >
            <option value="">Tất cả các năm</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Khoảng ngày (Từ ngày -> Đến ngày) (5 cột) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5 truncate">
              {documentType === 'DEN' ? 'Từ ngày đến' : 'Từ ngày ban hành'}
            </label>
            <input
              type="date"
              value={filters.tu_ngay || ''}
              onChange={(e) => handleInputChange('tu_ngay', e.target.value)}
              className="w-full bg-surface-elevated text-main text-xs rounded-lg px-2.5 py-2 border border-border-subtle hover:border-primary/40 focus:border-primary focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5 truncate">
              {documentType === 'DEN' ? 'Đến ngày' : 'Đến ngày ban hành'}
            </label>
            <input
              type="date"
              value={filters.den_ngay || ''}
              onChange={(e) => handleInputChange('den_ngay', e.target.value)}
              className="w-full bg-surface-elevated text-main text-xs rounded-lg px-2.5 py-2 border border-border-subtle hover:border-primary/40 focus:border-primary focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* 6. Trạng thái Hiệu lực (Đúng 3 trạng thái theo xác nhận của Thầy) (4 cột) */}
        <div className="lg:col-span-4">
          <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center gap-1.5">
            <i className="fa-solid fa-shield-halved text-primary text-[0.75rem]" />
            Trạng thái hiệu lực
          </label>
          <select
            value={filters.hieu_luc || ''}
            onChange={(e) => handleInputChange('hieu_luc', e.target.value as DocumentStatus | 'HIEU_LUC' | '')}
            className="w-full bg-surface-elevated text-main text-sm rounded-lg px-3 py-2 border border-border-subtle hover:border-primary/40 focus:border-primary focus:outline-none transition-all cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="CON_HIEU_LUC">Còn hiệu lực</option>
            <option value="CON_HIEU_LUC_1_PHAN">Còn hiệu lực 1 phần</option>
            <option value="HET_HIEU_LUC">Hết hiệu lực</option>
          </select>
        </div>
      </div>

      {/* Dòng nút bấm Tác vụ */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle/60">
        <span className="text-xs text-muted flex items-center gap-1.5">
          <i className="fa-solid fa-circle-info text-primary/70" />
          Nhấn Enter trong ô tìm kiếm để tra cứu nhanh
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="fa-rotate-right"
            onClick={onReset}
            disabled={isLoading}
          >
            Đặt lại
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon="fa-magnifying-glass"
            isLoading={isLoading}
            onClick={onSearch}
          >
            Tìm kiếm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
