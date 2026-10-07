import React, { useState, useMemo, useEffect } from 'react';
import { ResourceCategory, ResourceType } from '@app-types/resource';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';

export interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ResourceCategory[];
  types: ResourceType[];
  onSaveCategory: (category: ResourceCategory, isEdit: boolean) => void;
  onDeleteCategory: (id: number) => void;
  onSaveType: (type: ResourceType, isEdit: boolean) => void;
  onDeleteType: (id: number) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  types,
  onSaveCategory,
  onDeleteCategory,
  onSaveType,
  onDeleteType,
}) => {
  // 2 tab chính quản lý: "category" (Thư mục) | "type" (Loại tài liệu)
  const [activeTab, setActiveTab] = useState<'category' | 'type'>('category');

  // Menu "⋯" đang mở theo ID
  const [activeMenuCatId, setActiveMenuCatId] = useState<number | null>(null);
  const [activeMenuTypeId, setActiveMenuTypeId] = useState<number | null>(null);

  // Tìm kiếm & Lọc trên bảng
  const [catSearch, setCatSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [filterParentCat, setFilterParentCat] = useState<string>('all');
  const [catDeleteBlockedMsg, setCatDeleteBlockedMsg] = useState<string | null>(null);

  // ============================================================================
  // UNIFIED SUB-MODAL STATE: Dùng chung cho Tạo mới & Chỉnh sửa
  // ============================================================================
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
  const [unifiedMode, setUnifiedMode] = useState<'create' | 'edit'>('create');
  const [unifiedTarget, setUnifiedTarget] = useState<'category' | 'type'>('category');

  // State Thư mục
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState({
    stt_uu_tien: 1,
    ky_hieu: '',
    ten_tai_lieu: '',
    nguoi_lap_name: 'Thượng Mạnh Quỳnh',
    ngay_lap: new Date().toISOString().split('T')[0],
    ghi_chu: '',
  });
  const [catError, setCatError] = useState<string | null>(null);
  // Danh sách loại con thêm nhanh khi tạo mới thư mục
  const [catChildTypes, setCatChildTypes] = useState<string[]>([]);
  const [childTypeInput, setChildTypeInput] = useState('');

  // State Loại tài liệu
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [typeForm, setTypeForm] = useState({
    dm_tai_lieu: categories.length > 0 ? categories[0].id : 1,
    ten_loai: '',
    is_public: true,
    ghi_chu: '',
  });
  const [typeError, setTypeError] = useState<string | null>(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleOutside = () => {
      setActiveMenuCatId(null);
      setActiveMenuTypeId(null);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  // Tính số thứ tự ưu tiên lớn nhất + 1 để tự động điền khi tạo mới Thư mục
  const nextOrderNumber = () => {
    if (categories.length === 0) return 1;
    const maxOrder = Math.max(...categories.map((c) => c.stt_uu_tien || 0));
    return maxOrder + 1;
  };

  // Mở Popup Tạo mới hợp nhất
  const handleOpenUnifiedCreate = (target: 'category' | 'type') => {
    setUnifiedMode('create');
    setUnifiedTarget(target);
    setEditingCatId(null);
    setEditingTypeId(null);
    setCatError(null);
    setTypeError(null);
    setCatDeleteBlockedMsg(null);
    setCatChildTypes([]);
    setChildTypeInput('');

    // Khởi tạo form Thư mục
    setCatForm({
      stt_uu_tien: nextOrderNumber(),
      ky_hieu: '',
      ten_tai_lieu: '',
      nguoi_lap_name: 'Thượng Mạnh Quỳnh',
      ngay_lap: new Date().toISOString().split('T')[0],
      ghi_chu: '',
    });

    // Khởi tạo form Loại tài liệu
    const defaultCatId =
      filterParentCat !== 'all' ? Number(filterParentCat) : categories[0]?.id || 1;
    setTypeForm({
      dm_tai_lieu: defaultCatId,
      ten_loai: '',
      is_public: true,
      ghi_chu: '',
    });

    setIsUnifiedModalOpen(true);
  };

  // Mở Popup Chỉnh sửa Thư mục
  const handleOpenEditCat = (cat: ResourceCategory) => {
    setUnifiedMode('edit');
    setUnifiedTarget('category');
    setEditingCatId(cat.id);
    setEditingTypeId(null);
    setCatError(null);
    setCatDeleteBlockedMsg(null);
    setCatChildTypes([]);
    setChildTypeInput('');

    setCatForm({
      stt_uu_tien: cat.stt_uu_tien,
      ky_hieu: cat.ky_hieu || '',
      ten_tai_lieu: cat.ten_tai_lieu,
      nguoi_lap_name: cat.nguoi_lap_name || 'Thượng Mạnh Quỳnh',
      ngay_lap: cat.ngay_lap || new Date().toISOString().split('T')[0],
      ghi_chu: cat.ghi_chu || '',
    });

    setIsUnifiedModalOpen(true);
  };

  // Mở Popup Chỉnh sửa Loại tài liệu
  const handleOpenEditType = (typeItem: ResourceType) => {
    setUnifiedMode('edit');
    setUnifiedTarget('type');
    setEditingTypeId(typeItem.id);
    setEditingCatId(null);
    setTypeError(null);

    setTypeForm({
      dm_tai_lieu: typeItem.dm_tai_lieu,
      ten_loai: typeItem.ten_loai,
      is_public: typeItem.is_public,
      ghi_chu: typeItem.ghi_chu || '',
    });

    setIsUnifiedModalOpen(true);
  };

  // Thêm nhanh Loại con vào Thư mục
  const handleAddChildType = () => {
    const trimmed = childTypeInput.trim();
    if (!trimmed) return;
    if (catChildTypes.includes(trimmed)) return;
    setCatChildTypes([...catChildTypes, trimmed]);
    setChildTypeInput('');
  };

  const handleRemoveChildType = (index: number) => {
    setCatChildTypes(catChildTypes.filter((_, i) => i !== index));
  };

  // Submit Form hợp nhất
  const handleUnifiedSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (unifiedTarget === 'category') {
      // Validate Thư mục
      if (!catForm.ten_tai_lieu.trim()) {
        setCatError('Vui lòng nhập tên thư mục');
        return;
      }

      const isDuplicateOrder = categories.some(
        (c) => c.stt_uu_tien === Number(catForm.stt_uu_tien) && c.id !== editingCatId
      );
      if (isDuplicateOrder) {
        setCatError('STT ưu tiên đã tồn tại');
        return;
      }

      const categoryId = editingCatId || Date.now();
      const payload: ResourceCategory = {
        id: categoryId,
        stt_uu_tien: Number(catForm.stt_uu_tien),
        ky_hieu: catForm.ky_hieu.trim(),
        ten_tai_lieu: catForm.ten_tai_lieu.trim(),
        nguoi_lap_name: catForm.nguoi_lap_name,
        ngay_lap: catForm.ngay_lap,
        ghi_chu: catForm.ghi_chu.trim(),
      };

      onSaveCategory(payload, Boolean(editingCatId));

      // Nếu tạo mới thư mục và có thêm kèm các loại con
      if (!editingCatId && catChildTypes.length > 0) {
        catChildTypes.forEach((typeName, idx) => {
          onSaveType(
            {
              id: Date.now() + idx + 1,
              dm_tai_lieu: categoryId,
              ten_loai: typeName.trim(),
              is_public: true,
              ghi_chu: `Khởi tạo cùng thư mục ${catForm.ten_tai_lieu.trim()}`,
              ngay_lap: catForm.ngay_lap,
            },
            false
          );
        });
      }

      setIsUnifiedModalOpen(false);
    } else {
      // Validate & Lưu Loại tài liệu
      if (!typeForm.ten_loai.trim()) {
        setTypeError('Vui lòng nhập tên loại tài liệu');
        return;
      }

      const payload: ResourceType = {
        id: editingTypeId || Date.now(),
        dm_tai_lieu: Number(typeForm.dm_tai_lieu),
        ten_loai: typeForm.ten_loai.trim(),
        is_public: typeForm.is_public,
        ghi_chu: typeForm.ghi_chu.trim(),
        ngay_lap: new Date().toISOString().split('T')[0],
      };

      onSaveType(payload, Boolean(editingTypeId));
      setIsUnifiedModalOpen(false);
    }
  };

  // Xóa Thư mục (Chặn xóa nếu còn loại con)
  const handleDeleteCategoryWithCheck = (cat: ResourceCategory) => {
    setCatDeleteBlockedMsg(null);
    const childTypes = types.filter((t) => t.dm_tai_lieu === cat.id);
    if (childTypes.length > 0) {
      setCatDeleteBlockedMsg(`Không thể xóa vì thư mục còn ${childTypes.length} loại tài liệu`);
      return;
    }

    const confirmDelete = window.confirm(
      `Xóa thư mục "${cat.ten_tai_lieu}"? Hành động này không thể hoàn tác.`
    );
    if (confirmDelete) {
      onDeleteCategory(cat.id);
    }
  };

  // Xóa Loại tài liệu có xác nhận
  const handleDeleteTypeConfirm = (typeItem: ResourceType) => {
    const confirmDelete = window.confirm(
      `Xóa loại tài liệu "${typeItem.ten_loai}"? Hành động này không thể hoàn tác.`
    );
    if (confirmDelete) {
      onDeleteType(typeItem.id);
    }
  };

  // Thư mục đã lọc và sắp xếp theo STT ưu tiên
  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => {
        if (!catSearch.trim()) return true;
        const term = catSearch.toLowerCase();
        return (
          c.ten_tai_lieu.toLowerCase().includes(term) ||
          (c.ky_hieu || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.stt_uu_tien - b.stt_uu_tien);
  }, [categories, catSearch]);

  // Loại tài liệu đã lọc
  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      if (filterParentCat !== 'all' && t.dm_tai_lieu !== Number(filterParentCat)) {
        return false;
      }
      if (typeSearch.trim()) {
        const term = typeSearch.toLowerCase();
        return t.ten_loai.toLowerCase().includes(term);
      }
      return true;
    });
  }, [types, filterParentCat, typeSearch]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-surface rounded-2xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-elevated shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-main flex items-center gap-2">
              <i className="fa-solid fa-folder-tree text-primary text-base" />
              <span>Quản Lý Thư Mục &amp; Loại Tài Liệu</span>
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Thiết lập cấu trúc Thư mục (Cấp 1) và danh mục phân loại biểu mẫu nội bộ (Cấp 2)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface transition-colors cursor-pointer"
            aria-label="Đóng popup"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Tab Switcher (Thư mục | Loại tài liệu) */}
        <div className="flex border-b border-border-subtle px-6 bg-surface shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('category');
              setCatDeleteBlockedMsg(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'category'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <i className="fa-solid fa-folder" />
            <span>Thư mục</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'category'
                  ? 'bg-primary-subtle text-primary'
                  : 'bg-surface-elevated text-secondary'
              }`}
            >
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('type');
              setCatDeleteBlockedMsg(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'type'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <i className="fa-solid fa-tags" />
            <span>Loại tài liệu</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'type'
                  ? 'bg-primary-subtle text-primary'
                  : 'bg-surface-elevated text-secondary'
              }`}
            >
              {types.length}
            </span>
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {/* Cảnh báo nếu xóa thư mục bị chặn */}
          {catDeleteBlockedMsg && (
            <div className="p-3 rounded-xl bg-danger-subtle text-danger border border-danger/30 text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation shrink-0" />
                <span>{catDeleteBlockedMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setCatDeleteBlockedMsg(null)}
                className="p-1 hover:opacity-70 text-xs cursor-pointer"
                aria-label="Đóng cảnh báo"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          )}

          {/* TAB 1: THƯ MỤC */}
          {activeTab === 'category' && (
            <div className="space-y-4">
              {/* Thanh công cụ Tab Thư mục */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc ký hiệu thư mục..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary transition-all shadow-2xs"
                  />
                  {catSearch && (
                    <button
                      type="button"
                      onClick={() => setCatSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs p-1 cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon="fa-plus"
                  onClick={() => handleOpenUnifiedCreate('category')}
                  className="h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 shadow-sm hover:shadow-glow"
                  title="Thêm mới Thư mục hoặc Loại tài liệu"
                >
                  Thêm mới
                </Button>
              </div>

              {/* Bảng danh sách Thư mục */}
              <div className="w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-elevated font-bold text-muted uppercase tracking-wider border-b border-border-subtle">
                    <tr>
                      <th className="px-3 py-3 w-16 text-center">STT</th>
                      <th className="px-3 py-3 w-28">Ký hiệu</th>
                      <th className="px-4 py-3 min-w-[200px]">Tên thư mục</th>
                      <th className="px-3 py-3 w-32">Ngày lập</th>
                      <th className="px-3 py-3 w-28 text-center">Loại con</th>
                      <th className="px-3 py-3 w-16 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-muted">
                          <i className="fa-solid fa-folder-open text-2xl mb-2 block opacity-40" />
                          Không tìm thấy thư mục nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat) => {
                        const childCount = types.filter((t) => t.dm_tai_lieu === cat.id).length;
                        return (
                          <tr key={cat.id} className="hover:bg-surface-elevated/70 transition-colors">
                            <td className="px-3 py-3 text-center font-bold text-primary font-mono">
                              {cat.stt_uu_tien}
                            </td>
                            <td className="px-3 py-3 font-mono font-medium text-secondary">
                              {cat.ky_hieu || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-main block">{cat.ten_tai_lieu}</span>
                              {cat.ghi_chu && (
                                <span className="text-[11px] text-muted truncate block max-w-sm mt-0.5">
                                  {cat.ghi_chu}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-secondary">{cat.ngay_lap || '-'}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-elevated text-secondary border border-border-subtle">
                                {childCount} loại
                              </span>
                            </td>
                            <td
                              className="px-3 py-3 text-center whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveMenuCatId(activeMenuCatId === cat.id ? null : cat.id)
                                  }
                                  className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors cursor-pointer"
                                  title="Thao tác"
                                  aria-label={`Thao tác với thư mục ${cat.ten_tai_lieu}`}
                                >
                                  <i className="fa-solid fa-ellipsis text-xs" />
                                </button>

                                {activeMenuCatId === cat.id && (
                                  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-surface border border-border-subtle shadow-lg z-30 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuCatId(null);
                                        handleOpenEditCat(cat);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-main hover:bg-surface-elevated flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <i className="fa-solid fa-pen-to-square text-primary text-xs" />
                                      <span>Sửa</span>
                                    </button>
                                    <div className="my-1 border-t border-border-subtle" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuCatId(null);
                                        handleDeleteCategoryWithCheck(cat);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-danger hover:bg-danger-subtle flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                    >
                                      <i className="fa-solid fa-trash-can text-danger text-xs" />
                                      <span>Xóa</span>
                                    </button>
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
            </div>
          )}

          {/* TAB 2: LOẠI TÀI LIỆU */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              {/* Thanh công cụ Tab Loại tài liệu */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {/* Dropdown lọc Thư mục cha */}
                  <select
                    value={filterParentCat}
                    onChange={(e) => setFilterParentCat(e.target.value)}
                    className="h-9 px-3 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary cursor-pointer shrink-0 shadow-2xs font-medium"
                    aria-label="Lọc theo thư mục cha"
                  >
                    <option value="all">Tất cả thư mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ten_tai_lieu}
                      </option>
                    ))}
                  </select>

                  {/* Ô tìm nhanh theo tên loại */}
                  <div className="relative flex-1 max-w-xs">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm tên loại tài liệu..."
                      value={typeSearch}
                      onChange={(e) => setTypeSearch(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary transition-all shadow-2xs"
                    />
                    {typeSearch && (
                      <button
                        type="button"
                        onClick={() => setTypeSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs p-1 cursor-pointer"
                        title="Xóa tìm kiếm"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon="fa-plus"
                  onClick={() => handleOpenUnifiedCreate('type')}
                  className="h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 shadow-sm hover:shadow-glow"
                  title="Thêm mới Thư mục hoặc Loại tài liệu"
                >
                  Thêm mới
                </Button>
              </div>

              {/* Bảng danh sách Loại tài liệu */}
              <div className="w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-elevated font-bold text-muted uppercase tracking-wider border-b border-border-subtle">
                    <tr>
                      <th className="px-4 py-3 min-w-[200px]">Tên loại tài liệu</th>
                      <th className="px-3 py-3 w-48">Thư mục cha</th>
                      <th className="px-3 py-3 w-28 text-center">Phạm vi</th>
                      <th className="px-3 py-3 min-w-[160px]">Ghi chú</th>
                      <th className="px-3 py-3 w-16 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted">
                          <i className="fa-solid fa-tags text-2xl mb-2 block opacity-40" />
                          Không tìm thấy loại tài liệu nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredTypes.map((t) => {
                        const parentCat = categories.find((c) => c.id === t.dm_tai_lieu);
                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-surface-elevated/70 transition-colors"
                          >
                            <td className="px-4 py-3 font-semibold text-main">
                              <span className="flex items-center gap-2">
                                <i
                                  className={`fa-solid ${
                                    t.is_public ? 'fa-tag text-primary/70' : 'fa-lock text-amber-500'
                                  } text-[11px]`}
                                />
                                <span>{t.ten_loai}</span>
                              </span>
                            </td>
                            <td className="px-3 py-3 text-secondary font-medium">
                              {parentCat?.ten_tai_lieu || `Thư mục #${t.dm_tai_lieu}`}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {t.is_public ? (
                                <Badge variant="success" size="sm">
                                  Công khai
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  Nội bộ
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-3 text-muted">{t.ghi_chu || '-'}</td>
                            <td
                              className="px-3 py-3 text-center whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveMenuTypeId(activeMenuTypeId === t.id ? null : t.id)
                                  }
                                  className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors cursor-pointer"
                                  title="Thao tác"
                                  aria-label={`Thao tác với loại ${t.ten_loai}`}
                                >
                                  <i className="fa-solid fa-ellipsis text-xs" />
                                </button>

                                {activeMenuTypeId === t.id && (
                                  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-surface border border-border-subtle shadow-lg z-30 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuTypeId(null);
                                        handleOpenEditType(t);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-main hover:bg-surface-elevated flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <i className="fa-solid fa-pen-to-square text-primary text-xs" />
                                      <span>Sửa</span>
                                    </button>
                                    <div className="my-1 border-t border-border-subtle" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuTypeId(null);
                                        handleDeleteTypeConfirm(t);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-danger hover:bg-danger-subtle flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                    >
                                      <i className="fa-solid fa-trash-can text-danger text-xs" />
                                      <span>Xóa</span>
                                    </button>
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
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 border-t border-border-subtle bg-surface-elevated flex items-center justify-between shrink-0">
          <span className="text-xs text-muted">
            Tổng cộng: <strong className="text-main">{categories.length}</strong> thư mục,{' '}
            <strong className="text-main">{types.length}</strong> loại tài liệu
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
            Đóng
          </Button>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* DIALOG TẠO MỚI / CHỈNH SỬA HỢP NHẤT (POPUP CON RIÊNG BIỆT KHÔNG ĐẨY BẢNG)     */}
      {/* ============================================================================ */}
      {isUnifiedModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsUnifiedModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-surface rounded-2xl border border-border-subtle shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Dialog */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-elevated shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <i
                    className={`fa-solid ${
                      unifiedTarget === 'category' ? 'fa-folder' : 'fa-tags'
                    } text-sm`}
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-main">
                    {unifiedMode === 'create'
                      ? 'Thêm Mới Danh Mục / Loại Tài Liệu'
                      : unifiedTarget === 'category'
                        ? 'Chỉnh Sửa Thư Mục'
                        : 'Chỉnh Sửa Loại Tài Liệu'}
                  </h3>
                  <p className="text-[11px] text-muted">
                    {unifiedMode === 'create'
                      ? 'Lựa chọn cấp phân loại và nhập thông tin để tạo mới'
                      : 'Cập nhật lại thông tin cấu hình'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUnifiedModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface transition-colors cursor-pointer"
                aria-label="Đóng form"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleUnifiedSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Khi ở chế độ Tạo mới: Thanh Segmented Switcher chọn Cấp 1 hoặc Cấp 2 */}
                {unifiedMode === 'create' && (
                  <div className="p-1 bg-surface-elevated rounded-xl flex items-center gap-1 border border-border-subtle">
                    <button
                      type="button"
                      onClick={() => setUnifiedTarget('category')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        unifiedTarget === 'category'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-secondary hover:text-main hover:bg-surface'
                      }`}
                    >
                      <i className="fa-solid fa-folder text-xs" />
                      <span>Thư mục (Cấp 1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnifiedTarget('type')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        unifiedTarget === 'type'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-secondary hover:text-main hover:bg-surface'
                      }`}
                    >
                      <i className="fa-solid fa-tags text-xs" />
                      <span>Loại tài liệu (Cấp 2)</span>
                    </button>
                  </div>
                )}

                {/* NỘI DUNG 1: FORM THƯ MỤC (CẤP 1) */}
                {unifiedTarget === 'category' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* STT ưu tiên */}
                      <div className="sm:col-span-4">
                        <label className="text-xs font-semibold text-main block mb-1">
                          STT ưu tiên <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={catForm.stt_uu_tien}
                          onChange={(e) => {
                            setCatForm({ ...catForm, stt_uu_tien: Number(e.target.value) });
                            setCatError(null);
                          }}
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-main focus:outline-hidden focus:border-primary shadow-2xs"
                          required
                        />
                        {catError === 'STT ưu tiên đã tồn tại' && (
                          <p className="text-danger text-[11px] mt-1 font-medium">{catError}</p>
                        )}
                      </div>

                      {/* Ký hiệu thư mục */}
                      <div className="sm:col-span-8">
                        <label className="text-xs font-semibold text-main block mb-1">
                          Ký hiệu thư mục
                        </label>
                        <input
                          type="text"
                          placeholder="VD: TLBM-CHUNG"
                          value={catForm.ky_hieu}
                          onChange={(e) => setCatForm({ ...catForm, ky_hieu: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono text-main focus:outline-hidden focus:border-primary shadow-2xs"
                        />
                      </div>

                      {/* Tên thư mục (*) */}
                      <div className="sm:col-span-12">
                        <label className="text-xs font-semibold text-main block mb-1">
                          Tên thư mục <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Tài liệu, Biểu mẫu chung"
                          value={catForm.ten_tai_lieu}
                          onChange={(e) => {
                            setCatForm({ ...catForm, ten_tai_lieu: e.target.value });
                            if (catError && catError !== 'STT ưu tiên đã tồn tại') setCatError(null);
                          }}
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary shadow-2xs"
                          required
                        />
                        {catError && catError !== 'STT ưu tiên đã tồn tại' && (
                          <p className="text-danger text-[11px] mt-1 font-medium">{catError}</p>
                        )}
                      </div>

                      {/* Người lập */}
                      <div className="sm:col-span-6">
                        <label className="text-xs font-semibold text-main block mb-1">
                          Người lập thư mục
                        </label>
                        <input
                          type="text"
                          value={catForm.nguoi_lap_name}
                          onChange={(e) =>
                            setCatForm({ ...catForm, nguoi_lap_name: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary shadow-2xs"
                        />
                      </div>

                      {/* Ngày lập */}
                      <div className="sm:col-span-6">
                        <label className="text-xs font-semibold text-main block mb-1">Ngày lập</label>
                        <input
                          type="date"
                          value={catForm.ngay_lap}
                          onChange={(e) => setCatForm({ ...catForm, ngay_lap: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary shadow-2xs"
                        />
                      </div>

                      {/* Ghi chú */}
                      <div className="sm:col-span-12">
                        <label className="text-xs font-semibold text-main block mb-1">Ghi chú</label>
                        <input
                          type="text"
                          placeholder="Mô tả phạm vi áp dụng của thư mục..."
                          value={catForm.ghi_chu}
                          onChange={(e) => setCatForm({ ...catForm, ghi_chu: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Tùy chọn Thêm nhanh các loại tài liệu con (Khi tạo mới) */}
                    {unifiedMode === 'create' && (
                      <div className="pt-3 border-t border-border-subtle space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-main flex items-center gap-1.5">
                            <i className="fa-solid fa-sitemap text-primary text-xs" />
                            <span>Thêm nhanh loại tài liệu con thuộc thư mục này (Tùy chọn)</span>
                          </label>
                          <span className="text-[11px] text-muted">
                            Đã thêm: {catChildTypes.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nhập tên loại (VD: Quy chế, Biểu mẫu...) rồi nhấn Enter"
                            value={childTypeInput}
                            onChange={(e) => setChildTypeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddChildType();
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary shadow-2xs"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon="fa-plus"
                            onClick={handleAddChildType}
                            className="text-xs shrink-0 rounded-xl font-semibold"
                          >
                            Thêm
                          </Button>
                        </div>

                        {catChildTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                            {catChildTypes.map((t, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 shadow-2xs"
                              >
                                <i className="fa-solid fa-tag text-[10px]" />
                                <span>{t}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChildType(idx)}
                                  className="hover:text-danger ml-0.5 cursor-pointer text-xs"
                                  title="Xóa loại này"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* NỘI DUNG 2: FORM LOẠI TÀI LIỆU (CẤP 2) */}
                {unifiedTarget === 'type' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Thư mục cha (*) */}
                      <div className="sm:col-span-8">
                        <label className="text-xs font-semibold text-main block mb-1">
                          Thư mục cha <span className="text-danger">*</span>
                        </label>
                        <select
                          value={typeForm.dm_tai_lieu}
                          onChange={(e) =>
                            setTypeForm({ ...typeForm, dm_tai_lieu: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary cursor-pointer shadow-2xs font-medium"
                          required
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.ten_tai_lieu}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phạm vi: Công khai checkbox */}
                      <div className="sm:col-span-4 flex items-center pt-5">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-main select-none">
                          <input
                            type="checkbox"
                            checked={typeForm.is_public}
                            onChange={(e) =>
                              setTypeForm({ ...typeForm, is_public: e.target.checked })
                            }
                            className="rounded border-border-subtle text-primary focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <span>Công khai dùng chung</span>
                        </label>
                      </div>

                      {/* Tên loại tài liệu (*) */}
                      <div className="sm:col-span-12">
                        <label className="text-xs font-semibold text-main block mb-1">
                          Tên loại tài liệu <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Biểu mẫu bảo hiểm, Tờ trình..."
                          value={typeForm.ten_loai}
                          onChange={(e) => {
                            setTypeForm({ ...typeForm, ten_loai: e.target.value });
                            setTypeError(null);
                          }}
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary shadow-2xs"
                          required
                        />
                        {typeError && (
                          <p className="text-danger text-[11px] mt-1 font-medium">{typeError}</p>
                        )}
                      </div>

                      {/* Ghi chú */}
                      <div className="sm:col-span-12">
                        <label className="text-xs font-semibold text-main block mb-1">Ghi chú</label>
                        <input
                          type="text"
                          placeholder="Mô tả mục đích sử dụng..."
                          value={typeForm.ghi_chu}
                          onChange={(e) => setTypeForm({ ...typeForm, ghi_chu: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-main focus:outline-hidden focus:border-primary shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dialog Footer */}
              <div className="px-5 py-3.5 border-t border-border-subtle bg-surface-elevated flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUnifiedModalOpen(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon="fa-check"
                  className="rounded-xl text-xs font-bold shadow-sm hover:shadow-glow px-4"
                >
                  {unifiedMode === 'create'
                    ? unifiedTarget === 'category'
                      ? 'Lưu thư mục'
                      : 'Lưu loại tài liệu'
                    : 'Cập nhật thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
