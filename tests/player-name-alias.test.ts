import assert from 'node:assert/strict';
import { canonicalPlayerName, samePlayerName } from '../lib/lineups/playerOptions';
import { computeScoreBreakdown } from '../lib/scoring/calculator';
import type { ActualResult } from '../types/result';

assert.equal(canonicalPlayerName('E. 마크고파'), '에비던스 마크고파');
assert.equal(canonicalPlayerName('L. 포스터'), '라일 포스터');
assert.equal(canonicalPlayerName('Oh Hyeon-Gyu'), '오현규');
assert.equal(canonicalPlayerName('손흥민'), '손흥민');
assert.equal(samePlayerName('E. 마크고파', '에비던스 마크고파'), true);

const actual: ActualResult = {
  matchResult: 'DRAW',
  koreaScore: 1,
  mexicoScore: 1,
  totalGoals: 2,
  koreaFirstScorer: '오현규',
  firstGoalTeam: 'KOREA',
  firstGoalTimeRange: '0_15',
  halfTimeResult: 'DRAW',
  cardRange: '3_5',
  officialMvp: '라일 포스터',
};

const score = computeScoreBreakdown({
  matchResult: 'DRAW',
  koreaScore: 1,
  mexicoScore: 1,
  koreaFirstScorer: 'Oh Hyeon-Gyu',
  firstGoalTeam: 'KOREA',
  firstGoalTimeRange: '0_15',
  halfTimeResult: 'DRAW',
  cardRange: '3_5',
  mvp: 'L. 포스터',
}, actual);

assert.equal(score.koreaFirstScorer, 15);
assert.equal(score.mvp, 5);

console.log('player name alias tests passed');
