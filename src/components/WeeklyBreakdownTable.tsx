import React from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Edit2,
  MoreVertical,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AttendanceRecord, DayAttendanceSummary, WeekSummary } from '../types';

interface WeeklyBreakdownTableProps {
  summary: WeekSummary;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onQuickLogForDay: (dateKey: string) => void;
}

export const WeeklyBreakdownTable: React.FC<WeeklyBreakdownTableProps> = ({
  summary,
  onEditRecord,
  onDeleteRecord,
  onQuickLogForDay,
}) => {
  const { days, workedFormatted, targetHours } = summary;

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs"
      id="weekly-attendance-table-container"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Weekly Daily Breakdown
          </h3>
          <p className="text-xs text-slate-500">
            Monday–Sunday work breakdown • Standard 9.0h/day basis
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Week Total
          </span>
          <span className="text-sm font-extrabold text-indigo-700 font-mono">
            {workedFormatted} / {targetHours}.0h
          </span>
        </div>
      </div>

      {/* Desktop / Tablet Table View (hidden on very small screens, responsive) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/90">
        <table className="w-full text-left text-xs border-collapse" id="weekly-attendance-table">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200/90 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Day & Date</th>
              <th className="py-3.5 px-3">In Time</th>
              <th className="py-3.5 px-3">Out Time</th>
              <th className="py-3.5 px-3 text-center">Hours Worked</th>
              <th className="py-3.5 px-4 text-center">Difference (vs 9h)</th>
              <th className="py-3.5 px-3 text-center">Status</th>
              <th className="py-3.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {days.map((day) => {
              const hasRecords = day.records.length > 0;
              const primaryRecord = day.records[0];
              const isOvertime = day.differenceHours > 0;
              const isDeficit = day.differenceHours < 0 && hasRecords;

              return (
                <tr
                  key={day.date}
                  className={`transition-colors ${
                    day.isToday
                      ? 'bg-indigo-50/40 hover:bg-indigo-50/70 font-semibold'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Day & Date */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold ${
                          day.isToday
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : day.isWeekend
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{day.dayShort}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{day.dayName}</span>
                          {day.isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-600 text-white uppercase">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">{day.formattedDate}</span>
                      </div>
                    </div>
                  </td>

                  {/* In Time */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-mono font-medium ${
                        day.hasInTime ? 'text-slate-800' : hasRecords ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold border border-amber-200' : 'text-slate-400'
                      }`}
                    >
                      {day.inTimeDisplay}
                    </span>
                  </td>

                  {/* Out Time */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-mono font-medium ${
                        day.isActive
                          ? 'text-indigo-600 animate-pulse font-bold'
                          : day.hasOutTime
                          ? 'text-slate-800'
                          : hasRecords
                          ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold border border-amber-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.outTimeDisplay}
                    </span>
                  </td>

                  {/* Hours Worked */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`font-bold font-mono text-sm ${
                        day.hasInvalidOrder
                          ? 'text-rose-600 text-xs'
                          : hasRecords && day.totalHoursWorked > 0
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.hasInvalidOrder
                        ? 'Invalid Order'
                        : hasRecords && day.totalHoursWorked > 0
                        ? day.totalDurationFormatted
                        : day.isInOnly
                        ? 'Pending Out'
                        : day.isOutOnly
                        ? 'Pending In'
                        : '—'}
                    </span>
                    {!day.hasInvalidOrder && hasRecords && day.totalHoursWorked > 0 && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {day.totalHoursWorked.toFixed(1)}h
                      </span>
                    )}
                  </td>

                  {/* Difference (Overtime / Deficit) */}
                  <td className="py-3.5 px-4 text-center">
                    {day.hasInvalidOrder ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Out &lt; In</span>
                      </span>
                    ) : hasRecords && !day.isActive && day.hasInTime && day.hasOutTime ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                          isOvertime
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                            : isDeficit
                            ? 'bg-rose-100 text-rose-800 border border-rose-300/80'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isOvertime ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isDeficit ? (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        ) : null}
                        <span>{day.differenceFormatted}</span>
                      </span>
                    ) : day.isActive ? (
                      <span className="text-[11px] text-indigo-600 font-semibold">
                        In Progress...
                      </span>
                    ) : day.isInOnly || day.isOutOnly ? (
                      <span className="text-[11px] text-amber-700 font-medium">
                        Partial log
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 text-center">
                    {day.hasInvalidOrder ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        Fix Time Order
                      </span>
                    ) : day.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Working Now
                      </span>
                    ) : day.isInOnly ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        In-Time Logged
                      </span>
                    ) : day.isOutOnly ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        Out-Time Logged
                      </span>
                    ) : hasRecords ? (
                      isOvertime ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Overtime
                        </span>
                      ) : isDeficit ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          Shortage
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                          Exact 9h
                        </span>
                      )
                    ) : day.isWeekend ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-500">
                        Weekend Off
                      </span>
                    ) : day.isPast ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Missed Entry
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Upcoming</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasRecords ? (
                        <>
                          <button
                            onClick={() => onEditRecord(primaryRecord)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit this entry"
                            aria-label={`Edit ${day.dayName}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(primaryRecord.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete entry"
                            aria-label={`Delete ${day.dayName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onQuickLogForDay(day.date)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-indigo-200/60"
                          title="Log attendance for this day"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Log</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Optimized for 360px - 430px screens) */}
      <div className="md:hidden space-y-2.5" id="mobile-daily-list">
        {days.map((day) => {
          const hasRecords = day.records.length > 0;
          const primaryRecord = day.records[0];
          const isOvertime = day.differenceHours > 0;
          const isDeficit = day.differenceHours < 0 && hasRecords;

          return (
            <div
              key={day.date}
              className={`p-4 rounded-2xl border transition-all ${
                day.isToday
                  ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20'
                  : hasRecords && isOvertime
                  ? 'bg-emerald-50/20 border-emerald-200'
                  : hasRecords && isDeficit
                  ? 'bg-rose-50/20 border-rose-200'
                  : 'bg-slate-50/70 border-slate-200/90'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      day.isToday
                        ? 'bg-indigo-600 text-white'
                        : day.isWeekend
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {day.dayShort}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{day.dayName}</span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-600 text-white uppercase">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{day.formattedDate}</span>
                  </div>
                </div>

                {/* Status or Difference Badge */}
                {day.hasInvalidOrder ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Fix Order</span>
                  </span>
                ) : hasRecords && !day.isActive && day.hasInTime && day.hasOutTime ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                      isOvertime
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isDeficit
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isOvertime ? (
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                    ) : isDeficit ? (
                      <TrendingDown className="w-3 h-3 text-rose-600" />
                    ) : null}
                    <span>{day.differenceFormatted}</span>
                  </span>
                ) : day.isActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white animate-pulse">
                    Active Shift
                  </span>
                ) : day.isInOnly ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    In Logged
                  </span>
                ) : day.isOutOnly ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Out Logged
                  </span>
                ) : (
                  <button
                    onClick={() => onQuickLogForDay(day.date)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 bg-white border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Time</span>
                  </button>
                )}
              </div>

              {/* Card Details: In, Out, Total */}
              {hasRecords ? (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="font-semibold text-slate-700">In:</span>
                      <span className={`font-mono font-bold ${day.hasInTime ? 'text-slate-900' : 'text-amber-700 font-sans text-[11px]'}`}>
                        {day.inTimeDisplay}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="font-semibold text-slate-700">Out:</span>
                      <span className={`font-mono font-bold ${day.hasOutTime ? 'text-slate-900' : 'text-amber-700 font-sans text-[11px]'}`}>
                        {day.outTimeDisplay}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Hours
                    </span>
                    <span className={`text-sm font-black font-mono ${day.hasInvalidOrder ? 'text-rose-600 text-xs' : 'text-slate-900'}`}>
                      {day.hasInvalidOrder
                        ? 'Invalid Order'
                        : day.totalHoursWorked > 0
                        ? day.totalDurationFormatted
                        : day.isInOnly
                        ? 'Pending Out'
                        : day.isOutOnly
                        ? 'Pending In'
                        : '—'}
                    </span>
                  </div>

                  {/* Actions for mobile card */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditRecord(primaryRecord)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 shadow-2xs transition-colors cursor-pointer"
                      title="Edit"
                      aria-label="Edit record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(primaryRecord.id)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                      title="Delete"
                      aria-label="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>No attendance logged</span>
                  <span className="text-slate-500 font-medium">
                    {day.isWeekend ? 'Standard off day' : 'Standard 9.0h expected'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
