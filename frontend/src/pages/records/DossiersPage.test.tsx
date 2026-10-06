import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { recordsService } from '@lib/recordsService';
import { setLanguage } from '@i18n/translate';
import DossiersPage from './DossiersPage';


vi.mock('@lib/recordsService', () => ({
  recordsService: {
    listDossiers: vi.fn(),
    getDossier: vi.fn(),
    createDossier: vi.fn(),
    updateDossier: vi.fn(),
    deleteDossier: vi.fn(),
    listDocumentTypes: vi.fn(),
    createDocumentType: vi.fn(),
    updateDocumentType: vi.fn(),
    deleteDocumentType: vi.fn(),
  },
}));


describe('DossiersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLanguage('vi');
  });

  afterEach(() => {
    cleanup();
    setLanguage('vi');
  });

  it('does not offer deletion for the system dossier', async () => {
    vi.mocked(recordsService.listDossiers).mockResolvedValue({
      items: [
        {
          id: 1,
          stt_uu_tien: 2,
          so_ky_hieu: 'HSC',
          ten_ho_so: 'Tên hệ thống có thể thay đổi',
          is_he_thong: true,
        },
        {
          id: 2,
          stt_uu_tien: 1,
          so_ky_hieu: 'HS-001',
          ten_ho_so: 'Hồ sơ thường',
          is_he_thong: false,
        },
      ],
      count: 2,
      next: null,
      previous: null,
    });

    render(
      <MemoryRouter>
        <DossiersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tên hệ thống có thể thay đổi')).toBeInTheDocument();
    });
    expect(
      screen.queryByLabelText('Xóa Tên hệ thống có thể thay đổi')
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Xóa Hồ sơ thường')).toBeInTheDocument();
  });

  it('renders the dossier page in English', async () => {
    act(() => setLanguage('en'));
    vi.mocked(recordsService.listDossiers).mockResolvedValue({
      items: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(
      <MemoryRouter>
        <DossiersPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Dossier catalog' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add dossier' })).toBeInTheDocument();
    expect(await screen.findByText('No matching dossiers')).toBeInTheDocument();
  });
});
