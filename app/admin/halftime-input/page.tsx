'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Info } from 'lucide-react';
import { FIRST_GOAL_TIME_OPTIONS, FIRST_GOAL_TEAM_OPTIONS } from '@/constants/options';
import { KOREA_PLAYER_DATA, MEXICO_PLAYER_DATA } from '@/constants/players';

type FirstGoalTeam = 'KOREA' | 'MEXICO' | 'NONE';

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

function ScoreInput({
  flag, label, value, onChange,
}: {
  flag: string; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 text-center">
      <label className="block text-xs text-muted-foreground mb-1">{flag} {label}</label>
      <input
        type="number" min="0" max="20" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-3 text-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-korea-red/30"
      />
    </div>
  );
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function HalftimeInputPage() {
  const router = useRouter();

  const [koreaHalf, setKoreaHalf] = useState('');
  const [mexicoHalf, setMexicoHalf] = useState('');
  const [firstGoalTeam, setFirstGoalTeam] = useState<FirstGoalTeam | ''>('');
  const [firstGoalTime, setFirstGoalTime] = useState('');
  const [koreaFirstScorer, setKoreaFirstScorer] = useState('');
  const [mexicoFirstScorer, setMexicoFirstScorer] = useState('');
  const [halfCards, setHalfCards] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const koreaNum = Number(koreaHalf);
  const mexicoNum = Number(mexicoHalf);

  const halfTimeResult =
    koreaHalf === '' || mexicoHalf === ''
      ? null
      : koreaNum > mexicoNum ? '대한민국 리드'
      : koreaNum < mexicoNum ? '멕시코 리드'
      : '무승부';

  const firstGoalOccurred = firstGoalTeam !== '' && firstGoalTeam !== 'NONE';
  const koreaScored = koreaNum > 0;
  const mexicoScored = mexicoNum > 0;

  const isValid =
    koreaHalf !== '' &&
    mexicoHalf !== '' &&
    firstGoalTeam !== '' &&
    (!firstGoalOccurred || firstGoalTime !== '') &&
    (!koreaScored || koreaFirstScorer !== '') &&
    (!mexicoScored || mexicoFirstScorer !== '') &&
    halfCards !== '';

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!isValid) return;
    if (!showConfirm) { setShowConfirm(true); return; }
    // TODO: Firebase 저장 + gameStatus → HALF_TIME 전환
    alert('전반 결과가 저장되었습니다. 하프타임 수정이 오픈됩니다.');
    router.push('/admin');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">전반 결과 입력</h1>
          <p className="text-xs text-muted-foreground">저장 즉시 하프타임 수정이 오픈돼요</p>
        </div>
      </div>

      {/* 전반 스코어 */}
      <SectionCard title="전반 스코어">
        <div className="flex items-center gap-4">
          <ScoreInput flag="🇰🇷" label="대한민국" value={koreaHalf} onChange={setKoreaHalf} />
          <span className="text-2xl font-bold text-muted-foreground pt-5">:</span>
          <ScoreInput flag="🇲🇽" label="멕시코" value={mexicoHalf} onChange={setMexicoHalf} />
        </div>
        {halfTimeResult && (
          <div className="mt-3 text-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              전반 결과: {halfTimeResult}
            </Badge>
          </div>
        )}
      </SectionCard>

      {/* 첫 골 팀 */}
      <SectionCard title="첫 골 팀">
        <RadioGroup
          name="firstGoalTeam"
          options={FIRST_GOAL_TEAM_OPTIONS}
          value={firstGoalTeam}
          onChange={setFirstGoalTeam}
        />
      </SectionCard>

      {/* 첫 골 시간대 (첫 골 발생 시만) */}
      {firstGoalOccurred && (
        <SectionCard title="첫 골 시간대">
          <RadioGroup
            name="firstGoalTime"
            options={FIRST_GOAL_TIME_OPTIONS.filter((o) => o.value !== 'NONE')}
            value={firstGoalTime as never}
            onChange={setFirstGoalTime}
          />
        </SectionCard>
      )}

      {/* 대한민국 전반 첫 득점자 (한국 득점 시만) */}
      {koreaScored && (
        <SectionCard title="🇰🇷 대한민국 전반 첫 득점자">
          <select
            value={koreaFirstScorer}
            onChange={(e) => setKoreaFirstScorer(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
          >
            <option value="">선택하세요</option>
            {KOREA_PLAYER_DATA.filter((p) => p.name !== '없음').map((p) => (
              <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
            ))}
          </select>
        </SectionCard>
      )}

      {/* 멕시코 전반 첫 득점자 (멕시코 득점 시만) */}
      {mexicoScored && (
        <SectionCard title="🇲🇽 멕시코 전반 첫 득점자">
          <select
            value={mexicoFirstScorer}
            onChange={(e) => setMexicoFirstScorer(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
          >
            <option value="">선택하세요</option>
            {MEXICO_PLAYER_DATA.filter((p) => p.name !== '없음').map((p) => (
              <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
            ))}
          </select>
        </SectionCard>
      )}

      {/* 전반 카드 수 */}
      <SectionCard title="전반 합산 카드 수" badge="참고용">
        <input
          type="number" min="0" max="20" value={halfCards}
          onChange={(e) => setHalfCards(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border px-3 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-korea-red/30"
        />
        <p className="mt-2 text-xs text-muted-foreground text-center">최종 카드 수는 경기 종료 후 입력해요</p>
      </SectionCard>

      {/* 확인 단계 */}
      {showConfirm && (
        <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-yellow-800">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">저장 전 확인해주세요</p>
              <p>🇰🇷 {koreaHalf} : {mexicoHalf} 🇲🇽 · 전반 결과: {halfTimeResult}</p>
              <p>첫 골: {firstGoalTeam === 'KOREA' ? '대한민국' : firstGoalTeam === 'MEXICO' ? '멕시코' : '없음'} {firstGoalTime && `(${firstGoalTime})`}</p>
              {koreaScored && <p>🇰🇷 첫 득점자: {koreaFirstScorer}</p>}
              {mexicoScored && <p>🇲🇽 첫 득점자: {mexicoFirstScorer}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
              수정하기
            </Button>
            <Button type="submit" variant="korea" className="flex-1">
              저장 및 오픈
            </Button>
          </div>
        </div>
      )}

      {!showConfirm && (
        <Button type="submit" variant="korea" size="xl" className="w-full" disabled={!isValid}>
          전반 결과 저장하기
        </Button>
      )}
    </form>
  );
}
