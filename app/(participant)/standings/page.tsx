'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { GameStatusBanner } from '@/components/game/GameStatusBanner';
import { subscribeGameStatus } from '@/lib/firebase/gameStatus';
import { subscribePredictions, type PredictionDoc } from '@/lib/firebase/predictions';
import { subscribeMatchState, type MatchStateDoc } from '@/lib/firebase/matchState';
import { GOAL_TIME_ORDER } from '@/constants/gameConfig';
import type { GameStatus } from '@/types/game';

// ─── 통계 계산 ────────────────────────────────────────────────────────────────

function buildTopList(counts: Record<string, number>, topN: number) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, topN).map(([name, count]) => ({ name, count }));
  const othersCount = entries.slice(topN).reduce((sum, [, c]) => sum + c, 0);
  if (othersCount > 0) top.push({ name: '기타', count: othersCount });
  return top;
}

function computeStats(predictions: PredictionDoc[]) {
  const total = predictions.length;
  const matchResult = { KOREA_WIN: 0, DRAW: 0, MEXICO_WIN: 0 };
  const firstGoalTeam = { KOREA: 0, MEXICO: 0, NONE: 0 };
  const halfTimeResult = { KOREA_LEAD: 0, DRAW: 0, MEXICO_LEAD: 0 };
  const cardRange: Record<string, number> = { '0_2': 0, '3_5': 0, '6_PLUS': 0 };
  const scoreCounts: Record<string, number> = {};
  const koreaScorerCounts: Record<string, number> = {};
  const mexicoScorerCounts: Record<string, number> = {};

  for (const pred of predictions) {
    if (pred.matchResult in matchResult) matchResult[pred.matchResult as keyof typeof matchResult]++;
    if (pred.firstGoalTeam in firstGoalTeam) firstGoalTeam[pred.firstGoalTeam as keyof typeof firstGoalTeam]++;
    if (pred.halfTimeResult in halfTimeResult) halfTimeResult[pred.halfTimeResult as keyof typeof halfTimeResult]++;
    if (pred.cardRange in cardRange) cardRange[pred.cardRange]++;
    const scoreKey = `${pred.koreaScore} : ${pred.mexicoScore}`;
    scoreCounts[scoreKey] = (scoreCounts[scoreKey] ?? 0) + 1;
    koreaScorerCounts[pred.koreaFirstScorer] = (koreaScorerCounts[pred.koreaFirstScorer] ?? 0) + 1;
    mexicoScorerCounts[pred.mexicoFirstScorer] = (mexicoScorerCounts[pred.mexicoFirstScorer] ?? 0) + 1;
  }

  return {
    total,
    matchResult,
    firstGoalTeam,
    halfTimeResult,
    cardRange,
    topScores: buildTopList(scoreCounts, 3),
    koreaFirstScorer: buildTopList(koreaScorerCounts, 4),
    mexicoFirstScorer: buildTopList(mexicoScorerCounts, 4),
  };
}

function computeHalftimeHits(predictions: PredictionDoc[], ms: MatchStateDoc) {
  return {
    halfTimeResult: {
      label: '전반전 결과',
      correct: predictions.filter((p) => ms.halfTimeResult && p.halfTimeResult === ms.halfTimeResult).length,
    },
    firstGoalTeam: {
      label: '첫 골 팀',
      correct: predictions.filter((p) => ms.firstGoalTeam && p.firstGoalTeam === ms.firstGoalTeam).length,
    },
    firstGoalTimeRange: {
      label: '첫 골 시간대',
      correct: predictions.filter((p) => {
        if (!ms.firstGoalTimeRange) return false;
        const predOrd = GOAL_TIME_ORDER[p.firstGoalTimeRange] ?? -1;
        const actOrd = GOAL_TIME_ORDER[ms.firstGoalTimeRange] ?? -1;
        return predOrd >= 0 && actOrd >= 0 && predOrd === actOrd;
      }).length,
    },
    koreaFirstScorer: {
      label: '한국 첫 득점자',
      correct: predictions.filter(
        (p) => ms.koreaFirstScorer && ms.koreaFirstScorer !== '없음' && p.koreaFirstScorer === ms.koreaFirstScorer,
      ).length,
    },
  };
}

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

function RatioBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count}명 ({pct}%)</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TopList({ items, total }: { items: { name: string; count: number }[]; total: number }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.name} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
            <div className="flex-1 space-y-0.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.count}명</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-korea-red/70" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HitCard({ label, correct, total }: { label: string; correct: number; total: number }) {
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
  const [gameStatus, setGameStatus] = useState<GameStatus>('BEFORE_MATCH');
  const [predictions, setPredictions] = useState<PredictionDoc[]>([]);
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let count = 0;
    const done = () => { if (++count >= 2) setLoading(false); };
    const unsubStatus = subscribeGameStatus((s) => { setGameStatus(s); done(); });
    const unsubPreds = subscribePredictions((list) => { setPredictions(list); done(); });
    const unsubState = subscribeMatchState(setMatchState);
    return () => { unsubStatus(); unsubPreds(); unsubState(); };
  }, []);

  const s = computeStats(predictions);
  const isHalfTime = gameStatus === 'HALF_TIME';
  const halftimeHits = isHalfTime && matchState ? computeHalftimeHits(predictions, matchState) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">예측 현황</h1>
          <p className="text-xs text-muted-foreground">경기 시작 전 집계 기준</p>
        </div>
      </div>

      <GameStatusBanner status={gameStatus} />

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

      {s.total === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            아직 예측을 제출한 참여자가 없어요.
          </CardContent>
        </Card>
      )}

      {/* 하프타임 적중 현황 */}
      {halftimeHits && (
        <SectionCard title="✅ 전반 적중 현황">
          <div className="space-y-2">
            {Object.values(halftimeHits).map((h) => (
              <HitCard key={h.label} label={h.label} correct={h.correct} total={s.total} />
            ))}
          </div>
        </SectionCard>
      )}

      {s.total > 0 && (
        <>
          {/* 경기 결과 예측 */}
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
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold tabular-nums">{item.name}</span>
                        <span className="text-muted-foreground">{item.count}명</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-korea-blue/60" style={{ width: `${pct}%` }} />
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
        </>
      )}

      <p className="pb-4 text-center text-xs text-muted-foreground">
        개인별 상세 예측은 경기 시작 후 공개됩니다
      </p>
    </div>
  );
}
