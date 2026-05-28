import { NextResponse } from 'next/server';
import { getMatchState } from '@/lib/store/matchStore';
import type { LiveMatchResponse } from '@/types/match';

// 캐시 없음 — 관리자 입력이 즉시 반영돼야 하므로
export const dynamic = 'force-dynamic';

export async function GET() {
  const state = getMatchState();

  const response: LiveMatchResponse = {
    available: true,
    fixtureId: null,
    status: {
      long: STATUS_LONG[state.status] ?? state.status,
      short: state.status,
      elapsed: null,
    },
    homeTeam: '멕시코',
    awayTeam: '대한민국',
    // 홈=멕시코, 어웨이=한국 (경기장: 과달라하라)
    homeScore: state.mexicoScore,
    awayScore: state.koreaScore,
    homeHalfScore: state.mexicoHalfScore,
    awayHalfScore: state.koreaHalfScore,
    goals: state.goals,
    cards: state.cards,
    lineups: [],
    lastUpdated: state.updatedAt,
  };

  return NextResponse.json(response);
}

const STATUS_LONG: Record<string, string> = {
  NS: '경기 전',
  '1H': '전반 진행 중',
  HT: '하프 타임',
  '2H': '후반 진행 중',
  ET: '연장전',
  P: '승부차기',
  FT: '경기 종료',
};
