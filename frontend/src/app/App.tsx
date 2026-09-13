import { useState, useRef } from 'react';
import MainLayout from '../shared/components/Layout/MainLayout';
import AppRouter from './router';
import LoginPage from '../modules/auth/pages/LoginPage';
import { ActivePageId } from '../shared/types/navigation';
import '../shared/styles/global.css';
import '../shared/styles/layout.css';

export default function App() {
  const [committedPage, setCommittedPage] = useState<ActivePageId>('dashboard');
  const [hoveredPage, setHoveredPage] = useState<ActivePageId | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trang hiển thị thực tế trên màn hình:
  // - Khi rê chuột vào icon: chuyển hẳn sang trang tương ứng đó
  // - Khi rời chuột ra khỏi icon: lập tức quay về trang ban đầu (committedPage)
  // - Khi nhấp chuột vào icon: chính thức ở lại trang mới
  const activePage = hoveredPage ?? committedPage;

  const handleNavigate = (page: ActivePageId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setCommittedPage(page);
    setHoveredPage(null);
  };

  const handleHoverPage = (page: ActivePageId | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (page) {
      setHoveredPage(page);
    } else {
      // Khi rê chuột ra khỏi icon: lập tức chuyển về trang ban đầu
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredPage(null);
      }, 70);
    }
  };

  if (activePage === 'login') {
    return (
      <LoginPage
        onNavigate={(page) => handleNavigate(page)}
        onLoginSuccess={() => handleNavigate('dashboard')}
      />
    );
  }

  return (
    <MainLayout
      activePage={activePage}
      committedPage={committedPage}
      hoveredPage={hoveredPage}
      onHoverPage={handleHoverPage}
      onNavigate={handleNavigate}
    >
      <AppRouter activePage={activePage} onNavigate={handleNavigate} />
    </MainLayout>
  );
}

