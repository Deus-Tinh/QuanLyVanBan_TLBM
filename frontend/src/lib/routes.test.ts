import { describe, it, expect } from 'vitest';
import type { ActivePageId } from '@app-types/navigation';
import { pathToPageId, pageIdToPath } from './routes';

const PATH_CASES: Array<[string, ActivePageId]> = [
  ['/', 'dashboard'],
  ['/dashboard', 'dashboard'],
  ['/dashboard/', 'dashboard'],
  ['/non-existent', 'dashboard'],
  ['/documents', 'dashboard'],
  ['/login', 'login'],
  ['/login/', 'login'],
  ['/login/extra', 'dashboard'],
  ['/profile', 'profile'],
  ['/profile/extra', 'dashboard'],
  ['/password-change', 'password_change'],
  ['/settings', 'settings'],
  ['/settings/extra', 'dashboard'],
  ['/ai-assistant', 'ai_assistant'],
  ['/ai-assistant/extra', 'dashboard'],
  ['/documents/incoming', 'documents_incoming'],
  ['/documents/incoming/5', 'documents_incoming'],
  ['/documents/outgoing', 'documents_outgoing'],
  ['/documents/outgoing/', 'documents_outgoing'],
  ['/documents/confidential', 'documents_confidential'],
  ['/documents/confidential/x', 'documents_confidential'],
  ['/records/document-types', 'record_types'],
  ['/records/12/document-types', 'record_types'],
  ['/records/12/document-types/', 'record_types'],
  ['/records/12/document-types/x', 'records'],
  ['/records', 'records'],
  ['/records/12', 'records'],
  ['/records/12/documents', 'records'],
  ['/resources', 'resources'],
  ['/resources/x', 'resources'],
  ['/approvals', 'approvals'],
  ['/approvals/a/b', 'approvals'],
  ['/tasks', 'tasks'],
  ['/tasks/3', 'tasks'],
  ['/meetings', 'meetings'],
  ['/birthdays', 'birthdays'],
  ['/organizations', 'organizations'],
  ['/employees', 'employees'],
  ['/positions', 'positions'],
  ['/roles', 'roles'],
  ['/rolesX', 'roles'],
];

const PAGE_CASES: Array<[ActivePageId, string]> = [
  ['dashboard', '/dashboard'],
  ['login', '/login'],
  ['profile', '/profile'],
  ['password_change', '/password-change'],
  ['settings', '/settings'],
  ['ai_assistant', '/ai-assistant'],
  ['documents_incoming', '/documents/incoming'],
  ['documents_outgoing', '/documents/outgoing'],
  ['documents_confidential', '/documents/confidential'],
  ['record_types', '/records/document-types'],
  ['records', '/records'],
  ['resources', '/resources'],
  ['approvals', '/approvals'],
  ['tasks', '/tasks'],
  ['meetings', '/meetings'],
  ['birthdays', '/birthdays'],
  ['organizations', '/organizations'],
  ['employees', '/employees'],
  ['positions', '/positions'],
  ['roles', '/roles'],
];

describe('Route Utility Helpers', () => {
  it.each(PATH_CASES)('maps path %s to page id %s', (path, pageId) => {
    expect(pathToPageId(path)).toBe(pageId);
  });

  it.each(PAGE_CASES)('maps page id %s to path %s', (pageId, path) => {
    expect(pageIdToPath(pageId)).toBe(path);
    expect(pathToPageId(path)).toBe(pageId);
  });

  it('falls back to the dashboard path for an unknown page id', () => {
    expect(pageIdToPath('unknown' as ActivePageId)).toBe('/dashboard');
  });
});

describe('module page declarations', () => {
  // Điều kiện nhận diện của hai module khác nhau không được cùng khớp một URL; thứ tự ghép module không ảnh hưởng kết quả.
  const pages = Object.entries(
    import.meta.glob<Array<{ id: ActivePageId; matches: (pathname: string) => boolean }>>(
      ['../pages/*/paths.ts', '../modules/*/paths.ts'],
      { eager: true, import: 'default' }
    )
  );

  it.each(PATH_CASES)('path %s matches pages of at most one module', (path) => {
    const clean = path.replace(/\/+$/, '') || '/';
    const owners = pages.filter(([, modulePages]) => modulePages.some((page) => page.matches(clean)));
    expect(owners.length).toBeLessThanOrEqual(1);
  });
});
