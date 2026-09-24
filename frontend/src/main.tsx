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
      localStorage.setItem('tlbm_session', '1');
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

