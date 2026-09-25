import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import DocumentDetailModal from './DocumentDetailModal';
import DocumentViewersModal from './DocumentViewersModal';
import DocumentFormModal from './DocumentFormModal';
import apiClient from '@lib/apiClient';

vi.mock('@lib/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('DocumentDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không render gì khi isOpen = false', () => {
    const { container } = render(
      <DocumentDetailModal isOpen={false} onClose={vi.fn()} documentId={1} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('render và nạp dữ liệu chi tiết văn bản thành công', async () => {
    const mockDetail = {
      id: 1,
      loai: 'DEN',
      loai_display: 'Văn bản Đến',
      nam: 2026,
      so_hieu: '15/CV-BGDDT',
      so_thu_tu: 1,
      ngay_den: '2026-09-23T08:00:00Z',
      trich_yeu: 'Hướng dẫn tổ chức thi tuyển sinh',
      noi_ban_hanh: 'Bộ Giáo Dục',
      hieu_luc: 'CON_HIEU_LUC',
      hieu_luc_display: 'Còn hiệu lực',
      hien_thi: true,
      gui_mail_toan_he_thong: false,
      attachments: [
        {
          id: 101,
          file: '/media/test.pdf',
          file_name: 'huongdan.pdf',
          file_size: 204800,
          uploaded_at: '2026-09-23T08:00:00Z',
        },
      ],
      created_at: '2026-09-23T08:00:00Z',
      updated_at: '2026-09-23T08:00:00Z',
    };

    (apiClient.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockDetail);

    render(<DocumentDetailModal isOpen={true} onClose={vi.fn()} documentId={1} />);

    expect(screen.getByText('Chi Tiết Văn Bản Đến')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('15/CV-BGDDT')).toBeInTheDocument();
      expect(screen.getByText('Hướng dẫn tổ chức thi tuyển sinh')).toBeInTheDocument();
      expect(screen.getByText('huongdan.pdf')).toBeInTheDocument();
    });
  });
});

describe('DocumentViewersModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không render gì khi isOpen = false', () => {
    const { container } = render(
      <DocumentViewersModal isOpen={false} onClose={vi.fn()} documentId={1} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('render danh sách người đã xem từ API thành công', async () => {
    const mockViewersResponse = {
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          user_id: 10,
          username: 'canbo1',
          full_name: 'Nguyễn Văn A',
          chuc_danh: 'Chuyên viên',
          don_vi: 'Phòng Đào Tạo',
          viewed_at: '2026-09-23T10:30:00Z',
        },
        {
          id: 2,
          user_id: 11,
          username: 'canbo2',
          full_name: 'Trần Thị B',
          chuc_danh: 'Trưởng phòng',
          don_vi: 'Phòng Khảo Thí',
          viewed_at: '2026-09-23T11:00:00Z',
        },
      ],
    };

    (apiClient.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockViewersResponse);

    render(<DocumentViewersModal isOpen={true} onClose={vi.fn()} documentId={1} />);

    expect(screen.getByText('Lịch Sử Người Đã Xem Văn Bản')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2 lượt xem')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });
  });
});

describe('DocumentFormModal', () => {
  it('không render gì khi open = false', () => {
    const { container } = render(
      <DocumentFormModal open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('render đầy đủ 4 phần và các trường bắt buộc khi open = true', async () => {
    render(<DocumentFormModal open={true} onClose={vi.fn()} />);

    // Header
    expect(screen.getByText('Thêm Mới Văn Bản Đến')).toBeInTheDocument();

    // 4 Enterprise Sections
    expect(screen.getByText(/1\. Tiếp nhận & Vào sổ công văn/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Nguồn ban hành & Nội dung văn bản/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Ký duyệt văn bản/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Phân phối xử lý & Tệp đính kèm/i)).toBeInTheDocument();

    // Core form labels
    expect(screen.getByText(/Số, ký hiệu/i)).toBeInTheDocument();
    expect(screen.getByText(/Cơ quan \/ Đơn vị ban hành/i)).toBeInTheDocument();
    expect(screen.getByText(/Trích yếu nội dung văn bản/i)).toBeInTheDocument();

    // Ở chế độ Thêm mới, không hiển thị ô Trạng thái hiệu lực (tự động mặc định là Còn hiệu lực)
    expect(screen.queryByText(/Trạng thái hiệu lực/i)).not.toBeInTheDocument();

    // Toggles
    expect(screen.getByText('Hiển thị trên hệ thống')).toBeInTheDocument();
    expect(screen.getByText('Gửi email toàn trường')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('-- Chọn đơn vị nhận --')).toBeInTheDocument();
    });
  });

  it('hiển thị trường Trạng thái hiệu lực khi SỬA và hiện link thay thế khi chọn HET_VA_THAY_THE', async () => {
    const mockEditDoc = {
      id: 1,
      so_hieu: '15/CV-BGDDT',
      hieu_luc: 'CON_HIEU_LUC',
      noi_ban_hanh: 'Bộ GD&ĐT',
      trich_yeu: 'Văn bản hướng dẫn',
    };

    render(<DocumentFormModal open={true} initial={mockEditDoc} onClose={vi.fn()} />);

    // Header sửa
    expect(screen.getByText('Cập Nhật Văn Bản Đến')).toBeInTheDocument();
    expect(screen.getByText('3. Ký duyệt & Hiệu lực văn bản')).toBeInTheDocument();
    expect(screen.getByText('Trạng thái hiệu lực')).toBeInTheDocument();

    // Ban đầu không có ô nhập văn bản thay thế
    expect(screen.queryByPlaceholderText(/Nhập số hiệu văn bản mới thay thế/i)).not.toBeInTheDocument();

    // Đổi trạng thái sang "Đã thay thế"
    const hieuLucSelect = screen.getByDisplayValue('Còn hiệu lực');
    fireEvent.change(hieuLucSelect, { target: { value: 'HET_VA_THAY_THE' } });

    // Lúc này trường văn bản thay thế xuất hiện
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Nhập số hiệu văn bản mới thay thế/i)).toBeInTheDocument();
    });
  });
});

