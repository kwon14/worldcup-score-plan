'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveActualResult } from '@/lib/firebase/results';
import { setGameStatus } from '@/lib/firebase/gameStatus';
import { getMatchState, type MatchStateDoc } from '@/lib/firebase/matchState';
import type { MatchResult, FirstGoalTeam, FirstGoalTimeRange, HalfTimeResult, CardRange } from '@/types/game';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Info, Trophy } from 'lucide-react';
import { FIRST_GOAL_TIME_OPTIONS, FIRST_GOAL_TEAM_OPTIONS, CARD_RANGE_OPTIONS } from '@/constants/options';
import { KOREA_PLAYER_DATA, MEXICO_PLAYER_DATA } from '@/constants/players';

function RadioGroup<T extends string>({
  name, options, value, onChange,
}: {
  name: string;
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
            value === opt.value ? 'border-korea-red bg-red-50' : 'border-border hover:bg-muted/50'
          }`}
        >
          <input
            type="radio" name={name} value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-korea-red"
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function FinalInputPage() {
  const router = useRouter();

  const [koreaFinal, setKoreaFinal] = useState('');
  const [mexicoFinal, setMexicoFinal] = useState('');
  const [firstGoalTeam, setFirstGoalTeam] = useState('');
  const [firstGoalTime, setFirstGoalTime] = useState('');
  const [koreaFirstScorer, setKoreaFirstScorer] = useState('');
  const [mexicoFirstScorer, setMexicoFirstScorer] = useState('');
  const [cardRange, setCardRange] = useState('');
  const [mvp, setMvp] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchStateData, setMatchStateData] = useState<MatchStateDoc | null>(null);

  useEffect(() => {
    getMatchState().then(setMatchStateData);
  }, []);

  const koreaNum = Number(koreaFinal);
  const mexicoNum = Number(mexicoFinal);
  const totalGoals = koreaFinal !== '' && mexicoFinal !== '' ? koreaNum + mexicoNum : null;

  const matchResultLabel =
    koreaFinal === '' || mexicoFinal === '' ? null
    : koreaNum > mexicoNum ? '대한민국 승'
    : koreaNum < mexicoNum ? '멕시코 승'
    : '무승부';

  const CARD_RANGE_LABEL: Record<string, string> = {
    '0_2': '0~2장', '3_5': '3~5장', '6_PLUS': '6장 이상',
  };

  const FIRST_GOAL_TIME_LABEL: Record<string, string> = {
    '0_15': '0~15분', '16_30': '16~30분', '31_45': '31~45분+',
    '46_60': '46~60분', '61_75': '61~75분', '76_90': '76~90분+', 'NONE': '없음',
  };

  const isValid =
    koreaFinal !== '' &&
    mexicoFinal !== '' &&
    firstGoalTeam !== '' &&
    firstGoalTime !== '' &&
    koreaFirstScorer !== '' &&
    mexicoFirstScorer !== '' &&
    cardRange !== '' &&
    mvp !== '';

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!isValid) return;
    if (!showConfirm) { setShowConfirm(true); return; }
    setSubmitting(true);
    try {
      const matchResultCode: MatchResult =
        koreaNum > mexicoNum ? 'KOREA_WIN' : koreaNum < mexicoNum ? 'MEXICO_WIN' : 'DRAW';
      const halfTimeResultCode: HalfTimeResult =
        (matchStateData?.halfTimeResult as HalfTimeResult | undefined) ?? 'DRAW';
      await saveActualResult({
        matchResult: matchResultCode,
        koreaScore: koreaNum,
        mexicoScore: mexicoNum,
        totalGoals: koreaNum + mexicoNum,
        koreaFirstScorer,
        firstGoalTeam: firstGoalTeam as FirstGoalTeam,
        firstGoalTimeRange: firstGoalTime as FirstGoalTimeRange,
        halfTimeResult: halfTimeResultCode,
        cardRange: cardRange as CardRange,
        officialMvp: mvp,
      });
      await setGameStatus('AFTER_MATCH');
      router.push('/admin');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">최종 결과 입력</h1>
          <p className="text-xs text-muted-foreground">저장 즉시 점수가 자동 계산돼요</p>
        </div>
      </div>

      {/* 최종 스코어 */}
      <SectionCard title="최종 스코어">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <label className="block text-xs text-muted-foreground mb-1">🇰🇷 대한민국</label>
            <input
              type="number" min="0" max="20" value={koreaFinal}
              onChange={(e) => setKoreaFinal(e.target.value)}
              className="w-full rounded-lg border px-3 py-3 text-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-korea-red/30"
            />
          </div>
          <span className="text-2xl font-bold text-muted-foreground pt-5">:</span>
          <div className="flex-1 text-center">
            <label className="block text-xs text-muted-foreground mb-1">🇲🇽 멕시코</label>
            <input
              type="number" min="0" max="20" value={mexicoFinal}
              onChange={(e) => setMexicoFinal(e.target.value)}
              className="w-full rounded-lg border px-3 py-3 text-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-korea-red/30"
            />
          </div>
        </div>
        {totalGoals !== null && (
          <div className="mt-3 flex justify-center gap-3">
            <Badge variant="secondary">총 {totalGoals}골</Badge>
            {matchResultLabel && <Badge variant="secondary">{matchResultLabel}</Badge>}
          </div>
        )}
      </SectionCard>

      {/* 첫 골 팀 */}
      <SectionCard title="첫 골 팀">
        <RadioGroup
          name="firstGoalTeam"
          options={FIRST_GOAL_TEAM_OPTIONS}
          value={firstGoalTeam as never}
          onChange={setFirstGoalTeam}
        />
      </SectionCard>

      {/* 첫 골 시간대 */}
      <SectionCard title="첫 골 시간대">
        <RadioGroup
          name="firstGoalTime"
          options={FIRST_GOAL_TIME_OPTIONS}
          value={firstGoalTime as never}
          onChange={setFirstGoalTime}
        />
      </SectionCard>

      {/* 대한민국 첫 득점자 */}
      <SectionCard title="🇰🇷 대한민국 첫 득점자">
        <select
          value={koreaFirstScorer}
          onChange={(e) => setKoreaFirstScorer(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
        >
          <option value="">선택하세요</option>
          {KOREA_PLAYER_DATA.map((p) => (
            <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
          ))}
        </select>
      </SectionCard>

      {/* 멕시코 첫 득점자 */}
      <SectionCard title="🇲🇽 멕시코 첫 득점자">
        <select
          value={mexicoFirstScorer}
          onChange={(e) => setMexicoFirstScorer(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
        >
          <option value="">선택하세요</option>
          {MEXICO_PLAYER_DATA.map((p) => (
            <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
          ))}
        </select>
      </SectionCard>

      {/* 카드 수 */}
      <SectionCard title="양 팀 최종 카드 수">
        <RadioGroup
          name="cardRange"
          options={CARD_RANGE_OPTIONS}
          value={cardRange as never}
          onChange={setCardRange}
        />
      </SectionCard>

      {/* 운영진 선정 MVP */}
      <SectionCard title="운영진 선정 MVP">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 mb-3">
          <Trophy className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-800">공식 MOM 발표가 없으면 현장 투표 또는 운영진 선정</p>
        </div>
        <select
          value={mvp}
          onChange={(e) => setMvp(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
        >
          <option value="">선택하세요</option>
          <optgroup label="🇰🇷 대한민국">
            {KOREA_PLAYER_DATA.filter((p) => p.name !== '없음').map((p) => (
              <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
            ))}
          </optgroup>
          <optgroup label="🇲🇽 멕시코">
            {MEXICO_PLAYER_DATA.filter((p) => p.name !== '없음').map((p) => (
              <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
            ))}
          </optgroup>
        </select>
      </SectionCard>

      {/* 확인 단계 */}
      {showConfirm && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-red-800">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">저장 전 최종 확인</p>
              <p>🏆 최종 스코어: 대한민국 {koreaFinal} : {mexicoFinal} 멕시코</p>
              <p>⚽ 첫 골: {firstGoalTeam === 'KOREA' ? '🇰🇷 대한민국' : firstGoalTeam === 'MEXICO' ? '🇲🇽 멕시코' : '없음'} {firstGoalTime && `· ${FIRST_GOAL_TIME_LABEL[firstGoalTime]}`}</p>
              <p>🇰🇷 한국 첫 득점자: {koreaFirstScorer} · 🇲🇽 멕시코: {mexicoFirstScorer}</p>
              <p>🟨 카드: {CARD_RANGE_LABEL[cardRange]} · 🏅 MVP: {mvp}</p>
              <p className="font-semibold text-red-700 mt-1">저장하면 전체 점수가 자동 계산됩니다.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
              수정하기
            </Button>
            <Button type="submit" variant="destructive" className="flex-1" disabled={submitting}>
              {submitting ? '저장 중...' : '저장 및 점수 계산'}
            </Button>
          </div>
        </div>
      )}

      {!showConfirm && (
        <Button type="submit" variant="korea" size="xl" className="w-full" disabled={!isValid}>
          최종 결과 저장하기
        </Button>
      )}
    </form>
  );
}
