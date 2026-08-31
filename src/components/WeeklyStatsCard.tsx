import React from 'react';
import { Award, CheckCircle2, Flame, Info, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { WeekSummary } from '../types';
import { formatHoursAndMinutes } from '../utils/timeUtils';

interface WeeklyStatsCardProps {
  summary: WeekSummary;
  onOpenExplainer: () => void;
}

export const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({ summary, onOpenExplainer }) => {
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
  } = summary;

  // Color theme based on target completion
  const isOvertimeState = overtimeBalance > 0;
  const progressClamped = Math.min(100, Math.max(0, progressPercentage));

  // Determine dynamic advice based on overtime adjustment
  const standardHoursForRemaining = remainingWeekdaysCount * 9;
  const overtimeDifference = standardHoursForRemaining - remainingHours;

  let overtimeInsight = '';
  let insightType: 'positive' | 'warning' | 'completed' | 'neutral' = 'neutral';

  if (isTargetMet) {
    insightType = 'completed';
    overtimeInsight = isOvertimeState
      ? `🎉 Fantastic! 45-hour weekly target accomplished with ${overtimeFormatted} extra overtime.`
      : `🎉 Congratulations! You have completed your 45.0 hours weekly requirement.`;
  } else if (remainingWeekdaysCount > 0) {
    if (overtimeDifference > 0.05) {
      insightType = 'positive';
      const reducedPace = formatHoursAndMinutes(adjustedDailyTargetForRemaining);
      overtimeInsight = `⚡ Overtime advantage: Due to earlier extra hours, your required pace for the remaining ${remainingWeekdaysCount} workday${remainingWeekdaysCount > 1 ? 's' : ''} is reduced to ~${reducedPace}/day (instead of 9.0h).`;
    } else if (overtimeDifference < -0.05) {
      insightType = 'warning';
      const increasedPace = formatHoursAndMinutes(adjustedDailyTargetForRemaining);
      overtimeInsight = `⏳ Pace adjustment: To reach 45h across the remaining ${remainingWeekdaysCount} workday${remainingWeekdaysCount > 1 ? 's' : ''}, you need an average of ~${increasedPace}/day.`;
    } else {
      insightType = 'neutral';
      overtimeInsight = `🎯 On track: ${remainingWeekdaysCount} workday${remainingWeekdaysCount > 1 ? 's' : ''} remaining at standard 9.0h/day pace to hit your 45h goal.`;
    }
  } else if (remainingHours > 0) {
    insightType = 'warning';
    overtimeInsight = `⚠️ Weekday schedule ended with ${remainingFormatted} remaining to reach 45h.`;
  }

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden"
      id="weekly-summary-dashboard"
    >
      {/* Background soft glow accent */}
      <div
        className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25 ${
          isTargetMet ? 'bg-emerald-400' : 'bg-indigo-400'
        }`}
      />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Weekly Performance & Requirement
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              {workedFormatted}
            </h3>
            <span className="text-sm font-semibold text-slate-500">
              / {targetHours}.0h target
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {isTargetMet ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Requirement Met</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200/80 shadow-2xs">
            <Target className="w-3.5 h-3.5" />
            <span>{progressPercentage}% Completed</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Weekly Target Progress (45h Base)</span>
          <span className="font-bold text-slate-800">{progressPercentage}%</span>
        </div>
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/90 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isTargetMet
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600'
            }`}
            style={{ width: `${progressClamped}%` }}
          />
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-4">
        {/* Stat 1: Target */}
        <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500">Weekly Target</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">45.0</span>
            <span className="text-xs text-slate-500 font-medium">hours</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">5 days × 9.0h</span>
        </div>

        {/* Stat 2: Completed */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-indigo-700">Hours Completed</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-indigo-900 font-mono">
              {workedHours.toFixed(1)}
            </span>
            <span className="text-xs text-indigo-600 font-medium">hrs</span>
          </div>
          <span className="text-[10px] font-semibold text-indigo-600 mt-1">
            {workedFormatted} total
          </span>
        </div>

        {/* Stat 3: Remaining */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
            remainingHours === 0
              ? 'bg-emerald-50/60 border-emerald-200/80'
              : 'bg-amber-50/60 border-amber-200/80'
          }`}
        >
          <span
            className={`text-[11px] font-semibold ${
              remainingHours === 0 ? 'text-emerald-700' : 'text-amber-800'
            }`}
          >
            Hours Remaining
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                remainingHours === 0 ? 'text-emerald-700' : 'text-amber-900'
              }`}
            >
              {remainingHours.toFixed(1)}
            </span>
            <span
              className={`text-xs font-medium ${
                remainingHours === 0 ? 'text-emerald-600' : 'text-amber-700'
              }`}
            >
              hrs
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold mt-1 ${
              remainingHours === 0 ? 'text-emerald-600' : 'text-amber-700'
            }`}
          >
            {remainingHours === 0 ? 'Goal Achieved' : `${remainingFormatted} left`}
          </span>
        </div>

        {/* Stat 4: Overtime Balance */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
            overtimeBalance > 0
              ? 'bg-emerald-50/80 border-emerald-200'
              : 'bg-slate-50/90 border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold ${
                overtimeBalance > 0 ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              Overtime Balance
            </span>
            {overtimeBalance > 0 && <Flame className="w-3.5 h-3.5 text-emerald-600" />}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                overtimeBalance > 0 ? 'text-emerald-700' : 'text-slate-700'
              }`}
            >
              {overtimeBalance > 0 ? `+${overtimeBalance.toFixed(1)}` : '0.0'}
            </span>
            <span
              className={`text-xs ${
                overtimeBalance > 0 ? 'text-emerald-700 font-bold' : 'text-slate-500'
              }`}
            >
              hrs
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold mt-1 ${
              overtimeBalance > 0 ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {overtimeBalance > 0 ? `+${overtimeFormatted} extra` : 'No excess hours'}
          </span>
        </div>
      </div>

      {/* Dynamic Overtime Adjustment Insight Box */}
      <div
        className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
          insightType === 'completed'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : insightType === 'positive'
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            : insightType === 'warning'
            ? 'bg-amber-50/60 border-amber-200 text-amber-900'
            : 'bg-slate-50 border-slate-200/90 text-slate-700'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            insightType === 'completed' || insightType === 'positive'
              ? 'bg-emerald-100 text-emerald-700'
              : insightType === 'warning'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {insightType === 'completed' ? (
            <Award className="w-4 h-4" />
          ) : insightType === 'positive' ? (
            <TrendingDown className="w-4 h-4" />
          ) : insightType === 'warning' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Weekly Requirement & Overtime Offset
            </span>
            <button
              onClick={onOpenExplainer}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors cursor-pointer shrink-0"
            >
              How it works
            </button>
          </div>
          <p className="text-xs sm:text-sm font-medium mt-1 leading-snug">
            {overtimeInsight}
          </p>
        </div>
      </div>
    </div>
  );
};
