/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Layers,
  LogIn,
  Sliders,
  User as UserIcon,
} from 'lucide-react';
import { AccountSection } from './components/AccountSection';
import { AuthLandingGate } from './components/AuthLandingGate';
import { ClockingLandingSection } from './components/ClockingLandingSection';
import { EditEntryModal } from './components/EditEntryModal';
import { AppPage, Header } from './components/Header';
import { OvertimeExplainerModal } from './components/OvertimeExplainerModal';
import { ProfileModal } from './components/ProfileModal';
import { ReportsSection } from './components/ReportsSection';
import { SettingsModal } from './components/SettingsModal';
import { useAuth } from './context/AuthContext';
import {
  clearAllUserRecordsFromFirestore,
  deleteRecordFromFirestore,
  saveRecordToFirestore,
  subscribeToUserAttendanceRecords,
  syncLocalRecordsToFirestore,
} from './services/attendanceFirestoreService';
import { AttendanceRecord } from './types';
import { calculateWeekSummary } from './utils/calculations';
import {
  clearAllRecordsFromStorage,
  generateSampleRecords,
  loadRecordsFromStorage,
  saveRecordsToStorage,
} from './utils/storage';
import { formatToDateKey, getMondayOfWeek } from './utils/timeUtils';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadRecordsFromStorage());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedMonday, setSelectedMonday] = useState<Date>(() => getMondayOfWeek(new Date()));

  // Active Page State: 'clocking' (Landing page) | 'reports' | 'account'
  const [activePage, setActivePage] = useState<AppPage>('clocking');

  // Modals state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Firestore records when user is logged in
  useEffect(() => {
    if (user) {
      // Sync local cache to Firestore if any exists
      const local = loadRecordsFromStorage();
      if (local && local.length > 0) {
        syncLocalRecordsToFirestore(user.uid, local).catch((err) =>
          console.warn('Initial sync error:', err)
        );
      }

      const unsubscribe = subscribeToUserAttendanceRecords(
        user.uid,
        (firestoreRecords) => {
          setRecords(firestoreRecords);
          saveRecordsToStorage(firestoreRecords);
        },
        (err) => {
          console.warn('Using local fallback due to sync error:', err);
        }
      );

      return () => unsubscribe();
    } else {
      setRecords(loadRecordsFromStorage());
    }
  }, [user]);

  // Persist to local storage as cache/offline
  useEffect(() => {
    saveRecordsToStorage(records);
  }, [records]);

  // Current Week Monday for comparison
  const currentWeekMonday = useMemo(() => getMondayOfWeek(currentDate), [currentDate]);
  const isCurrentWeek =
    formatToDateKey(selectedMonday) === formatToDateKey(currentWeekMonday);

  // Calculate week summary for selected week (respecting custom user profile goals if set)
  const weekSummary = useMemo(() => {
    const targetWeekly = profile?.weeklyTargetHours || 45;
    const targetDaily = profile?.dailyTargetHours || 9;
    const baseSummary = calculateWeekSummary(selectedMonday, records, currentDate);

    if (targetWeekly !== 45 || targetDaily !== 9) {
      const overtimeBalance = baseSummary.workedHours - targetWeekly;
      const remainingHours = Math.max(0, targetWeekly - baseSummary.workedHours);
      const progressPercentage = Math.min(
        100,
        Math.round((baseSummary.workedHours / targetWeekly) * 100)
      );

      return {
        ...baseSummary,
        targetHours: targetWeekly,
        standardDailyHours: targetDaily,
        remainingHours,
        overtimeBalance,
        progressPercentage,
        isTargetMet: baseSummary.workedHours >= targetWeekly,
      };
    }

    return baseSummary;
  }, [selectedMonday, records, currentDate, profile]);

  // Find active record if currently clocked in
  const todayKey = formatToDateKey(currentDate);
  const activeRecord = useMemo(() => {
    return records.find((r) => r.outTime === null);
  }, [records]);

  // Today's summary in current week
  const todaySummary = useMemo(() => {
    return weekSummary.days.find((d) => d.date === todayKey);
  }, [weekSummary, todayKey]);

  // Trigger celebration confetti when weekly target is reached
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);
  useEffect(() => {
    if (weekSummary.isTargetMet && !hasCelebrated) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }
      setHasCelebrated(true);
    } else if (!weekSummary.isTargetMet) {
      setHasCelebrated(false);
    }
  }, [weekSummary.isTargetMet, hasCelebrated]);

  // Navigation handlers
  const handlePrevWeek = () => {
    setSelectedMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setSelectedMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setSelectedMonday(getMondayOfWeek(new Date()));
  };

  // Clock In Now Action
  const handleClockInNow = () => {
    const now = new Date();
    const dateKey = formatToDateKey(now);

    const newRecord: AttendanceRecord = {
      id: `rec-${Date.now()}`,
      userId: user?.uid,
      date: dateKey,
      inTime: now.toISOString(),
      outTime: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    if (user) {
      saveRecordToFirestore(user.uid, newRecord).catch((err) =>
        console.error('Firestore save error:', err)
      );
    }
  };

  // Clock Out Now Action
  const handleClockOutNow = () => {
    if (!activeRecord) return;
    const now = new Date();

    const updatedRecord = {
      ...activeRecord,
      outTime: now.toISOString(),
      updatedAt: Date.now(),
    };

    setRecords((prev) =>
      prev.map((r) => (r.id === activeRecord.id ? updatedRecord : r))
    );

    if (user) {
      saveRecordToFirestore(user.uid, updatedRecord).catch((err) =>
        console.error('Firestore update error:', err)
      );
    }
  };

  // Save manual / entry card record with smart day merging
  const handleSaveRecord = (
    entryData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const matchingIdx = records.findIndex((r) => r.date === entryData.date);

    if (matchingIdx !== -1) {
      const existing = records[matchingIdx];

      // Update existing record for the same day
      const updated: AttendanceRecord = {
        ...existing,
        inTime: entryData.inTime !== undefined ? entryData.inTime : existing.inTime,
        outTime: entryData.outTime !== undefined ? entryData.outTime : existing.outTime,
        breakMinutes:
          entryData.breakMinutes !== undefined ? entryData.breakMinutes : existing.breakMinutes,
        note: entryData.note || existing.note,
        updatedAt: Date.now(),
      };

      setRecords((prev) => prev.map((r, i) => (i === matchingIdx ? updated : r)));
      if (user) {
        saveRecordToFirestore(user.uid, updated).catch((err) =>
          console.error('Firestore update error:', err)
        );
      }
      return;
    }

    // Otherwise create a new independent record
    const newRecord: AttendanceRecord = {
      ...entryData,
      userId: user?.uid,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setRecords((prev) => [newRecord, ...prev]);
    if (user) {
      saveRecordToFirestore(user.uid, newRecord).catch((err) =>
        console.error('Firestore save error:', err)
      );
    }
  };

  // Update existing record from modal
  const handleUpdateRecord = (updated: AttendanceRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (user) {
      saveRecordToFirestore(user.uid, updated).catch((err) =>
        console.error('Firestore update error:', err)
      );
    }
  };

  // Delete record
  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    if (user) {
      deleteRecordFromFirestore(recordId).catch((err) =>
        console.error('Firestore delete error:', err)
      );
    }
  };

  // Quick log for a specific day from the reports page
  const handleQuickLogForDay = (dateKey: string) => {
    setActivePage('clocking');
    setTimeout(() => {
      const inputDate = document.getElementById('input-clocking-date') as HTMLInputElement;
      if (inputDate) {
        inputDate.value = dateKey;
        inputDate.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const element = document.getElementById('attendance-entry-card');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // Reset to sample records
  const handleResetToSample = () => {
    const sample = generateSampleRecords();
    setRecords(sample);
    setSelectedMonday(getMondayOfWeek(new Date()));
    if (user) {
      syncLocalRecordsToFirestore(user.uid, sample).catch((err) =>
        console.error('Firestore sample sync error:', err)
      );
    }
  };

  // Clear all records
  const handleClearAll = () => {
    clearAllRecordsFromStorage();
    setRecords([]);
    if (user) {
      clearAllUserRecordsFromFirestore(user.uid).catch((err) =>
        console.error('Firestore clear error:', err)
      );
    }
  };

  // 1. Initial Authentication Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/30 mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Loading Attendance Tracker...</p>
      </div>
    );
  }

  // 2. Authentication Gate: If user is not authenticated, show Auth Landing Gate
  if (!user) {
    return <AuthLandingGate />;
  }

  // 3. Authenticated User: Dedicated Multi-Page View System
  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header & Navigation Bar */}
      <Header
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        currentDate={currentDate}
        onOpenExplainer={() => setIsExplainerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Single-Page Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* PAGE 1: Clocking Landing Page */}
        {activePage === 'clocking' && (
          <ClockingLandingSection
            currentDate={currentDate}
            selectedMonday={selectedMonday}
            isCurrentWeek={isCurrentWeek}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onCurrentWeek={handleCurrentWeek}
            weekLabel={weekSummary.weekLabel}
            onSaveRecord={handleSaveRecord}
            existingRecords={records}
            activeRecord={activeRecord}
            onClockInNow={handleClockInNow}
            onClockOutNow={handleClockOutNow}
            todaySummary={todaySummary}
            weekSummary={weekSummary}
            onNavigateToReports={() => setActivePage('reports')}
          />
        )}

        {/* PAGE 2: Reports & Breakdown Page */}
        {activePage === 'reports' && (
          <ReportsSection
            summary={weekSummary}
            selectedMonday={selectedMonday}
            isCurrentWeek={isCurrentWeek}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onCurrentWeek={handleCurrentWeek}
            onEditRecord={(rec) => setEditingRecord(rec)}
            onDeleteRecord={handleDeleteRecord}
            onQuickLogForDay={handleQuickLogForDay}
            onNavigateToClocking={() => setActivePage('clocking')}
            allRecords={records}
          />
        )}

        {/* PAGE 3: Account & Management Page */}
        {activePage === 'account' && (
          <AccountSection
            records={records}
            onImportRecords={(imported) => {
              setRecords(imported);
              if (user) {
                syncLocalRecordsToFirestore(user.uid, imported).catch((err) =>
                  console.error('Import sync error:', err)
                );
              }
            }}
            onResetToSample={handleResetToSample}
            onClearAll={handleClearAll}
            onOpenExplainer={() => setIsExplainerOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">Attendance Tracker</span>
            <span>•</span>
            <span>45h Weekly Target</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActivePage('reports')}
              className={`transition-colors cursor-pointer ${
                activePage === 'reports' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Reports & Overtime
            </button>
            <button
              onClick={() => setActivePage('clocking')}
              className={`transition-colors cursor-pointer ${
                activePage === 'clocking' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Clocking Entry
            </button>
            <button
              onClick={() => setActivePage('account')}
              className={`transition-colors cursor-pointer ${
                activePage === 'account' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Account & Sync
            </button>
          </div>
        </div>
      </footer>

      {/* Edit Entry Modal */}
      {editingRecord && (
        <EditEntryModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleUpdateRecord}
        />
      )}

      {/* 45h Overtime Rules Explainer Modal */}
      {isExplainerOpen && (
        <OvertimeExplainerModal onClose={() => setIsExplainerOpen(false)} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          records={records}
          onImportRecords={(imported) => {
            setRecords(imported);
            if (user) {
              syncLocalRecordsToFirestore(user.uid, imported).catch((err) =>
                console.error('Settings import error:', err)
              );
            }
          }}
          onResetToSample={handleResetToSample}
          onClearAll={handleClearAll}
          onOpenExplainer={() => {
            setIsSettingsOpen(false);
            setIsExplainerOpen(true);
          }}
        />
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onOpenSettings={() => {
            setIsProfileOpen(false);
            setIsSettingsOpen(true);
          }}
        />
      )}
    </div>
  );
}
