import { useEffect, useMemo, useState } from 'react';
import { apiClient, ApiError } from '@lib/apiClient';
import { t as translate, useTranslation } from '@i18n/translate';

export interface BirthdayStaff {
  id: number;
  ho_ten: string;
  ngay: number;
  thang: number;
  chuc_vu: string;
  don_vi: string;
}

export interface CalendarApiResponse {
  success: boolean;
  month: number;
  year: number;
  days_in_month: number;
  total_staff: number;
  days: Record<string, number>;
}

export interface DayApiResponse {
  success: boolean;
  date: string;
  day: number;
  month: number;
  year: number;
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  employees: BirthdayStaff[];
}

interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

interface LoadState<T> {
  key: string;
  data: T | null;
  error: string | null;
}

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function projectToday(): SelectedDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: number('year'), month: number('month'), day: number('day') };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function BirthdayPage() {
  const { t } = useTranslation();
  const today = useMemo(() => projectToday(), []);
  const [selected, setSelected] = useState<SelectedDate>(today);
  const [dayPage, setDayPage] = useState(1);
  const [calendarRetry, setCalendarRetry] = useState(0);
  const [dayRetry, setDayRetry] = useState(0);
  const [calendarState, setCalendarState] = useState<LoadState<CalendarApiResponse>>({
    key: '', data: null, error: null,
  });
  const [dayState, setDayState] = useState<LoadState<DayApiResponse>>({
    key: '', data: null, error: null,
  });

  const { day, month, year } = selected;
  const calendarKey = `${year}-${month}-${calendarRetry}`;
  const dayKey = `${year}-${month}-${day}-${dayPage}-${dayRetry}`;
  const calendarLoading = calendarState.key !== calendarKey;
  const dayLoading = dayState.key !== dayKey;
  const calendarData = calendarLoading ? null : calendarState.data;
  const dayData = dayLoading ? null : dayState.data;
  const calendarError = calendarLoading ? null : calendarState.error;
  const dayError = dayLoading ? null : dayState.error;

  useEffect(() => {
    let active = true;
    apiClient.get<CalendarApiResponse>(`/api/birthdays/calendar/?month=${month}&year=${year}`)
      .then((data) => {
        if (active) setCalendarState({ key: calendarKey, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) setCalendarState({ key: calendarKey, data: null, error: errorMessage(error, translate('birthdayPage.calendarError')) });
      });
    return () => { active = false; };
  }, [calendarKey, month, year]);

  useEffect(() => {
    let active = true;
    apiClient.get<DayApiResponse>(
      `/api/birthdays/day/?month=${month}&day=${day}&year=${year}&page=${dayPage}&page_size=10`
    )
      .then((data) => {
        if (active) setDayState({ key: dayKey, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) setDayState({ key: dayKey, data: null, error: errorMessage(error, translate('birthdayPage.dayError')) });
      });
    return () => { active = false; };
  }, [dayKey, day, month, year, dayPage]);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const offset = (firstWeekday + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    return [
      ...Array<null>(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [month, year]);

  const selectDate = (date: SelectedDate) => {
    setSelected(date);
    setDayPage(1);
  };

  const changeMonth = (step: -1 | 1) => {
    const next = new Date(year, month - 1 + step, 1);
    const nextYear = next.getFullYear();
    if (nextYear >= 1900 && nextYear <= 2100) {
      selectDate({ day: 1, month: next.getMonth() + 1, year: nextYear });
    }
  };

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">🎂 {t('birthdayPage.title')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('birthdayPage.description')}</p>
        </div>
        <button
          type="button"
          onClick={() => selectDate(today)}
          className="rounded-xl bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {t('birthdayPage.today')} ({today.day}/{today.month})
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section aria-label={t('birthdayPage.calendarLabel')} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changeMonth(-1)} disabled={year === 1900 && month === 1}
                aria-label={t('birthdayPage.previousMonth')} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700">◀</button>
              <h2 className="min-w-36 text-center text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {t('birthdayPage.monthYear', { month: String(month), year: String(year) })}
              </h2>
              <button type="button" onClick={() => changeMonth(1)} disabled={year === 2100 && month === 12}
                aria-label={t('birthdayPage.nextMonth')} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700">▶</button>
            </div>
            {calendarData && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('birthdayPage.total', { count: String(calendarData.total_staff) })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 border-b border-slate-100 py-1 text-center text-xs font-semibold text-slate-500 dark:border-slate-700">
            {WEEKDAY_KEYS.map((key) => <span key={key}>{t(`birthdayPage.weekdays.${key}`)}</span>)}
          </div>

          {calendarLoading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500" role="status">{t('birthdayPage.calendarLoading')}</div>
          ) : calendarError ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center" role="alert">
              <p className="text-sm text-red-700 dark:text-red-300">{calendarError}</p>
              <button type="button" onClick={() => setCalendarRetry((value) => value + 1)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700">{t('birthdayPage.retry')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarCells.map((cell, index) => cell === null ? (
                <span key={`empty-${index}`} aria-hidden="true" className="h-12 sm:h-16" />
              ) : (
                <button
                  key={cell} type="button" onClick={() => selectDate({ day: cell, month, year })}
                  aria-label={t('birthdayPage.selectDay', { day: String(cell), month: String(month), year: String(year) })}
                  aria-pressed={cell === day}
                  className={`flex h-12 min-w-0 flex-col items-start justify-between rounded-lg border p-1 text-left transition sm:h-16 sm:rounded-xl sm:p-1.5 ${
                    cell === day
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : cell === today.day && month === today.month && year === today.year
                        ? 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950/20 dark:text-pink-300'
                        : 'border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <span className="text-xs font-bold">{cell}</span>
                  {(calendarData?.days[String(cell)] ?? 0) > 0 && (
                    <span className="self-end rounded-full bg-pink-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white sm:px-1.5"
                      title={t('birthdayPage.birthdayCount', { count: String(calendarData?.days[String(cell)] ?? 0) })}>
                      🎂 {calendarData?.days[String(cell)]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <span>🩷 {t('birthdayPage.today')}</span>
            <span>🔵 {t('birthdayPage.selected')}</span>
            <span>🎂 {t('birthdayPage.hasBirthday')}</span>
          </div>
        </section>

        <section aria-label={t('birthdayPage.detailsLabel')} className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5 lg:col-span-5">
          <div>
            <div className="border-b border-slate-100 pb-3 dark:border-slate-700">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('birthdayPage.selectedDate', { day: String(day), month: String(month), year: String(year) })}
              </h2>
              {dayData && <p className="text-xs text-slate-500 dark:text-slate-400">{t('birthdayPage.staffCount', { count: String(dayData.total) })}</p>}
            </div>

            {dayLoading ? (
              <div className="py-12 text-center text-sm text-slate-500" role="status">{t('birthdayPage.dayLoading')}</div>
            ) : dayError ? (
              <div className="space-y-3 py-12 text-center" role="alert">
                <p className="text-sm text-red-700 dark:text-red-300">{dayError}</p>
                <button type="button" onClick={() => setDayRetry((value) => value + 1)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700">{t('birthdayPage.retry')}</button>
              </div>
            ) : dayData?.employees.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <span className="mb-2 block text-4xl" aria-hidden="true">🌿</span>
                <p className="text-sm">{t('birthdayPage.emptyDay')}</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {dayData?.employees.map((staff) => (
                  <li key={staff.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-700 dark:bg-slate-900/40">
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {staff.ho_ten.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{staff.ho_ten}</p>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300">{staff.chuc_vu}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{staff.don_vi}</p>
                      <p className="mt-0.5 text-xs font-semibold text-pink-600 dark:text-pink-400">
                        {t('birthdayPage.birthDayMonth', { day: String(staff.ngay), month: String(staff.thang) })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {dayData && dayData.total_pages > 1 && (
            <nav aria-label={t('birthdayPage.paginationLabel')} className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <button type="button" disabled={!dayData.has_previous} onClick={() => setDayPage(dayData.page - 1)}
                className="rounded bg-slate-100 px-2.5 py-1 disabled:opacity-40 dark:bg-slate-700">{t('birthdayPage.previousPage')}</button>
              <span>{t('birthdayPage.pageCount', { page: String(dayData.page), total: String(dayData.total_pages) })}</span>
              <button type="button" disabled={!dayData.has_next} onClick={() => setDayPage(dayData.page + 1)}
                className="rounded bg-slate-100 px-2.5 py-1 disabled:opacity-40 dark:bg-slate-700">{t('birthdayPage.nextPage')}</button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
