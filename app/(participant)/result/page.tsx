import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RankingTable } from '@/components/game/RankingTable';
import { MatchInfo } from '@/components/game/MatchInfo';
import { ChevronLeft } from 'lucide-react';
import type { ParticipantScore } from '@/types/result';

// TODO: Firebase에서 가져올 예정
const MOCK_SCORES: ParticipantScore[] = [
  {
    participantId: 'P001', name: '홍길동', rank: 1, totalScore: 85, halfTimeScore: 5, usedHalftimeRevision: true,
    scores: { matchResult: 20, exactScore: 25, totalGoals: 10, koreaFirstScorer: 15, firstGoalTimeRange: 0, firstGoalTeam: 0, halfTimeResult: 5, cardRange: 5, mvp: 5 },
  },
  {
    participantId: 'P002', name: '김철수', rank: 2, totalScore: 75, halfTimeScore: 5, usedHalftimeRevision: false,
    scores: { matchResult: 20, exactScore: 10, totalGoals: 10, koreaFirstScorer: 15, firstGoalTimeRange: 10, firstGoalTeam: 0, halfTimeResult: 5, cardRange: 0, mvp: 5 },
  },
  {
    participantId: 'P003', name: '이영희', rank: 3, totalScore: 70, halfTimeScore: 5, usedHalftimeRevision: true,
    scores: { matchResult: 20, exactScore: 10, totalGoals: 5, koreaFirstScorer: 15, firstGoalTimeRange: 5, firstGoalTeam: 5, halfTimeResult: 5, cardRange: 5, mvp: 0 },
  },
];

const ACTUAL_SCORE = { korea: 1, mexico: 1 };

export default function ResultPage() {
  const top3 = MOCK_SCORES.filter((s) => s.rank <= 3);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">최종 순위</h1>
          <p className="text-xs text-muted-foreground">경기 종료 후 최종 결과</p>
        </div>
      </div>

      {/* 실제 경기 결과 */}
      <Card className="border-2 border-korea-red/20 bg-red-50/30">
        <CardContent className="p-4">
          <p className="text-center text-xs font-medium text-muted-foreground mb-3">실제 경기 결과</p>
          <div className="flex items-center justify-center gap-6">
            <span className="text-2xl">🇰🇷</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{ACTUAL_SCORE.korea}</span>
              <span className="text-2xl text-muted-foreground">:</span>
              <span className="text-4xl font-bold">{ACTUAL_SCORE.mexico}</span>
            </div>
            <span className="text-2xl">🇲🇽</span>
          </div>
        </CardContent>
      </Card>

      {/* 시상 */}
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

      {/* 전체 순위표 */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">전체 순위</CardTitle></CardHeader>
        <CardContent className="p-0">
          <RankingTable scores={MOCK_SCORES} showDetail />
        </CardContent>
      </Card>
    </div>
  );
}
