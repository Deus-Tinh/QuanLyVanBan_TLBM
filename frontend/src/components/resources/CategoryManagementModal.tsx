import React, { useState, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState<'category' | 'type'>('category');

  // --- State cho Danh mục Cấp 1 ---
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

  // --- State cho Loại biểu mẫu Cấp 2 ---
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

  // Tính số thứ tự ưu tiên lớn nhất + 1 để tự động điền khi tạo mới Cấp 1
  const nextOrderNumber = () => {
    if (categories.length === 0) return 1;
    const maxOrder = Math.max(...categories.map((c) => c.stt_uu_tien || 0));
    return maxOrder + 1;
  };

  // Mở form thêm mới Cấp 1
  const handleOpenAddCat = () => {
    setIsEditingCat(true);
    setEditingCatId(null);
    setCatError(null);
    setCatForm({
      stt_uu_tien: nextOrderNumber(),
      ky_hieu: '',
      ten_tai_lieu: '',
      nguoi_lap_name: 'Thượng Mạnh Quỳnh',
      ngay_lap: new Date().toISOString().split('T')[0],
      ghi_chu: '',
    });
  };

  // Mở form chỉnh sửa Cấp 1
  const handleOpenEditCat = (cat: ResourceCategory) => {
    setIsEditingCat(true);
    setEditingCatId(cat.id);
    setCatError(null);
    setCatForm({
      stt_uu_tien: cat.stt_uu_tien,
      ky_hieu: cat.ky_hieu || '',
      ten_tai_lieu: cat.ten_tai_lieu,
      nguoi_lap_name: cat.nguoi_lap_name || 'Thượng Mạnh Quỳnh',
      ngay_lap: cat.ngay_lap || new Date().toISOString().split('T')[0],
      ghi_chu: cat.ghi_chu || '',
    });
  };

  // Lưu Danh mục Cấp 1
  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.ten_tai_lieu.trim()) {
      setCatError('Vui lòng nhập tên danh mục tài liệu');
      return;
    }

    // Kiểm tra trùng STT ưu tiên theo đặc tả yêu cầu
    const isDuplicateOrder = categories.some(
      (c) => c.stt_uu_tien === Number(catForm.stt_uu_tien) && c.id !== editingCatId
    );
    if (isDuplicateOrder) {
      setCatError(`Số thứ tự ưu tiên ${catForm.stt_uu_tien} đã tồn tại! Vui lòng chọn số khác.`);
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

  // Mở form thêm mới Cấp 2
  const handleOpenAddType = () => {
    setIsEditingType(true);
    setEditingTypeId(null);
    setTypeError(null);
    setTypeForm({
      dm_tai_lieu: filterParentCat !== 'all' ? Number(filterParentCat) : (categories[0]?.id || 1),
      ten_loai: '',
      is_public: true,
      ghi_chu: '',
    });
  };

  // Mở form chỉnh sửa Cấp 2
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

  // Lưu Loại biểu mẫu Cấp 2
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

  // Danh mục Cấp 1 đã lọc
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

  // Loại Cấp 2 đã lọc
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-folder-tree" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-main">
                Quản Lý Cấu Trúc Danh Mục &amp; Loại Biểu Mẫu
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Thiết lập Danh mục cấp 1 và phân loại biểu mẫu cấp 2 theo quy chuẩn hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border-subtle px-6 bg-surface">
          <button
            type="button"
            onClick={() => {
              setActiveTab('category');
              setIsEditingCat(false);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'category'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <i className="fa-solid fa-layer-group" />
            <span>Danh mục tài liệu (Cấp 1)</span>
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
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-main'
            }`}
          >
            <i className="fa-solid fa-tags" />
            <span>Loại tài liệu &amp; biểu mẫu (Cấp 2)</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-elevated text-secondary font-bold">
              {types.length}
            </span>
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: DANH MỤC CẤP 1 */}
          {activeTab === 'category' && (
            <div className="space-y-4">
              {/* Form Thêm/Sửa Cấp 1 */}
              {isEditingCat ? (
                <form
                  onSubmit={handleSaveCat}
                  className="p-4 sm:p-5 bg-surface-elevated rounded-xl border border-primary/30 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                    <h4 className="text-sm font-bold text-main flex items-center gap-2">
                      <i className="fa-solid fa-pen-to-square text-primary" />
                      {editingCatId ? 'Chỉnh sửa Danh mục Cấp 1' : 'Thêm mới Danh mục Cấp 1'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingCat(false)}
                      className="text-xs"
                    >
                      Hủy bỏ
                    </Button>
                  </div>

                  {catError && (
                    <div className="p-3 text-xs bg-danger-subtle text-danger rounded-lg flex items-center gap-2">
                      <i className="fa-solid fa-circle-exclamation shrink-0" />
                      <span>{catError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        STT ưu tiên hiển thị <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={catForm.stt_uu_tien}
                        onChange={(e) =>
                          setCatForm({ ...catForm, stt_uu_tien: Number(e.target.value) })
                        }
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary"
                        title="Tự động lấy số lớn nhất + 1, kiểm tra không trùng lặp"
                      />
                      <span className="text-[10px] text-muted">Tự động tăng, không được trùng</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Ký hiệu danh mục
                      </label>
                      <input
                        type="text"
                        placeholder="VD: TLBM-CHUNG, HS-BNS"
                        value={catForm.ky_hieu}
                        onChange={(e) => setCatForm({ ...catForm, ky_hieu: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Ngày lập
                      </label>
                      <input
                        type="date"
                        value={catForm.ngay_lap}
                        onChange={(e) => setCatForm({ ...catForm, ngay_lap: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Tên danh mục tài liệu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Tài liệu, Biểu mẫu chung"
                      value={catForm.ten_tai_lieu}
                      onChange={(e) => setCatForm({ ...catForm, ten_tai_lieu: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Người lập tài liệu <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={catForm.nguoi_lap_name}
                        onChange={(e) =>
                          setCatForm({ ...catForm, nguoi_lap_name: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Ghi chú
                      </label>
                      <input
                        type="text"
                        placeholder="Ghi chú thêm nếu có"
                        value={catForm.ghi_chu}
                        onChange={(e) => setCatForm({ ...catForm, ghi_chu: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingCat(false)}
                      type="button"
                    >
                      Hủy
                    </Button>
                    <Button variant="primary" size="sm" type="submit" icon="fa-check">
                      {editingCatId ? 'Cập nhật danh mục' : 'Thêm danh mục'}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Thanh công cụ quản lý Cấp 1 */
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc ký hiệu..."
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon="fa-plus"
                    onClick={handleOpenAddCat}
                    className="w-full sm:w-auto"
                  >
                    Thêm danh mục Cấp 1
                  </Button>
                </div>
              )}

              {/* Bảng Danh mục Cấp 1 */}
              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-elevated font-semibold text-muted uppercase tracking-wider border-b border-border-subtle">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-14">STT</th>
                      <th className="px-3 py-2.5 w-28">Ký hiệu</th>
                      <th className="px-4 py-2.5">Tên danh mục Cấp 1</th>
                      <th className="px-3 py-2.5 w-32">Người lập</th>
                      <th className="px-3 py-2.5 w-24 text-center">Ngày lập</th>
                      <th className="px-3 py-2.5 text-center w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted">
                          Không tìm thấy danh mục cấp 1 phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-surface-elevated/60 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-center font-bold text-primary">
                            {c.stt_uu_tien}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-secondary">
                            {c.ky_hieu || '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-main text-xs">{c.ten_tai_lieu}</div>
                            {c.ghi_chu && (
                              <div className="text-[11px] text-muted line-clamp-1">{c.ghi_chu}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-secondary">{c.nguoi_lap_name || '-'}</td>
                          <td className="px-3 py-2.5 text-center text-secondary font-mono text-[11px]">
                            {c.ngay_lap || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCat(c)}
                                className="p-1 text-secondary hover:text-primary rounded hover:bg-surface cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <i className="fa-solid fa-pen text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Bạn có chắc chắn muốn xóa danh mục: "${c.ten_tai_lieu}"?`
                                    )
                                  ) {
                                    onDeleteCategory(c.id);
                                  }
                                }}
                                className="p-1 text-secondary hover:text-danger rounded hover:bg-surface cursor-pointer"
                                title="Xóa"
                              >
                                <i className="fa-solid fa-trash text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LOẠI TÀI LIỆU CẤP 2 */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              {/* Form Thêm/Sửa Cấp 2 */}
              {isEditingType ? (
                <form
                  onSubmit={handleSaveType}
                  className="p-4 sm:p-5 bg-surface-elevated rounded-xl border border-primary/30 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                    <h4 className="text-sm font-bold text-main flex items-center gap-2">
                      <i className="fa-solid fa-tags text-primary" />
                      {editingTypeId ? 'Chỉnh sửa Loại biểu mẫu Cấp 2' : 'Thêm mới Loại Cấp 2'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingType(false)}
                      className="text-xs"
                    >
                      Hủy bỏ
                    </Button>
                  </div>

                  {typeError && (
                    <div className="p-3 text-xs bg-danger-subtle text-danger rounded-lg flex items-center gap-2">
                      <i className="fa-solid fa-circle-exclamation shrink-0" />
                      <span>{typeError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Thuộc Danh mục Cấp 1 <span className="text-danger">*</span>
                      </label>
                      <select
                        value={typeForm.dm_tai_lieu}
                        onChange={(e) =>
                          setTypeForm({ ...typeForm, dm_tai_lieu: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.stt_uu_tien}. {c.ten_tai_lieu}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Tên loại tài liệu/biểu mẫu <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Tài liệu bảo hiểm, Biểu mẫu bảo hiểm, Tờ trình"
                        value={typeForm.ten_loai}
                        onChange={(e) => setTypeForm({ ...typeForm, ten_loai: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      placeholder="Mô tả mục đích sử dụng loại biểu mẫu này"
                      value={typeForm.ghi_chu}
                      onChange={(e) => setTypeForm({ ...typeForm, ghi_chu: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-surface text-main border border-border-subtle focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border-subtle">
                    <input
                      type="checkbox"
                      id="isPublicCheck"
                      checked={typeForm.is_public}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, is_public: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-primary border-border-subtle focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="isPublicCheck" className="text-xs text-main cursor-pointer select-none">
                      <span className="font-semibold">Công khai (isPublic)</span>: Mặc định bật true.
                      Nếu tắt (false), loại biểu mẫu chỉ hiển thị cho Quản trị viên và tự động đổi màu cảnh báo.
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingType(false)}
                      type="button"
                    >
                      Hủy
                    </Button>
                    <Button variant="primary" size="sm" type="submit" icon="fa-check">
                      {editingTypeId ? 'Cập nhật loại Cấp 2' : 'Thêm loại Cấp 2'}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Bộ lọc danh sách Cấp 2 */
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <div className="relative w-full sm:w-56">
                      <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên loại..."
                        value={typeSearch}
                        onChange={(e) => setTypeSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary"
                      />
                    </div>

                    <select
                      value={filterParentCat}
                      onChange={(e) => setFilterParentCat(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer w-48"
                    >
                      <option value="all">-- Tất cả Cấp 1 --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.stt_uu_tien}. {c.ten_tai_lieu}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon="fa-plus"
                    onClick={handleOpenAddType}
                    className="w-full sm:w-auto"
                  >
                    Thêm Loại Cấp 2
                  </Button>
                </div>
              )}

              {/* Bảng Danh mục Cấp 2 */}
              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-elevated font-semibold text-muted uppercase tracking-wider border-b border-border-subtle">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-14">ID</th>
                      <th className="px-3 py-2.5 w-44">Thuộc Cấp 1</th>
                      <th className="px-4 py-2.5">Tên Loại Tài Liệu / Biểu Mẫu</th>
                      <th className="px-3 py-2.5 w-32 text-center">Phạm vi (isPublic)</th>
                      <th className="px-3 py-2.5 text-center w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted">
                          Không tìm thấy loại tài liệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredTypes.map((t) => {
                        const parentCat = categories.find((c) => c.id === t.dm_tai_lieu);
                        // ĐẶC TẢ TỪ THẦY:
                        // "isPublic(*): mặc định true (nếu false thì vẫn hiển thị cho admin thấy nhưng đổi màu)"
                        const isNotPublic = !t.is_public;

                        return (
                          <tr
                            key={t.id}
                            className={`transition-colors ${
                              isNotPublic
                                ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500'
                                : 'hover:bg-surface-elevated/60 text-main'
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center font-mono text-[11px] text-muted">
                              #{t.id}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-secondary">
                              {parentCat ? parentCat.ten_tai_lieu : `Cấp 1 (#${t.dm_tai_lieu})`}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-xs">{t.ten_loai}</div>
                              {t.ghi_chu && (
                                <div className="text-[11px] text-muted line-clamp-1">
                                  {t.ghi_chu}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              {t.is_public ? (
                                <Badge variant="success" size="sm" withDot>
                                  Công khai
                                </Badge>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  <i className="fa-solid fa-lock text-[9px]" /> Nội bộ (Đổi màu)
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditType(t)}
                                  className="p-1 text-secondary hover:text-primary rounded hover:bg-surface cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <i className="fa-solid fa-pen text-xs" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Bạn có chắc chắn muốn xóa loại: "${t.ten_loai}"?`
                                      )
                                    ) {
                                      onDeleteType(t.id);
                                    }
                                  }}
                                  className="p-1 text-secondary hover:text-danger rounded hover:bg-surface cursor-pointer"
                                  title="Xóa"
                                >
                                  <i className="fa-solid fa-trash text-xs" />
                                </button>
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
        <div className="flex items-center justify-between px-6 py-3 border-t border-border-subtle bg-surface-elevated text-xs text-muted">
          <span>
            <i className="fa-solid fa-circle-info mr-1 text-primary" />
            Dữ liệu cấu trúc cấp 1 &amp; cấp 2 sẽ tự động đồng bộ vào các bộ lọc và mẫu thêm mới
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng cửa sổ
          </Button>
        </div>
      </div>
    </div>
  );
};
