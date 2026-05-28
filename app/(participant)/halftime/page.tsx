'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Lock, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { MATCH_RESULT_OPTIONS, CARD_RANGE_OPTIONS } from '@/constants/options';
import { KOREA_PLAYER_DATA, MEXICO_PLAYER_DATA, type PlayerData } from '@/constants/players';
import { SCORE_WEIGHTS } from '@/constants/gameConfig';

// ─── 모의 데이터 (Firebase 연동 전) ──────────────────────────────────────────

/** 운영자가 입력한 실제 전반 결과 */
const MOCK_HALF_RESULT = {
  koreaHalfScore: 0,
  mexicoHalfScore: 1,
  halfTimeResult: 'MEXICO_LEAD' as const,
  firstGoalOccurred: true,
  firstGoalTeam: 'MEXICO' as const,
  firstGoalTimeRange: '0_15' as const,   // 12분
  koreaFirstScorerConfirmed: false,       // 한국 전반 무득점
  mexicoFirstScorerConfirmed: true,       // 멕시코 득점 확정
  mexicoFirstScorer: 'R. 히메네스',
};

/** 이 참여자의 1차 예측값 */
const MOCK_MY_PREDICTION = {
  matchResult: 'KOREA_WIN',
  koreaScore: '2',
  mexicoScore: '1',
  koreaFirstScorer: '손흥민',
  mexicoFirstScorer: 'R. 히메네스',
  firstGoalTeam: 'KOREA',
  firstGoalTimeRange: '16_30',
  halfTimeResult: 'DRAW',
  cardRange: '3_5',
};

/** 전반 기준 중간 점수 */
const MOCK_INTERMEDIATE = {
  myScore: 5,
  ranking: [
    { name: '이영희', score: 10 },
    { name: '박민준', score: 10 },
    { name: '홍길동', score: 5 },
  ],
};

// ─── 공통 컴포넌트 ────────────────────────────────────────────────────────────

const POSITION_COLOR: Record<string, string> = {
  FW: 'bg-red-100 text-red-700',
  MF: 'bg-green-100 text-green-700',
  DF: 'bg-blue-100 text-blue-700',
  GK: 'bg-yellow-100 text-yellow-700',
  '-': 'bg-slate-100 text-slate-500',
};

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LockedOverlay({ reason }: { reason: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
      <Lock className="h-4 w-4 shrink-0" />
      <span>{reason}</span>
    </div>
  );
}

function SectionLabel({ title, points, locked }: { title: string; points: number; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-semibold">{title}</h3>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary">{points}점</Badge>
        {locked
          ? <Badge variant="locked" className="flex items-center gap-1"><Lock className="h-3 w-3" />확정</Badge>
          : <Badge variant="active" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />수정 가능</Badge>
        }
      </div>
    </div>
  );
}

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

function PlayerSelector({
  name, players, value, onChange, accentColor = 'korea-red',
}: {
  name: string;
  players: PlayerData[];
  value: string;
  onChange: (v: string) => void;
  accentColor?: string;
}) {
  const isKorea = accentColor === 'korea-red';
  const selectedStyle = isKorea ? 'border-korea-red bg-red-50' : 'border-green-600 bg-green-50';

  return (
    <div className="grid gap-2">
      {players.map((p) => {
        const isNone = p.name === '없음';
        const isSelected = value === p.name;
        return (
          <label
            key={p.name}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              isSelected ? selectedStyle : 'border-border hover:bg-muted/50'
            }`}
          >
            <input
              type="radio" name={name} value={p.name}
              checked={isSelected}
              onChange={() => onChange(p.name)}
              className={`accent-${accentColor} shrink-0`}
            />
            {isNone ? (
              <span className="text-sm text-muted-foreground">없음 (무득점)</span>
            ) : (
              <div className="flex flex-1 items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${POSITION_COLOR[p.position] ?? ''}`}>
                    {p.position}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span>{p.nationalGoals}골</span>
                  <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                    <TrendingUp className="h-3 w-3" />{p.scoringProb}%
                  </span>
                </div>
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

const HALF_TIME_RESULT_LABEL: Record<string, string> = {
  KOREA_LEAD: '대한민국 리드',
  DRAW: '무승부',
  MEXICO_LEAD: '멕시코 리드',
};

const FIRST_GOAL_TIME_LABEL: Record<string, string> = {
  '0_15': '0~15분', '16_30': '16~30분', '31_45': '31~45분+',
  '46_60': '46~60분', '61_75': '61~75분', '76_90': '76~90분+', 'NONE': '없음',
};

export default function HalfTimePage() {
  const router = useRouter();
  const half = MOCK_HALF_RESULT;

  // 잠금 조건
  const firstGoalLocked = half.firstGoalOccurred;           // 첫 골 발생 → 첫 골 팀/시간대 잠금
  const koreaFirstScorerLocked = half.koreaFirstScorerConfirmed;  // 한국 전반 득점 → 잠금
  const mexicoFirstScorerLocked = half.mexicoFirstScorerConfirmed; // 멕시코 전반 득점 → 잠금

  // 수정 가능 필드 초기값 = 1차 예측값
  const [matchResult, setMatchResult] = useState(MOCK_MY_PREDICTION.matchResult);
  const [koreaScore, setKoreaScore] = useState(MOCK_MY_PREDICTION.koreaScore);
  const [mexicoScore, setMexicoScore] = useState(MOCK_MY_PREDICTION.mexicoScore);
  const [cardRange, setCardRange] = useState(MOCK_MY_PREDICTION.cardRange);
  const [koreaFirstScorer, setKoreaFirstScorer] = useState(MOCK_MY_PREDICTION.koreaFirstScorer);
  const [mexicoFirstScorer, setMexicoFirstScorer] = useState(MOCK_MY_PREDICTION.mexicoFirstScorer);

  const totalGoals =
    koreaScore !== '' && mexicoScore !== ''
      ? Number(koreaScore) + Number(mexicoScore)
      : null;

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    // TODO: Firebase 저장
    alert('하프타임 수정이 제출되었습니다!');
    router.push('/');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">하프타임 수정</h1>
          <p className="text-xs text-muted-foreground">수정 가능 항목을 1회만 변경할 수 있어요</p>
        </div>
      </div>

      {/* 전반 실제 결과 */}
      <Card className="border-slate-300 bg-slate-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">전반전 실제 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 스코어 */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-2xl">🇰🇷</span>
              <p className="text-xs text-muted-foreground mt-1">대한민국</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{half.koreaHalfScore}</span>
              <span className="text-2xl text-muted-foreground">:</span>
              <span className="text-4xl font-bold">{half.mexicoHalfScore}</span>
            </div>
            <div className="text-center">
              <span className="text-2xl">🇲🇽</span>
              <p className="text-xs text-muted-foreground mt-1">멕시코</p>
            </div>
          </div>

          {/* 전반 세부 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-white border p-3">
              <p className="text-xs text-muted-foreground mb-1">전반 결과</p>
              <p className="font-semibold">{HALF_TIME_RESULT_LABEL[half.halfTimeResult]}</p>
            </div>
            <div className="rounded-lg bg-white border p-3">
              <p className="text-xs text-muted-foreground mb-1">첫 골 팀</p>
              <p className="font-semibold">
                {half.firstGoalOccurred
                  ? half.firstGoalTeam === 'KOREA' ? '🇰🇷 대한민국' : '🇲🇽 멕시코'
                  : '없음'}
              </p>
            </div>
            <div className="rounded-lg bg-white border p-3">
              <p className="text-xs text-muted-foreground mb-1">첫 골 시간대</p>
              <p className="font-semibold">
                {half.firstGoalOccurred ? FIRST_GOAL_TIME_LABEL[half.firstGoalTimeRange ?? 'NONE'] : '없음'}
              </p>
            </div>
            <div className="rounded-lg bg-white border p-3">
              <p className="text-xs text-muted-foreground mb-1">멕시코 첫 득점자</p>
              <p className="font-semibold">{half.mexicoFirstScorer ?? '없음'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내 중간 점수 + 순위 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-korea-red/30 bg-red-50/40">
          <CardContent className="flex flex-col items-center p-4 gap-1">
            <p className="text-xs text-muted-foreground">내 중간 점수</p>
            <span className="text-3xl font-bold text-korea-red">{MOCK_INTERMEDIATE.myScore}</span>
            <p className="text-xs text-muted-foreground">/ 20점 확정</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">중간 순위</p>
            {MOCK_INTERMEDIATE.ranking.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between text-sm">
                <span>{RANK_MEDAL[i + 1]} {r.name}</span>
                <span className="font-bold">{r.score}점</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 안내 배너 */}
      <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          전반전 기준 중간 점수입니다. 경기 결과·스코어·카드·MVP는 아직 확정되지 않아
          최종 순위는 달라질 수 있어요. 수정은 <strong>1회</strong>만 가능합니다.
        </p>
      </div>

      {/* ── 경기 결과 (수정 가능) ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="경기 결과" points={SCORE_WEIGHTS.matchResult} locked={false} />
        </CardHeader>
        <CardContent>
          <RadioGroup
            name="matchResult"
            options={MATCH_RESULT_OPTIONS}
            value={matchResult as never}
            onChange={setMatchResult}
          />
        </CardContent>
      </Card>

      {/* ── 최종 스코어 (수정 가능) ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="최종 스코어" points={SCORE_WEIGHTS.exactScore} locked={false} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <label className="block text-xs text-muted-foreground mb-1">🇰🇷 대한민국</label>
              <input
                type="number" min="0" max="20" value={koreaScore}
                onChange={(e) => setKoreaScore(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />
            </div>
            <span className="text-2xl font-bold text-muted-foreground">:</span>
            <div className="flex-1 text-center">
              <label className="block text-xs text-muted-foreground mb-1">🇲🇽 멕시코</label>
              <input
                type="number" min="0" max="20" value={mexicoScore}
                onChange={(e) => setMexicoScore(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />
            </div>
          </div>
          {totalGoals !== null && (
            <p className="text-center text-sm text-muted-foreground">
              총 득점 예측: <strong>{totalGoals}골</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── 대한민국 첫 득점자 ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel
            title="🇰🇷 대한민국 첫 득점자"
            points={SCORE_WEIGHTS.koreaFirstScorer}
            locked={koreaFirstScorerLocked}
          />
          {!koreaFirstScorerLocked && (
            <p className="text-xs text-muted-foreground">전반 한국 무득점 — 후반 첫 득점자를 수정할 수 있어요</p>
          )}
        </CardHeader>
        <CardContent>
          {koreaFirstScorerLocked
            ? <LockedOverlay reason={`전반 첫 득점자 확정: ${MOCK_MY_PREDICTION.koreaFirstScorer}`} />
            : <PlayerSelector
                name="koreaFirstScorer"
                players={KOREA_PLAYER_DATA}
                value={koreaFirstScorer}
                onChange={setKoreaFirstScorer}
                accentColor="korea-red"
              />
          }
        </CardContent>
      </Card>

      {/* ── 멕시코 첫 득점자 ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel
            title="🇲🇽 멕시코 첫 득점자"
            points={SCORE_WEIGHTS.koreaFirstScorer}
            locked={mexicoFirstScorerLocked}
          />
          {mexicoFirstScorerLocked && (
            <p className="text-xs text-muted-foreground">전반에 이미 득점자가 확정되었어요</p>
          )}
        </CardHeader>
        <CardContent>
          {mexicoFirstScorerLocked
            ? <LockedOverlay reason={`전반 첫 득점자 확정: ${half.mexicoFirstScorer}`} />
            : <PlayerSelector
                name="mexicoFirstScorer"
                players={MEXICO_PLAYER_DATA}
                value={mexicoFirstScorer}
                onChange={setMexicoFirstScorer}
                accentColor="green-600"
              />
          }
        </CardContent>
      </Card>

      {/* ── 첫 골 팀 / 시간대 (조건부) ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="첫 골 팀" points={SCORE_WEIGHTS.firstGoalTeam} locked={firstGoalLocked} />
          {firstGoalLocked && (
            <p className="text-xs text-muted-foreground">전반에 첫 골이 발생해 확정되었어요</p>
          )}
        </CardHeader>
        <CardContent>
          <LockedOverlay
            reason={`전반 첫 골 팀 확정: ${half.firstGoalTeam === 'KOREA' ? '🇰🇷 대한민국' : '🇲🇽 멕시코'}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="첫 골 시간대" points={SCORE_WEIGHTS.firstGoalTimeRange} locked={firstGoalLocked} />
        </CardHeader>
        <CardContent>
          <LockedOverlay
            reason={`전반 첫 골 시간대 확정: ${FIRST_GOAL_TIME_LABEL[half.firstGoalTimeRange ?? 'NONE']}`}
          />
        </CardContent>
      </Card>

      {/* ── 전반전 결과 (항상 잠금) ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="전반전 결과" points={SCORE_WEIGHTS.halfTimeResult} locked={true} />
        </CardHeader>
        <CardContent>
          <LockedOverlay reason={`전반 종료 기준 확정: ${HALF_TIME_RESULT_LABEL[half.halfTimeResult]}`} />
        </CardContent>
      </Card>

      {/* ── 카드 수 (수정 가능) ── */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="양 팀 합산 카드 수" points={SCORE_WEIGHTS.cardRange} locked={false} />
        </CardHeader>
        <CardContent>
          <RadioGroup
            name="cardRange"
            options={CARD_RANGE_OPTIONS}
            value={cardRange as never}
            onChange={setCardRange}
          />
        </CardContent>
      </Card>

      {/* 제출 버튼 */}
      <Button type="submit" variant="korea" size="xl" className="w-full">
        하프타임 수정 제출하기
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-4">
        제출 후에는 MVP를 제외한 모든 항목을 수정할 수 없어요
      </p>
    </form>
  );
}
