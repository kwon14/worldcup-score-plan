import assert from 'node:assert/strict';
import { buildLineupPlayerOptions, buildPredictionPlayerData, translateLineupName } from '../lib/lineups/playerOptions';
import type { PlayerData } from '../constants/players';
import type { TeamLineup } from '../types/match';

const lineups: TeamLineup[] = [
  {
    teamName: 'South Africa',
    formation: '4-2-3-1',
    starters: [
      { name: 'Ronwen Williams', number: 1, position: 'GK' },
      { name: 'Lyle Foster', number: 9, position: 'FW' },
    ],
    bench: [
      { name: 'Themba Zwane', number: 11, position: 'MF' },
      { name: 'Lyle Foster', number: 9, position: 'FW' },
    ],
  },
  {
    teamName: 'Korea Republic',
    formation: '3-4-2-1',
    starters: [
      { name: 'Son Heung-Min', number: 7, position: 'FW' },
      { name: 'Lee Kang-In', number: 19, position: 'MF' },
    ],
    bench: [
      { name: 'Cho Gue-Sung', number: 9, position: 'FW' },
    ],
  },
];

const options = buildLineupPlayerOptions({
  lineups,
  fallbackKoreaPlayers: ['손흥민', '이강인', '직접 입력'],
  fallbackAwayPlayers: ['P. 타우', '직접 입력'],
});

assert.deepEqual(options.koreaPlayers, ['손흥민', '이강인', '조규성', '직접 입력']);
assert.deepEqual(options.awayPlayers, ['론웬 윌리엄스', '라일 포스터', '템바 즈와네', '직접 입력']);

const fallback = buildLineupPlayerOptions({
  lineups: [],
  fallbackKoreaPlayers: ['손흥민', '직접 입력'],
  fallbackAwayPlayers: ['P. 타우', '직접 입력'],
});
assert.deepEqual(fallback.koreaPlayers, ['손흥민', '직접 입력']);
assert.deepEqual(fallback.awayPlayers, ['P. 타우', '직접 입력']);

const fallbackData: PlayerData[] = [
  { name: '손흥민', position: 'FW', club: 'LA FC', nationalGoals: 35, scoringProb: 28 },
  { name: '없음', position: '-', club: '-', nationalGoals: 0, scoringProb: 5 },
];
const predictionPlayers = buildPredictionPlayerData(['Son Heung-Min', '손흥민', 'Lee Kang-In'], fallbackData);
assert.deepEqual(
  predictionPlayers.map((player) => [player.name, player.position, player.club]),
  [
    ['손흥민', 'FW', 'LA FC'],
    ['이강인', '-', '라인업'],
    ['없음', '-', '-'],
  ],
);
assert.equal(translateLineupName('Kim Min-Jae'), '김민재');
assert.equal(translateLineupName('Evidence Makgopa'), '에비던스 마크고파');
assert.equal(translateLineupName('Unknown Player'), 'Unknown Player');

console.log('lineup player options tests passed');
