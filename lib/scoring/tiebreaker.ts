import type { ParticipantScore } from '../../types/result';

// 구성안 9장 동점자 처리 기준 순서대로 정렬
export function sortByRanking(scores: ParticipantScore[]): ParticipantScore[] {
  return [...scores].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.scores.exactScore !== a.scores.exactScore) return b.scores.exactScore - a.scores.exactScore;
    if (b.scores.matchResult !== a.scores.matchResult) return b.scores.matchResult - a.scores.matchResult;
    if (b.scores.koreaFirstScorer !== a.scores.koreaFirstScorer) return b.scores.koreaFirstScorer - a.scores.koreaFirstScorer;
    if (b.scores.firstGoalTimeRange !== a.scores.firstGoalTimeRange) return b.scores.firstGoalTimeRange - a.scores.firstGoalTimeRange;
    // 5번: 하프타임 수정 없이 더 높은 점수 — 구현 시 별도 필드 필요
    return 0; // 최종 동점 → 공동 순위
  });
}

export function assignRanks(sorted: ParticipantScore[]): ParticipantScore[] {
  let rank = 1;
  return sorted.map((s, i) => {
    if (i > 0 && sorted[i - 1].totalScore !== s.totalScore) {
      rank = i + 1;
    }
    return { ...s, rank };
  });
}
