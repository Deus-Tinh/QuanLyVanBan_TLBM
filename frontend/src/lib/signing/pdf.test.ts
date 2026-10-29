import { describe, expect, it, vi, beforeEach } from 'vitest';
import { laLoiHuyVe, layWorkerSrc } from './pdf';

describe('pdf module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('nhan dien dung loi huy ve', () => {
    expect(laLoiHuyVe({ name: 'RenderingCancelledException' })).toBe(true);
    expect(laLoiHuyVe({ name: 'OtherException' })).toBe(false);
    expect(laLoiHuyVe(null)).toBe(false);
    expect(laLoiHuyVe(undefined)).toBe(false);
  });

  it('layWorkerSrc tao Blob URL hop le khi fetch thanh cong', async () => {
    const fakeContent = 'console.log("worker")';
    const fakeBlob = new Blob([fakeContent], { type: 'application/octet-stream' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
    });

    const src = await layWorkerSrc();
    expect(typeof src).toBe('string');
    expect(src.length).toBeGreaterThan(0);
  });

  it('layWorkerSrc tra ve fallback url khi fetch that bai', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const src = await layWorkerSrc();
    expect(typeof src).toBe('string');
  });
});
