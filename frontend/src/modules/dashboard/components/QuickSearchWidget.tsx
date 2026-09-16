import React from 'react';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge, Button } from '../../../shared/components/ui';

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
    <Card className="p-5 sm:p-6">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-magnifying-glass text-primary" />
          <span className="font-bold text-sm text-main">
            {t('dashboardDetails.quickSearchTitle')}
          </span>
          <Badge variant="primary" size="sm">
            Mock Filter
          </Badge>
        </div>
        <Badge variant="warning" size="sm">
          <i className="fa-solid fa-triangle-exclamation mr-1" />
          {t('common.group1Developing')}
        </Badge>
      </div>

      <div className="flex gap-2.5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSearchFilter('all')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-all duration-fast cursor-pointer ${
              searchFilter === 'all'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-elevated text-secondary border-border-subtle hover:bg-surface-hover hover:text-main'
            }`}
          >
            {t('dashboardDetails.filterAll')}
          </button>
          <button
            type="button"
            onClick={() => setSearchFilter('incoming')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-all duration-fast cursor-pointer ${
              searchFilter === 'incoming'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-elevated text-secondary border-border-subtle hover:bg-surface-hover hover:text-main'
            }`}
          >
            {t('dashboardDetails.filterIncoming')}
          </button>
          <button
            type="button"
            onClick={() => setSearchFilter('outgoing')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-all duration-fast cursor-pointer ${
              searchFilter === 'outgoing'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-elevated text-secondary border-border-subtle hover:bg-surface-hover hover:text-main'
            }`}
          >
            {t('dashboardDetails.filterOutgoing')}
          </button>
        </div>

        <div className="flex-1 min-w-[min(100%,240px)] relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('dashboardDetails.searchPlaceholder')}
            className="w-full pl-9 pr-3.5 py-2 rounded-md border border-border-subtle bg-surface-elevated text-main text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-fast placeholder:text-muted"
          />
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs" />
        </div>

        <Button
          variant="primary"
          size="md"
          icon="fa-magnifying-glass"
          onClick={onSearch}
        >
          {t('dashboardDetails.searchBtn')}
        </Button>
      </div>
    </Card>
  );
}
