import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AttendanceRecord, DaySummary } from '../types';
import {
  formatDifference,
  formatForDateTimeLocal,
  formatHoursAndMinutes,
  formatTimeDisplay,
  formatToDateKey,
} from '../utils/timeUtils';

interface ClockingLandingSectionProps {
  currentDate: Date;
  selectedMonday: Date;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  weekLabel: string;
  onSaveRecord: (record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingRecords: AttendanceRecord[];
  activeRecord?: AttendanceRecord;
  onClockInNow: () => void;
  onClockOutNow: () => void;
  todaySummary?: DaySummary;
}

export const ClockingLandingSection: React.FC<ClockingLandingSectionProps> = ({
  currentDate,
  selectedMonday,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  weekLabel,
  onSaveRecord,
  existingRecords,
  activeRecord,
  onClockInNow,
  onClockOutNow,
  todaySummary,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(formatToDateKey(currentDate));
  const [inDateTime, setInDateTime] = useState<string>('');
  const [outDateTime, setOutDateTime] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if there is an existing record on the selected date
  const matchingDateRecord = useMemo(() => {
    return existingRecords.find((r) => r.date === selectedDate);
  }, [existingRecords, selectedDate]);

  // When selectedDate changes, populate fields if a record exists for convenience
  useEffect(() => {
    if (matchingDateRecord) {
      if (matchingDateRecord.inTime) {
        setInDateTime(formatForDateTimeLocal(new Date(matchingDateRecord.inTime)));
      } else {
        setInDateTime('');
      }
      if (matchingDateRecord.outTime) {
        setOutDateTime(formatForDateTimeLocal(new Date(matchingDateRecord.outTime)));
      } else {
        setOutDateTime('');
      }
      setBreakMinutes(matchingDateRecord.breakMinutes || 0);
    } else {
      setInDateTime('');
      setOutDateTime('');
      setBreakMinutes(0);
    }
    setErrorMessage(null);
  }, [selectedDate, matchingDateRecord]);

  // Set In-Time to Now
  const handleSetInNow = () => {
    const now = new Date();
    setSelectedDate(formatToDateKey(now));
    setInDateTime(formatForDateTimeLocal(now));
    setErrorMessage(null);
  };

  // Set Out-Time to Now
  const handleSetOutNow = () => {
    const now = new Date();
    setOutDateTime(formatForDateTimeLocal(now));
    setErrorMessage(null);
  };

  // Quick Preset: 9h standard shift (9 AM - 6 PM on selected date)
  const handleSetStandard9h = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const inD = new Date(year, month - 1, day, 9, 0);
    const outD = new Date(year, month - 1, day, 18, 0);
    setInDateTime(formatForDateTimeLocal(inD));
    setOutDateTime(formatForDateTimeLocal(outD));
    setErrorMessage(null);
  };

  // Chronological validation
  const isDirectOrderInvalid = useMemo(() => {
    if (!inDateTime || !outDateTime) return false;
    const inMs = new Date(inDateTime).getTime();
    const outMs = new Date(outDateTime).getTime();
    return !isNaN(inMs) && !isNaN(outMs) && outMs <= inMs;
  }, [inDateTime, outDateTime]);

  const isTimeOrderInvalid = isDirectOrderInvalid;

  // Calculate live shift preview
  const liveShiftHours = useMemo(() => {
    if (!inDateTime || !outDateTime || isTimeOrderInvalid) return 0;
    const inMs = new Date(inDateTime).getTime();
    const outMs = new Date(outDateTime).getTime();
    const netMinutes = (outMs - inMs) / 60000 - (breakMinutes || 0);
    return Math.max(0, netMinutes / 60);
  }, [inDateTime, outDateTime, breakMinutes, isTimeOrderInvalid]);

  // Save handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inDateTime && !outDateTime) {
      setErrorMessage('Please provide at least a Clock In or Clock Out time.');
      return;
    }

    if (isTimeOrderInvalid) {
      setErrorMessage('Clock Out time cannot be earlier than or equal to Clock In time.');
      return;
    }

    const inIso = inDateTime ? new Date(inDateTime).toISOString() : null;
    const outIso = outDateTime ? new Date(outDateTime).toISOString() : null;

    onSaveRecord({
      date: selectedDate,
      inTime: inIso,
      outTime: outIso,
      breakMinutes: breakMinutes > 0 ? breakMinutes : undefined,
    });

    setSaveSuccess('Attendance record saved successfully!');
    setTimeout(() => {
      setSaveSuccess(null);
    }, 3000);
  };

  // Active Session elapsed calculation
  const activeElapsedFormatted = useMemo(() => {
    if (!activeRecord || !activeRecord.inTime) return null;
    const inMs = new Date(activeRecord.inTime).getTime();
    const nowMs = currentDate.getTime();
    const elapsedMinutes = Math.max(0, Math.floor((nowMs - inMs) / 60000));
    const h = Math.floor(elapsedMinutes / 60);
    const m = elapsedMinutes % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }, [activeRecord, currentDate]);

  const isSaveDisabled = (!inDateTime && !outDateTime) || isTimeOrderInvalid;

  return (
    <div className="space-y-4" id="clocking-landing-page">
      {/* 1. Current Week Display Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevWeek}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Previous Week"
            aria-label="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
              Current Week Display
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Jump to Current Week</span>
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active Week</span>
            </span>
          )}

          <button
            onClick={onNextWeek}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Next Week"
            aria-label="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Active Session Live Clock Banner (if currently clocked in today) */}
      {activeRecord && (
        <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-200/90 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Active Shift in Progress
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-900 mt-0.5">
                Clocked in at {formatTimeDisplay(activeRecord.inTime)} • Elapsed:{' '}
                <span className="font-mono font-bold text-emerald-950">
                  {activeElapsedFormatted}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClockOutNow}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            id="btn-active-clock-out"
          >
            <LogOut className="w-4 h-4" />
            <span>Clock Out Now</span>
          </button>
        </div>
      )}

      {/* 3. Primary Clocking Entry Card (Simple UI: Date, Clock In, Clock Out, Save Button) */}
      <div
        className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden"
        id="attendance-entry-card"
      >
        {/* Subtle accent border */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">
              Clocking Entry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Log daily clock-in and clock-out timestamps
            </p>
          </div>

          <button
            type="button"
            onClick={handleSetStandard9h}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer border border-indigo-200/60"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fill 9h Standard Shift (9am - 6pm)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" id="attendance-clock-form">
          {/* Field 1: Date Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Date Field
              </label>
              <button
                type="button"
                onClick={() => setSelectedDate(formatToDateKey(new Date()))}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Set to Today
              </button>
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none shadow-2xs"
                id="input-clocking-date"
              />
            </div>
          </div>

          {/* Field 2 & 3: Clock In and Clock Out Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Clock In */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Clock In Time
                </label>
                <button
                  type="button"
                  onClick={handleSetInNow}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Set to Now
                </button>
              </div>
              <div className="relative">
                <LogIn className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={inDateTime}
                  onChange={(e) => {
                    setInDateTime(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none shadow-2xs"
                  id="input-clock-in"
                />
              </div>
            </div>

            {/* Clock Out */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Clock Out Time
                </label>
                <button
                  type="button"
                  onClick={handleSetOutNow}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Set to Now
                </button>
              </div>
              <div className="relative">
                <LogOut className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={outDateTime}
                  min={inDateTime || undefined}
                  onChange={(e) => {
                    setOutDateTime(e.target.value);
                    setErrorMessage(null);
                  }}
                  className={`w-full pl-10 pr-3.5 py-3 rounded-2xl border text-slate-900 text-sm font-medium focus:ring-2 outline-none shadow-2xs ${
                    isTimeOrderInvalid
                      ? 'border-rose-500 bg-rose-50/40 text-rose-950 focus:ring-rose-500/20 focus:border-rose-600'
                      : 'border-slate-300 bg-white focus:ring-indigo-500/20 focus:border-indigo-600'
                  }`}
                  id="input-clock-out"
                />
              </div>
            </div>
          </div>

          {/* Validation Notice if Clock Out <= Clock In */}
          {isTimeOrderInvalid && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Invalid Time Order: Clock Out time cannot be earlier than or equal to Clock In time.
              </span>
            </div>
          )}

          {/* Live Calculated Duration Preview (if valid) */}
          {inDateTime && outDateTime && !isTimeOrderInvalid && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Calculated Shift Duration:</span>
              <span className="text-sm font-extrabold text-slate-900 font-mono">
                {formatHoursAndMinutes(liveShiftHours)} (
                {liveShiftHours >= 9 ? (
                  <span className="text-emerald-600">
                    +{formatDifference(liveShiftHours - 9)} overtime
                  </span>
                ) : (
                  <span className="text-amber-600">
                    -{formatDifference(9 - liveShiftHours)} deficit
                  </span>
                )}
                )
              </span>
            </div>
          )}

          {/* Success / Error alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Field 4: Save Button */}
          <button
            type="submit"
            disabled={isSaveDisabled}
            className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
            id="btn-save-clocking-entry"
          >
            {isTimeOrderInvalid ? (
              <span>Fix Time Order to Save</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Attendance Entry</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
