import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { setLanguage } from '@i18n/translate';

describe('LoginPage i18n and Language Switching', () => {
  beforeEach(() => {
    setLanguage('vi');
  });

  it('renders login form with Vietnamese text by default', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Chào mừng trở lại')).toBeInTheDocument();
    expect(screen.getByText('Tài khoản / Mã nhân viên')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu xác thực')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('renders LanguageSwitcher and toggles language to English on demand', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Tìm nút chuyển đổi tiếng Anh
    const enBtn = screen.getByRole('button', { name: /switch to english/i });
    expect(enBtn).toBeInTheDocument();

    fireEvent.click(enBtn);

    // Các text phải tự động chuyển sang tiếng Anh
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Account / Employee ID')).toBeInTheDocument();
    expect(screen.getByText('Authentication Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});


