'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { subscribeMatchState, subscribeMatchEvents } from '@/lib/firebase/matchState';
import type { MatchStateDoc, MatchEventDoc } from '@/lib/firebase/matchState';
import type { GoalEvent, CardEvent, MatchStatusShort } from '@/types/match';
import { useMatch } from '@/contexts/MatchContext';
import type { MatchConfig } from '@/constants/matches';

// ── 상수 ─────────────────────────────────────────────────────────────────────
const LIVE_STATUSES: MatchStatusShort[] = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'];
const SHOW_DATA_STATUSES: MatchStatusShort[] = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'FT', 'AET', 'PEN', 'LIVE'];

const STATUS_LABEL: Partial<Record<MatchStatusShort, string>> = {
  NS: '경기 전',
  '1H': '전반 진행 중',
  HT: '하프 타임',
  '2H': '후반 진행 중',
  ET: '연장전',
  P: '승부차기',
  FT: '경기 종료',
  AET: '연장 종료',
  PEN: '승부차기 종료',
};

const CARD_COLOR: Record<string, string> = {
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  yellow_red: 'bg-orange-500',
};

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────
function GoalRow({ goal }: { goal: GoalEvent & { id: string } }) {
  const isKorea = goal.teamName.toLowerCase().includes('korea');
  const minute = `${goal.time}${goal.extraTime ? `+${goal.extraTime}` : ''}'`;

  return (
    <div className={`flex items-center gap-2 text-sm ${isKorea ? '' : 'flex-row-reverse'}`}>
      <span className="text-muted-foreground shrink-0 w-10 text-xs">{minute}</span>
      <span>⚽</span>
      <div className={`flex-1 ${isKorea ? '' : 'text-right'}`}>
        <span className="font-medium">{goal.scorer}</span>
        {goal.assist && <span className="text-xs text-muted-foreground ml-1">({goal.assist})</span>}
        {goal.type === 'penalty' && <span className="text-xs text-muted-foreground ml-1">PK</span>}
        {goal.type === 'own_goal' && <span className="text-xs text-red-500 ml-1">자책</span>}
      </div>
    </div>
  );
}

function CardRow({ card }: { card: CardEvent & { id: string } }) {
  const isKorea = card.teamName.toLowerCase().includes('korea');
  const minute = `${card.time}'`;

  return (
    <div className={`flex items-center gap-2 text-sm ${isKorea ? '' : 'flex-row-reverse'}`}>
      <span className="text-muted-foreground shrink-0 w-10 text-xs">{minute}</span>
      <span className={`shrink-0 h-4 w-3 rounded-sm ${CARD_COLOR[card.cardType]}`} />
      <span className="flex-1 text-xs">{card.player}</span>
    </div>
  );
}

function ScoreBanner({
  state,
  goals,
  match,
}: {
  state: MatchStateDoc;
  goals: (GoalEvent & { id: string })[];
  match: MatchConfig;
}) {
  const short = state.status;
  const isLive = LIVE_STATUSES.includes(short);
  const showScore = SHOW_DATA_STATUSES.includes(short);

  const koreaGoals = goals.filter((g) => g.teamName.toLowerCase().includes('korea')).length;
  const awayGoals = goals.filter((g) => !g.teamName.toLowerCase().includes('korea')).length;

  return (
    <div className="rounded-xl bg-gradient-to-r from-korea-blue to-korea-red p-5 text-white text-center space-y-3">
      <p className="text-xs font-medium uppercase tracking-widest opacity-70">2026 FIFA 월드컵</p>

      <Badge
        variant="secondary"
        className={`text-xs font-semibold px-2 py-0.5 ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'}`}
      >
        {STATUS_LABEL[short] ?? short}
      </Badge>

      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">🇰🇷</span>
          <span className="text-sm font-semibold">대한민국</span>
        </div>
        <div className="flex flex-col items-center">
          {showScore ? (
            <>
              <span className="text-4xl font-bold tracking-widest">
                {state.koreaScore} : {state.mexicoScore}
              </span>
              {state.koreaHalfScore !== null && short !== '1H' && (
                <span className="text-xs opacity-60 mt-0.5">
                  전반 {state.koreaHalfScore} : {state.mexicoHalfScore}
                </span>
              )}
            </>
          ) : (
            <span className="text-2xl font-bold opacity-60">VS</span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">{match.awayTeamFlag}</span>
          <span className="text-sm font-semibold">{match.awayTeamName}</span>
        </div>
      </div>

      {showScore && (
        <div className="flex justify-center gap-6 text-xs opacity-70">
          <span>한국 {koreaGoals}골</span>
          <span>·</span>
          <span>{match.awayTeamName} {awayGoals}골</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-xs opacity-60 pt-1">
        <span>📅 {match.date}</span>
        <span>·</span>
        <span>📍 {match.venue || '장소 미정'}</span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
interface LiveMatchPanelProps {
  matchId: string;
  compact?: boolean;
}

export function LiveMatchPanel({ matchId, compact = false }: LiveMatchPanelProps) {
  const { match } = useMatch();
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [events, setEvents] = useState<MatchEventDoc[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(false);
    setMatchState(null);
    setEvents([]);
    const unsubState = subscribeMatchState(matchId, (s) => {
      setMatchState(s);
      setConnected(true);
    });
    const unsubEvents = subscribeMatchEvents(matchId, (evs) => {
      setEvents(evs);
    });
    return () => {
      unsubState();
      unsubEvents();
    };
  }, [matchId]);

  // 이벤트 분리
  const goalEvents = events
    .filter((e): e is Extract<MatchEventDoc, { eventKind: 'goal' }> => e.eventKind === 'goal')
    .map((e) => ({
      id: e.id,
      time: e.time,
      extraTime: e.extraTime,
      side: e.side,
      teamName: e.teamName,
      scorer: e.scorer,
      assist: e.assist,
      type: e.goalType,
    }));

  const cardEvents = events
    .filter((e): e is Extract<MatchEventDoc, { eventKind: 'card' }> => e.eventKind === 'card')
    .map((e) => ({
      id: e.id,
      time: e.time,
      side: e.side,
      teamName: e.teamName,
      player: e.player,
      cardType: e.cardType,
    }));

  // 로딩 (아직 Firebase 응답 전)
  if (!connected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <WifiOff className="h-4 w-4 animate-pulse" />
          실시간 데이터 연결 중...
        </CardContent>
      </Card>
    );
  }

  const DEFAULT_STATE: MatchStateDoc = {
    status: 'NS', koreaScore: 0, mexicoScore: 0,
    koreaHalfScore: null, mexicoHalfScore: null, updatedAt: null,
  };
  const state = matchState ?? DEFAULT_STATE;

  const short = state.status;
  const showData = SHOW_DATA_STATUSES.includes(short);
  const isLive = LIVE_STATUSES.includes(short);

  const koreaCards = cardEvents.filter((c) => c.teamName.toLowerCase().includes('korea'));
  const mexicoCards = cardEvents.filter((c) => !c.teamName.toLowerCase().includes('korea'));

  return (
    <div className="space-y-3">
      {/* 스코어 배너 */}
      <ScoreBanner state={state} goals={goalEvents} match={match} />

      {/* 연결 상태 */}
      <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Wifi className="h-3 w-3 text-green-500" />
        <span className={isLive ? 'text-green-600 font-medium' : ''}>
          {isLive ? '실시간 연결됨 — 이벤트 즉시 반영' : 'Firebase 연결됨'}
        </span>
      </div>

      {/* 득점 현황 */}
      {showData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              ⚽ 득점 현황
              <span className="text-muted-foreground font-normal text-xs">({goalEvents.length}골)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">득점 없음</p>
            ) : (
              <div className="space-y-2">
                <div className="flex text-xs text-muted-foreground mb-1">
                  <span className="w-10" />
                  <span className="flex-1">🇰🇷 대한민국</span>
                  <span className="flex-1 text-right">멕시코 🇲🇽</span>
                </div>
                {goalEvents.map((g) => <GoalRow key={g.id} goal={g} />)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 카드 현황 */}
      {showData && cardEvents.length > 0 && !compact && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              🟨 카드 현황
              <span className="text-muted-foreground font-normal text-xs">
                한국 {koreaCards.length}장 · 멕시코 {mexicoCards.length}장
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {cardEvents.map((c) => <CardRow key={c.id} card={c} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
