/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { ActiveSessionWidget } from './components/ActiveSessionWidget';
import { AttendanceEntryCard } from './components/AttendanceEntryCard';
import { EditEntryModal } from './components/EditEntryModal';
import { Header } from './components/Header';
import { OvertimeExplainerModal } from './components/OvertimeExplainerModal';
import { SettingsModal } from './components/SettingsModal';
import { WeeklyBreakdownTable } from './components/WeeklyBreakdownTable';
import { WeeklyStatsCard } from './components/WeeklyStatsCard';
import { WeekNavigator } from './components/WeekNavigator';
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
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadRecordsFromStorage());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedMonday, setSelectedMonday] = useState<Date>(() => getMondayOfWeek(new Date()));

  // Modals state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [manualEntryDefaultDate, setManualEntryDefaultDate] = useState<string>(
    formatToDateKey(new Date())
  );

  // Live timer tick every minute (or second when needed)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to localStorage on any record change
  useEffect(() => {
    saveRecordsToStorage(records);
  }, [records]);

  // Current Week Monday for comparison
  const currentWeekMonday = useMemo(() => getMondayOfWeek(currentDate), [currentDate]);
  const isCurrentWeek =
    formatToDateKey(selectedMonday) === formatToDateKey(currentWeekMonday);

  // Calculate week summary for selected week
  const weekSummary = useMemo(() => {
    return calculateWeekSummary(selectedMonday, records, currentDate);
  }, [selectedMonday, records, currentDate]);

  // Find active record if currently clocked in
  const todayKey = formatToDateKey(currentDate);
  const activeRecord = useMemo(() => {
    return records.find((r) => r.outTime === null);
  }, [records]);

  // Today's summary in current week
  const todaySummary = useMemo(() => {
    return weekSummary.days.find((d) => d.date === todayKey);
  }, [weekSummary, todayKey]);

  // Trigger celebration confetti when 45h target is reached
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
      date: dateKey,
      inTime: now.toISOString(),
      outTime: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setRecords((prev) => [newRecord, ...prev]);
  };

  // Clock Out Now Action
  const handleClockOutNow = () => {
    if (!activeRecord) return;
    const now = new Date();

    setRecords((prev) =>
      prev.map((r) =>
        r.id === activeRecord.id
          ? {
              ...r,
              outTime: now.toISOString(),
              updatedAt: Date.now(),
            }
          : r
      )
    );
  };

  // Save manual / entry card record with smart day merging
  const handleSaveRecord = (
    entryData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setRecords((prev) => {
      // Find if there is an existing record on this date that is incomplete
      const matchingIdx = prev.findIndex((r) => r.date === entryData.date);

      if (matchingIdx !== -1) {
        const existing = prev[matchingIdx];

        // Case 1: User submitted only Out Time, and existing record has In Time without Out Time -> complete the shift if chronologically valid!
        if (
          entryData.outTime &&
          !entryData.inTime &&
          existing.inTime &&
          !existing.outTime &&
          new Date(entryData.outTime).getTime() > new Date(existing.inTime).getTime()
        ) {
          const updated = [...prev];
          updated[matchingIdx] = {
            ...existing,
            outTime: entryData.outTime,
            breakMinutes: entryData.breakMinutes !== undefined ? entryData.breakMinutes : existing.breakMinutes,
            note: entryData.note || existing.note,
            updatedAt: Date.now(),
          };
          return updated;
        }

        // Case 2: User submitted only In Time, and existing record has Out Time without In Time -> complete the shift if chronologically valid!
        if (
          entryData.inTime &&
          !entryData.outTime &&
          !existing.inTime &&
          existing.outTime &&
          new Date(entryData.inTime).getTime() < new Date(existing.outTime).getTime()
        ) {
          const updated = [...prev];
          updated[matchingIdx] = {
            ...existing,
            inTime: entryData.inTime,
            breakMinutes: entryData.breakMinutes !== undefined ? entryData.breakMinutes : existing.breakMinutes,
            note: entryData.note || existing.note,
            updatedAt: Date.now(),
          };
          return updated;
        }

        // Case 3: Incomplete existing record and new entry provides both -> update existing if valid
        if (
          (!existing.inTime || !existing.outTime) &&
          entryData.inTime &&
          entryData.outTime &&
          new Date(entryData.outTime).getTime() > new Date(entryData.inTime).getTime()
        ) {
          const updated = [...prev];
          updated[matchingIdx] = {
            ...existing,
            inTime: entryData.inTime,
            outTime: entryData.outTime,
            breakMinutes: entryData.breakMinutes !== undefined ? entryData.breakMinutes : existing.breakMinutes,
            note: entryData.note || existing.note,
            updatedAt: Date.now(),
          };
          return updated;
        }
      }

      // Otherwise create a new independent record
      const newRecord: AttendanceRecord = {
        ...entryData,
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return [newRecord, ...prev];
    });
  };

  // Update existing record
  const handleUpdateRecord = (updated: AttendanceRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Delete record
  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Quick log for a specific day from the table
  const handleQuickLogForDay = (dateKey: string) => {
    setManualEntryDefaultDate(dateKey);
    const element = document.getElementById('attendance-entry-card');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reset to sample records
  const handleResetToSample = () => {
    const sample = generateSampleRecords();
    setRecords(sample);
    setSelectedMonday(getMondayOfWeek(new Date()));
  };

  // Clear all records
  const handleClearAll = () => {
    clearAllRecordsFromStorage();
    setRecords([]);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        currentDate={currentDate}
        selectedMonday={selectedMonday}
        isCurrentWeek={isCurrentWeek}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCurrentWeek={handleCurrentWeek}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExplainer={() => setIsExplainerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5.5">
        {/* Week Navigator */}
        <WeekNavigator
          weekLabel={weekSummary.weekLabel}
          isCurrentWeek={isCurrentWeek}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onCurrentWeek={handleCurrentWeek}
        />

        {/* Top Section: Weekly Summary Dashboard & Overtime Balance */}
        <WeeklyStatsCard
          summary={weekSummary}
          onOpenExplainer={() => setIsExplainerOpen(true)}
        />

        {/* Today's Active Status & 1-Tap Clock In/Out */}
        {isCurrentWeek && (
          <ActiveSessionWidget
            todaySummary={todaySummary}
            activeRecord={activeRecord}
            onClockInNow={handleClockInNow}
            onClockOutNow={handleClockOutNow}
            onOpenManualEntry={() => {
              setManualEntryDefaultDate(todayKey);
              document.getElementById('attendance-entry-card')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* Middle Section: Attendance Entry Card */}
        <AttendanceEntryCard
          onSaveRecord={handleSaveRecord}
          defaultDate={manualEntryDefaultDate}
          existingRecords={records}
        />

        {/* Bottom Section: Weekly Attendance Table / Daily Breakdown */}
        <WeeklyBreakdownTable
          summary={weekSummary}
          onEditRecord={(record) => setEditingRecord(record)}
          onDeleteRecord={handleDeleteRecord}
          onQuickLogForDay={handleQuickLogForDay}
        />
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-slate-600 border-t border-slate-200/80 mt-auto bg-slate-100">
        <p className="font-medium">45-Hour Weekly Attendance & Overtime Tracker • Personal Time & Attendance System</p>
      </footer>

      {/* Modals */}
      <EditEntryModal
        record={editingRecord}
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        onUpdate={handleUpdateRecord}
        onDelete={handleDeleteRecord}
      />

      <OvertimeExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        records={records}
        onImportRecords={(imported) => setRecords(imported)}
        onResetToSample={handleResetToSample}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
