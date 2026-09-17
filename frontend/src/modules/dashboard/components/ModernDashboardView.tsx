import React, { useState, useMemo } from 'react';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';
import { Badge } from '../../../shared/components/ui';

export interface TaskItem {
  id: string;
  title: string;
  due: string;
  status: 'processing' | 'completed' | 'overdue' | 'pending';
  statusLabel: string;
  variant: 'success' | 'warning' | 'info' | 'danger';
}

export interface DocumentItem {
  code: string;
  title: string;
  date: string;
}

export interface ModernDashboardViewProps {
  onNavigate?: (page: ActivePageId) => void;
  incomingCount?: number;
  outgoingCount?: number;
  tasksCount?: number;
  incomingDocuments?: DocumentItem[];
  outgoingDocuments?: DocumentItem[];
  tasks?: TaskItem[];
}

export default function ModernDashboardView({
  onNavigate = () => {},
  incomingCount = 0,
  outgoingCount = 0,
  tasksCount = 0,
  incomingDocuments = [],
  outgoingDocuments = [],
  tasks = [],
}: ModernDashboardViewProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [taskFilter, setTaskFilter] = useState<'processing' | 'completed' | 'overdue' | 'pending'>('processing');

  const filteredIncoming = useMemo(() => {
    if (searchFilter === 'outgoing') return [];
    if (!searchTerm.trim()) return incomingDocuments;
    const term = searchTerm.toLowerCase();
    return incomingDocuments.filter(
      (doc) => doc.code.toLowerCase().includes(term) || doc.title.toLowerCase().includes(term)
    );
  }, [incomingDocuments, searchFilter, searchTerm]);

  const filteredOutgoing = useMemo(() => {
    if (searchFilter === 'incoming') return [];
    if (!searchTerm.trim()) return outgoingDocuments;
    const term = searchTerm.toLowerCase();
    return outgoingDocuments.filter(
      (doc) => doc.code.toLowerCase().includes(term) || doc.title.toLowerCase().includes(term)
    );
  }, [outgoingDocuments, searchFilter, searchTerm]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => task.status === taskFilter);
  }, [tasks, taskFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Welcome Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-subtle), var(--bg-surface))',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl font-extrabold text-main">
              {t('dashboardDetails.greeting')}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-subtle)',
                border: '1px solid var(--color-primary-border)',
                color: 'var(--color-primary)',
                fontWeight: 700,
              }}
            >
              {t('dashboardDetails.roleBadge')}
            </span>
          </div>
          <p className="text-secondary mt-1.5 text-sm">
            {t('dashboardDetails.leadDescription')}
          </p>
        </div>

        <div>
          <button
            type="button"
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px var(--color-primary-glow)',
            }}
            onClick={() => onNavigate('documents_incoming')}
          >
            <i className="fa-solid fa-plus" />
            <span>{t('dashboardDetails.receiveDocBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Modern Quick Search Widget */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <i className="fa-solid fa-magnifying-glass text-primary" />
          <span className="font-bold text-sm text-main">
            {t('dashboardDetails.quickSearchTitle')}
          </span>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSearchFilter('all')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'all' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('dashboardDetails.filterAll')}
            </button>
            <button
              type="button"
              onClick={() => setSearchFilter('incoming')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'incoming' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'incoming' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('dashboardDetails.filterIncoming')}
            </button>
            <button
              type="button"
              onClick={() => setSearchFilter('outgoing')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'outgoing' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'outgoing' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('dashboardDetails.filterOutgoing')}
            </button>
          </div>

          <div className="flex-1 min-w-[240px] relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập số ký hiệu, trích yếu nội dung văn bản..."
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
              }}
            />
            <i
              className="fa-solid fa-search"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <button
            type="button"
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
          >
            <i className="fa-solid fa-magnifying-glass" />
            <span>{t('dashboardDetails.searchBtn')}</span>
          </button>
        </div>
      </div>

      {/* 3. Modern KPI Deck (3 cards tương đồng giao diện cổ điển, zero mock data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: VB Đến */}
        <div
          onClick={() => onNavigate('documents_incoming')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-inbox" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-muted">
              {t('dashboardDetails.incomingCard')}
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-main mt-0.5">
              {incomingCount.toLocaleString()}
            </div>
            <div className="text-xs text-secondary mt-1">
              {incomingCount > 0 ? `+${incomingCount} văn bản mới trong ngày` : 'Chưa có phát sinh trong ngày'}
            </div>
          </div>
        </div>

        {/* Card 2: VB Đi */}
        <div
          onClick={() => onNavigate('documents_outgoing')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-success-subtle)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-paper-plane" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-muted">
              {t('dashboardDetails.outgoingCard')}
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-main mt-0.5">
              {outgoingCount.toLocaleString()}
            </div>
            <div className="text-xs text-secondary mt-1">
              {outgoingCount > 0 ? `+${outgoingCount} văn bản phát hành hôm nay` : 'Chưa có phát hành hôm nay'}
            </div>
          </div>
        </div>

        {/* Card 3: Nhiệm vụ */}
        <div
          onClick={() => onNavigate('tasks')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-purple-subtle)',
              color: 'var(--color-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-list-check" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-muted">
              {t('dashboardDetails.tasksCard')}
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-main mt-0.5">
              {tasksCount.toLocaleString()}
            </div>
            <div className="text-xs text-secondary mt-1">
              {tasksCount > 0 ? `${tasksCount} nhiệm vụ cần xử lý` : 'Không có nhiệm vụ cần xử lý'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Hai Bảng Song Song: Văn Bản Đến & Văn Bản Đi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Văn Bản Đến */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-sm text-main flex items-center gap-2">
              <i className="fa-solid fa-inbox text-primary" />
              <span>{t('dashboardDetails.recentIncomingTitle')}</span>
            </div>
            <span className="text-xs text-muted">Cập nhật: Mới nhất</span>
          </div>

          <div className="flex-1 min-h-[160px] flex flex-col justify-center">
            {filteredIncoming.length === 0 ? (
              <div className="p-8 text-center text-muted flex flex-col items-center justify-center">
                <i className="fa-solid fa-inbox text-3xl mb-2 opacity-30 text-primary" />
                <span className="text-xs font-medium">Chưa có dữ liệu văn bản đến</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-left">
                      <th className="p-2">{t('dashboardDetails.docNumber')}</th>
                      <th className="p-2">{t('dashboardDetails.docSummary')}</th>
                      <th className="p-2 w-24">{t('dashboardDetails.docDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncoming.map((row, idx) => (
                      <tr key={idx} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                        <td className="p-2 font-semibold text-primary">{row.code}</td>
                        <td className="p-2 text-main">{row.title}</td>
                        <td className="p-2 text-muted">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border-subtle text-left">
            <button
              type="button"
              onClick={() => onNavigate('documents_incoming')}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboardDetails.viewMoreIncoming')}</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </div>
        </div>

        {/* Top Văn Bản Đi */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-sm text-main flex items-center gap-2">
              <i className="fa-solid fa-paper-plane text-success" />
              <span>{t('dashboardDetails.recentOutgoingTitle')}</span>
            </div>
            <span className="text-xs text-muted">Cập nhật: Mới nhất</span>
          </div>

          <div className="flex-1 min-h-[160px] flex flex-col justify-center">
            {filteredOutgoing.length === 0 ? (
              <div className="p-8 text-center text-muted flex flex-col items-center justify-center">
                <i className="fa-solid fa-paper-plane text-3xl mb-2 opacity-30 text-success" />
                <span className="text-xs font-medium">Chưa có dữ liệu văn bản đi</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted text-left">
                      <th className="p-2">{t('dashboardDetails.docNumber')}</th>
                      <th className="p-2">{t('dashboardDetails.docSummary')}</th>
                      <th className="p-2 w-24">{t('dashboardDetails.docDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutgoing.map((row, idx) => (
                      <tr key={idx} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                        <td className="p-2 font-semibold text-success">{row.code}</td>
                        <td className="p-2 text-main">{row.title}</td>
                        <td className="p-2 text-muted">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border-subtle text-left">
            <button
              type="button"
              onClick={() => onNavigate('documents_outgoing')}
              className="text-xs font-semibold text-success hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboardDetails.viewMoreOutgoing')}</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Bảng Danh Sách Nhiệm Vụ (Clean Empty State) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="font-bold text-sm text-main flex items-center gap-2">
            <i className="fa-solid fa-list-check text-purple" />
            <span>{t('dashboardDetails.recentTasksTitle')}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="text-xs font-semibold text-purple hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{t('dashboardDetails.viewMoreTasks')}</span>
            <i className="fa-solid fa-arrow-right text-[10px]" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {(
            [
              { id: 'processing', label: 'Đang xử lý' },
              { id: 'completed', label: 'Đã hoàn thành' },
              { id: 'overdue', label: 'Quá hạn xử lý' },
              { id: 'pending', label: 'Đang chờ duyệt' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTaskFilter(item.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: taskFilter === item.id ? 'var(--color-purple)' : 'var(--bg-surface-elevated)',
                color: taskFilter === item.id ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Task Rows or Clean Empty State */}
        <div className="min-h-[120px] flex flex-col justify-center">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-muted flex flex-col items-center justify-center">
              <i className="fa-solid fa-list-check text-3xl mb-2 opacity-30 text-purple" />
              <span className="text-xs font-medium">Chưa có nhiệm vụ nào cần xử lý</span>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onNavigate('tasks')}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-hover transition-colors cursor-pointer text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-semibold text-main hover:text-primary transition-colors">
                      {t.title}
                    </span>
                  </div>
                  <span className="text-muted text-[11px] shrink-0">{t.due}</span>
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
      </div>
    </div>
  );
}
