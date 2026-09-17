import { ActivePageId } from '../types/navigation';

export const pageIdToPath = (pageId: ActivePageId): string => {
  switch (pageId) {
    case 'dashboard':
      return '/dashboard';
    case 'login':
      return '/login';
    case 'profile':
      return '/profile';
    case 'password_change':
      return '/password-change';
    case 'settings':
      return '/settings';
    case 'ai_assistant':
      return '/ai-assistant';
    case 'documents_incoming':
      return '/documents/incoming';
    case 'documents_outgoing':
      return '/documents/outgoing';
    case 'documents_confidential':
      return '/documents/confidential';
    case 'records':
      return '/records';
    case 'resources':
      return '/resources';
    case 'approvals':
      return '/approvals';
    case 'tasks':
      return '/tasks';
    case 'meetings':
      return '/meetings';
    case 'birthdays':
      return '/birthdays';
    case 'organizations':
      return '/organizations';
    case 'employees':
      return '/employees';
    case 'positions':
      return '/positions';
    case 'roles':
      return '/roles';
    default:
      return '/dashboard';
  }
};

export const pathToPageId = (pathname: string): ActivePageId => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/login') return 'login';
  if (clean === '/profile') return 'profile';
  if (clean === '/password-change') return 'password_change';
  if (clean === '/settings') return 'settings';
  if (clean === '/ai-assistant') return 'ai_assistant';
  if (clean.startsWith('/documents/incoming')) return 'documents_incoming';
  if (clean.startsWith('/documents/outgoing')) return 'documents_outgoing';
  if (clean.startsWith('/documents/confidential')) return 'documents_confidential';
  if (clean.startsWith('/records')) return 'records';
  if (clean.startsWith('/resources')) return 'resources';
  if (clean.startsWith('/approvals')) return 'approvals';
  if (clean.startsWith('/tasks')) return 'tasks';
  if (clean.startsWith('/meetings')) return 'meetings';
  if (clean.startsWith('/birthdays')) return 'birthdays';
  if (clean.startsWith('/organizations')) return 'organizations';
  if (clean.startsWith('/employees')) return 'employees';
  if (clean.startsWith('/positions')) return 'positions';
  if (clean.startsWith('/roles')) return 'roles';
  return 'dashboard';
};
