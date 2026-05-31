import assert from 'node:assert/strict';
import { sortByRanking, assignRanks } from '../lib/scoring/tiebreaker';
import type { ParticipantScore, ScoreBreakdown } from '../types/result';

const ZERO_SCORES: ScoreBreakdown = {
  matchResult: 0,
  exactScore: 0,
  totalGoals: 0,
  koreaFirstScorer: 0,
  firstGoalTimeRange: 0,
  firstGoalTeam: 0,
  halfTimeResult: 0,
  cardRange: 0,
  mvp: 0,
};

function score(
  name: string,
  overrides: Omit<Partial<ParticipantScore>, 'scores'> & { scores?: Partial<ScoreBreakdown> } = {},
): ParticipantScore {
  return {
    participantId: name,
    name,
    scores: { ...ZERO_SCORES, ...(overrides.scores ?? {}) },
    totalScore: overrides.totalScore ?? 50,
    halfTimeScore: overrides.halfTimeScore ?? 0,
    rank: overrides.rank ?? 0,
    usedHalftimeRevision: overrides.usedHalftimeRevision ?? false,
    submittedAt: overrides.submittedAt,
  };
}

function names(scores: ParticipantScore[]) {
  return scores.map((s) => s.name);
}

function run() {
  assert.deepEqual(
    names(sortByRanking([
      score('late', { submittedAt: new Date('2026-06-19T00:00:02Z') }),
      score('early', { submittedAt: new Date('2026-06-19T00:00:01Z') }),
    ])),
    ['early', 'late'],
    '동점이면 더 빠른 제출자가 앞서야 합니다',
  );

  assert.deepEqual(
    names(sortByRanking([
      score('revised', { usedHalftimeRevision: true, submittedAt: new Date('2026-06-19T00:00:01Z') }),
      score('not revised', { usedHalftimeRevision: false, submittedAt: new Date('2026-06-19T00:00:02Z') }),
    ])),
    ['not revised', 'revised'],
    '앞선 타이브레이커가 모두 같으면 하프타임 수정 미사용자가 앞서야 합니다',
  );

  assert.deepEqual(
    names(sortByRanking([
      score('first-goal-time', { scores: { firstGoalTimeRange: 10 } }),
      score('korea-scorer', { scores: { koreaFirstScorer: 15 } }),
      score('match-result', { scores: { matchResult: 20 } }),
      score('exact-score', { scores: { exactScore: 25 } }),
    ])),
    ['exact-score', 'match-result', 'korea-scorer', 'first-goal-time'],
    '세부 점수 타이브레이커 순서를 적용해야 합니다',
  );

  const ranked = assignRanks(sortByRanking([
    score('later', { submittedAt: new Date('2026-06-19T00:00:02Z') }),
    score('earlier', { submittedAt: new Date('2026-06-19T00:00:01Z') }),
    score('lower', { totalScore: 40 }),
  ]));
  assert.deepEqual(
    ranked.map((s) => [s.name, s.rank]),
    [['earlier', 1], ['later', 2], ['lower', 3]],
    'rank도 전체 타이브레이커 결과 기준으로 부여해야 합니다',
  );
}

run();
console.log('tiebreaker tests passed');
