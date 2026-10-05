import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecordModal from './RecordModal';


describe('RecordModal', () => {
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
});
