import type { MatchResult, FirstGoalTeam, FirstGoalTimeRange, CardRange, HalfTimeResult } from '../types/game';

export const MATCH_RESULT_OPTIONS: { value: MatchResult; label: string }[] = [
  { value: 'KOREA_WIN', label: '대한민국 승' },
  { value: 'DRAW', label: '무승부' },
  { value: 'MEXICO_WIN', label: '멕시코 승' },
];

export const FIRST_GOAL_TEAM_OPTIONS: { value: FirstGoalTeam; label: string }[] = [
  { value: 'KOREA', label: '대한민국' },
  { value: 'MEXICO', label: '멕시코' },
  { value: 'NONE', label: '없음 (무득점)' },
];

export const FIRST_GOAL_TIME_OPTIONS: { value: FirstGoalTimeRange; label: string }[] = [
  { value: '0_15', label: '0~15분 (전반 초반)' },
  { value: '16_30', label: '16~30분 (전반 중반)' },
  { value: '31_45', label: '31~45분+ (전반 후반)' },
  { value: '46_60', label: '46~60분 (후반 초반)' },
  { value: '61_75', label: '61~75분 (후반 중반)' },
  { value: '76_90', label: '76~90분+ (후반 후반)' },
  { value: 'NONE', label: '없음 (무득점)' },
];

export const CARD_RANGE_OPTIONS: { value: CardRange; label: string }[] = [
  { value: '0_2', label: '0~2장' },
  { value: '3_5', label: '3~5장' },
  { value: '6_PLUS', label: '6장 이상' },
];

export const HALF_TIME_RESULT_OPTIONS: { value: HalfTimeResult; label: string }[] = [
  { value: 'KOREA_LEAD', label: '대한민국 리드' },
  { value: 'DRAW', label: '무승부' },
  { value: 'MEXICO_LEAD', label: '멕시코 리드' },
];
