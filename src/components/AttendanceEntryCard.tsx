import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Plus,
} from 'lucide-react';
import { AttendanceRecord } from '../types';
import {
  formatDifference,
  formatForDateTimeLocal,
  formatHoursAndMinutes,
  formatTimeDisplay,
  formatToDateKey,
} from '../utils/timeUtils';

interface AttendanceEntryCardProps {
  onSaveRecord: (record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  defaultDate?: string;
  existingRecords?: AttendanceRecord[];
}

export const AttendanceEntryCard: React.FC<AttendanceEntryCardProps> = ({
  onSaveRecord,
  defaultDate,
  existingRecords = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate || formatToDateKey(new Date())
  );
  const [inDateTime, setInDateTime] = useState<string>('');
  const [outDateTime, setOutDateTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Sync defaultDate prop when it changes
  useEffect(() => {
    if (defaultDate) {
      setSelectedDate(defaultDate);
    }
  }, [defaultDate]);

  // Check if there is an existing record on the currently selected date
  const matchingDateRecord = useMemo(() => {
    return existingRecords.find((r) => r.date === selectedDate);
  }, [existingRecords, selectedDate]);

  // Set In Time to "Now"
  const handleSetInNow = () => {
    const now = new Date();
    setInDateTime(formatForDateTimeLocal(now));
    setSelectedDate(formatToDateKey(now));
    setErrorMessage(null);
  };

  // Set Out Time to "Now"
  const handleSetOutNow = () => {
    const now = new Date();
    setOutDateTime(formatForDateTimeLocal(now));
    setErrorMessage(null);
  };

  // Forward Auto: Set Out Time to +9 Hours from In Time
  const handleSetForward9Hours = () => {
    if (!inDateTime) {
      // Default to 9 AM - 6 PM on the selected date
      const [year, month, day] = selectedDate.split('-').map(Number);
      const inD = new Date(year, month - 1, day, 9, 0);
      const outD = new Date(year, month - 1, day, 18, 0);
      setInDateTime(formatForDateTimeLocal(inD));
      setOutDateTime(formatForDateTimeLocal(outD));
      setErrorMessage(null);
      return;
    }
    const inD = new Date(inDateTime);
    const outD = new Date(inD.getTime() + 9 * 60 * 60 * 1000);
    setOutDateTime(formatForDateTimeLocal(outD));
    setErrorMessage(null);
  };

  // Backward Auto: If user only remembers Out Time, estimate In Time as -9 Hours before Out Time
  const handleSetBackward9Hours = () => {
    if (!outDateTime) {
      // Default to 9 AM - 6 PM on the selected date
      const [year, month, day] = selectedDate.split('-').map(Number);
      const inD = new Date(year, month - 1, day, 9, 0);
      const outD = new Date(year, month - 1, day, 18, 0);
      setInDateTime(formatForDateTimeLocal(inD));
      setOutDateTime(formatForDateTimeLocal(outD));
      setErrorMessage(null);
      return;
    }
    const outD = new Date(outDateTime);
    const inD = new Date(outD.getTime() - 9 * 60 * 60 * 1000);
    setInDateTime(formatForDateTimeLocal(inD));
    setErrorMessage(null);
  };

  // Set Quick Preset (e.g. 09:00 - 18:00 for 9h or 08:30 - 18:30 for 10h overtime)
  const handleApplyPreset = (inHour: number, inMin: number, outHour: number, outMin: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const inD = new Date(year, month - 1, day, inHour, inMin);
    const outD = new Date(year, month - 1, day, outHour, outMin);
    setInDateTime(formatForDateTimeLocal(inD));
    setOutDateTime(formatForDateTimeLocal(outD));
    setErrorMessage(null);
  };

  // Clear single fields
  const handleClearIn = () => {
    setInDateTime('');
    setErrorMessage(null);
  };

  const handleClearOut = () => {
    setOutDateTime('');
    setErrorMessage(null);
  };

  // Minimum constraint for Clock Out
  const minOutDateTime = useMemo(() => {
    if (inDateTime) {
      return inDateTime;
    }
    if (matchingDateRecord?.inTime && !matchingDateRecord.outTime) {
      return formatForDateTimeLocal(new Date(matchingDateRecord.inTime));
    }
    return undefined;
  }, [inDateTime, matchingDateRecord]);

  // Maximum constraint for Clock In
  const maxInDateTime = useMemo(() => {
    if (outDateTime) {
      return outDateTime;
    }
    if (matchingDateRecord?.outTime && !matchingDateRecord.inTime) {
      return formatForDateTimeLocal(new Date(matchingDateRecord.outTime));
    }
    return undefined;
  }, [outDateTime, matchingDateRecord]);

  // Chronological validation checks
  const isDirectOrderInvalid = useMemo(() => {
    if (!inDateTime || !outDateTime) return false;
    const inMs = new Date(inDateTime).getTime();
    const outMs = new Date(outDateTime).getTime();
    return !isNaN(inMs) && !isNaN(outMs) && outMs <= inMs;
  }, [inDateTime, outDateTime]);

  const isExistingInConflict = useMemo(() => {
    if (inDateTime || !outDateTime || !matchingDateRecord?.inTime || matchingDateRecord.outTime) return false;
    const existingInMs = new Date(matchingDateRecord.inTime).getTime();
    const outMs = new Date(outDateTime).getTime();
    return !isNaN(existingInMs) && !isNaN(outMs) && outMs <= existingInMs;
  }, [inDateTime, outDateTime, matchingDateRecord]);

  const isExistingOutConflict = useMemo(() => {
    if (!inDateTime || outDateTime || !matchingDateRecord?.outTime || matchingDateRecord.inTime) return false;
    const inMs = new Date(inDateTime).getTime();
    const existingOutMs = new Date(matchingDateRecord.outTime).getTime();
    return !isNaN(inMs) && !isNaN(existingOutMs) && inMs >= existingOutMs;
  }, [inDateTime, outDateTime, matchingDateRecord]);

  const isTimeOrderInvalid = isDirectOrderInvalid || isExistingInConflict || isExistingOutConflict;

  // Calculate live metrics when both timestamps are provided and valid
  let calculatedHours = 0;
  let differenceHours = 0;
  let hasBothValidTimes = false;

  if (inDateTime && outDateTime && !isDirectOrderInvalid) {
    const inMs = new Date(inDateTime).getTime();
    const outMs = new Date(outDateTime).getTime();
    if (!isNaN(inMs) && !isNaN(outMs) && outMs > inMs) {
      hasBothValidTimes = true;
      let totalMins = (outMs - inMs) / (1000 * 60);
      if (breakMinutes > 0) {
        totalMins = Math.max(0, totalMins - breakMinutes);
      }
      calculatedHours = totalMins / 60;
      differenceHours = calculatedHours - 9.0;
    }
  }

  const hasInOnly = Boolean(inDateTime && !outDateTime);
  const hasOutOnly = Boolean(!inDateTime && outDateTime);
  const hasAnyTime = Boolean(inDateTime || outDateTime);

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inDateTime && !outDateTime) {
      setErrorMessage('Please enter Clock In, Clock Out, or both to log attendance.');
      return;
    }

    if (isTimeOrderInvalid) {
      setErrorMessage('Clock Out time cannot be earlier than or equal to Clock In time.');
      return;
    }

    let inISO: string | null = null;
    let outISO: string | null = null;
    let targetDate = selectedDate;

    if (inDateTime) {
      const inMs = new Date(inDateTime).getTime();
      if (isNaN(inMs)) {
        setErrorMessage('Invalid Clock In date or time format.');
        return;
      }
      inISO = new Date(inDateTime).toISOString();
      targetDate = formatToDateKey(new Date(inDateTime));
    }

    if (outDateTime) {
      const outMs = new Date(outDateTime).getTime();
      if (isNaN(outMs)) {
        setErrorMessage('Invalid Clock Out date or time format.');
        return;
      }
      outISO = new Date(outDateTime).toISOString();
      if (!inDateTime) {
        targetDate = formatToDateKey(new Date(outDateTime));
      }
    }

    // Double check chronological validity
    if (inISO && outISO) {
      const inMs = new Date(inISO).getTime();
      const outMs = new Date(outISO).getTime();
      if (outMs <= inMs) {
        setErrorMessage('Clock Out time must be strictly after Clock In time.');
        return;
      }
    }

    onSaveRecord({
      date: targetDate,
      inTime: inISO,
      outTime: outISO,
      breakMinutes: breakMinutes > 0 ? breakMinutes : undefined,
      note: note.trim() ? note.trim() : undefined,
    });

    let successMsg = 'Attendance entry saved successfully!';
    if (hasBothValidTimes) {
      successMsg = `Complete shift logged (${formatHoursAndMinutes(calculatedHours)}). Added to weekly calculation!`;
    } else if (hasInOnly) {
      successMsg = `Clock In logged (${formatTimeDisplay(inISO)}). You can log Clock Out whenever ready!`;
    } else if (hasOutOnly) {
      successMsg = `Clock Out logged (${formatTimeDisplay(outISO)}). Saved independently!`;
    }

    setSaveSuccess(successMsg);
    setTimeout(() => {
      setSaveSuccess(null);
    }, 3500);

    // Reset inputs
    setInDateTime('');
    setOutDateTime('');
    setNote('');
    setBreakMinutes(0);
  };

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs"
      id="attendance-entry-card"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100/60 shadow-2xs">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Log Attendance Entry
            </h3>
            <p className="text-xs text-slate-500">
              Log Clock In & Clock Out independently or together
            </p>
          </div>
        </div>

        {/* Quick Shift Presets */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <button
            type="button"
            onClick={() => handleApplyPreset(9, 0, 18, 0)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200/60"
          >
            9h Shift (9:00–18:00)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(8, 30, 18, 30)}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium transition-colors cursor-pointer border border-emerald-200"
          >
            +1h OT (8:30–18:30)
          </button>
        </div>
      </div>

      {/* Existing date status notification (if any open record exists on selectedDate) */}
      {matchingDateRecord && (
        <div className="mb-4 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {matchingDateRecord.inTime && !matchingDateRecord.outTime ? (
                <>
                  Existing <strong>Clock In ({formatTimeDisplay(matchingDateRecord.inTime)})</strong> found for this date. Logging Clock Out after this time will complete this shift.
                </>
              ) : !matchingDateRecord.inTime && matchingDateRecord.outTime ? (
                <>
                  Existing <strong>Clock Out ({formatTimeDisplay(matchingDateRecord.outTime)})</strong> found for this date. Logging Clock In before this time will complete this shift.
                </>
              ) : (
                <>
                  Completed shift logged for this date ({formatTimeDisplay(matchingDateRecord.inTime)} – {formatTimeDisplay(matchingDateRecord.outTime)}).
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selector Row */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Attendance Date
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/90 bg-slate-50/50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white outline-none transition-all min-h-[44px]"
                id="input-entry-date"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(formatToDateKey(new Date()))}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer min-h-[44px] border border-slate-200/60"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                setSelectedDate(formatToDateKey(yest));
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer min-h-[44px] border border-slate-200/60"
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Independent Clock In and Clock Out */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Column 1: Clock In */}
          <div
            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
              isExistingOutConflict
                ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20'
                : inDateTime
                ? 'bg-indigo-50/40 border-indigo-200/90'
                : 'bg-slate-50/80 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <label
                htmlFor="input-in-datetime"
                className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>Clock In (In Time)</span>
                <span className="text-[10px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>

              <div className="flex items-center gap-1">
                {/* Auto calculate +9h from In */}
                <button
                  type="button"
                  onClick={handleSetForward9Hours}
                  className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Auto-fill +9 hours shift for Out Time"
                >
                  +9h Auto
                </button>

                {/* Fill In with Now */}
                <button
                  type="button"
                  onClick={handleSetInNow}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  id="btn-in-now"
                  title="Fill with current time"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Now</span>
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="relative">
              <input
                type="datetime-local"
                id="input-in-datetime"
                value={inDateTime}
                max={maxInDateTime}
                onChange={(e) => {
                  setInDateTime(e.target.value);
                  setErrorMessage(null);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all min-h-[44px] ${
                  isExistingOutConflict
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-300/90 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />
              {inDateTime && (
                <button
                  type="button"
                  onClick={handleClearIn}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              {isExistingOutConflict ? (
                <span className="text-rose-600 font-semibold">
                  Must be before Clock Out ({formatTimeDisplay(matchingDateRecord?.outTime)})
                </span>
              ) : (
                <span>Log morning arrival or leave empty if forgotten</span>
              )}
              {inDateTime && (
                <span className="font-mono text-indigo-700 font-semibold">
                  {formatTimeDisplay(new Date(inDateTime).toISOString())}
                </span>
              )}
            </p>
          </div>

          {/* Column 2: Clock Out */}
          <div
            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
              isDirectOrderInvalid || isExistingInConflict
                ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20'
                : outDateTime
                ? 'bg-rose-50/40 border-rose-200/90'
                : 'bg-slate-50/80 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <label
                htmlFor="input-out-datetime"
                className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Clock Out (Out Time)</span>
                <span className="text-[10px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>

              <div className="flex items-center gap-1">
                {/* Auto calculate -9h prior to Out */}
                <button
                  type="button"
                  onClick={handleSetBackward9Hours}
                  className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="If you only remember Out Time, calculate standard 9h prior as In Time"
                >
                  -9h Auto
                </button>

                {/* Fill Out with Now */}
                <button
                  type="button"
                  onClick={handleSetOutNow}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  id="btn-out-now"
                  title="Fill with current time"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Now</span>
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="relative">
              <input
                type="datetime-local"
                id="input-out-datetime"
                value={outDateTime}
                min={minOutDateTime}
                onChange={(e) => {
                  setOutDateTime(e.target.value);
                  setErrorMessage(null);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all min-h-[44px] ${
                  isDirectOrderInvalid || isExistingInConflict
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-300/90 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600'
                }`}
              />
              {outDateTime && (
                <button
                  type="button"
                  onClick={handleClearOut}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              {isDirectOrderInvalid ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  ⚠️ Must be after Clock In ({formatTimeDisplay(new Date(inDateTime).toISOString())})
                </span>
              ) : isExistingInConflict ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  ⚠️ Must be after Clock In ({formatTimeDisplay(matchingDateRecord?.inTime)})
                </span>
              ) : (
                <span>Log evening departure or end of shift</span>
              )}
              {outDateTime && (
                <span
                  className={`font-mono font-semibold ${
                    isTimeOrderInvalid ? 'text-rose-600 line-through' : 'text-rose-700'
                  }`}
                >
                  {formatTimeDisplay(new Date(outDateTime).toISOString())}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Optional Note & Break Deduction */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (e.g. Sprint deadline, Client meeting, Doctor visit)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all min-h-[40px]"
              id="input-entry-note"
            />
          </div>
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-600">
            <span>Break deduction:</span>
            <select
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none cursor-pointer min-h-[40px]"
            >
              <option value={0}>0 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
        </div>

        {/* Dedicated Chronological Error Warning Banner */}
        {isTimeOrderInvalid && (
          <div
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150"
            id="chronology-warning-banner"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-900">
                Invalid Time Order: Clock Out cannot be earlier than Clock In
              </p>
              <p className="text-[11px] text-rose-700 font-normal">
                {isDirectOrderInvalid ? (
                  <>
                    You selected Clock Out at{' '}
                    <strong className="font-mono">{formatTimeDisplay(new Date(outDateTime).toISOString())}</strong>, which is earlier than your Clock In at{' '}
                    <strong className="font-mono">{formatTimeDisplay(new Date(inDateTime).toISOString())}</strong>. Please select a valid Clock Out time after your Clock In.
                  </>
                ) : isExistingInConflict ? (
                  <>
                    You selected Clock Out at{' '}
                    <strong className="font-mono">{formatTimeDisplay(new Date(outDateTime).toISOString())}</strong>, which is earlier than your existing Clock In today at{' '}
                    <strong className="font-mono">{formatTimeDisplay(matchingDateRecord?.inTime)}</strong>.
                  </>
                ) : (
                  <>
                    Clock In time cannot be later than your existing Clock Out time today.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Live Calculation / Context Banner */}
        {!isTimeOrderInvalid && hasBothValidTimes ? (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium transition-all ${
              differenceHours > 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : differenceHours < 0
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">Calculated Shift:</span>
              <span className="font-extrabold text-slate-900 font-mono">
                {formatHoursAndMinutes(calculatedHours)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Daily Difference (vs 9h):</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-md font-mono ${
                  differenceHours > 0
                    ? 'bg-emerald-200 text-emerald-900'
                    : differenceHours < 0
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {formatDifference(differenceHours)}
              </span>
            </div>
          </div>
        ) : !isTimeOrderInvalid && hasInOnly ? (
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Clock In only mode</strong>: Will record arrival at{' '}
                <strong className="font-mono">{formatTimeDisplay(new Date(inDateTime).toISOString())}</strong>. Out Time can be logged later.
              </span>
            </div>
          </div>
        ) : !isTimeOrderInvalid && hasOutOnly ? (
          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-rose-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Clock Out only mode</strong>: Will record departure at{' '}
                <strong className="font-mono">{formatTimeDisplay(new Date(outDateTime).toISOString())}</strong> independently.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSetBackward9Hours}
              className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer shrink-0"
            >
              Auto-fill 9h start
            </button>
          </div>
        ) : null}

        {/* General Error message */}
        {errorMessage && !isTimeOrderInvalid && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Success feedback */}
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Adaptive Save Button (strictly disabled when time order is invalid) */}
        <button
          type="submit"
          disabled={!hasAnyTime || isTimeOrderInvalid}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base transition-all min-h-[48px] ${
            isTimeOrderInvalid
              ? 'bg-rose-100/80 text-rose-500 border border-rose-200 cursor-not-allowed shadow-none'
              : hasAnyTime
              ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white cursor-pointer shadow-sm hover:shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
          id="btn-save-attendance-entry"
        >
          {isTimeOrderInvalid ? (
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Cannot Save: Clock Out is earlier than Clock In</span>
            </span>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>
                {hasBothValidTimes
                  ? `Save Complete Shift (${formatHoursAndMinutes(calculatedHours)})`
                  : hasInOnly
                  ? `Save Clock In (${formatTimeDisplay(new Date(inDateTime).toISOString())})`
                  : hasOutOnly
                  ? `Save Clock Out (${formatTimeDisplay(new Date(outDateTime).toISOString())})`
                  : 'Enter In Time, Out Time, or Both to Save'}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
