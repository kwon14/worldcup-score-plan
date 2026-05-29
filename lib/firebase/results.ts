import { doc, setDoc, onSnapshot, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import type { ActualResult } from '@/types/result';

export type ActualResultDoc = ActualResult & { updatedAt: unknown };

const resultRef = (matchId: string) => doc(db, `m${matchId}_actualResult`, 'current');

export async function saveActualResult(matchId: string, data: ActualResult): Promise<void> {
  await setDoc(resultRef(matchId), { ...data, updatedAt: serverTimestamp() });
}

export function subscribeActualResult(matchId: string, cb: (result: ActualResultDoc | null) => void): Unsubscribe {
  return onSnapshot(resultRef(matchId), (snap) => {
    cb(snap.exists() ? (snap.data() as ActualResultDoc) : null);
  }, () => cb(null));
}
