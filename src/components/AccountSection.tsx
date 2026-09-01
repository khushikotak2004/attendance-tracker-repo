import React, { useRef, useState } from 'react';
import {
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Cloud,
  Download,
  Edit3,
  FileJson,
  HelpCircle,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Shield,
  Sliders,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, UserProfile } from '../types';
import { exportRecordsAsJSON } from '../utils/storage';

interface AccountSectionProps {
  records: AttendanceRecord[];
  onImportRecords: (imported: AttendanceRecord[]) => void;
  onResetToSample: () => void;
  onClearAll: () => void;
  onOpenExplainer: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  records,
  onImportRecords,
  onResetToSample,
  onClearAll,
  onOpenExplainer,
}) => {
  const { user, profile, updateUserProfile, logout, signInWithGoogle } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>(
    profile?.displayName || user?.displayName || ''
  );
  const [jobTitle, setJobTitle] = useState<string>(profile?.jobTitle || 'Team Member');
  const [department, setDepartment] = useState<string>(profile?.department || 'Engineering');
  const [role, setRole] = useState<string>(profile?.role || 'Employee');
  const [weeklyTargetHours, setWeeklyTargetHours] = useState<number>(
    profile?.weeklyTargetHours || 45
  );
  const [dailyTargetHours, setDailyTargetHours] = useState<number>(
    profile?.dailyTargetHours || 9
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state when profile loads
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setJobTitle(profile.jobTitle || 'Team Member');
      setDepartment(profile.department || 'Engineering');
      setRole(profile.role || 'Employee');
      setWeeklyTargetHours(profile.weeklyTargetHours || 45);
      setDailyTargetHours(profile.dailyTargetHours || 9);
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        role: role.trim(),
        weeklyTargetHours: Number(weeklyTargetHours),
        dailyTargetHours: Number(dailyTargetHours),
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  // Switch Account handler: logs out current user and prompts Google Sign-In
  const handleSwitchAccount = async () => {
    if (window.confirm('Switch account? You will be prompted to sign in with a different account.')) {
      try {
        await logout();
        await signInWithGoogle();
      } catch (err) {
        console.error('Switch account error:', err);
      }
    }
  };

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
        }
      } catch (err) {
        console.error('Failed to parse JSON file:', err);
      }
    };
    reader.readAsText(file);
  };

  const avatarInitials = (displayName || user?.displayName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-5" id="account-page-view">
      {/* 1. Account Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile?.photoURL || user?.photoURL ? (
              <img
                src={profile?.photoURL || user?.photoURL || ''}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs ring-2 ring-indigo-500/20">
                {avatarInitials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 leading-tight truncate">
                  {profile?.displayName || user?.displayName || 'Active User'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            id="btn-edit-profile"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isEditing ? 'Close Editor' : 'Edit Profile & Goals'}</span>
          </button>
        </div>

        {/* User Badges */}
        <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            {profile?.jobTitle || 'Team Member'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            {profile?.department || 'Engineering'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            {profile?.role || 'Employee'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono">
            {weeklyTargetHours}h / week target
          </span>
        </div>

        {/* Profile Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>
            </div>

            {/* Target Hours Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Weekly Target (Hours)
                </label>
                <input
                  type="number"
                  min={10}
                  max={80}
                  value={weeklyTargetHours}
                  onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Daily Baseline (Hours)
                </label>
                <input
                  type="number"
                  min={4}
                  max={16}
                  value={dailyTargetHours}
                  onChange={(e) => setDailyTargetHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                {saving ? 'Saving Profile...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile and target hours updated successfully!</span>
          </div>
        )}

        {/* 2. Switch Account & Logout Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
            id="btn-switch-account"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Switch Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Sign out of your account?')) {
                logout();
              }
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-rose-200/80"
            id="btn-account-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* 3. Cloud Synchronization Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cloud Synchronization
            </h4>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Sync Active</span>
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Your attendance records, daily timestamps, and custom targets are synced securely to Firebase Firestore database across all your devices.
        </p>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono break-all">
          Account User ID: <strong className="text-slate-800">{user?.uid}</strong>
        </div>
      </div>

      {/* 4. Data Backup & Tools Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Download className="w-5 h-5 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Data Backup & Utilities
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => exportRecordsAsJSON(records)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export Records (JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import Records (JSON)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Load sample demonstration week records?')) {
                onResetToSample();
              }
            }}
            className="font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            Load Demonstration Week
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Erase all attendance records for this account? This cannot be undone.')) {
                onClearAll();
              }
            }}
            className="font-bold text-rose-600 hover:underline cursor-pointer"
          >
            Clear All Records
          </button>
        </div>
      </div>
    </div>
  );
};
