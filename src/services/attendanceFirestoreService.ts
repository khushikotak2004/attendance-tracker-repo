import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord } from '../types';

const COLLECTION_NAME = 'attendance_records';

/**
 * Listen to real-time attendance records for a specific authenticated user
 */
export function subscribeToUserAttendanceRecords(
  userId: string,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: docSnap.id,
          userId: data.userId,
          date: data.date,
          inTime: data.inTime || null,
          outTime: data.outTime || null,
          breakMinutes: data.breakMinutes,
          note: data.note,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });
      // Sort newest date and newest creation first
      records.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
      onUpdate(records);
    },
    (err) => {
      console.error('Firestore attendance sync error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update an attendance record in Firestore for a user
 */
export async function saveRecordToFirestore(
  userId: string,
  record: AttendanceRecord
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, record.id);
  const dataToSave = {
    userId,
    date: record.date,
    inTime: record.inTime || null,
    outTime: record.outTime || null,
    breakMinutes: record.breakMinutes ?? 0,
    note: record.note ?? '',
    createdAt: record.createdAt || Date.now(),
    updatedAt: record.updatedAt || Date.now(),
  };
  await setDoc(docRef, dataToSave, { merge: true });
}

/**
 * Delete an attendance record from Firestore
 */
export async function deleteRecordFromFirestore(recordId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, recordId);
  await deleteDoc(docRef);
}

/**
 * Bulk upload / migrate local records to Firestore upon user login
 */
export async function syncLocalRecordsToFirestore(
  userId: string,
  localRecords: AttendanceRecord[]
): Promise<void> {
  if (!localRecords || localRecords.length === 0) return;

  const batch = writeBatch(db);
  for (const rec of localRecords) {
    const docRef = doc(db, COLLECTION_NAME, rec.id);
    batch.set(
      docRef,
      {
        userId,
        date: rec.date,
        inTime: rec.inTime || null,
        outTime: rec.outTime || null,
        breakMinutes: rec.breakMinutes ?? 0,
        note: rec.note ?? '',
        createdAt: rec.createdAt || Date.now(),
        updatedAt: rec.updatedAt || Date.now(),
      },
      { merge: true }
    );
  }
  await batch.commit();
}

/**
 * Clear all records for a user from Firestore
 */
export async function clearAllUserRecordsFromFirestore(userId: string): Promise<void> {
  const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}
