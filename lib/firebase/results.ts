import { doc, setDoc, onSnapshot, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import type { ActualResult } from '@/types/result';

export type ActualResultDoc = ActualResult & { updatedAt: unknown };

const resultRef = () => doc(db, 'actualResult', 'current');

export async function saveActualResult(data: ActualResult): Promise<void> {
  await setDoc(resultRef(), { ...data, updatedAt: serverTimestamp() });
}

export function subscribeActualResult(cb: (result: ActualResultDoc | null) => void): Unsubscribe {
  return onSnapshot(resultRef(), (snap) => {
    cb(snap.exists() ? (snap.data() as ActualResultDoc) : null);
  });
}
