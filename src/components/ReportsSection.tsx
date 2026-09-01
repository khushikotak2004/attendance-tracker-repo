import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AttendanceRecord, DaySummary, WeekSummary } from '../types';
import { formatHoursAndMinutes, formatTimeDisplay } from '../utils/timeUtils';

interface ReportsSectionProps {
  summary: WeekSummary;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onQuickLogForDay?: (dateKey: string) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  summary,
  onEditRecord,
  onDeleteRecord,
  onQuickLogForDay,
}) => {
  const [showRequirementDetails, setShowRequirementDetails] = useState<boolean>(false);
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
  } = summary;

  const isOvertimeState = overtimeBalance > 0;
  const progressClamped = Math.min(100, Math.max(0, progressPercentage));

  // Count logged days
  const loggedDaysCount = days.filter((d) => d.records.length > 0 || d.hasInTime || d.hasOutTime).length;

  // Filter days
  const displayedDays = days.filter((d) => {
    if (filterType === 'logged') return d.records.length > 0 || d.hasInTime || d.hasOutTime;
    if (filterType === 'weekdays') return !d.isWeekend;
    return true;
  });

  return (
    <div className="space-y-4" id="reports-section">
      {/* 1. Section Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Reports & Performance
            </h3>
            <p className="text-xs text-slate-500">
              Weekly analytics, overtime balance & requirements
            </p>
          </div>
        </div>
      </div>

      {/* 2. Weekly Performance Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Hours Logged vs Target
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {workedFormatted}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {targetHours}.0h
              </span>
            </div>
          </div>

          {isTargetMet ? (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Goal Met</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>{progressPercentage}% Done</span>
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTargetMet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-500'
              }`}
              style={{ width: `${progressClamped}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-medium">
            <span>{loggedDaysCount} of 7 days logged</span>
            <span>{isTargetMet ? 'Goal accomplished' : `${remainingFormatted} to go`}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Overtime Balance */}
          <div
            className={`p-3 rounded-2xl border ${
              isOvertimeState
                ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                : overtimeBalance < 0
                ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70 mb-0.5">
              Overtime Balance
            </span>
            <div className="flex items-center gap-1.5">
              {isOvertimeState ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : overtimeBalance < 0 ? (
                <TrendingDown className="w-4 h-4 text-amber-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm font-extrabold font-mono">
                {isOvertimeState ? `+${overtimeFormatted}` : overtimeBalance < 0 ? `-${overtimeFormatted}` : '0h 00m'}
              </span>
            </div>
          </div>

          {/* Daily Pace Target */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Required Pace
            </span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-extrabold font-mono text-slate-900">
                {remainingWeekdaysCount > 0 && !isTargetMet
                  ? `~${formatHoursAndMinutes(adjustedDailyTargetForRemaining)}/d`
                  : 'Complete'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Requirements & Policies Accordion / Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setShowRequirementDetails(!showRequirementDetails)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Work Requirements & Policies
            </span>
          </div>
          {showRequirementDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showRequirementDetails ? (
          <div className="space-y-2.5 pt-2 text-xs text-slate-600 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-bold text-slate-900 block">1. 45-Hour Standard</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Full-time weekly commitment is 45 hours, typically distributed across 5 workdays (9 hours/day).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1 text-indigo-950">
              <span className="font-bold text-indigo-900 block">2. Automatic Overtime Offsets</span>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Working extra hours on earlier weekdays (e.g. 10 hours on Monday) automatically offsets subsequent days, reducing Friday&apos;s requirement so you can clock out earlier.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="font-bold text-slate-900 block">3. Deficit Compensation</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                If you work fewer than 9 hours on any weekday, the tracker recalculates the remaining workdays to keep you on schedule for 45h.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            Standard: 45h/week (9h/day). Overtime hours automatically reduce subsequent shift requirements.
          </p>
        )}
      </div>

      {/* 4. Weekly Breakdown (Day-by-Day Logs) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Day-by-Day Breakdown
            </span>
          </div>

          {/* Filter Pill Switcher */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-[10px] font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('logged')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                filterType === 'logged' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Logged
            </button>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-2 pt-1" id="weekly-days-breakdown-list">
          {displayedDays.map((day) => {
            const hasRecord = day.records.length > 0;
            const primaryRecord = day.records[0];
            const isOvertime = day.differenceHours > 0.05;
            const isDeficit = day.differenceHours < -0.05 && day.totalHoursWorked > 0;

            return (
              <div
                key={day.date}
                className={`p-3 rounded-2xl border transition-all ${
                  day.isToday
                    ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-400/30'
                    : hasRecord
                    ? 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        day.isToday ? 'text-indigo-700' : 'text-slate-800'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span className="text-[11px] text-slate-400">{day.formattedDate}</span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-bold">
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Hours Badge / Status */}
                  <div>
                    {hasRecord && day.totalHoursWorked > 0 ? (
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {day.totalDurationFormatted}
                      </span>
                    ) : day.isActive ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Active Shift
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No entry</span>
                    )}
                  </div>
                </div>

                {/* Sub row with timestamps and actions */}
                {hasRecord && primaryRecord ? (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
                    <div className="flex items-center gap-2 font-mono">
                      <span>In: {day.inTimeDisplay}</span>
                      <span>•</span>
                      <span>Out: {day.outTimeDisplay}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Overtime / Deficit badge */}
                      {isOvertime ? (
                        <span className="text-[10px] font-bold text-emerald-600">
                          +{day.differenceFormatted}
                        </span>
                      ) : isDeficit ? (
                        <span className="text-[10px] font-bold text-amber-600">
                          {day.differenceFormatted}
                        </span>
                      ) : null}

                      {/* Edit Record Button */}
                      <button
                        type="button"
                        onClick={() => onEditRecord(primaryRecord)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Record Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete record for ${day.dayName}, ${day.formattedDate}?`)) {
                            onDeleteRecord(primaryRecord.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  onQuickLogForDay && (
                    <div className="mt-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => onQuickLogForDay(day.date)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        + Log hours for {day.dayName}
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
