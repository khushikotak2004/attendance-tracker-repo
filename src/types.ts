export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  inTime: string | null; // ISO 8601 string or null if only out-time was logged
  outTime: string | null; // ISO 8601 string or null if currently clocked in / pending out
  breakMinutes?: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DayAttendanceSummary {
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, Tuesday, etc.
  dayShort: string; // Mon, Tue, etc.
  dayNumber: number; // 1 (Mon) to 7 (Sun)
  formattedDate: string; // Aug 31
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isWeekend: boolean;
  records: AttendanceRecord[];
  inTimeDisplay: string;
  outTimeDisplay: string;
  hasInTime: boolean;
  hasOutTime: boolean;
  isInOnly: boolean;
  isOutOnly: boolean;
  totalHoursWorked: number; // decimal hours (e.g. 9.5)
  totalDurationFormatted: string; // e.g. "9h 30m"
  standardHours: number; // 9.0
  differenceHours: number; // e.g. +0.5 or -1.0
  differenceFormatted: string; // "+30m", "-1h 00m", "0m"
  status: 'overtime' | 'deficit' | 'exact' | 'in_progress' | 'in_only' | 'out_only' | 'invalid_order' | 'empty';
  isActive: boolean;
  hasInvalidOrder?: boolean;
}

export interface WeekSummary {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  weekLabel: string; // e.g. "Aug 31 – Sep 06, 2026"
  targetHours: number; // 45
  standardDailyHours: number; // 9
  workedHours: number;
  workedFormatted: string;
  remainingHours: number;
  remainingFormatted: string;
  overtimeBalance: number;
  overtimeFormatted: string;
  progressPercentage: number;
  isTargetMet: boolean;
  days: DayAttendanceSummary[];
  remainingWeekdaysCount: number; // weekdays without completed entries yet
  adjustedDailyTargetForRemaining: number; // remaining hours / remaining weekdays
}
