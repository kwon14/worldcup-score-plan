import type { MatchStatusShort, GoalEvent, CardEvent } from '@/types/match';

export interface MatchState {
  status: MatchStatusShort;
  koreaScore: number;
  mexicoScore: number;
  koreaHalfScore: number | null;
  mexicoHalfScore: number | null;
  goals: (GoalEvent & { id: string })[];
  cards: (CardEvent & { id: string })[];
  updatedAt: string;
}

// Next.js dev 서버 단일 프로세스 내 전역 상태
// (globalThis 사용으로 HMR 리로드 시에도 유지)
declare global {
  // eslint-disable-next-line no-var
  var __matchStore: MatchState | undefined;
}

function createInitialState(): MatchState {
  return {
    status: 'NS',
    koreaScore: 0,
    mexicoScore: 0,
    koreaHalfScore: null,
    mexicoHalfScore: null,
    goals: [],
    cards: [],
    updatedAt: new Date().toISOString(),
  };
}

function getStore(): MatchState {
  if (!globalThis.__matchStore) {
    globalThis.__matchStore = createInitialState();
  }
  return globalThis.__matchStore;
}

function touch() {
  getStore().updatedAt = new Date().toISOString();
}

// ── 상태 조회 ─────────────────────────────────────────────────────────────────
export function getMatchState(): MatchState {
  return getStore();
}

// ── 경기 상태 / 스코어 업데이트 ───────────────────────────────────────────────
export function updateMatchStatus(payload: {
  status?: MatchStatusShort;
  koreaScore?: number;
  mexicoScore?: number;
  koreaHalfScore?: number | null;
  mexicoHalfScore?: number | null;
}) {
  const store = getStore();
  if (payload.status !== undefined) store.status = payload.status;
  if (payload.koreaScore !== undefined) store.koreaScore = payload.koreaScore;
  if (payload.mexicoScore !== undefined) store.mexicoScore = payload.mexicoScore;
  if (payload.koreaHalfScore !== undefined) store.koreaHalfScore = payload.koreaHalfScore;
  if (payload.mexicoHalfScore !== undefined) store.mexicoHalfScore = payload.mexicoHalfScore;
  touch();
}

// ── 골 추가/삭제 ──────────────────────────────────────────────────────────────
export function addGoal(goal: Omit<GoalEvent, never> & { id?: string }): string {
  const store = getStore();
  const id = goal.id ?? `goal_${Date.now()}`;
  store.goals.push({ ...goal, id });
  store.goals.sort((a, b) => a.time - b.time);
  touch();
  return id;
}

export function removeGoal(id: string) {
  const store = getStore();
  store.goals = store.goals.filter((g) => g.id !== id);
  touch();
}

// ── 카드 추가/삭제 ────────────────────────────────────────────────────────────
export function addCard(card: Omit<CardEvent, never> & { id?: string }): string {
  const store = getStore();
  const id = card.id ?? `card_${Date.now()}`;
  store.cards.push({ ...card, id });
  store.cards.sort((a, b) => a.time - b.time);
  touch();
  return id;
}

export function removeCard(id: string) {
  const store = getStore();
  store.cards = store.cards.filter((c) => c.id !== id);
  touch();
}

// ── 초기화 ────────────────────────────────────────────────────────────────────
export function resetMatchStore() {
  globalThis.__matchStore = createInitialState();
}
