import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CategoryManagementModal } from './CategoryManagementModal';
import { ResourceCategory, ResourceType } from '@app-types/resource';

vi.mock('@lib/authService', () => ({
  authService: {
    getSession: () => ({
      username: 'admin',
      fullName: 'Quản trị viên',
      role: 'admin',
    }),
  },
}));

const mockCategories: ResourceCategory[] = [
  {
    id: 1,
    stt_uu_tien: 1,
    ky_hieu: 'BM-CHUNG',
    ten_tai_lieu: 'Biểu mẫu chung',
    nguoi_lap_name: 'Quản trị viên',
    ngay_lap: '2026-01-01',
    ghi_chu: 'Thư mục chung',
  },
];

const mockTypes: ResourceType[] = [
  {
    id: 10,
    dm_tai_lieu: 1,
    ten_loai: 'Hợp đồng mẫu',
    is_public: true,
    ghi_chu: 'Các loại hợp đồng',
  },
];

describe('CategoryManagementModal Component (Issue #233)', () => {
  const onSaveCategory = vi.fn();
  const onDeleteCategory = vi.fn();
  const onSaveType = vi.fn();
  const onDeleteType = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <CategoryManagementModal
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        types={mockTypes}
        onSaveCategory={onSaveCategory}
        onDeleteCategory={onDeleteCategory}
        onSaveType={onSaveType}
        onDeleteType={onDeleteType}
      />
    );

    expect(screen.getByText('Biểu mẫu chung')).toBeInTheDocument();
  });

  it('submits category creation and awaits onSaveCategory', async () => {
    onSaveCategory.mockResolvedValueOnce(undefined);

    render(
      <CategoryManagementModal
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        types={mockTypes}
        onSaveCategory={onSaveCategory}
        onDeleteCategory={onDeleteCategory}
        onSaveType={onSaveType}
        onDeleteType={onDeleteType}
      />
    );

    // Bấm nút "Thêm mới" trên tab Thư mục
    const addBtn = screen.getByTitle('Thêm mới');
    fireEvent.click(addBtn);

    // Nhập STT và Tên thư mục
    const nameInput = screen.getByPlaceholderText(/VD: Tài liệu, Biểu mẫu chung/i);
    fireEvent.change(nameInput, { target: { value: 'Thư mục Tài chính' } });

    const orderInput = screen.getByPlaceholderText('VD: 1, 2, 3...');
    fireEvent.change(orderInput, { target: { value: '2' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Lưu thư mục/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSaveCategory).toHaveBeenCalledTimes(1);
    });

    expect(onSaveCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        ten_tai_lieu: 'Thư mục Tài chính',
        stt_uu_tien: 2,
      }),
      false,
      0,
      []
    );
  });

  it('keeps sub-modal open and shows error if onSaveCategory fails', async () => {
    onSaveCategory.mockRejectedValueOnce(new Error('Lỗi trùng mã số hoặc mất kết nối'));

    render(
      <CategoryManagementModal
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        types={mockTypes}
        onSaveCategory={onSaveCategory}
        onDeleteCategory={onDeleteCategory}
        onSaveType={onSaveType}
        onDeleteType={onDeleteType}
      />
    );

    const addBtn = screen.getByTitle('Thêm mới');
    fireEvent.click(addBtn);

    const nameInput = screen.getByPlaceholderText(/VD: Tài liệu, Biểu mẫu chung/i);
    fireEvent.change(nameInput, { target: { value: 'Thư mục Test Lỗi' } });

    const orderInput = screen.getByPlaceholderText('VD: 1, 2, 3...');
    fireEvent.change(orderInput, { target: { value: '3' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu thư mục/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Lỗi trùng mã số hoặc mất kết nối')).toBeInTheDocument();
    });
  });

  it('submits type creation and awaits onSaveType', async () => {
    onSaveType.mockResolvedValueOnce(undefined);

    render(
      <CategoryManagementModal
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        types={mockTypes}
        onSaveCategory={onSaveCategory}
        onDeleteCategory={onDeleteCategory}
        onSaveType={onSaveType}
        onDeleteType={onDeleteType}
      />
    );

    // Chuyển sang tab Loại tài liệu
    const typeTabBtn = screen.getByRole('button', { name: /Loại tài liệu/i });
    fireEvent.click(typeTabBtn);

    // Bấm nút "Thêm mới Loại tài liệu" trên tab Loại tài liệu
    const addTypeBtn = screen.getByTitle('Thêm mới Loại tài liệu');
    fireEvent.click(addTypeBtn);

    const typeNameInput = screen.getByPlaceholderText(/VD: Biểu mẫu bảo hiểm, Tờ trình.../i);
    fireEvent.change(typeNameInput, { target: { value: 'Phiếu thanh toán' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu loại tài liệu/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSaveType).toHaveBeenCalledTimes(1);
    });

    expect(onSaveType).toHaveBeenCalledWith(
      expect.objectContaining({
        ten_loai: 'Phiếu thanh toán',
        dm_tai_lieu: 1,
      }),
      false
    );
  });
});
