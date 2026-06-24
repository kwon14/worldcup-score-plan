import assert from 'node:assert/strict';
import { DEFAULT_MATCH_ID, MATCHES } from '../constants/matches';

assert.equal(DEFAULT_MATCH_ID, '3');
assert.deepEqual(Object.keys(MATCHES), ['1', '2', '3']);

const match = MATCHES['3'];
assert.equal(match.id, '3');
assert.equal(match.label, '3차전');
assert.equal(match.awayTeamName, '남아공');
assert.equal(match.awayTeamFlag, '🇿🇦');
assert.equal(match.date, '2026년 6월 25일 10:00 (KST)');
assert.equal(match.localDate, '현지: 6월 24일 19:00 (CST)');
assert.equal(match.venue, '에스타디오 BBVA, 과달루페');
assert.ok(match.awayPlayerData.some((player) => player.name === '없음'));
assert.equal(match.matchResultLabels.MEXICO_WIN, '🇿🇦 남아공 승');
assert.equal(match.halfTimeResultLabels.MEXICO_LEAD, '🇿🇦 남아공 리드');
assert.equal(match.firstGoalTeamLabels.MEXICO, '🇿🇦 남아공');

console.log('matches tests passed');
