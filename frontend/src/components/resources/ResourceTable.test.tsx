import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceTable } from './ResourceTable';
import { ResourceItem } from '@app-types/resource';

const mockItems: ResourceItem[] = [
  {
    id: 1,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu chung',
    loai_tai_lieu: [1],
    loai_tai_lieu_names: ['Quy chế'],
    ky_hieu: '15/QĐ-BL',
    tieu_de: 'Quy chế quản lý nội bộ 2026',
    ngay_dang: '2026-01-15',
    noi_ban_hanh: 'Ban Giám Đốc',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: '/media/documents/templates/qc2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Admin',
  },
  {
    id: 2,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu chung',
    loai_tai_lieu: [2],
    loai_tai_lieu_names: ['Biểu mẫu'],
    ky_hieu: 'BM-01',
    tieu_de: 'Biểu mẫu đề xuất nghỉ phép cũ',
    ngay_dang: '2025-05-10',
    noi_ban_hanh: 'Phòng Hành chính',
    hieu_luc: 'HET_HIEU_LUC',
    ngay_het_hieu_luc: '2026-01-01',
    file_dinh_kem: '/media/documents/templates/bm01.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Admin',
  },
  {
    id: 3,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu chung',
    loai_tai_lieu: [1],
    loai_tai_lieu_names: ['Quy chế'],
    ky_hieu: 'HD-03',
    tieu_de: 'Hướng dẫn một phần 2026',
    ngay_dang: '2026-03-01',
    noi_ban_hanh: 'Ban Giám Đốc',
    hieu_luc: 'CON_HIEU_LUC_1_PHAN',
    file_dinh_kem: '/media/documents/templates/hd03.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Admin',
  },
];

describe('ResourceTable Component', () => {
  it('renders table headers and rows correctly', () => {
    render(
      <ResourceTable
        items={mockItems}
        currentPage={1}
        totalPages={1}
        pageSize={10}
        totalCount={2}
        onPageChange={vi.fn()}
        onViewDetail={vi.fn()}
      />
    );

    expect(screen.getByText('Quy chế quản lý nội bộ 2026')).toBeInTheDocument();
    expect(screen.getByText('Biểu mẫu đề xuất nghỉ phép cũ')).toBeInTheDocument();
    expect(screen.getByText('15/QĐ-BL')).toBeInTheDocument();
    expect(screen.getByText('BM-01')).toBeInTheDocument();
    expect(screen.getByText('Còn hiệu lực')).toBeInTheDocument();
    expect(screen.getByText('Hết hiệu lực')).toBeInTheDocument();
  });

  it('applies dimmed background class to expired rows as required by project spec', () => {
    const { container } = render(
      <ResourceTable
        items={mockItems}
        currentPage={1}
        totalPages={1}
        pageSize={10}
        totalCount={2}
        onPageChange={vi.fn()}
        onViewDetail={vi.fn()}
      />
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    // Dòng 1: Còn hiệu lực -> không chứa class tối màu
    expect(rows[0].className).not.toContain('bg-slate-100/70');

    // Dòng 2: Hết hiệu lực -> PHẢI chứa class đổi màu tối theo quy chuẩn
    expect(rows[1].className).toContain('bg-slate-100/70');
    expect(rows[1].className).toContain('dark:bg-slate-800/60');

    // Dòng 3: Còn hiệu lực 1 phần -> không chứa class tối màu
    expect(rows[2].className).not.toContain('bg-slate-100/70');
  });

  it('calls onViewDetail via action menu Xem chi tiết button', () => {
    const handleViewDetail = vi.fn();
    render(
      <ResourceTable
        items={mockItems}
        currentPage={1}
        totalPages={1}
        pageSize={10}
        totalCount={2}
        onPageChange={vi.fn()}
        onViewDetail={handleViewDetail}
      />
    );

    // Mở menu ⋯ trên dòng đầu tiên
    const menuButtons = screen.getAllByTitle('Thao tác');
    fireEvent.click(menuButtons[0]);

    // Bấm "Xem chi tiết" trong menu
    const viewBtn = screen.getByRole('button', { name: 'Xem chi tiết tài liệu' });
    fireEvent.click(viewBtn);
    expect(handleViewDetail).toHaveBeenCalledWith(mockItems[0]);
  });

  it('renders empty state when items is empty', () => {
    render(
      <ResourceTable
        items={[]}
        currentPage={1}
        totalPages={1}
        pageSize={10}
        totalCount={0}
        onPageChange={vi.fn()}
        onViewDetail={vi.fn()}
      />
    );

    expect(screen.getByText('Không có tài liệu phù hợp')).toBeInTheDocument();
  });

  it('renders CON_HIEU_LUC_1_PHAN badge correctly', () => {
    render(
      <ResourceTable
        items={[mockItems[2]]}
        currentPage={1}
        totalPages={1}
        pageSize={10}
        totalCount={1}
        onPageChange={vi.fn()}
        onViewDetail={vi.fn()}
      />
    );

    expect(screen.getByText('Còn hiệu lực 1 phần')).toBeInTheDocument();
  });
});
