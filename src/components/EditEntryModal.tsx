import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Trash2, X } from 'lucide-react';
import { AttendanceRecord } from '../types';
import {
  formatDifference,
  formatForDateTimeLocal,
  formatHoursAndMinutes,
  formatTimeDisplay,
  formatToDateKey,
} from '../utils/timeUtils';

interface EditEntryModalProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: AttendanceRecord) => void;
  onDelete: (recordId: string) => void;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  record,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [inDateTime, setInDateTime] = useState<string>('');
  const [outDateTime, setOutDateTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      if (record.inTime) {
        setInDateTime(formatForDateTimeLocal(new Date(record.inTime)));
      } else {
        setInDateTime('');
      }

      if (record.outTime) {
        setOutDateTime(formatForDateTimeLocal(new Date(record.outTime)));
      } else {
        setOutDateTime('');
      }

      setNote(record.note || '');
      setBreakMinutes(record.breakMinutes || 0);
      setError(null);
    }
  }, [record, isOpen]);

  const isChronologyInvalid = useMemo(() => {
    if (!inDateTime || !outDateTime) return false;
    const inMs = new Date(inDateTime).getTime();
    const outMs = new Date(outDateTime).getTime();
    return !isNaN(inMs) && !isNaN(outMs) && outMs <= inMs;
  }, [inDateTime, outDateTime]);

  if (!isOpen || !record) return null;

  // Live calculation preview
  let calculatedHours = 0;
  let differenceHours = 0;
  let isValid = false;

  if (inDateTime && outDateTime && !isChronologyInvalid) {
    const inMs = new Date(inDateTime).getTime();
    const outMs = new Date(outDateTime).getTime();
    if (!isNaN(inMs) && !isNaN(outMs) && outMs > inMs) {
      isValid = true;
      let mins = (outMs - inMs) / (1000 * 60);
      if (breakMinutes > 0) {
        mins = Math.max(0, mins - breakMinutes);
      }
      calculatedHours = mins / 60;
      differenceHours = calculatedHours - 9.0;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inDateTime && !outDateTime) {
      setError('Please provide at least Clock In or Clock Out time.');
      return;
    }

    if (isChronologyInvalid) {
      setError('Clock Out time cannot be earlier than or equal to Clock In time.');
      return;
    }

    let inISO: string | null = null;
    let outISO: string | null = null;
    let dateKey = record.date;

    if (inDateTime) {
      const inMs = new Date(inDateTime).getTime();
      if (isNaN(inMs)) {
        setError('Invalid Clock In time.');
        return;
      }
      inISO = new Date(inDateTime).toISOString();
      dateKey = formatToDateKey(new Date(inDateTime));
    }

    if (outDateTime) {
      const outMs = new Date(outDateTime).getTime();
      if (isNaN(outMs)) {
        setError('Invalid Clock Out time.');
        return;
      }
      outISO = new Date(outDateTime).toISOString();
      if (!inDateTime) {
        dateKey = formatToDateKey(new Date(outDateTime));
      }
    }

    if (inDateTime && outDateTime) {
      const inMs = new Date(inDateTime).getTime();
      const outMs = new Date(outDateTime).getTime();
      if (outMs <= inMs) {
        setError('Clock Out time must be strictly after Clock In time.');
        return;
      }
    }

    onUpdate({
      ...record,
      date: dateKey,
      inTime: inISO,
      outTime: outISO,
      note: note.trim() ? note.trim() : undefined,
      breakMinutes: breakMinutes > 0 ? breakMinutes : undefined,
      updatedAt: Date.now(),
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="edit-entry-modal"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-5 sm:p-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Edit Attendance Entry
            </h3>
            <p className="text-xs text-slate-500">
              Modify Clock In / Clock Out timestamps for {record.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Clock In */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clock In (In Time)
              </label>
              <button
                type="button"
                onClick={() => {
                  setInDateTime(formatForDateTimeLocal(new Date()));
                  setError(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                <span>Now</span>
              </button>
            </div>
            <input
              type="datetime-local"
              value={inDateTime}
              max={outDateTime || undefined}
              onChange={(e) => {
                setInDateTime(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/90 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
          </div>

          {/* Clock Out */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clock Out (Out Time)
              </label>
              <button
                type="button"
                onClick={() => {
                  setOutDateTime(formatForDateTimeLocal(new Date()));
                  setError(null);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                <span>Now</span>
              </button>
            </div>
            <input
              type="datetime-local"
              value={outDateTime}
              min={inDateTime || undefined}
              onChange={(e) => {
                setOutDateTime(e.target.value);
                setError(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                isChronologyInvalid
                  ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-300/90 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600'
              }`}
            />
            <p className="text-[11px] text-slate-500">
              {isChronologyInvalid ? (
                <span className="text-rose-600 font-bold">
                  ⚠️ Must be after Clock In ({formatTimeDisplay(new Date(inDateTime).toISOString())})
                </span>
              ) : (
                'Leave blank if currently working in this shift'
              )}
            </p>
          </div>

          {/* Break & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Break Deduction
              </label>
              <select
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300/90 bg-white text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value={0}>0 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Details..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300/90 bg-white text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Chronological Error Warning Banner */}
          {isChronologyInvalid && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Invalid Time Order</p>
                <p className="text-[11px] text-rose-700 font-normal">
                  Clock Out cannot be earlier than Clock In. Please select a time after{' '}
                  <strong className="font-mono">{formatTimeDisplay(new Date(inDateTime).toISOString())}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Live Preview */}
          {!isChronologyInvalid && isValid && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                differenceHours > 0
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : differenceHours < 0
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span>
                Shift: <strong className="font-mono">{formatHoursAndMinutes(calculatedHours)}</strong>
              </span>
              <span>
                Diff vs 9h: <strong className="font-mono">{formatDifference(differenceHours)}</strong>
              </span>
            </div>
          )}

          {error && !isChronologyInvalid && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this attendance record?')) {
                  onDelete(record.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer border border-rose-200/60"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isChronologyInvalid || (!inDateTime && !outDateTime)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isChronologyInvalid || (!inDateTime && !outDateTime)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white cursor-pointer shadow-sm'
                }`}
                id="btn-update-record"
              >
                {isChronologyInvalid ? 'Cannot Save' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
