import React, { useState, useMemo } from 'react';
import {
  ResourceItem,
  ResourceCategory,
  ResourceType,
} from '@app-types/resource';
import { ResourceTable } from '@components/resources/ResourceTable';
import { ResourceDetailModal } from '@components/resources/ResourceDetailModal';
import { ResourceFormModal, ResourceFormData } from '@components/resources/ResourceFormModal';
import { CategoryManagementModal } from '@components/resources/CategoryManagementModal';
import { Button } from '@components/common/Button';

// ============================================================================
// DỮ LIỆU MẪU CHUẨN ĐẶC TẢ TỪ THẦY HƯỚNG DẪN (IMAGE 1 & IMAGE 2)
// Cấp 1: Tài liệu chung | Hồ sơ Ban Nhân sự | Hồ sơ Bảo Long Bến Thành | Đơn vị PB cấp 2
// Cấp 2: Tài liệu bảo hiểm | Biểu mẫu bảo hiểm | Tờ trình | Quy định | ...
// ============================================================================
const initialMockCategories: ResourceCategory[] = [
  {
    id: 1,
    stt_uu_tien: 1,
    ten_tai_lieu: 'Tài liệu, Biểu mẫu chung',
    ky_hieu: 'TLBM-CHUNG',
    nguoi_lap_name: 'Thượng Mạnh Quỳnh',
    ngay_lap: '2026-01-02',
    ghi_chu: 'Toàn bộ quy chế, văn bản biểu mẫu áp dụng chung toàn Tổng công ty Bảo Long',
  },
  {
    id: 2,
    stt_uu_tien: 2,
    ten_tai_lieu: 'Hồ sơ Ban Nhân sự',
    ky_hieu: 'HS-BNS',
    nguoi_lap_name: 'Huỳnh Thị Kim Trang',
    ngay_lap: '2026-01-05',
    ghi_chu: 'Hồ sơ quản trị nhân sự, quy trình tuyển dụng và chế độ chính sách',
  },
  {
    id: 3,
    stt_uu_tien: 3,
    ten_tai_lieu: 'Hồ sơ Bảo Long Bến Thành',
    ky_hieu: 'HS-BLBT',
    nguoi_lap_name: 'Nguyễn Chí Tín',
    ngay_lap: '2026-01-10',
    ghi_chu: 'Hồ sơ tài liệu nghiệp vụ chi nhánh Bảo Long Bến Thành',
  },
  {
    id: 4,
    stt_uu_tien: 4,
    ten_tai_lieu: 'Các đơn vị phòng ban cấp 2',
    ky_hieu: 'DV-PB2',
    nguoi_lap_name: 'Đỗ Trung Phong',
    ngay_lap: '2026-01-12',
    ghi_chu: 'Tài liệu hành chính lưu hành nội bộ phòng ban đơn vị thành viên cấp 2',
  },
];

const initialMockTypes: ResourceType[] = [
  // Cấp 2 thuộc Cấp 1 = 1 (Tài liệu, Biểu mẫu chung)
  { id: 1, dm_tai_lieu: 1, ten_loai: 'Tài liệu bảo hiểm', is_public: true, ghi_chu: 'Tài liệu quy tắc và biểu phí bảo hiểm' },
  { id: 2, dm_tai_lieu: 1, ten_loai: 'Biểu mẫu bảo hiểm', is_public: true, ghi_chu: 'Mẫu đơn yêu cầu bảo hiểm và phụ lục' },
  { id: 3, dm_tai_lieu: 1, ten_loai: 'Tờ trình', is_public: true, ghi_chu: 'Mẫu tờ trình phê duyệt công việc' },
  { id: 4, dm_tai_lieu: 1, ten_loai: 'Quy định', is_public: true, ghi_chu: 'Quy định nội bộ và an toàn thông tin' },
  { id: 5, dm_tai_lieu: 1, ten_loai: 'Quy chế quản trị', is_public: true, ghi_chu: 'Quy chế tài chính và chi tiêu nội bộ' },
  { id: 6, dm_tai_lieu: 1, ten_loai: 'Dự thảo nội bộ (Chưa công bố)', is_public: false, ghi_chu: 'Đang thử nghiệm, chỉ quản trị viên nhìn thấy (đổi màu)' },

  // Cấp 2 thuộc Cấp 1 = 2 (Hồ sơ Ban Nhân sự)
  { id: 7, dm_tai_lieu: 2, ten_loai: 'Hồ sơ tuyển dụng & HĐLĐ', is_public: true, ghi_chu: 'Mẫu đánh giá ứng viên và hợp đồng' },
  { id: 8, dm_tai_lieu: 2, ten_loai: 'Quyết định bổ nhiệm & Khen thưởng', is_public: true, ghi_chu: 'Mẫu quyết định nhân sự' },

  // Cấp 2 thuộc Cấp 1 = 3 (Hồ sơ Bảo Long Bến Thành)
  { id: 9, dm_tai_lieu: 3, ten_loai: 'Báo cáo doanh số chi nhánh', is_public: true, ghi_chu: 'Báo cáo định kỳ Bến Thành' },
  { id: 10, dm_tai_lieu: 3, ten_loai: 'Hồ sơ giám định & Bồi thường', is_public: true, ghi_chu: 'Hồ sơ giải quyết khiếu nại bồi thường' },

  // Cấp 2 thuộc Cấp 1 = 4 (Các đơn vị phòng ban cấp 2)
  { id: 11, dm_tai_lieu: 4, ten_loai: 'Biên bản họp phòng ban', is_public: true, ghi_chu: 'Mẫu biên bản tổng kết tuần/tháng' },
];

const initialMockDocuments: ResourceItem[] = [
  {
    id: 1,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [1, 4],
    loai_tai_lieu_names: ['Tài liệu bảo hiểm', 'Quy định'],
    ky_hieu: '01/QĐ-BL-2026',
    tieu_de: 'Quy định bảo hiểm xe cơ giới và quy tắc thẩm định rủi ro 2026',
    ngay_dang: '2026-01-15',
    noi_ban_hanh: 'Ban Giám Đốc',
    hieu_luc: 'CON_HIEU_LUC',
    ghi_chu: 'Áp dụng cho toàn thể cán bộ nhân viên và đại lý trong toàn hệ thống.',
    file_dinh_kem: 'https://example.com/files/quy_tac_bao_hiem_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 2,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [2],
    loai_tai_lieu_names: ['Biểu mẫu bảo hiểm'],
    ky_hieu: 'BM-BH-08',
    tieu_de: 'Giấy yêu cầu bảo hiểm sức khỏe toàn diện Bảo Long Care (Mẫu cũ)',
    ngay_dang: '2024-03-10',
    noi_ban_hanh: 'Ban Nghiệp vụ Bảo hiểm',
    hieu_luc: 'HET_HIEU_LUC',
    ngay_het_hieu_luc: '2025-12-31',
    ghi_chu: 'Biểu mẫu này đã hết hiệu lực từ ngày 31/12/2025, thay bằng mẫu trực tuyến mới.',
    file_dinh_kem: 'https://example.com/files/bieu_mau_bh_cu.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 3,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [3],
    loai_tai_lieu_names: ['Tờ trình'],
    ky_hieu: '12/TTr-TC-2023',
    tieu_de: 'Mẫu tờ trình thanh toán công tác phí và tiếp khách niên độ 2023-2024',
    ngay_dang: '2023-11-20',
    noi_ban_hanh: 'Phòng Tài chính - Kế toán',
    hieu_luc: 'HET_VA_THAY_THE',
    ngay_het_hieu_luc: '2026-01-01',
    link_thay_the: 'https://example.com/docs/huong_dan_cong_tac_phi_2026',
    ghi_chu: 'Đã có văn bản hướng dẫn mới 2026 thay thế, vui lòng bấm link thay thế để xem văn bản mới.',
    file_dinh_kem: 'https://example.com/files/to_trinh_cong_tac_phi_cu.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 4,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [2, 5],
    loai_tai_lieu_names: ['Biểu mẫu bảo hiểm', 'Quy chế quản trị'],
    ky_hieu: 'BM-KT-02',
    tieu_de: 'Giấy đề nghị tạm ứng kinh phí bồi thường khẩn cấp (Áp dụng 2026)',
    ngay_dang: '2026-02-15',
    noi_ban_hanh: 'Phòng Tài chính - Kế toán',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/giay_de_nghi_tam_ung.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 5,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [7],
    loai_tai_lieu_names: ['Hồ sơ tuyển dụng & HĐLĐ'],
    ky_hieu: 'HDLD-NS-2025',
    tieu_de: 'Mẫu hợp đồng lao động xác định thời hạn cho khối kinh doanh',
    ngay_dang: '2025-06-18',
    noi_ban_hanh: 'Ban Nhân Sự',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/hop_dong_lao_dong_2025.docx',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 6,
    dm_tai_lieu: 3,
    dm_tai_lieu_name: 'Hồ sơ Bảo Long Bến Thành',
    loai_tai_lieu: [10],
    loai_tai_lieu_names: ['Hồ sơ giám định & Bồi thường'],
    ky_hieu: 'GD-BLBT-2026',
    tieu_de: 'Biên bản giám định tổn thất hiện trường nghiệp vụ Bến Thành',
    ngay_dang: '2026-03-01',
    noi_ban_hanh: 'Bảo Long Bến Thành',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bien_ban_giam_dinh_blbt.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Thượng Mạnh Quỳnh',
  },
];

export default function ResourceManagementPage() {
  const [documents, setDocuments] = useState<ResourceItem[]>(initialMockDocuments);
  const [categories, setCategories] = useState<ResourceCategory[]>(initialMockCategories);
  const [types, setTypes] = useState<ResourceType[]>(initialMockTypes);

  // ============================================================================
  // BỘ LỌC ĐA NĂNG:
  // - selectedCategory: Mặc định là '1' ("Tài liệu, Biểu mẫu chung") theo yêu cầu của Thầy
  // - selectedType: Bộ lọc Cấp 2 phụ thuộc Cấp 1 (Cascading Filter)
  // - selectedYear: Lọc theo năm văn bản (2026, 2025, 2024...)
  // - statusFilter: Lọc theo trạng thái hiệu lực
  // - searchTerm: Tìm theo tiêu đề, ký hiệu, nơi ban hành
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('1'); // Mặc định mở ngay Tài liệu chung
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [detailItem, setDetailItem] = useState<ResourceItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<ResourceItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Modal Xóa Tài liệu
  const [deleteItem, setDeleteItem] = useState<ResourceItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Danh sách năm trích xuất từ dữ liệu thực tế
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    documents.forEach((d) => {
      if (d.ngay_dang) {
        yearsSet.add(d.ngay_dang.substring(0, 4));
      }
    });
    // Thêm các năm mặc định nếu chưa có
    yearsSet.add('2026');
    yearsSet.add('2025');
    yearsSet.add('2024');
    return Array.from(yearsSet).sort().reverse();
  }, [documents]);

  // ============================================================================
  // CASCADING FILTER CẤP 1 ➔ CẤP 2 (LOẠI TÀI LIỆU):
  // Khi Cấp 1 thay đổi, danh sách Loại Cấp 2 tự động lọc tương ứng!
  // ============================================================================
  const availableTypesForFilter = useMemo(() => {
    if (selectedCategory === 'all') {
      return types;
    }
    return types.filter((t) => t.dm_tai_lieu === Number(selectedCategory));
  }, [types, selectedCategory]);

  // Đổi Cấp 1 thì reset Cấp 2 về 'all' và nhảy về trang 1
  const handleCategorySelect = (newCat: string) => {
    setSelectedCategory(newCat);
    setSelectedType('all');
    setCurrentPage(1);
  };

  // ============================================================================
  // LỌC DỮ LIỆU BẢNG TỔNG HỢP THEO TẤT CẢ TIÊU CHÍ
  // ============================================================================
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Tìm kiếm từ khóa (Tiêu đề, Ký hiệu, Nơi ban hành)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = doc.tieu_de.toLowerCase().includes(term);
        const matchSymbol = (doc.ky_hieu || '').toLowerCase().includes(term);
        const matchPublisher = (doc.noi_ban_hanh || '').toLowerCase().includes(term);
        if (!matchTitle && !matchSymbol && !matchPublisher) return false;
      }

      // 2. Lọc Danh mục Cấp 1
      if (selectedCategory !== 'all') {
        if (doc.dm_tai_lieu !== Number(selectedCategory)) return false;
      }

      // 3. Lọc Loại tài liệu Cấp 2 (Bộ lọc phân tầng Cấp 1 ➔ Cấp 2)
      if (selectedType !== 'all') {
        if (!doc.loai_tai_lieu || !doc.loai_tai_lieu.includes(Number(selectedType))) {
          return false;
        }
      }

      // 4. Lọc theo Năm đăng văn bản (theo đặc tả yêu cầu trong đề án)
      if (selectedYear !== 'all') {
        const docYear = doc.ngay_dang ? doc.ngay_dang.substring(0, 4) : '';
        if (docYear !== selectedYear) return false;
      }

      // 5. Lọc Trạng thái hiệu lực
      if (statusFilter !== 'all') {
        if (doc.hieu_luc !== statusFilter) return false;
      }

      return true;
    });
  }, [documents, searchTerm, selectedCategory, selectedType, selectedYear, statusFilter]);

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

  // Xử lý Submit Form Thêm/Sửa Tài liệu
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

  // Quản lý Danh mục Cấp 1
  const handleSaveCategory = (category: ResourceCategory, isEdit: boolean) => {
    if (isEdit) {
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
      setDocuments((prev) =>
        prev.map((d) =>
          d.dm_tai_lieu === category.id ? { ...d, dm_tai_lieu_name: category.ten_tai_lieu } : d
        )
      );
    } else {
      setCategories((prev) => [...prev, category]);
    }
    setToastMessage(`Đã ${isEdit ? 'cập nhật' : 'thêm'} danh mục Cấp 1: "${category.ten_tai_lieu}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteCategory = (id: number) => {
    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setToastMessage(`Đã xóa danh mục Cấp 1: "${cat?.ten_tai_lieu || id}"`);
    setTimeout(() => setToastMessage(null), 3500);
    if (selectedCategory === String(id)) {
      setSelectedCategory('all');
    }
  };

  // Quản lý Loại biểu mẫu Cấp 2
  const handleSaveType = (typeItem: ResourceType, isEdit: boolean) => {
    if (isEdit) {
      setTypes((prev) => prev.map((t) => (t.id === typeItem.id ? typeItem : t)));
    } else {
      setTypes((prev) => [...prev, typeItem]);
    }
    setToastMessage(`Đã ${isEdit ? 'cập nhật' : 'thêm'} loại Cấp 2: "${typeItem.ten_loai}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteType = (id: number) => {
    const typeItem = types.find((t) => t.id === id);
    setTypes((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Đã xóa loại Cấp 2: "${typeItem?.ten_loai || id}"`);
    setTimeout(() => setToastMessage(null), 3500);
    if (selectedType === String(id)) {
      setSelectedType('all');
    }
  };

  // Xuất Excel: Liên kết API Backend để tải file về máy (theo đặc tả phân hệ của Nguyễn Chí Tín)
  const [, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      // Chuẩn bị tham số bộ lọc gửi lên Backend
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory !== 'all') params.append('dm_tai_lieu', selectedCategory);
      if (selectedType !== 'all') params.append('loai_tai_lieu', selectedType);
      if (selectedYear !== 'all') params.append('nam', selectedYear);
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
      console.warn(
        'Backend API xuất Excel chưa sẵn sàng hoặc offline, kích hoạt cơ chế xuất file trực tiếp:',
        error
      );

      // Fallback: Xuất dữ liệu bảng hiện tại sang file CSV/Excel UTF-8 có BOM để mở tiếng Việt không lỗi
      const headers = [
        'STT',
        'Ký hiệu',
        'Tiêu đề',
        'Danh mục',
        'Loại tài liệu',
        'Nơi ban hành',
        'Ngày đăng',
        'Hiệu lực',
        'Phạm vi',
      ];
      const rows = filteredDocuments.map((doc, idx) => [
        idx + 1,
        `"${doc.ky_hieu || ''}"`,
        `"${doc.tieu_de.replace(/"/g, '""')}"`,
        `"${doc.dm_tai_lieu_name || ''}"`,
        `"${(doc.loai_tai_lieu_names || []).join('; ')}"`,
        `"${doc.noi_ban_hanh || ''}"`,
        doc.ngay_dang,
        doc.hieu_luc === 'CON_HIEU_LUC'
          ? 'Còn hiệu lực'
          : doc.hieu_luc === 'HET_HIEU_LUC'
            ? 'Hết hiệu lực'
            : 'Hết và thay thế',
        doc.hien_thi === 'TAT_CA' ? 'Tất cả' : 'Nội bộ phòng ban',
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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
    <div className="space-y-5">
      {/* Header trang & Nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-subtle text-primary border border-primary/20">
              Phân Hệ 4
            </span>
            <span className="text-xs text-secondary font-medium">
              Nhóm 4: Quỳnh, Trang, Tín, Phong
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-main tracking-tight">
            Kho Tài Liệu &amp; Biểu Mẫu Dùng Chung
          </h1>
          <p className="text-xs text-secondary mt-1">
            Tra cứu, khai thác và quản lý biểu mẫu, quy định chuẩn trong toàn Tổng công ty Bảo Long
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Quản lý Cấp 1 & Cấp 2 (Kim Trang phụ trách theo đề án) */}
          <Button
            variant="outline"
            size="md"
            icon="fa-folder-tree"
            onClick={() => setIsCategoryModalOpen(true)}
            className="shadow-2xs text-xs sm:text-sm"
          >
            Quản lý Danh mục &amp; Cấp 2
          </Button>

          {/* Nút Thêm mới tài liệu (Đỗ Trung Phong phụ trách) */}
          <Button
            variant="primary"
            size="md"
            icon="fa-plus"
            onClick={handleAddNew}
            className="shadow-sm text-xs sm:text-sm"
          >
            Thêm mới tài liệu
          </Button>
        </div>
      </div>

      {/* THANH CHỌN NHANH DANH MỤC CẤP 1 (QUICK TABS / PILLS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-bold text-muted uppercase tracking-wider shrink-0 mr-1">
          <i className="fa-solid fa-layer-group mr-1.5 text-primary" />
          Danh mục Cấp 1:
        </span>

        {/* Nút Tất cả */}
        <button
          type="button"
          onClick={() => handleCategorySelect('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-primary text-white shadow-xs scale-102'
              : 'bg-surface hover:bg-surface-elevated text-secondary border border-border-subtle'
          }`}
        >
          <span>Tất cả danh mục</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-muted'
            }`}
          >
            {documents.length}
          </span>
        </button>

        {/* Danh sách các Cấp 1 */}
        {categories.map((c) => {
          const docCount = documents.filter((d) => d.dm_tai_lieu === c.id).length;
          const isSelected = selectedCategory === String(c.id);

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategorySelect(String(c.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-white shadow-xs scale-102'
                  : 'bg-surface hover:bg-surface-elevated text-secondary border border-border-subtle'
              }`}
            >
              {c.stt_uu_tien === 1 && <i className="fa-solid fa-star text-[10px] text-amber-300" />}
              <span>{c.ten_tai_lieu}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-elevated text-muted'
                }`}
              >
                {docCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* THANH BỘ LỌC ĐA NĂNG (GỒM CẤP 1, CẤP 2 CASCADING, NĂM, TRẠNG THÁI, TỪ KHÓA) */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-muted font-medium border-b border-border-subtle pb-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-filter text-primary" />
            <span className="font-semibold text-main">Bộ lọc &amp; Tra cứu nâng cao</span>
            {selectedCategory !== 'all' && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-primary-subtle text-primary text-[11px] font-medium">
                Đang lọc Cấp 1: {categories.find((c) => c.id === Number(selectedCategory))?.ten_tai_lieu}
              </span>
            )}
          </div>
          <span className="text-[11px] text-secondary">
            Tìm thấy: <strong className="text-primary font-bold">{totalCount}</strong> kết quả
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Tìm kiếm từ khóa */}
          <div className="relative sm:col-span-2">
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

          {/* 2. Lọc Cấp 1 (Danh mục tài liệu) */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer font-medium"
              title="Danh mục tài liệu Cấp 1"
            >
              <option value="all">-- Tất cả Cấp 1 --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.stt_uu_tien}. {c.ten_tai_lieu}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Lọc Cấp 2 (Loại tài liệu biểu mẫu - CASCADING FILTER THEO CẤP 1) */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer font-medium"
              title="Loại tài liệu biểu mẫu Cấp 2 (lọc phân tầng)"
            >
              <option value="all">
                {selectedCategory === 'all'
                  ? '-- Tất cả Loại Cấp 2 --'
                  : `-- Tất cả Loại của Cấp 1 này (${availableTypesForFilter.length}) --`}
              </option>
              {availableTypesForFilter.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten_loai} {!t.is_public ? '(Nội bộ)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Lọc theo Năm (Yêu cầu đặc tả: "lọc văn bản theo năm") */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer font-medium"
              title="Lọc văn bản theo năm ban hành"
            >
              <option value="all">-- Tất cả Năm --</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Năm {yr}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Lọc Trạng thái hiệu lực */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-none focus:border-primary cursor-pointer font-medium"
              title="Lọc theo tình trạng hiệu lực văn bản"
            >
              <option value="all">-- Tất cả Hiệu lực --</option>
              <option value="CON_HIEU_LUC">Còn hiệu lực</option>
              <option value="HET_HIEU_LUC">Hết hiệu lực (Bôi tối)</option>
              <option value="HET_VA_THAY_THE">Hết hiệu lực và thay thế</option>
            </select>
          </div>
        </div>

        {/* Nút đặt lại nhanh khi có bộ lọc đang kích hoạt */}
        {(searchTerm || selectedCategory !== '1' || selectedType !== 'all' || selectedYear !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-muted">
              <span>Đang kích hoạt lọc:</span>
              {selectedCategory !== '1' && (
                <span className="px-2 py-0.5 bg-surface-elevated rounded border border-border-subtle text-secondary font-medium">
                  Cấp 1: {selectedCategory === 'all' ? 'Tất cả' : categories.find(c => c.id === Number(selectedCategory))?.ten_tai_lieu}
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="px-2 py-0.5 bg-surface-elevated rounded border border-border-subtle text-secondary font-medium">
                  Cấp 2: {types.find(t => t.id === Number(selectedType))?.ten_loai}
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="px-2 py-0.5 bg-surface-elevated rounded border border-border-subtle text-secondary font-medium">
                  Năm: {selectedYear}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-0.5 bg-surface-elevated rounded border border-border-subtle text-secondary font-medium">
                  Hiệu lực: {statusFilter}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('1'); // Quay lại mặc định Tài liệu chung
                setSelectedType('all');
                setSelectedYear('all');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer shrink-0 ml-2"
            >
              <i className="fa-solid fa-rotate-left" /> Đặt lại mặc định
            </button>
          </div>
        )}
      </div>

      {/* BẢNG DỮ LIỆU TÀI LIỆU CHÍNH (ĐỖ TRUNG PHONG & NGUYỄN CHÍ TÍN) */}
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
        isExporting={isExporting}
      />

      {/* MODAL XEM CHI TIẾT TÀI LIỆU (DẠNG POPUP THỂ HIỆN TOÀN BỘ CÁC TRƯỜNG) */}
      <ResourceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={detailItem}
        onDownloadFile={handleDownloadFile}
      />

      {/* MODAL THÊM MỚI / SỬA TÀI LIỆU (DẠNG POPUP VỚI CÁC TRƯỜNG BẮT BUỘC VÀ VALIDATE FILE <20MB) */}
      <ResourceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={formInitialData}
        categories={categories}
        types={types}
      />

      {/* MODAL QUẢN LÝ CẤU TRÚC DANH MỤC CẤP 1 & LOẠI BIỂU MẪU CẤP 2 (HUỲNH THỊ KIM TRANG PHỤ TRÁCH) */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        types={types}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onSaveType={handleSaveType}
        onDeleteType={handleDeleteType}
      />

      {/* MODAL XÁC NHẬN XÓA TÀI LIỆU */}
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

      {/* TOAST THÔNG BÁO HOÀN TẤT THAO TÁC */}
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
