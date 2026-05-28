import { SCORE_WEIGHTS, GOAL_TIME_ORDER } from '../../constants/gameConfig';
import type { Participant } from '../../types/prediction';
import type { ActualResult, ScoreBreakdown } from '../../types/result';

function getEffectivePrediction(participant: Participant) {
  const initial = participant.predictionInitial;
  const halftime = participant.predictionHalftime;

  return {
    matchResult: halftime?.matchResult ?? initial.matchResult,
    koreaScore: halftime?.koreaScore ?? initial.koreaScore,
    mexicoScore: halftime?.mexicoScore ?? initial.mexicoScore,
    totalGoals: halftime?.totalGoals ?? initial.totalGoals,
    koreaFirstScorer: halftime?.koreaFirstScorer ?? initial.koreaFirstScorer,
    firstGoalTeam: halftime?.firstGoalTeam ?? initial.firstGoalTeam,
    firstGoalTimeRange: halftime?.firstGoalTimeRange ?? initial.firstGoalTimeRange,
    halfTimeResult: initial.halfTimeResult, // 수정 불가
    cardRange: halftime?.cardRange ?? initial.cardRange,
    mvp: participant.mvpFinal?.player ?? initial.mvpInitial,
  };
}

function scoreExactScore(
  pred: { koreaScore: number; mexicoScore: number; matchResult: string },
  actual: ActualResult,
): number {
  if (pred.koreaScore === actual.koreaScore && pred.mexicoScore === actual.mexicoScore) {
    return SCORE_WEIGHTS.exactScore; // 25점
  }
  if (pred.matchResult === actual.matchResult) {
    return 10; // 승패 일치
  }
  if (pred.koreaScore === actual.koreaScore || pred.mexicoScore === actual.mexicoScore) {
    return 5; // 한 팀 득점 일치
  }
  return 0;
}

function scoreTotalGoals(predTotal: number, actualTotal: number): number {
  const diff = Math.abs(predTotal - actualTotal);
  if (diff === 0) return SCORE_WEIGHTS.totalGoals;
  if (diff === 1) return 5;
  return 0;
}

function scoreFirstGoalTimeRange(predRange: string, actualRange: string): number {
  if (predRange === actualRange) return SCORE_WEIGHTS.firstGoalTimeRange;
  const predOrder = GOAL_TIME_ORDER[predRange];
  const actualOrder = GOAL_TIME_ORDER[actualRange];
  if (predOrder >= 0 && actualOrder >= 0 && Math.abs(predOrder - actualOrder) === 1) {
    return 5; // 인접 시간대
  }
  return 0;
}

export function calculateScore(
  participant: Participant,
  actual: ActualResult,
): ScoreBreakdown {
  const pred = getEffectivePrediction(participant);

  return {
    matchResult: pred.matchResult === actual.matchResult ? SCORE_WEIGHTS.matchResult : 0,
    exactScore: scoreExactScore(pred, actual),
    totalGoals: scoreTotalGoals(pred.totalGoals, actual.totalGoals),
    koreaFirstScorer: pred.koreaFirstScorer === actual.koreaFirstScorer ? SCORE_WEIGHTS.koreaFirstScorer : 0,
    firstGoalTimeRange: scoreFirstGoalTimeRange(pred.firstGoalTimeRange, actual.firstGoalTimeRange),
    firstGoalTeam: pred.firstGoalTeam === actual.firstGoalTeam ? SCORE_WEIGHTS.firstGoalTeam : 0,
    halfTimeResult: pred.halfTimeResult === actual.halfTimeResult ? SCORE_WEIGHTS.halfTimeResult : 0,
    cardRange: pred.cardRange === actual.cardRange ? SCORE_WEIGHTS.cardRange : 0,
    mvp: pred.mvp === actual.officialMvp ? SCORE_WEIGHTS.mvp : 0,
  };
}
