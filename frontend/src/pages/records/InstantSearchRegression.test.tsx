import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordsService } from '@lib/recordsService';
import { setLanguage } from '@i18n/translate';
import DossiersPage from './DossiersPage';
import DocumentTypesPage from './DocumentTypesPage';

vi.mock('@lib/recordsService', () => ({ recordsService: {
  listDossiers: vi.fn(), listDocumentTypeCatalog: vi.fn(), listDocumentTypes: vi.fn(),
  getDossier: vi.fn(), createDossier: vi.fn(), updateDossier: vi.fn(), deleteDossier: vi.fn(),
  createDocumentType: vi.fn(), updateDocumentType: vi.fn(), deleteDocumentType: vi.fn(),
} }));

describe.each([
  ['dossiers', DossiersPage, 'Loading dossiers', 'No matching dossiers'],
  ['document types', DocumentTypesPage, 'Loading document types', 'No matching document types'],
] as const)('%s instant search review', (_name, Page, loading, empty) => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks(); setLanguage('en');
    const result = { items: [], count: 0, next: null, previous: null };
    vi.mocked(recordsService.listDossiers).mockResolvedValue(result);
    vi.mocked(recordsService.listDocumentTypeCatalog).mockResolvedValue(result);
    vi.mocked(recordsService.listDocumentTypes).mockResolvedValue(result);
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); setLanguage('vi'); });
  async function show() {
    await act(async () => { render(<React.StrictMode><MemoryRouter><Page /></MemoryRouter></React.StrictMode>); });
    expect(screen.getByText(empty)).toBeInTheDocument();
    vi.clearAllMocks();
  }
  function request() { return Page === DossiersPage ? recordsService.listDossiers : recordsService.listDocumentTypeCatalog; }
  it('debounces rapid typing to the latest query', async () => {
    await show();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'first' } });
    await act(async () => { vi.advanceTimersByTime(200); });
    fireEvent.change(input, { target: { value: ' latest ' } });
    await act(async () => { vi.advanceTimersByTime(249); });
    expect(request()).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(request()).toHaveBeenCalledTimes(1);
    expect(request()).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'latest', page: 1 }));
  });
  it('does not remain loading when clearing before debounce fires', async () => {
    await show();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'query' } });
    fireEvent.click(within(input.parentElement!).getByRole('button'));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.queryByLabelText(loading)).not.toBeInTheDocument();
    expect(screen.getByText(empty)).toBeInTheDocument();
  });
  it('does not remain loading when clearing whitespace-only input', async () => {
    await show();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(screen.queryByLabelText(loading)).not.toBeInTheDocument();
    fireEvent.click(within(input.parentElement!).getByRole('button'));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.queryByLabelText(loading)).not.toBeInTheDocument();
    expect(screen.getByText(empty)).toBeInTheDocument();
  });
});
