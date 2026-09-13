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

  // Giao diện thực tế đang kích hoạt
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('tlbm_theme') as ThemeMode) || 'dark';
  });

  // Phong cách được chỉ định cho Chế độ Sáng (mặc định 'light' - Clean Light)
  const [preferredLightTheme, setPreferredLightTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('tlbm_preferred_light_theme') as ThemeMode;
    return saved && LIGHT_THEMES.includes(saved) ? saved : 'light';
  });

  // Phong cách được chỉ định cho Chế độ Tối (mặc định 'dark' - Sleek Dark)
  const [preferredDarkTheme, setPreferredDarkTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('tlbm_preferred_dark_theme') as ThemeMode;
    return saved && DARK_THEMES.includes(saved) ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tlbm_theme', theme);
  }, [theme]);

  // Chuyển đổi nhanh 1-chạm giữa Sáng và Tối (dùng cho nút trên Header)
  const handleToggleTheme = () => {
    if (isLightThemeMode(theme)) {
      setTheme(preferredDarkTheme);
    } else {
      setTheme(preferredLightTheme);
    }
  };

  // Chọn trực tiếp 1 theme cụ thể
  const handleSelectTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (isLightThemeMode(newTheme)) {
      setPreferredLightTheme(newTheme);
      localStorage.setItem('tlbm_preferred_light_theme', newTheme);
    } else {
      setPreferredDarkTheme(newTheme);
      localStorage.setItem('tlbm_preferred_dark_theme', newTheme);
    }
  };

  // Cấu hình phong cách đại diện cho Chế độ Sáng từ trang Cài đặt
  const handleSetPreferredLight = (newTheme: ThemeMode) => {
    setPreferredLightTheme(newTheme);
    localStorage.setItem('tlbm_preferred_light_theme', newTheme);
    // Nếu hiện tại đang ở chế độ Sáng thì áp dụng giao diện mới ngay lập tức
    if (isLightThemeMode(theme)) {
      setTheme(newTheme);
    }
  };

  // Cấu hình phong cách đại diện cho Chế độ Tối từ trang Cài đặt
  const handleSetPreferredDark = (newTheme: ThemeMode) => {
    setPreferredDarkTheme(newTheme);
    localStorage.setItem('tlbm_preferred_dark_theme', newTheme);
    // Nếu hiện tại đang ở chế độ Tối thì áp dụng giao diện mới ngay lập tức
    if (!isLightThemeMode(theme)) {
      setTheme(newTheme);
    }
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
