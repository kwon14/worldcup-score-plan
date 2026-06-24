import assert from 'node:assert/strict';
import { GROUP_A_RESULTS, GROUP_A_RESULTS_UPDATED_AT, GROUP_A_STANDINGS } from '../constants/groupStage';

assert.deepEqual(
  GROUP_A_STANDINGS.map((team) => ({
    rank: team.rank,
    name: team.name,
    played: team.played,
    win: team.win,
    draw: team.draw,
    loss: team.loss,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    points: team.points,
  })),
  [
    { rank: 1, name: '멕시코', played: 2, win: 2, draw: 0, loss: 0, goalsFor: 3, goalsAgainst: 0, points: 6 },
    { rank: 2, name: '대한민국', played: 2, win: 1, draw: 0, loss: 1, goalsFor: 2, goalsAgainst: 2, points: 3 },
    { rank: 3, name: '체코', played: 2, win: 0, draw: 1, loss: 1, goalsFor: 2, goalsAgainst: 3, points: 1 },
    { rank: 4, name: '남아프리카공화국', played: 2, win: 0, draw: 1, loss: 1, goalsFor: 1, goalsAgainst: 3, points: 1 },
  ],
);

const mexicoKorea = GROUP_A_RESULTS.find((result) => result.homeTeam === '멕시코' && result.awayTeam === '대한민국');
assert.ok(mexicoKorea);
assert.equal(mexicoKorea.status, '종료');
assert.equal(mexicoKorea.homeScore, 1);
assert.equal(mexicoKorea.awayScore, 0);

assert.match(GROUP_A_RESULTS_UPDATED_AT, /2026년 6월 19일/);

console.log('group stage tests passed');
