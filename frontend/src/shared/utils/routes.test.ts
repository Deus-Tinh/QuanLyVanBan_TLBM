import { describe, it, expect } from 'vitest';
import { pathToPageId, pageIdToPath } from './routes';

describe('Route Utility Helpers', () => {
  it('converts paths to active page IDs correctly', () => {
    expect(pathToPageId('/dashboard')).toBe('dashboard');
    expect(pathToPageId('/profile')).toBe('profile');
    expect(pathToPageId('/settings')).toBe('settings');
    expect(pathToPageId('/documents/incoming')).toBe('documents_incoming');
    expect(pathToPageId('/documents/outgoing')).toBe('documents_outgoing');
    expect(pathToPageId('/non-existent')).toBe('dashboard');
  });

  it('converts page IDs to paths correctly', () => {
    expect(pageIdToPath('dashboard')).toBe('/dashboard');
    expect(pageIdToPath('profile')).toBe('/profile');
    expect(pageIdToPath('documents_incoming')).toBe('/documents/incoming');
    expect(pageIdToPath('documents_outgoing')).toBe('/documents/outgoing');
    expect(pageIdToPath('password_change')).toBe('/password-change');
  });
});
