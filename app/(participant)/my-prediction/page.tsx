'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, ClipboardList } from 'lucide-react';
import { getPrediction, type PredictionDoc } from '@/lib/firebase/predictions';
import { useMatch } from '@/contexts/MatchContext';
import { FIRST_GOAL_TIME_OPTIONS, CARD_RANGE_OPTIONS } from '@/constants/options';

function labelFrom(map: Record<string, string>, value: string) {
  return map[value] ?? value;
}

function labelArr<T extends string>(options: { value: T; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

function Row({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{title}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function MyPredictionPage() {
  const { matchId, match } = useMatch();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<PredictionDoc | null>(null);

  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem(`wc_participant_id_${matchId}`) : null;
    if (id) {
      getPrediction(matchId, id).then((pred) => {
        setPrediction(pred);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">내 예측 확인</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">아직 예측을 제출하지 않았어요.</p>
            <Button variant="korea" asChild>
              <Link href="/predict">예측 제출하러 가기</Link>
            </Button>
          </CardContent>
        </Card>
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
          <h1 className="font-bold text-lg">내 예측 확인</h1>
          <p className="text-xs text-muted-foreground">{prediction.name} 님의 예측</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">⚽ 경기 결과</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Row title="최종 결과" value={labelFrom(match.matchResultLabels, prediction.matchResult)} />
          <Row title="스코어" value={`🇰🇷 ${prediction.koreaScore} : ${prediction.mexicoScore} ${match.awayTeamFlag}`} />
          <Row title="전반전 결과" value={labelFrom(match.halfTimeResultLabels, prediction.halfTimeResult)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">🥅 득점 예측</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Row title="첫 골 팀" value={labelFrom(match.firstGoalTeamLabels, prediction.firstGoalTeam)} />
          <Row title="첫 골 시간대" value={labelArr(FIRST_GOAL_TIME_OPTIONS, prediction.firstGoalTimeRange)} />
          <Row title="한국 첫 득점자" value={prediction.koreaFirstScorer} />
          <Row title={`${match.awayTeamName} 첫 득점자`} value={prediction.mexicoFirstScorer} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">🟨 기타</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Row title="카드 수" value={labelArr(CARD_RANGE_OPTIONS, prediction.cardRange)} />
          <Row title="MVP (1차)" value={prediction.mvp} />
          {prediction.finalMvp && <Row title="MVP (최종)" value={prediction.finalMvp} />}
          {prediction.comment && <Row title="한마디" value={prediction.comment} />}
        </CardContent>
      </Card>

      {prediction.halftimeRevised && (
        <p className="text-center text-xs text-emerald-600">✅ 하프타임 수정 완료</p>
      )}

      <p className="pb-4 text-center text-xs text-muted-foreground">
        예측은 경기 시작 전까지 수정할 수 있어요
      </p>
    </div>
  );
}
