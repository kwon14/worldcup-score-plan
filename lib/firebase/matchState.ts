import {
  doc, getDoc, setDoc, onSnapshot,
  collection, addDoc, deleteDoc, query, orderBy,
  serverTimestamp, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { MatchStatusShort, GoalEvent, CardEvent } from '@/types/match';

// ── 컬렉션/문서 경로 ──────────────────────────────────────────────────────────
const matchStateRef = () => doc(db, 'matchState', 'current');
const matchEventsRef = () => collection(db, 'matchEvents');

// ── 타입 ─────────────────────────────────────────────────────────────────────
export interface MatchStateDoc {
  status: MatchStatusShort;
  koreaScore: number;
  mexicoScore: number;
  koreaHalfScore: number | null;
  mexicoHalfScore: number | null;
  // Set by admin after first half (halftime-input)
  halfTimeResult?: string;
  firstGoalTeam?: string;
  firstGoalTimeRange?: string;
  koreaFirstScorer?: string;
  mexicoFirstScorer?: string;
  updatedAt: unknown;
}

export type MatchEventDoc = (
  | (Omit<GoalEvent, 'type'> & { eventKind: 'goal'; goalType: GoalEvent['type'] })
  | (CardEvent & { eventKind: 'card' })
) & { id: string; createdAt: unknown };

// ── 경기 상태 읽기/쓰기 ───────────────────────────────────────────────────────
export async function getMatchState(): Promise<MatchStateDoc | null> {
  const snap = await getDoc(matchStateRef());
  return snap.exists() ? (snap.data() as MatchStateDoc) : null;
}

export async function initMatchState() {
  const snap = await getDoc(matchStateRef());
  if (!snap.exists()) {
    await setDoc(matchStateRef(), {
      status: 'NS',
      koreaScore: 0,
      mexicoScore: 0,
      koreaHalfScore: null,
      mexicoHalfScore: null,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function updateMatchState(payload: Partial<Omit<MatchStateDoc, 'updatedAt'>>) {
  await setDoc(matchStateRef(), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
}

// ── 이벤트 CRUD ───────────────────────────────────────────────────────────────
export async function addGoalEvent(goal: GoalEvent): Promise<string> {
  const { type: goalType, ...rest } = goal;
  const ref = await addDoc(matchEventsRef(), {
    eventKind: 'goal',
    goalType,
    ...rest,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addCardEvent(card: CardEvent): Promise<string> {
  const ref = await addDoc(matchEventsRef(), {
    eventKind: 'card',
    ...card,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteMatchEvent(id: string) {
  await deleteDoc(doc(db, 'matchEvents', id));
}

// ── 실시간 구독 ───────────────────────────────────────────────────────────────
export function subscribeMatchState(
  cb: (state: MatchStateDoc | null) => void
): Unsubscribe {
  return onSnapshot(matchStateRef(), (snap) => {
    cb(snap.exists() ? (snap.data() as MatchStateDoc) : null);
  }, () => cb(null));
}

export function subscribeMatchEvents(
  cb: (events: MatchEventDoc[]) => void
): Unsubscribe {
  const q = query(matchEventsRef(), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MatchEventDoc));
    cb(events);
  });
}
