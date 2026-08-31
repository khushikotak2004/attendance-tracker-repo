/**
 * Time and Date formatting utilities
 */

/**
 * Returns date in YYYY-MM-DD format based on local time
 */
export function formatToDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string into a local Date object (at start of day)
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Get Monday (start of week) for a given date
 */
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get Sunday (end of week) for a given Monday
 */
export function getSundayOfWeek(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Format timestamp / ISO string to 12-hour time string (e.g. "09:30 AM")
 */
export function formatTimeDisplay(isoOrTimestamp: string | number | null | undefined): string {
  if (!isoOrTimestamp) return '—';
  try {
    const d = new Date(isoOrTimestamp);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

/**
 * Format datetime to datetime-local input string (YYYY-MM-DDTHH:mm)
 */
export function formatForDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format date for friendly human label (e.g. "Mon, Aug 31")
 */
export function formatFriendlyDate(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date range for week header (e.g. "Aug 31 – Sep 06, 2026")
 */
export function formatWeekRange(monday: Date, sunday: Date): string {
  const monMonth = monday.toLocaleDateString(undefined, { month: 'short' });
  const sunMonth = sunday.toLocaleDateString(undefined, { month: 'short' });
  const monDay = monday.getDate();
  const sunDay = sunday.getDate();
  const year = sunday.getFullYear();

  if (monMonth === sunMonth) {
    return `${monMonth} ${monDay} – ${sunDay}, ${year}`;
  }
  return `${monMonth} ${monDay} – ${sunMonth} ${sunDay}, ${year}`;
}

/**
 * Format decimal hours to readable string like "9h 30m" or "45m" or "0m"
 */
export function formatHoursAndMinutes(decimalHours: number): string {
  if (Math.abs(decimalHours) < 0.001) return '0m';
  const isNegative = decimalHours < 0;
  const absHours = Math.abs(decimalHours);
  const totalMinutes = Math.round(absHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let result = '';
  if (hours > 0 && minutes > 0) {
    result = `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    result = `${hours}h`;
  } else {
    result = `${minutes}m`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format difference with explicit + or - sign, e.g. "+1h 30m", "-45m", "0m"
 */
export function formatDifference(decimalHours: number): string {
  if (Math.abs(decimalHours) < 0.01) return '0m (On target)';
  const formatted = formatHoursAndMinutes(Math.abs(decimalHours));
  if (decimalHours > 0) {
    return `+${formatted}`;
  } else {
    return `-${formatted}`;
  }
}
