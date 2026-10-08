import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@lib/apiClient';
import { recordsService } from '@lib/recordsService';
import { setLanguage } from '@i18n/translate';
import DossierDocumentsPage from './DossierDocumentsPage';

vi.mock('@lib/apiClient', () => ({apiClient: {get: vi.fn()}, ApiError: class extends Error {}}));
vi.mock('@lib/recordsService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@lib/recordsService')>();
  return {...original,recordsService:{...original.recordsService,getDossier:vi.fn()}};
});
function renderPage() {
  render(<MemoryRouter initialEntries={['/records/1/documents']}><Routes><Route path="/records/:dossierId/documents" element={<DossierDocumentsPage />} /></Routes></MemoryRouter>);
}
describe('DossierDocumentsPage release filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();setLanguage('vi');
    vi.mocked(recordsService.getDossier).mockResolvedValue({id:1,so_ky_hieu:'HSC',ten_ho_so:'Shared dossier'});
    vi.mocked(apiClient.get).mockResolvedValue({count:0,next:null,previous:null,results:[]});
  });
  afterEach(cleanup);
  it('offers only incoming/outgoing and scope filters without document CRUD', async () => {
    renderPage();await screen.findByText('Shared dossier');
    expect(screen.getByRole('option',{name:'Văn bản đến'})).toBeInTheDocument();
    expect(screen.getByRole('option',{name:'Văn bản đi'})).toBeInTheDocument();
    expect(screen.queryByRole('option',{name:'Văn bản mật'})).not.toBeInTheDocument();
    expect(screen.getByRole('option',{name:'Hạn chế'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/Thêm văn bản|Xóa văn bản|Sửa văn bản/})).not.toBeInTheDocument();
  });
  it('sends both filters and resets pagination', async () => {
    renderPage();await screen.findByText('Shared dossier');
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox',{name:'Phạm vi'}),{target:{value:'HAN_CHE'}});
      fireEvent.change(screen.getByRole('combobox',{name:'Lọc theo loại văn bản'}),{target:{value:'vanbandi'}});
    });
    await waitFor(() => expect(vi.mocked(apiClient.get).mock.calls.some(([url]) => String(url).includes('type=vanbandi') && String(url).includes('scope=HAN_CHE'))).toBe(true));
  });
});
