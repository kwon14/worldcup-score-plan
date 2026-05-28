import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import type { GameStatus } from '@/types/game';

const gameStatusRef = () => doc(db, 'gameStatus', 'current');

export async function getGameStatus(): Promise<GameStatus> {
  const snap = await getDoc(gameStatusRef());
  return snap.exists() ? (snap.data().status as GameStatus) : 'BEFORE_MATCH';
}

export async function setGameStatus(status: GameStatus) {
  await setDoc(gameStatusRef(), { status, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeGameStatus(cb: (status: GameStatus) => void): Unsubscribe {
  return onSnapshot(gameStatusRef(), (snap) => {
    cb(snap.exists() ? (snap.data().status as GameStatus) : 'BEFORE_MATCH');
  }, () => cb('BEFORE_MATCH'));
}
