import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLanguage, t } from '@i18n/translate';
import apiClient, { ApiError } from './apiClient';

describe('API response errors', () => {
  beforeEach(() => {
    localStorage.clear();
    setLanguage('vi');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLanguage('vi');
  });

  it.each([
    ['text/html', '<!doctype html><html><body>Traceback with private data</body></html>'],
    ['text/plain', '  <html><body>Proxy error</body></html>'],
  ])('does not expose HTML error pages served as %s', async (contentType, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, {
      status: 500,
      headers: { 'content-type': contentType },
    })));

    await expect(apiClient('/api/dashboard/overview/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: t('common.apiError', { status: '500' }),
    });
  });

  it('uses the selected language for HTML errors', async () => {
    setLanguage('en');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', {
      status: 502,
      headers: { 'content-type': 'text/html' },
    })));

    await expect(apiClient('/api/records/dossiers/')).rejects.toThrow(
      t('common.apiError', { status: '502' }, 'en')
    );
  });

  it('preserves structured JSON validation errors', async () => {
    const data = { detail: 'Validation failed', ten_ho_so: ['Required'] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })));

    await expect(apiClient('/api/records/dossiers/')).rejects.toMatchObject({
      status: 400,
      data,
    });
  });

  it('preserves plain text errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Service unavailable', {
      status: 503,
      headers: { 'content-type': 'text/plain' },
    })));

    await expect(apiClient('/api/records/dossiers/')).rejects.toEqual(
      new ApiError(503, { error: 'Service unavailable' })
    );
  });

  it('preserves successful text responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Preview</html>', {
      headers: { 'content-type': 'text/html' },
    })));

    await expect(apiClient('/api/preview/')).resolves.toBe('<html>Preview</html>');
  });
});
