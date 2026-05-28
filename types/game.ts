export type GameStatus =
  | 'BEFORE_MATCH'   // 경기 전 예측 제출 가능
  | 'FIRST_HALF'     // 전반 진행 중, 수정 불가
  | 'HALF_TIME'      // 중간 점수 공개 및 일부 항목 수정 가능
  | 'SECOND_HALF'    // 후반 진행 중, 수정 불가
  | 'AFTER_MATCH'    // MVP 최종 수정 가능
  | 'RESULT_OPEN';   // 최종 순위 공개

export type MatchResult = 'KOREA_WIN' | 'DRAW' | 'MEXICO_WIN';
export type FirstGoalTeam = 'KOREA' | 'MEXICO' | 'NONE';
export type FirstGoalTimeRange =
  | '0_15' | '16_30' | '31_45' | '46_60' | '61_75' | '76_90' | 'NONE';
export type CardRange = '0_2' | '3_5' | '6_PLUS';
export type HalfTimeResult = 'KOREA_LEAD' | 'DRAW' | 'MEXICO_LEAD';
