import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationStreams from './NotificationStreams';

describe('NotificationStreams Component (Approvals Tab Replacement)', () => {
  it('renders notification bell button', () => {
    render(
      <MemoryRouter>
        <NotificationStreams />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /thông báo/i });
    expect(bellBtn).toBeInTheDocument();
  });

  it('opens notification popover with "Chờ Duyệt" tab instead of "Lịch Họp"', () => {
    render(
      <MemoryRouter>
        <NotificationStreams />
      </MemoryRouter>
    );

    // Click bell icon to open popover
    const bellBtn = screen.getByRole('button', { name: /thông báo/i });
    fireEvent.click(bellBtn);

    // Verify 4 stream tabs: Đến, Đi, Mật, Chờ Duyệt
    expect(screen.getByText('Đến')).toBeInTheDocument();
    expect(screen.getByText('Đi')).toBeInTheDocument();
    expect(screen.getByText('Mật')).toBeInTheDocument();
    expect(screen.getByText('Chờ Duyệt')).toBeInTheDocument();

    // Verify old "Lịch Họp" tab is NOT present in the notification tabs
    expect(screen.queryByRole('button', { name: /lịch họp/i })).not.toBeInTheDocument();
  });

  it('displays empty state and navigation footer when "Chờ Duyệt" tab is selected', () => {
    render(
      <MemoryRouter>
        <NotificationStreams />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /thông báo/i });
    fireEvent.click(bellBtn);

    // Click "Chờ Duyệt" tab
    const approvalsTab = screen.getByText('Chờ Duyệt');
    fireEvent.click(approvalsTab);

    // Empty state message for pending approvals
    expect(screen.getByText('Không có hồ sơ trình ký chờ duyệt')).toBeInTheDocument();

    // Footer button navigating to signing approvals workflow
    expect(screen.getByText('Xem quy trình trình ký số điện tử »')).toBeInTheDocument();
  });
});
