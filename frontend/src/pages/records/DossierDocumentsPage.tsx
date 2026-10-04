import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError, apiClient } from '@lib/apiClient';
import { normalizePage, recordsService } from '@lib/recordsService';
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
import type { Dossier, EntityId } from '@app-types/records';

const PAGE_SIZE = 10;
const controlClass =
  'rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-subtle';

type DossierDocumentKind = 'vanbanden' | 'vanbandi' | 'vanbanmat';

interface DossierDocument {
  key: string;
  id: EntityId;
  document_type: DossierDocumentKind;
  so_hieu: string;
  trich_yeu: string;
  ngay_van_ban?: string | null;
  nam: number;
}

const badgeVariant: Record<DossierDocumentKind, 'info' | 'success' | 'danger'> = {
  vanbanden: 'info',
  vanbandi: 'success',
  vanbanmat: 'danger',
};

export default function DossierDocumentsPage() {
  const { dossierId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLang, t } = useTranslation();
  const stateDossier = (location.state as { dossier?: Dossier } | null)?.dossier;
  const [dossier, setDossier] = React.useState<Dossier | null>(stateDossier ?? null);
  const [items, setItems] = React.useState<DossierDocument[]>([]);
  const [count, setCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [year, setYear] = React.useState('');
  const [documentType, setDocumentType] = React.useState<DossierDocumentKind | ''>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!dossierId || dossier) return;
    recordsService.getDossier(dossierId).then(setDossier).catch(() => undefined);
  }, [dossierId, dossier]);

  React.useEffect(() => {
    if (!dossierId) {
      queueMicrotask(() => {
        setError(t('records.errors.missingDossier'));
        setIsLoading(false);
      });
      return undefined;
    }

    let active = true;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (year) params.set('year', year);
    if (documentType) params.set('type', documentType);
    if (page > 1) params.set('page', String(page));
    params.set('page_size', String(PAGE_SIZE));

    apiClient
      .get<unknown>(`/api/records/dossiers/${dossierId}/documents/?${params.toString()}`)
      .then((response) => normalizePage<DossierDocument>(response))
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setCount(result.count);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 503) {
          setError(t('records.errors.sharedSchemaUnavailable'));
          return;
        }
        const detail =
          requestError instanceof ApiError
            ? requestError.data?.detail || requestError.data?.message || requestError.data?.error
            : null;
        setError(String(detail || t('records.errors.loadDocuments')));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dossierId, search, year, documentType, page, reloadKey, t]);

  const beginReload = () => {
    setIsLoading(true);
    setError(null);
  };

  const years = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, index) => current - index);
  }, []);

  const displayDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US').format(date);
  };

  const typeLabel = (type: DossierDocumentKind) => t(`records.documentKinds.${type}`);

  const clearFilters = () => {
    beginReload();
    setSearchInput('');
    setSearch('');
    setYear('');
    setDocumentType('');
    setPage(1);
  };

  return (
    <section className="space-y-5" aria-labelledby="dossier-documents-title">
      <div>
        <button
          type="button"
          className="mb-2 cursor-pointer text-sm font-semibold text-primary hover:underline"
          onClick={() => navigate(`/records/${dossierId}/document-types`, { state: { dossier } })}
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          {t('records.documents.back')}
        </button>
        <h1 id="dossier-documents-title" className="m-0 text-2xl font-bold text-main">
          {t('records.documents.title')}
        </h1>
        <p className="m-0 mt-1 text-sm text-secondary">
          {t('records.common.dossier')}:{' '}
          <strong className="text-main">{dossier?.ten_ho_so ?? `#${dossierId}`}</strong>
          {dossier?.so_ky_hieu && (
            <Badge variant="secondary" className="ml-2">
              {dossier.so_ky_hieu}
            </Badge>
          )}
        </p>
        <p className="m-0 mt-2 text-xs text-muted">{t('records.documents.readOnlyNote')}</p>
      </div>

      <Card>
        <form
          className="grid gap-3 border-b border-border-subtle p-4 lg:grid-cols-[minmax(16rem,1fr)_10rem_13rem_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            beginReload();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <label className="relative">
            <span className="sr-only">{t('records.documents.searchLabel')}</span>
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className={`${controlClass} w-full pl-9`}
              placeholder={t('records.documents.searchPlaceholder')}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <label>
            <span className="sr-only">{t('records.filters.year')}</span>
            <select
              className={`${controlClass} w-full`}
              value={year}
              onChange={(event) => {
                beginReload();
                setYear(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('records.filters.allYears')}</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">{t('records.filters.documentType')}</span>
            <select
              className={`${controlClass} w-full`}
              value={documentType}
              onChange={(event) => {
                beginReload();
                setDocumentType(event.target.value as DossierDocumentKind | '');
                setPage(1);
              }}
            >
              <option value="">{t('records.filters.allDocumentTypes')}</option>
              <option value="vanbanden">{t('records.documentKinds.vanbanden')}</option>
              <option value="vanbandi">{t('records.documentKinds.vanbandi')}</option>
              <option value="vanbanmat">{t('records.documentKinds.vanbanmat')}</option>
            </select>
          </label>

          <Button type="submit" variant="secondary" icon="fa-filter">
            {t('records.actions.filter')}
          </Button>
          {(search || year || documentType) && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
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
              <p className="mt-1 max-w-2xl text-sm text-secondary">{error}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon="fa-rotate-right"
              onClick={() => {
                beginReload();
                setReloadKey((value) => value + 1);
              }}
            >
              {t('records.actions.retry')}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-5" aria-label={t('records.documents.loading')}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-surface-elevated" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-2xl text-primary">
              <i className="fa-solid fa-file-circle-xmark" />
            </span>
            <div>
              <h2 className="m-0 text-base font-bold text-main">{t('records.documents.emptyTitle')}</h2>
              <p className="mt-1 text-sm text-secondary">{t('records.documents.emptyDescription')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">{t('records.table.index')}</TableHead>
                    <TableHead>{t('records.documents.reference')}</TableHead>
                    <TableHead>{t('records.documents.summary')}</TableHead>
                    <TableHead>{t('records.documents.documentDate')}</TableHead>
                    <TableHead>{t('records.documents.kind')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.key}>
                      <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap font-semibold text-main">{item.so_hieu}</span>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-2xl text-secondary">{item.trich_yeu}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{displayDate(item.ngay_van_ban)}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant[item.document_type]}>
                          {typeLabel(item.document_type)}
                        </Badge>
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
              onChange={(value) => {
                beginReload();
                setPage(value);
              }}
            />
          </>
        )}
      </Card>
    </section>
  );
}
