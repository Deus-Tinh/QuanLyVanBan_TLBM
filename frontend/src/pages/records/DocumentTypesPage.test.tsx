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

  it('debounces search input by 250ms and queries catalog', async () => {
    vi.useFakeTimers();
    await show();
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(1);

    const input = screen.getByPlaceholderText('Search by document category name...');
    fireEvent.change(input, { target: { value: 'Category' } });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(2);
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Category', page: 1 })
    );

    vi.useRealTimers();
  });

  it('does not enter loading state or initiate extra request when clearing search before debounce', async () => {
    vi.useFakeTimers();
    await show();
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(1);

    const input = screen.getByPlaceholderText('Search by document category name...');
    fireEvent.change(input, { target: { value: 'Cat' } });

    const clearBtn = screen.getByLabelText('Reset');
    act(() => {
      fireEvent.click(clearBtn);
    });

    expect(input).toHaveValue('');
    expect(screen.queryByLabelText('Loading document types')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Category A' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Loading document types')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not enter loading state when typing only whitespace and clearing', async () => {
    vi.useFakeTimers();
    await show();
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(1);

    const input = screen.getByPlaceholderText('Search by document category name...');
    fireEvent.change(input, { target: { value: '   ' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(1);

    const clearBtn = screen.getByLabelText('Reset');
    act(() => {
      fireEvent.click(clearBtn);
    });

    expect(input).toHaveValue('');
    expect(screen.queryByLabelText('Loading document types')).not.toBeInTheDocument();
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('reloads with empty search and resets to page 1 when clearing active search', async () => {
    vi.useFakeTimers();
    await show();

    const input = screen.getByPlaceholderText('Search by document category name...');
    fireEvent.change(input, { target: { value: 'Category A' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(2);

    const clearBtn = screen.getByLabelText('Reset');
    await act(async () => {
      fireEvent.click(clearBtn);
      await Promise.resolve();
    });

    expect(input).toHaveValue('');
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenCalledTimes(3);
    expect(recordsService.listDocumentTypeCatalog).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: '', page: 1 })
    );
    expect(screen.queryByLabelText('Loading document types')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
