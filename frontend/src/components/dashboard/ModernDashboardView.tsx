import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ActivePageId } from '@app-types/navigation';
import { useTranslation } from '@i18n/translate';
import { Badge } from '@components/common';
import BirthdaysWidget, { BirthdayEmployee } from './BirthdaysWidget';
import DocumentPreviewModal from './DocumentPreviewModal';
import TaskDetailModal from './TaskDetailModal';

export interface TaskItem {
  id: string;
  title: string;
  due: string;
  status: 'processing' | 'completed' | 'overdue' | 'pending';
  statusLabel: string;
  variant: 'success' | 'warning' | 'info' | 'danger';
  assignee?: string;
  creator?: string;
  description?: string;
  createdDate?: string;
}

export interface DocumentAttachment {
  name: string;
  size: string;
  type?: 'pdf' | 'excel' | 'word' | 'docx' | 'xlsx' | string;
  format?: 'pdf' | 'docx' | 'xlsx';
  date?: string;
  url?: string;
}

export interface DocumentItem {
  code: string;
  title: string;
  date: string;
  id?: string | number;
  sender?: string;
  recipient?: string;
  arrivalNumber?: string | number;
  bookYear?: number | string;
  arrivalDate?: string;
  issuingPlace?: string;
  signer?: string;
  signerRole?: string;
  validityStatus?: 'valid' | 'expired' | 'partial';
  validityStatusLabel?: string;
  replacedBy?: string;
  note?: string;
  attachments?: DocumentAttachment[];
  creator?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceTemplateItem {
  code: string;
  title: string;
  format: string;
}

export interface ModernDashboardViewProps {
  onNavigate?: (page: ActivePageId) => void;
  incomingCount?: number;
  outgoingCount?: number;
  tasksCount?: number;
  incomingDocuments?: DocumentItem[];
  outgoingDocuments?: DocumentItem[];
  tasks?: TaskItem[];
  resources?: ResourceTemplateItem[];
  birthdays?: BirthdayEmployee[];
}

export default function ModernDashboardView({
  onNavigate = () => {},
  incomingCount = 0,
  outgoingCount = 0,
  tasksCount = 0,
  incomingDocuments = [],
  outgoingDocuments = [],
  tasks = [],
  resources = [],
  birthdays,
}: ModernDashboardViewProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState<'processing' | 'completed' | 'overdue' | 'pending'>('processing');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewType, setPreviewType] = useState<'incoming' | 'outgoing' | 'resource'>('incoming');
  const [previewList, setPreviewList] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateTarget = () => {
      const target = document.getElementById('top-subnav-slot');
      if (target) {
        setPortalTarget(target);
      }
    };
    updateTarget();
    const timer = setTimeout(updateTarget, 100);

    const scrollContainer = document.querySelector('.page-viewport');

    const handleScroll = () => {
      const scrollY = (scrollContainer ? scrollContainer.scrollTop : 0) || window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollY > 75);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleOpenPreview = (doc: DocumentItem, type: 'incoming' | 'outgoing' | 'resource', list: DocumentItem[]) => {
    setPreviewDoc(doc);
    setPreviewType(type);
    setPreviewList(list);
    const idx = list.findIndex((item) => item.code === doc.code);
    setPreviewIndex(idx >= 0 ? idx : 0);
  };

  const handleNextPreview = () => {
    if (previewIndex < previewList.length - 1) {
      const nextIdx = previewIndex + 1;
      setPreviewIndex(nextIdx);
      setPreviewDoc(previewList[nextIdx]);
    }
  };

  const handlePrevPreview = () => {
    if (previewIndex > 0) {
      const prevIdx = previewIndex - 1;
      setPreviewIndex(prevIdx);
      setPreviewDoc(previewList[prevIdx]);
    }
  };

  const filteredIncoming = useMemo(() => {
    if (!searchTerm.trim()) return incomingDocuments;
    const term = searchTerm.toLowerCase();
    return incomingDocuments.filter(
      (doc) => doc.code.toLowerCase().includes(term) || doc.title.toLowerCase().includes(term)
    );
  }, [incomingDocuments, searchTerm]);

  const filteredOutgoing = useMemo(() => {
    if (!searchTerm.trim()) return outgoingDocuments;
    const term = searchTerm.toLowerCase();
    return outgoingDocuments.filter(
      (doc) => doc.code.toLowerCase().includes(term) || doc.title.toLowerCase().includes(term)
    );
  }, [outgoingDocuments, searchTerm]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => task.status === taskFilter);
  }, [tasks, taskFilter]);

  const filteredResources = useMemo(() => {
    if (!searchTerm.trim()) return resources;
    const term = searchTerm.toLowerCase();
    return resources.filter(
      (r) => r.code.toLowerCase().includes(term) || r.title.toLowerCase().includes(term)
    );
  }, [resources, searchTerm]);

  return (
    <>
      {/* Thanh tìm kiếm thu nhỏ tự động neo bên cạnh breadcrumb 'Home' khi lăn chuột xuống */}
      {portalTarget &&
        createPortal(
          <div
            className={`transition-all duration-300 ease-out flex items-center w-full max-w-sm ml-2 ${
              isScrolled
                ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
            }`}
          >
            <div className="relative w-full flex items-center">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none" />
              <input
                ref={compactInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('dashboardDetails.compactSearchPlaceholder')}
                className="w-full pl-8 pr-7 py-1 h-8 rounded-lg border border-border-subtle bg-surface text-main text-xs shadow-2xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    compactInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs p-0.5 rounded-full hover:bg-surface-hover cursor-pointer transition-colors"
                  title="Xóa tìm kiếm nhanh"
                  aria-label="Xóa nội dung tìm kiếm nhanh"
                >
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              )}
            </div>
          </div>,
          portalTarget
        )}

      <div className="flex flex-col gap-6">
      {/* 1. Thanh tìm kiếm nhanh & Nút Đặt phòng họp đặt ngang hàng */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('dashboardDetails.searchPlaceholder')}
            className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-border-subtle bg-surface text-main text-base shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-main text-sm p-1.5 rounded-full hover:bg-surface-hover cursor-pointer transition-colors"
              title="Xóa tìm kiếm"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <i className="fa-solid fa-xmark text-base" />
            </button>
          )}
        </div>

        <button
          type="button"
          className="px-5 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-base flex items-center gap-2.5 shrink-0 border border-primary cursor-pointer shadow-xs transition-all hover:scale-[1.02]"
          onClick={() => onNavigate('meetings')}
          title="Chuyển tới phân hệ Đặt phòng họp"
        >
          <i className="fa-solid fa-calendar-plus text-white text-base" />
          <span className="whitespace-nowrap">{t('dashboardDetails.bookMeetingRoomBtn') || 'Đặt phòng họp'}</span>
        </button>
      </div>

      {/* 2. Modern KPI Deck (3 cards thẻ thống kê - Cỡ chữ to rõ ràng) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: VB Đến */}
        <div
          onClick={() => onNavigate('documents_incoming')}
          className="bg-surface border border-border-subtle rounded-2xl p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:border-primary-border transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center text-2xl shrink-0 shadow-xs">
            <i className="fa-solid fa-inbox" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-wider font-semibold text-muted">
              {t('dashboardDetails.incomingCard')} ({new Date().getFullYear()})
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-main mt-0.5">
              {incomingCount.toLocaleString()}
            </div>
            <div className="text-sm text-secondary mt-1.5">
              {incomingCount > 0 ? `+${incomingCount} ${t('dashboardDetails.newIncomingToday')}` : t('dashboardDetails.noIncomingToday')}
            </div>
          </div>
        </div>

        {/* Card 2: VB Đi */}
        <div
          onClick={() => onNavigate('documents_outgoing')}
          className="bg-surface border border-border-subtle rounded-2xl p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:border-success-border transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-success-subtle text-success flex items-center justify-center text-2xl shrink-0 shadow-xs">
            <i className="fa-solid fa-paper-plane" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-wider font-semibold text-muted">
              {t('dashboardDetails.outgoingCard')}
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-main mt-0.5">
              {outgoingCount.toLocaleString()}
            </div>
            <div className="text-sm text-secondary mt-1.5">
              {outgoingCount > 0 ? `+${outgoingCount} ${t('dashboardDetails.issuedToday')}` : t('dashboardDetails.noOutgoingToday')}
            </div>
          </div>
        </div>

        {/* Card 3: Nhiệm vụ */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-surface border border-border-subtle rounded-2xl p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:border-purple-border transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-subtle text-purple flex items-center justify-center text-2xl shrink-0 shadow-xs">
            <i className="fa-solid fa-list-check" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-wider font-semibold text-muted">
              {t('dashboardDetails.tasksCard')}
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-main mt-0.5">
              {tasksCount.toLocaleString()}
            </div>
            <div className="text-sm text-secondary mt-1.5">
              {tasksCount > 0 ? `${tasksCount} ${t('dashboardDetails.tasksToProcess')}` : t('dashboardDetails.noTasksPending')}
            </div>
          </div>
        </div>
      </div>

      {/* Dải Marquee Chúc Mừng Sinh Nhật CBNV */}
      <BirthdaysWidget birthdays={birthdays} />

      {/* 4. Hai Bảng Song Song: Văn Bản Đến & Văn Bản Đi (Cỡ chữ to rõ ràng) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Văn Bản Đến */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-base text-main flex items-center gap-2.5">
              <i className="fa-solid fa-inbox text-primary text-lg" />
              <span>{t('dashboardDetails.recentIncomingTitle')}</span>
            </div>
            <span className="text-sm text-muted">{t('dashboardDetails.updatedLatest')}</span>
          </div>

          <div className="flex-1 min-h-[160px] flex flex-col justify-start">
            {filteredIncoming.length === 0 ? (
              <div className="flex-1 p-8 text-center text-muted flex flex-col items-center justify-center">
                <i className="fa-solid fa-inbox text-3xl mb-2 opacity-30 text-primary" />
                <span className="text-sm font-medium">{t('dashboardDetails.noIncomingData')}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-left">
                      <th className="p-2.5">{t('dashboardDetails.docNumber')}</th>
                      <th className="p-2.5">{t('dashboardDetails.docSummary')}</th>
                      <th className="p-2.5 w-28">{t('dashboardDetails.docDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncoming.map((row, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleOpenPreview(row, 'incoming', filteredIncoming)}
                        className="border-b border-border-subtle hover:bg-primary-subtle/30 transition-colors cursor-pointer group"
                        title={t('documentPreview.clickToPreview') || 'Bấm để xem chi tiết văn bản'}
                      >
                        <td className="p-2.5 font-semibold text-primary group-hover:underline">
                          <div className="flex items-center justify-between">
                            <span>{row.code}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPreview(row, 'incoming', filteredIncoming);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-primary-subtle text-primary transition-all text-xs cursor-pointer"
                              title={t('documentPreview.clickToPreview') || 'Xem chi tiết văn bản'}
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square" />
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 text-main group-hover:text-primary transition-colors">{row.title}</td>
                        <td className="p-2.5 text-muted">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-border-subtle text-left">
            <button
              type="button"
              onClick={() => onNavigate('documents_incoming')}
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('dashboardDetails.viewMoreIncoming')}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>

        {/* Top Văn Bản Đi */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-base text-main flex items-center gap-2.5">
              <i className="fa-solid fa-paper-plane text-success text-lg" />
              <span>{t('dashboardDetails.recentOutgoingTitle')}</span>
            </div>
            <span className="text-sm text-muted">{t('dashboardDetails.updatedLatest')}</span>
          </div>

          <div className="flex-1 min-h-[160px] flex flex-col justify-start">
            {filteredOutgoing.length === 0 ? (
              <div className="flex-1 p-8 text-center text-muted flex flex-col items-center justify-center">
                <i className="fa-solid fa-paper-plane text-3xl mb-2 opacity-30 text-success" />
                <span className="text-sm font-medium">{t('dashboardDetails.noOutgoingData')}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-left">
                      <th className="p-2.5">{t('dashboardDetails.docNumber')}</th>
                      <th className="p-2.5">{t('dashboardDetails.docSummary')}</th>
                      <th className="p-2.5 w-28">{t('dashboardDetails.docDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutgoing.map((row, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleOpenPreview(row, 'outgoing', filteredOutgoing)}
                        className="border-b border-border-subtle hover:bg-success-subtle/30 transition-colors cursor-pointer group"
                        title={t('documentPreview.clickToPreview') || 'Bấm để xem chi tiết văn bản'}
                      >
                        <td className="p-2.5 font-semibold text-success group-hover:underline">
                          <div className="flex items-center justify-between">
                            <span>{row.code}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPreview(row, 'outgoing', filteredOutgoing);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-success-subtle text-success transition-all text-xs cursor-pointer"
                              title={t('documentPreview.clickToPreview') || 'Xem chi tiết văn bản'}
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square" />
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 text-main group-hover:text-success transition-colors">{row.title}</td>
                        <td className="p-2.5 text-muted">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-border-subtle text-left">
            <button
              type="button"
              onClick={() => onNavigate('documents_outgoing')}
              className="text-sm font-semibold text-success hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('dashboardDetails.viewMoreOutgoing')}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Hai Bảng Song Song: Nhiệm Vụ Được Giao & Tài Liệu Biểu Mẫu (Hàng dưới chia đôi - Chữ to rõ ràng) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cột Trái: Danh Sách Nhiệm Vụ Được Giao (Top 5) */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-base text-main flex items-center gap-2.5">
              <i className="fa-solid fa-list-check text-purple text-lg" />
              <span>{t('dashboardDetails.recentTasksTitle')}</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-sm font-semibold text-purple hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboardDetails.viewMoreTasks')}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {(
              [
                { id: 'processing', label: t('dashboardDetails.filterProcessing') },
                { id: 'completed', label: t('dashboardDetails.filterCompleted') },
                { id: 'overdue', label: t('dashboardDetails.filterOverdue') },
                { id: 'pending', label: t('dashboardDetails.filterPending') },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTaskFilter(item.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border border-border-subtle transition-colors cursor-pointer ${
                  taskFilter === item.id
                    ? 'bg-purple text-white border-purple'
                    : 'bg-surface-elevated text-secondary hover:text-main'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Task Rows or Clean Empty State */}
          <div className="flex-1 min-h-[160px] flex flex-col justify-start">
            {filteredTasks.length === 0 ? (
              <div className="flex-1 p-8 text-center text-muted flex flex-col items-center justify-center">
                <i className="fa-solid fa-list-check text-3xl mb-2 opacity-30 text-purple" />
                <span className="text-sm font-medium">{t('dashboardDetails.noTasksData')}</span>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {filteredTasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-hover transition-colors cursor-pointer text-sm group"
                    title="Bấm để xem chi tiết nhiệm vụ"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-semibold text-main group-hover:text-primary transition-colors truncate block">
                        {t.title}
                      </span>
                    </div>
                    <span className="text-muted text-xs shrink-0">{t.due}</span>
                    <div className="shrink-0 text-right">
                      <Badge variant={t.variant} size="sm">
                        {t.statusLabel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-border-subtle text-left">
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-sm font-semibold text-purple hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('dashboardDetails.viewMoreTasks')}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>

        {/* Cột Phải: Danh Sách Tài Liệu & Biểu Mẫu Mới Nhất (Top 5) - Nhóm 4 */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-base text-main flex items-center gap-2.5">
              <i className="fa-solid fa-file-lines text-primary text-lg" />
              <span>{t('dashboardDetails.recentResourcesTitle')}</span>
            </div>
            <span className="text-sm text-muted">{t('dashboardDetails.updatedLatest')}</span>
          </div>

          <div className="flex-1 min-h-[160px] flex flex-col justify-start">
            {filteredResources.length === 0 ? (
              <div className="flex-1 p-8 text-center text-muted flex flex-col items-center justify-center">
                <i className="fa-solid fa-file-lines text-3xl mb-2 opacity-30 text-primary" />
                <span className="text-sm font-medium">{t('dashboardDetails.noResourcesData')}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-left">
                      <th className="p-2.5">{t('dashboardDetails.resourceCode')}</th>
                      <th className="p-2.5">{t('dashboardDetails.resourceName')}</th>
                      <th className="p-2.5 w-24 text-center">{t('dashboardDetails.resourceFormat')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.slice(0, 5).map((row, idx) => {
                      const ext = (row.format || 'docx').toLowerCase();
                      const sanitizedCode = row.code.replace(/[/\\?%*:|"<>]/g, '_');
                      const resourceAsDoc: DocumentItem = {
                        code: row.code,
                        title: row.title,
                        date: '01/10/2026',
                        attachments: [
                          {
                            name: `${sanitizedCode}.${ext}`,
                            size: ext === 'docx' ? '145 KB' : ext === 'xlsx' ? '180 KB' : '2.1 MB',
                            date: '01/10/2026',
                            type: ext === 'docx' ? 'word' : ext === 'xlsx' ? 'excel' : 'pdf',
                            format: ext as any,
                          },
                        ],
                      };
                      const resourceDocsList: DocumentItem[] = filteredResources.slice(0, 5).map((r) => {
                        const rExt = (r.format || 'docx').toLowerCase();
                        const rCode = r.code.replace(/[/\\?%*:|"<>]/g, '_');
                        return {
                          code: r.code,
                          title: r.title,
                          date: '01/10/2026',
                          attachments: [
                            {
                              name: `${rCode}.${rExt}`,
                              size: rExt === 'docx' ? '145 KB' : rExt === 'xlsx' ? '180 KB' : '2.1 MB',
                              date: '01/10/2026',
                              type: rExt === 'docx' ? 'word' : rExt === 'xlsx' ? 'excel' : 'pdf',
                              format: rExt as any,
                            },
                          ],
                        };
                      });
                      return (
                        <tr
                          key={idx}
                          onClick={() => handleOpenPreview(resourceAsDoc, 'resource', resourceDocsList)}
                          className="border-b border-border-subtle hover:bg-purple-subtle/30 transition-colors cursor-pointer group"
                          title={t('documentPreview.clickToPreview') || 'Bấm để xem chi tiết biểu mẫu'}
                        >
                          <td className="p-2.5 font-semibold text-primary group-hover:underline">
                            <div className="flex items-center gap-1.5">
                              <i className="fa-solid fa-file-lines text-purple text-xs opacity-70 group-hover:opacity-100" />
                              <span>{row.code}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-main group-hover:text-primary transition-colors">{row.title}</td>
                          <td className="p-2.5 text-center">
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-primary-subtle text-primary uppercase">
                              {row.format}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-border-subtle text-left">
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('dashboardDetails.viewMoreResources')}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Xem Trước Văn Bản Số Hóa (PDF Reader) */}
      <DocumentPreviewModal
        key={previewDoc?.code || 'empty'}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        docType={previewType}
        onNext={handleNextPreview}
        onPrev={handlePrevPreview}
        hasNext={previewIndex < previewList.length - 1}
        hasPrev={previewIndex > 0}
        currentIndex={previewIndex}
        totalDocs={previewList.length}
      />

      {/* Modal Xem Chi Tiết Nhiệm Vụ Được Giao (Nhóm 6) */}
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onNavigateTasks={() => onNavigate('tasks')}
      />
    </div>
    </>
  );
}



