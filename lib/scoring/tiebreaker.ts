import type { ParticipantScore } from '../../types/result';

function timestampToMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object') {
    const candidate = value as {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();

    const seconds = candidate.seconds ?? candidate._seconds;
    const nanoseconds = candidate.nanoseconds ?? candidate._nanoseconds ?? 0;
    if (typeof seconds === 'number') {
      return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
    }
  }
  return null;
}

function compareSubmittedAt(a: ParticipantScore, b: ParticipantScore): number {
  const aTime = timestampToMillis(a.submittedAt);
  const bTime = timestampToMillis(b.submittedAt);
  if (aTime == null && bTime == null) return 0;
  if (aTime == null) return 1;
  if (bTime == null) return -1;
  return aTime - bTime;
}

export function compareRanking(a: ParticipantScore, b: ParticipantScore): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (b.scores.exactScore !== a.scores.exactScore) return b.scores.exactScore - a.scores.exactScore;
  if (b.scores.matchResult !== a.scores.matchResult) return b.scores.matchResult - a.scores.matchResult;
  if (b.scores.koreaFirstScorer !== a.scores.koreaFirstScorer) return b.scores.koreaFirstScorer - a.scores.koreaFirstScorer;
  if (b.scores.firstGoalTimeRange !== a.scores.firstGoalTimeRange) return b.scores.firstGoalTimeRange - a.scores.firstGoalTimeRange;
  if (a.usedHalftimeRevision !== b.usedHalftimeRevision) return a.usedHalftimeRevision ? 1 : -1;
  return compareSubmittedAt(a, b);
}

// 구성안 9장 동점자 처리 기준 순서대로 정렬
export function sortByRanking(scores: ParticipantScore[]): ParticipantScore[] {
  return [...scores].sort(compareRanking);
}

export function assignRanks(sorted: ParticipantScore[]): ParticipantScore[] {
  let rank = 1;
  return sorted.map((s, i) => {
    if (i > 0 && compareRanking(sorted[i - 1], s) !== 0) {
      rank = i + 1;
    }
    return { ...s, rank };
  });
}
