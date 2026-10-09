import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordsService } from '@lib/recordsService';
import { setLanguage } from '@i18n/translate';
import DocumentTypesPage from './DocumentTypesPage';

vi.mock('@lib/recordsService', () => ({ recordsService: {
  getDossier: vi.fn(), listDocumentTypes: vi.fn(), listDocumentTypeCatalog: vi.fn(),
} }));
const categories = { items: [{ id: 23, ho_so: 9, ten_ho_so: 'Parent', ten_loai: 'Category A' }], count: 1, next: null, previous: null };
function Destination() { const location = useLocation(); return <div data-testid="destination">{location.pathname}{location.search}</div>; }
async function show(path = '/records/document-types') {
  await act(async () => { render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/records/document-types" element={<DocumentTypesPage />} />
    <Route path="/records/:dossierId/document-types" element={<DocumentTypesPage />} />
    <Route path="/documents/:kind" element={<Destination />} />
  </Routes></MemoryRouter>); });
}
describe('DocumentTypesPage shared-list handoff', () => {
  beforeEach(() => { vi.clearAllMocks(); setLanguage('en');
    vi.mocked(recordsService.listDocumentTypeCatalog).mockResolvedValue(categories);
    vi.mocked(recordsService.listDocumentTypes).mockResolvedValue(categories);
    vi.mocked(recordsService.getDossier).mockResolvedValue({ id: 9, ten_ho_so: 'Parent', so_ky_hieu: 'HS' });
  });
  afterEach(() => { cleanup(); setLanguage('vi'); });
  it('shows an independent catalog and forwards the clicked category to incoming', async () => {
    await show();
    fireEvent.click(await screen.findByRole('button', { name: 'Category A' }));
    expect(screen.getByRole('dialog', { name: 'Choose document list' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Restricted documents only' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'View documents' }));
    expect(await screen.findByTestId('destination')).toHaveTextContent('/documents/incoming?loai_van_ban=23');
    expect(recordsService.listDocumentTypes).not.toHaveBeenCalled();
  });
  it('keeps outgoing confidential documents in the same kind with HAN_CHE scope', async () => {
    await show('/records/9/document-types');
    fireEvent.click(await screen.findByRole('button', { name: 'Category A' }));
    fireEvent.change(within(screen.getByRole('dialog')).getByRole('combobox'), { target: { value: 'DI' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'View documents' }));
    expect(await screen.findByTestId('destination')).toHaveTextContent('/documents/outgoing?loai_van_ban=23&pham_vi=HAN_CHE');
    expect(recordsService.listDocumentTypeCatalog).not.toHaveBeenCalled();
  });
  it('allows Escape to close selection without opening a private list', async () => {
    await show();
    fireEvent.click(await screen.findByRole('button', { name: 'Category A' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByTestId('destination')).not.toBeInTheDocument();
  });
});
