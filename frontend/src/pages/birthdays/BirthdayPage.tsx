import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { apiClient, ApiError } from '@lib/apiClient';
import { useTranslation } from '@i18n/translate';

export interface BirthdayStaff {
  id: number;
  ho_ten: string;
  full_name: string;
  username: string;
  ngay: number;
  day: number;
  thang: number;
  month: number;
  birth_day_month: string;
  chuc_vu: string;
  position: string;
  don_vi: string;
  department: string;
  email: string;
  phone: string;
  avatar_url?: string;
  is_today: boolean;
  wishes_count: number;
}

export interface CalendarApiResponse {
  success: boolean;
  month: number;
  year: number;
  days_in_month: number;
  total_staff: number;
  days: Record<string, BirthdayStaff[]>;
  employees: BirthdayStaff[];
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

export default function BirthdayPage() {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const [calendarData, setCalendarData] = useState<CalendarApiResponse | null>(null);
  const [dayStaffList, setDayStaffList] = useState<BirthdayStaff[]>([]);
  const [dayPage, setDayPage] = useState<number>(1);
  const [dayTotalPages, setDayTotalPages] = useState<number>(1);
  const [dayTotal, setDayTotal] = useState<number>(0);

  const [isLoadingCalendar, setIsLoadingCalendar] = useState<boolean>(true);
  const [isLoadingDay, setIsLoadingDay] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal gửi lời chúc
  const [selectedStaffForWish, setSelectedStaffForWish] = useState<BirthdayStaff | null>(null);
  const [wishMessage, setWishMessage] = useState<string>('');
  const [cardTemplate, setCardTemplate] = useState<string>('golden');
  const [isSubmittingWish, setIsSubmittingWish] = useState<boolean>(false);
  const [wishFeedback, setWishFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin trigger job state
  const [isTriggeringJob, setIsTriggeringJob] = useState<boolean>(false);
  const [jobFeedback, setJobFeedback] = useState<string | null>(null);

  // Lấy dữ liệu lịch theo tháng
  const fetchCalendar = async (month: number, year: number) => {
    setIsLoadingCalendar(true);
    setError(null);
    try {
      const res = await apiClient.get<CalendarApiResponse>(`/api/birthdays/calendar/?month=${month}&year=${year}`);
      setCalendarData(res);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể tải lịch sinh nhật.';
      setError(msg);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Lấy danh sách CBNV sinh nhật trong ngày được chọn
  const fetchDayStaff = async (day: number, month: number, year: number, page: number = 1) => {
    setIsLoadingDay(true);
    try {
      const res = await apiClient.get<DayApiResponse>(
        `/api/birthdays/day/?month=${month}&day=${day}&year=${year}&page=${page}&page_size=10`
      );
      setDayStaffList(res.employees || []);
      setDayPage(res.page || 1);
      setDayTotalPages(res.total_pages || 1);
      setDayTotal(res.total || 0);
    } catch (err) {
      console.error('Lỗi tải danh sách sinh nhật theo ngày:', err);
      // Fallback lấy từ calendar data nếu có
      if (calendarData && calendarData.days[String(day)]) {
        setDayStaffList(calendarData.days[String(day)]);
        setDayTotal(calendarData.days[String(day)].length);
      }
    } finally {
      setIsLoadingDay(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchDayStaff(selectedDay, currentMonth, currentYear, 1);
  }, [selectedDay, currentMonth, currentYear]);

  // Điều hướng tháng
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const handleGoToday = () => {
    setCurrentMonth(today.getMonth() + 1);
    setCurrentYear(today.getFullYear());
    setSelectedDay(today.getDate());
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // Gửi lời chúc
  const handleOpenWishModal = (staff: BirthdayStaff) => {
    setSelectedStaffForWish(staff);
    setWishMessage(
      `Kính chúc đồng chí ${staff.ho_ten} sinh nhật vui vẻ, hạnh phúc, dồi dào sức khỏe và luôn thành công trong công tác!`
    );
    setWishFeedback(null);
  };

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForWish) return;

    setIsSubmittingWish(true);
    setWishFeedback(null);

    try {
      await apiClient.post('/api/birthdays/wishes/', {
        staff_id: selectedStaffForWish.id,
        message: wishMessage,
        card_template: cardTemplate,
      });

      setWishFeedback({
        type: 'success',
        message: `Đã gửi lời chúc mừng sinh nhật đến ${selectedStaffForWish.ho_ten}!`,
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setSelectedStaffForWish(null);
        setWishFeedback(null);
      }, 1800);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gửi lời chúc thất bại. Vui lòng thử lại!';
      setWishFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingWish(false);
    }
  };

  // Quét gửi email tự động thủ công
  const handleTriggerEmailJob = async () => {
    if (!window.confirm('Kích hoạt quét toàn bộ CBNV có sinh nhật hôm nay và gửi email chúc mừng?')) return;
    setIsTriggeringJob(true);
    setJobFeedback(null);
    try {
      const res = await apiClient.post<{ message: string; results?: { sent_count: number; skipped_count: number } }>(
        '/api/birthdays/trigger-job/',
        { force: false }
      );
      setJobFeedback(res.message || 'Quét và gửi email hoàn tất.');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Kích hoạt thất bại.';
      setJobFeedback(`Lỗi: ${msg}`);
    } finally {
      setIsTriggeringJob(false);
    }
  };

  // Danh sách sinh nhật hôm nay
  const todayStaffList = useMemo(() => {
    if (!calendarData || !calendarData.days) return [];
    if (currentMonth !== today.getMonth() + 1 || currentYear !== today.getFullYear()) return [];
    return calendarData.days[String(today.getDate())] || [];
  }, [calendarData, currentMonth, currentYear, today]);

  // Tính ma trận các ngày trên lịch
  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 là Chủ nhật, 1 là Thứ hai...
    // Quy chuẩn bắt đầu từ Thứ Hai (0: T2, 6: CN)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{ day: number | null; birthdaysCount: number; isToday: boolean }> = [];

    // Ô trống đầu tháng
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, birthdaysCount: 0, isToday: false });
    }

    // Các ngày trong tháng
    for (let d = 1; d <= daysInMonth; d++) {
      const count = calendarData?.days?.[String(d)]?.length || 0;
      const isTodayCell =
        d === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
      cells.push({ day: d, birthdaysCount: count, isToday: isTodayCell });
    }

    return cells;
  }, [currentYear, currentMonth, calendarData, today]);

  return (
    <div className="space-y-6">
      {/* ── Header trang & Bộ điều khiển ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎂</span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Lịch Sinh Nhật Cán Bộ Nhân Viên
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi sinh nhật CBNV, gửi lời chúc mừng và hệ thống tự động phát thư chúc mừng qua email.
          </p>
        </div>

        {/* Nút thao tác nhanh */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToday}
            className="px-3.5 py-2 text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-xl transition"
          >
            Hôm nay ({today.getDate()}/{today.getMonth() + 1})
          </button>

          <button
            onClick={handleTriggerEmailJob}
            disabled={isTriggeringJob}
            className="px-3.5 py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition flex items-center gap-1.5"
            title="Kích hoạt quét gửi email sinh nhật tự động"
          >
            <span>✉️</span>
            <span>{isTriggeringJob ? 'Đang gửi...' : 'Gửi email tự động'}</span>
          </button>
        </div>
      </div>

      {jobFeedback && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span>{jobFeedback}</span>
          <button onClick={() => setJobFeedback(null)} className="text-blue-500 hover:underline text-xs">
            Đóng
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchCalendar(currentMonth, currentYear)}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Thẻ Sinh Nhật Hôm Nay (Nếu có) ── */}
      {todayStaffList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 dark:from-amber-950/30 dark:via-pink-950/30 dark:to-purple-950/30 p-5 rounded-2xl border border-pink-200 dark:border-pink-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Chúc mừng sinh nhật hôm nay ({todayStaffList.length} CBNV)
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 font-semibold rounded-full animate-pulse">
              Đang diễn ra
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {todayStaffList.map((staff) => (
              <div
                key={staff.id}
                className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-sm hover:border-pink-300 transition"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {staff.ho_ten.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{staff.ho_ten}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{staff.chuc_vu}</p>
                    <p className="text-[11px] text-pink-600 dark:text-pink-400 font-medium truncate">{staff.don_vi}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenWishModal(staff)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-pink-600 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 rounded-lg transition whitespace-nowrap flex-shrink-0"
                >
                  Chúc mừng 💌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bố cục chính: Lịch tháng bên trái & Chi tiết danh sách bên phải ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột 1: Lịch tháng (7/12 cột) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          {/* Thanh chuyển tháng */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                title="Tháng trước"
              >
                ◀
              </button>
              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
                Tháng {currentMonth} / {currentYear}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                title="Tháng sau"
              >
                ▶
              </button>
            </div>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tổng cộng: <strong className="text-blue-600">{calendarData?.total_staff || 0}</strong> sinh nhật
            </span>
          </div>

          {/* Tiêu đề Thứ (T2 -> CN) */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 py-1 border-b border-slate-100 dark:border-slate-700">
            <div>T2</div>
            <div>T3</div>
            <div>T4</div>
            <div>T5</div>
            <div>T6</div>
            <div className="text-amber-500">T7</div>
            <div className="text-red-500">CN</div>
          </div>

          {/* Lưới ngày */}
          {isLoadingCalendar ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              Đang tải lịch sinh nhật...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                if (cell.day === null) {
                  return <div key={`empty-${idx}`} className="h-14 md:h-16 rounded-xl bg-transparent" />;
                }

                const isSelected = cell.day === selectedDay;
                const hasBirthday = cell.birthdaysCount > 0;

                return (
                  <button
                    key={`day-${cell.day}`}
                    onClick={() => cell.day !== null && setSelectedDay(cell.day)}
                    className={`h-14 md:h-16 rounded-xl p-1.5 flex flex-col justify-between items-start transition relative border ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                        : cell.isToday
                        ? 'border-pink-300 dark:border-pink-700 bg-pink-50/40 dark:bg-pink-950/20'
                        : 'border-slate-100 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : cell.isToday
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {hasBirthday && (
                      <span className="self-end inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow-xs">
                        <span>🎂</span>
                        <span>{cell.birthdaysCount}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Chú giải */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border border-pink-400 bg-pink-50" />
              <span>Hôm nay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border border-blue-600 bg-blue-50" />
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1 py-0.5 rounded bg-pink-500 text-white text-[10px]">🎂 N</span>
              <span>Có CBNV sinh nhật</span>
            </div>
          </div>
        </div>

        {/* Cột 2: Danh sách chi tiết theo ngày được chọn (5/12 cột) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sinh nhật ngày {selectedDay}/{currentMonth}/{currentYear}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {dayTotal > 0 ? `Có ${dayTotal} cán bộ nhân viên` : 'Không có sinh nhật nào'}
                </p>
              </div>

              {selectedDay === today.getDate() &&
                currentMonth === today.getMonth() + 1 &&
                currentYear === today.getFullYear() && (
                  <span className="text-xs px-2.5 py-1 bg-pink-100 text-pink-700 font-semibold rounded-full">
                    Hôm nay
                  </span>
                )}
            </div>

            {/* Danh sách nhân sự */}
            <div className="mt-4 space-y-3">
              {isLoadingDay ? (
                <div className="py-12 text-center text-sm text-slate-400">Đang tải danh sách...</div>
              ) : dayStaffList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <span className="text-4xl block mb-2">🌿</span>
                  <p className="text-sm">Không có cán bộ nhân viên nào sinh vào ngày này.</p>
                </div>
              ) : (
                dayStaffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {staff.ho_ten.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{staff.ho_ten}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{staff.chuc_vu}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{staff.don_vi}</p>
                        <p className="text-[11px] text-pink-600 dark:text-pink-400 font-semibold mt-0.5">
                          Sinh nhật: {staff.birth_day_month}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenWishModal(staff)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition whitespace-nowrap flex-shrink-0"
                    >
                      Gửi thiệp 💌
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Phân trang ngày (nếu có nhiều hơn 1 trang) */}
          {dayTotalPages > 1 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
              <button
                disabled={dayPage <= 1}
                onClick={() => fetchDayStaff(selectedDay, currentMonth, currentYear, dayPage - 1)}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-40"
              >
                Trang trước
              </button>
              <span>
                Trang {dayPage} / {dayTotalPages}
              </span>
              <button
                disabled={dayPage >= dayTotalPages}
                onClick={() => fetchDayStaff(selectedDay, currentMonth, currentYear, dayPage + 1)}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Gửi Lời Chúc Mừng Sinh Nhật ── */}
      {selectedStaffForWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">💌</span>
                <h3 className="font-bold text-base">Gửi Thiệp & Lời Chúc Sinh Nhật</h3>
              </div>
              <button
                onClick={() => setSelectedStaffForWish(null)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitWish} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Người nhận:</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedStaffForWish.ho_ten} ({selectedStaffForWish.chuc_vu} - {selectedStaffForWish.don_vi})
                </p>
                <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">
                  Ngày sinh nhật: {selectedStaffForWish.birth_day_month}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mẫu thiệp chúc mừng
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'golden', name: 'Hoàng Kim', icon: '✨' },
                    { id: 'classic', name: 'Cổ Điển', icon: '🏛️' },
                    { id: 'modern', name: 'Hiện Đại', icon: '🎨' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setCardTemplate(tpl.id)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                        cardTemplate === tpl.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span>{tpl.icon}</span>
                      <span>{tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nội dung lời chúc mừng
                </label>
                <textarea
                  rows={4}
                  required
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập lời chúc chân thành đến đồng nghiệp..."
                />
              </div>

              {wishFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    wishFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                  }`}
                >
                  {wishFeedback.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForWish(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWish}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm"
                >
                  {isSubmittingWish ? 'Đang gửi...' : 'Gửi lời chúc 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
