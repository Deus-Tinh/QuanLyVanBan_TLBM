import React from 'react';
import { ActivePageId } from '../shared/types/navigation';
import { ThemeMode } from '../shared/types/theme';

import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import AiAssistantPage from '../modules/ai/pages/AiAssistantPage';
import ProfilePage from '../modules/profile/pages/ProfilePage';
import PasswordChangePage from '../modules/profile/pages/PasswordChangePage';
import SettingsPage from '../modules/settings/pages/SettingsPage';
import SyllabusPreview from '../shared/components/Syllabus/SyllabusPreview';

interface RouterProps {
  activePage: ActivePageId;
  currentTheme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
  onSetPreferredLightTheme?: (theme: ThemeMode) => void;
  onSetPreferredDarkTheme?: (theme: ThemeMode) => void;
  onNavigate: (page: ActivePageId) => void;
}

export default function AppRouter({
  activePage,
  currentTheme = 'dark',
  onSelectTheme,
  onToggleTheme,
  preferredLightTheme = 'light',
  preferredDarkTheme = 'dark',
  onSetPreferredLightTheme,
  onSetPreferredDarkTheme,
  onNavigate,
}: RouterProps) {
  switch (activePage) {
    case 'dashboard':
      return <DashboardPage onNavigate={onNavigate} />;

    case 'ai_assistant':
      return <AiAssistantPage onNavigate={onNavigate} />;

    case 'login':
      return (
        <LoginPage
          onNavigate={onNavigate}
          onLoginSuccess={() => onNavigate('dashboard')}
        />
      );

    case 'profile':
      return <ProfilePage onNavigate={onNavigate} />;

    case 'password_change':
      return <PasswordChangePage onNavigate={onNavigate} />;

    case 'settings':
      return <SettingsPage onNavigate={onNavigate} />;

    default:
      return <SyllabusPreview activePage={activePage} onNavigate={onNavigate} />;
  }
}
