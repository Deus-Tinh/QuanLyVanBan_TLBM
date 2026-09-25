import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';

const rootElement = document.getElementById('root');
if (rootElement) {
  // Dev helper: auto-inject admin tokens for local testing
  if (import.meta.env.DEV) {
    try {
      // Inject tokens created dynamically by the developer script if available
      const DEV_ACCESS = import.meta.env.VITE_DEV_ACCESS_TOKEN || localStorage.getItem('tlbm_access_token');
      const DEV_REFRESH = import.meta.env.VITE_DEV_REFRESH_TOKEN || localStorage.getItem('tlbm_refresh_token');
      if (DEV_ACCESS) localStorage.setItem('tlbm_access_token', DEV_ACCESS);
      if (DEV_REFRESH) localStorage.setItem('tlbm_refresh_token', DEV_REFRESH);

      // Bảo toàn session nếu người dùng đã đăng nhập hợp lệ, chỉ fallback session admin nếu trống hoặc lỗi '1'
      const rawSession = localStorage.getItem('tlbm_session');
      let isValidSession = false;
      try {
        const parsed = rawSession ? JSON.parse(rawSession) : null;
        if (parsed && typeof parsed === 'object' && (parsed.username || parsed.fullName)) {
          isValidSession = true;
        }
      } catch {
        isValidSession = false;
      }

      if (!isValidSession && (DEV_ACCESS || localStorage.getItem('tlbm_access_token'))) {
        const defaultAdminSession = {
          username: 'admin',
          fullName: 'Quản Trị Viên (Admin)',
          role: 'admin',
          roleTitle: 'Quản trị viên tối cao',
          email: 'admin@taphuan.gov.vn',
        };
        localStorage.setItem('tlbm_session', JSON.stringify(defaultAdminSession));
      }
      window.dispatchEvent(new Event('tlbm_auth_changed'));
    } catch (e) {
      // ignore
    }
  }
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}

