import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmployeesPage from './EmployeesPage';
import * as apiClientModule from '@lib/apiClient';

vi.mock('@lib/apiClient', async () => {
  const actual = await vi.importActual<typeof apiClientModule>('@lib/apiClient');
  const mockClient = vi.fn() as unknown as typeof apiClientModule.apiClient;
  mockClient.get = vi.fn();
  mockClient.post = vi.fn();
  mockClient.patch = vi.fn();
  mockClient.put = vi.fn();
  mockClient.delete = vi.fn();

  return {
    ...actual,
    apiClient: mockClient,
    downloadBlob: vi.fn(),
  };
});

const mockedApiClient = vi.mocked(apiClientModule.apiClient);

const mockEmployeeData = [
  {
    id: 1,
    user_id: 10,
    username: 'binhnv',
    email: 'binhnv@donvi.gov.vn',
    ho_ten: 'Nguyễn Văn Bình',
    full_name: 'Nguyễn Văn Bình',
    ngay_sinh: '20/05/----',
    birthday: '1995-05-20',
    is_birthday_masked: true,
    don_vi_id: 1,
    don_vi_ten: 'Văn phòng Viện',
    khoi_ten: 'Khối Cơ quan',
    chuc_vu_id: 1,
    chuc_vu_ten: 'Chuyên viên',
    chuc_danh: 'Chuyên viên tổng hợp',
    sdt: '0912345678',
    phone: '0912345678',
    avatar_url: '',
    trang_thai: 'dang_lam_viec' as const,
    trang_thai_display: 'Đang làm việc',
    is_active: true,
    is_public: true,
    ghi_chu: 'Ghi chú nhân viên',
    nhom_quyen: [],
    has_sensitive_permission: false,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 2,
    user_id: 11,
    username: 'hungtv',
    email: 'hungtv@donvi.gov.vn',
    ho_ten: 'Trần Văn Hùng',
    full_name: 'Trần Văn Hùng',
    ngay_sinh: '1988-10-15',
    birthday: '1988-10-15',
    is_birthday_masked: false,
    don_vi_id: 2,
    don_vi_ten: 'Phòng Kế toán',
    khoi_ten: 'Khối Cơ quan',
    chuc_vu_id: 2,
    chuc_vu_ten: 'Trưởng phòng',
    chuc_danh: 'Trưởng phòng Kế toán',
    sdt: '0987654321',
    phone: '0987654321',
    avatar_url: '',
    trang_thai: 'nghi_viec' as const,
    trang_thai_display: 'Nghỉ việc',
    is_active: false,
    is_public: true,
    ghi_chu: '',
    nhom_quyen: [{ id: 1, name: 'Lãnh đạo đơn vị' }],
    has_sensitive_permission: true,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
];

describe('EmployeesPage Component (Issue #24)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApiClient.mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/organizations/units/')) {
        return [
          { id: 1, ten: 'Văn phòng Viện', khoi: 1, khoi_ten: 'Khối Cơ quan', stt_uu_tien: 1, dia_chi: '', dien_thoai: '', email: '', is_public: true, ghi_chu: '' },
          { id: 2, ten: 'Phòng Kế toán', khoi: 1, khoi_ten: 'Khối Cơ quan', stt_uu_tien: 2, dia_chi: '', dien_thoai: '', email: '', is_public: true, ghi_chu: '' },
        ];
      }
      if (endpoint.includes('/api/positions/')) {
        return [
          { id: 1, ten_chuc_vu: 'Chuyên viên', stt_uu_tien: 1, is_public: true, ghi_chu: '' },
          { id: 2, ten_chuc_vu: 'Trưởng phòng', stt_uu_tien: 2, is_public: true, ghi_chu: '' },
        ];
      }
      if (endpoint.includes('/accounts/groups/')) {
        return [
          { id: 1, name: 'Lãnh đạo đơn vị' },
          { id: 2, name: 'Văn thư' },
        ];
      }
      if (endpoint.includes('/accounts/employees/')) {
        return {
          count: 2,
          next: null,
          previous: null,
          results: mockEmployeeData,
        };
      }
      return [];
    });
  });

  it('renders employee management title, action buttons, and table rows', async () => {
    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Bình')).toBeInTheDocument();
      expect(screen.getByText('Trần Văn Hùng')).toBeInTheDocument();
    });

    expect(screen.getByText('Văn phòng Viện')).toBeInTheDocument();
    expect(screen.getByText('Phòng Kế toán')).toBeInTheDocument();
  });

  it('renders masked birthday indicator for privacy-protected employee', async () => {
    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('20/05/----')).toBeInTheDocument();
      expect(screen.getByText('1988-10-15')).toBeInTheDocument();
    });
  });

  it('opens employee modal on clicking Add Employee button', async () => {
    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Bình')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Thêm nhân viên/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Thêm Mới Cán Bộ Nhân Viên')).toBeInTheDocument();
    });
  });

  it('opens import modal on clicking Import Excel button', async () => {
    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Bình')).toBeInTheDocument();
    });

    const importBtn = screen.getByRole('button', { name: /Nhập từ Excel/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByText('Nhập Danh Sách CBNV Từ Excel')).toBeInTheDocument();
    });
  });

  it('opens detail modal on clicking employee name', async () => {
    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Bình')).toBeInTheDocument();
    });

    const viewBtns = screen.getAllByTitle('Xem chi tiết');
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Thông Tin Chi Tiết Cán Bộ Nhân Viên')).toBeInTheDocument();
    });
  });
});
