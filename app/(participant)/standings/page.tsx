import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Users, CheckCircle2 } from 'lucide-react';
import { GameStatusBanner } from '@/components/game/GameStatusBanner';
import type { GameStatus } from '@/types/game';

// ─── 모의 데이터 (Firebase 연동 전) ──────────────────────────────────────────

const MOCK_STATUS: GameStatus = 'BEFORE_MATCH';

const MOCK_STATS = {
  total: 12,

  matchResult: { KOREA_WIN: 7, DRAW: 3, MEXICO_WIN: 2 },

  topScores: [
    { score: '2 : 1', count: 4 },
    { score: '1 : 0', count: 3 },
    { score: '1 : 1', count: 2 },
    { score: '기타', count: 3 },
  ],

  firstGoalTeam: { KOREA: 8, MEXICO: 3, NONE: 1 },

  koreaFirstScorer: [
    { name: '손흥민', count: 5 },
    { name: '황희찬', count: 3 },
    { name: '이강인', count: 2 },
    { name: '없음', count: 1 },
    { name: '기타', count: 1 },
  ],

  mexicoFirstScorer: [
    { name: 'S. 히메네스', count: 4 },
    { name: 'R. 히메네스', count: 4 },
    { name: '없음', count: 2 },
    { name: '기타', count: 2 },
  ],

  cardRange: { '0_2': 2, '3_5': 8, '6_PLUS': 2 },

  halfTimeResult: { KOREA_LEAD: 5, DRAW: 4, MEXICO_LEAD: 3 },
};

/** 하프타임 적중자 수 (HALF_TIME 상태일 때 표시) */
const MOCK_HALFTIME_HITS = {
  halfTimeResult: { correct: 3, label: '전반전 결과' },
  firstGoalTeam: { correct: 4, label: '첫 골 팀' },
  firstGoalTimeRange: { correct: 5, label: '첫 골 시간대' },
  koreaFirstScorer: { correct: 2, label: '한국 첫 득점자' },
};

// ─── 공통 UI ─────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** 가로 비율 바 (라벨 / 바 / 퍼센트 + 카운트) */
function RatioBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count}명 ({pct}%)</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** TOP N 리스트 (가로 바 없이 순위 형태) */
function TopList({
  items,
  total,
}: {
  items: { name: string; count: number }[];
  total: number;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.name} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div className="flex-1 space-y-0.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.count}명</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-korea-red/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 적중자 수 카드 (하프타임용) */
function HitCard({
  label,
  correct,
  total,
}: {
  label: string;
  correct: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold">{correct}/{total}명</span>
        <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>
      </div>
    </div>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default function StandingsPage() {
  const s = MOCK_STATS;
  const isHalfTime = MOCK_STATUS === 'HALF_TIME';

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">예측 현황</h1>
          <p className="text-xs text-muted-foreground">경기 시작 전 집계 기준</p>
        </div>
      </div>

      <GameStatusBanner status={MOCK_STATUS} />

      {/* 참여자 수 */}
      <Card className="border-korea-red/30 bg-red-50/30">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-korea-red/10">
            <Users className="h-6 w-6 text-korea-red" />
          </div>
          <div>
            <p className="text-2xl font-bold">{s.total}명</p>
            <p className="text-xs text-muted-foreground">참여 완료</p>
          </div>
          <Badge variant="korea" className="ml-auto">예측 마감 전</Badge>
        </CardContent>
      </Card>

      {/* 하프타임 적중자 현황 (HALF_TIME 상태에서만 노출) */}
      {isHalfTime && (
        <SectionCard title="✅ 전반 적중 현황">
          <div className="space-y-2">
            {Object.values(MOCK_HALFTIME_HITS).map((h) => (
              <HitCard key={h.label} label={h.label} correct={h.correct} total={s.total} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 경기 결과 예측 비율 */}
      <SectionCard title="⚽ 경기 결과 예측">
        <div className="space-y-3">
          <RatioBar label="🇰🇷 대한민국 승" count={s.matchResult.KOREA_WIN} total={s.total} color="bg-korea-red" />
          <RatioBar label="🤝 무승부" count={s.matchResult.DRAW} total={s.total} color="bg-slate-400" />
          <RatioBar label="🇲🇽 멕시코 승" count={s.matchResult.MEXICO_WIN} total={s.total} color="bg-green-600" />
        </div>
      </SectionCard>

      {/* 전반전 결과 예측 */}
      <SectionCard title="⏱ 전반전 결과 예측">
        <div className="space-y-3">
          <RatioBar label="🇰🇷 대한민국 리드" count={s.halfTimeResult.KOREA_LEAD} total={s.total} color="bg-korea-red" />
          <RatioBar label="🤝 무승부" count={s.halfTimeResult.DRAW} total={s.total} color="bg-slate-400" />
          <RatioBar label="🇲🇽 멕시코 리드" count={s.halfTimeResult.MEXICO_LEAD} total={s.total} color="bg-green-600" />
        </div>
      </SectionCard>

      {/* 스코어 예측 TOP */}
      <SectionCard title="🔢 스코어 예측 TOP">
        <div className="space-y-2">
          {s.topScores.map((item, i) => {
            const pct = Math.round((item.count / s.total) * 100);
            return (
              <div key={item.score} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold tabular-nums">{item.score}</span>
                    <span className="text-muted-foreground">{item.count}명</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-korea-blue/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* 첫 골 팀 */}
      <SectionCard title="🥅 첫 골 팀 예측">
        <div className="space-y-3">
          <RatioBar label="🇰🇷 대한민국" count={s.firstGoalTeam.KOREA} total={s.total} color="bg-korea-red" />
          <RatioBar label="🇲🇽 멕시코" count={s.firstGoalTeam.MEXICO} total={s.total} color="bg-green-600" />
          <RatioBar label="없음 (무득점)" count={s.firstGoalTeam.NONE} total={s.total} color="bg-slate-400" />
        </div>
      </SectionCard>

      {/* 카드 수 예측 */}
      <SectionCard title="🟨 카드 수 예측">
        <div className="space-y-3">
          <RatioBar label="0~2장" count={s.cardRange['0_2']} total={s.total} color="bg-emerald-500" />
          <RatioBar label="3~5장" count={s.cardRange['3_5']} total={s.total} color="bg-yellow-500" />
          <RatioBar label="6장 이상" count={s.cardRange['6_PLUS']} total={s.total} color="bg-red-500" />
        </div>
      </SectionCard>

      {/* 대한민국 첫 득점자 TOP */}
      <SectionCard title="🇰🇷 대한민국 첫 득점자 TOP">
        <TopList items={s.koreaFirstScorer} total={s.total} />
      </SectionCard>

      {/* 멕시코 첫 득점자 TOP */}
      <SectionCard title="🇲🇽 멕시코 첫 득점자 TOP">
        <TopList items={s.mexicoFirstScorer} total={s.total} />
      </SectionCard>

      {/* 안내 문구 */}
      <p className="pb-4 text-center text-xs text-muted-foreground">
        개인별 상세 예측은 경기 시작 후 공개됩니다
      </p>
    </div>
  );
}
