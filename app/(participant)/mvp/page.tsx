'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Trophy, CheckCircle2 } from 'lucide-react';
import { KOREA_PLAYER_DATA, MEXICO_PLAYER_DATA } from '@/constants/players';

// TODO: Firebase에서 본인 예측값 가져올 예정
const MOCK_INITIAL_MVP = '이강인';

export default function MvpPage() {
  const router = useRouter();
  const [mvp, setMvp] = useState(MOCK_INITIAL_MVP);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const allPlayers = [
    ...KOREA_PLAYER_DATA.filter((p) => p.name !== '없음'),
    ...MEXICO_PLAYER_DATA.filter((p) => p.name !== '없음'),
  ];

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    // TODO: Firebase 저장
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <p className="text-xl font-bold">MVP 제출 완료!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong>{mvp}</strong>를 MVP로 최종 제출했어요
          </p>
        </div>
        <Button variant="korea" asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">MVP 최종 제출</h1>
          <p className="text-xs text-muted-foreground">경기 종료 후 1회만 수정 가능해요</p>
        </div>
      </div>

      {/* 안내 */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="flex items-start gap-3 p-4">
          <Trophy className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 space-y-0.5">
            <p className="font-semibold">경기 후 최종 MVP를 선택해주세요</p>
            <p>미제출 시 경기 전 1차 예측값({MOCK_INITIAL_MVP})이 그대로 사용됩니다.</p>
          </div>
        </CardContent>
      </Card>

      {/* 현재 1차 예측 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">내 1차 예측 (경기 전)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-lg">{MOCK_INITIAL_MVP}</p>
        </CardContent>
      </Card>

      {/* MVP 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🏅 최종 MVP 선택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {allPlayers.map((p) => {
              const isKorea = KOREA_PLAYER_DATA.some((k) => k.name === p.name);
              const isSelected = mvp === p.name;
              return (
                <label
                  key={p.name}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                    isSelected ? 'border-korea-red bg-red-50' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="mvp"
                    value={p.name}
                    checked={isSelected}
                    onChange={() => setMvp(p.name)}
                    className="accent-korea-red shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{isKorea ? '🇰🇷' : '🇲🇽'} {p.position}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* 선정 이유 */}
          <div className="pt-1">
            <label className="block text-sm font-medium mb-1">선정 이유 (선택)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 후반 흐름을 바꾼 결정적 도움"
              maxLength={50}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" variant="korea" size="xl" className="w-full">
        MVP 최종 제출하기
      </Button>
      <p className="text-center text-xs text-muted-foreground pb-4">
        제출 후에는 수정할 수 없어요
      </p>
    </form>
  );
}
