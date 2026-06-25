import type { GameStatus } from '@/types/game';
import type { MatchStatusShort } from '@/types/match';

export const MATCH_STATUS_TO_GAME_STATUS: Partial<Record<MatchStatusShort, GameStatus>> = {
  NS: 'BEFORE_MATCH',
  '1H': 'FIRST_HALF',
  HT: 'HALF_TIME',
  '2H': 'SECOND_HALF',
  FT: 'AFTER_MATCH',
};

export const GAME_STATUS_TO_MATCH_STATUS: Partial<Record<GameStatus, MatchStatusShort>> = {
  BEFORE_MATCH: 'NS',
  FIRST_HALF: '1H',
  HALF_TIME: 'HT',
  SECOND_HALF: '2H',
  AFTER_MATCH: 'FT',
};

export function toGameStatus(status: MatchStatusShort): GameStatus | undefined {
  return MATCH_STATUS_TO_GAME_STATUS[status];
}

export function toMatchStatus(status: GameStatus): MatchStatusShort | undefined {
  return GAME_STATUS_TO_MATCH_STATUS[status];
}
