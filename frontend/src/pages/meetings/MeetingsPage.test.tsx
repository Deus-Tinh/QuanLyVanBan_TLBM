import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MeetingsPage from './MeetingsPage';
import { apiClient } from '@lib/apiClient';

vi.mock('@lib/apiClient', () => {
  const getMock = vi.fn();
  const postMock = vi.fn();
  const putMock = vi.fn();
  const deleteMock = vi.fn();

  const mockApi = vi.fn().mockImplementation((url: string) => getMock(url)) as unknown as {
    (endpoint: string, options?: RequestInit): Promise<unknown>;
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  mockApi.get = getMock;
  mockApi.post = postMock;
  mockApi.put = putMock;
  mockApi.delete = deleteMock;

  return {
    apiClient: mockApi,
    default: mockApi,
    ApiError: class ApiError extends Error {
      status: number;
      data: Record<string, unknown>;
      constructor(status: number, data: Record<string, unknown>) {
        super((data.error as string) || (data.detail as string) || 'API Error');
        this.status = status;
        this.data = data;
      }
    },
  };
});

describe('MeetingsPage Component (Issue #22)', () => {
  const mockRooms = [
    {
      id: 1,
      ten_phong: 'Phòng Hội thảo A',
      vi_tri: 'Tầng 2, Tòa A',
      suc_chua: 30,
      thiet_bi: 'Máy chiếu 4K, 2 Micro không dây',
      is_public: true,
      ghi_chu: 'Dành cho hội thảo lớn',
      created_at: '2026-09-20T08:00:00Z',
      updated_at: '2026-09-20T08:00:00Z',
    },
    {
      id: 2,
      ten_phong: 'Phòng Họp B',
      vi_tri: 'Tầng 3, Tòa B',
      suc_chua: 10,
      thiet_bi: 'Bảng trắng',
      is_public: false,
      ghi_chu: 'Đang bảo trì',
      created_at: '2026-09-20T08:00:00Z',
      updated_at: '2026-09-20T08:00:00Z',
    },
  ];

  const getMockFn = () => apiClient.get as unknown as ReturnType<typeof vi.fn>;
  const postMockFn = () => apiClient.post as unknown as ReturnType<typeof vi.fn>;
  const deleteMockFn = () => apiClient.delete as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    getMockFn().mockImplementation((url: string) => {
      if (url.includes('/api/meeting-rooms/')) {
        return Promise.resolve(mockRooms);
      }
      return Promise.resolve([]);
    });

    postMockFn().mockResolvedValue({ id: 3, ten_phong: 'Phòng Mới' });
    deleteMockFn().mockResolvedValue({});
  });

  it('renders page header and add room button', async () => {
    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Quản lý Phòng họp')).toBeInTheDocument();
    expect(screen.getByText('Thêm phòng họp')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Phòng Hội thảo A')).toBeInTheDocument();
      expect(screen.getByText('Phòng Họp B')).toBeInTheDocument();
    });
  });

  it('filters room list by search keyword', async () => {
    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Phòng Hội thảo A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên phòng/i);
    fireEvent.change(searchInput, { target: { value: 'Hội thảo' } });

    expect(screen.getByText('Phòng Hội thảo A')).toBeInTheDocument();
    expect(screen.queryByText('Phòng Họp B')).not.toBeInTheDocument();
  });

  it('filters room list by status', async () => {
    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Phòng Hội thảo A')).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue('Tất cả trạng thái');
    fireEvent.change(select, { target: { value: 'hidden' } });

    expect(screen.queryByText('Phòng Hội thảo A')).not.toBeInTheDocument();
    expect(screen.getByText('Phòng Họp B')).toBeInTheDocument();
  });

  it('opens add room modal when clicking Thêm phòng họp button', async () => {
    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    const addButton = screen.getByText('Thêm phòng họp');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Thêm phòng họp mới')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Phòng Hội thảo A, Phòng Họp Ban Giám Đốc/i)).toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal when clicking Xóa', async () => {
    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Phòng Hội thảo A')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Xác nhận xóa phòng họp?')).toBeInTheDocument();
      expect(screen.getByText('Xác nhận xóa')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Xác nhận xóa'));

    await waitFor(() => {
      expect(deleteMockFn()).toHaveBeenCalledWith('/api/meeting-rooms/1/');
    });
  });
});
