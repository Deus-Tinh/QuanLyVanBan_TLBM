import { useState } from 'react';
import MainLayout from '../shared/components/Layout/MainLayout';
import AppRouter from './router';
import { ActivePageId } from '../shared/types/navigation';
import '../shared/styles/global.css';
import '../shared/styles/layout.css';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePageId>('dashboard');

  return (
    <MainLayout activePage={activePage} onNavigate={(page) => setActivePage(page)}>
      <AppRouter activePage={activePage} onNavigate={(page) => setActivePage(page)} />
    </MainLayout>
  );
}
