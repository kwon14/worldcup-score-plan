import type { TeamLineup } from '@/types/match';
import type { PlayerData } from '@/constants/players';

const DIRECT_INPUT = '직접 입력';

function isKoreaTeam(teamName: string) {
  const lower = teamName.toLowerCase();
  return lower.includes('korea') || teamName.includes('대한민국');
}

function uniquePlayerNames(names: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }

  return result;
}

function namesFromLineup(lineup: TeamLineup) {
  return uniquePlayerNames([
    ...lineup.starters.map((player) => player.name),
    ...lineup.bench.map((player) => player.name),
  ]);
}

function withDirectInput(names: string[]) {
  const withoutDirectInput = names.filter((name) => name !== DIRECT_INPUT);
  return [...withoutDirectInput, DIRECT_INPUT];
}

export function buildLineupPlayerOptions({
  lineups,
  fallbackKoreaPlayers,
  fallbackAwayPlayers,
}: {
  lineups: TeamLineup[];
  fallbackKoreaPlayers: string[];
  fallbackAwayPlayers: string[];
}) {
  const koreaLineup = lineups.find((lineup) => isKoreaTeam(lineup.teamName));
  const awayLineup = lineups.find((lineup) => !isKoreaTeam(lineup.teamName));

  return {
    koreaPlayers: withDirectInput(koreaLineup ? namesFromLineup(koreaLineup) : fallbackKoreaPlayers),
    awayPlayers: withDirectInput(awayLineup ? namesFromLineup(awayLineup) : fallbackAwayPlayers),
  };
}

export function buildPredictionPlayerData(lineupPlayers: string[] | undefined, fallbackPlayers: PlayerData[]) {
  if (!lineupPlayers || lineupPlayers.length === 0) return fallbackPlayers;

  const fallbackByName = new Map(fallbackPlayers.map((player) => [player.name, player]));
  const nonePlayer = fallbackByName.get('없음') ?? {
    name: '없음',
    position: '-',
    club: '-',
    nationalGoals: 0,
    scoringProb: 0,
  };

  const players = uniquePlayerNames(lineupPlayers)
    .filter((name) => name !== '없음' && name !== DIRECT_INPUT)
    .map((name): PlayerData => fallbackByName.get(name) ?? {
      name,
      position: '-',
      club: '라인업',
      nationalGoals: 0,
      scoringProb: 0,
    });

  return [...players, nonePlayer];
}
