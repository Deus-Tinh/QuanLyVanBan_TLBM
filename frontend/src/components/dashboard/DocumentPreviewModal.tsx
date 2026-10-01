import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@i18n/translate';
import { Badge } from '@components/common';
import { DocumentItem } from './ModernDashboardView';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  docType?: 'incoming' | 'outgoing' | 'resource';
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentIndex?: number;
  totalDocs?: number;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  docType = 'incoming',
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  currentIndex = 0,
  totalDocs = 1,
}: DocumentPreviewModalProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 2;

  // Keyboard navigation: Escape to close, Left/Right arrow to switch doc
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
      }
    },
    [isOpen, onClose, hasNext, onNext, hasPrev, onPrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !document) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoom(100);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `=====================================================
${t('documentPreview.companyName')}
${t('documentPreview.nationalRepublic')}
${t('documentPreview.nationalMotto')}
=====================================================
${t('documentPreview.docNumberLabel')} ${document.code}
${t('documentPreview.locationDate')} ${document.date}
TRÍCH YẾU: ${document.title}

${t('documentPreview.article1')} ${document.title}
${t('documentPreview.article2')}

${t('documentPreview.recipients')}
- ${t('documentPreview.recipientsBgd')}
- ${t('documentPreview.recipientsDepts')}
- ${t('documentPreview.recipientsArchive')}

${t('documentPreview.signerTitle')}
${t('documentPreview.signerRole')}
[${t('documentPreview.digitalSignature')}]
${t('documentPreview.signedBy')}
${t('documentPreview.signDate')} ${document.date}
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.code.replace(/[/\\?%*:|"<>]/g, '_')}.txt`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getDocTypeBadge = () => {
    switch (docType) {
      case 'incoming':
        return (
          <Badge variant="primary" size="sm">
            <i className="fa-solid fa-inbox mr-1.5" />
            {t('documentPreview.badgeIncoming')}
          </Badge>
        );
      case 'outgoing':
        return (
          <Badge variant="success" size="sm">
            <i className="fa-solid fa-paper-plane mr-1.5" />
            {t('documentPreview.badgeOutgoing')}
          </Badge>
        );
      case 'resource':
        return (
          <Badge variant="purple" size="sm">
            <i className="fa-solid fa-file-lines mr-1.5" />
            {t('documentPreview.badgeResource')}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('documentPreview.modalTitle')}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white"
    >
      {/* Container giả lập trình đọc tài liệu PDF Reader */}
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[960px] flex flex-col bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/60 overflow-hidden print:w-full print:h-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* 1. Header Toolbar (Thanh công cụ trình đọc PDF như Edge/Chrome trong ảnh mẫu) */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 text-sm select-none shrink-0 print:hidden">
          {/* Cụm trái: Thông tin tệp */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-red-600/90 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <i className="fa-solid fa-file-pdf text-sm" />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate">{document.code}.pdf</span>
                {getDocTypeBadge()}
              </div>
              <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {document.title}
              </span>
            </div>
          </div>

          {/* Cụm giữa: Điều khiển trang & Zoom */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
            {/* Phân trang */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
                title="Trang trước"
                aria-label="Trang trước"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              <span>
                {t('documentPreview.pageIndicator')} <strong className="text-white">{currentPage}</strong> {t('documentPreview.pageOf')} {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
                title="Trang tiếp"
                aria-label="Trang tiếp"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700 mx-1" />

            {/* Thu nhỏ / Phóng to */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-7 h-7 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              title={t('documentPreview.zoomOut')}
              aria-label={t('documentPreview.zoomOut')}
            >
              <i className="fa-solid fa-minus text-xs" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="text-xs font-semibold px-2 py-0.5 rounded hover:bg-slate-700 text-slate-200 cursor-pointer"
              title={t('documentPreview.fitPage')}
            >
              {zoom}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              className="w-7 h-7 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              title={t('documentPreview.zoomIn')}
              aria-label={t('documentPreview.zoomIn')}
            >
              <i className="fa-solid fa-plus text-xs" />
            </button>

            <div className="w-px h-4 bg-slate-700 mx-1" />

            {/* Xoay trang */}
            <button
              type="button"
              onClick={handleRotate}
              className="w-7 h-7 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              title={t('documentPreview.rotate')}
              aria-label={t('documentPreview.rotate')}
            >
              <i className="fa-solid fa-rotate-right text-xs" />
            </button>
          </div>

          {/* Cụm phải: In, Tải về, Đóng */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={t('documentPreview.print')}
              aria-label={t('documentPreview.print')}
            >
              <i className="fa-solid fa-print text-sm" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={t('documentPreview.download')}
              aria-label={t('documentPreview.download')}
            >
              <i className="fa-solid fa-download text-sm" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors cursor-pointer"
              title={t('documentPreview.close')}
              aria-label={t('documentPreview.close')}
            >
              <i className="fa-solid fa-xmark text-base text-slate-300 hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* 2. Workspace View (Vùng cuộn xem tài liệu phong cách Reader) */}
        <div className="flex-1 overflow-auto bg-slate-800/80 p-3 sm:p-8 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full max-w-[800px] bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-12 border border-slate-300 select-text print:shadow-none print:border-none print:p-0 print:max-w-none print:transform-none"
          >
            {/* Header Thể Thức Văn Bản Hành Chính theo Nghị định 30/2020/NĐ-CP */}
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-200">
              {/* Bên trái: Tên cơ quan, số ký hiệu */}
              <div className="text-left">
                <div className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-900 leading-tight">
                  {t('documentPreview.companyName')}
                </div>
                <div className="text-xs text-slate-600 font-semibold mt-0.5 uppercase tracking-wider">
                  TRUNG TÂM CÔNG NGHỆ THÔNG TIN
                </div>
                <div className="text-xs text-slate-700 font-medium mt-2">
                  <span className="font-bold">{t('documentPreview.docNumberLabel')}</span> {document.code}
                </div>
              </div>

              {/* Bên phải: Quốc hiệu, Tiêu ngữ, Ngày tháng */}
              <div className="text-center">
                <div className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-900">
                  {t('documentPreview.nationalRepublic')}
                </div>
                <div className="font-semibold text-xs sm:text-sm text-slate-800 mt-0.5">
                  {t('documentPreview.nationalMotto')}
                </div>
                <div className="w-32 h-0.5 bg-slate-800 mx-auto mt-1 mb-2" />
                <div className="text-xs text-slate-600 italic">
                  {t('documentPreview.locationDate')} {document.date}
                </div>
              </div>
            </div>

            {/* Tiêu đề & Trích yếu văn bản */}
            <div className="text-center my-6">
              <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-slate-900">
                {document.code.includes('QĐ')
                  ? 'QUYẾT ĐỊNH'
                  : document.code.includes('CV')
                  ? 'CÔNG VĂN ĐIỀU HÀNH'
                  : document.code.includes('TTr')
                  ? 'TỜ TRÌNH'
                  : document.code.includes('TB')
                  ? 'THÔNG BÁO'
                  : document.code.includes('KH')
                  ? 'KẾ HOẠCH CÔNG TÁC'
                  : 'VĂN BẢN QUẢN LÝ'}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-slate-800 mt-2 max-w-xl mx-auto leading-relaxed">
                V/v: {document.title}
              </p>
            </div>

            {/* Khối Bảng Dữ Liệu Bố Cục Chuẩn Xác theo Mẫu Thầy Yêu Cầu (Cambridge KET Layout) */}
            <div className="my-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-700 text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-700 text-center">
                      <th className="border border-slate-700 p-2 sm:p-2.5 w-14">
                        {t('documentPreview.colPart')}
                      </th>
                      <th className="border border-slate-700 p-2 sm:p-2.5 text-left">
                        {t('documentPreview.colContent')}
                      </th>
                      <th className="border border-slate-700 p-2 sm:p-2.5 text-left">
                        {t('documentPreview.colObjective')}
                      </th>
                      <th className="border border-slate-700 p-2 sm:p-2.5 w-24">
                        {t('documentPreview.colStandard')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-slate-800">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold">1</td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 font-medium leading-snug">
                        {t('documentPreview.row1Content')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 leading-snug">
                        {t('documentPreview.row1Objective')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold text-primary">
                        {t('documentPreview.row1Standard')}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold">2</td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 font-medium leading-snug">
                        {t('documentPreview.row2Content')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 leading-snug">
                        {t('documentPreview.row2Objective')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold text-primary">
                        {t('documentPreview.row2Standard')}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold">3</td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 font-medium leading-snug">
                        {t('documentPreview.row3Content')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 leading-snug">
                        {t('documentPreview.row3Objective')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold text-primary">
                        {t('documentPreview.row3Standard')}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold">4</td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 font-medium leading-snug">
                        {t('documentPreview.row4Content')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 leading-snug">
                        {t('documentPreview.row4Objective')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold text-primary">
                        {t('documentPreview.row4Standard')}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold">5</td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 font-medium leading-snug">
                        {t('documentPreview.row5Content')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 leading-snug">
                        {t('documentPreview.row5Objective')}
                      </td>
                      <td className="border border-slate-700 p-2 sm:p-2.5 text-center font-bold text-primary">
                        {t('documentPreview.row5Standard')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Các Điều Khoản Thi Hành */}
            <div className="space-y-3 my-5 text-xs sm:text-sm text-slate-800 text-justify leading-relaxed">
              <p>
                <strong>{t('documentPreview.article1')}</strong> "{document.title}". Toàn bộ nội dung và định mức quy chuẩn kỹ thuật được xác lập chi tiết tại bảng danh mục nêu trên.
              </p>
              <p>
                <strong>{t('documentPreview.article2')}</strong>
              </p>
            </div>

            {/* Khối Ký Tên & Dấu Mộc Đỏ Số Hóa */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-200">
              {/* Bên trái: Nơi nhận */}
              <div className="text-xs text-slate-700 space-y-1">
                <div className="font-bold uppercase">{t('documentPreview.recipients')}</div>
                <div>- {t('documentPreview.recipientsBgd')}</div>
                <div>- {t('documentPreview.recipientsDepts')}</div>
                <div>- {t('documentPreview.recipientsArchive')}</div>
              </div>

              {/* Bên phải: Thẩm quyền ký & Dấu số điện tử */}
              <div className="text-center flex flex-col items-center">
                <div className="font-bold text-xs sm:text-sm uppercase text-slate-900">
                  {t('documentPreview.signerTitle')}
                </div>
                <div className="font-semibold text-xs text-slate-600 uppercase mt-0.5">
                  {t('documentPreview.signerRole')}
                </div>

                {/* Con Dấu Ký Số Điện Tử Đỏ */}
                <div className="mt-4 p-2.5 rounded-lg border-2 border-red-600 bg-red-50/70 text-red-700 text-center max-w-[210px] shadow-xs">
                  <div className="flex items-center justify-center gap-1 font-extrabold text-xs uppercase tracking-wide">
                    <i className="fa-solid fa-stamp" />
                    <span>{t('documentPreview.digitalSignature')}</span>
                  </div>
                  <div className="text-[11px] font-semibold mt-1 leading-tight">
                    {t('documentPreview.signedBy')}
                  </div>
                  <div className="text-[10px] text-red-600 mt-0.5">
                    {t('documentPreview.signDate')} {document.date}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 tracking-tighter">
                    {t('documentPreview.signatureValid')}
                  </div>
                </div>
              </div>
            </div>

            {/* Chân Trang Tài Liệu */}
            <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-500">
              <span>{document.code} • TLBM QLVB&TL v2.0</span>
              <span className="font-medium">
                {t('documentPreview.pageIndicator')} {currentPage} / {totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar: Điều hướng văn bản tiếp theo / trước đó */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">
              {t('documentPreview.docCounter')} <strong>{currentIndex + 1}</strong> / {totalDocs}
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400 truncate max-w-xs">{document.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
              <span>{t('documentPreview.prevDoc')}</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{t('documentPreview.nextDoc')}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
