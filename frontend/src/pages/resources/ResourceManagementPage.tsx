import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  ResourceItem,
  ResourceAttachment,
  ResourceCategory,
  ResourceType,
} from '@app-types/resource';
import { ResourceTable } from '@components/resources/ResourceTable';
import { ResourceDetailModal } from '@components/resources/ResourceDetailModal';
import { ResourceFormModal, ResourceFormData } from '@components/resources/ResourceFormModal';
import { CategoryManagementModal } from '@components/resources/CategoryManagementModal';
import { Button } from '@components/common/Button';
import { Toast, ToastNotification } from '@components/resources/Toast';
import { useTranslation } from '@i18n/translate';
import { authService } from '@lib/authService';
import { apiClient } from '@lib/apiClient';

const STORAGE_KEY = 'tlbm_resources_filter_state';
const STORAGE_DOCS = 'tlbm_documents_v2';
const STORAGE_CATS = 'tlbm_categories_v2';
const STORAGE_TYPES = 'tlbm_types_v2';
const STORAGE_VISIBLE_CATS = 'tlbm_visible_categories_v2';
const STORAGE_VISIBLE_TYPES = 'tlbm_visible_types_v2';

interface PersistedResourceState {
  category?: string;
  type?: string;
  year?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

const getInitialFilterState = (searchParams: URLSearchParams): PersistedResourceState => {
  // Kiểm tra xem lần tải trang này có phải là Reload (F5 / Refresh) của trình duyệt hay không
  const isReload = (() => {
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        return (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      }
      return (performance as unknown as { navigation?: { type?: number } }).navigation?.type === 1;
    } catch {
      return false;
    }
  })();

  // 1. Nếu trên URL có query params, luôn ưu tiên đọc trực tiếp từ URL
  const hasUrlParams = searchParams.toString().length > 0;
  if (hasUrlParams) {
    return {
      category: searchParams.get('category') || undefined,
      type: searchParams.get('type') || undefined,
      year: searchParams.get('year') || undefined,
      status: searchParams.get('status') || undefined,
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
    };
  }

  // 2. Nếu là Reload (F5 / Refresh) mà URL không có param, phục hồi từ sessionStorage
  if (isReload) {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Không thể đọc trạng thái kho tài liệu từ sessionStorage', e);
    }
  }

  // 3. Mặc định mới vào: Xóa sạch cache cũ để đảm bảo bắt đầu ở "Tất cả" & 5 dòng
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return {};
};

export default function ResourceManagementPage() {
  const { t, currentLang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilterState = useMemo(() => getInitialFilterState(searchParams), [searchParams]);

  // Khởi tạo trạng thái rỗng và dọn dẹp sạch toàn bộ cache dữ liệu mẫu cũ trong localStorage
  const [documents, setDocuments] = useState<ResourceItem[]>(() => {
    try {
      localStorage.removeItem('tlbm_custom_documents_v1');
      localStorage.removeItem('tlbm_custom_categories_v1');
      localStorage.removeItem('tlbm_custom_types_v1');
      localStorage.removeItem('tlbm_visible_categories_v1');
      localStorage.removeItem('tlbm_visible_types_v1');
      localStorage.removeItem(STORAGE_DOCS);
      localStorage.removeItem(STORAGE_CATS);
      localStorage.removeItem(STORAGE_TYPES);
    } catch {
      /* ignore */
    }
    return [];
  });

  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [types, setTypes] = useState<ResourceType[]>([]);

  // Danh sách ID các danh mục được tick chọn để hiển thị trên thanh chính (Mặc định tick chọn tất cả)
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VISIBLE_CATS);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  // Tự động đồng bộ các danh mục hiển thị khi nạp danh mục: mặc định tick full toàn bộ danh mục
  useEffect(() => {
    if (categories.length > 0) {
      setVisibleCategoryIds((prev) => {
        const allCatIds = categories.map((c) => c.id);
        const saved = localStorage.getItem(STORAGE_VISIBLE_CATS);
        if (saved === null) {
          return allCatIds;
        }
        const existing = prev.filter((id) => allCatIds.includes(id));
        const newCats = allCatIds.filter((id) => !prev.includes(id));
        const combined = [...existing, ...newCats];
        return combined.length > 0 ? combined : allCatIds;
      });
    }
  }, [categories]);

  // Lưu cấu hình ghim danh mục vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VISIBLE_CATS, JSON.stringify(visibleCategoryIds));
    } catch {
      /* ignore */
    }
  }, [visibleCategoryIds]);

  const toggleCategoryVisibility = (catId: number) => {
    setVisibleCategoryIds((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const toggleAllCategoriesVisibility = (selectAll: boolean) => {
    if (selectAll) {
      setVisibleCategoryIds(categories.map((c) => c.id));
    } else {
      setVisibleCategoryIds([]);
    }
  };

  // Danh sách ID các loại tài liệu được tick chọn để hiển thị trên thanh sub-chips (Mặc định tick chọn tất cả)
  const [visibleTypeIds, setVisibleTypeIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VISIBLE_TYPES);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  // Tự động đồng bộ các loại tài liệu hiển thị: mặc định tick full toàn bộ loại tài liệu
  useEffect(() => {
    if (types.length > 0) {
      setVisibleTypeIds((prev) => {
        const allTypeIds = types.map((t) => t.id);
        const saved = localStorage.getItem(STORAGE_VISIBLE_TYPES);
        if (saved === null) {
          return allTypeIds;
        }
        const existing = prev.filter((id) => allTypeIds.includes(id));
        const newTypes = allTypeIds.filter((id) => !prev.includes(id));
        const combined = [...existing, ...newTypes];
        return combined.length > 0 ? combined : allTypeIds;
      });
    }
  }, [types]);

  // Lưu cấu hình ghim loại tài liệu vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VISIBLE_TYPES, JSON.stringify(visibleTypeIds));
    } catch {
      /* ignore */
    }
  }, [visibleTypeIds]);

  const toggleTypeVisibility = (typeId: number) => {
    setVisibleTypeIds((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };


  // Trạng thái đang tải dữ liệu từ Backend API
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tải dữ liệu từ Backend API (/api/resources/...)
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catsRes, typesRes, docsRes] = await Promise.all([
        apiClient<any>('/api/resources/categories/').catch(() => null),
        apiClient<any>('/api/resources/types/').catch(() => null),
        apiClient<any>('/api/resources/documents/').catch(() => null),
      ]);

      const normalizeList = <T,>(data: any): T[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      };

      setCategories(normalizeList<ResourceCategory>(catsRes));
      setTypes(normalizeList<ResourceType>(typesRes));
      setDocuments(normalizeList<ResourceItem>(docsRes));
    } catch (e) {
      console.warn('Lỗi khi tải dữ liệu từ API backend:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchResources();
  }, [fetchResources]);



  // ============================================================================
  // BỘ LỌC ĐA NĂNG & PHÂN TẦNG:
  // - selectedCategory: Lọc theo Cấp 1 (Mặc định 'all' để xem toàn bộ kho)
  // - selectedType: Lọc theo Cấp 2 (Bên trong Cấp 1 đang chọn)
  // - selectedYear: Lọc theo năm văn bản (2026, 2025, 2024...)
  // - statusFilter: Lọc theo trạng thái hiệu lực
  // - searchTerm: Tìm theo tiêu đề, ký hiệu, nơi ban hành
  // ============================================================================
  // Mặc định mới vào: hiện ở Tất cả ('all')
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilterState.category || 'all');
  const [selectedType, setSelectedType] = useState<string>(initialFilterState.type || 'all');
  const [selectedYear, setSelectedYear] = useState<string>(initialFilterState.year || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterState.status || 'all');

  // Cascading Loại tài liệu thuộc Thư mục đang chọn
  const availableTypesForFilter = useMemo(() => {
    if (selectedCategory === 'all') {
      return types;
    }
    return types.filter((t) => t.dm_tai_lieu === Number(selectedCategory));
  }, [types, selectedCategory]);

  const toggleAllTypesVisibility = (selectAll: boolean) => {
    const currentScopeTypeIds = availableTypesForFilter.map((t) => t.id);
    if (selectAll) {
      const newItems = currentScopeTypeIds.filter((id) => !visibleTypeIds.includes(id));
      setVisibleTypeIds((prev) => [...prev, ...newItems]);
    } else {
      setVisibleTypeIds((prev) => prev.filter((id) => !currentScopeTypeIds.includes(id)));
    }
  };

  // Phân trang: Mặc định mới vào hiển thị 5 dòng
  const [currentPage, setCurrentPage] = useState<number>(
    initialFilterState.page && initialFilterState.page > 0 ? initialFilterState.page : 1
  );
  const [pageSize, setPageSize] = useState<number>(
    initialFilterState.pageSize && initialFilterState.pageSize > 0 ? initialFilterState.pageSize : 5
  );

  // Bộ lọc: Search debounced 300ms
  const [searchInput, setSearchInput] = useState(initialFilterState.q || '');
  const [searchTerm, setSearchTerm] = useState(initialFilterState.q || '');
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sắp xếp Thư mục (Cấp 1) theo STT ưu tiên (Mặc định mới vào hiển thị tab 'all' - Tất cả)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.stt_uu_tien || 0) - (b.stt_uu_tien || 0));
  }, [categories]);

  // Danh mục hiển thị trên thanh chính theo đúng THỨ TỰ TICK CHỌN (cái nào tick trước hiện trước, tick sau hiện sau)
  const orderedVisibleCategories = useMemo(() => {
    return visibleCategoryIds
      .map((id) => categories.find((c) => c.id === id))
      .filter((c): c is ResourceCategory => Boolean(c));
  }, [visibleCategoryIds, categories]);

  // Loại tài liệu hiển thị trên thanh sub-chips theo đúng THỨ TỰ TICK CHỌN (cái nào tick trước hiện trước, tick sau hiện sau)
  const orderedVisibleTypes = useMemo(() => {
    return visibleTypeIds
      .map((id) => availableTypesForFilter.find((t) => t.id === id))
      .filter((t): t is ResourceType => Boolean(t));
  }, [visibleTypeIds, availableTypesForFilter]);

  // Ref cho thanh tab ngang (Cấp 1) & thanh loại tài liệu ngang (Cấp 2)
  const tabBarRef = useRef<HTMLDivElement>(null);
  const typeBarRef = useRef<HTMLDivElement>(null);

  // Tự động lưu trạng thái vào sessionStorage và đồng bộ URL Query Parameters
  // Khi reload lại trang (F5), toàn bộ mục đang chọn, trang và dòng hiển thị vẫn được giữ nguyên
  useEffect(() => {
    const stateToSave: PersistedResourceState = {
      category: selectedCategory,
      type: selectedType,
      year: selectedYear,
      status: statusFilter,
      q: searchTerm || undefined,
      page: currentPage > 1 ? currentPage : undefined,
      pageSize: pageSize !== 5 ? pageSize : undefined,
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      /* ignore */
    }

    const newParams = new URLSearchParams();
    if (selectedCategory !== 'all') newParams.set('category', selectedCategory);
    if (selectedType !== 'all') newParams.set('type', selectedType);
    if (selectedYear !== 'all') newParams.set('year', selectedYear);
    if (statusFilter !== 'all') newParams.set('status', statusFilter);
    if (searchTerm.trim()) newParams.set('q', searchTerm.trim());
    if (currentPage > 1) newParams.set('page', String(currentPage));
    if (pageSize !== 5) newParams.set('pageSize', String(pageSize));

    setSearchParams(newParams, { replace: true });
  }, [
    selectedCategory,
    selectedType,
    selectedYear,
    statusFilter,
    searchTerm,
    currentPage,
    pageSize,
    setSearchParams,
  ]);

  // Modal State
  const [detailItem, setDetailItem] = useState<ResourceItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<ResourceItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Modal Xóa Tài liệu
  const [deleteItem, setDeleteItem] = useState<ResourceItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Toast thông báo nổi trên cùng (z-[999999] trên tất cả modal và màn đen)
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const lastToastRef = useRef<{ message: string; time: number } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'danger' | 'warning' | 'info' = 'success',
    title?: string,
    duration?: number
  ) => {
    // Chống spam: Không hiện lại cùng 1 thông báo nếu vừa hiển thị trong vòng 2.5s
    const now = Date.now();
    if (lastToastRef.current && lastToastRef.current.message === message && now - lastToastRef.current.time < 2500) {
      return;
    }
    lastToastRef.current = { message, time: now };

    setToast({
      id: now,
      message,
      type,
      title,
      duration: duration || 2500,
    });
  };

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


  // Hỗ trợ cuộn ngang mượt mà: con lăn chuột (Mouse Wheel), vuốt cảm ứng/trackpad và kéo giữ chuột (Drag to Scroll)
  useEffect(() => {
    const attachHorizontalScroll = (el: HTMLDivElement | null) => {
      if (!el) return undefined;

      let isAnimating = false;
      let targetScrollLeft = el.scrollLeft;
      let animationFrameId: number | null = null;

      const smoothScroll = () => {
        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        targetScrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft));
        const diff = targetScrollLeft - el.scrollLeft;

        if (Math.abs(diff) > 0.5) {
          el.scrollLeft += diff * 0.16;
          animationFrameId = requestAnimationFrame(smoothScroll);
        } else {
          el.scrollLeft = targetScrollLeft;
          isAnimating = false;
          animationFrameId = null;
        }
      };

      const onWheel = (e: WheelEvent) => {
        // Luôn chặn cuộn trang dọc khi trỏ chuột trên thanh này (cách ly hoàn toàn 2 bên và độc lập với trang)
        e.preventDefault();
        e.stopPropagation();

        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (delta === 0) return;

        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        if (maxScrollLeft <= 0) return;

        // Đồng bộ vị trí xuất phát nếu trước đó animation đã dừng
        if (!isAnimating) {
          targetScrollLeft = el.scrollLeft;
        }

        // Tích lũy bước trượt mượt mà (hệ số 1.15 giúp lướt nhạy và êm)
        targetScrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft + delta * 1.15));

        if (!isAnimating) {
          isAnimating = true;
          animationFrameId = requestAnimationFrame(smoothScroll);
        }
      };

      // Kéo giữ chuột để trượt ngang (Drag to scroll)
      let isMouseDown = false;
      let startX = 0;
      let scrollLeftStart = 0;
      let hasDragged = false;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return; // Chỉ nhận chuột trái
        isMouseDown = true;
        hasDragged = false;
        startX = e.pageX - el.offsetLeft;
        scrollLeftStart = el.scrollLeft;
        if (isAnimating && animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          isAnimating = false;
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isMouseDown) return;
        const x = e.pageX - el.offsetLeft;
        const walk = x - startX;
        if (Math.abs(walk) > 4) {
          hasDragged = true;
          el.scrollLeft = scrollLeftStart - walk;
        }
      };

      const onMouseUp = () => {
        if (!isMouseDown) return;
        isMouseDown = false;
        if (hasDragged) {
          // Ngăn chặn sự kiện click vào button con khi người dùng vừa nhả chuột sau khi kéo
          const captureClick = (clickEvent: MouseEvent) => {
            clickEvent.stopPropagation();
            clickEvent.preventDefault();
            window.removeEventListener('click', captureClick, true);
          };
          window.addEventListener('click', captureClick, true);
        }
      };

      const onMouseLeave = () => {
        isMouseDown = false;
      };

      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      el.addEventListener('mouseleave', onMouseLeave);

      return () => {
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('mouseleave', onMouseLeave);
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    };

    const cleanupTab = attachHorizontalScroll(tabBarRef.current);
    const cleanupType = attachHorizontalScroll(typeBarRef.current);

    return () => {
      cleanupTab?.();
      cleanupType?.();
    };
  }, [orderedVisibleCategories, orderedVisibleTypes, availableTypesForFilter, selectedCategory]);

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
    if (categories.length === 0) {
      // Mở trực tiếp màn Quản lý thư mục để người dùng tạo thư mục trước, không hiện toast cảnh báo gây spam
      setToast(null);
      setIsCategoryModalOpen(true);
      return;
    }
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

      // Gọi API Backend xóa tài liệu
      await apiClient.delete(`/api/resources/documents/${deleteItem.id}/`).catch((e) => {
        console.warn('Lỗi khi xóa tài liệu trên backend:', e);
      });

      // Xóa khỏi danh sách tài liệu
      const targetId = deleteItem.id;
      const targetTitle = deleteItem.tieu_de;
      setDocuments((prev) => prev.filter((d) => d.id !== targetId));

      // Đóng modal xác nhận
      setIsDeleteOpen(false);
      setDeleteItem(null);

      // Hiển thị Toast thông báo thành công
      showToast(`Đã xóa thành công tài liệu: "${targetTitle}"`, 'danger', 'Xóa tài liệu');

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
    const { formData, payload } = data;
    const cat = categories.find((c) => c.id === Number(payload.dm_tai_lieu));
    const selectedTypeNames = types
      .filter((t) => payload.loai_tai_lieu.includes(t.id))
      .map((t) => t.ten_loai);

    try {
      setIsSubmittingDoc(true);

      let savedDoc: ResourceItem;

      if (formInitialData) {
        // Cập nhật tài liệu qua Backend API
        savedDoc = await apiClient<ResourceItem>(`/api/resources/documents/${formInitialData.id}/`, {
          method: 'PATCH',
          body: formData,
        });

        // Đảm bảo tên danh mục và loại tài liệu hiển thị tức thì trên giao diện
        savedDoc = {
          ...savedDoc,
          dm_tai_lieu_name: savedDoc.dm_tai_lieu_name || cat?.ten_tai_lieu,
          loai_tai_lieu_names:
            savedDoc.loai_tai_lieu_names && savedDoc.loai_tai_lieu_names.length > 0
              ? savedDoc.loai_tai_lieu_names
              : selectedTypeNames,
        };

        setDocuments((prev) =>
          prev.map((d) => (d.id === formInitialData.id ? savedDoc : d))
        );
        setIsFormOpen(false);
        showToast(`Đã cập nhật thành công tài liệu: "${savedDoc.tieu_de}"`, 'success', 'Cập nhật tài liệu');
      } else {
        // Tạo mới tài liệu qua Backend API
        savedDoc = await apiClient<ResourceItem>('/api/resources/documents/', {
          method: 'POST',
          body: formData,
        });

        savedDoc = {
          ...savedDoc,
          dm_tai_lieu_name: savedDoc.dm_tai_lieu_name || cat?.ten_tai_lieu,
          loai_tai_lieu_names:
            savedDoc.loai_tai_lieu_names && savedDoc.loai_tai_lieu_names.length > 0
              ? savedDoc.loai_tai_lieu_names
              : selectedTypeNames,
        };

        setDocuments((prev) => [savedDoc, ...prev]);
        setIsFormOpen(false);
        showToast(`Đã thêm mới thành công tài liệu: "${savedDoc.tieu_de}"`, 'success', 'Thêm mới tài liệu');
      }
    } catch (error) {
      console.error('Lỗi khi lưu tài liệu lên server:', error);
      showToast('Không thể lưu tài liệu lên hệ thống máy chủ', 'danger', 'Lỗi lưu trữ');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // Quản lý Danh mục Cấp 1
  const handleSaveCategory = async (
    category: ResourceCategory,
    isEdit: boolean,
    childCount?: number,
    childTypes?: string[]
  ) => {
    try {
      if (isEdit) {
        const payload = {
          stt_uu_tien: category.stt_uu_tien,
          ky_hieu: category.ky_hieu || '',
          ten_tai_lieu: category.ten_tai_lieu,
          ngay_lap: category.ngay_lap || null,
          ghi_chu: category.ghi_chu || '',
        };
        const updated = await apiClient.put<ResourceCategory>(`/api/resources/categories/${category.id}/`, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setDocuments((prev) =>
          prev.map((d) =>
            d.dm_tai_lieu === updated.id ? { ...d, dm_tai_lieu_name: updated.ten_tai_lieu } : d
          )
        );
        showToast(`Đã cập nhật thành công thư mục: "${updated.ten_tai_lieu}"`, 'success', 'Cập nhật Thư mục');
      } else {
        const payload = {
          stt_uu_tien: category.stt_uu_tien,
          ky_hieu: category.ky_hieu || '',
          ten_tai_lieu: category.ten_tai_lieu,
          ngay_lap: category.ngay_lap || null,
          ghi_chu: category.ghi_chu || '',
        };
        const savedCat = await apiClient.post<ResourceCategory>('/api/resources/categories/', payload);
        setCategories((prev) => [...prev, savedCat]);
        setVisibleCategoryIds((prev) => [...prev, savedCat.id]);

        // Nếu có danh sách loại con khởi tạo kèm theo:
        if (childTypes && childTypes.length > 0) {
          const createdTypes: ResourceType[] = [];
          for (const typeName of childTypes) {
            const typePayload = {
              dm_tai_lieu: savedCat.id,
              ten_loai: typeName.trim(),
              is_public: true,
              ghi_chu: `Khởi tạo cùng thư mục ${savedCat.ten_tai_lieu}`,
              ngay_lap: savedCat.ngay_lap || new Date().toISOString(),
            };
            const savedType = await apiClient.post<ResourceType>('/api/resources/types/', typePayload).catch((e) => {
              console.error('Lỗi khi tạo loại con:', e);
              return null;
            });
            if (savedType) {
              createdTypes.push(savedType);
            }
          }
          if (createdTypes.length > 0) {
            setTypes((prev) => [...prev, ...createdTypes]);
            setVisibleTypeIds((prev) => [...prev, ...createdTypes.map((ct) => ct.id)]);
          }
        }

        const extraMsg = childCount && childCount > 0 ? ` (kèm ${childCount} loại con)` : '';
        showToast(`Đã thêm mới thành công thư mục: "${savedCat.ten_tai_lieu}"${extraMsg}`, 'success', 'Thêm mới Thư mục');
      }
    } catch (e) {
      console.error('Lỗi khi lưu thư mục lên máy chủ:', e);
      showToast('Không thể lưu thư mục lên hệ thống máy chủ', 'danger', 'Lỗi lưu trữ');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const cat = categories.find((c) => c.id === id);
    try {
      await apiClient.delete(`/api/resources/categories/${id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setVisibleCategoryIds((prev) => prev.filter((cid) => cid !== id));
      setTypes((prev) => prev.filter((t) => t.dm_tai_lieu !== id));
      setDocuments((prev) => prev.filter((d) => d.dm_tai_lieu !== id));
      showToast(`Đã xóa thành công thư mục Cấp 1: "${cat?.ten_tai_lieu || id}"`, 'danger', 'Xóa Thư mục');
      if (selectedCategory === String(id)) {
        setSelectedCategory('all');
      }
    } catch (e) {
      console.error('Lỗi khi xóa danh mục trên máy chủ:', e);
      showToast('Không thể xóa thư mục trên hệ thống máy chủ', 'danger', 'Lỗi thao tác');
    }
  };

  // Quản lý Loại biểu mẫu Cấp 2
  const handleSaveType = async (typeItem: ResourceType, isEdit: boolean, silent?: boolean) => {
    try {
      if (isEdit) {
        const payload = {
          dm_tai_lieu: typeItem.dm_tai_lieu,
          ten_loai: typeItem.ten_loai,
          is_public: typeItem.is_public,
          ghi_chu: typeItem.ghi_chu || '',
        };
        const updated = await apiClient.put<ResourceType>(`/api/resources/types/${typeItem.id}/`, payload);
        setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setDocuments((prev) =>
          prev.map((d) => {
            if (d.loai_tai_lieu?.includes(updated.id)) {
              const updatedTypes = types.map((t) => (t.id === updated.id ? updated : t));
              const newNames = updatedTypes
                .filter((t) => d.loai_tai_lieu.includes(t.id))
                .map((t) => t.ten_loai);
              return { ...d, loai_tai_lieu_names: newNames };
            }
            return d;
          })
        );
        if (!silent) {
          showToast(`Đã cập nhật thành công loại tài liệu: "${updated.ten_loai}"`, 'success', 'Cập nhật Loại tài liệu');
        }
      } else {
        const payload = {
          dm_tai_lieu: typeItem.dm_tai_lieu,
          ten_loai: typeItem.ten_loai,
          is_public: typeItem.is_public,
          ghi_chu: typeItem.ghi_chu || '',
        };
        const saved = await apiClient.post<ResourceType>('/api/resources/types/', payload);
        setTypes((prev) => [...prev, saved]);
        setVisibleTypeIds((prev) => [...prev, saved.id]);
        if (!silent) {
          showToast(`Đã thêm mới thành công loại tài liệu: "${saved.ten_loai}"`, 'success', 'Thêm mới Loại tài liệu');
        }
      }
    } catch (e) {
      console.error('Lỗi khi lưu loại tài liệu lên máy chủ:', e);
      showToast('Không thể lưu loại tài liệu lên hệ thống máy chủ', 'danger', 'Lỗi lưu trữ');
    }
  };

  const handleDeleteType = async (id: number) => {
    const typeItem = types.find((t) => t.id === id);
    try {
      await apiClient.delete(`/api/resources/types/${id}/`);
      setTypes((prev) => prev.filter((t) => t.id !== id));
      setVisibleTypeIds((prev) => prev.filter((tid) => tid !== id));
      setDocuments((prev) =>
        prev.map((d) => ({
          ...d,
          loai_tai_lieu: (d.loai_tai_lieu || []).filter((tid) => tid !== id),
          loai_tai_lieu_names: (d.loai_tai_lieu_names || []).filter(
            (name) => name !== typeItem?.ten_loai
          ),
        }))
      );
      showToast(`Đã xóa thành công loại tài liệu: "${typeItem?.ten_loai || id}"`, 'danger', 'Xóa Loại tài liệu');
      if (selectedType === String(id)) {
        setSelectedType('all');
      }
    } catch (e) {
      console.error('Lỗi khi xóa loại tài liệu trên máy chủ:', e);
      showToast('Không thể xóa loại tài liệu trên hệ thống máy chủ', 'danger', 'Lỗi thao tác');
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
      showToast('Đã xuất thành công file danh sách tài liệu!', 'success', 'Xuất dữ liệu Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Xử lý tải tệp đính kèm về máy
  const handleDownloadFile = (item: ResourceItem, fileName?: string, filePath?: string) => {
    const targetPath = filePath || item.file_dinh_kem;
    if (!targetPath) return;
    const a = document.createElement('a');
    a.href = targetPath;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const suggestedName =
      fileName ||
      item.attachments?.[0]?.name ||
      (targetPath.startsWith('blob:') ? `${item.tieu_de || 'tai_lieu'}.pdf` : targetPath.split('?')[0].split('/').pop()) ||
      'tai_lieu.pdf';
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-4 pb-16 sm:pb-20">
      {/* Header trang & Nút hành động (GIỮ NGUYÊN KHÔNG ĐỤNG VÀO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-main tracking-tight">
            {t('resourceManagement.pageTitle')}
          </h1>
          <p className="text-xs text-secondary mt-1">
            {t('resourceManagement.pageSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Nút Quản lý Danh mục (Thao tác cấu hình phụ) */}
          <Button
            variant="secondary"
            size="md"
            icon="fa-folder-tree"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold border-border-subtle shadow-2xs hover:border-primary/50 hover:text-primary transition-all"
            title={t('resourceManagement.categoriesBtn')}
          >
            {t('resourceManagement.categoriesBtn')}
          </Button>

          {/* Nút Thêm mới tài liệu (Thao tác chính nổi bật) */}
          <Button
            variant="primary"
            size="md"
            icon="fa-plus"
            onClick={handleAddNew}
            className="h-10 px-4.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-glow transition-all"
            title={t('resourceManagement.addDocumentBtn')}
          >
            {t('resourceManagement.addDocumentBtn')}
          </Button>
        </div>
      </div>

      {/* 1. THANH TAB THƯ MỤC NGANG (CẤP 1) — Thiết kế 5 cột đối xứng, đường kẻ căn chỉnh 100% */}
      <div className="bg-surface rounded-xl border border-border-subtle shadow-xs">
        {/* Hàng tab chính (Row 1 - Danh mục Cấp 1) */}
        {(() => {
          const hasBottomRow = Boolean(selectedCategory !== 'all' && availableTypesForFilter.length > 0);
          return (
            <div className={`relative z-20 flex items-stretch h-11 ${hasBottomRow ? 'border-b border-border-subtle' : ''}`}>
              {/* Cột 1: Tab Tất cả (cố định bên trái, độ rộng w-[130px]) */}
              <div className={`w-[130px] shrink-0 flex items-stretch border-r border-border-subtle ${!hasBottomRow ? 'rounded-bl-xl' : ''}`}>
                {(() => {
                  const isAll = selectedCategory === 'all';
                  return (
                    <button
                      key="all"
                      type="button"
                      onClick={() => handleCategorySelect('all')}
                      className={`w-full flex items-center justify-center gap-2 px-3 text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer rounded-tl-xl ${
                        !hasBottomRow ? 'rounded-bl-xl' : ''
                      } ${
                        isAll
                          ? 'border-b-2 border-primary text-primary bg-primary/5 font-bold'
                          : 'border-b-2 border-transparent text-secondary hover:text-main hover:bg-surface-elevated/60'
                      }`}
                      aria-current={isAll ? 'page' : undefined}
                    >
                  <i className={`fa-solid fa-layer-group text-xs ${isAll ? 'text-primary' : 'text-muted'}`} />
                  <span>{t('resourceManagement.all')}</span>
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
          </div>

          {/* Vùng danh mục cuộn ngang (Hiển thị theo đúng thứ tự tick chọn 1, 2, 3...) */}
          <div
            ref={tabBarRef}
            className="flex items-stretch gap-0 overflow-x-auto scrollbar-none flex-1 min-w-0 select-none cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehavior: 'contain' }}
          >
            {orderedVisibleCategories.map((cat) => {
              const isSelected = selectedCategory === String(cat.id);
              const count = documents.filter((d) => d.dm_tai_lieu === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(String(cat.id))}
                  className={`flex items-center gap-1.5 px-3.5 h-full text-xs sm:text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer shrink-0 ${
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
            {orderedVisibleCategories.length === 0 && (
              <div className="flex items-center px-4 text-xs text-muted italic">
                Chưa có danh mục nào được tick hiển thị. Bấm "Danh mục" ở góc phải để chọn.
              </div>
            )}
          </div>

          {/* Cột dropdown chọn Danh mục trực tiếp ở góc phải (chiều ngang chiếm 25% thanh w-1/4, viền phân cách thẳng hàng với hàng dưới) */}
          <div className={`relative w-1/4 min-w-[220px] shrink-0 flex items-stretch border-l border-border-subtle ${!hasBottomRow ? 'rounded-br-xl' : ''}`} ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen((prev) => !prev);
                setIsTypeDropdownOpen(false);
              }}
              className={`w-full px-4 text-xs sm:text-[13px] font-semibold text-secondary hover:text-primary hover:bg-surface-elevated/70 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap rounded-tr-xl ${!hasBottomRow ? 'rounded-br-xl' : ''}`}
              title="Mở danh sách tất cả Danh mục"
              aria-label="Danh sách tất cả Danh mục"
            >
              <i className="fa-solid fa-folder-tree text-xs text-primary shrink-0" />
              <span>Danh mục</span>
              <i className={`fa-solid fa-chevron-down text-[11px] transition-transform duration-200 shrink-0 ${isCategoryDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-96 bg-surface rounded-xl border border-border-subtle shadow-2xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                  <span>Danh mục tài liệu</span>
                  <span className="text-[10px] text-primary lowercase font-medium">Cấp 1</span>
                </div>

                <div className="px-2 pb-1.5 text-[11px] text-secondary flex items-center justify-between border-b border-border-subtle mb-1.5">
                  <span className="text-[10px] text-muted">Tick chọn để hiện ra thanh chính:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllCategoriesVisibility(visibleCategoryIds.length < categories.length);
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    {visibleCategoryIds.length === categories.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                {/* Nút 'Tất cả thư mục' */}
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
                    <span className="truncate">{t('resourceManagement.allFolders')}</span>
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

                <div className="my-1.5 border-t border-border-subtle" />

                {/* Danh sách danh mục kèm checkbox và số thứ tự tick */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                  {sortedCategories.map((cat) => {
                    const isSelected = selectedCategory === String(cat.id);
                    const tickIndex = visibleCategoryIds.indexOf(cat.id);
                    const isVisibleOnBar = tickIndex !== -1;
                    const count = documents.filter((d) => d.dm_tai_lieu === cat.id).length;

                    return (
                      <div
                        key={cat.id}
                        className={`w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/20 text-primary font-bold'
                            : 'text-main hover:bg-surface-elevated'
                        }`}
                      >
                        <label
                          className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none"
                          title={isVisibleOnBar ? `Đang hiển thị ở vị trí #${tickIndex + 1} trên thanh chính` : 'Tick chọn để hiển thị trên thanh chính'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isVisibleOnBar}
                            onChange={() => toggleCategoryVisibility(cat.id)}
                            className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                          />
                          {isVisibleOnBar && (
                            <span className="text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-1 py-0.2 rounded leading-none">
                              #{tickIndex + 1}
                            </span>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            handleCategorySelect(String(cat.id));
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer hover:text-primary transition-colors py-0.5"
                          title={cat.ghi_chu || cat.ten_tai_lieu}
                        >
                          <i
                            className={`fa-solid ${isSelected ? 'fa-folder-open text-primary' : 'fa-folder text-muted'} text-xs shrink-0`}
                          />
                          <span className="truncate">{cat.ten_tai_lieu}</span>
                        </button>
                        <span
                          className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-surface-elevated text-secondary border border-border-subtle'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="my-1.5 border-t border-border-subtle" />

                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(true);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-primary hover:bg-primary/5 flex items-center justify-between transition-colors cursor-pointer border border-primary/20 hover:border-primary/40 bg-primary/2"
                  title="Mở bảng cấu hình Quản lý Danh mục & Loại tài liệu"
                >
                  <span className="flex items-center gap-2 truncate">
                    <i className="fa-solid fa-folder-tree text-xs text-primary" />
                    <span className="truncate">Cài đặt &amp; Quản lý danh mục</span>
                  </span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-primary/70 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    })()}

        {/* Hàng Cấp 2 — Sub-chips & Dropdown Loại tài liệu */}
        {selectedCategory !== 'all' && availableTypesForFilter.length > 0 && (
          <div className="relative z-10 flex items-stretch h-11 bg-slate-50/70 dark:bg-slate-800/40 border-t border-border-subtle rounded-b-xl">
            {/* Cột 1 (Cố định bên trái): Nhãn Loại tài liệu tách biệt độc lập, không bị lăn/cuộn theo */}
            <div className="w-[130px] shrink-0 flex items-center justify-center gap-1.5 px-2 border-r border-border-subtle rounded-bl-xl select-none text-[11px] font-bold uppercase tracking-wider text-muted">
              <i className="fa-solid fa-tags text-xs text-primary shrink-0" />
              <span className="truncate">{t('resourceManagement.fieldType')}:</span>
            </div>

            {/* Vùng chip cuộn ngang ở giữa (chỉ cuộn các chip) */}
            <div
              ref={typeBarRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0 px-3 py-1 select-none cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehavior: 'contain' }}
            >

              {/* Chip "Tất cả" loại tài liệu */}
              <button
                type="button"
                onClick={() => { setSelectedType('all'); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-[13px] font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedType === 'all'
                    ? 'bg-primary text-white shadow-2xs font-bold'
                    : 'bg-surface text-secondary border border-border-subtle hover:border-primary/50 hover:text-primary hover:bg-surface'
                }`}
              >
                <span>{t('resourceManagement.all')}</span>
                <span className={`text-[11px] font-bold ${
                  selectedType === 'all' ? 'text-white/80' : 'text-muted'
                }`}>
                  ({documents.filter((d) => d.dm_tai_lieu === Number(selectedCategory)).length})
                </span>
              </button>

              {orderedVisibleTypes.map((t) => {
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-[13px] font-semibold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-primary text-white shadow-2xs font-bold'
                        : 'bg-surface text-secondary border border-border-subtle hover:border-primary/50 hover:text-primary hover:bg-surface'
                    }`}
                    title={t.ghi_chu || t.ten_loai}
                  >
                    {!t.is_public && (
                      <i className="fa-solid fa-lock text-[10px] opacity-70" />
                    )}
                    <span>{t.ten_loai}</span>
                    <span className={`text-[11px] font-bold ${
                      isActive ? 'text-white/80' : 'text-muted'
                    }`}>
                      ({docCount})
                    </span>
                  </button>
                );
              })}
              {orderedVisibleTypes.length === 0 && (
                <div className="flex items-center px-2 text-xs text-muted italic">
                  Chưa có loại tài liệu nào được tick hiển thị. Bấm "Loại tài liệu" ở góc phải để chọn.
                </div>
              )}
            </div>

            {/* Cột dropdown Loại tài liệu ở góc phải (chiều ngang chiếm 25% thanh w-1/4, viền phân cách thẳng hàng với hàng trên) */}
            <div className="relative w-1/4 min-w-[220px] shrink-0 flex items-stretch border-l border-border-subtle rounded-br-xl" ref={typeDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTypeDropdownOpen((prev) => !prev);
                  setIsCategoryDropdownOpen(false);
                }}
                className="w-full px-4 text-xs sm:text-[13px] font-semibold text-secondary hover:text-primary hover:bg-surface-elevated/70 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap rounded-br-xl"
                title="Mở danh sách tất cả Loại tài liệu"
                aria-haspopup="listbox"
                aria-expanded={isTypeDropdownOpen}
              >
                <i className="fa-solid fa-tags text-xs text-primary shrink-0" />
                <span>Loại tài liệu</span>
                <i className={`fa-solid fa-chevron-down text-[11px] transition-transform duration-200 shrink-0 ${isTypeDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {isTypeDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-96 bg-surface rounded-xl border border-border-subtle shadow-2xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>Loại tài liệu</span>
                    <span className="text-[10px] text-primary lowercase font-medium">Cấp 2</span>
                  </div>

                  {(() => {
                    const currentScopeTypeIds = availableTypesForFilter.map((t) => t.id);
                    const allCurrentSelected =
                      currentScopeTypeIds.length > 0 &&
                      currentScopeTypeIds.every((id) => visibleTypeIds.includes(id));

                    return (
                      <div className="px-2 pb-1.5 text-[11px] text-secondary flex items-center justify-between border-b border-border-subtle mb-1.5">
                        <span className="text-[10px] text-muted">Tick chọn để hiện ra thanh:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAllTypesVisibility(!allCurrentSelected);
                          }}
                          className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          {allCurrentSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      </div>
                    );
                  })()}

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

                  <div className="my-1.5 border-t border-border-subtle" />

                  {/* Danh sách loại tài liệu kèm checkbox và số thứ tự tick */}
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                    {availableTypesForFilter.map((t) => {
                      const isSelected = selectedType === String(t.id);
                      const currentScopeTypeIds = availableTypesForFilter.map((item) => item.id);
                      const activeInScope = visibleTypeIds.filter((id) => currentScopeTypeIds.includes(id));
                      const tickIndex = activeInScope.indexOf(t.id);
                      const isVisibleOnBar = tickIndex !== -1;
                      const docCount = documents.filter(
                        (d) =>
                          d.dm_tai_lieu === Number(selectedCategory) &&
                          Array.isArray(d.loai_tai_lieu) &&
                          d.loai_tai_lieu.includes(t.id)
                      ).length;

                      return (
                        <div
                          key={t.id}
                          className={`w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/20 text-primary font-bold'
                              : 'text-main hover:bg-surface-elevated'
                          }`}
                        >
                          <label
                            className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none"
                            title={isVisibleOnBar ? `Đang hiển thị ở vị trí #${tickIndex + 1} trên thanh` : 'Tick chọn để hiển thị trên thanh'}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isVisibleOnBar}
                              onChange={() => toggleTypeVisibility(t.id)}
                              className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                            />
                            {isVisibleOnBar && (
                              <span className="text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-1 py-0.2 rounded leading-none">
                                #{tickIndex + 1}
                              </span>
                            )}
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedType(String(t.id));
                              setCurrentPage(1);
                              setIsTypeDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer hover:text-primary transition-colors py-0.5"
                            title={t.ghi_chu || t.ten_loai}
                          >
                            {!t.is_public ? (
                              <i className="fa-solid fa-lock text-[10px] opacity-70 shrink-0" />
                            ) : (
                              <i className="fa-solid fa-tag text-xs opacity-70 shrink-0" />
                            )}
                            <span className="truncate">{t.ten_loai}</span>
                          </button>

                          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                            isSelected ? 'bg-primary text-white' : 'bg-surface-elevated text-secondary border border-border-subtle'
                          }`}>
                            {docCount}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="my-1.5 border-t border-border-subtle" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(true);
                      setIsTypeDropdownOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-primary hover:bg-primary/5 flex items-center justify-between transition-colors cursor-pointer border border-primary/20 hover:border-primary/40 bg-primary/2"
                    title="Mở bảng cấu hình Quản lý Danh mục & Loại tài liệu"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <i className="fa-solid fa-folder-tree text-xs text-primary" />
                      <span className="truncate">Cài đặt &amp; Quản lý danh mục</span>
                    </span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-primary/70 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Khi ở chế độ Tất cả: hiện gợi ý chọn thư mục để lọc sâu */}
        {selectedCategory === 'all' && categories.length > 0 && (
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
              placeholder={t('resourceManagement.searchPlaceholder')}
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
              <option value="all">{t('resourceManagement.allYears')}</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {currentLang === 'en' ? `Year ${yr}` : `Năm ${yr}`}
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
              <option value="all">{t('resourceManagement.allStatuses')}</option>
              <option value="CON_HIEU_LUC">🟢 {t('resourceManagement.statusActive')}</option>
              <option value="CON_HIEU_LUC_1_PHAN">🟡 {t('resourceManagement.statusPartial')}</option>
              <option value="HET_HIEU_LUC">🔴 {t('resourceManagement.statusExpired')}</option>
              <option value="HET_VA_THAY_THE">🟠 {t('resourceManagement.statusExpired')}</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-xs" />
          </div>
        </div>

        {/* Chip bộ lọc & Nút Xóa bộ lọc (Mục 3) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border-subtle text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-secondary">
              <span className="text-muted font-medium mr-0.5">{t('resourceManagement.filteringBadge')}</span>
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
              <span>{t('resourceManagement.clearFilter')}</span>
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
          title={t('resourceManagement.exportTooltip')}
          aria-label={t('resourceManagement.exportTooltip')}
          className="text-xs font-semibold"
        >
          {t('resourceManagement.exportExcel')}
        </Button>
      </div>

      {/* 4. BẢNG DỮ LIỆU TÀI LIỆU CHÍNH (MỤC 5) */}
      <ResourceTable
        items={paginatedDocuments}
        isLoading={isLoading}
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
        onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
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
        isLoading={isSubmittingDoc}
      />

      {/* MODAL QUẢN LÝ CẤU TRÚC DANH MỤC CẤP 1 & LOẠI BIỂU MẪU CẤP 2 (MỤC 8) */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setToast(null);
        }}
        categories={categories}
        types={types}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onSaveType={handleSaveType}
        onDeleteType={handleDeleteType}
      />

      {/* MODAL XÁC NHẬN XÓA TÀI LIỆU (MỤC 5) */}
      {isDeleteOpen && deleteItem && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
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
                  {t('resourceManagement.confirmDeleteTitle')}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {t('resourceManagement.confirmDeleteDesc', { code: deleteItem.ky_hieu || deleteItem.tieu_de })}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border-subtle text-xs space-y-1.5">
              <div className="text-muted font-medium">{t('resourceManagement.docToDelete')}</div>
              <div className="font-semibold text-main text-sm line-clamp-2">
                {deleteItem.tieu_de}
              </div>
              {deleteItem.ky_hieu && (
                <div className="font-mono text-muted">
                  {t('resourceManagement.colCode')}: <span className="text-main font-semibold">{deleteItem.ky_hieu}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-danger font-medium flex items-center gap-1.5">
              <i className="fa-solid fa-circle-exclamation text-xs" />
              <span>{t('resourceManagement.confirmDeleteNote')}</span>
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
                {t('resourceManagement.cancel')}
              </Button>
              <Button
                variant="danger"
                size="md"
                icon="fa-trash"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                {t('resourceManagement.delete')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* TOAST THÔNG BÁO HOÀN TẤT THAO TÁC NỔI TRÊN CÙNG Z-[999999] */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
