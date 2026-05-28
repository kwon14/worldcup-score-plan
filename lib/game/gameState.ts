import type { GameStatus } from '../../types/game';

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  BEFORE_MATCH: '경기 전 예측 제출 가능',
  FIRST_HALF: '전반 진행 중',
  HALF_TIME: '하프타임 - 수정 가능',
  SECOND_HALF: '후반 진행 중',
  AFTER_MATCH: 'MVP 최종 수정 가능',
  RESULT_OPEN: '최종 순위 공개',
};

export function canSubmitPrediction(status: GameStatus): boolean {
  return status === 'BEFORE_MATCH';
}

export function canModifyHalftime(status: GameStatus): boolean {
  return status === 'HALF_TIME';
}

export function canModifyMvp(status: GameStatus): boolean {
  return status === 'AFTER_MATCH';
}

export function isResultVisible(status: GameStatus): boolean {
  return status === 'RESULT_OPEN';
}
