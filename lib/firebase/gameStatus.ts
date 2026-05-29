import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import type { GameStatus } from '@/types/game';

const gameStatusRef = (matchId: string) => doc(db, `m${matchId}_gameStatus`, 'current');

export async function getGameStatus(matchId: string): Promise<GameStatus> {
  const snap = await getDoc(gameStatusRef(matchId));
  return snap.exists() ? (snap.data().status as GameStatus) : 'BEFORE_MATCH';
}

export async function setGameStatus(matchId: string, status: GameStatus) {
  await setDoc(gameStatusRef(matchId), { status, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeGameStatus(matchId: string, cb: (status: GameStatus) => void): Unsubscribe {
  return onSnapshot(gameStatusRef(matchId), (snap) => {
    cb(snap.exists() ? (snap.data().status as GameStatus) : 'BEFORE_MATCH');
  }, () => cb('BEFORE_MATCH'));
}
