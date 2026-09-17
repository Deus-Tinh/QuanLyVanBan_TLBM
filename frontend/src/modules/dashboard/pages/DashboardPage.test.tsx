import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

describe('DashboardPage Style Switching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Modern UI by default when tlbm_interface_style is not set', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Modern UI elements: 3 modern metric cards with 0 values (no mock data)
    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.getByText('Chưa có phát sinh trong ngày')).toBeInTheDocument();
    expect(screen.getByText(/Tìm Kiếm Nhanh Văn Bản Đến & Văn Bản Đi/i)).toBeInTheDocument();
  });

  it('renders Classic UI when tlbm_interface_style is set to classic', () => {
    localStorage.setItem('tlbm_interface_style', 'classic');
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Classic UI elements: 3 navy stat cards and birthday marquee
    expect(screen.getByText(/Văn bản đến \(2026\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Chúc mừng sinh nhật:/i)).toBeInTheDocument();
  });

  it('renders Modern UI when tlbm_interface_style is set to modern', () => {
    localStorage.setItem('tlbm_interface_style', 'modern');
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Modern UI elements: 3 modern metric cards with 0 values (no mock data)
    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.getByText('Chưa có phát sinh trong ngày')).toBeInTheDocument();
    expect(screen.getByText(/Tìm Kiếm Nhanh Văn Bản Đến & Văn Bản Đi/i)).toBeInTheDocument();
  });

  it('dynamically switches to Modern UI when tlbm_settings_updated event fires', () => {
    localStorage.setItem('tlbm_interface_style', 'classic');
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Văn bản đến \(2026\)/i)).toBeInTheDocument();

    // Change to modern and dispatch event
    act(() => {
      localStorage.setItem('tlbm_interface_style', 'modern');
      window.dispatchEvent(new Event('tlbm_settings_updated'));
    });

    expect(screen.getAllByText('0')).toHaveLength(3);
    expect(screen.getByText('Chưa có phát sinh trong ngày')).toBeInTheDocument();
    expect(screen.getByText(/Tìm Kiếm Nhanh Văn Bản Đến & Văn Bản Đi/i)).toBeInTheDocument();
  });
});
