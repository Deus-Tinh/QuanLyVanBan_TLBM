import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingModal } from './BookingModal';
import { apiClient, ApiError } from '@lib/apiClient';
import { MeetingRoom } from '@app-types/meeting';

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

  class MockApiError extends Error {
    status: number;
    data: Record<string, unknown>;
    constructor(status: number, data: Record<string, unknown>) {
      super((data.error as string) || (data.detail as string) || 'API Error');
      this.status = status;
      this.data = data;
    }
  }

  return {
    apiClient: mockApi,
    default: mockApi,
    ApiError: MockApiError,
  };
});

describe('BookingModal Component (Issue #22 - Phase 3)', () => {
  const mockRooms: MeetingRoom[] = [
    {
      id: 1,
      ten_phong: 'Phòng Hội thảo A',
      vi_tri: 'Tầng 2, Tòa A',
      suc_chua: 20,
      thiet_bi: 'Máy chiếu, Mic',
      is_public: true,
      ghi_chu: '',
      created_at: '2026-09-20T08:00:00Z',
      updated_at: '2026-09-20T08:00:00Z',
    },
    {
      id: 2,
      ten_phong: 'Phòng VIP',
      vi_tri: 'Tầng 5',
      suc_chua: 8,
      thiet_bi: 'Tivi 85 inch',
      is_public: true,
      ghi_chu: '',
      created_at: '2026-09-20T08:00:00Z',
      updated_at: '2026-09-20T08:00:00Z',
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    rooms: mockRooms,
    initialDate: '2026-10-01',
    currentUser: {
      id: 1,
      username: 'hieunpm',
      full_name: 'Nguyễn Phan Minh Hiếu',
      department: 'Phòng CNTT',
      role: 'staff',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không render khi isOpen là false', () => {
    const { container } = render(<BookingModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('render đầy đủ các trường nhập liệu khi isOpen là true', () => {
    render(<BookingModal {...defaultProps} />);

    expect(screen.getByText('Đặt phòng họp mới')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^phòng họp/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^tiêu đề cuộc họp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^đơn vị tổ chức/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^số người tham gia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^ngày họp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^giờ bắt đầu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^giờ kết thúc/i)).toBeInTheDocument();
  });

  it('hiển thị cảnh báo lỗi khi giờ kết thúc trước hoặc bằng giờ bắt đầu', async () => {
    render(<BookingModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/^tiêu đề cuộc họp/i);
    fireEvent.change(titleInput, { target: { value: 'Họp kiểm thử' } });

    const startTimeInput = screen.getByLabelText(/^giờ bắt đầu/i);
    const endTimeInput = screen.getByLabelText(/^giờ kết thúc/i);

    fireEvent.change(startTimeInput, { target: { value: '14:00' } });
    fireEvent.change(endTimeInput, { target: { value: '13:00' } });

    const submitBtn = screen.getByRole('button', { name: /xác nhận đặt phòng/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Giờ kết thúc phải diễn ra sau giờ bắt đầu.').length).toBeGreaterThan(0);
    });
  });

  it('hiển thị cảnh báo khi số người tham gia vượt quá sức chứa phòng', async () => {
    render(<BookingModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/^tiêu đề cuộc họp/i);
    fireEvent.change(titleInput, { target: { value: 'Họp toàn viện' } });

    // Chọn phòng VIP (sức chứa 8 người)
    const roomSelect = screen.getByRole('combobox', { name: /^phòng họp/i });
    fireEvent.change(roomSelect, { target: { value: '2' } });

    // Nhập 15 người
    const attendeesInput = screen.getByLabelText(/^số người tham gia/i);
    fireEvent.change(attendeesInput, { target: { value: '15' } });

    const submitBtn = screen.getByRole('button', { name: /xác nhận đặt phòng/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Vượt quá sức chứa phòng "Phòng VIP" \(tối đa 8 người\)/i).length
      ).toBeGreaterThan(0);
    });
  });

  it('gửi payload thành công khi dữ liệu hợp lệ và gọi onSuccess & onClose', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 101 });

    render(<BookingModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText(/họp giao ban tuần/i);
    fireEvent.change(titleInput, { target: { value: 'Họp đồ án tốt nghiệp' } });

    const submitBtn = screen.getByRole('button', { name: /xác nhận đặt phòng/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/meeting-bookings/',
        expect.objectContaining({
          phong_hop: 1,
          tieu_de: 'Họp đồ án tốt nghiệp',
          thoi_gian_bat_dau: '2026-10-01T09:00:00',
          thoi_gian_ket_thuc: '2026-10-01T10:00:00',
          so_nguoi_tham_gia: 5,
        })
      );
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('hiển thị thông báo khi máy chủ trả về lỗi trùng lịch (conflict 400)', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ApiError(400, {
        non_field_errors: [
          "Phòng họp 'Phòng Hội thảo A' đã có lịch đặt: 'Họp giao ban' bởi Nguyễn Văn A. Vui lòng chọn khung giờ khác!",
        ],
      })
    );

    render(<BookingModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText(/họp giao ban tuần/i);
    fireEvent.change(titleInput, { target: { value: 'Họp trùng lịch' } });

    const submitBtn = screen.getByRole('button', { name: /xác nhận đặt phòng/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Phòng họp 'Phòng Hội thảo A' đã có lịch đặt/i)
      ).toBeInTheDocument();
    });
  });

  it('option của phòng MAINTENANCE bị disabled, còn phòng nội bộ AVAILABLE chọn được bình thường', () => {
    const testRooms: MeetingRoom[] = [
      {
        id: 1,
        ten_phong: 'Phòng Hội thảo A',
        vi_tri: 'Tầng 2',
        suc_chua: 20,
        thiet_bi: 'Máy chiếu',
        is_public: true,
        status: 'AVAILABLE',
        ghi_chu: '',
        created_at: '2026-09-20T08:00:00Z',
        updated_at: '2026-09-20T08:00:00Z',
      },
      {
        id: 2,
        ten_phong: 'Phòng Bảo Trì B',
        vi_tri: 'Tầng 3',
        suc_chua: 10,
        thiet_bi: 'Bảng trắng',
        is_public: true,
        status: 'MAINTENANCE',
        ghi_chu: 'Đang sửa chữa',
        created_at: '2026-09-20T08:00:00Z',
        updated_at: '2026-09-20T08:00:00Z',
      },
      {
        id: 3,
        ten_phong: 'Phòng Ban Giám Đốc',
        vi_tri: 'Tầng 5',
        suc_chua: 8,
        thiet_bi: 'Màn hình LED',
        is_public: false,
        status: 'AVAILABLE',
        ghi_chu: 'Nội bộ',
        created_at: '2026-09-20T08:00:00Z',
        updated_at: '2026-09-20T08:00:00Z',
      },
    ];

    render(<BookingModal {...defaultProps} rooms={testRooms} />);

    const select = screen.getByRole('combobox', { name: /^phòng họp/i }) as HTMLSelectElement;
    const options = Array.from(select.options);

    // Option của phòng MAINTENANCE bị disabled và có nhãn [Bảo trì]
    const maintenanceOption = options.find((o) => o.value === '2');
    expect(maintenanceOption).toBeDefined();
    expect(maintenanceOption?.disabled).toBe(true);
    expect(maintenanceOption?.textContent).toContain('[Bảo trì]');

    // Option của phòng nội bộ AVAILABLE chọn được bình thường (không bị disabled) và có nhãn [Nội bộ]
    const internalOption = options.find((o) => o.value === '3');
    expect(internalOption).toBeDefined();
    expect(internalOption?.disabled).toBe(false);
    expect(internalOption?.textContent).toContain('[Nội bộ]');
  });
});
