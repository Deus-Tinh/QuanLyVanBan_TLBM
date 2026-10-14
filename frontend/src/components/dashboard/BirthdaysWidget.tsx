import React from 'react';
import { useTranslation } from '@i18n/translate';

export interface BirthdayEmployee {
  id: string | number;
  name: string; // Ưu tiên 1: Họ tên
  birthdate: string; // Ưu tiên 2: Ngày tháng sinh nhật
  position: string; // Ưu tiên 3: Chức vụ
  department?: string; // Đơn vị công tác
  isToday?: boolean;
}

interface BirthdaysWidgetProps {
  birthdays?: BirthdayEmployee[];
}

export default function BirthdaysWidget({
  birthdays = [],
}: BirthdaysWidgetProps) {
  const { t } = useTranslation();

  const formatBirthdate = (dateStr: string) => {
    return dateStr
      .replace('(Hôm nay)', `(${t('dashboardDetails.today') || 'Hôm nay'})`)
      .replace('(Ngày mai)', `(${t('dashboardDetails.tomorrow') || 'Ngày mai'})`);
  };

  const hasBirthdays = Boolean(birthdays && birthdays.length > 0);

  // Trường hợp CÓ sinh nhật: nhân đôi để tạo vòng cuộn vô tận mượt mà (-50% translateX)
  const activeItems = hasBirthdays
    ? birthdays.length < 3
      ? [...birthdays, ...birthdays, ...birthdays, ...birthdays]
      : [...birthdays, ...birthdays]
    : [];

  // Trường hợp KHÔNG CÓ sinh nhật: dải Marquee cuộn vô tận mượt mà thông báo hệ thống
  const emptyNoticeText =
    t('dashboardDetails.noBirthdaysNotice') ||
    'Không có cán bộ nhân viên nào sinh nhật hôm nay và ngày mai.';

  const emptyBaseList = [
    emptyNoticeText,
    emptyNoticeText,
    emptyNoticeText,
    emptyNoticeText,
  ];
  const marqueeEmptyItems = [...emptyBaseList, ...emptyBaseList];

  return (
    <div className="bg-surface border border-border-subtle rounded-xl shadow-sm px-4 py-3 flex items-center gap-3.5 overflow-hidden relative select-none">
      {/* Label / Badge cố định bên trái (Trên điện thoại chỉ hiển thị icon để tối đa hóa không gian Marquee) */}
      {hasBirthdays ? (
        <div
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-success text-white text-sm font-bold shrink-0 shadow-xs"
          title={t('dashboardDetails.happyBirthday') || 'Chúc mừng sinh nhật:'}
        >
          <i className="fa-solid fa-cake-candles text-sm sm:text-xs" />
          <span className="hidden sm:inline whitespace-nowrap">
            {t('dashboardDetails.happyBirthday') || 'Chúc mừng sinh nhật:'}
          </span>
        </div>
      ) : (
        <div
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm font-bold shrink-0 shadow-xs"
          title={t('dashboardDetails.birthdayCalendarBadge') || 'Lịch sinh nhật:'}
        >
          <i className="fa-regular fa-calendar-days text-sm sm:text-xs" />
          <span className="hidden sm:inline whitespace-nowrap">
            {t('dashboardDetails.birthdayCalendarBadge') || 'Lịch sinh nhật:'}
          </span>
        </div>
      )}

      {/* Marquee Viewport with Optical Edge Alpha Masking */}
      <div
        className="relative w-full overflow-hidden flex-1 py-0.5"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 12px, black calc(100% - 24px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 12px, black calc(100% - 24px), transparent 100%)',
        }}
      >
        {/* Dải Marquee chạy liên tục (tạm dừng khi rê chuột hover) */}
        <div className="animate-marquee gap-6 pl-2 items-center hover:[animation-play-state:paused]">
          {hasBirthdays
            ? activeItems.map((emp, idx) => (
                <div
                  key={`${emp.id}-${idx}`}
                  className="inline-flex items-center gap-2 text-sm shrink-0 cursor-default"
                  title={`${emp.name} - ${emp.birthdate} - ${emp.position} (${emp.department || ''})`}
                >
                  {/* 1. TÊN */}
                  <span className="font-bold text-main flex items-center gap-1.5">
                    <i className="fa-solid fa-cake-candles text-pink shrink-0 text-xs" />
                    <span className="text-primary font-bold">{emp.name}</span>
                  </span>

                  {/* 2. NGÀY THÁNG */}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                      emp.isToday
                        ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {formatBirthdate(emp.birthdate)}
                  </span>

                  {/* 3. CHỨC VỤ & ĐƠN VỊ */}
                  <span className="text-secondary text-xs whitespace-nowrap">
                    {emp.position}
                    {emp.department && (
                      <span className="text-muted"> · {emp.department}</span>
                    )}
                  </span>

                  <span className="text-border-subtle ml-2">•</span>
                </div>
              ))
            : marqueeEmptyItems.map((text, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="inline-flex items-center gap-2 text-sm text-secondary shrink-0 cursor-default"
                >
                  <i className="fa-regular fa-calendar-check text-primary/70 text-xs" />
                  <span className="font-medium text-main/80">{text}</span>
                  <span className="text-border-subtle mx-4">❖</span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
