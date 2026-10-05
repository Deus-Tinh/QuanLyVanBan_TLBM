import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionMatrix } from './PermissionMatrix';
import { Permission } from '@app-types/authorization';

const PERMISSIONS: Permission[] = [
  { id: 1, name: 'Xem danh sách chức vụ', codename: 'view_chucvu', module_ten: 'Chức vụ' },
  { id: 2, name: 'Thêm chức vụ', codename: 'add_chucvu', module_ten: 'Chức vụ' },
  { id: 3, name: 'Xuất Excel đơn vị/phòng ban', codename: 'export_donvi', module_ten: 'Đơn vị, phòng ban' },
  { id: 4, name: 'Thêm phòng họp', codename: 'add_phonghop', module_ten: 'Phòng họp (danh mục)' },
];

function renderMatrix(selected: number[] = []) {
  const onToggle = vi.fn();
  render(<PermissionMatrix permissions={PERMISSIONS} selectedIds={new Set(selected)} onToggle={onToggle} />);
  return { onToggle, search: screen.getByRole('textbox') };
}

describe('PermissionMatrix', () => {
  it('groups permissions by module and shows every permission', () => {
    renderMatrix([1]);
    expect(screen.getByText('1. Chức vụ')).toBeInTheDocument();
    expect(screen.getByText('2. Đơn vị, phòng ban')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  });

  it('filters by name regardless of case', () => {
    const { search } = renderMatrix();
    fireEvent.change(search, { target: { value: 'XUẤT EXCEL' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByText('Xuất Excel đơn vị/phòng ban')).toBeInTheDocument();
  });

  it('filters without requiring Vietnamese diacritics', () => {
    const { search } = renderMatrix();
    fireEvent.change(search, { target: { value: 'chuc vu' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.queryByText('Thêm phòng họp')).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'phong hop' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });

  it('filters by codename', () => {
    const { search } = renderMatrix();
    fireEvent.change(search, { target: { value: 'export_donvi' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });

  it('shows an empty message when nothing matches and recovers when cleared', () => {
    const { search } = renderMatrix();
    fireEvent.change(search, { target: { value: 'khong-co-quyen-nay' } });
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText('Không tìm thấy quyền phù hợp.')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('keeps toggling the right permission while filtered', () => {
    const { search, onToggle } = renderMatrix();
    fireEvent.change(search, { target: { value: 'add_phonghop' } });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(4);
  });
});
