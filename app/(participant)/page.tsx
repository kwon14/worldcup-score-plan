'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GameStatusBanner } from '@/components/game/GameStatusBanner';
import { WorldCupInfo } from '@/components/game/WorldCupInfo';
import { LiveMatchPanel } from '@/components/game/LiveMatchPanel';
import { Users, Trophy, Clock } from 'lucide-react';
import { subscribeGameStatus } from '@/lib/firebase/gameStatus';
import { subscribePredictions } from '@/lib/firebase/predictions';
import { useMatch } from '@/contexts/MatchContext';
import type { GameStatus } from '@/types/game';

const DEADLINE_LABEL: Partial<Record<GameStatus, string>> = {
  BEFORE_MATCH: '경기 시작 전까지',
  FIRST_HALF:   '마감됨',
  HALF_TIME:    '하프타임 수정 가능',
  SECOND_HALF:  '마감됨',
  AFTER_MATCH:  'MVP 수정 가능',
  RESULT_OPEN:  '결과 공개됨',
};

export default function HomePage() {
  const { matchId } = useMatch();
  const [gameStatus, setGameStatus] = useState<GameStatus>('BEFORE_MATCH');
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const unsubStatus = subscribeGameStatus(matchId, setGameStatus);
    const unsubPreds = subscribePredictions(matchId, (list) => setParticipantCount(list.length));
    return () => { unsubStatus(); unsubPreds(); };
  }, [matchId]);

  const ctaButton = (() => {
    switch (gameStatus) {
      case 'BEFORE_MATCH':
        return <Button variant="korea" size="xl" className="w-full" asChild>
          <Link href="/predict">예측 제출하기</Link>
        </Button>;
      case 'HALF_TIME':
        return <Button variant="korea" size="xl" className="w-full" asChild>
          <Link href="/halftime">하프타임 수정하기</Link>
        </Button>;
      case 'AFTER_MATCH':
        return <Button variant="korea" size="xl" className="w-full" asChild>
          <Link href="/mvp">MVP 최종 제출</Link>
        </Button>;
      case 'RESULT_OPEN':
        return <Button variant="korea" size="xl" className="w-full" asChild>
          <Link href="/result">최종 순위 보기</Link>
        </Button>;
      default:
        return <Button variant="korea" size="xl" className="w-full" disabled>
          경기 진행 중
        </Button>;
    }
  })();

  return (
    <div className="space-y-4">
      <GameStatusBanner status={gameStatus} />
      <LiveMatchPanel matchId={matchId} />
      <WorldCupInfo />

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{participantCount}</span>
            <span className="text-xs text-muted-foreground">참여자</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">100</span>
            <span className="text-xs text-muted-foreground">만점</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-semibold text-center leading-tight mt-1">
              {gameStatus === 'BEFORE_MATCH' ? '경기 전' : gameStatus === 'HALF_TIME' ? '하프타임' : gameStatus === 'RESULT_OPEN' ? '종료' : '진행 중'}
            </span>
            <span className="text-xs text-muted-foreground">마감</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p>⚽ 경기 결과, 스코어, 첫 득점자 등을 예측해보세요.</p>
          <p>⏱ 전반 종료 후 일부 항목을 수정할 수 있어요.</p>
          <p>🏆 총 100점 기준으로 1~3등을 선정합니다.</p>
        </CardContent>
      </Card>

      {ctaButton}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" asChild>
          <Link href="/my-prediction">내 예측 확인</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/standings">예측 현황</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/mvp">MVP 제출</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/result">순위 보기</Link>
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        1차 예측 마감: {DEADLINE_LABEL[gameStatus]}
      </p>
    </div>
  );
}
