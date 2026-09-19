import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

describe('DashboardPage Component', () => {
  it('renders Modern Dashboard UI as standard layout', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Modern UI elements: 3 metric cards with 0 values (no mock data)
    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.getByText('Chưa có phát sinh trong ngày')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập số ký hiệu/i)).toBeInTheDocument();
  });

  it('renders quick action button for meeting room booking', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const bookingBtn = screen.getByRole('button', { name: /Đặt phòng họp/i });
    expect(bookingBtn).toBeInTheDocument();
  });

  it('triggers onNavigate callback when meeting room button is clicked', () => {
    const handleNavigate = vi.fn();
    render(
      <MemoryRouter>
        <DashboardPage onNavigate={handleNavigate} />
      </MemoryRouter>
    );

    const bookingBtn = screen.getByRole('button', { name: /Đặt phòng họp/i });
    fireEvent.click(bookingBtn);

    expect(handleNavigate).toHaveBeenCalledWith('meetings');
  });

  it('renders birthday marquee banner and document overview sections', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Chúc mừng sinh nhật:/i)).toBeInTheDocument();
    expect(screen.getByText(/Danh Sách Văn Bản Đến Mới Nhất/i)).toBeInTheDocument();
    expect(screen.getByText(/Danh Sách Văn Bản Đi Nội Bộ Mới Nhất/i)).toBeInTheDocument();
  });
});




