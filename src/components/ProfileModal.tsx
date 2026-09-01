import React, { useState } from 'react';
import {
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  Save,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateUserProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle || 'Team Member');
  const [department, setDepartment] = useState(profile?.department || 'Engineering');
  const [role, setRole] = useState(profile?.role || 'Employee');
  const [weeklyTargetHours, setWeeklyTargetHours] = useState(profile?.weeklyTargetHours || 45);
  const [dailyTargetHours, setDailyTargetHours] = useState(profile?.dailyTargetHours || 9);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !user) return null;

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
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  // Avatar initials if no photoURL
  const avatarInitials = (displayName || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="profile-modal"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {profile?.photoURL || user.photoURL ? (
              <img
                src={profile?.photoURL || user.photoURL || ''}
                alt="Avatar"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-base flex items-center justify-center shadow-2xs">
                {avatarInitials}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {profile?.displayName || user.displayName || 'User Profile'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{user.email}</span>
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

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Account Status Badge Card */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 text-indigo-950 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold">Google & Cloud Synced Account</span>
                <p className="text-[11px] text-indigo-700">
                  Your work logs and attendance records are stored securely in Firestore
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] tracking-wide shrink-0">
              ACTIVE
            </span>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4" id="profile-edit-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Product / IT"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Type
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none cursor-pointer"
                >
                  <option value="Employee">Full-Time Employee</option>
                  <option value="Contractor">Contractor / Consultant</option>
                  <option value="Intern">Intern / Trainee</option>
                  <option value="Manager">Team Manager</option>
                </select>
              </div>
            </div>

            {/* Attendance Preferences */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Work Hour Target Preferences
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Weekly Goal
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <input
                      type="number"
                      min={10}
                      max={80}
                      value={weeklyTargetHours}
                      onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                      className="w-14 font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg px-2 py-0.5"
                    />
                    <span className="text-xs font-bold text-slate-700">hrs</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Standard Daily
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <input
                      type="number"
                      min={4}
                      max={16}
                      value={dailyTargetHours}
                      onChange={(e) => setDailyTargetHours(Number(e.target.value))}
                      className="w-14 font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg px-2 py-0.5"
                    />
                    <span className="text-xs font-bold text-slate-700">hrs</span>
                  </div>
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Modal Footer: Logout Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">UID: {user.uid.substring(0, 10)}...</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer border border-rose-200/60"
            id="btn-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
