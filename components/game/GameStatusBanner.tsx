import { Badge } from '@/components/ui/badge';
import { GAME_STATUS_LABELS } from '@/lib/game/gameState';
import type { GameStatus } from '@/types/game';

const STATUS_STYLE: Record<GameStatus, string> = {
  BEFORE_MATCH: 'bg-blue-50 border-blue-200 text-blue-800',
  FIRST_HALF:   'bg-green-50 border-green-200 text-green-800',
  HALF_TIME:    'bg-yellow-50 border-yellow-200 text-yellow-800',
  SECOND_HALF:  'bg-green-50 border-green-200 text-green-800',
  AFTER_MATCH:  'bg-orange-50 border-orange-200 text-orange-800',
  RESULT_OPEN:  'bg-purple-50 border-purple-200 text-purple-800',
};

const STATUS_DOT: Record<GameStatus, string> = {
  BEFORE_MATCH: 'bg-blue-500',
  FIRST_HALF:   'bg-green-500 animate-pulse',
  HALF_TIME:    'bg-yellow-500 animate-pulse',
  SECOND_HALF:  'bg-green-500 animate-pulse',
  AFTER_MATCH:  'bg-orange-500',
  RESULT_OPEN:  'bg-purple-500',
};

interface GameStatusBannerProps {
  status: GameStatus;
}

export function GameStatusBanner({ status }: GameStatusBannerProps) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${STATUS_STYLE[status]}`}>
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      {GAME_STATUS_LABELS[status]}
    </div>
  );
}
