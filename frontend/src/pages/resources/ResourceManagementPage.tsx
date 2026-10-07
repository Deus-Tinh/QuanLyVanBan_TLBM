import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  {
    id: 7,
    dm_tai_lieu: 4,
    dm_tai_lieu_name: 'Các đơn vị phòng ban cấp 2',
    loai_tai_lieu: [11],
    loai_tai_lieu_names: ['Biên bản họp phòng ban'],
    ky_hieu: 'BBH-PB2-2026',
    tieu_de: 'Biên bản họp giao ban công tác các đơn vị phòng ban cấp 2',
    ngay_dang: '2026-03-05',
    noi_ban_hanh: 'Các Đơn Vị Phòng Ban Cấp 2',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bien_ban_hop_pb2.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
];

export default function ResourceManagementPage() {
  const [documents, setDocuments] = useState<ResourceItem[]>(initialMockDocuments);
  const [categories, setCategories] = useState<ResourceCategory[]>(initialMockCategories);
  const [types, setTypes] = useState<ResourceType[]>(initialMockTypes);

  // ============================================================================
  // BỘ LỌC ĐA NĂNG & PHÂN TẦNG:
  // - selectedCategory: Lọc theo Cấp 1 (Mặc định 'all' để xem toàn bộ kho)
  // - selectedType: Lọc theo Cấp 2 (Bên trong Cấp 1 đang chọn)
  // - selectedYear: Lọc theo năm văn bản (2026, 2025, 2024...)
  // - statusFilter: Lọc theo trạng thái hiệu lực
  // - searchTerm: Tìm theo tiêu đề, ký hiệu, nơi ban hành
  // ============================================================================
  // Bộ lọc: Search debounced 300ms
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sắp xếp Thư mục (Cấp 1) theo STT ưu tiên, mặc định chọn STT = 1
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.stt_uu_tien || 0) - (b.stt_uu_tien || 0));
  }, [categories]);

  // Ref cho thanh tab ngang — dùng để cuộn bằng nút mũi tên khi nhiều thư mục
  const tabBarRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabBarRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('1');
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
    yearsSet.add('2026');
    yearsSet.add('2025');
    yearsSet.add('2024');
    return Array.from(yearsSet).sort().reverse();
  }, [documents]);

  // Cascading Loại tài liệu thuộc Thư mục đang chọn
  const availableTypesForFilter = useMemo(() => {
    if (selectedCategory === 'all') {
      return types;
    }
    return types.filter((t) => t.dm_tai_lieu === Number(selectedCategory));
  }, [types, selectedCategory]);

  // Đổi Thư mục: Tự động reset Loại tài liệu về 'all' và về trang 1
  const handleCategorySelect = (newCat: string) => {
    setSelectedCategory(newCat);
    setSelectedType('all');
    setCurrentPage(1);
    setIsCategoryDropdownOpen(false);
    setIsTypeDropdownOpen(false);
  };

  // Dropdown Popovers State (Nút bấm sổ dropdown bên phải cho Danh mục & Loại tài liệu)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(target)
      ) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'Tất cả danh mục';
    const found = categories.find((c) => String(c.id) === selectedCategory);
    return found ? found.ten_tai_lieu : 'Chọn danh mục';
  }, [selectedCategory, categories]);

  const currentTypeLabel = useMemo(() => {
    if (selectedType === 'all') return 'Tất cả loại';
    const found = types.find((t) => String(t.id) === selectedType);
    return found ? found.ten_loai : 'Chọn loại';
  }, [selectedType, types]);

  // Xóa toàn bộ bộ lọc
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedType('all');
    setSelectedYear('all');
    setStatusFilter('all');
    setCurrentPage(1);
    setIsCategoryDropdownOpen(false);
    setIsTypeDropdownOpen(false);
    setActiveTabDropdownId(null);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedType !== 'all' ||
    selectedYear !== 'all' ||
    statusFilter !== 'all'
  );

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
    setToastMessage('Đã lưu tài liệu');
    setTimeout(() => setToastMessage(null), 3500);
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
  const [isExporting, setIsExporting] = useState(false);

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
          : doc.hieu_luc === 'CON_HIEU_LUC_1_PHAN'
            ? 'Còn hiệu lực một phần'
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
    <div className="space-y-4 pb-28">
      {/* Header trang & Nút hành động (GIỮ NGUYÊN KHÔNG ĐỤNG VÀO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-main tracking-tight">
            Kho Tài Liệu &amp; Biểu Mẫu Dùng Chung
          </h1>
          <p className="text-xs text-secondary mt-1">
            Tra cứu, khai thác và quản lý biểu mẫu, quy định chuẩn trong toàn Tổng công ty Bảo Long
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Quản lý Cấp 1 & Cấp 2 */}
          <Button
            variant="outline"
            size="md"
            icon="fa-folder-tree"
            onClick={() => setIsCategoryModalOpen(true)}
            className="shadow-2xs text-xs sm:text-sm"
          >
            Quản lý Danh mục &amp; Cấp 2
          </Button>

          {/* Nút Thêm mới tài liệu */}
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

      {/* 1. THANH TAB THƯ MỤC NGANG (CẤP 1) — Tab sạch không dropdown, nút dropdown nằm góc phải */}
      <div className="bg-surface rounded-xl border border-border-subtle shadow-xs">
        {/* Hàng tab chính */}
        <div className="relative z-20 flex items-stretch border-b border-border-subtle">
          {/* Nút cuộn trái */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="shrink-0 px-2.5 py-3 text-muted hover:text-main hover:bg-surface-elevated transition-colors border-r border-border-subtle cursor-pointer rounded-tl-xl"
            aria-label="Cuộn tab sang trái"
            title="Cuộn sang trái"
          >
            <i className="fa-solid fa-chevron-left text-xs" />
          </button>

          {/* Vùng tab cuộn ngang */}
          <div
            ref={tabBarRef}
            className="flex items-stretch gap-0 overflow-x-auto scrollbar-none flex-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* Tab đặc biệt: Tất cả thư mục */}
            {(() => {
              const isAll = selectedCategory === 'all';
              return (
                <button
                  key="all"
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer shrink-0 ${
                    isAll
                      ? 'border-primary text-primary bg-primary/5 font-bold'
                      : 'border-transparent text-secondary hover:text-main hover:bg-surface-elevated/60'
                  }`}
                  aria-current={isAll ? 'page' : undefined}
                >
                  <i className={`fa-solid fa-layer-group text-xs ${isAll ? 'text-primary' : 'text-muted'}`} />
                  <span>Tất cả</span>
                  <span
                    className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                      isAll
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated text-secondary border border-border-subtle'
                    }`}
                  >
                    {documents.length}
                  </span>
                </button>
              );
            })()}

            {/* Dải phân cách sau tab Tất cả */}
            <div className="w-px bg-border-subtle self-stretch my-2 shrink-0" />

            {/* Tab từng Thư mục Cấp 1 — Tab thuần không dropdown, bấm để chọn */}
            {sortedCategories.map((cat) => {
              const isSelected = selectedCategory === String(cat.id);
              const count = documents.filter((d) => d.dm_tai_lieu === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(String(cat.id))}
                  className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'border-primary text-primary bg-primary/5 font-bold'
                      : 'border-transparent text-secondary hover:text-main hover:bg-surface-elevated/60'
                  }`}
                  aria-current={isSelected ? 'page' : undefined}
                  title={cat.ghi_chu || cat.ten_tai_lieu}
                >
                  <i className={`fa-solid ${isSelected ? 'fa-folder-open text-primary' : 'fa-folder text-muted'} text-xs`} />
                  <span>{cat.ten_tai_lieu}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated text-muted border border-border-subtle'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nút cuộn phải */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="shrink-0 px-2.5 py-3 text-muted hover:text-main hover:bg-surface-elevated transition-colors border-l border-border-subtle cursor-pointer"
            aria-label="Cuộn tab sang phải"
            title="Cuộn sang phải"
          >
            <i className="fa-solid fa-chevron-right text-xs" />
          </button>

          {/* Nút dropdown chọn Danh mục trực tiếp ở góc phải */}
          <div className="relative shrink-0 flex items-stretch border-l border-border-subtle" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen((prev) => !prev);
                setIsTypeDropdownOpen(false);
              }}
              className="px-3.5 py-3 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-elevated transition-colors flex items-center gap-1.5 cursor-pointer rounded-tr-xl"
              title="Mở danh sách tất cả Danh mục"
              aria-label="Danh sách tất cả Danh mục"
            >
              <i className="fa-solid fa-folder-tree text-xs text-primary" />
              <span className="hidden sm:inline">Danh mục</span>
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 max-h-80 overflow-y-auto bg-surface rounded-xl border border-border-subtle shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                  <span>Danh mục tài liệu</span>
                  <span className="text-[10px] text-primary lowercase font-medium">Cấp 1</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCategorySelect('all');
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white font-bold'
                      : 'text-main hover:bg-surface-elevated'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <i className="fa-solid fa-layer-group text-xs" />
                    <span className="truncate">Tất cả danh mục</span>
                  </span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-elevated text-secondary border border-border-subtle'
                    }`}
                  >
                    {documents.length}
                  </span>
                </button>

                <div className="my-1 border-t border-border-subtle" />

                {sortedCategories.map((cat) => {
                  const isSelected = selectedCategory === String(cat.id);
                  const count = documents.filter((d) => d.dm_tai_lieu === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        handleCategorySelect(String(cat.id));
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white font-bold'
                          : 'text-main hover:bg-surface-elevated'
                      }`}
                      title={cat.ghi_chu || cat.ten_tai_lieu}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <i className={`fa-solid ${isSelected ? 'fa-folder-open' : 'fa-folder'} text-xs`} />
                        <span className="truncate">{cat.ten_tai_lieu}</span>
                      </span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-elevated text-secondary border border-border-subtle'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hàng Cấp 2 — Sub-chips & Dropdown Loại tài liệu tương tự Cấp 1 */}
        {selectedCategory !== 'all' && availableTypesForFilter.length > 0 && (
          <div className="relative z-10 flex items-stretch justify-between bg-surface-elevated/40 rounded-b-xl">
            {/* Phía trái: Nhãn phân cấp + danh sách chips cuộn ngang */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 overflow-x-auto scrollbar-none flex-1 min-w-0" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[11px] text-muted font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
                <i className="fa-solid fa-sitemap text-[10px] text-primary" />
                Loại tài liệu:
              </span>

              {/* Chip "Tất cả" */}
              <button
                type="button"
                onClick={() => { setSelectedType('all'); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedType === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface text-secondary border border-border-subtle hover:border-primary hover:text-primary'
                }`}
              >
                <span>Tất cả</span>
                <span className={`text-[10px] font-bold ${
                  selectedType === 'all' ? 'text-white/80' : 'text-muted'
                }`}>
                  ({documents.filter((d) => d.dm_tai_lieu === Number(selectedCategory)).length})
                </span>
              </button>

              {/* Chips từng loại Cấp 2 */}
              {availableTypesForFilter.map((t) => {
                const isActive = selectedType === String(t.id);
                const docCount = documents.filter(
                  (d) =>
                    d.dm_tai_lieu === Number(selectedCategory) &&
                    Array.isArray(d.loai_tai_lieu) &&
                    d.loai_tai_lieu.includes(t.id)
                ).length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSelectedType(String(t.id)); setCurrentPage(1); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface text-secondary border border-border-subtle hover:border-primary hover:text-primary'
                    }`}
                    title={t.ghi_chu || t.ten_loai}
                  >
                    {!t.is_public && (
                      <i className="fa-solid fa-lock text-[9px] opacity-70" />
                    )}
                    <span>{t.ten_loai}</span>
                    <span className={`text-[10px] font-bold ${
                      isActive ? 'text-white/80' : 'text-muted'
                    }`}>
                      ({docCount})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Phía phải: Nút dropdown Loại tài liệu ở góc phải */}
            <div className="relative shrink-0 flex items-stretch border-l border-border-subtle" ref={typeDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTypeDropdownOpen((prev) => !prev);
                  setIsCategoryDropdownOpen(false);
                }}
                className="px-3.5 py-2.5 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-elevated transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap rounded-br-xl"
                title="Mở danh sách tất cả Loại tài liệu"
                aria-haspopup="listbox"
                aria-expanded={isTypeDropdownOpen}
              >
                <i className="fa-solid fa-tags text-xs text-primary" />
                <span className="hidden sm:inline">Loại tài liệu</span>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {isTypeDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 max-h-80 overflow-y-auto bg-surface rounded-xl border border-border-subtle shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>Loại tài liệu</span>
                    <span className="text-[10px] text-primary lowercase font-medium">Cấp 2</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('all');
                      setCurrentPage(1);
                      setIsTypeDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selectedType === 'all'
                        ? 'bg-primary text-white font-bold'
                        : 'text-main hover:bg-surface-elevated'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <i className="fa-solid fa-layer-group text-xs" />
                      <span className="truncate">Tất cả loại tài liệu</span>
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedType === 'all' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-secondary border border-border-subtle'
                    }`}>
                      {documents.filter((d) => d.dm_tai_lieu === Number(selectedCategory)).length}
                    </span>
                  </button>

                  <div className="my-1 border-t border-border-subtle" />

                  {availableTypesForFilter.map((t) => {
                    const isSelected = selectedType === String(t.id);
                    const docCount = documents.filter(
                      (d) =>
                        d.dm_tai_lieu === Number(selectedCategory) &&
                        Array.isArray(d.loai_tai_lieu) &&
                        d.loai_tai_lieu.includes(t.id)
                    ).length;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedType(String(t.id));
                          setCurrentPage(1);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white font-bold'
                            : 'text-main hover:bg-surface-elevated'
                        }`}
                        title={t.ghi_chu || t.ten_loai}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {!t.is_public ? (
                            <i className="fa-solid fa-lock text-[10px] opacity-70" />
                          ) : (
                            <i className="fa-solid fa-tag text-xs opacity-70" />
                          )}
                          <span className="truncate">{t.ten_loai}</span>
                        </span>
                        <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-surface-elevated text-secondary border border-border-subtle'
                        }`}>
                          {docCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Khi ở chế độ Tất cả: hiện gợi ý chọn thư mục để lọc sâu */}
        {selectedCategory === 'all' && (
          <div className="px-4 py-2.5 flex items-center gap-2 bg-primary/3 rounded-b-xl border-t border-border-subtle">
            <i className="fa-solid fa-circle-info text-primary text-[11px] shrink-0" />
            <span className="text-[11px] text-secondary">
              Đang xem toàn bộ <strong className="text-main font-bold">{documents.length} tài liệu</strong> trong kho.
              Chọn một <strong className="text-primary">Thư mục</strong> ở trên để lọc theo phòng ban và xem các <strong className="text-primary">Loại tài liệu</strong> con.
            </span>
          </div>
        )}
      </div>

      {/* 2. THANH BỘ LỌC TÌM KIẾM (MỤC 3) */}
      <div className="bg-surface p-3.5 rounded-xl border border-border-subtle shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
          {/* Ô Tìm kiếm rộng rãi: 8 cols */}
          <div className="sm:col-span-2 md:col-span-8 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, ký hiệu, nơi ban hành..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-[13px] rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-hidden focus:border-primary placeholder:text-muted transition-colors"
              aria-label="Tìm theo tiêu đề, ký hiệu, nơi ban hành"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs p-1 cursor-pointer"
                title="Xóa từ khóa"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* Dropdown Năm ban hành - 2 cols */}
          <div className="sm:col-span-1 md:col-span-2 relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-3 pr-8 text-[13px] rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-hidden focus:border-primary cursor-pointer font-medium transition-colors appearance-none"
              aria-label="Lọc theo năm ban hành"
            >
              <option value="all">Tất cả năm</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Năm {yr}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-xs" />
          </div>

          {/* Dropdown Hiệu lực - 2 cols */}
          <div className="sm:col-span-1 md:col-span-2 relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-3 pr-8 text-[13px] rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-hidden focus:border-primary cursor-pointer font-medium transition-colors appearance-none"
              aria-label="Lọc theo tình trạng hiệu lực"
            >
              <option value="all">Tất cả hiệu lực</option>
              <option value="CON_HIEU_LUC">🟢 Còn hiệu lực</option>
              <option value="CON_HIEU_LUC_1_PHAN">🟡 Còn hiệu lực 1 phần</option>
              <option value="HET_HIEU_LUC">🔴 Hết hiệu lực</option>
              <option value="HET_VA_THAY_THE">🟠 Hết và thay thế</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-xs" />
          </div>
        </div>

        {/* Chip bộ lọc & Nút Xóa bộ lọc (Mục 3) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border-subtle text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-secondary">
              <span className="text-muted font-medium mr-0.5">Đang lọc:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>Tìm: "{searchTerm}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                    }}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc tìm kiếm"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>Loại: {types.find((t) => t.id === Number(selectedType))?.ten_loai}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedType('all')}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc loại tài liệu"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>Năm: {selectedYear}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedYear('all')}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc năm"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>
                    Hiệu lực: {
                      statusFilter === 'CON_HIEU_LUC'
                        ? 'Còn hiệu lực'
                        : statusFilter === 'CON_HIEU_LUC_1_PHAN'
                          ? 'Còn hiệu lực 1 phần'
                          : statusFilter === 'HET_HIEU_LUC'
                            ? 'Hết hiệu lực'
                            : 'Hết và thay thế'
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc hiệu lực"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-danger hover:bg-danger-subtle rounded-md transition-colors font-semibold cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-rotate-left text-[11px]" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. THANH KẾT QUẢ TRÊN BẢNG (MỤC 4) */}
      <div className="flex items-center justify-between text-xs text-secondary px-1">
        <div>
          {totalCount === 0 ? (
            <span>Hiển thị <strong className="text-main font-bold">0 / 0</strong> tài liệu</span>
          ) : (
            <span>
              Hiển thị <strong className="text-main font-bold">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)}</strong> / <strong className="text-main font-bold">{totalCount}</strong> tài liệu
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          icon="fa-file-excel"
          onClick={handleExportExcel}
          isLoading={isExporting}
          title="Xuất danh sách theo bộ lọc hiện tại"
          aria-label="Xuất danh sách theo bộ lọc hiện tại"
          className="text-xs font-semibold"
        >
          Xuất Excel
        </Button>
      </div>

      {/* 4. BẢNG DỮ LIỆU TÀI LIỆU CHÍNH (MỤC 5) */}
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
        onClearFilters={handleClearFilters}
        onDrillDown={(categoryId, typeId) => {
          // Bấm dòng: chuyển sang Tab Thư mục tương ứng + chọn Loại tài liệu
          setSelectedCategory(String(categoryId));
          setSelectedType(typeId ? String(typeId) : 'all');
          setCurrentPage(1);
        }}
      />

      {/* MODAL XEM CHI TIẾT TÀI LIỆU (MỤC 6) */}
      <ResourceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={detailItem}
        onDownloadFile={handleDownloadFile}
        onEdit={(item) => {
          setIsDetailOpen(false);
          handleEdit(item);
        }}
        onDelete={(item) => {
          setIsDetailOpen(false);
          handleDelete(item);
        }}
      />

      {/* MODAL THÊM MỚI / SỬA TÀI LIỆU (MỤC 7) */}
      <ResourceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={formInitialData}
        categories={categories}
        types={types}
      />

      {/* MODAL QUẢN LÝ CẤU TRÚC DANH MỤC CẤP 1 & LOẠI BIỂU MẪU CẤP 2 (MỤC 8) */}
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

      {/* MODAL XÁC NHẬN XÓA TÀI LIỆU (MỤC 5) */}
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
                  Xóa tài liệu {deleteItem.ky_hieu || deleteItem.tieu_de}? Hành động này không thể hoàn tác.
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
