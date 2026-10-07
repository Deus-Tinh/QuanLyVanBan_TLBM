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
  // 2 tab chính: "category" (Thư mục) | "type" (Loại tài liệu)
  const [activeTab, setActiveTab] = useState<'category' | 'type'>('category');

  // Menu "⋯" đang mở theo ID
  const [activeMenuCatId, setActiveMenuCatId] = useState<number | null>(null);
  const [activeMenuTypeId, setActiveMenuTypeId] = useState<number | null>(null);

  // --- State Tab Thư mục ---
  const [catSearch, setCatSearch] = useState('');
  const [isEditingCat, setIsEditingCat] = useState(false);
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
  const [catDeleteBlockedMsg, setCatDeleteBlockedMsg] = useState<string | null>(null);

  // --- State Tab Loại tài liệu ---
  const [typeSearch, setTypeSearch] = useState('');
  const [filterParentCat, setFilterParentCat] = useState<string>('all');
  const [isEditingType, setIsEditingType] = useState(false);
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

  // Mở form thêm mới Thư mục
  const handleOpenAddCat = () => {
    setIsEditingCat(true);
    setEditingCatId(null);
    setCatError(null);
    setCatDeleteBlockedMsg(null);
    setCatForm({
      stt_uu_tien: nextOrderNumber(),
      ky_hieu: '',
      ten_tai_lieu: '',
      nguoi_lap_name: 'Thượng Mạnh Quỳnh',
      ngay_lap: new Date().toISOString().split('T')[0],
      ghi_chu: '',
    });
  };

  // Mở form chỉnh sửa Thư mục
  const handleOpenEditCat = (cat: ResourceCategory) => {
    setIsEditingCat(true);
    setEditingCatId(cat.id);
    setCatError(null);
    setCatDeleteBlockedMsg(null);
    setCatForm({
      stt_uu_tien: cat.stt_uu_tien,
      ky_hieu: cat.ky_hieu || '',
      ten_tai_lieu: cat.ten_tai_lieu,
      nguoi_lap_name: cat.nguoi_lap_name || 'Thượng Mạnh Quỳnh',
      ngay_lap: cat.ngay_lap || new Date().toISOString().split('T')[0],
      ghi_chu: cat.ghi_chu || '',
    });
  };

  // Lưu Thư mục
  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.ten_tai_lieu.trim()) {
      setCatError('Vui lòng nhập tên thư mục');
      return;
    }

    // Kiểm tra trùng STT ưu tiên theo đặc tả
    const isDuplicateOrder = categories.some(
      (c) => c.stt_uu_tien === Number(catForm.stt_uu_tien) && c.id !== editingCatId
    );
    if (isDuplicateOrder) {
      setCatError('STT ưu tiên đã tồn tại');
      return;
    }

    const payload: ResourceCategory = {
      id: editingCatId || Date.now(),
      stt_uu_tien: Number(catForm.stt_uu_tien),
      ky_hieu: catForm.ky_hieu.trim(),
      ten_tai_lieu: catForm.ten_tai_lieu.trim(),
      nguoi_lap_name: catForm.nguoi_lap_name,
      ngay_lap: catForm.ngay_lap,
      ghi_chu: catForm.ghi_chu.trim(),
    };

    onSaveCategory(payload, Boolean(editingCatId));
    setIsEditingCat(false);
  };

  // Xóa Thư mục (Chặn xóa nếu còn loại con)
  const handleDeleteCategoryWithCheck = (cat: ResourceCategory) => {
    setCatDeleteBlockedMsg(null);
    const childTypes = types.filter((t) => t.dm_tai_lieu === cat.id);
    if (childTypes.length > 0) {
      setCatDeleteBlockedMsg(`Không thể xóa vì thư mục còn ${childTypes.length} loại tài liệu`);
      return;
    }

    const confirmDelete = window.confirm(`Xóa thư mục "${cat.ten_tai_lieu}"? Hành động này không thể hoàn tác.`);
    if (confirmDelete) {
      onDeleteCategory(cat.id);
    }
  };

  // Mở form thêm mới Loại tài liệu
  const handleOpenAddType = () => {
    setIsEditingType(true);
    setEditingTypeId(null);
    setTypeError(null);
    setTypeForm({
      dm_tai_lieu: filterParentCat !== 'all' ? Number(filterParentCat) : categories[0]?.id || 1,
      ten_loai: '',
      is_public: true,
      ghi_chu: '',
    });
  };

  // Mở form chỉnh sửa Loại tài liệu
  const handleOpenEditType = (typeItem: ResourceType) => {
    setIsEditingType(true);
    setEditingTypeId(typeItem.id);
    setTypeError(null);
    setTypeForm({
      dm_tai_lieu: typeItem.dm_tai_lieu,
      ten_loai: typeItem.ten_loai,
      is_public: typeItem.is_public,
      ghi_chu: typeItem.ghi_chu || '',
    });
  };

  // Lưu Loại tài liệu
  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
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
    setIsEditingType(false);
  };

  // Xóa Loại tài liệu có xác nhận
  const handleDeleteTypeConfirm = (typeItem: ResourceType) => {
    const confirmDelete = window.confirm(`Xóa loại tài liệu "${typeItem.ten_loai}"? Hành động này không thể hoàn tác.`);
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
            <h2 className="text-base sm:text-lg font-bold text-main">
              Quản Lý Thư Mục &amp; Loại Tài Liệu
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Thiết lập cấu trúc Thư mục và danh mục phân loại biểu mẫu nội bộ
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

        {/* Tab Switcher (Chỉ 2 tab: Thư mục | Loại tài liệu) */}
        <div className="flex border-b border-border-subtle px-6 bg-surface shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('category');
              setIsEditingCat(false);
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
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary-subtle text-primary font-bold">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('type');
              setIsEditingType(false);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'type'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <i className="fa-solid fa-tags" />
            <span>Loại tài liệu</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-elevated text-secondary font-bold">
              {types.length}
            </span>
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {/* TAB 1: THƯ MỤC */}
          {activeTab === 'category' && (
            <div className="space-y-4">
              {/* Thông báo nếu bị chặn xóa do còn loại con */}
              {catDeleteBlockedMsg && (
                <div className="p-3 rounded-xl bg-danger-subtle text-danger border border-danger/30 text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation shrink-0" />
                    <span>{catDeleteBlockedMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCatDeleteBlockedMsg(null)}
                    className="p-1 hover:opacity-70 text-xs"
                    aria-label="Đóng cảnh báo"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              )}

              {/* Form Thêm / Sửa Thư mục */}
              {isEditingCat ? (
                <form
                  onSubmit={handleSaveCat}
                  className="p-4 sm:p-5 bg-surface-elevated rounded-xl border border-primary/30 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                    <h4 className="text-sm font-bold text-main flex items-center gap-2">
                      <i className="fa-solid fa-pen-to-square text-primary" />
                      {editingCatId ? 'Chỉnh sửa Thư mục' : 'Thêm mới Thư mục'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingCat(false)}
                      className="text-xs"
                    >
                      Hủy form
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* STT ưu tiên (max + 1) */}
                    <div className="sm:col-span-3">
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
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main font-mono focus:outline-hidden focus:border-primary"
                        required
                      />
                      {catError === 'STT ưu tiên đã tồn tại' && (
                        <p className="text-danger text-xs mt-1 font-medium">{catError}</p>
                      )}
                    </div>

                    {/* Ký hiệu */}
                    <div className="sm:col-span-4">
                      <label className="text-xs font-semibold text-main block mb-1">
                        Ký hiệu thư mục
                      </label>
                      <input
                        type="text"
                        placeholder="VD: TLBM-CHUNG"
                        value={catForm.ky_hieu}
                        onChange={(e) => setCatForm({ ...catForm, ky_hieu: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main font-mono focus:outline-hidden focus:border-primary"
                      />
                    </div>

                    {/* Tên thư mục (*) */}
                    <div className="sm:col-span-5">
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
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary"
                        required
                      />
                      {catError && catError !== 'STT ưu tiên đã tồn tại' && (
                        <p className="text-danger text-xs mt-1 font-medium">{catError}</p>
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
                        onChange={(e) => setCatForm({ ...catForm, nguoi_lap_name: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary"
                      />
                    </div>

                    {/* Ngày lập */}
                    <div className="sm:col-span-6">
                      <label className="text-xs font-semibold text-main block mb-1">Ngày lập</label>
                      <input
                        type="date"
                        value={catForm.ngay_lap}
                        onChange={(e) => setCatForm({ ...catForm, ngay_lap: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary"
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
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingCat(false)}>
                      Hủy
                    </Button>
                    <Button variant="primary" size="sm" type="submit" icon="fa-check">
                      {editingCatId ? 'Cập nhật thư mục' : 'Lưu thư mục'}
                    </Button>
                  </div>
                </form>
              ) : null}

              {/* Thanh công cụ Tab Thư mục */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc ký hiệu thư mục..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border-subtle rounded-lg text-xs text-main focus:outline-hidden focus:border-primary"
                  />
                </div>

                {!isEditingCat && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="fa-plus"
                    onClick={handleOpenAddCat}
                    className="text-xs shrink-0"
                  >
                    + Thêm thư mục
                  </Button>
                )}
              </div>

              {/* Bảng danh sách Thư mục */}
              <div className="w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-elevated font-bold text-muted uppercase border-b border-border-subtle">
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
                        <td colSpan={6} className="py-8 text-center text-muted">
                          Không tìm thấy thư mục nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat) => {
                        const childCount = types.filter((t) => t.dm_tai_lieu === cat.id).length;
                        return (
                          <tr key={cat.id} className="hover:bg-surface-elevated transition-colors">
                            <td className="px-3 py-3 text-center font-bold text-primary">
                              {cat.stt_uu_tien}
                            </td>
                            <td className="px-3 py-3 font-mono text-secondary">
                              {cat.ky_hieu || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-main block">{cat.ten_tai_lieu}</span>
                              {cat.ghi_chu && (
                                <span className="text-[11px] text-muted truncate block max-w-xs mt-0.5">
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
                                  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-surface border border-border-subtle shadow-lg z-20 py-1 text-left animate-fade-in">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuCatId(null);
                                        handleOpenEditCat(cat);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-main hover:bg-surface-elevated flex items-center gap-2 cursor-pointer"
                                    >
                                      <i className="fa-solid fa-pen-to-square text-muted text-xs" />
                                      <span>Sửa</span>
                                    </button>
                                    <div className="my-1 border-t border-border-subtle" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuCatId(null);
                                        handleDeleteCategoryWithCheck(cat);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-danger hover:bg-danger-subtle flex items-center gap-2 cursor-pointer font-medium"
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
              {/* Form Thêm / Sửa Loại tài liệu */}
              {isEditingType ? (
                <form
                  onSubmit={handleSaveType}
                  className="p-4 sm:p-5 bg-surface-elevated rounded-xl border border-primary/30 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                    <h4 className="text-sm font-bold text-main flex items-center gap-2">
                      <i className="fa-solid fa-tag text-primary" />
                      {editingTypeId ? 'Chỉnh sửa Loại tài liệu' : 'Thêm mới Loại tài liệu'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingType(false)}
                      className="text-xs"
                    >
                      Hủy form
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* Thư mục cha (*) */}
                    <div className="sm:col-span-5">
                      <label className="text-xs font-semibold text-main block mb-1">
                        Thư mục cha <span className="text-danger">*</span>
                      </label>
                      <select
                        value={typeForm.dm_tai_lieu}
                        onChange={(e) =>
                          setTypeForm({ ...typeForm, dm_tai_lieu: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary cursor-pointer"
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.ten_tai_lieu}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tên loại (*) */}
                    <div className="sm:col-span-5">
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
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary"
                        required
                      />
                      {typeError && (
                        <p className="text-danger text-xs mt-1 font-medium">{typeError}</p>
                      )}
                    </div>

                    {/* isPublic */}
                    <div className="sm:col-span-2 flex items-center pt-5">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-main select-none">
                        <input
                          type="checkbox"
                          checked={typeForm.is_public}
                          onChange={(e) =>
                            setTypeForm({ ...typeForm, is_public: e.target.checked })
                          }
                          className="rounded border-border-subtle text-primary focus:ring-0 cursor-pointer"
                        />
                        <span>Công khai</span>
                      </label>
                    </div>

                    {/* Ghi chú */}
                    <div className="sm:col-span-12">
                      <label className="text-xs font-semibold text-main block mb-1">Ghi chú</label>
                      <input
                        type="text"
                        placeholder="Mô tả mục đích sử dụng..."
                        value={typeForm.ghi_chu}
                        onChange={(e) => setTypeForm({ ...typeForm, ghi_chu: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-main focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingType(false)}>
                      Hủy
                    </Button>
                    <Button variant="primary" size="sm" type="submit" icon="fa-check">
                      {editingTypeId ? 'Cập nhật loại' : 'Lưu loại tài liệu'}
                    </Button>
                  </div>
                </form>
              ) : null}

              {/* Thanh công cụ Tab Loại tài liệu */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {/* Dropdown lọc Thư mục cha */}
                  <select
                    value={filterParentCat}
                    onChange={(e) => setFilterParentCat(e.target.value)}
                    className="px-3 py-1.5 bg-surface border border-border-subtle rounded-lg text-xs text-main focus:outline-hidden focus:border-primary cursor-pointer shrink-0"
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
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs" />
                    <input
                      type="text"
                      placeholder="Tìm tên loại tài liệu..."
                      value={typeSearch}
                      onChange={(e) => setTypeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border-subtle rounded-lg text-xs text-main focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                {!isEditingType && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="fa-plus"
                    onClick={handleOpenAddType}
                    className="text-xs shrink-0"
                  >
                    + Thêm loại
                  </Button>
                )}
              </div>

              {/* Bảng danh sách Loại tài liệu */}
              <div className="w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-elevated font-bold text-muted uppercase border-b border-border-subtle">
                    <tr>
                      <th className="px-4 py-3 min-w-[200px]">Tên loại tài liệu</th>
                      <th className="px-3 py-3 w-48">Thư mục cha</th>
                      <th className="px-3 py-3 w-28 text-center">Công khai</th>
                      <th className="px-3 py-3 min-w-[160px]">Ghi chú</th>
                      <th className="px-3 py-3 w-16 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted">
                          Không tìm thấy loại tài liệu nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredTypes.map((t) => {
                        const parentCat = categories.find((c) => c.id === t.dm_tai_lieu);
                        const isNonPublic = !t.is_public;
                        return (
                          <tr
                            key={t.id}
                            className={`transition-colors ${
                              isNonPublic
                                ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200'
                                : 'hover:bg-surface-elevated'
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold">
                              <span>{t.ten_loai}</span>
                            </td>
                            <td className="px-3 py-3 text-secondary">
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
                                  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-surface border border-border-subtle shadow-lg z-20 py-1 text-left animate-fade-in">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuTypeId(null);
                                        handleOpenEditType(t);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-main hover:bg-surface-elevated flex items-center gap-2 cursor-pointer"
                                    >
                                      <i className="fa-solid fa-pen-to-square text-muted text-xs" />
                                      <span>Sửa</span>
                                    </button>
                                    <div className="my-1 border-t border-border-subtle" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuTypeId(null);
                                        handleDeleteTypeConfirm(t);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-left text-danger hover:bg-danger-subtle flex items-center gap-2 cursor-pointer font-medium"
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
        <div className="px-6 py-3.5 border-t border-border-subtle bg-surface-elevated flex items-center justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
