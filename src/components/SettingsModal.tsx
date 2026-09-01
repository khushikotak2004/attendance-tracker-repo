import React, { useRef } from 'react';
import {
  Cloud,
  Download,
  FileJson,
  LogIn,
  RefreshCw,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord } from '../types';
import { exportRecordsAsJSON } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  onImportRecords: (imported: AttendanceRecord[]) => void;
  onResetToSample: () => void;
  onClearAll: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportRecords,
  onResetToSample,
  onClearAll,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportRecords(parsed);
          onClose();
        }
      } catch (err) {
        console.error('Failed to parse JSON file:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="settings-modal"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Data & Settings
            </h3>
            <p className="text-xs text-slate-500">
              Manage your profile, sync state, and attendance backups
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 mt-4">
          {/* Account Sync Card */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                {user ? <Cloud className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  {user ? 'Cloud Sync Enabled' : 'Profile & Google Sign-In'}
                </span>
                <span className="text-[11px] text-indigo-700">
                  {user ? (
                    <span>Logged in as {profile?.displayName || user.displayName || user.email}</span>
                  ) : (
                    <span>Sign in to store records in cloud</span>
                  )}
                </span>
              </div>
            </div>
            {user ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Export JSON */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Export Attendance Data
              </span>
              <span className="text-[11px] text-slate-500">
                {records.length} records available
              </span>
            </div>
            <button
              onClick={() => exportRecordsAsJSON(records)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Import Attendance Data
              </span>
              <span className="text-[11px] text-slate-500">
                Restore from a previous backup
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          {/* Load Sample Demo */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Load Sample Week Data
              </span>
              <span className="text-[11px] text-slate-500">
                Includes Monday 10h overtime demo
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Load sample week demonstration records?')) {
                  onResetToSample();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Demo</span>
            </button>
          </div>

          {/* Clear All */}
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-rose-950 block">
                Clear All Attendance
              </span>
              <span className="text-[11px] text-rose-700">
                Erase saved records
              </span>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to delete all attendance records?'
                  )
                ) {
                  onClearAll();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200/60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
