import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  LogIn,
  RotateCcw,
  Sliders,
  User as UserIcon,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AppPage = 'clocking' | 'reports' | 'account';

interface HeaderProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  currentDate: Date;
  onOpenExplainer: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  currentDate,
  onOpenExplainer,
  onOpenSettings,
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
      className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40"
      id="app-header"
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div
            onClick={() => onNavigate('clocking')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md ring-1 ring-white/10 font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                  Attendance Tracker
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  45h Target
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 hidden xs:block">
                Clocking, Overtime & Reports
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Tabs */}
          <nav className="hidden sm:flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'reports'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              id="nav-tab-reports"
            >
              <Layers className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('clocking')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'clocking'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              id="nav-tab-clocking"
            >
              <Clock className="w-4 h-4" />
              <span>Clocking Entry</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('account')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'account'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              id="nav-tab-account"
            >
              <UserIcon className="w-4 h-4" />
              <span>Account</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Time Clock */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-slate-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{formattedToday}</span>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-white tracking-wide font-mono">{formattedTime}</span>
            </div>

            {/* Overtime Policy Help Button */}
            <button
              onClick={onOpenExplainer}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all border border-slate-700/80 cursor-pointer shadow-2xs"
              title="How 45h weekly overtime adjustment works"
              aria-label="Overtime Rules"
              id="btn-overtime-explainer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Profile Avatar button */}
            {!loading && user && (
              <button
                onClick={() => onNavigate('account')}
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  activePage === 'account'
                    ? 'bg-indigo-600/30 border-indigo-500/60 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                }`}
                id="btn-user-profile-header"
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
                <span className="text-xs font-semibold max-w-[90px] truncate hidden md:inline">
                  {profile?.displayName || user.displayName || 'Account'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Page Navigation Bar */}
        <div className="sm:hidden mt-2.5 pt-2 border-t border-slate-800/80">
          <nav className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePage === 'reports'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('clocking')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePage === 'clocking'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Clocking</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('account')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePage === 'account'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Account</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
