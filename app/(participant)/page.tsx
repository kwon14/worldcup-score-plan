import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MatchInfo } from '@/components/game/MatchInfo';
import { GameStatusBanner } from '@/components/game/GameStatusBanner';
import { Users, Trophy, Clock } from 'lucide-react';

// TODO: Firebase에서 실시간으로 가져올 예정
const MOCK_STATUS = 'BEFORE_MATCH' as const;
const MOCK_PARTICIPANT_COUNT = 12;
const MOCK_DEADLINE = '경기 시작 전까지';

export default function HomePage() {
  return (
    <div className="space-y-4">
      {/* 게임 상태 */}
      <GameStatusBanner status={MOCK_STATUS} />

      {/* 경기 정보 */}
      <MatchInfo />

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{MOCK_PARTICIPANT_COUNT}</span>
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
            <span className="text-xs font-semibold text-center leading-tight mt-1">경기 전</span>
            <span className="text-xs text-muted-foreground">마감</span>
          </CardContent>
        </Card>
      </div>

      {/* 안내 문구 */}
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p>⚽ 경기 결과, 스코어, 첫 득점자 등을 예측해보세요.</p>
          <p>⏱ 전반 종료 후 일부 항목을 수정할 수 있어요.</p>
          <p>🏆 총 100점 기준으로 1~3등을 선정합니다.</p>
        </CardContent>
      </Card>

      {/* CTA 버튼 */}
      <Button variant="korea" size="xl" className="w-full" asChild>
        <Link href="/predict">예측 제출하기</Link>
      </Button>

      {/* 보조 링크 */}
      <div className="grid grid-cols-3 gap-3">
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

      {/* 마감 안내 */}
      <p className="text-center text-xs text-muted-foreground">
        1차 예측 마감: {MOCK_DEADLINE}
      </p>
    </div>
  );
}
