import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLanguage } from '@i18n/translate';
import RecordModal from './RecordModal';


describe('RecordModal', () => {
  afterEach(() => {
    cleanup();
    setLanguage('vi');
  });

  it('rejects priority zero before calling the API', () => {
    const onSubmit = vi.fn();
    render(
      <RecordModal
        open
        mode="dossier"
        value={null}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Số\/ký hiệu/), {
      target: { value: 'HS-001' },
    });
    fireEvent.change(screen.getByLabelText(/Thứ tự ưu tiên/), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText(/Tên hồ sơ/), {
      target: { value: 'Hồ sơ kiểm thử' },
    });
    fireEvent.submit(screen.getByRole('dialog'));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Số thứ tự ưu tiên phải là số nguyên dương.'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders translated controls when English is selected', () => {
    act(() => setLanguage('en'));
    render(
      <RecordModal
        open
        mode="dossier"
        value={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Add dossier' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Reference/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add new' })).toBeInTheDocument();
  });

  it('submits the document type date and note after native input events', () => {
    act(() => setLanguage('en'));
    const onSubmit = vi.fn();
    render(<RecordModal open mode="documentType" value={null} onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Document type name/), { target: { value: '  New category  ' } });
    fireEvent.input(screen.getByLabelText(/date/i), { target: { value: '2026-10-15' } });
    fireEvent.change(screen.getByRole('textbox', { name: /note/i }), { target: { value: '  Updated note  ' } });
    fireEvent.submit(screen.getByRole('dialog'));
    expect(onSubmit).toHaveBeenCalledWith({ ten_loai: 'New category', ngay_lap: '2026-10-15', ghi_chu: 'Updated note' });
  });
});
