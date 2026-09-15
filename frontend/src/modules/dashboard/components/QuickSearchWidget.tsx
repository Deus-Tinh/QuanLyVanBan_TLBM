import React from 'react';
import { useTranslation } from '../../../shared/locales/i18n';

interface QuickSearchWidgetProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchFilter: 'all' | 'incoming' | 'outgoing';
  setSearchFilter: (filter: 'all' | 'incoming' | 'outgoing') => void;
  onSearch: () => void;
}

export default function QuickSearchWidget({
  searchTerm,
  setSearchTerm,
  searchFilter,
  setSearchFilter,
  onSearch,
}: QuickSearchWidgetProps) {
  const { t } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
            {t('dashboardDetails.quickSearchTitle')}
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-subtle)',
              border: '1px solid var(--color-primary-border)',
              color: 'var(--color-primary)',
              fontWeight: 600,
            }}
          >
            Mock Filter
          </span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-warning-subtle)',
            border: '1px solid var(--color-warning-border)',
            color: 'var(--color-warning-text)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" />
          {t('common.group1Developing')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
              color: searchFilter === 'all' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
              color: searchFilter === 'incoming' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
              color: searchFilter === 'outgoing' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t('dashboardDetails.filterOutgoing')}
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 'min(100%, 240px)', position: 'relative' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('dashboardDetails.searchPlaceholder')}
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
          onClick={onSearch}
          style={{
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: '#fff',
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
  );
}
