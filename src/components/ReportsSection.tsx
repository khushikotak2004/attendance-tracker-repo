import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Edit2,
  HelpCircle,
  Layers,
  LogIn,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AttendanceRecord, WeekSummary } from '../types';
import { exportRecordsAsJSON } from '../utils/storage';
import { formatHoursAndMinutes, formatTimeDisplay } from '../utils/timeUtils';

interface ReportsSectionProps {
  summary: WeekSummary;
  selectedMonday: Date;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onQuickLogForDay: (dateKey: string) => void;
  onNavigateToClocking: () => void;
  allRecords: AttendanceRecord[];
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  summary,
  selectedMonday,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onEditRecord,
  onDeleteRecord,
  onQuickLogForDay,
  onNavigateToClocking,
  allRecords,
}) => {
  const [showRequirementDetails, setShowRequirementDetails] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'logged' | 'weekdays'>('all');

  const {
    targetHours,
    workedHours,
    workedFormatted,
    remainingHours,
    remainingFormatted,
    overtimeBalance,
    overtimeFormatted,
    progressPercentage,
    isTargetMet,
    remainingWeekdaysCount,
    adjustedDailyTargetForRemaining,
    days,
    weekLabel,
  } = summary;

  const isOvertimeState = overtimeBalance > 0;
  const progressClamped = Math.min(100, Math.max(0, progressPercentage));

  // Count logged days
  const loggedDaysCount = days.filter(
    (d) => d.records.length > 0 || d.hasInTime || d.hasOutTime
  ).length;

  // Filter days
  const displayedDays = days.filter((d) => {
    if (filterType === 'logged') return d.records.length > 0 || d.hasInTime || d.hasOutTime;
    if (filterType === 'weekdays') return !d.isWeekend;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5" id="reports-page-view">
      {/* 1. Week Navigation Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevWeek}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
            title="Previous Week"
            aria-label="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
              Reporting Week
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {weekLabel}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentWeek ? (
            <button
              onClick={onCurrentWeek}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Current Week</span>
            </button>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active Week</span>
            </span>
          )}

          <button
            onClick={onNextWeek}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
            title="Next Week"
            aria-label="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Weekly Performance Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Hours Logged vs Target
            </span>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {workedFormatted}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                / {targetHours}.0h target
              </span>
            </div>
          </div>

          {isTargetMet ? (
            <div className="self-start px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>45-Hour Target Achieved!</span>
            </div>
          ) : (
            <div className="self-start px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-2 shadow-2xs">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>{progressPercentage}% Completed</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTargetMet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-500'
              }`}
              style={{ width: `${progressClamped}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1.5 font-medium">
            <span>{loggedDaysCount} of 7 days logged</span>
            <span>{isTargetMet ? 'Goal accomplished' : `${remainingFormatted} remaining`}</span>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Overtime Balance */}
          <div
            className={`p-4 rounded-2xl border ${
              isOvertimeState
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : overtimeBalance < 0
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 mb-1">
              Overtime Balance
            </span>
            <div className="flex items-center gap-2">
              {isOvertimeState ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : overtimeBalance < 0 ? (
                <TrendingDown className="w-5 h-5 text-amber-600" />
              ) : (
                <Clock className="w-5 h-5 text-slate-400" />
              )}
              <span className="text-base font-extrabold font-mono">
                {isOvertimeState ? `+${overtimeFormatted}` : overtimeBalance < 0 ? `-${overtimeFormatted}` : '0h 00m'}
              </span>
            </div>
            <span className="text-[11px] block mt-1 text-slate-500">
              {isOvertimeState ? 'Extra hours accrued' : 'Current week balance'}
            </span>
          </div>

          {/* Daily Pace Requirement */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Required Pace
            </span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="text-base font-extrabold font-mono text-slate-900">
                {remainingWeekdaysCount > 0 && !isTargetMet
                  ? `~${formatHoursAndMinutes(adjustedDailyTargetForRemaining)}/day`
                  : 'Goal Met'}
              </span>
            </div>
            <span className="text-[11px] block mt-1 text-slate-500">
              {remainingWeekdaysCount > 0 && !isTargetMet
                ? `For next ${remainingWeekdaysCount} workday(s)`
                : 'No more hours needed'}
            </span>
          </div>

          {/* Days Left in Workweek */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Remaining Workdays
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span className="text-base font-extrabold font-mono text-slate-900">
                {remainingWeekdaysCount} Days
              </span>
            </div>
            <span className="text-[11px] block mt-1 text-slate-500">
              Monday through Friday
            </span>
          </div>
        </div>
      </div>

      {/* 3. Work Requirements & Policies Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowRequirementDetails(!showRequirementDetails)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Work Requirements & Overtime Rules
            </h4>
          </div>
          {showRequirementDetails ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showRequirementDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs text-slate-600 border-t border-slate-100">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">1. 45-Hour Standard</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Full-time weekly commitment is 45 hours, standardly divided into 5 workdays (9h/day).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1 text-indigo-950">
              <span className="font-bold text-indigo-900 block text-xs">2. Automatic Overtime Offsets</span>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Working 10h on Monday automatically reduces Friday&apos;s requirement to 8h so you can leave early.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">3. Deficit Compensation</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                If you work under 9h on any day, the tracker recalculates the remaining workdays to keep you on schedule.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Day-by-Day Breakdown List */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h4 className="text-base font-bold text-slate-900 tracking-tight">
              Day-by-Day Weekly Breakdown
            </h4>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All 7 Days
            </button>
            <button
              onClick={() => setFilterType('weekdays')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === 'weekdays' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Weekdays (Mon-Fri)
            </button>
            <button
              onClick={() => setFilterType('logged')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === 'logged' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Logged Only
            </button>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-2.5 pt-1" id="weekly-days-breakdown-list">
          {displayedDays.map((day) => {
            const hasRecord = day.records.length > 0;
            const primaryRecord = day.records[0];
            const isOvertime = day.differenceHours > 0.05;
            const isDeficit = day.differenceHours < -0.05 && day.totalHoursWorked > 0;

            return (
              <div
                key={day.date}
                className={`p-4 rounded-2xl border transition-all ${
                  day.isToday
                    ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-400/30'
                    : hasRecord
                    ? 'bg-slate-50/80 border-slate-200/90 hover:bg-slate-100/70'
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-sm font-bold ${
                        day.isToday ? 'text-indigo-700' : 'text-slate-900'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span className="text-xs text-slate-400">{day.formattedDate}</span>
                    {day.isToday && (
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">
                        TODAY
                      </span>
                    )}
                    {day.isWeekend && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                        Weekend
                      </span>
                    )}
                  </div>

                  {/* Hours Badge / Status */}
                  <div>
                    {hasRecord && day.totalHoursWorked > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-slate-900">
                          {day.totalDurationFormatted}
                        </span>
                        {isOvertime ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            +{day.differenceFormatted} OT
                          </span>
                        ) : isDeficit ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            {day.differenceFormatted}
                          </span>
                        ) : null}
                      </div>
                    ) : day.isActive ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs animate-pulse">
                        Active Shift in Progress
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No entry</span>
                    )}
                  </div>
                </div>

                {/* Sub row with timestamps and actions */}
                {hasRecord && primaryRecord ? (
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-200/60">
                    <div className="flex items-center gap-3 font-mono">
                      <span>In: <strong className="text-slate-800">{day.inTimeDisplay}</strong></span>
                      <span>•</span>
                      <span>Out: <strong className="text-slate-800">{day.outTimeDisplay}</strong></span>
                      {primaryRecord.breakMinutes && primaryRecord.breakMinutes > 0 ? (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 font-sans">(-{primaryRecord.breakMinutes}m break)</span>
                        </>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Record Button */}
                      <button
                        type="button"
                        onClick={() => onEditRecord(primaryRecord)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Record Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete attendance record for ${day.dayName}, ${day.formattedDate}?`)) {
                            onDeleteRecord(primaryRecord.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">No shift hours logged for this date.</span>
                    <button
                      type="button"
                      onClick={() => onQuickLogForDay(day.date)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      + Log shift for {day.dayName}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Banner */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateToClocking}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Go to Clocking Entry Page</span>
          </button>

          <button
            type="button"
            onClick={() => exportRecordsAsJSON(allRecords)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export All Records (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
