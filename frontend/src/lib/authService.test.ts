import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from './authService';

describe('authService Unit Tests (Issue #8 Django Auth & Session Management)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores access and refresh tokens and returns user session on successful login', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        access: 'jwt-access-token-xyz',
        refresh: 'jwt-refresh-token-123',
        user: {
          id: 1,
          username: 'admin',
          fullName: 'Quản Trị Viên Hệ Thống',
          role: 'admin',
          roleTitle: 'Quản trị viên tối cao',
        },
      }),
    });

    const session = await authService.login({
      username: 'admin',
      password: 'Admin@123',
    });

    expect(session.username).toBe('admin');
    expect(session.fullName).toBe('Quản Trị Viên Hệ Thống');
    expect(session.role).toBe('admin');
    expect(session.token).toBe('jwt-access-token-xyz');

    expect(localStorage.getItem('tlbm_access_token')).toBe('jwt-access-token-xyz');
    expect(localStorage.getItem('tlbm_refresh_token')).toBe('jwt-refresh-token-123');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getSession()?.username).toBe('admin');
  });

  it('clears all credentials and dispatches tlbm_auth_changed on logout', async () => {
    localStorage.setItem('tlbm_access_token', 'token-to-be-removed');
    localStorage.setItem('tlbm_refresh_token', 'refresh-to-be-removed');
    localStorage.setItem('tlbm_session', JSON.stringify({ username: 'canbo' }));

    const eventSpy = vi.fn();
    window.addEventListener('tlbm_auth_changed', eventSpy);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, message: 'Đã đăng xuất' }),
    });

    await authService.logout();

    expect(localStorage.getItem('tlbm_access_token')).toBeNull();
    expect(localStorage.getItem('tlbm_refresh_token')).toBeNull();
    expect(localStorage.getItem('tlbm_session')).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(eventSpy).toHaveBeenCalled();
  });
});
