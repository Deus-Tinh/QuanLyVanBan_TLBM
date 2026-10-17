import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@lib/apiClient';
import { recordsService } from '@lib/recordsService';
import { useTranslation } from '@i18n/translate';
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/common';
import Pagination from '@components/records/Pagination';
import DocumentDestinationDialog from '@components/records/DocumentDestinationDialog';
import type { Dossier, DocumentType } from '@app-types/records';

const PAGE_SIZE = 10;
const controlClass =
  'rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-subtle';

export default function DocumentTypesPage() {
  const { dossierId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLang, t } = useTranslation();
  const stateDossier = (location.state as { dossier?: Dossier } | null)?.dossier;
  const [dossier, setDossier] = React.useState<Dossier | null>(stateDossier ?? null);
  const [items, setItems] = React.useState<DocumentType[]>([]);
  const [count, setCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [year, setYear] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [selectedCategory, setSelectedCategory] = React.useState<DocumentType | null>(null);
  const closeDestination = React.useCallback(() => setSelectedCategory(null), []);

  React.useEffect(() => {
    if (!dossierId) return;
    let active = true;
    recordsService.getDossier(dossierId).then((value) => { if (active) setDossier(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [dossierId]);

  React.useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    const request = dossierId
      ? recordsService.listDocumentTypes(dossierId, { search, year, page, pageSize: PAGE_SIZE })
      : recordsService.listDocumentTypeCatalog({ search, year, page, pageSize: PAGE_SIZE });
    request
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setCount(result.count);
      })
      .catch((requestError) => {
        if (!active) return;
        const detail =
          requestError instanceof ApiError
            ? requestError.data?.detail || requestError.data?.message || requestError.data?.error
            : null;
        setError(String(detail || t('records.errors.loadDocumentTypes')));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dossierId, search, year, page, reloadKey, t]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== search) {
        setPage(1);
        setSearch(trimmed);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const handleClearSearch = () => {
    setSearchInput('');
    if (search !== '') {
      setPage(1);
      setSearch('');
    }
  };

  const years = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, index) => current - index);
  }, []);

  const displayDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US').format(date);
  };


  return (
    <section className="space-y-5" aria-labelledby="document-types-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            className="mb-2 cursor-pointer text-sm font-semibold text-primary hover:underline"
            onClick={() => navigate('/records')}
          >
            <i className="fa-solid fa-arrow-left mr-2" />
            {t('records.documentTypes.back')}
          </button>
          <h1 id="document-types-title" className="m-0 text-2xl font-bold text-main">
            {t('records.documentTypes.title')}
          </h1>
          {dossierId && <p className="m-0 mt-1 text-sm text-secondary">
            {t('records.common.dossier')}: <strong>{dossier?.ten_ho_so ?? `#${dossierId}`}</strong>
            {dossier?.so_ky_hieu && <Badge variant="secondary" className="ml-2">{dossier.so_ky_hieu}</Badge>}
          </p>}
          <p className="m-0 mt-2 text-xs text-muted">
            {t('records.documentTypes.readOnlyNote')}
          </p>
        </div>

      </div>

      <Card>
        <form
          className="flex flex-col gap-3 border-b border-border-subtle p-4 md:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = searchInput.trim();
            if (search !== trimmed) {
              setPage(1);
              setSearch(trimmed);
            }
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">{t('records.documentTypes.searchLabel')}</span>
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              className={`${controlClass} w-full pl-9 ${searchInput ? 'pr-8' : ''}`}
              placeholder={t('records.documentTypes.searchPlaceholder')}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent p-0 text-muted transition hover:text-main"
                onClick={handleClearSearch}
                aria-label={t('records.actions.reset')}
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            )}
          </label>
          <select
            className={`${controlClass} w-full md:w-40`}
            value={year}
            onChange={(event) => {
              const nextYear = event.target.value;
              if (nextYear !== year) {
                setYear(nextYear);
                setPage(1);
              }
            }}
            aria-label={t('records.filters.year')}
          >
            <option value="">{t('records.filters.allYears')}</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" icon="fa-filter">
            {t('records.actions.filter')}
          </Button>
          {(search || year) && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setYear('');
                setPage(1);
              }}
            >
              {t('records.actions.reset')}
            </Button>
          )}
        </form>

        {error ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center" role="alert">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle text-xl text-danger">
              <i className="fa-solid fa-triangle-exclamation" />
            </span>
            <div>
              <h2 className="m-0 text-base font-bold text-main">{t('records.errors.title')}</h2>
              <p className="mt-1 text-sm text-secondary">{error}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon="fa-rotate-right"
              onClick={() => {
                setReloadKey((value) => value + 1);
              }}
            >
              {t('records.actions.retry')}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-5" aria-label={t('records.documentTypes.loading')}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-surface-elevated" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-2xl text-primary">
              <i className="fa-solid fa-folder-open" />
            </span>
            <div>
              <h2 className="m-0 text-base font-bold text-main">
                {t('records.documentTypes.emptyTitle')}
              </h2>
              <p className="mt-1 text-sm text-secondary">
                {t('records.documentTypes.emptyDescription')}
              </p>
            </div>

          </div>
        ) : (
          <>
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">{t('records.table.index')}</TableHead>
                    <TableHead>{t('records.documentTypes.name')}</TableHead>
                    {!dossierId && <TableHead>{t('records.common.dossier')}</TableHead>}
                    <TableHead>{t('records.table.createdDate')}</TableHead>
                    <TableHead>{t('records.table.note')}</TableHead>
                    <TableHead className="text-right">{t('records.table.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedCategory(item)}>
                      <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                      <TableCell>
                        <button type="button" className="cursor-pointer text-left font-semibold text-primary hover:underline"
                          onClick={(event) => { event.stopPropagation(); setSelectedCategory(item); }}>{item.ten_loai}</button>
                      </TableCell>
                      {!dossierId && <TableCell>{item.ten_ho_so || `#${typeof item.ho_so === 'object' ? item.ho_so.id : item.ho_so}`}</TableCell>}
                      <TableCell className="whitespace-nowrap">{displayDate(item.ngay_lap)}</TableCell>
                      <TableCell>
                        <span className="block max-w-md truncate text-secondary">
                          {item.ghi_chu || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon="fa-folder-open"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedCategory(item);
                          }}
                        >
                          {t('records.actions.viewDocuments')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              count={count}
              onChange={(value) => setPage(value)}
            />
          </>
        )}
      </Card>
      {selectedCategory && <DocumentDestinationDialog key={String(selectedCategory.id)} category={selectedCategory}
        onClose={closeDestination} onNavigate={(destination) => navigate(destination)} />}
    </section>
  );
}
