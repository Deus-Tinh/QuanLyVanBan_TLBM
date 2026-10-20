import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { setLanguage } from '@i18n/translate';
import ModernDashboardView, { DocumentItem, TaskItem } from './ModernDashboardView';

describe('ModernDashboardView Component (Zero Mock Data)', () => {
  it('renders clean empty states by default with zero mock data', () => {
    render(
      <MemoryRouter>
        <ModernDashboardView />
      </MemoryRouter>
    );

    // 3 KPI cards show 0 by default
    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.getByText('Chưa có phát sinh trong ngày')).toBeInTheDocument();
    expect(screen.getByText('Chưa có phát hành hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Không có nhiệm vụ cần xử lý')).toBeInTheDocument();

    // Tables show empty states
    expect(screen.getByText('Chưa có dữ liệu văn bản đến')).toBeInTheDocument();
    expect(screen.getByText('Chưa có dữ liệu văn bản đi')).toBeInTheDocument();
    expect(screen.getByText('Chưa có nhiệm vụ nào cần xử lý')).toBeInTheDocument();
    expect(screen.getByText('Chưa có dữ liệu tài liệu & biểu mẫu')).toBeInTheDocument();

    // No mock text
    expect(screen.queryByText(/Mock Filter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Xin chào, Châu Tuấn Kiệt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nguyễn Văn Hiếu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Phòng Họp A201/i)).not.toBeInTheDocument();
    expect(screen.queryByText('128/QĐ-BGDĐT')).not.toBeInTheDocument();
    expect(screen.queryByText('210/TB-BL')).not.toBeInTheDocument();
  });

  it('renders simplified quick search input bar', () => {
    render(
      <MemoryRouter>
        <ModernDashboardView />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Nhập số ký hiệu/i)).toBeInTheDocument();
  });

  it('renders custom values and documents when provided', () => {
    const mockIncoming: DocumentItem[] = [
      { code: '99/CV-ITC', title: 'Công văn thử nghiệm', date: '17/09/2026' },
    ];
    const mockTasks: TaskItem[] = [
      { id: '1', title: 'Nhiệm vụ kiểm thử', due: '18/09/2026', status: 'processing', statusLabel: 'Đang làm', variant: 'warning' },
    ];

    render(
      <MemoryRouter>
        <ModernDashboardView
          incomingCount={10}
          outgoingCount={5}
          tasksCount={1}
          incomingDocuments={mockIncoming}
          tasks={mockTasks}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('99/CV-ITC')).toBeInTheDocument();
    expect(screen.getByText('Công văn thử nghiệm')).toBeInTheDocument();
    expect(screen.getByText('Nhiệm vụ kiểm thử')).toBeInTheDocument();
  });

  it('filters incoming documents when search term is entered', () => {
    const mockIncoming: DocumentItem[] = [
      { code: '10/CV-ITC', title: 'Công văn A', date: '17/09/2026' },
      { code: '20/CV-ITC', title: 'Báo cáo B', date: '17/09/2026' },
    ];

    render(
      <MemoryRouter>
        <ModernDashboardView incomingDocuments={mockIncoming} />
      </MemoryRouter>
    );

    expect(screen.getByText('10/CV-ITC')).toBeInTheDocument();
    expect(screen.getByText('20/CV-ITC')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Nhập số ký hiệu/i);
    fireEvent.change(searchInput, { target: { value: 'Báo cáo' } });

    expect(screen.getByText('20/CV-ITC')).toBeInTheDocument();
    expect(screen.queryByText('10/CV-ITC')).not.toBeInTheDocument();
  });

  it('triggers navigation when clicking action buttons', () => {
    const mockNavigate = vi.fn();

    render(
      <MemoryRouter>
        <ModernDashboardView onNavigate={mockNavigate} />
      </MemoryRouter>
    );

    const bookBtn = screen.getByRole('button', { name: /Đặt phòng họp/i });
    fireEvent.click(bookBtn);

    expect(mockNavigate).toHaveBeenCalledWith('meetings');
  });

  it('opens TaskDetailModal when clicking on a task item', () => {
    const mockTasks: TaskItem[] = [
      { id: '1', title: 'Hoàn thiện báo cáo quý III', due: '15/10/2026', status: 'processing', statusLabel: 'Đang xử lý', variant: 'info' },
    ];

    render(
      <MemoryRouter>
        <ModernDashboardView tasks={mockTasks} />
      </MemoryRouter>
    );

    const taskRow = screen.getByText('Hoàn thiện báo cáo quý III');
    fireEvent.click(taskRow);
    expect(screen.getByText('Chi Tiết Nhiệm Vụ Được Giao')).toBeInTheDocument();
    expect(screen.getByText('Mã công việc: #CV-01 · Phân hệ Quản lý công việc (Nhóm 6)')).toBeInTheDocument();
  });

  it('renders compact search bar into top-subnav-slot and syncs search term', () => {
    // Setup portal slot in DOM
    const slot = document.createElement('div');
    slot.id = 'top-subnav-slot';
    document.body.appendChild(slot);

    const mockIncoming: DocumentItem[] = [
      { code: '10/CV-ITC', title: 'Công văn A', date: '17/09/2026' },
      { code: '20/CV-ITC', title: 'Báo cáo B', date: '17/09/2026' },
    ];

    render(
      <MemoryRouter>
        <ModernDashboardView incomingDocuments={mockIncoming} />
      </MemoryRouter>
    );

    const compactInput = screen.getByPlaceholderText(/Tìm nhanh văn bản, công việc/i);
    expect(compactInput).toBeInTheDocument();
    expect(slot).toContainElement(compactInput);

    // Typing in compact search bar filters the documents
    fireEvent.change(compactInput, { target: { value: 'Báo cáo' } });
    expect(screen.getByText('20/CV-ITC')).toBeInTheDocument();
    expect(screen.queryByText('10/CV-ITC')).not.toBeInTheDocument();

    // Clear button appears and clicking it clears search
    const clearBtn = screen.getByTitle('Xóa tìm kiếm nhanh');
    fireEvent.click(clearBtn);
    expect(screen.getByText('10/CV-ITC')).toBeInTheDocument();
    expect(screen.getByText('20/CV-ITC')).toBeInTheDocument();

    // Clean up DOM slot
    document.body.removeChild(slot);
  });
  it('translates domain task status in the row and detail modal when language changes', () => {
    render(
      <MemoryRouter>
        <ModernDashboardView tasks={[{
          id: 'status-task', title: 'Status translation', due: '18/10/2026',
          status: 'pending', workStatus: 'CHO_DUYET', statusLabel: 'Chờ duyệt', variant: 'warning',
        }]} />
      </MemoryRouter>
    );
    try {
      act(() => setLanguage('en'));
      fireEvent.click(screen.getByRole('button', { name: 'Pending Approval' }));
      expect(screen.getByText('Pending approval')).toBeInTheDocument();
      expect(screen.queryByText('Chờ duyệt')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Status translation'));
      expect(screen.getAllByText('Pending approval').length).toBeGreaterThan(1);
      act(() => setLanguage('vi'));
      expect(screen.getAllByText('Chờ duyệt').length).toBeGreaterThan(1);
    } finally {
      act(() => setLanguage('vi'));
    }
  });

});


