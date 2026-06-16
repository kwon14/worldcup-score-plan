'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import type { MatchStatusShort, LiveMatchResponse, GoalEvent, CardEvent } from '@/types/match';
import {
  subscribeMatchState, subscribeMatchEvents,
  updateMatchState, addGoalEvent, addCardEvent, deleteMatchEvent,
  initMatchState,
} from '@/lib/firebase/matchState';
import type { MatchStateDoc, MatchEventDoc } from '@/lib/firebase/matchState';
import { app } from '@/lib/firebase/config';
import { useMatch } from '@/contexts/MatchContext';
import { KOREA_PLAYER_DATA } from '@/constants/players';

// ── 상수 ─────────────────────────────────────────────────────────────────────

const STATUS_FLOW: { status: MatchStatusShort; label: string; color: string }[] = [
  { status: 'NS',  label: '경기 전',   color: 'bg-slate-500' },
  { status: '1H',  label: '전반 진행 중', color: 'bg-blue-500' },
  { status: 'HT',  label: '하프타임', color: 'bg-yellow-500' },
  { status: '2H',  label: '후반 진행 중', color: 'bg-orange-500' },
  { status: 'FT',  label: '경기 종료', color: 'bg-red-600' },
];

const KOREA_PLAYERS = [...KOREA_PLAYER_DATA.filter((p) => p.name !== '없음').map((p) => p.name), '직접 입력'];

function isKoreaTeam(teamName: string) {
  const lower = teamName.toLowerCase();
  return lower.includes('korea') || teamName.includes('대한민국');
}

function toKoreaScorePayload(live: LiveMatchResponse) {
  const koreaIsHome = isKoreaTeam(live.homeTeam);
  return {
    status: live.status?.short ?? 'NS',
    koreaScore: (koreaIsHome ? live.homeScore : live.awayScore) ?? 0,
    mexicoScore: (koreaIsHome ? live.awayScore : live.homeScore) ?? 0,
    koreaHalfScore: koreaIsHome ? live.homeHalfScore : live.awayHalfScore,
    mexicoHalfScore: koreaIsHome ? live.awayHalfScore : live.homeHalfScore,
  };
}

function officialGoals(live: LiveMatchResponse): GoalEvent[] {
  const awayTeam = isKoreaTeam(live.homeTeam) ? live.awayTeam : live.homeTeam;
  return live.goals.map((goal) => ({
    ...goal,
    teamName: isKoreaTeam(goal.teamName) ? 'Korea Republic' : awayTeam,
  }));
}

function officialCards(live: LiveMatchResponse): CardEvent[] {
  const awayTeam = isKoreaTeam(live.homeTeam) ? live.awayTeam : live.homeTeam;
  return live.cards.map((card) => ({
    ...card,
    teamName: isKoreaTeam(card.teamName) ? 'Korea Republic' : awayTeam,
  }));
}

// ── GoalForm ──────────────────────────────────────────────────────────────────

function GoalForm({
  matchId, awayPlayers, awayTeamFlag, awayTeamName,
}: {
  matchId: string; awayPlayers: string[]; awayTeamFlag: string; awayTeamName: string;
}) {
  const [team, setTeam] = useState<'KOREA' | 'MEXICO'>('KOREA');
  const [minute, setMinute] = useState('');
  const [scorer, setScorer] = useState('');
  const [customScorer, setCustomScorer] = useState('');
  const [assist, setAssist] = useState('');
  const [type, setType] = useState<'normal' | 'penalty' | 'own_goal'>('normal');
  const [loading, setLoading] = useState(false);

  const players = team === 'KOREA' ? KOREA_PLAYERS : awayPlayers;
  const finalScorer = scorer === '직접 입력' ? customScorer : scorer;

  async function handleAdd() {
    if (!minute || !finalScorer) return;
    setLoading(true);
    await addGoalEvent(matchId, {
      time: Number(minute),
      extraTime: null,
      side: team === 'KOREA' ? 'away' : 'home',
      teamName: team === 'KOREA' ? 'Korea Republic' : awayTeamName,
      scorer: finalScorer,
      assist: assist || null,
      type,
    });
    setMinute(''); setScorer(''); setCustomScorer(''); setAssist('');
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => { setTeam('KOREA'); setScorer(''); }}
          className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${team === 'KOREA' ? 'border-korea-red bg-red-50 text-korea-red' : 'border-border'}`}>
          🇰🇷 대한민국
        </button>
        <button type="button" onClick={() => { setTeam('MEXICO'); setScorer(''); }}
          className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${team === 'MEXICO' ? 'border-green-600 bg-green-50 text-green-700' : 'border-border'}`}>
          {awayTeamFlag} {awayTeamName}
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">득점 시간 (분)</label>
          <input type="number" min="1" max="120" value={minute}
            onChange={(e) => setMinute(e.target.value)} placeholder="예: 23"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30" />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">유형</label>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="normal">일반골</option>
            <option value="penalty">페널티</option>
            <option value="own_goal">자책골</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">득점자</label>
        <select value={scorer} onChange={(e) => setScorer(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm">
          <option value="">선택하세요</option>
          {players.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {scorer === '직접 입력' && (
          <input type="text" value={customScorer} onChange={(e) => setCustomScorer(e.target.value)}
            placeholder="선수 이름 직접 입력"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30" />
        )}
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">어시스트 (선택)</label>
        <input type="text" value={assist} onChange={(e) => setAssist(e.target.value)}
          placeholder="없으면 비워두세요"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30" />
      </div>

      <Button onClick={handleAdd} disabled={!minute || !finalScorer || loading}
        variant="korea" className="w-full">
        <Plus className="h-4 w-4 mr-1" />득점 추가
      </Button>
    </div>
  );
}

// ── CardForm ──────────────────────────────────────────────────────────────────

function CardForm({
  matchId, awayPlayers, awayTeamFlag, awayTeamName,
}: {
  matchId: string; awayPlayers: string[]; awayTeamFlag: string; awayTeamName: string;
}) {
  const [team, setTeam] = useState<'KOREA' | 'MEXICO'>('KOREA');
  const [minute, setMinute] = useState('');
  const [player, setPlayer] = useState('');
  const [customPlayer, setCustomPlayer] = useState('');
  const [cardType, setCardType] = useState<'yellow' | 'red' | 'yellow_red'>('yellow');
  const [loading, setLoading] = useState(false);

  const players = team === 'KOREA' ? KOREA_PLAYERS : awayPlayers;
  const finalPlayer = player === '직접 입력' ? customPlayer : player;

  async function handleAdd() {
    if (!minute || !finalPlayer) return;
    setLoading(true);
    await addCardEvent(matchId, {
      time: Number(minute),
      side: team === 'KOREA' ? 'away' : 'home',
      teamName: team === 'KOREA' ? 'Korea Republic' : awayTeamName,
      player: finalPlayer,
      cardType,
    });
    setMinute(''); setPlayer(''); setCustomPlayer('');
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => { setTeam('KOREA'); setPlayer(''); }}
          className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${team === 'KOREA' ? 'border-korea-red bg-red-50 text-korea-red' : 'border-border'}`}>
          🇰🇷 대한민국
        </button>
        <button type="button" onClick={() => { setTeam('MEXICO'); setPlayer(''); }}
          className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${team === 'MEXICO' ? 'border-green-600 bg-green-50 text-green-700' : 'border-border'}`}>
          {awayTeamFlag} {awayTeamName}
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">시간 (분)</label>
          <input type="number" min="1" max="120" value={minute}
            onChange={(e) => setMinute(e.target.value)} placeholder="예: 34"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30" />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">카드 종류</label>
          <select value={cardType} onChange={(e) => setCardType(e.target.value as typeof cardType)}
            className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="yellow">🟨 경고</option>
            <option value="red">🟥 퇴장</option>
            <option value="yellow_red">🟧 두 번째 경고</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">대상 선수</label>
        <select value={player} onChange={(e) => setPlayer(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm">
          <option value="">선택하세요</option>
          {players.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {player === '직접 입력' && (
          <input type="text" value={customPlayer} onChange={(e) => setCustomPlayer(e.target.value)}
            placeholder="선수 이름 직접 입력"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30" />
        )}
      </div>

      <Button onClick={handleAdd} disabled={!minute || !finalPlayer || loading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
        <Plus className="h-4 w-4 mr-1" />카드 추가
      </Button>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function AdminLivePage() {
  const { matchId, match } = useMatch();
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [events, setEvents] = useState<MatchEventDoc[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'goal' | 'card'>('status');
  const [scoreInput, setScoreInput] = useState({ korea: '0', mexico: '0' });
  const [statusLoading, setStatusLoading] = useState(false);
  const [officialData, setOfficialData] = useState<LiveMatchResponse | null>(null);
  const [officialMode, setOfficialMode] = useState<'summary' | 'lineups' | null>(null);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialError, setOfficialError] = useState<string | null>(null);

  const awayPlayers = [...match.awayPlayerData.filter((p) => p.name !== '없음').map((p) => p.name), '직접 입력'];

  useEffect(() => {
    initMatchState(matchId);

    const unsubState = subscribeMatchState(matchId, (s) => {
      setMatchState(s);
      if (s) setScoreInput({ korea: String(s.koreaScore), mexico: String(s.mexicoScore) });
    });
    const unsubEvents = subscribeMatchEvents(matchId, setEvents);
    return () => { unsubState(); unsubEvents(); };
  }, [matchId]);

  async function handleStatusChange(status: MatchStatusShort) {
    setStatusLoading(true);
    const payload: Partial<Omit<MatchStateDoc, 'updatedAt'>> = { status };
    if (status === 'HT' && matchState) {
      payload.koreaHalfScore = matchState.koreaScore;
      payload.mexicoHalfScore = matchState.mexicoScore;
    }
    await updateMatchState(matchId, payload);
    setStatusLoading(false);
  }

  async function handleScoreUpdate() {
    await updateMatchState(matchId, {
      koreaScore: Number(scoreInput.korea),
      mexicoScore: Number(scoreInput.mexico),
    });
  }

  async function requestOfficialData(mode: 'summary' | 'lineups' | 'final'): Promise<LiveMatchResponse> {
    const user = getAuth(app).currentUser;
    const idToken = await user?.getIdToken();
    if (!idToken) throw new Error('관리자 로그인이 필요합니다.');

    const res = await fetch(`/api/match/live?matchId=${encodeURIComponent(matchId)}&mode=${mode}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = (await res.json()) as LiveMatchResponse;
    if (!res.ok || !data.available) throw new Error(data.error ?? '공식 API 조회에 실패했어요.');
    return data;
  }

  async function handleFinalMatchEnd() {
    setStatusLoading(true);
    setOfficialLoading(true);
    setOfficialError(null);
    try {
      const data = await requestOfficialData('final');
      setOfficialData(data);
      setOfficialMode('summary');
      await Promise.all(events.map((event) => deleteMatchEvent(matchId, event.id)));
      await updateMatchState(matchId, { ...toKoreaScorePayload(data), status: 'FT' });
      await Promise.all(officialGoals(data).map((goal) => addGoalEvent(matchId, goal)));
      await Promise.all(officialCards(data).map((card) => addCardEvent(matchId, card)));
    } catch (err) {
      setOfficialError(err instanceof Error ? err.message : '최종 경기 종료 처리에 실패했어요.');
      await updateMatchState(matchId, {
        status: 'FT',
        koreaScore: Number(scoreInput.korea),
        mexicoScore: Number(scoreInput.mexico),
      });
    } finally {
      setOfficialLoading(false);
      setStatusLoading(false);
    }
  }

  async function fetchOfficial(mode: 'summary' | 'lineups') {
    setOfficialLoading(true);
    setOfficialError(null);
    setOfficialMode(mode);
    try {
      const data = await requestOfficialData(mode);
      setOfficialData(data);
    } catch (err) {
      setOfficialData(null);
      setOfficialError(err instanceof Error ? err.message : '공식 API 조회에 실패했어요.');
    } finally {
      setOfficialLoading(false);
    }
  }

  async function applyOfficialData() {
    if (!officialData) return;
    setOfficialLoading(true);
    setOfficialError(null);
    try {
      await Promise.all(events.map((event) => deleteMatchEvent(matchId, event.id)));
      await updateMatchState(matchId, toKoreaScorePayload(officialData));
      await Promise.all(officialGoals(officialData).map((goal) => addGoalEvent(matchId, goal)));
      await Promise.all(officialCards(officialData).map((card) => addCardEvent(matchId, card)));
    } catch (err) {
      setOfficialError(err instanceof Error ? err.message : 'Firebase 반영에 실패했어요.');
    } finally {
      setOfficialLoading(false);
    }
  }

  const goalEvents = events.filter(
    (e): e is Extract<MatchEventDoc, { eventKind: 'goal' }> => e.eventKind === 'goal'
  );
  const cardEvents = events.filter(
    (e): e is Extract<MatchEventDoc, { eventKind: 'card' }> => e.eventKind === 'card'
  );

  if (!matchState) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Firebase 연결 중...
      </div>
    );
  }

  const currentStatusLabel = STATUS_FLOW.find((s) => s.status === matchState.status)?.label ?? matchState.status;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-bold text-lg">라이브 이벤트 관리</h1>
          <p className="text-xs text-muted-foreground">골·카드 실시간 입력</p>
        </div>
        <Badge className="ml-auto text-xs">{currentStatusLabel}</Badge>
      </div>

      {/* 현재 스코어 */}
      <Card className="border-2 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <span className="text-2xl">🇰🇷</span>
              <p className="text-xs text-muted-foreground mt-0.5">대한민국</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="20" value={scoreInput.korea}
                onChange={(e) => setScoreInput((p) => ({ ...p, korea: e.target.value }))}
                className="w-14 text-center text-3xl font-bold border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-korea-red/30" />
              <span className="text-2xl font-bold text-muted-foreground">:</span>
              <input type="number" min="0" max="20" value={scoreInput.mexico}
                onChange={(e) => setScoreInput((p) => ({ ...p, mexico: e.target.value }))}
                className="w-14 text-center text-3xl font-bold border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-green-600/30" />
            </div>
            <div className="text-center">
              <span className="text-2xl">{match.awayTeamFlag}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{match.awayTeamName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button onClick={handleScoreUpdate} variant="outline" size="sm">
              스코어 저장
            </Button>
            <Button onClick={handleFinalMatchEnd} variant="destructive" size="sm" disabled={statusLoading}>
              최종 경기 종료
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 공식 API 수동 조회 */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">공식 경기정보 조회</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            공식 API는 참가자 화면에서 자동 조회하지 않고, 관리자 화면에서 누를 때만 조회합니다. 일일 100회 중 90회부터는 일반 조회를 막고, 최종 경기 종료 정산용 10회를 남겨둡니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" disabled={officialLoading} onClick={() => fetchOfficial('summary')}>
              {officialLoading && officialMode === 'summary' ? '조회 중...' : '공식 경기정보 조회'}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={officialLoading} onClick={() => fetchOfficial('lineups')}>
              {officialLoading && officialMode === 'lineups' ? '조회 중...' : '라인업 조회'}
            </Button>
          </div>
          {officialError && <p className="text-xs text-red-600">{officialError}</p>}
          {officialData && (
            <div className="rounded-lg border bg-white p-3 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">조회 결과 미리보기</span>
                <Badge variant="secondary">{officialData.status?.short ?? '상태 없음'}</Badge>
              </div>
              <p>
                {officialData.homeTeam} {officialData.homeScore ?? '-'} : {officialData.awayScore ?? '-'} {officialData.awayTeam}
              </p>
              {officialMode === 'summary' && (
                <p className="text-muted-foreground">득점 {officialData.goals.length}개 · 카드 {officialData.cards.length}개</p>
              )}
              {officialMode === 'lineups' && (
                <p className="text-muted-foreground">라인업 {officialData.lineups.length}팀 조회됨</p>
              )}
              {officialMode === 'summary' && (
                <Button type="button" size="sm" className="w-full" disabled={officialLoading} onClick={applyOfficialData}>
                  이 내용으로 Firebase 반영
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탭 */}
      <div className="flex rounded-xl border overflow-hidden">
        {(['status', 'goal', 'card'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'
            }`}>
            {tab === 'status' ? '⏱ 상태' : tab === 'goal' ? '⚽ 득점' : '🟨 카드'}
          </button>
        ))}
      </div>

      {/* 상태 탭 */}
      {activeTab === 'status' && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">경기 진행 상태 변경</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {STATUS_FLOW.map((s) => (
              <button key={s.status} type="button" disabled={statusLoading}
                onClick={() => handleStatusChange(s.status)}
                className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                  matchState.status === s.status
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-border hover:bg-muted/50'
                }`}>
                <span className={`h-2.5 w-2.5 rounded-full ${s.color} shrink-0`} />
                <span className="text-sm font-medium">{s.label}</span>
                {matchState.status === s.status && (
                  <Badge className="ml-auto text-xs bg-white text-slate-900">현재</Badge>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 득점 탭 */}
      {activeTab === 'goal' && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">득점 추가</CardTitle></CardHeader>
            <CardContent>
              <GoalForm
                matchId={matchId}
                awayPlayers={awayPlayers}
                awayTeamFlag={match.awayTeamFlag}
                awayTeamName={match.awayTeamName}
              />
            </CardContent>
          </Card>

          {goalEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">등록된 득점 ({goalEvents.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {goalEvents.map((g) => {
                  const isKorea = g.teamName.toLowerCase().includes('korea');
                  return (
                    <div key={g.id} className="flex items-center gap-2 rounded-lg border p-3">
                      <span className="text-xs text-muted-foreground w-8 shrink-0">{g.time}&apos;</span>
                      <span>{isKorea ? '🇰🇷' : match.awayTeamFlag}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{g.scorer}</span>
                        {g.assist && <span className="text-xs text-muted-foreground ml-1">({g.assist})</span>}
                        {g.goalType !== 'normal' && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {g.goalType === 'penalty' ? 'PK' : '자책'}
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 h-7 w-7 shrink-0"
                        onClick={() => deleteMatchEvent(matchId, g.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 카드 탭 */}
      {activeTab === 'card' && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">카드 추가</CardTitle></CardHeader>
            <CardContent>
              <CardForm
                matchId={matchId}
                awayPlayers={awayPlayers}
                awayTeamFlag={match.awayTeamFlag}
                awayTeamName={match.awayTeamName}
              />
            </CardContent>
          </Card>

          {cardEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">등록된 카드 ({cardEvents.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cardEvents.map((c) => {
                  const isKorea = c.teamName.toLowerCase().includes('korea');
                  const emoji = c.cardType === 'yellow' ? '🟨' : c.cardType === 'red' ? '🟥' : '🟧';
                  return (
                    <div key={c.id} className="flex items-center gap-2 rounded-lg border p-3">
                      <span className="text-xs text-muted-foreground w-8 shrink-0">{c.time}&apos;</span>
                      <span>{isKorea ? '🇰🇷' : match.awayTeamFlag}</span>
                      <span>{emoji}</span>
                      <span className="flex-1 text-sm">{c.player}</span>
                      <Button variant="ghost" size="icon" className="text-red-500 h-7 w-7 shrink-0"
                        onClick={() => deleteMatchEvent(matchId, c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
