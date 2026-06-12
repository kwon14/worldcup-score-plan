'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Users, ClipboardList, Trophy, AlertTriangle, DatabaseZap, Trash2 } from 'lucide-react';
import type { GameStatus } from '@/types/game';
import { GAME_STATUS_LABELS } from '@/lib/game/gameState';
import { subscribeGameStatus, setGameStatus } from '@/lib/firebase/gameStatus';
import { subscribeActualResult, type ActualResultDoc } from '@/lib/firebase/results';
import { subscribePredictions, type PredictionDoc } from '@/lib/firebase/predictions';
import { seedSampleData, resetAllData } from '@/lib/firebase/seed';
import { useMatch } from '@/contexts/MatchContext';

// ─── 게임 상태 전환 순서 ─────────────────────────────────────────────────────

const STATUS_FLOW: { from: GameStatus; to: GameStatus; label: string; danger?: boolean }[] = [
  { from: 'BEFORE_MATCH', to: 'FIRST_HALF',   label: '경기 시작 → 예측 마감' },
  { from: 'FIRST_HALF',   to: 'HALF_TIME',    label: '전반 종료 → 하프타임 오픈' },
  { from: 'HALF_TIME',    to: 'SECOND_HALF',  label: '후반 시작 → 수정 마감' },
  { from: 'SECOND_HALF',  to: 'AFTER_MATCH',  label: '경기 종료 → MVP 수정 오픈' },
  { from: 'AFTER_MATCH',  to: 'RESULT_OPEN',  label: '결과 공개', danger: true },
];

const STATUS_COLOR: Record<GameStatus, string> = {
  BEFORE_MATCH: 'bg-blue-100 text-blue-800 border-blue-200',
  FIRST_HALF:   'bg-green-100 text-green-800 border-green-200',
  HALF_TIME:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  SECOND_HALF:  'bg-green-100 text-green-800 border-green-200',
  AFTER_MATCH:  'bg-orange-100 text-orange-800 border-orange-200',
  RESULT_OPEN:  'bg-purple-100 text-purple-800 border-purple-200',
};

const STATUS_DOT: Record<GameStatus, string> = {
  BEFORE_MATCH: 'bg-blue-500',
  FIRST_HALF:   'bg-green-500 animate-pulse',
  HALF_TIME:    'bg-yellow-500 animate-pulse',
  SECOND_HALF:  'bg-green-500 animate-pulse',
  AFTER_MATCH:  'bg-orange-500',
  RESULT_OPEN:  'bg-purple-500',
};

// ─── 페이지 ──────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { matchId } = useMatch();
  const [status, setStatus] = useState<GameStatus>('BEFORE_MATCH');
  const [confirmNext, setConfirmNext] = useState<GameStatus | null>(null);
  const [predictions, setPredictions] = useState<PredictionDoc[]>([]);
  const [actualResult, setActualResult] = useState<ActualResultDoc | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const unsubStatus = subscribeGameStatus(matchId, setStatus);
    const unsubPreds = subscribePredictions(matchId, setPredictions);
    const unsubResult = subscribeActualResult(matchId, setActualResult);
    return () => { unsubStatus(); unsubPreds(); unsubResult(); };
  }, [matchId]);

  const stats = {
    total: predictions.length,
    submitted: predictions.length,
    halftimeRevised: predictions.filter((p) => p.halftimeRevised).length,
    mvpSubmitted: predictions.filter((p) => p.finalMvp).length,
  };

  const nextTransition = STATUS_FLOW.find((f) => f.from === status);
  const cannotOpenResult = nextTransition?.to === 'RESULT_OPEN' && !actualResult;

  async function handleSeed() {
    setSeeding(true);
    try { await seedSampleData(matchId); } finally { setSeeding(false); }
  }

  async function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    setResetting(true);
    try { await resetAllData(matchId); } finally { setResetting(false); setConfirmReset(false); }
  }

  async function handleStatusChange() {
    if (!nextTransition || cannotOpenResult) return;
    if (nextTransition.danger && confirmNext !== nextTransition.to) {
      setConfirmNext(nextTransition.to);
      return;
    }
    await setGameStatus(matchId, nextTransition.to);
    setConfirmNext(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold text-xl">운영자 대시보드</h1>
        <p className="text-xs text-muted-foreground">2026 월드컵 예측 게임</p>
      </div>

      {/* 현재 게임 상태 */}
      <Card className={`border-2 ${STATUS_COLOR[status]}`}>
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-2 opacity-70">현재 게임 상태</p>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${STATUS_DOT[status]}`} />
            <span className="text-lg font-bold">{GAME_STATUS_LABELS[status]}</span>
          </div>
        </CardContent>
      </Card>

      {/* 상태 전환 버튼 */}
      {nextTransition && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">다음 단계</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {confirmNext === nextTransition.to ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p><strong>결과를 공개하면 되돌릴 수 없어요.</strong> 순위가 모든 참여자에게 공개됩니다. 계속하시겠어요?</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmNext(null)}>취소</Button>
                  <Button variant="destructive" className="flex-1" onClick={handleStatusChange}>네, 공개합니다</Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full"
                variant={nextTransition.danger ? 'destructive' : 'korea'}
                onClick={handleStatusChange}
                disabled={cannotOpenResult}
              >
                {nextTransition.label}
              </Button>
            )}
            {cannotOpenResult && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-300 bg-orange-50 p-3 text-xs text-orange-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>최종 결과를 먼저 저장해야 순위를 공개할 수 있어요. 아래 <strong>최종 결과 입력</strong>에서 경기 결과를 저장해 주세요.</p>
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground">
              {GAME_STATUS_LABELS[status]} → {GAME_STATUS_LABELS[nextTransition.to]}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 참여 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> 참여 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[
            { label: '전체 참여자', value: stats.total },
            { label: '1차 예측 완료', value: stats.submitted },
            { label: '하프타임 수정', value: stats.halftimeRevised },
            { label: 'MVP 최종 제출', value: stats.mvpSubmitted },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 결과 입력 링크 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> 결과 입력
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            href="/admin/live"
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100"
          >
            <div>
              <p className="font-medium text-sm text-red-700">🔴 라이브 이벤트 입력</p>
              <p className="text-xs text-muted-foreground">경기 중 골·카드 실시간 입력</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link
            href="/admin/halftime-input"
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              status === 'FIRST_HALF' || status === 'HALF_TIME'
                ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                : 'hover:bg-muted/50'
            }`}
          >
            <div>
              <p className="font-medium text-sm">전반 결과 입력</p>
              <p className="text-xs text-muted-foreground">전반 종료 후 결과 입력 → 하프타임 오픈</p>
            </div>
            <div className="flex items-center gap-2">
              {(status === 'FIRST_HALF') && <Badge variant="active">지금 입력</Badge>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link
            href="/admin/final-input"
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              status === 'SECOND_HALF' || status === 'AFTER_MATCH'
                ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                : 'hover:bg-muted/50'
            }`}
          >
            <div>
              <p className="font-medium text-sm">최종 결과 입력</p>
              <p className="text-xs text-muted-foreground">경기 종료 후 최종 결과 입력 → 점수 자동 계산</p>
            </div>
            <div className="flex items-center gap-2">
              {status === 'AFTER_MATCH' && <Badge variant="active">지금 입력</Badge>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* 데이터 관리 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DatabaseZap className="h-4 w-4" /> 데이터 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSeed}
            disabled={seeding || resetting}
          >
            {seeding ? '샘플 데이터 추가 중...' : '샘플 데이터 세팅'}
          </Button>

          {confirmReset ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p><strong>모든 예측 데이터가 삭제됩니다.</strong> 되돌릴 수 없어요. 계속하시겠어요?</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmReset(false)}>취소</Button>
                <Button variant="destructive" className="flex-1" onClick={handleReset} disabled={resetting}>
                  {resetting ? '초기화 중...' : '네, 초기화합니다'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleReset}
              disabled={seeding || resetting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              전체 데이터 초기화
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 순위 미리보기 링크 */}
      <Link
        href="/result"
        className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="font-medium text-sm">순위 미리보기</p>
            <p className="text-xs text-muted-foreground">참여자 순위 화면으로 이동</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
