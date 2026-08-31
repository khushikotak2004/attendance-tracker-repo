import { AttendanceRecord } from '../types';
import { formatToDateKey, getMondayOfWeek } from './timeUtils';

const STORAGE_KEY = 'attendance_tracker_records_v1';

/**
 * Generate realistic sample data for current week showcasing the prompt's examples
 * (e.g. Monday worked 10 hours = +1h overtime, demonstrating automatic reduction for remaining days)
 */
export function generateSampleRecords(): AttendanceRecord[] {
  const now = new Date();
  const monday = getMondayOfWeek(now);
  const records: AttendanceRecord[] = [];

  // Monday: 08:30 AM to 06:30 PM (10 hours -> +1h overtime)
  const monDate = new Date(monday);
  const monKey = formatToDateKey(monDate);
  const monIn = new Date(monDate);
  monIn.setHours(8, 30, 0, 0);
  const monOut = new Date(monDate);
  monOut.setHours(18, 30, 0, 0);

  records.push({
    id: `rec-sample-mon-${Date.now()}`,
    date: monKey,
    inTime: monIn.toISOString(),
    outTime: monOut.toISOString(),
    note: 'Worked 10 hours (+1h overtime)',
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000,
  });

  // Tuesday: 09:00 AM to 05:30 PM (8.5 hours -> -30m deficit)
  const tueDate = new Date(monday);
  tueDate.setDate(monday.getDate() + 1);
  const tueKey = formatToDateKey(tueDate);
  const tueIn = new Date(tueDate);
  tueIn.setHours(9, 0, 0, 0);
  const tueOut = new Date(tueDate);
  tueOut.setHours(17, 30, 0, 0);

  records.push({
    id: `rec-sample-tue-${Date.now()}`,
    date: tueKey,
    inTime: tueIn.toISOString(),
    outTime: tueOut.toISOString(),
    note: 'Left early for doctor appointment (8.5 hrs)',
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000,
  });

  return records;
}

/**
 * Load records from localStorage
 */
export function loadRecordsFromStorage(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time loading - initialize with sample records so user immediately sees calculations
      const initial = generateSampleRecords();
      saveRecordsToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error loading attendance records from storage:', err);
    return [];
  }
}

/**
 * Save records to localStorage
 */
export function saveRecordsToStorage(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving attendance records to storage:', err);
  }
}

/**
 * Clear all records from storage
 */
export function clearAllRecordsFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing storage:', err);
  }
}

/**
 * Export data to JSON file
 */
export function exportRecordsAsJSON(records: AttendanceRecord[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `attendance_records_export_${formatToDateKey(new Date())}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
