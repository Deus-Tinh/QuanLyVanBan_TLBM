import React, { useState } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import MainLayout from './layouts/MainLayout';
import BirthdayPage from './pages/BirthdayPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [activePage, setActivePage] = useState('birthday'); // 'birthday' or 'dashboard'

  return (
    <LanguageProvider>
      <MainLayout activePage={activePage} onNavigate={(page) => setActivePage(page)}>
        {activePage === 'birthday' ? (
          <BirthdayPage />
        ) : (
          <DashboardPage onNavigate={(page) => setActivePage(page)} />
        )}
      </MainLayout>
    </LanguageProvider>
  );
}
