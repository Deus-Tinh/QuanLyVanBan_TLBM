import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivePageId } from '@app-types/navigation';
import { pageIdToPath } from '@lib/routes';
import ModernDashboardView from '@components/dashboard/ModernDashboardView';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const navigate = useNavigate();

  const handleNavigate = (pageId: ActivePageId) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    navigate(pageIdToPath(pageId));
  };

  return <ModernDashboardView onNavigate={handleNavigate} />;
}




