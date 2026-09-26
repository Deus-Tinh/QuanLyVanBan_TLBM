import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { apiClient } from '@lib/apiClient';
import { setLanguage } from '@i18n/translate';
import BirthdayPage, { type CalendarApiResponse, type DayApiResponse } from './BirthdayPage';

const calendar: CalendarApiResponse = {
  success: true,
  month: 5,
  year: 2026,
  days_in_month: 31,
  total_staff: 1,
  days: { '12': 1 },
};

const emptyDay: DayApiResponse = {
  success: true,
  date: '12/05/2026',
  day: 12,
  month: 5,
  year: 2026,
  total: 0,
  page: 1,
  total_pages: 1,
  has_next: false,
  has_previous: false,
  employees: [],
};

describe('BirthdayPage', () => {
  beforeEach(() => {
    setLanguage('vi');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading states while both requests are pending', () => {
    vi.spyOn(apiClient, 'get').mockImplementation(() => new Promise(() => {}));
    render(<BirthdayPage />);

    expect(screen.getByText('Đang tải lịch sinh nhật...')).toBeInTheDocument();
    expect(screen.getByText('Đang tải danh sách sinh nhật...')).toBeInTheDocument();
  });

  it('shows calendar counts and only permitted staff fields', async () => {
    const day: DayApiResponse = {
      ...emptyDay,
      total: 1,
      employees: [{
        id: 7,
        ho_ten: 'Nguyễn Văn Minh',
        ngay: 12,
        thang: 5,
        chuc_vu: 'Chuyên viên',
        don_vi: 'Văn phòng',
      }],
    };
    vi.spyOn(apiClient, 'get').mockImplementation(async (url) =>
      (url.includes('/calendar/') ? calendar : day) as never
    );
    render(<BirthdayPage />);

    expect(await screen.findByText('Nguyễn Văn Minh')).toBeInTheDocument();
    expect(screen.getByText('Ngày sinh nhật: 12/5')).toBeInTheDocument();
    expect(screen.getByTitle('1 cán bộ nhân viên có sinh nhật')).toBeInTheDocument();
    expect(screen.queryByText(/Gửi thiệp|Gửi email tự động/)).not.toBeInTheDocument();
  });

  it('distinguishes an empty day from a failed day request and retries', async () => {
    let dayAttempts = 0;
    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url.includes('/calendar/')) return calendar as never;
      dayAttempts += 1;
      if (dayAttempts === 1) throw new Error('Temporary failure');
      return emptyDay as never;
    });
    render(<BirthdayPage />);

    expect(await screen.findByText('Không thể tải danh sách sinh nhật theo ngày.')).toBeInTheDocument();
    expect(screen.queryByText('Không có cán bộ nhân viên nào sinh vào ngày này.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Không có cán bộ nhân viên nào sinh vào ngày này.')).toBeInTheDocument();
    expect(dayAttempts).toBe(2);
  });

  it('shows a calendar error and reloads the monthly counts', async () => {
    let calendarAttempts = 0;
    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url.includes('/day/')) return emptyDay as never;
      calendarAttempts += 1;
      if (calendarAttempts === 1) throw new Error('Temporary failure');
      return calendar as never;
    });
    render(<BirthdayPage />);

    expect(await screen.findByText('Không thể tải lịch sinh nhật.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByTitle('1 cán bộ nhân viên có sinh nhật')).toBeInTheDocument();
    expect(calendarAttempts).toBe(2);
  });

  it('loads the next page from the day endpoint', async () => {
    const firstPage: DayApiResponse = {
      ...emptyDay,
      total: 11,
      total_pages: 2,
      has_next: true,
      employees: [{ id: 1, ho_ten: 'Người đầu', ngay: 12, thang: 5, chuc_vu: 'Nhân viên', don_vi: 'Đơn vị A' }],
    };
    const secondPage: DayApiResponse = {
      ...firstPage,
      page: 2,
      has_next: false,
      has_previous: true,
      employees: [{ id: 2, ho_ten: 'Người sau', ngay: 12, thang: 5, chuc_vu: 'Nhân viên', don_vi: 'Đơn vị B' }],
    };
    const get = vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url.includes('/calendar/')) return calendar as never;
      return (url.includes('page=2') ? secondPage : firstPage) as never;
    });
    render(<BirthdayPage />);

    expect(await screen.findByText('Người đầu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(await screen.findByText('Người sau')).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledWith(expect.stringContaining('page=2&page_size=10')));
  });

  it('requests the adjacent months and the selected day', async () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric', day: 'numeric',
    }).formatToParts(new Date());
    const todayYear = Number(parts.find((part) => part.type === 'year')?.value);
    const todayMonth = Number(parts.find((part) => part.type === 'month')?.value);
    const next = new Date(todayYear, todayMonth, 1);
    const nextMonth = next.getMonth() + 1;
    const nextYear = next.getFullYear();
    const get = vi.spyOn(apiClient, 'get').mockImplementation(async (url) =>
      (url.includes('/calendar/') ? calendar : emptyDay) as never
    );
    render(<BirthdayPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Tháng sau' }));
    await waitFor(() => expect(get).toHaveBeenCalledWith(
      `/api/birthdays/calendar/?month=${nextMonth}&year=${nextYear}`
    ));
    expect(screen.getByText(`Tháng ${nextMonth} / ${nextYear}`)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: `Chọn ngày 13/${nextMonth}/${nextYear}` }));
    await waitFor(() => expect(get).toHaveBeenCalledWith(
      `/api/birthdays/day/?month=${nextMonth}&day=13&year=${nextYear}&page=1&page_size=10`
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Tháng trước' }));
    expect(screen.getByText(`Tháng ${todayMonth} / ${todayYear}`)).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledWith(
      `/api/birthdays/day/?month=${todayMonth}&day=1&year=${todayYear}&page=1&page_size=10`
    ));
  });
});
