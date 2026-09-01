import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  LogIn,
  RotateCcw,
  Sliders,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentDate: Date;
  selectedMonday: Date;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onOpenSettings: () => void;
  onOpenExplainer: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onOpenSettings,
  onOpenExplainer,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { user, profile, loading } = useAuth();

  const formattedToday = currentDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = currentDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const avatarInitials = (profile?.displayName || user?.displayName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header
      className="bg-slate-900 text-white shadow-xs border-b border-slate-800/80 sticky top-0 z-40"
      id="app-header"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-3.5">
        {/* Top Bar: Title & Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10 font-bold text-lg shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                  Attendance Tracker
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  45h / Week
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Work Hours & Overtime Offset
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Clock Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-slate-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{formattedToday}</span>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-white tracking-wide font-mono">{formattedTime}</span>
            </div>

            {/* Overtime Logic Help */}
            <button
              onClick={onOpenExplainer}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all border border-slate-700/80 cursor-pointer shadow-2xs"
              title="How 45h weekly overtime adjustment works"
              aria-label="Overtime Rules"
              id="btn-overtime-explainer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Settings & Data */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all border border-slate-700/80 cursor-pointer shadow-2xs"
              title="Data management & options"
              aria-label="Settings"
              id="btn-settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Profile / Auth Button */}
            {!loading && user ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all cursor-pointer shadow-2xs"
                id="btn-user-profile"
                title="View & Edit Profile"
              >
                {profile?.photoURL || user.photoURL ? (
                  <img
                    src={profile?.photoURL || user.photoURL || ''}
                    alt="Avatar"
                    className="w-6 h-6 rounded-lg object-cover ring-1 ring-white/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {avatarInitials}
                  </div>
                )}
                <span className="text-xs font-semibold max-w-[90px] truncate hidden sm:inline">
                  {profile?.displayName || user.displayName || 'Profile'}
                </span>
              </button>
            ) : !loading ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                id="btn-header-login"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Mobile Live Time row */}
        <div className="md:hidden flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-300">{formattedToday}</span>
          </div>
          <div className="font-semibold font-mono text-white tracking-wide">{formattedTime}</div>
        </div>
      </div>
    </header>
  );
};
