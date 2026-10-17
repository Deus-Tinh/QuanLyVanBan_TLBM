import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppHeader from './AppHeader';

describe('AppHeader Logo Visibility & Sidebar Coordination', () => {
  const defaultProps = {
    currentTheme: 'light' as const,
    onSelectTheme: () => {},
    onToggleSidebar: () => {},
  };

  it('renders Logo and home button when sidebar is collapsed (isSidebarOpen=false)', () => {
    render(
      <MemoryRouter>
        <AppHeader {...defaultProps} isSidebarOpen={false} />
      </MemoryRouter>
    );

    // Nút Home đưa người dùng về trang chủ.
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();

    // Phải có Logo
    const headerLogoImages = screen.getAllByAltText('Bảo Long Insurance');
    expect(headerLogoImages.length).toBeGreaterThan(0);
  });

  it('hides Logo and home button when sidebar is expanded (isSidebarOpen=true) to prevent duplicate logos', () => {
    render(
      <MemoryRouter>
        <AppHeader {...defaultProps} isSidebarOpen={true} />
      </MemoryRouter>
    );

    // Nút Home cũng ẩn khi sidebar đã mở.
    expect(screen.queryByRole('button', { name: 'Home' })).not.toBeInTheDocument();

    // Không có Logo ở Header
    const headerLogoImages = screen.queryAllByAltText('Bảo Long Insurance');
    expect(headerLogoImages.length).toBe(0);
  });
});

