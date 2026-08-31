import { AttendanceRecord, DayAttendanceSummary, WeekSummary } from '../types';
import {
  formatDifference,
  formatFriendlyDate,
  formatHoursAndMinutes,
  formatTimeDisplay,
  formatToDateKey,
  formatWeekRange,
  getMondayOfWeek,
  getSundayOfWeek,
  parseDateKey,
} from './timeUtils';

const STANDARD_DAILY_HOURS = 9;
const WEEKLY_TARGET_HOURS = 45;

/**
 * Calculate hours between inTime and outTime for a record
 */
export function calculateRecordHours(record: AttendanceRecord, nowTimestamp: number = Date.now()): number {
  if (!record.inTime && !record.outTime) return 0;

  // Case 1: Both inTime and outTime are present
  if (record.inTime && record.outTime) {
    const inMs = new Date(record.inTime).getTime();
    const outMs = new Date(record.outTime).getTime();
    if (isNaN(inMs) || isNaN(outMs) || outMs <= inMs) return 0;

    let durationMinutes = (outMs - inMs) / (1000 * 60);
    if (record.breakMinutes && record.breakMinutes > 0) {
      durationMinutes = Math.max(0, durationMinutes - record.breakMinutes);
    }

    return durationMinutes / 60;
  }

  // Case 2: Only inTime is present (active / ongoing shift)
  if (record.inTime && !record.outTime) {
    const inMs = new Date(record.inTime).getTime();
    if (isNaN(inMs)) return 0;

    // If it's today's record and shift is currently running, compute live elapsed
    const todayDateKey = formatToDateKey(new Date(nowTimestamp));
    if (record.date === todayDateKey && nowTimestamp > inMs) {
      let durationMinutes = (nowTimestamp - inMs) / (1000 * 60);
      if (record.breakMinutes && record.breakMinutes > 0) {
        durationMinutes = Math.max(0, durationMinutes - record.breakMinutes);
      }
      return durationMinutes / 60;
    }
    return 0;
  }

  // Case 3: Only outTime is present (inTime pending)
  return 0;
}

/**
 * Calculate day summary for a given dateKey (YYYY-MM-DD)
 */
export function calculateDaySummary(
  dateKey: string,
  allRecords: AttendanceRecord[],
  currentDateKey: string,
  nowTimestamp: number = Date.now()
): DayAttendanceSummary {
  const dateObj = parseDateKey(dateKey);
  const dayOfWeek = dateObj.getDay(); // 0 is Sun, 1 is Mon...
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isToday = dateKey === currentDateKey;
  const isPast = dateKey < currentDateKey;
  const isFuture = dateKey > currentDateKey;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter records for this date
  const dayRecords = allRecords
    .filter((r) => r.date === dateKey)
    .sort((a, b) => {
      const timeA = a.inTime ? new Date(a.inTime).getTime() : (a.outTime ? new Date(a.outTime).getTime() : 0);
      const timeB = b.inTime ? new Date(b.inTime).getTime() : (b.outTime ? new Date(b.outTime).getTime() : 0);
      return timeA - timeB;
    });

  let totalHours = 0;
  let hasActive = false;

  for (const rec of dayRecords) {
    totalHours += calculateRecordHours(rec, nowTimestamp);
    if (rec.inTime && !rec.outTime && isToday) {
      hasActive = true;
    }
  }

  // Check presence of in and out times across this day's records
  const recordsWithIn = dayRecords.filter((r) => r.inTime !== null);
  const recordsWithOut = dayRecords.filter((r) => r.outTime !== null);

  const hasInTime = recordsWithIn.length > 0;
  const hasOutTime = recordsWithOut.length > 0;
  const isInOnly = hasInTime && !hasOutTime;
  const isOutOnly = !hasInTime && hasOutTime;

  // Check if any record on this day has invalid time order (outTime <= inTime)
  const hasInvalidOrder = dayRecords.some((r) => {
    if (r.inTime && r.outTime) {
      const inMs = new Date(r.inTime).getTime();
      const outMs = new Date(r.outTime).getTime();
      return !isNaN(inMs) && !isNaN(outMs) && outMs <= inMs;
    }
    return false;
  });

  // Display strings for inTime and outTime
  let inTimeDisplay = '—';
  let outTimeDisplay = '—';

  if (hasInTime) {
    inTimeDisplay = formatTimeDisplay(recordsWithIn[0].inTime);
  } else if (dayRecords.length > 0) {
    inTimeDisplay = 'Not logged';
  }

  if (hasOutTime) {
    const lastOutRec = recordsWithOut[recordsWithOut.length - 1];
    outTimeDisplay = formatTimeDisplay(lastOutRec.outTime);
  } else if (hasActive) {
    outTimeDisplay = 'Active now';
  } else if (dayRecords.length > 0) {
    outTimeDisplay = 'Not logged';
  }

  const standardHours = STANDARD_DAILY_HOURS;
  const differenceHours = totalHours - standardHours;

  let status: DayAttendanceSummary['status'] = 'empty';
  if (hasInvalidOrder) {
    status = 'invalid_order';
  } else if (hasActive) {
    status = 'in_progress';
  } else if (isInOnly) {
    status = 'in_only';
  } else if (isOutOnly) {
    status = 'out_only';
  } else if (dayRecords.length > 0) {
    if (Math.abs(differenceHours) < 0.01) {
      status = 'exact';
    } else if (differenceHours > 0) {
      status = 'overtime';
    } else {
      status = 'deficit';
    }
  }

  return {
    date: dateKey,
    dayName: dayNames[dayOfWeek],
    dayShort: dayShorts[dayOfWeek],
    dayNumber,
    formattedDate: formatFriendlyDate(dateKey),
    isToday,
    isPast,
    isFuture,
    isWeekend,
    records: dayRecords,
    inTimeDisplay,
    outTimeDisplay,
    hasInTime,
    hasOutTime,
    isInOnly,
    isOutOnly,
    hasInvalidOrder,
    totalHoursWorked: totalHours,
    totalDurationFormatted: formatHoursAndMinutes(totalHours),
    standardHours,
    differenceHours,
    differenceFormatted: formatDifference(differenceHours),
    status,
    isActive: hasActive,
  };
}

/**
 * Calculate weekly summary for a given week Monday date
 */
export function calculateWeekSummary(
  mondayDate: Date,
  allRecords: AttendanceRecord[],
  now: Date = new Date()
): WeekSummary {
  const monday = new Date(mondayDate);
  monday.setHours(0, 0, 0, 0);
  const sunday = getSundayOfWeek(monday);

  const currentDateKey = formatToDateKey(now);
  const nowTimestamp = now.getTime();

  const days: DayAttendanceSummary[] = [];

  // Generate 7 days (Monday to Sunday)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = formatToDateKey(d);
    days.push(calculateDaySummary(dateKey, allRecords, currentDateKey, nowTimestamp));
  }

  // Sum worked hours for this week
  const workedHours = days.reduce((sum, day) => sum + day.totalHoursWorked, 0);
  const remainingHours = Math.max(0, WEEKLY_TARGET_HOURS - workedHours);
  const overtimeBalance = Math.max(0, workedHours - WEEKLY_TARGET_HOURS);
  const progressPercentage = Math.min(100, Math.round((workedHours / WEEKLY_TARGET_HOURS) * 100));
  const isTargetMet = workedHours >= WEEKLY_TARGET_HOURS;

  // Calculate remaining weekdays (Mon-Fri) that haven't been completed yet
  // If it's today and not completed or future weekdays
  const remainingWeekdays = days.filter((day) => {
    if (day.isWeekend) return false;
    if (day.isFuture) return true;
    if (day.isToday && day.totalHoursWorked < STANDARD_DAILY_HOURS) return true;
    // If it's a past weekday without any records, consider it or ignore based on intent
    return false;
  });

  const remainingWeekdaysCount = Math.max(0, remainingWeekdays.length);

  // Dynamic daily target calculation for remaining days
  let adjustedDailyTargetForRemaining = STANDARD_DAILY_HOURS;
  if (remainingWeekdaysCount > 0) {
    adjustedDailyTargetForRemaining = remainingHours / remainingWeekdaysCount;
  } else if (remainingHours > 0) {
    adjustedDailyTargetForRemaining = remainingHours;
  } else {
    adjustedDailyTargetForRemaining = 0;
  }

  return {
    weekStart: formatToDateKey(monday),
    weekEnd: formatToDateKey(sunday),
    weekLabel: formatWeekRange(monday, sunday),
    targetHours: WEEKLY_TARGET_HOURS,
    standardDailyHours: STANDARD_DAILY_HOURS,
    workedHours,
    workedFormatted: formatHoursAndMinutes(workedHours),
    remainingHours,
    remainingFormatted: formatHoursAndMinutes(remainingHours),
    overtimeBalance,
    overtimeFormatted: formatHoursAndMinutes(overtimeBalance),
    progressPercentage,
    isTargetMet,
    days,
    remainingWeekdaysCount,
    adjustedDailyTargetForRemaining,
  };
}
