import React, { useState, useMemo } from 'react';
import {
  ResourceItem,
  ResourceCategory,
  ResourceType,
} from '@app-types/resource';
import { ResourceTable } from '@components/resources/ResourceTable';
import { ResourceDetailModal } from '@components/resources/ResourceDetailModal';
import { ResourceFormModal, ResourceFormData } from '@components/resources/ResourceFormModal';
import { Button } from '@components/common/Button';

// Dữ liệu mẫu ban đầu để kiểm tra giao diện trực quan
const initialMockCategories: ResourceCategory[] = [
  { id: 1, stt_uu_tien: 1, ten_tai_lieu: 'Tài liệu, Biểu mẫu chung', ky_hieu: 'TLBM-CHUNG' },
  { id: 2, stt_uu_tien: 2, ten_tai_lieu: 'Khối Hỗ Trợ & Vận Hành', ky_hieu: 'KHT-VH' },
  { id: 3, stt_uu_tien: 3, ten_tai_lieu: 'Khu vực TP. Hồ Chí Minh', ky_hieu: 'KV-HCM' },
];

const initialMockTypes: ResourceType[] = [
  { id: 1, dm_tai_lieu: 1, ten_loai: 'Quy chế & Quy định', is_public: true },
  { id: 2, dm_tai_lieu: 1, ten_loai: 'Biểu mẫu hành chính', is_public: true },
  { id: 3, dm_tai_lieu: 2, ten_loai: 'Tài liệu kỹ thuật nội bộ', is_public: true },
  { id: 4, dm_tai_lieu: 3, ten_loai: 'Báo cáo chi nhánh', is_public: false },
];

const initialMockDocuments: ResourceItem[] = [
  {
    id: 1,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [1],
    loai_tai_lieu_names: ['Quy chế & Quy định'],
    ky_hieu: '01/QĐ-BL-2026',
    tieu_de: 'Quy chế quản lý nội bộ và văn hóa doanh nghiệp Bảo Long 2026',
    ngay_dang: '2026-01-15',
    noi_ban_hanh: 'Ban Giám Đốc',
    hieu_luc: 'CON_HIEU_LUC',
    ghi_chu: 'Áp dụng cho toàn thể cán bộ nhân viên trong toàn hệ thống.',
    file_dinh_kem: 'https://example.com/files/quy_che_noi_bo_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 2,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [2],
    loai_tai_lieu_names: ['Biểu mẫu hành chính'],
    ky_hieu: 'BM-HC-05',
    tieu_de: 'Biểu mẫu đề xuất nghỉ phép và công tác ngắn ngày (Phiên bản cũ)',
    ngay_dang: '2024-03-10',
    noi_ban_hanh: 'Phòng Hành chính - Nhân sự',
    hieu_luc: 'HET_HIEU_LUC',
    ngay_het_hieu_luc: '2025-12-31',
    ghi_chu: 'Biểu mẫu này đã hết hiệu lực từ ngày 31/12/2025, thay bằng hệ thống duyệt phép online.',
    file_dinh_kem: 'https://example.com/files/bieu_mau_phep_cu.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 3,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [1, 2],
    loai_tai_lieu_names: ['Quy chế & Quy định', 'Biểu mẫu hành chính'],
    ky_hieu: '12/HD-TC-2023',
    tieu_de: 'Hướng dẫn thanh toán công tác phí và tiếp khách niên độ 2023-2024',
    ngay_dang: '2023-11-20',
    noi_ban_hanh: 'Phòng Tài chính - Kế toán',
    hieu_luc: 'HET_VA_THAY_THE',
    ngay_het_hieu_luc: '2026-01-01',
    link_thay_the: 'https://example.com/docs/huong_dan_cong_tac_phi_2026',
    ghi_chu: 'Đã có văn bản hướng dẫn mới 2026 thay thế, vui lòng bấm link thay thế để xem văn bản mới.',
    file_dinh_kem: 'https://example.com/files/hd_cong_tac_phi_cu.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 4,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Khối Hỗ Trợ & Vận Hành',
    loai_tai_lieu: [3],
    loai_tai_lieu_names: ['Tài liệu kỹ thuật nội bộ'],
    ky_hieu: 'SOP-IT-01',
    tieu_de: 'Quy trình vận hành máy chủ và bảo mật thông tin nội bộ',
    ngay_dang: '2026-02-01',
    noi_ban_hanh: 'Phòng Công nghệ Thông tin',
    hieu_luc: 'CON_HIEU_LUC',
    ghi_chu: 'Tài liệu mật nội bộ phòng ban.',
    file_dinh_kem: 'https://example.com/files/sop_security.pdf',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Thượng Mạnh Quỳnh',
  },
  {
    id: 5,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [2],
    loai_tai_lieu_names: ['Biểu mẫu hành chính'],
    ky_hieu: 'BM-KT-02',
    tieu_de: 'Giấy đề nghị tạm ứng kinh phí công tác (Áp dụng 2026)',
    ngay_dang: '2026-02-15',
    noi_ban_hanh: 'Phòng Tài chính - Kế toán',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/giay_de_nghi_tam_ung.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
];

export default function ResourceManagementPage() {
  const [documents, setDocuments] = useState<ResourceItem[]>(initialMockDocuments);
  const [categories] = useState<ResourceCategory[]>(initialMockCategories);
  const [types] = useState<ResourceType[]>(initialMockTypes);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [detailItem, setDetailItem] = useState<ResourceItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<ResourceItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Modal Xóa Tài liệu
  const [deleteItem, setDeleteItem] = useState<ResourceItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lọc dữ liệu
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = doc.tieu_de.toLowerCase().includes(term);
        const matchSymbol = (doc.ky_hieu || '').toLowerCase().includes(term);
        const matchPublisher = (doc.noi_ban_hanh || '').toLowerCase().includes(term);
        if (!matchTitle && !matchSymbol && !matchPublisher) return false;
      }

      // Lọc danh mục cấp 1
      if (selectedCategory !== 'all') {
        if (doc.dm_tai_lieu !== Number(selectedCategory)) return false;
      }

      // Lọc trạng thái
      if (statusFilter !== 'all') {
        if (doc.hieu_luc !== statusFilter) return false;
      }

      return true;
    });
  }, [documents, searchTerm, selectedCategory, statusFilter]);

  // Phân trang danh sách
  const totalCount = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Hành động Xem chi tiết
  const handleViewDetail = (item: ResourceItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  // Hành động Mở Modal Thêm mới
  const handleAddNew = () => {
    setFormInitialData(null);
    setIsFormOpen(true);
  };

  // Hành động Mở Modal Sửa
  const handleEdit = (item: ResourceItem) => {
    setFormInitialData(item);
    setIsFormOpen(true);
  };

  // Hành động Mở Modal Xóa tài liệu
  const handleDelete = (item: ResourceItem) => {
    setDeleteItem(item);
    setIsDeleteOpen(true);
  };

  // Xác nhận Xóa tài liệu
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      setIsDeleting(true);

      // Thử gọi API Backend nếu có kết nối
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `/api/resources/documents/${deleteItem.id}/`;
      const token = localStorage.getItem('tlbm_access_token') || localStorage.getItem('tlbm_token');

      await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {
        // Backend offline / mock mode -> không chặn xóa local
      });

      // Xóa khỏi danh sách tài liệu
      const targetId = deleteItem.id;
      const targetTitle = deleteItem.tieu_de;
      setDocuments((prev) => prev.filter((d) => d.id !== targetId));

      // Đóng modal xác nhận
      setIsDeleteOpen(false);
      setDeleteItem(null);

      // Hiển thị Toast thông báo thành công
      setToastMessage(`Đã xóa thành công tài liệu: "${targetTitle}"`);
      setTimeout(() => setToastMessage(null), 3500);

      // Tự động điều chỉnh trang nếu trang hiện tại bị trống
      const remainingDocs = documents.filter((d) => d.id !== targetId);
      const newTotalPages = Math.max(1, Math.ceil(remainingDocs.length / pageSize));
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Xử lý Submit Form Thêm/Sửa
  const handleFormSubmit = async (data: { formData: FormData; payload: ResourceFormData }) => {
    const payload = data.payload;
    const cat = categories.find((c) => c.id === Number(payload.dm_tai_lieu));
    const selectedTypeNames = types
      .filter((t) => payload.loai_tai_lieu.includes(t.id))
      .map((t) => t.ten_loai);

    if (formInitialData) {
      // Cập nhật
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === formInitialData.id
            ? {
                ...d,
                dm_tai_lieu: Number(payload.dm_tai_lieu),
                dm_tai_lieu_name: cat?.ten_tai_lieu,
                loai_tai_lieu: payload.loai_tai_lieu,
                loai_tai_lieu_names: selectedTypeNames,
                ky_hieu: payload.ky_hieu,
                tieu_de: payload.tieu_de,
                ngay_dang: payload.ngay_dang,
                noi_ban_hanh: payload.noi_ban_hanh,
                hieu_luc: payload.hieu_luc,
                ngay_het_hieu_luc: payload.ngay_het_hieu_luc,
                link_thay_the: payload.link_thay_the,
                ghi_chu: payload.ghi_chu,
                hien_thi: payload.hien_thi,
                file_dinh_kem: payload.file
                  ? URL.createObjectURL(payload.file)
                  : d.file_dinh_kem,
              }
            : d
        )
      );
    } else {
      // Tạo mới
      const newDoc: ResourceItem = {
        id: Date.now(),
        dm_tai_lieu: Number(payload.dm_tai_lieu),
        dm_tai_lieu_name: cat?.ten_tai_lieu,
        loai_tai_lieu: payload.loai_tai_lieu,
        loai_tai_lieu_names: selectedTypeNames,
        ky_hieu: payload.ky_hieu,
        tieu_de: payload.tieu_de,
        ngay_dang: payload.ngay_dang,
        noi_ban_hanh: payload.noi_ban_hanh,
        hieu_luc: payload.hieu_luc,
        ngay_het_hieu_luc: payload.ngay_het_hieu_luc,
        link_thay_the: payload.link_thay_the,
        ghi_chu: payload.ghi_chu,
        hien_thi: payload.hien_thi,
        file_dinh_kem: payload.file ? URL.createObjectURL(payload.file) : '',
        nguoi_tao_name: 'Đỗ Trung Phong',
      };
      setDocuments((prev) => [newDoc, ...prev]);
    }

    setIsFormOpen(false);
  };

  // Xuất Excel: Liên kết API Backend để tải file về máy (theo đặc tả phân hệ của Nguyễn Chí Tín)
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      // Chuẩn bị tham số bộ lọc gửi lên Backend
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory !== 'all') params.append('dm_tai_lieu', selectedCategory);
      if (statusFilter !== 'all') params.append('hieu_luc', statusFilter);

      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `/api/resources/documents/export-excel/?${params.toString()}`;
      const token = localStorage.getItem('tlbm_access_token') || localStorage.getItem('tlbm_token');

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        // Nhận file blob từ Backend và kích hoạt tải về máy
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Danh_sach_tai_lieu_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        throw new Error(`Máy chủ phản hồi mã lỗi ${response.status}`);
      }
    } catch (error) {
      console.warn('Backend API xuất Excel chưa sẵn sàng hoặc offline, kích hoạt cơ chế xuất file trực tiếp:', error);

      // Fallback: Xuất dữ liệu bảng hiện tại sang file CSV/Excel UTF-8 có BOM để mở tiếng Việt không lỗi
      const headers = ['STT', 'Ký hiệu', 'Tiêu đề', 'Danh mục', 'Loại tài liệu', 'Nơi ban hành', 'Ngày đăng', 'Hiệu lực', 'Phạm vi'];
      const rows = filteredDocuments.map((doc, idx) => [
        idx + 1,
        `"${doc.ky_hieu || ''}"`,
        `"${doc.tieu_de.replace(/"/g, '""')}"`,
        `"${doc.dm_tai_lieu_name || ''}"`,
        `"${(doc.loai_tai_lieu_names || []).join('; ')}"`,
        `"${doc.noi_ban_hanh || ''}"`,
        doc.ngay_dang,
        doc.hieu_luc === 'CON_HIEU_LUC' ? 'Còn hiệu lực' : doc.hieu_luc === 'HET_HIEU_LUC' ? 'Hết hiệu lực' : 'Hết và thay thế',
        doc.hien_thi === 'TAT_CA' ? 'Tất cả' : 'Nội bộ phòng ban',
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Danh_sach_tai_lieu_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } finally {
      setIsExporting(false);
    }
  };

  // Xử lý tải tệp đính kèm về máy
  const handleDownloadFile = (item: ResourceItem) => {
    if (!item.file_dinh_kem) return;
    const a = document.createElement('a');
    a.href = item.file_dinh_kem;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = item.file_dinh_kem.split('/').pop() || 'tai_lieu';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-main tracking-tight">
            Quản Lý Tài Liệu &amp; Biểu Mẫu
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon="fa-plus"
            onClick={handleAddNew}
            className="shadow-sm"
          >
            Thêm mới tài liệu
          </Button>
        </div>
      </div>

      {/* Thanh bộ lọc nhanh */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tìm kiếm */}
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, ký hiệu, nơi ban hành..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary"
          />
        </div>

        {/* Lọc Cấp 1 */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">-- Tất cả Danh mục Cấp 1 --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.stt_uu_tien}. {c.ten_tai_lieu}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc Trạng thái hiệu lực */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">-- Tất cả Trạng thái hiệu lực --</option>
            <option value="CON_HIEU_LUC">Còn hiệu lực</option>
            <option value="HET_HIEU_LUC">Hết hiệu lực</option>
            <option value="HET_VA_THAY_THE">Hết hiệu lực và thay thế</option>
          </select>
        </div>

        {/* Nút Đặt lại bộ lọc */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className="w-full text-xs"
          >
            <i className="fa-solid fa-rotate-left mr-1.5" /> Đặt lại lọc
          </Button>
        </div>
      </div>

      {/* Bảng dữ liệu chính của bạn Đỗ Trung Phong */}
      <ResourceTable
        items={paginatedDocuments}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownloadFile={handleDownloadFile}
        onExportExcel={handleExportExcel}
      />

      {/* Modal Xem chi tiết */}
      <ResourceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={detailItem}
        onDownloadFile={handleDownloadFile}
      />

      {/* Modal Thêm mới / Chỉnh sửa */}
      <ResourceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={formInitialData}
        categories={categories}
        types={types}
      />

      {/* Modal Xác nhận Xóa Tài liệu */}
      {isDeleteOpen && deleteItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => {
            if (!isDeleting) {
              setIsDeleteOpen(false);
              setDeleteItem(null);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-surface rounded-2xl border border-border-subtle shadow-xl p-6 space-y-4 animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-danger-subtle text-danger flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <div>
                <h3 className="text-base font-bold text-main">
                  Xác nhận xóa tài liệu
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Thao tác này sẽ gỡ bỏ tài liệu khỏi hệ thống.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border-subtle text-xs space-y-1.5">
              <div className="text-muted font-medium">Tài liệu cần xóa:</div>
              <div className="font-semibold text-main text-sm line-clamp-2">
                {deleteItem.tieu_de}
              </div>
              {deleteItem.ky_hieu && (
                <div className="font-mono text-muted">
                  Ký hiệu: <span className="text-main font-semibold">{deleteItem.ky_hieu}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-danger font-medium flex items-center gap-1.5">
              <i className="fa-solid fa-circle-exclamation text-xs" />
              <span>Lưu ý: Dữ liệu sau khi xóa sẽ không thể phục hồi lại.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
              <Button
                variant="secondary"
                size="md"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteItem(null);
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="md"
                icon="fa-trash"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo thành công */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg animate-slide-in-bottom">
          <i className="fa-solid fa-circle-check text-base shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white ml-1 cursor-pointer"
            aria-label="Đóng"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
