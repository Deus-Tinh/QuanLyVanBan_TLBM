import { useState, useEffect } from 'react';
import MainLayout from '../shared/components/Layout/MainLayout';
import AppRouter from './router';
import LoginPage from '../modules/auth/pages/LoginPage';
import { ActivePageId } from '../shared/types/navigation';
import { ThemeMode } from '../shared/types/theme';
import { LIGHT_THEMES, DARK_THEMES, isLightThemeMode } from '../shared/utils/constants';
import '../shared/styles/global.css';
import '../shared/styles/layout.css';

export default function App() {
  const [committedPage, setCommittedPage] = useState<ActivePageId>('dashboard');
  const [previewPage, setPreviewPage] = useState<ActivePageId | null>(null);

  // Giao diện thực tế đang kích hoạt: Chỉ giữ lại 2 giao diện đẹp & hiện đại nhất (Sleek Dark & Clean Light)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('tlbm_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const preferredLightTheme: ThemeMode = 'light';
  const preferredDarkTheme: ThemeMode = 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tlbm_theme', theme);
  }, [theme]);

  // Chuyển đổi nhanh 1-chạm giữa Sáng và Tối (dùng cho nút trên Header)
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Chọn trực tiếp 1 theme cụ thể
  const handleSelectTheme = (newTheme: ThemeMode) => {
    const validTheme: ThemeMode = newTheme === 'light' ? 'light' : 'dark';
    setTheme(validTheme);
  };

  const handleSetPreferredLight = (_newTheme: ThemeMode) => {
    setTheme('light');
  };

  const handleSetPreferredDark = (_newTheme: ThemeMode) => {
    setTheme('dark');
  };

  // Trang thực tế đang hiển thị trên viewport
  const displayPage = previewPage || committedPage;

  if (committedPage === 'login') {
    return (
      <LoginPage
        onNavigate={(page) => {
          setCommittedPage(page);
          setPreviewPage(null);
        }}
        onLoginSuccess={() => {
          setCommittedPage('dashboard');
          setPreviewPage(null);
        }}
      />
    );
  }

  return (
    <MainLayout
      activePage={displayPage}
      committedPage={committedPage}
      previewPage={previewPage}
      currentTheme={theme}
      onSelectTheme={handleSelectTheme}
      onToggleTheme={handleToggleTheme}
      preferredLightTheme={preferredLightTheme}
      preferredDarkTheme={preferredDarkTheme}
      onNavigate={(page) => {
        setCommittedPage(page);
        setPreviewPage(null);
      }}
      onHoverPreview={(page) => {
        setPreviewPage(page);
      }}
      onHoverLeave={() => {
        setPreviewPage(null);
      }}
    >
      <AppRouter
        activePage={displayPage}
        currentTheme={theme}
        onSelectTheme={handleSelectTheme}
        onToggleTheme={handleToggleTheme}
        preferredLightTheme={preferredLightTheme}
        preferredDarkTheme={preferredDarkTheme}
        onSetPreferredLightTheme={handleSetPreferredLight}
        onSetPreferredDarkTheme={handleSetPreferredDark}
        onNavigate={(page) => {
          setCommittedPage(page);
          setPreviewPage(null);
        }}
      />
    </MainLayout>
  );
}
