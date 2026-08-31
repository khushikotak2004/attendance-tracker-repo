import React from 'react';
import { ArrowRight, CheckCircle2, Flame, HelpCircle, Target, TrendingDown, X } from 'lucide-react';

interface OvertimeExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OvertimeExplainerModal: React.FC<OvertimeExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="overtime-explainer-modal"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-5 sm:p-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100/60">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                45h Weekly & Overtime Logic
              </h3>
              <p className="text-xs text-slate-500">
                How work hours and overtime carry-over operate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 mt-4 leading-relaxed">
          {/* Principle 1 */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Core Target: 45 Hours / Week</span>
            </div>
            <p className="text-slate-600 text-xs">
              Based on a standard 5-day work week (Monday–Friday) with an average of{' '}
              <strong className="text-slate-900">9 hours per day</strong>.
            </p>
          </div>

          {/* Principle 2: Overtime offset examples */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Automatic Overtime Carry-Over Examples
            </h4>

            {/* Example 1 */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-emerald-900 text-xs">
                <span>Example A: +1 Hour Overtime</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-black font-mono text-[11px]">
                  +1.0h OT
                </span>
              </div>
              <ul className="space-y-1 text-slate-700 text-xs">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Monday:</strong> Worked 10 hours (1 hour overtime).</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Tuesday:</strong> Instead of needing 9h, required hours become <strong>8 hours</strong> (or drops the remaining daily pace).</span>
                </li>
              </ul>
            </div>

            {/* Example 2 */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-emerald-900 text-xs">
                <span>Example B: +2 Hours Overtime</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-black font-mono text-[11px]">
                  +2.0h OT
                </span>
              </div>
              <ul className="space-y-1 text-slate-700 text-xs">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Monday:</strong> Worked 11 hours (2 hours overtime).</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Remaining Week:</strong> Weekly remaining target reduces by 2 hours (34h remaining across 4 days = <strong className="font-mono">8.5h/day</strong> pace).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mathematical Formulas */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Calculation Rules
            </h4>
            <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-slate-700">
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                Worked Hours = Sum of daily hours in current week
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                Remaining Hours = max(0, 45 − Worked Hours)
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                Overtime Balance = max(0, Worked Hours − 45)
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                Daily Difference = Daily Hours − 9.0
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
