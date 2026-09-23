import React, { useState, useEffect, useCallback } from 'react';
import { DocumentItem, DocumentFilterParams, PaginatedResponse } from '@app-types/document';
import FilterBar from '@components/documents/FilterBar';
import DocumentTable from '@components/documents/DocumentTable';
import DocumentDetailModal from '@components/documents/DocumentDetailModal';
import DocumentViewersModal from '@components/documents/DocumentViewersModal';
import { Button } from '@components/common/Button';
import apiClient from '@lib/apiClient';

export const InboundDocumentPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc hiện tại
  const [filters, setFilters] = useState<DocumentFilterParams>({
    q: '',
    nam: '',
    tu_ngay: '',
    den_ngay: '',
    hieu_luc: '',
    page: 1,
    page_size: 10,
    loai: 'DEN',
  });

  // Quản lý modal xem chi tiết & modal danh sách người đọc
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isViewersOpen, setIsViewersOpen] = useState<boolean>(false);

  // Gọi API lấy danh sách văn bản đến
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('loai', 'DEN');
      if (filters.page) params.append('page', String(filters.page));
      if (filters.page_size) params.append('page_size', String(filters.page_size));
      if (filters.q) params.append('q', filters.q.trim());
      if (filters.nam) params.append('nam', String(filters.nam));
      if (filters.tu_ngay) params.append('tu_ngay', filters.tu_ngay);
      if (filters.den_ngay) params.append('den_ngay', filters.den_ngay);
      if (filters.hieu_luc) params.append('hieu_luc', filters.hieu_luc);

      const endpoint = `/api/documents/?${params.toString()}`;
      const response = await apiClient.get<PaginatedResponse<DocumentItem>>(endpoint);

      if (response && Array.isArray(response.results)) {
        setDocuments(response.results);
        setTotalCount(response.count || 0);
      } else if (Array.isArray(response)) {
        // Fallback trường hợp API trả về mảng trực tiếp
        setDocuments(response as unknown as DocumentItem[]);
        setTotalCount((response as unknown as DocumentItem[]).length);
      } else {
        setDocuments([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Không thể tải danh sách văn bản đến.';
      setError(errMsg);
      setDocuments([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Nạp dữ liệu khi bộ lọc thay đổi
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Xử lý đổi trang
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Xử lý đổi số dòng / trang
  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({ ...prev, page_size: newPageSize, page: 1 }));
  };

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setFilters({
      q: '',
      nam: '',
      tu_ngay: '',
      den_ngay: '',
      hieu_luc: '',
      page: 1,
      page_size: 10,
      loai: 'DEN',
    });
  };

  // Mở modal xem chi tiết
  const handleViewDetail = (id: number) => {
    setSelectedDocId(id);
    setIsDetailOpen(true);
  };

  // Mở modal xem danh sách người đã đọc
  const handleViewHistory = (id: number) => {
    setSelectedDocId(id);
    setIsViewersOpen(true);
  };

  // Xử lý xóa văn bản (có xác nhận an toàn)
  const handleDelete = async (id: number, soHieu: string) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn xóa văn bản đến "${soHieu}" không? Hành động này không thể hoàn tác.`);
    if (!isConfirm) return;

    try {
      await apiClient.delete(`/api/documents/${id}/`);
      alert(`Đã xóa văn bản "${soHieu}" thành công.`);
      fetchDocuments();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Xóa văn bản thất bại.';
      alert(`Lỗi: ${errMsg}`);
    }
  };

  // Thống kê nhanh số lượng
  const countActive = documents.filter((d) => d.hieu_luc === 'CON_HIEU_LUC').length;
  const countExpired = documents.filter((d) => d.hieu_luc !== 'CON_HIEU_LUC').length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* 1. Header Trang & Thống Kê Nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-8 h-8 rounded-lg bg-primary-subtle text-primary flex items-center justify-center font-bold text-sm">
              <i className="fa-solid fa-inbox text-base" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-main m-0">Quản Lý Văn Bản Đến</h1>
          </div>
          <p className="text-xs md:text-sm text-secondary m-0">
            Theo dõi, tra cứu, quản lý và ghi nhận lịch sử xử lý công văn, văn bản đến từ cơ quan bên ngoài.
          </p>
        </div>

        {/* Các nút hành động chính */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="fa-rotate"
            onClick={fetchDocuments}
            isLoading={isLoading}
            title="Làm mới danh sách"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* 2. Thẻ Thống Kê Nhanh (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-surface border border-border-subtle rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-muted block mb-0.5">Tổng số văn bản đến</span>
            <span className="text-xl font-bold text-main">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center text-lg">
            <i className="fa-solid fa-file-lines" />
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-muted block mb-0.5">Đang còn hiệu lực</span>
            <span className="text-xl font-bold text-success">{countActive}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success-subtle text-success flex items-center justify-center text-lg">
            <i className="fa-solid fa-circle-check" />
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-muted block mb-0.5">Hết hiệu lực / Thay thế</span>
            <span className="text-xl font-bold text-warning-text">{countExpired}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning-subtle text-warning-text flex items-center justify-center text-lg">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
        </div>
      </div>

      {/* 3. Thanh Tìm Kiếm & Bộ Lọc (Giai đoạn 3) */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onSearch={fetchDocuments}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="bg-danger-subtle text-danger border border-danger-border rounded-xl p-3.5 text-xs mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-base" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDocuments}
            className="underline font-semibold hover:text-danger-hover"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 4. Bảng Danh Sách Văn Bản (Giai đoạn 4) */}
      <DocumentTable
        documents={documents}
        totalCount={totalCount}
        page={Number(filters.page) || 1}
        pageSize={Number(filters.page_size) || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        onViewDetail={handleViewDetail}
        onViewHistory={handleViewHistory}
        onDelete={handleDelete}
      />

      {/* 5. Modals (sẵn sàng cho Giai đoạn 5) */}
      <DocumentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        documentId={selectedDocId}
      />

      <DocumentViewersModal
        isOpen={isViewersOpen}
        onClose={() => setIsViewersOpen(false)}
        documentId={selectedDocId}
      />
    </div>
  );
};

export default InboundDocumentPage;
