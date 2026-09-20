import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('displays authentication error in active language and translates dynamically', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: 'Tên đăng nhập hoặc mật khẩu không chính xác!',
      }),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Chuyển sang tiếng Anh
    const enBtn = screen.getByRole('button', { name: /switch to english/i });
    fireEvent.click(enBtn);

    // Điền tài khoản sai và submit
    const userInput = screen.getByPlaceholderText('Enter username or employee code...');
    const passInput = screen.getByPlaceholderText('Enter password...');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(userInput, { target: { value: 'admind' } });
    fireEvent.change(passInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    // Thông báo lỗi phải hiển thị bằng tiếng Anh
    expect(await screen.findByText('Incorrect username or password!')).toBeInTheDocument();

    // Khi chuyển lại tiếng Việt
    const viBtn = screen.getByRole('button', { name: /chuyển sang tiếng việt/i });
    fireEvent.click(viBtn);

    // Thông báo lỗi phải tự động chuyển sang tiếng Việt
    expect(screen.getByText('Tên đăng nhập hoặc mật khẩu không chính xác!')).toBeInTheDocument();
  });
});


