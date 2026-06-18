import type { ParticipantScore } from '@/types/result';

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const SCORE_LABELS: { key: keyof ParticipantScore['scores']; label: string }[] = [
  { key: 'matchResult',      label: '결과' },
  { key: 'exactScore',       label: '스코어' },
  { key: 'koreaFirstScorer', label: '득점자' },
  { key: 'firstGoalTimeRange', label: '첫골' },
  { key: 'firstGoalTeam',    label: '첫골팀' },
  { key: 'halfTimeResult',   label: '전반' },
  { key: 'cardRange',        label: '카드' },
  { key: 'mvp',              label: 'MVP' },
];

function timestampToMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object') {
    const c = value as { toMillis?: () => number; seconds?: number; _seconds?: number };
    if (typeof c.toMillis === 'function') return c.toMillis();
    const seconds = c.seconds ?? c._seconds;
    if (typeof seconds === 'number') return seconds * 1000;
  }
  return null;
}

function getTiebreakerLabel(a: ParticipantScore, b: ParticipantScore): string | null {
  if (a.totalScore !== b.totalScore) return null;
  if (a.scores.exactScore !== b.scores.exactScore) return '스코어 점수 우위';
  if (a.scores.matchResult !== b.scores.matchResult) return '경기결과 점수 우위';
  if (a.scores.koreaFirstScorer !== b.scores.koreaFirstScorer) return '득점자 점수 우위';
  if (a.scores.firstGoalTimeRange !== b.scores.firstGoalTimeRange) return '첫골시간 점수 우위';
  if (a.usedHalftimeRevision !== b.usedHalftimeRevision) return '하프타임 수정 미사용';
  const aTime = timestampToMillis(a.submittedAt);
  const bTime = timestampToMillis(b.submittedAt);
  if (aTime != null && bTime != null && aTime !== bTime) return '빠른 예측 제출';
  return null;
}

interface RankingTableProps {
  scores: ParticipantScore[];
  showDetail?: boolean;
}

export function RankingTable({ scores, showDetail = false }: RankingTableProps) {
  return (
    <div className="divide-y">
      {scores.map((s, i) => {
        const next = scores[i + 1];
        const tiebreakerLabel = next && next.totalScore === s.totalScore
          ? getTiebreakerLabel(s, next)
          : null;

        return (
          <div key={s.participantId} className="px-4 py-3">
            {/* 상단: 순위 · 이름 · 총점 */}
            <div className="flex items-center gap-3">
              <span className="text-xl w-7 shrink-0">
                {RANK_MEDAL[s.rank] ?? <span className="text-base font-bold text-muted-foreground">{s.rank}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{s.name}</span>
                  {s.usedHalftimeRevision && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">수정</span>
                  )}
                  {tiebreakerLabel && (
                    <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-xs text-blue-600">
                      동점 우선: {tiebreakerLabel}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xl font-bold text-korea-red shrink-0">{s.totalScore}점</span>
            </div>

            {/* 하단: 항목별 세부 점수 */}
            {showDetail && (
              <div className="mt-2 ml-10 flex flex-wrap gap-x-3 gap-y-1">
                {SCORE_LABELS.map(({ key, label }) => (
                  <span key={key} className="text-xs text-muted-foreground">
                    {label} <span className="font-medium text-foreground">{s.scores[key]}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
