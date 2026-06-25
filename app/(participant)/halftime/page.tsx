'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Lock, CheckCircle2, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CARD_RANGE_OPTIONS } from '@/constants/options';
import { KOREA_PLAYER_DATA, type PlayerData } from '@/constants/players';
import { SCORE_WEIGHTS, GOAL_TIME_ORDER } from '@/constants/gameConfig';
import { LiveMatchPanel } from '@/components/game/LiveMatchPanel';
import { subscribeMatchState, type MatchStateDoc } from '@/lib/firebase/matchState';
import { subscribePredictions, getPrediction, savePrediction, type PredictionDoc } from '@/lib/firebase/predictions';
import { getParticipantId } from '@/lib/firebase/auth';
import { useMatch } from '@/contexts/MatchContext';
import { buildPredictionPlayerData, samePlayerName } from '@/lib/lineups/playerOptions';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const POSITION_COLOR: Record<string, string> = {
  FW: 'bg-red-100 text-red-700',
  MF: 'bg-green-100 text-green-700',
  DF: 'bg-blue-100 text-blue-700',
  GK: 'bg-yellow-100 text-yellow-700',
  '-': 'bg-slate-100 text-slate-500',
};

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };


const FIRST_GOAL_TIME_LABEL: Record<string, string> = {
  '0_15': '0~15분', '16_30': '16~30분', '31_45': '31~45분+',
  '46_60': '46~60분', '61_75': '61~75분', '76_90': '76~90분+', 'NONE': '없음',
};

// ─── 중간 점수 계산 ───────────────────────────────────────────────────────────

function computeIntermediateScore(pred: PredictionDoc, ms: MatchStateDoc): number {
  let score = 0;
  if (ms.halfTimeResult && pred.halfTimeResult === ms.halfTimeResult) {
    score += SCORE_WEIGHTS.halfTimeResult;
  }
  if (ms.firstGoalTeam && ms.firstGoalTeam !== 'NONE') {
    if (pred.firstGoalTeam === ms.firstGoalTeam) score += SCORE_WEIGHTS.firstGoalTeam;
    if (ms.firstGoalTimeRange) {
      const predOrder = GOAL_TIME_ORDER[pred.firstGoalTimeRange] ?? -1;
      const actOrder = GOAL_TIME_ORDER[ms.firstGoalTimeRange] ?? -1;
      if (predOrder >= 0 && actOrder >= 0) {
        if (predOrder === actOrder) score += SCORE_WEIGHTS.firstGoalTimeRange;
        else if (Math.abs(predOrder - actOrder) === 1) score += 5;
      }
    }
    if (ms.koreaFirstScorer && ms.koreaFirstScorer !== '없음' && samePlayerName(pred.koreaFirstScorer, ms.koreaFirstScorer)) {
      score += SCORE_WEIGHTS.koreaFirstScorer;
    }
  }
  return score;
}

// ─── 공통 컴포넌트 ────────────────────────────────────────────────────────────

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

export default function HalfTimePage() {
  const router = useRouter();
  const { matchId, match } = useMatch();

  const [loading, setLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [myPrediction, setMyPrediction] = useState<PredictionDoc | null>(null);
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [allPredictions, setAllPredictions] = useState<PredictionDoc[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const matchResultOptions = [
    { value: 'KOREA_WIN', label: match.matchResultLabels['KOREA_WIN'] },
    { value: 'DRAW',      label: match.matchResultLabels['DRAW'] },
    { value: 'MEXICO_WIN', label: match.matchResultLabels['MEXICO_WIN'] },
  ];

  const [matchResult, setMatchResult] = useState('');
  const [koreaScore, setKoreaScore] = useState('');
  const [mexicoScore, setMexicoScore] = useState('');
  const [cardRange, setCardRange] = useState('');
  const [koreaFirstScorer, setKoreaFirstScorer] = useState('');
  const [mexicoFirstScorer, setMexicoFirstScorer] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPrediction() {
      const authParticipantId = await getParticipantId();
      const id = typeof window !== 'undefined'
        ? localStorage.getItem(`wc_participant_id_${matchId}`) ?? authParticipantId
        : authParticipantId;
      if (cancelled) return;
      setParticipantId(id);
      if (id) {
        const pred = await getPrediction(matchId, id);
        if (cancelled) return;
        if (pred) {
          setMyPrediction(pred);
          setMatchResult(pred.matchResult);
          setKoreaScore(String(pred.koreaScore));
          setMexicoScore(String(pred.mexicoScore));
          setCardRange(pred.cardRange);
          setKoreaFirstScorer(pred.koreaFirstScorer);
          setMexicoFirstScorer(pred.mexicoFirstScorer);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    }

    loadPrediction();
    return () => { cancelled = true; };
  }, [matchId]);

  useEffect(() => subscribeMatchState(matchId, setMatchState), [matchId]);
  useEffect(() => subscribePredictions(matchId, setAllPredictions), [matchId]);

  const firstGoalTeam = matchState?.firstGoalTeam ?? 'NONE';
  const firstGoalOccurred = firstGoalTeam !== 'NONE';
  const koreaFirstScorerLocked = !!(matchState?.koreaFirstScorer && matchState.koreaFirstScorer !== '없음');
  const mexicoFirstScorerLocked = !!(matchState?.mexicoFirstScorer && matchState.mexicoFirstScorer !== '없음');

  const intermediateRanking = matchState
    ? [...allPredictions]
        .map((p) => ({ name: p.name, score: computeIntermediateScore(p, matchState) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  const myIntermediateScore =
    myPrediction && matchState ? computeIntermediateScore(myPrediction, matchState) : 0;

  const totalGoals =
    koreaScore !== '' && mexicoScore !== '' ? Number(koreaScore) + Number(mexicoScore) : null;
  const matchKoreaPlayerData = match.koreaPlayerData ?? KOREA_PLAYER_DATA;
  const koreaScorerPlayers = buildPredictionPlayerData(matchState?.koreaLineupPlayers, matchKoreaPlayerData);
  const awayScorerPlayers = buildPredictionPlayerData(matchState?.awayLineupPlayers, match.awayPlayerData);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!myPrediction || !participantId) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      await savePrediction(matchId, participantId, {
        name: myPrediction.name,
        team: myPrediction.team,
        matchResult,
        koreaScore: Number(koreaScore),
        mexicoScore: Number(mexicoScore),
        koreaFirstScorer,
        mexicoFirstScorer,
        firstGoalTeam: myPrediction.firstGoalTeam,
        firstGoalTimeRange: myPrediction.firstGoalTimeRange,
        halfTimeResult: myPrediction.halfTimeResult,
        cardRange,
        mvp: myPrediction.mvp,
        finalMvp: myPrediction.finalMvp ?? null,
        comment: myPrediction.comment,
        halftimeRevised: true,
      });
      router.push('/');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">예측 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!participantId || !myPrediction) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">하프타임 수정</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-muted-foreground text-sm">
              예측을 먼저 제출해야 하프타임 수정을 할 수 있어요.
            </p>
            <Button variant="korea" asChild>
              <Link href="/predict">예측 제출하러 가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myPrediction.halftimeRevised) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-bold text-lg">하프타임 수정</h1>
        </div>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-semibold">하프타임 수정을 이미 완료했어요</p>
            <p className="text-sm text-muted-foreground">수정은 1회만 가능합니다.</p>
            <Button variant="korea" asChild className="mt-2">
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
          <h1 className="font-bold text-lg">하프타임 수정</h1>
          <p className="text-xs text-muted-foreground">수정 가능 항목을 1회만 변경할 수 있어요</p>
        </div>
      </div>

      <LiveMatchPanel matchId={matchId} compact />

      {/* 전반 실제 결과 */}
      {matchState?.koreaHalfScore !== null && matchState?.koreaHalfScore !== undefined && (
        <Card className="border-slate-300 bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">전반전 실제 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <span className="text-2xl">🇰🇷</span>
                <p className="text-xs text-muted-foreground mt-1">대한민국</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold">{matchState.koreaHalfScore}</span>
                <span className="text-2xl text-muted-foreground">:</span>
                <span className="text-4xl font-bold">{matchState.mexicoHalfScore}</span>
              </div>
              <div className="text-center">
                <span className="text-2xl">{match.awayTeamFlag}</span>
                <p className="text-xs text-muted-foreground mt-1">{match.awayTeamName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-white border p-3">
                <p className="text-xs text-muted-foreground mb-1">전반 결과</p>
                <p className="font-semibold">{match.halfTimeResultLabels[matchState.halfTimeResult ?? ''] ?? '-'}</p>
              </div>
              <div className="rounded-lg bg-white border p-3">
                <p className="text-xs text-muted-foreground mb-1">첫 골 팀</p>
                <p className="font-semibold">
                  {firstGoalOccurred
                    ? (match.firstGoalTeamLabels[firstGoalTeam] ?? firstGoalTeam)
                    : '없음'}
                </p>
              </div>
              <div className="rounded-lg bg-white border p-3">
                <p className="text-xs text-muted-foreground mb-1">첫 골 시간대</p>
                <p className="font-semibold">
                  {firstGoalOccurred ? FIRST_GOAL_TIME_LABEL[matchState.firstGoalTimeRange ?? 'NONE'] : '없음'}
                </p>
              </div>
              <div className="rounded-lg bg-white border p-3">
                <p className="text-xs text-muted-foreground mb-1">{match.awayTeamName} 첫 득점자</p>
                <p className="font-semibold">{matchState.mexicoFirstScorer ?? '없음'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 내 중간 점수 + 순위 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-korea-red/30 bg-red-50/40">
          <CardContent className="flex flex-col items-center p-4 gap-1">
            <p className="text-xs text-muted-foreground">내 중간 점수</p>
            <span className="text-3xl font-bold text-korea-red">{myIntermediateScore}</span>
            <p className="text-xs text-muted-foreground">/ 20점 확정</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">중간 순위</p>
            {intermediateRanking.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between text-sm">
                <span>{RANK_MEDAL[i + 1]} {r.name}</span>
                <span className="font-bold">{r.score}점</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          전반전 기준 중간 점수입니다. 경기 결과·스코어·카드·MVP는 아직 확정되지 않아
          최종 순위는 달라질 수 있어요. 수정은 <strong>1회</strong>만 가능합니다.
        </p>
      </div>

      {/* 경기 결과 */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="경기 결과" points={SCORE_WEIGHTS.matchResult} locked={false} />
        </CardHeader>
        <CardContent>
          <RadioGroup
            name="matchResult"
            options={matchResultOptions}
            value={matchResult as never}
            onChange={setMatchResult}
          />
        </CardContent>
      </Card>

      {/* 최종 스코어 */}
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
              <label className="block text-xs text-muted-foreground mb-1">{match.awayTeamFlag} {match.awayTeamName}</label>
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

      {/* 대한민국 첫 득점자 */}
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
            ? <LockedOverlay reason={`전반 첫 득점자 확정: ${matchState?.koreaFirstScorer}`} />
            : <PlayerSelector
                name="koreaFirstScorer"
                players={koreaScorerPlayers}
                value={koreaFirstScorer}
                onChange={setKoreaFirstScorer}
                accentColor="korea-red"
              />
          }
        </CardContent>
      </Card>

      {/* 멕시코 첫 득점자 */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel
            title={`${match.awayTeamFlag} ${match.awayTeamName} 첫 득점자`}
            points={SCORE_WEIGHTS.koreaFirstScorer}
            locked={mexicoFirstScorerLocked}
          />
          {mexicoFirstScorerLocked && (
            <p className="text-xs text-muted-foreground">전반에 이미 득점자가 확정되었어요</p>
          )}
        </CardHeader>
        <CardContent>
          {mexicoFirstScorerLocked
            ? <LockedOverlay reason={`전반 첫 득점자 확정: ${matchState?.mexicoFirstScorer}`} />
            : <PlayerSelector
                name="mexicoFirstScorer"
                players={awayScorerPlayers}
                value={mexicoFirstScorer}
                onChange={setMexicoFirstScorer}
                accentColor="green-600"
              />
          }
        </CardContent>
      </Card>

      {/* 첫 골 팀 (항상 잠금) */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="첫 골 팀" points={SCORE_WEIGHTS.firstGoalTeam} locked={true} />
          {firstGoalOccurred && (
            <p className="text-xs text-muted-foreground">전반에 첫 골이 발생해 확정되었어요</p>
          )}
        </CardHeader>
        <CardContent>
          <LockedOverlay
            reason={firstGoalOccurred
              ? `전반 첫 골 팀 확정: ${match.firstGoalTeamLabels[firstGoalTeam] ?? firstGoalTeam}`
              : '전반 무득점 — 예측값 유지'
            }
          />
        </CardContent>
      </Card>

      {/* 첫 골 시간대 (항상 잠금) */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="첫 골 시간대" points={SCORE_WEIGHTS.firstGoalTimeRange} locked={true} />
        </CardHeader>
        <CardContent>
          <LockedOverlay
            reason={firstGoalOccurred
              ? `전반 첫 골 시간대 확정: ${FIRST_GOAL_TIME_LABEL[matchState?.firstGoalTimeRange ?? 'NONE']}`
              : '전반 무득점 — 예측값 유지'
            }
          />
        </CardContent>
      </Card>

      {/* 전반전 결과 (항상 잠금) */}
      <Card>
        <CardHeader className="pb-3">
          <SectionLabel title="전반전 결과" points={SCORE_WEIGHTS.halfTimeResult} locked={true} />
        </CardHeader>
        <CardContent>
          <LockedOverlay
            reason={matchState?.halfTimeResult
              ? `전반 종료 기준 확정: ${match.halfTimeResultLabels[matchState.halfTimeResult]}`
              : '전반 결과 대기 중'
            }
          />
        </CardContent>
      </Card>

      {/* 카드 수 */}
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

      {saveError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <Button type="submit" variant="korea" size="xl" className="w-full" disabled={submitting}>
        {submitting ? '제출 중...' : '하프타임 수정 제출하기'}
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-4">
        제출 후에는 MVP를 제외한 모든 항목을 수정할 수 없어요
      </p>
    </form>
  );
}
