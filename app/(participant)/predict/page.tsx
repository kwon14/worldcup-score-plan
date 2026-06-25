'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Lock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { savePrediction } from '@/lib/firebase/predictions';
import { getOrCreateParticipantUser, useParticipantAuth } from '@/lib/firebase/auth';
import { subscribeGameStatus } from '@/lib/firebase/gameStatus';
import { subscribeMatchState, type MatchStateDoc } from '@/lib/firebase/matchState';
import { FIRST_GOAL_TIME_OPTIONS, CARD_RANGE_OPTIONS } from '@/constants/options';
import { KOREA_PLAYER_DATA, type PlayerData } from '@/constants/players';
import { buildPredictionPlayerData } from '@/lib/lineups/playerOptions';
import { SCORE_WEIGHTS } from '@/constants/gameConfig';
import { useMatch } from '@/contexts/MatchContext';
import type { GameStatus } from '@/types/game';

const POSITION_COLOR: Record<string, string> = {
  FW: 'bg-red-100 text-red-700',
  MF: 'bg-green-100 text-green-700',
  DF: 'bg-blue-100 text-blue-700',
  GK: 'bg-yellow-100 text-yellow-700',
  '-': 'bg-slate-100 text-slate-500',
};

function SectionLabel({ title, points }: { title: string; points: number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">{title}</h3>
      <Badge variant="secondary">{points}점</Badge>
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
            type="radio"
            name={name}
            value={opt.value}
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
  name, players, value, onChange, accentColor = 'korea-red', noneLabel = '없음 (무득점)',
}: {
  name: string;
  players: PlayerData[];
  value: string;
  onChange: (v: string) => void;
  accentColor?: string;
  noneLabel?: string;
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
              type="radio"
              name={name}
              value={p.name}
              checked={isSelected}
              onChange={() => onChange(p.name)}
              className={`accent-${accentColor} shrink-0`}
            />
            {isNone ? (
              <span className="text-sm text-muted-foreground">{noneLabel}</span>
            ) : (
              <div className="flex flex-1 items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${POSITION_COLOR[p.position] ?? 'bg-slate-100 text-slate-500'}`}>
                    {p.position}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span className="hidden sm:inline truncate max-w-[80px]">{p.club}</span>
                  <span className="font-medium">{p.nationalGoals}골</span>
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

export default function PredictPage() {
  const router = useRouter();
  const { matchId, match } = useMatch();
  const { status: authStatus, claims } = useParticipantAuth();
  const [gameStatus, setGameStatus] = useState<GameStatus>('BEFORE_MATCH');
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);

  useEffect(() => {
    const unsubStatus = subscribeGameStatus(matchId, setGameStatus);
    const unsubState = subscribeMatchState(matchId, setMatchState);
    return () => { unsubStatus(); unsubState(); };
  }, [matchId]);

  const [matchResult, setMatchResult] = useState('');
  const [koreaScore, setKoreaScore] = useState('');
  const [mexicoScore, setMexicoScore] = useState('');
  const [koreaFirstScorer, setKoreaFirstScorer] = useState('');
  const [mexicoFirstScorer, setMexicoFirstScorer] = useState('');
  const [firstGoalTeam, setFirstGoalTeam] = useState('');
  const [firstGoalTimeRange, setFirstGoalTimeRange] = useState('');
  const [halfTimeResult, setHalfTimeResult] = useState('');
  const [cardRange, setCardRange] = useState('');
  const [mvp, setMvp] = useState('');
  const [comment, setComment] = useState('');

  const matchResultOptions = [
    { value: 'KOREA_WIN', label: match.matchResultLabels.KOREA_WIN },
    { value: 'DRAW',      label: match.matchResultLabels.DRAW },
    { value: 'MEXICO_WIN', label: match.matchResultLabels.MEXICO_WIN },
  ];
  const halfTimeResultOptions = [
    { value: 'KOREA_LEAD', label: match.halfTimeResultLabels.KOREA_LEAD },
    { value: 'DRAW',       label: match.halfTimeResultLabels.DRAW },
    { value: 'MEXICO_LEAD', label: match.halfTimeResultLabels.MEXICO_LEAD },
  ];
  const firstGoalTeamOptions = [
    { value: 'KOREA',  label: match.firstGoalTeamLabels.KOREA },
    { value: 'MEXICO', label: match.firstGoalTeamLabels.MEXICO },
    { value: 'NONE',   label: match.firstGoalTeamLabels.NONE },
  ];

  const totalGoals = koreaScore !== '' && mexicoScore !== '' ? Number(koreaScore) + Number(mexicoScore) : null;
  const matchKoreaPlayerData = match.koreaPlayerData ?? KOREA_PLAYER_DATA;
  const koreaScorerPlayers = buildPredictionPlayerData(matchState?.koreaLineupPlayers, matchKoreaPlayerData);
  const awayScorerPlayers = buildPredictionPlayerData(matchState?.awayLineupPlayers, match.awayPlayerData);

  const isValid = authStatus === 'signed-in' && !!claims?.name && matchResult && koreaScore !== '' && mexicoScore !== '' &&
    koreaFirstScorer && mexicoFirstScorer && firstGoalTeam && firstGoalTimeRange &&
    halfTimeResult && cardRange && mvp;

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!isValid || !claims?.name) return;
    const participant = await getOrCreateParticipantUser();
    const participantId = participant.uid;
    await savePrediction(matchId, participantId, {
      name: claims.name,
      team: 'BAP팀',
      matchResult,
      koreaScore: Number(koreaScore),
      mexicoScore: Number(mexicoScore),
      koreaFirstScorer,
      mexicoFirstScorer,
      firstGoalTeam,
      firstGoalTimeRange,
      halfTimeResult,
      cardRange,
      mvp,
      comment,
    });
    localStorage.setItem(`wc_participant_id_${matchId}`, participantId);
    router.push('/');
  }

  if (gameStatus !== 'BEFORE_MATCH') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">경기 전 예측</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <Lock className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">예측 제출이 마감됐어요</p>
              <p className="text-sm text-muted-foreground mt-1">경기가 시작된 후에는 예측을 제출할 수 없어요.</p>
            </div>
            <Button variant="korea" asChild>
              <Link href="/">홈으로</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">경기 전 예측</h1>
          <p className="text-xs text-muted-foreground">모든 항목을 입력해주세요</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">참여자 정보</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {authStatus === 'signed-in' ? (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">참여자: </span>
              <span className="font-semibold">{claims?.name}</span>
              {claims?.employeeId && <span className="ml-2 text-xs text-muted-foreground">({claims.employeeId})</span>}
            </div>
          ) : (
            <div className="rounded-lg border border-korea-red/20 bg-red-50 px-3 py-3 text-sm">
              <p className="mb-2 font-semibold text-korea-red">예측 제출 전 로그인이 필요합니다.</p>
              <Button type="button" variant="korea" size="sm" asChild>
                <Link href="/login">로그인 / 최초 가입</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><SectionLabel title="경기 결과" points={SCORE_WEIGHTS.matchResult} /></CardHeader>
        <CardContent>
          <RadioGroup name="matchResult" options={matchResultOptions} value={matchResult as never} onChange={setMatchResult} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="최종 스코어" points={SCORE_WEIGHTS.exactScore} />
          <p className="text-xs text-muted-foreground">정확히 맞히면 25점, 승패만 맞히면 10점, 한 팀만 맞히면 5점</p>
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
              <label className="block text-xs text-muted-foreground mb-1">{match.awayTeamFlag} {match.awayTeamName}</label>
              <input
                type="number" min="0" max="20" value={mexicoScore}
                onChange={(e) => setMexicoScore(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />
            </div>
          </div>
          {totalGoals !== null && (
            <p className="text-center text-sm text-muted-foreground">총 득점 예측: <strong>{totalGoals}골</strong></p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="🇰🇷 대한민국 첫 득점자" points={SCORE_WEIGHTS.koreaFirstScorer} />
          <p className="text-xs text-muted-foreground">포지션 · A대표팀 통산 골 · 이번 경기 득점 확률</p>
        </CardHeader>
        <CardContent>
          <PlayerSelector
            name="koreaFirstScorer" players={koreaScorerPlayers} value={koreaFirstScorer}
            onChange={setKoreaFirstScorer} accentColor="korea-red" noneLabel="없음 (대한민국 무득점)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title={`${match.awayTeamFlag} ${match.awayTeamName} 첫 득점자`} points={SCORE_WEIGHTS.koreaFirstScorer} />
          <p className="text-xs text-muted-foreground">포지션 · A대표팀 통산 골 · 이번 경기 득점 확률</p>
        </CardHeader>
        <CardContent>
          <PlayerSelector
            name="mexicoFirstScorer" players={awayScorerPlayers} value={mexicoFirstScorer}
            onChange={setMexicoFirstScorer} accentColor="green-600"
            noneLabel={`없음 (${match.awayTeamName} 무득점)`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><SectionLabel title="첫 골 팀" points={SCORE_WEIGHTS.firstGoalTeam} /></CardHeader>
        <CardContent>
          <RadioGroup name="firstGoalTeam" options={firstGoalTeamOptions} value={firstGoalTeam as never} onChange={setFirstGoalTeam} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="첫 골 시간대" points={SCORE_WEIGHTS.firstGoalTimeRange} />
          <p className="text-xs text-muted-foreground">인접 시간대 선택 시 5점</p>
        </CardHeader>
        <CardContent>
          <RadioGroup name="firstGoalTimeRange" options={FIRST_GOAL_TIME_OPTIONS} value={firstGoalTimeRange as never} onChange={setFirstGoalTimeRange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <SectionLabel title="전반전 결과" points={SCORE_WEIGHTS.halfTimeResult} />
            <Badge variant="locked" className="flex items-center gap-1 ml-2 shrink-0">
              <Lock className="h-3 w-3" />수정 불가
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup name="halfTimeResult" options={halfTimeResultOptions} value={halfTimeResult as never} onChange={setHalfTimeResult} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><SectionLabel title="양 팀 합산 카드 수" points={SCORE_WEIGHTS.cardRange} /></CardHeader>
        <CardContent>
          <RadioGroup name="cardRange" options={CARD_RANGE_OPTIONS} value={cardRange as never} onChange={setCardRange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="MVP 1차 예측" points={SCORE_WEIGHTS.mvp} />
          <p className="text-xs text-muted-foreground">경기 종료 후 최종 1회 수정 가능</p>
        </CardHeader>
        <CardContent>
          <select
            value={mvp} onChange={(e) => setMvp(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
          >
            <option value="">선택하세요</option>
            <optgroup label="🇰🇷 대한민국">
              {koreaScorerPlayers.filter((p) => p.name !== '없음').map((p) => (
                <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
              ))}
            </optgroup>
            <optgroup label={`${match.awayTeamFlag} ${match.awayTeamName}`}>
              {awayScorerPlayers.filter((p) => p.name !== '없음').map((p) => (
                <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
              ))}
            </optgroup>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">한 줄 코멘트 (선택)</CardTitle></CardHeader>
        <CardContent>
          <input
            type="text" value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="예: 후반 역전승 예상!" maxLength={50}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
          />
        </CardContent>
      </Card>

      <Button type="submit" variant="korea" size="xl" className="w-full" disabled={!isValid}>
        예측 제출하기
      </Button>
    </form>
  );
}
