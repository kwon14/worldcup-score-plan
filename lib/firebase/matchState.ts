import {
  doc, getDoc, setDoc, onSnapshot,
  collection, addDoc, deleteDoc, query, orderBy,
  serverTimestamp, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { MatchStatusShort, GoalEvent, CardEvent } from '@/types/match';

const matchStateRef = (matchId: string) => doc(db, `m${matchId}_matchState`, 'current');
const matchEventsRef = (matchId: string) => collection(db, `m${matchId}_matchEvents`);

export interface MatchStateDoc {
  status: MatchStatusShort;
  koreaScore: number;
  mexicoScore: number;
  koreaHalfScore: number | null;
  mexicoHalfScore: number | null;
  halfTimeResult?: string;
  firstGoalTeam?: string;
  firstGoalTimeRange?: string;
  koreaFirstScorer?: string;
  mexicoFirstScorer?: string;
  koreaLineupPlayers?: string[];
  awayLineupPlayers?: string[];
  updatedAt: unknown;
}

export type MatchEventDoc = (
  | (Omit<GoalEvent, 'type'> & { eventKind: 'goal'; goalType: GoalEvent['type'] })
  | (CardEvent & { eventKind: 'card' })
) & { id: string; createdAt: unknown };

export async function getMatchState(matchId: string): Promise<MatchStateDoc | null> {
  const snap = await getDoc(matchStateRef(matchId));
  return snap.exists() ? (snap.data() as MatchStateDoc) : null;
}

export async function initMatchState(matchId: string) {
  const snap = await getDoc(matchStateRef(matchId));
  if (!snap.exists()) {
    await setDoc(matchStateRef(matchId), {
      status: 'NS', koreaScore: 0, mexicoScore: 0,
      koreaHalfScore: null, mexicoHalfScore: null,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function updateMatchState(matchId: string, payload: Partial<Omit<MatchStateDoc, 'updatedAt'>>) {
  await setDoc(matchStateRef(matchId), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addGoalEvent(matchId: string, goal: GoalEvent): Promise<string> {
  const { type: goalType, ...rest } = goal;
  const ref = await addDoc(matchEventsRef(matchId), {
    eventKind: 'goal', goalType, ...rest, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addCardEvent(matchId: string, card: CardEvent): Promise<string> {
  const ref = await addDoc(matchEventsRef(matchId), {
    eventKind: 'card', ...card, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteMatchEvent(matchId: string, id: string) {
  await deleteDoc(doc(db, `m${matchId}_matchEvents`, id));
}

export function subscribeMatchState(matchId: string, cb: (state: MatchStateDoc | null) => void): Unsubscribe {
  return onSnapshot(matchStateRef(matchId), (snap) => {
    cb(snap.exists() ? (snap.data() as MatchStateDoc) : null);
  }, () => cb(null));
}

export function subscribeMatchEvents(matchId: string, cb: (events: MatchEventDoc[]) => void): Unsubscribe {
  const q = query(matchEventsRef(matchId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MatchEventDoc));
    cb(events);
  }, () => cb([]));
}
