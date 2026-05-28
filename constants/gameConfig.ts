export const SCORE_WEIGHTS = {
  matchResult: 20,
  exactScore: 25,
  totalGoals: 10,
  koreaFirstScorer: 15,
  firstGoalTimeRange: 10,
  firstGoalTeam: 5,
  halfTimeResult: 5,
  cardRange: 5,
  mvp: 5,
} as const;

export const TOTAL_MAX_SCORE = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);

// 인접 시간대 판단을 위한 순서값
export const GOAL_TIME_ORDER: Record<string, number> = {
  '0_15': 0,
  '16_30': 1,
  '31_45': 2,
  '46_60': 3,
  '61_75': 4,
  '76_90': 5,
  'NONE': -1,
};
