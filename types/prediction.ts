import type {
  MatchResult,
  FirstGoalTeam,
  FirstGoalTimeRange,
  CardRange,
  HalfTimeResult,
} from './game';

export interface PredictionInitial {
  matchResult: MatchResult;
  koreaScore: number;
  mexicoScore: number;
  totalGoals: number;          // 자동 계산
  koreaFirstScorer: string;    // 선수명 또는 '없음'
  firstGoalTeam: FirstGoalTeam;
  firstGoalTimeRange: FirstGoalTimeRange;
  halfTimeResult: HalfTimeResult;
  cardRange: CardRange;
  mvpInitial: string;
  comment?: string;
}

export interface PredictionHalftime {
  matchResult?: MatchResult;
  koreaScore?: number;
  mexicoScore?: number;
  totalGoals?: number;
  koreaFirstScorer?: string;
  firstGoalTeam?: FirstGoalTeam;
  firstGoalTimeRange?: FirstGoalTimeRange;
  cardRange?: CardRange;
  lockedFields: string[];
}

export interface MvpFinal {
  player: string;
  reason?: string;
}

export interface Participant {
  participantId: string;
  name: string;
  team?: string;
  submittedAt: string;
  predictionInitial: PredictionInitial;
  predictionHalftime?: PredictionHalftime;
  halftimeSubmittedAt?: string;
  mvpFinal?: MvpFinal;
  mvpFinalSubmittedAt?: string;
}
