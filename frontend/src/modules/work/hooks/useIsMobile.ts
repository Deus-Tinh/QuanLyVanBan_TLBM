import { useEffect, useState } from 'react';

/**
 * Trả về true khi viewport có chiều rộng nhỏ hơn `maxWidth` (mặc định 768px,
 * khớp breakpoint md của Tailwind). Dùng cho các chỗ phải chuyển hẳn kiểu
 * render (bảng → card list, modal → full-screen) chứ không chỉ đổi CSS.
 *
 * jsdom (môi trường test mặc định) không có window.matchMedia nên guard lại
 * để tránh test ném lỗi: trả về desktop (false) khi matchMedia chưa có.
 */
export function useIsMobile(maxWidth = 767): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [maxWidth]);

  return isMobile;
}
