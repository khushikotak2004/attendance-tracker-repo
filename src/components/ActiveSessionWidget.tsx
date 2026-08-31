import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, LogIn, LogOut, Play, Sparkles } from 'lucide-react';
import { AttendanceRecord, DayAttendanceSummary } from '../types';
import { formatHoursAndMinutes, formatTimeDisplay } from '../utils/timeUtils';

interface ActiveSessionWidgetProps {
  todaySummary: DayAttendanceSummary | undefined;
  activeRecord: AttendanceRecord | undefined;
  onClockInNow: () => void;
  onClockOutNow: () => void;
  onOpenManualEntry: () => void;
}

export const ActiveSessionWidget: React.FC<ActiveSessionWidgetProps> = ({
  todaySummary,
  activeRecord,
  onClockInNow,
  onClockOutNow,
  onOpenManualEntry,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live timer tick when active session is open
  useEffect(() => {
    if (!activeRecord) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const startMs = new Date(activeRecord.inTime).getTime();
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRecord]);

  const formatStopwatch = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isWorking = Boolean(activeRecord);
  const totalTodayHours = todaySummary?.totalHoursWorked || 0;
  const isOvertimeToday = totalTodayHours > 9.0;
  const isTargetTodayMet = totalTodayHours >= 9.0;

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 shadow-xs transition-all ${
        isWorking
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-700/50 shadow-md'
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}
      id="today-status-widget"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left Side: Status Info */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isWorking
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 ring-4 ring-indigo-500/10'
                : isTargetTodayMet
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                : 'bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            {isWorking ? (
              <Clock className="w-5 h-5 animate-spin text-emerald-400" style={{ animationDuration: '8s' }} />
            ) : isTargetTodayMet ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isWorking ? 'text-indigo-300' : 'text-slate-400'
                }`}
              >
                Today's Work Status
              </span>
              {isWorking && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active Shift
                </span>
              )}
            </div>

            {isWorking ? (
              <div className="mt-1">
                <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-emerald-400">
                  {formatStopwatch(elapsedSeconds)}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Clocked In at <span className="font-semibold text-white">{formatTimeDisplay(activeRecord?.inTime)}</span>
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    {formatHoursAndMinutes(totalTodayHours)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    worked today (9.0h standard)
                  </span>
                </div>
                {todaySummary && todaySummary.records.length > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {todaySummary.records.length} session{todaySummary.records.length > 1 ? 's' : ''} logged •{' '}
                    <span
                      className={`font-semibold ${
                        isOvertimeToday
                          ? 'text-emerald-600'
                          : totalTodayHours < 9
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {todaySummary.differenceFormatted}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isWorking ? (
            <button
              onClick={onClockOutNow}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer min-h-[44px]"
              id="btn-clock-out-now-banner"
            >
              <LogOut className="w-4 h-4" />
              <span>Clock Out Now</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClockInNow}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer min-h-[44px]"
                id="btn-clock-in-now-banner"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In Now</span>
              </button>
              <button
                onClick={onOpenManualEntry}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer min-h-[44px] border border-slate-200/80"
                id="btn-quick-manual-entry"
              >
                <span>Manual Entry</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
