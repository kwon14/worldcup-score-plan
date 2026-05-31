import { NextRequest, NextResponse } from 'next/server';
import { getLiveMatchData } from '@/lib/api/football';
import { getAdminAuth } from '@/lib/firebase/admin';
import type { LiveMatchResponse } from '@/types/match';

// 외부 경기 API 상태는 매 요청마다 확인해야 하므로 캐시하지 않는다.
export const dynamic = 'force-dynamic';

async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });

  const decoded = await getAdminAuth().verifyIdToken(token).catch(() => null);
  // Firestore Rules와 같은 정책: role=admin/operator 또는 legacy admin=true
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'operator' && decoded.admin !== true)) {
    return NextResponse.json({ error: '운영자 또는 관리자 권한이 필요합니다.' }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const matchId = req.nextUrl.searchParams.get('matchId') ?? '2';
  const mode = req.nextUrl.searchParams.get('mode') ?? 'summary';

  try {
    const response = await getLiveMatchData(matchId, {
      includeEvents: mode === 'summary' || mode === 'final' || mode === 'full',
      includeLineups: mode === 'lineups' || mode === 'full',
      useReservedQuota: mode === 'final',
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch live match data', error);

    const response: LiveMatchResponse = {
      available: false,
      fixtureId: null,
      status: null,
      homeTeam: matchId === '1' ? '대한민국' : '멕시코',
      awayTeam: matchId === '1' ? '체코' : '대한민국',
      homeScore: null,
      awayScore: null,
      homeHalfScore: null,
      awayHalfScore: null,
      goals: [],
      cards: [],
      lineups: [],
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'LIVE_API_ERROR',
    };

    return NextResponse.json(response, { status: 200 });
  }
}
