import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentPreviewModal from './DocumentPreviewModal';
import { DocumentItem } from './ModernDashboardView';

describe('DocumentPreviewModal Component (PDF Reader View)', () => {
  const mockDoc: DocumentItem = {
    code: '128/QĐ-UBND',
    title: 'Phê duyệt đề án chuyển đổi số công vụ',
    date: '01/10/2026',
  };

  it('does not render when isOpen is false', () => {
    render(
      <DocumentPreviewModal
        isOpen={false}
        onClose={vi.fn()}
        document={mockDoc}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with full PDF reader layout when isOpen is true', () => {
    render(
      <DocumentPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        document={mockDoc}
        docType="incoming"
      />
    );

    // Modal dialog is in the document
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Document code and title in header
    expect(screen.getByText('128/QĐ-UBND.pdf')).toBeInTheDocument();
    expect(screen.getAllByText(/Phê duyệt đề án chuyển đổi số công vụ/i).length).toBeGreaterThan(0);

    // Vietnamese Administrative Document Standards (Nghị định 30/2020/NĐ-CP)
    expect(screen.getByText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')).toBeInTheDocument();
    expect(screen.getByText('Độc lập - Tự do - Hạnh phúc')).toBeInTheDocument();
    expect(screen.getByText('TỔNG CÔNG TY CỔ PHẦN BẢO HIỂM BẢO LONG')).toBeInTheDocument();

    // Cambridge KET / Specification structured table layout
    expect(screen.getByText('Phần / STT')).toBeInTheDocument();
    expect(screen.getByText('Nội dung quy định & Trích dẫn nghiệp vụ')).toBeInTheDocument();
    expect(screen.getByText('Yêu cầu nghiệp vụ / Căn cứ pháp lý')).toBeInTheDocument();
    expect(screen.getByText('Chỉ tiêu / Định mức')).toBeInTheDocument();

    // Rows in table
    expect(screen.getByText('Quy cách văn bản & Tiếp nhận vào hệ thống hồ sơ số')).toBeInTheDocument();
    expect(screen.getByText('100% chuẩn hóa')).toBeInTheDocument();

    // Digital signature stamp
    expect(screen.getByText('ĐÃ KÝ SỐ ĐIỆN TỬ')).toBeInTheDocument();
    expect(screen.getByText('Ký bởi: BẢO HIỂM BẢO LONG')).toBeInTheDocument();
  });

  it('handles zoom in, zoom out and reset zoom', () => {
    render(
      <DocumentPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        document={mockDoc}
      />
    );

    const zoomLabel = screen.getByText('100%');
    expect(zoomLabel).toBeInTheDocument();

    // Click Zoom in
    const zoomInBtn = screen.getByLabelText('Phóng to');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('115%')).toBeInTheDocument();

    // Click Zoom out
    const zoomOutBtn = screen.getByLabelText('Thu nhỏ');
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <DocumentPreviewModal
        isOpen={true}
        onClose={handleClose}
        document={mockDoc}
      />
    );

    const closeBtn = screen.getByLabelText('Đóng (ESC)');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <DocumentPreviewModal
        isOpen={true}
        onClose={handleClose}
        document={mockDoc}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('navigates next and previous documents when buttons are clicked', () => {
    const handleNext = vi.fn();
    const handlePrev = vi.fn();

    render(
      <DocumentPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        document={mockDoc}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={true}
        hasPrev={true}
        currentIndex={1}
        totalDocs={3}
      />
    );

    const nextBtn = screen.getByText('Văn bản tiếp theo');
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);

    const prevBtn = screen.getByText('Văn bản trước');
    fireEvent.click(prevBtn);
    expect(handlePrev).toHaveBeenCalledTimes(1);
  });
});
