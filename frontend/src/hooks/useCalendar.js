import { useState, useMemo } from 'react';

export function useCalendar(initialYear = 2026, initialMonth = 9, initialDay = 10) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(initialDay);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToday = (todayYear = 2026, todayMonth = 9, todayDay = 10) => {
    setCurrentYear(todayYear);
    setCurrentMonth(todayMonth);
    setSelectedDay(todayDay);
  };

  // Generate calendar matrix: Monday to Sunday
  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    // Monday is 1, Sunday is 0 -> offset for Monday as start:
    const offset = (firstDay === 0 ? 7 : firstDay) - 1;

    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    const cells = [];

    // Previous month filler days
    for (let i = offset - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        month: currentMonth === 1 ? 12 : currentMonth - 1,
        year: currentMonth === 1 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        isToday: d === 10 && currentMonth === 9 && currentYear === 2026,
        isSelected: d === selectedDay,
      });
    }

    // Next month filler days (fill up to complete weeks, usually 35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      cells.push({
        day: j,
        month: currentMonth === 12 ? 1 : currentMonth + 1,
        year: currentMonth === 12 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth, selectedDay]);

  return {
    currentYear,
    currentMonth,
    selectedDay,
    setSelectedDay,
    prevMonth,
    nextMonth,
    goToday,
    calendarCells,
  };
}
