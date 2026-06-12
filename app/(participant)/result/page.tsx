'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RankingTable } from '@/components/game/RankingTable';
import { ChevronLeft, Loader2, Lock, Trophy } from 'lucide-react';
import type { ParticipantScore } from '@/types/result';
import { subscribeActualResult, type ActualResultDoc } from '@/lib/firebase/results';
import { subscribePredictions, type PredictionDoc } from '@/lib/firebase/predictions';
import { computeScoreBreakdown } from '@/lib/scoring/calculator';
import { sortByRanking, assignRanks } from '@/lib/scoring/tiebreaker';
import { subscribeGameStatus } from '@/lib/firebase/gameStatus';
import { useMatch } from '@/contexts/MatchContext';
import type { GameStatus } from '@/types/game';

function computeMvpWinner(predictions: PredictionDoc[]): string | null {
  const counts = new Map<string, number>();
  for (const p of predictions) {
    const mvp = p.finalMvp ?? p.mvp;
    if (mvp) counts.set(mvp, (counts.get(mvp) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function computeResults(
  predictions: PredictionDoc[],
  actual: ActualResultDoc,
): ParticipantScore[] {
  const mvpWinner = computeMvpWinner(predictions);
  const effectiveActual = { ...actual, officialMvp: mvpWinner ?? '' };
  const scores: ParticipantScore[] = predictions.map((pred) => {
    const breakdown = computeScoreBreakdown(pred, effectiveActual);
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return {
      participantId: pred.participantId,
      name: pred.name,
      scores: breakdown,
      totalScore: total,
      halfTimeScore: 0,
      rank: 0,
      usedHalftimeRevision: pred.halftimeRevised ?? false,
      submittedAt: pred.createdAt,
    };
  });
  return assignRanks(sortByRanking(scores));
}

function MvpVoteResult({ predictions }: { predictions: PredictionDoc[] }) {
  const counts = new Map<string, number>();
  for (const p of predictions) {
    const mvp = p.finalMvp ?? p.mvp;
    if (mvp) counts.set(mvp, (counts.get(mvp) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const winner = sorted[0]?.[0];
  const total = predictions.length;

  return (
    <Card className="border-yellow-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">🏅 MVP 투표 결과</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map(([name, count], i) => (
          <div key={name} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${i === 0 ? 'bg-yellow-50 border border-yellow-300' : 'bg-muted/30'}`}>
            <span className="text-sm">{i === 0 ? '🥇' : `${i + 1}위`}</span>
            <span className={`flex-1 text-sm font-medium ${name === winner ? 'text-yellow-700' : ''}`}>{name}</span>
            <span className="text-sm text-muted-foreground">{count}표 ({Math.round(count / total * 100)}%)</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyResultNotice({
  title,
  description,
  icon = 'lock',
}: {
  title: string;
  description: string;
  icon?: 'lock' | 'trophy';
}) {
  const Icon = icon === 'trophy' ? Trophy : Lock;
  return (
    <Card className="border-slate-200">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function ResultPage() {
  const { matchId, match } = useMatch();
  const [actualResult, setActualResult] = useState<ActualResultDoc | null>(null);
  const [predictions, setPredictions] = useState<PredictionDoc[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('BEFORE_MATCH');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let count = 0;
    const done = () => { if (++count >= 2) setLoading(false); };
    const unsubResult = subscribeActualResult(matchId, (r) => { setActualResult(r); done(); });
    const unsubPreds = subscribePredictions(matchId, (list) => { setPredictions(list); done(); });
    const unsubStatus = subscribeGameStatus(matchId, setGameStatus);
    return () => { unsubResult(); unsubPreds(); unsubStatus(); };
  }, [matchId]);

  const rankedScores = actualResult ? computeResults(predictions, actualResult) : [];
  const top3 = rankedScores.filter((s) => s.rank <= 3);
  const isResultOpen = gameStatus === 'RESULT_OPEN';

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
          <h1 className="font-bold text-lg">최종 순위</h1>
          <p className="text-xs text-muted-foreground">{match.label} 대한민국 vs {match.awayTeamName} 경기 종료 후 최종 결과</p>
        </div>
      </div>

      {/* 결과 비공개 안내 */}
      {!isResultOpen && (
        <EmptyResultNotice
          title="결과가 아직 공개되지 않았어요"
          description="운영자가 결과를 공개하면 순위를 확인할 수 있어요."
        />
      )}

      {isResultOpen && !actualResult && (
        <EmptyResultNotice
          icon="trophy"
          title="최종 경기 결과가 아직 입력되지 않았어요"
          description="운영자 화면에서 최종 결과를 먼저 저장하면 순위가 자동 계산됩니다."
        />
      )}

      {/* 실제 경기 결과 */}
      {actualResult && (
        <Card className="border-2 border-korea-red/20 bg-red-50/30">
          <CardContent className="p-4">
            <p className="text-center text-xs font-medium text-muted-foreground mb-3">실제 경기 결과</p>
            <div className="flex items-center justify-center gap-6">
              <span className="text-2xl">🇰🇷</span>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold">{actualResult.koreaScore}</span>
                <span className="text-2xl text-muted-foreground">:</span>
                <span className="text-4xl font-bold">{actualResult.mexicoScore}</span>
              </div>
              <span className="text-2xl">{match.awayTeamFlag}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isResultOpen && actualResult && predictions.length === 0 && (
        <EmptyResultNotice
          icon="trophy"
          title="참여자 예측 데이터가 없어요"
          description="예측 제출 데이터가 들어오면 전체 순위가 표시됩니다."
        />
      )}

      {/* 시상 및 순위 (결과 공개 후) */}
      {isResultOpen && rankedScores.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {top3.map((s) => (
              <Card key={s.participantId} className={s.rank === 1 ? 'border-yellow-400 bg-yellow-50' : ''}>
                <CardContent className="flex flex-col items-center p-3 gap-1">
                  <span className="text-2xl">{s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : '🥉'}</span>
                  <span className="font-bold text-sm">{s.name}</span>
                  <span className="text-lg font-bold text-korea-red">{s.totalScore}점</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <MvpVoteResult predictions={predictions} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">전체 순위</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RankingTable scores={rankedScores} showDetail />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
