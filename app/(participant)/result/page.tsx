'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RankingTable } from '@/components/game/RankingTable';
import { ChevronLeft, Loader2, Lock } from 'lucide-react';
import type { ParticipantScore } from '@/types/result';
import { subscribeActualResult, type ActualResultDoc } from '@/lib/firebase/results';
import { subscribePredictions, type PredictionDoc } from '@/lib/firebase/predictions';
import { computeScoreBreakdown } from '@/lib/scoring/calculator';
import { sortByRanking, assignRanks } from '@/lib/scoring/tiebreaker';
import { subscribeGameStatus } from '@/lib/firebase/gameStatus';
import type { GameStatus } from '@/types/game';

function computeResults(
  predictions: PredictionDoc[],
  actual: ActualResultDoc,
): ParticipantScore[] {
  const scores: ParticipantScore[] = predictions.map((pred) => {
    const breakdown = computeScoreBreakdown(pred, actual);
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return {
      participantId: pred.participantId,
      name: pred.name,
      scores: breakdown,
      totalScore: total,
      halfTimeScore: 0,
      rank: 0,
      usedHalftimeRevision: pred.halftimeRevised ?? false,
    };
  });
  return assignRanks(sortByRanking(scores));
}

export default function ResultPage() {
  const [actualResult, setActualResult] = useState<ActualResultDoc | null>(null);
  const [predictions, setPredictions] = useState<PredictionDoc[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('BEFORE_MATCH');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let count = 0;
    const done = () => { if (++count >= 2) setLoading(false); };
    const unsubResult = subscribeActualResult((r) => { setActualResult(r); done(); });
    const unsubPreds = subscribePredictions((list) => { setPredictions(list); done(); });
    const unsubStatus = subscribeGameStatus(setGameStatus);
    return () => { unsubResult(); unsubPreds(); unsubStatus(); };
  }, []);

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
          <p className="text-xs text-muted-foreground">경기 종료 후 최종 결과</p>
        </div>
      </div>

      {/* 결과 비공개 안내 */}
      {!isResultOpen && (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">결과가 아직 공개되지 않았어요</p>
            <p className="text-sm text-muted-foreground">운영자가 결과를 공개하면 순위를 확인할 수 있어요.</p>
          </CardContent>
        </Card>
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
              <span className="text-2xl">🇲🇽</span>
            </div>
          </CardContent>
        </Card>
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
