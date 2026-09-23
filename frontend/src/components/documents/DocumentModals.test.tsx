import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DocumentDetailModal from './DocumentDetailModal';
import DocumentViewersModal from './DocumentViewersModal';
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
