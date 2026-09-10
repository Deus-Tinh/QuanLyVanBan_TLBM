/**
 * Utility functions for date and time formatting
 * Mandatory enterprise standard: HH:mm:ss DD/MM/YYYY
 */

export function padZero(num, length = 2) {
  return String(num).padStart(length, '0');
}

/**
 * Formats a Date object or date string into 'HH:mm:ss DD/MM/YYYY'
 */
export function formatDateTimeFull(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '--:--:-- --/--/----';

  const hours = padZero(d.getHours());
  const minutes = padZero(d.getMinutes());
  const seconds = padZero(d.getSeconds());
  const day = padZero(d.getDate());
  const month = padZero(d.getMonth() + 1);
  const year = d.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

/**
 * Formats a Date object or date string into 'DD/MM/YYYY'
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = padZero(d.getDate());
  const month = padZero(d.getMonth() + 1);
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats a day and month into 'DD/MM'
 */
export function formatDayMonth(day, month) {
  return `${padZero(day)}/${padZero(month)}`;
}

/**
 * Checks if a date (day, month) is today
 */
export function isToday(day, month, referenceDate = new Date()) {
  return day === referenceDate.getDate() && month === (referenceDate.getMonth() + 1);
}

/**
 * Checks if a date (day, month) is tomorrow
 */
export function isTomorrow(day, month, referenceDate = new Date()) {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return day === tomorrow.getDate() && month === (tomorrow.getMonth() + 1);
}
