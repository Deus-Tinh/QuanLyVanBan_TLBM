import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordsService } from '@lib/recordsService';
import { setLanguage } from '@i18n/translate';
import type { Dossier, DocumentType } from '@app-types/records';
import DocumentDestinationDialog from './DocumentDestinationDialog';

vi.mock('@lib/recordsService', () => ({ recordsService: { getDossier: vi.fn() } }));
const dossier: Dossier = { id: 9, so_ky_hieu: 'HS', ten_ho_so: 'Hồ sơ & Kế hoạch?/2026' };
const category: DocumentType = { id: 23, ho_so: 9, ten_loai: 'Category', ten_ho_so: 'Unverified name' };
const onClose = vi.fn();
const onNavigate = vi.fn();
function show(value = category, dossierId?: string) {
  return render(<React.StrictMode><MemoryRouter><DocumentDestinationDialog category={value} dossierId={dossierId}
    onClose={onClose} onNavigate={onNavigate} /></MemoryRouter></React.StrictMode>);
}
describe('DocumentDestinationDialog context and keyboard safety', () => {
  beforeEach(() => { vi.resetAllMocks(); setLanguage('en'); vi.mocked(recordsService.getDossier).mockResolvedValue(dossier); });
  afterEach(() => { cleanup(); setLanguage('vi'); });
  it('waits for API context, then exposes an encoded real href', async () => {
    let resolve!: (value: Dossier) => void;
    vi.mocked(recordsService.getDossier).mockImplementation(() => new Promise((done) => { resolve = done; }));
    show();
    expect(screen.getByRole('button', { name: 'View documents' })).toBeDisabled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await waitFor(() => expect(recordsService.getDossier).toHaveBeenCalledWith('9'));
    await act(async () => resolve(dossier));
    const link = await screen.findByRole('link', { name: 'View documents' });
    expect(screen.getByText(dossier.ten_ho_so)).toBeInTheDocument();
    expect(screen.queryByText('Unverified name')).not.toBeInTheDocument();
    const url = new URL(link.getAttribute('href')!, 'https://local.invalid');
    expect(Object.fromEntries(url.searchParams)).toEqual({ ho_so: '9', ten_ho_so: dossier.ten_ho_so, loai_van_ban: '23', pham_vi: 'NOI_BO' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DI' } });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(link).toHaveAttribute('href', expect.stringContaining('/documents/outgoing?'));
    expect(link).toHaveAttribute('href', expect.stringContaining('pham_vi=HAN_CHE'));
    fireEvent.submit(screen.getByRole('dialog'));
    expect(onNavigate).toHaveBeenCalledWith(link.getAttribute('href'));
  });
  it.each(['request failure', 'wrong API parent', 'empty API name'])('blocks handoff on %s', async (failure) => {
    if (failure === 'request failure') vi.mocked(recordsService.getDossier).mockRejectedValue(new Error('Forbidden'));
    else vi.mocked(recordsService.getDossier).mockResolvedValue({ ...dossier, ...(failure === 'wrong API parent' ? { id: 10 } : { ten_ho_so: '' }) });
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be verified');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole('dialog'));
    expect(onNavigate).not.toHaveBeenCalled();
  });
  it('blocks a category from a different scoped dossier before fetching', async () => {
    show(category, '10');
    await screen.findByRole('alert');
    expect(recordsService.getDossier).not.toHaveBeenCalled();
  });
  it('keeps Tab within the modal including the link, restores focus, and supports Escape in StrictMode', async () => {
    const opener = document.createElement('button'); document.body.append(opener); opener.focus();
    const view = show();
    const select = screen.getByRole('combobox');
    expect(select).toHaveFocus();
    const link = await screen.findByRole('link', { name: 'View documents' });
    select.focus(); fireEvent.keyDown(select, { key: 'Tab', shiftKey: true }); expect(link).toHaveFocus();
    fireEvent.keyDown(link, { key: 'Tab' }); expect(select).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' }); expect(onClose).toHaveBeenCalledTimes(1);
    view.unmount(); expect(opener).toHaveFocus(); opener.remove();
  });
  it('keeps cancellation available when context loading fails', async () => {
    vi.mocked(recordsService.getDossier).mockRejectedValue(new Error('Not found'));
    show(); await screen.findByRole('alert');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
