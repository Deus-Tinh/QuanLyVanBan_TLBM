import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@i18n/translate';
import { Badge } from '@components/common';
import { DocumentItem, DocumentAttachment } from './ModernDashboardView';

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
  const [activeTab, setActiveTab] = useState<'detail' | 'pdf'>('detail');
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage] = useState<number>(1);
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

  // Helper derivation for rich fields matching Group 2 specifications
  const docMeta = useMemo(() => {
    if (!document) return null;

    // Numerical index or fallback from code
    const numericPart = document.code.match(/\d+/)?.[0] || '8';
    const arrivalNo = document.arrivalNumber ?? `#${numericPart}`;
    const year = document.bookYear ?? (document.date ? document.date.split('/')[2] || '2026' : '2026');
    const arrivalDate = document.arrivalDate ?? document.date;

    // Issuing place and authority
    let place = document.issuingPlace || document.sender;
    let signer = document.signer;
    let signerRole = document.signerRole;

    if (!place) {
      if (document.code.includes('HĐND') || document.code.includes('NQ')) {
        place = 'Hội đồng Nhân dân TP. Hồ Chí Minh';
        signer = signer || 'Nguyễn Thị Lệ';
        signerRole = signerRole || 'Chủ tịch HĐND';
      } else if (document.code.includes('STC') || document.code.includes('TB-STC')) {
        place = 'Sở Tài chính TP. Hồ Chí Minh';
        signer = signer || 'Lê Duy Minh';
        signerRole = signerRole || 'Giám đốc Sở';
      } else if (document.code.includes('SGDĐT') || document.code.includes('KH')) {
        place = 'Sở Giáo dục và Đào tạo TP. Hồ Chí Minh';
        signer = signer || 'Nguyễn Văn Hiếu';
        signerRole = signerRole || 'Giám đốc Sở';
      } else if (document.code.includes('BTTTT')) {
        place = 'Bộ Thông tin và Truyền thông';
        signer = signer || 'Nguyễn Mạnh Hùng';
        signerRole = signerRole || 'Bộ trưởng';
      } else if (document.code.includes('UBND')) {
        place = 'Ủy ban Nhân dân TP. Hồ Chí Minh';
        signer = signer || 'Phan Văn Mãi';
        signerRole = signerRole || 'Chủ tịch UBND';
      } else {
        place = docType === 'outgoing' ? 'Tổng Công ty CP Bảo hiểm Bảo Long' : 'Cơ quan ban hành nhà nước';
        signer = signer || 'Trần Văn Nam';
        signerRole = signerRole || 'Phó Tổng Giám đốc';
      }
    }

    // Validity determination
    let validity = document.validityStatus;
    let validityLabel = document.validityStatusLabel;
    let replacedBy = document.replacedBy;

    if (!validity) {
      if (document.code.includes('56/NQ-HĐND') || document.code.includes('42/TB-UBND')) {
        validity = 'expired';
        validityLabel = t('documentPreview.validStatusExpired');
        replacedBy = replacedBy || '15/CV-BGDĐT';
      } else if (document.code.includes('102/KH-SGDĐT') || document.code.includes('125')) {
        validity = 'partial';
        validityLabel = t('documentPreview.validStatusPartial');
      } else {
        validity = 'valid';
        validityLabel = t('documentPreview.validStatusActive');
      }
    }

    // Attachments derivation
    let attachments: DocumentAttachment[] = document.attachments || [];
    if (!attachments || attachments.length === 0) {
      const sanitizedName = document.code.toLowerCase().replace(/[/\\?%*:|"<>]/g, '_');
      if (document.code.includes('215/TB-STC')) {
        attachments = [
          {
            name: `huong_dan_lap_du_toan_ngan_sach_${sanitizedName}.pdf`,
            size: '2.4 MB',
            date: document.date,
            type: 'pdf',
          },
          {
            name: 'bieu_mau_tong_hop_chi_tiet.xlsx',
            size: '156 KB',
            date: document.date,
            type: 'excel',
          },
        ];
      } else {
        attachments = [
          {
            name: `${sanitizedName}.pdf`,
            size: '1.8 MB',
            date: document.date,
            type: 'pdf',
          },
        ];
      }
    }

    // Note derivation
    let note = document.note;
    if (!note) {
      if (validity === 'expired') {
        note = `Đã được thay thế bởi văn bản hướng dẫn ${replacedBy || '15/CV-BGDĐT'}`;
      } else if (document.code.includes('215/TB-STC')) {
        note = 'Phòng Kế hoạch - Tài chính lập bảng dự toán nộp trước 15/10/2026';
      } else if (docType === 'incoming') {
        note = 'Văn bản đã phân phối đến các phòng ban chức năng thực hiện.';
      }
    }

    // Creator & metadata
    const creator = document.creator || 'Trí Kiệt Lê';
    const createdAt = document.createdAt || `${document.date} 08:30:00`;
    const updatedAt = document.updatedAt || `${document.date} 09:15:00`;

    return {
      arrivalNo,
      year,
      arrivalDate,
      place,
      signer,
      signerRole,
      validity,
      validityLabel,
      replacedBy,
      note,
      attachments,
      creator,
      createdAt,
      updatedAt,
    };
  }, [document, docType, t]);

  if (!isOpen || !document || !docMeta) return null;

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

CƠ QUAN BAN HÀNH: ${docMeta.place}
NGƯỜI KÝ: ${docMeta.signer} (${docMeta.signerRole})
TRẠNG THÁI HIỆU LỰC: ${docMeta.validityLabel}

${t('documentPreview.article1')} ${document.title}
${t('documentPreview.article2')}

${t('documentPreview.recipients')}
- ${t('documentPreview.recipientsBgd')}
- ${t('documentPreview.recipientsDepts')}
- ${t('documentPreview.recipientsArchive')}

${docMeta.signerRole}
[${t('documentPreview.digitalSignature')}]
${docMeta.signer}
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

  const handleOpenFile = (att: DocumentAttachment) => {
    if (att.type === 'pdf' || att.name.endsWith('.pdf')) {
      setActiveTab('pdf');
    } else {
      handleDownload();
    }
  };

  const modalTitle =
    docType === 'incoming'
      ? t('documentPreview.modalTitleIncoming')
      : docType === 'outgoing'
      ? t('documentPreview.modalTitleOutgoing')
      : t('documentPreview.modalTitleResource');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-detail-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-surface rounded-2xl sm:rounded-3xl shadow-2xl border border-border-subtle overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* 1. Header (Theo đúng phong cách Group 2 & Thầy Duy) */}
        <div className="p-5 sm:p-6 pb-3 border-b border-border-subtle bg-surface flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center text-xl shrink-0 shadow-xs border border-primary/20">
              <i className="fa-solid fa-file-lines" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2
                  id="document-detail-modal-title"
                  className="text-lg sm:text-xl font-bold text-main"
                >
                  {modalTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-subtle text-primary border border-primary/30 tracking-wide">
                  {document.code}
                </span>
              </div>
              <p className="text-sm text-secondary mt-0.5 truncate">
                {t('documentPreview.modalSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick next/prev navigation for Top 5 */}
            {totalDocs > 1 && (
              <div className="hidden sm:flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-subtle mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title={t('documentPreview.prevDoc')}
                  aria-label={t('documentPreview.prevDoc')}
                >
                  <i className="fa-solid fa-chevron-left text-xs" />
                </button>
                <span className="text-xs font-semibold text-secondary px-1.5">
                  {currentIndex + 1}/{totalDocs}
                </span>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!hasNext}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title={t('documentPreview.nextDoc')}
                  aria-label={t('documentPreview.nextDoc')}
                >
                  <i className="fa-solid fa-chevron-right text-xs" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:text-main hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all cursor-pointer"
              title={t('documentPreview.close')}
              aria-label={t('documentPreview.close')}
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>

        {/* 2. Sub-tab switcher: Chi tiết văn bản (Group 2 Style) vs Bản số hóa PDF */}
        <div className="px-6 pt-3 pb-2 bg-surface flex items-center justify-between border-b border-border-subtle/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'detail'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-subtle text-secondary hover:text-main hover:bg-surface-hover'
              }`}
            >
              <i className="fa-solid fa-circle-info text-xs" />
              <span>{t('documentPreview.tabDetails')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-subtle text-secondary hover:text-main hover:bg-surface-hover'
              }`}
            >
              <i className="fa-solid fa-file-pdf text-xs" />
              <span>{t('documentPreview.tabPdf')}</span>
            </button>
          </div>

          {activeTab === 'pdf' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-secondary">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-surface-hover"
                title={t('documentPreview.zoomOut')}
                aria-label={t('documentPreview.zoomOut')}
              >
                <i className="fa-solid fa-magnifying-glass-minus" />
              </button>
              <span className="font-semibold text-main px-1">{zoom}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-surface-hover"
                title={t('documentPreview.zoomIn')}
                aria-label={t('documentPreview.zoomIn')}
              >
                <i className="fa-solid fa-magnifying-glass-plus" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg hover:bg-surface-hover"
                title={t('documentPreview.fitWidth')}
              >
                <i className="fa-solid fa-arrows-left-right" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-lg hover:bg-surface-hover"
                title={t('documentPreview.rotate')}
              >
                <i className="fa-solid fa-rotate-right" />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 rounded-lg hover:bg-surface-hover"
                title={t('documentPreview.print')}
              >
                <i className="fa-solid fa-print" />
              </button>
            </div>
          )}
        </div>

        {/* 3. Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 max-h-[calc(88vh-140px)]">
          {activeTab === 'detail' ? (
            /* ─────────────────────────────────────────────────────────────
               TAB 1: POPUP CHI TIẾT VĂN BẢN (KHỚP 100% ẢNH NHÓM 2 & THẦY DUY)
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Banner Cảnh báo Trạng thái Hết hiệu lực / Đã thay thế */}
              {docMeta.validity === 'expired' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="fa-solid fa-triangle-exclamation text-base" />
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide text-xs">
                      {t('documentPreview.expiredWarningTitle')}
                    </div>
                    <div className="text-amber-700 dark:text-amber-400 mt-0.5">
                      {t('documentPreview.expiredWarningDesc')}{' '}
                      <span className="font-bold text-amber-900 dark:text-amber-200 underline decoration-amber-400">
                        {docMeta.replacedBy}
                      </span>.
                    </div>
                  </div>
                </div>
              )}

              {/* Khối TRÍCH YẾU NỘI DUNG */}
              <div>
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  {t('documentPreview.summaryTitle')}
                </div>
                <div className="bg-surface-subtle border border-border-subtle rounded-2xl p-4 sm:p-5 text-main font-semibold text-base sm:text-lg leading-relaxed shadow-xs">
                  {document.title}
                </div>
              </div>

              {/* Khối 2 Cột Thông Số Nghiệp Vụ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cột 1: Thông số đến / Thông số đi / Biểu mẫu */}
                <div className="border border-border-subtle rounded-2xl p-4 sm:p-5 bg-surface shadow-xs flex flex-col justify-between">
                  <div className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-2 pb-2.5 mb-3 border-b border-border-subtle">
                    <i className="fa-solid fa-hashtag text-xs" />
                    <span>
                      {docType === 'incoming'
                        ? t('documentPreview.incomingParamsTitle')
                        : docType === 'outgoing'
                        ? t('documentPreview.outgoingParamsTitle')
                        : t('documentPreview.resourceParamsTitle')}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center text-secondary">
                      <span>
                        {docType === 'incoming'
                          ? t('documentPreview.incomingNumber')
                          : docType === 'outgoing'
                          ? t('documentPreview.outgoingNumber')
                          : t('documentPreview.resourceCodeLabel')}
                      </span>
                      <span className="font-bold text-main">{docMeta.arrivalNo}</span>
                    </div>

                    <div className="flex justify-between items-center text-secondary">
                      <span>{t('documentPreview.bookYear')}</span>
                      <span className="font-semibold text-main">{docMeta.year}</span>
                    </div>

                    <div className="flex justify-between items-center text-secondary">
                      <span>
                        {docType === 'incoming'
                          ? t('documentPreview.arrivalDate')
                          : t('documentPreview.issueDate')}
                      </span>
                      <span className="font-semibold text-main">{docMeta.arrivalDate}</span>
                    </div>

                    <div className="flex justify-between items-center text-secondary">
                      <span>{t('documentPreview.documentDate')}</span>
                      <span className="font-semibold text-main">{document.date}</span>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Cơ quan ban hành & Hiệu lực */}
                <div className="border border-border-subtle rounded-2xl p-4 sm:p-5 bg-surface shadow-xs flex flex-col justify-between">
                  <div className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-2 pb-2.5 mb-3 border-b border-border-subtle">
                    <i className="fa-solid fa-landmark text-xs" />
                    <span>
                      {docType === 'resource'
                        ? t('documentPreview.managementUnit')
                        : t('documentPreview.authorityAndValidity')}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center text-secondary">
                      <span>
                        {docType === 'outgoing'
                          ? t('documentPreview.draftingUnit')
                          : t('documentPreview.issuingAgency')}
                      </span>
                      <span
                        className="font-medium text-main text-right max-w-[210px] truncate"
                        title={docMeta.place}
                      >
                        {docMeta.place}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-secondary">
                      <span>{t('documentPreview.signerAndRole')}</span>
                      <span
                        className="font-medium text-main text-right max-w-[210px] truncate"
                        title={`${docMeta.signer} (${docMeta.signerRole})`}
                      >
                        {docMeta.signer} ({docMeta.signerRole})
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-secondary">
                      <span>{t('documentPreview.validityStatus')}</span>
                      <Badge
                        variant={
                          docMeta.validity === 'valid'
                            ? 'success'
                            : docMeta.validity === 'expired'
                            ? 'warning'
                            : 'info'
                        }
                        className="font-semibold"
                      >
                        {docMeta.validityLabel}
                      </Badge>
                    </div>

                    {docMeta.replacedBy && (
                      <div className="flex justify-between items-center text-secondary">
                        <span>{t('documentPreview.replacedBy')}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {docMeta.replacedBy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dòng Ghi chú (nếu có) */}
              {docMeta.note && (
                <div className="p-3.5 bg-surface-subtle border border-border-subtle rounded-xl text-sm flex items-start gap-2.5">
                  <i className="fa-regular fa-note-sticky text-muted mt-0.5 shrink-0" />
                  <div className="text-secondary">
                    <span className="font-bold text-main">{t('documentPreview.notesLabel')} </span>
                    <span>{docMeta.note}</span>
                  </div>
                </div>
              )}

              {/* Khối 📎 TỆP ĐÍNH KÈM (N) */}
              <div>
                <div className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-2 mb-2.5">
                  <i className="fa-solid fa-paperclip text-xs" />
                  <span>
                    {t('documentPreview.attachmentsTitle')} ({docMeta.attachments.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docMeta.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-subtle transition-all flex items-center justify-between gap-3 group shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl border ${
                            att.type === 'excel' || att.name.endsWith('.xlsx')
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : att.type === 'word' || att.name.endsWith('.docx')
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {att.type === 'excel' || att.name.endsWith('.xlsx') ? (
                            <i className="fa-solid fa-file-excel" />
                          ) : att.type === 'word' || att.name.endsWith('.docx') ? (
                            <i className="fa-solid fa-file-word" />
                          ) : (
                            <i className="fa-solid fa-file-pdf" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div
                            className="text-sm font-bold text-main truncate group-hover:text-primary transition-colors"
                            title={att.name}
                          >
                            {att.name}
                          </div>
                          <div className="text-xs text-muted mt-0.5">
                            {att.size || '1.8 MB'} • {att.date || document.date}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenFile(att)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface border border-border-subtle text-main hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                        title={`${t('documentPreview.openFile')} ${att.name}`}
                      >
                        <i className="fa-solid fa-arrow-down text-xs" />
                        <span>{t('documentPreview.openFile')}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               TAB 2: BẢN SỐ HÓA A4 / PDF VIEWER
               ───────────────────────────────────────────────────────────── */
            <div className="flex flex-col items-center">
              <div
                className="w-full max-w-[760px] bg-white text-slate-900 shadow-xl border border-slate-300 p-8 sm:p-12 transition-transform origin-top select-none font-serif"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  minHeight: '880px',
                }}
              >
                {/* Phần Header văn bản hành chính theo Nghị định 30/2020/NĐ-CP */}
                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-300 text-center font-sans">
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold tracking-tight uppercase text-slate-800">
                      {docMeta.place}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 mt-0.5">
                      {t('documentPreview.docNumberLabel')} {document.code}
                    </span>
                    <div className="w-16 h-0.5 bg-slate-400 mt-1" />
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-tight">
                      {t('documentPreview.nationalRepublic')}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                      {t('documentPreview.nationalMotto')}
                    </span>
                    <div className="w-24 h-0.5 bg-slate-400 mt-1" />
                    <span className="text-xs italic text-slate-600 mt-2">
                      {t('documentPreview.locationDate')} {document.date}
                    </span>
                  </div>
                </div>

                {/* Tiêu đề & Trích yếu văn bản */}
                <div className="text-center my-8">
                  <h3 className="text-base sm:text-lg font-bold uppercase text-slate-900 tracking-wide">
                    QUYẾT ĐỊNH / THÔNG BÁO VĂN BẢN
                  </h3>
                  <p className="text-sm font-semibold italic text-slate-700 mt-2 max-w-xl mx-auto">
                    V/v: {document.title}
                  </p>
                </div>

                {/* Khung bảng đặc tả 4 cột KET */}
                <div className="overflow-x-auto my-6 font-sans">
                  <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                        <th className="border border-slate-400 p-2.5 text-center w-16">
                          {t('documentPreview.colPart')}
                        </th>
                        <th className="border border-slate-400 p-2.5 text-left">
                          {t('documentPreview.colContent')}
                        </th>
                        <th className="border border-slate-400 p-2.5 text-left w-48">
                          {t('documentPreview.colObjective')}
                        </th>
                        <th className="border border-slate-400 p-2.5 text-center w-28">
                          {t('documentPreview.colStandard')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="border border-slate-300 p-2 text-center font-bold">1</td>
                        <td className="border border-slate-300 p-2 font-medium">{document.title}</td>
                        <td className="border border-slate-300 p-2 text-slate-700">
                          {t('documentPreview.row1Objective')}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-semibold text-emerald-700">
                          {t('documentPreview.row1Standard')}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-300 bg-slate-50/50">
                        <td className="border border-slate-300 p-2 text-center font-bold">2</td>
                        <td className="border border-slate-300 p-2">{t('documentPreview.row2Content')}</td>
                        <td className="border border-slate-300 p-2 text-slate-700">
                          {t('documentPreview.row2Objective')}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">{t('documentPreview.row2Standard')}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="border border-slate-300 p-2 text-center font-bold">3</td>
                        <td className="border border-slate-300 p-2">{t('documentPreview.row3Content')}</td>
                        <td className="border border-slate-300 p-2 text-slate-700">
                          {t('documentPreview.row3Objective')}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">{t('documentPreview.row3Standard')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Chân trang chữ ký & Con dấu số đỏ */}
                <div className="grid grid-cols-2 gap-6 mt-12 pt-6 font-sans">
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-bold">{t('documentPreview.recipients')}</p>
                    <p>- {t('documentPreview.recipientsBgd')}</p>
                    <p>- {t('documentPreview.recipientsDepts')}</p>
                    <p>- {t('documentPreview.recipientsArchive')}</p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <p className="text-xs font-bold uppercase text-slate-800">{docMeta.signerRole}</p>
                    <p className="text-xs italic text-slate-600">(Ký số, đóng dấu điện tử)</p>

                    {/* Con dấu đỏ điện tử */}
                    <div className="my-3 p-3 border-2 border-dashed border-red-500 rounded-xl bg-red-50/80 text-red-600 max-w-[220px]">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                        <i className="fa-solid fa-stamp text-sm" />
                        <span>{t('documentPreview.digitalSignature')}</span>
                      </div>
                      <p className="text-[11px] font-semibold mt-1">Ký bởi: {docMeta.signer}</p>
                      <p className="text-[10px] text-red-500/80 mt-0.5">
                        {t('documentPreview.signDate')} {document.date}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-slate-900 mt-1">{docMeta.signer}</p>
                  </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-200 pt-3">
                  Trang {currentPage} / {totalPages} · Mã xác thực hồ sơ số: {document.code}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer Modal (Theo đúng ảnh mẫu Nhóm 2) */}
        <div className="p-4 sm:px-6 bg-surface-subtle border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-secondary">
          <div className="truncate">
            <span>{t('documentPreview.createdBy')} </span>
            <span className="font-bold text-main">{docMeta.creator}</span>
            <span className="text-muted"> lúc {docMeta.createdAt}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-muted hidden md:inline">
              {t('documentPreview.updatedAt')} {docMeta.updatedAt}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-border-subtle text-main font-semibold text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={t('documentPreview.download')}
              >
                <i className="fa-solid fa-download text-xs" />
                <span>{t('documentPreview.download')}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-surface-hover hover:bg-border-subtle text-main font-bold text-sm transition-colors cursor-pointer"
              >
                {t('documentPreview.closeBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
