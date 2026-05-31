import type {
  MatchResult,
  FirstGoalTeam,
  FirstGoalTimeRange,
  CardRange,
  HalfTimeResult,
} from './game';

export interface HalfTimeActualResult {
  koreaHalfScore: number;
  mexicoHalfScore: number;
  halfTimeResult: HalfTimeResult;
  firstGoalOccurred: boolean;
  firstGoalTeam: FirstGoalTeam | null;
  firstGoalTimeRange: FirstGoalTimeRange | null;
  koreaFirstScorerConfirmed: boolean;
  koreaFirstScorer: string | null;
}

export interface ActualResult {
  matchResult: MatchResult;
  koreaScore: number;
  mexicoScore: number;
  totalGoals: number;
  koreaFirstScorer: string;
  firstGoalTeam: FirstGoalTeam;
  firstGoalTimeRange: FirstGoalTimeRange;
  halfTimeResult: HalfTimeResult;
  cardRange: CardRange;
  officialMvp: string;
}

export interface ScoreBreakdown {
  matchResult: number;
  exactScore: number;
  totalGoals: number;
  koreaFirstScorer: number;
  firstGoalTimeRange: number;
  firstGoalTeam: number;
  halfTimeResult: number;
  cardRange: number;
  mvp: number;
}

export interface ParticipantScore {
  participantId: string;
  name: string;
  scores: ScoreBreakdown;
  totalScore: number;
  halfTimeScore: number;
  rank: number;
  usedHalftimeRevision: boolean;
  submittedAt?: unknown;
}
