import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface WeekNavigatorProps {
  weekLabel: string;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekLabel,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
}) => {
  return (
    <div
      className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
      id="week-navigator"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {isCurrentWeek ? 'Current Work Week' : 'Selected Schedule'}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
            {weekLabel}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
        <button
          onClick={onPrevWeek}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
          id="btn-prev-week"
          aria-label="Previous Week"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {!isCurrentWeek ? (
          <button
            onClick={onCurrentWeek}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 transition-colors border border-indigo-200 cursor-pointer"
            id="btn-current-week"
            title="Jump back to current week"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>This Week</span>
          </button>
        ) : (
          <span className="px-3 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Active Week</span>
          </span>
        )}

        <button
          onClick={onNextWeek}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
          id="btn-next-week"
          aria-label="Next Week"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
