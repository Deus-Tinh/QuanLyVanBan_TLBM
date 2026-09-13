import { useState, useRef } from 'react';
import MainLayout from '../shared/components/Layout/MainLayout';
import AppRouter from './router';
import LoginPage from '../modules/auth/pages/LoginPage';
import { ActivePageId } from '../shared/types/navigation';
import '../shared/styles/global.css';
import '../shared/styles/layout.css';

export default function App() {
  const [committedPage, setCommittedPage] = useState<ActivePageId>('dashboard');
  const [previewPage, setPreviewPage] = useState<ActivePageId | null>(null);

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
        onNavigate={(page) => {
          setCommittedPage(page);
          setPreviewPage(null);
        }}
      />
    </MainLayout>
  );
}

