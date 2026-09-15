import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeMode } from '../shared/types/theme';
import MainLayout from '../shared/components/Layout/MainLayout';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import AiAssistantPage from '../modules/ai/pages/AiAssistantPage';
import ProfilePage from '../modules/profile/pages/ProfilePage';
import PasswordChangePage from '../modules/profile/pages/PasswordChangePage';
import SettingsPage from '../modules/settings/pages/SettingsPage';
import SyllabusPreview from '../shared/components/Syllabus/SyllabusPreview';

interface RouterProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
}

export default function AppRouter({
  currentTheme,
  onSelectTheme,
  onToggleTheme,
  preferredLightTheme = 'light',
  preferredDarkTheme = 'dark',
}: RouterProps) {
  return (
    <Routes>
      {/* Route Standalone: Màn hình Đăng Nhập */}
      <Route path="/login" element={<LoginPage />} />

      {/* Routes có Layout chung (Header, Sidebar, TopSubNav, Footer) thông qua <Outlet /> */}
      <Route
        element={
          <MainLayout
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
            onToggleTheme={onToggleTheme}
            preferredLightTheme={preferredLightTheme}
            preferredDarkTheme={preferredDarkTheme}
          />
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Phân hệ Văn bản (Nhóm 2 phụ trách theo đề cương) */}
        <Route path="/documents/incoming" element={<SyllabusPreview activePage="documents_incoming" />} />
        <Route path="/documents/outgoing" element={<SyllabusPreview activePage="documents_outgoing" />} />
        <Route path="/documents/confidential" element={<SyllabusPreview activePage="documents_confidential" />} />

        {/* Phân hệ Hồ sơ & Tài nguyên (Nhóm 3 & Nhóm 4 phụ trách theo đề cương) */}
        <Route path="/records" element={<SyllabusPreview activePage="records" />} />
        <Route path="/resources" element={<SyllabusPreview activePage="resources" />} />

        {/* Phân hệ Quy trình & Điều hành (Nhóm 5 & Nhóm 6 phụ trách theo đề cương) */}
        <Route path="/approvals" element={<SyllabusPreview activePage="approvals" />} />
        <Route path="/tasks" element={<SyllabusPreview activePage="tasks" />} />
        <Route path="/meetings" element={<SyllabusPreview activePage="meetings" />} />
        <Route path="/birthdays" element={<SyllabusPreview activePage="birthdays" />} />

        {/* Phân hệ Quản trị hệ thống & Nhân sự (Nhóm 7 & Nhóm 8 phụ trách theo đề cương) */}
        <Route path="/organizations" element={<SyllabusPreview activePage="organizations" />} />
        <Route path="/employees" element={<SyllabusPreview activePage="employees" />} />
        <Route path="/roles" element={<SyllabusPreview activePage="roles" />} />

        {/* Tiện ích Cá nhân & Trợ lý AI (Nhóm 1 phụ trách) */}
        <Route path="/ai-assistant" element={<AiAssistantPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/password-change" element={<PasswordChangePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback cho các đường dẫn chưa đăng ký */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
