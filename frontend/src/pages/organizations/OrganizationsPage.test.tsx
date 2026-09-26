import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrganizationsPage from './OrganizationsPage';
import * as apiClientModule from '@lib/apiClient';

vi.mock('@lib/apiClient', async () => {
  const actual = await vi.importActual<typeof apiClientModule>('@lib/apiClient');
  const mockClient = vi.fn() as unknown as typeof apiClientModule.apiClient;
  mockClient.get = vi.fn();
  mockClient.post = vi.fn();
  mockClient.put = vi.fn();
  mockClient.delete = vi.fn();
  mockClient.blob = vi.fn() as unknown as typeof apiClientModule.downloadBlob;

  return {
    ...actual,
    apiClient: mockClient,
    downloadBlob: vi.fn(),
  };
});

const mockedApiClient = vi.mocked(apiClientModule.apiClient);

describe('OrganizationsPage Component (Issue #19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tabs and title correctly', async () => {
    mockedApiClient.mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/regions/')) {
        return [{ id: 1, ten: 'Khối Cơ quan', don_vi_count: 2 }];
      }
      if (endpoint.includes('/units/')) {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              khoi: 1,
              khoi_ten: 'Khối Cơ quan',
              stt_uu_tien: 1,
              ten: 'Phòng Kế toán',
              dien_thoai: '02838123456',
              email: 'ketoan@itc.edu.vn',
              dia_chi: 'Tầng 2',
              is_public: true,
              ghi_chu: '',
            },
          ],
        };
      }
      return [];
    });

    render(
      <MemoryRouter>
        <OrganizationsPage />
      </MemoryRouter>
    );

    // Kiểm tra tên phòng ban hiển thị
    await waitFor(() => {
      expect(screen.getByText('Phòng Kế toán')).toBeInTheDocument();
    });

    // Chuyển sang Tab Khối
    const regionTab = screen.getByRole('button', { name: /Khối \/ Khu vực/i });
    fireEvent.click(regionTab);

    await waitFor(() => {
      expect(screen.getByText('Khối Cơ quan')).toBeInTheDocument();
    });
  });

  it('renders warning badge for internal non-public units', async () => {
    mockedApiClient.mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/regions/')) {
        return [];
      }
      if (endpoint.includes('/units/')) {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 2,
              khoi: 1,
              khoi_ten: 'Khối Cơ quan',
              stt_uu_tien: 2,
              ten: 'Ban Kiểm Soát Nội Bộ',
              dien_thoai: '0987654321',
              email: 'bks@itc.edu.vn',
              dia_chi: 'Tầng 3',
              is_public: false,
              ghi_chu: 'Nội bộ',
            },
          ],
        };
      }
      return [];
    });

    render(
      <MemoryRouter>
        <OrganizationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ban Kiểm Soát Nội Bộ')).toBeInTheDocument();
      expect(screen.getByText('Nội bộ')).toBeInTheDocument();
    });
  });
});
