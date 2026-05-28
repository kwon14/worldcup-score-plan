import type { LiveMatchResponse, GoalEvent, CardEvent, TeamLineup } from '@/types/match';

const BASE_URL = 'https://v3.football.api-sports.io';
// 2026 월드컵: league=1, season=2026
// Korea Republic = 149, Mexico = 164 (API-Football 팀 ID)
const WC_LEAGUE = 1;
const WC_SEASON = 2026;
const KOREA_TEAM_ID = 149;
const MEXICO_TEAM_ID = 164;

function apiHeaders(): HeadersInit {
  return {
    'x-apisports-key': process.env.FOOTBALL_API_KEY ?? '',
    'Accept': 'application/json',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiFetch(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: apiHeaders(),
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ── 한국 vs 멕시코 fixture ID 탐색 ───────────────────────────────────────────
let cachedFixtureId: number | null = null;

export async function findKoreaMexicoFixtureId(): Promise<number | null> {
  if (cachedFixtureId !== null) return cachedFixtureId;

  const data = await apiFetch(
    `/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&team=${KOREA_TEAM_ID}`
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fixtures: any[] = data?.response ?? [];
  const match = fixtures.find((f: any) => {
    const homeId: number = f.teams?.home?.id;
    const awayId: number = f.teams?.away?.id;
    return (
      (homeId === KOREA_TEAM_ID && awayId === MEXICO_TEAM_ID) ||
      (homeId === MEXICO_TEAM_ID && awayId === KOREA_TEAM_ID)
    );
  });

  cachedFixtureId = match?.fixture?.id ?? null;
  return cachedFixtureId;
}

// ── 라인업 파싱 ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLineups(raw: any[]): TeamLineup[] {
  return raw.map((l: any): TeamLineup => ({
    teamName: l.team?.name ?? '',
    formation: l.formation ?? '',
    starters: (l.startXI ?? []).map((e: any) => ({
      name: e.player?.name ?? '',
      number: e.player?.number ?? 0,
      position: e.player?.pos ?? '',
    })),
    bench: (l.substitutes ?? []).map((e: any) => ({
      name: e.player?.name ?? '',
      number: e.player?.number ?? 0,
      position: e.player?.pos ?? '',
    })),
  }));
}

// ── 이벤트 파싱 ───────────────────────────────────────────────────────────────
function parseEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any[],
  homeId: number
): { goals: GoalEvent[]; cards: CardEvent[] } {
  const goals: GoalEvent[] = [];
  const cards: CardEvent[] = [];

  for (const ev of raw) {
    const side: 'home' | 'away' = ev.team?.id === homeId ? 'home' : 'away';
    const time: number = ev.time?.elapsed ?? 0;
    const extra: number | null = ev.time?.extra ?? null;
    const teamName: string = ev.team?.name ?? '';
    const player: string = ev.player?.name ?? '';

    if (ev.type === 'Goal') {
      const detail: string = ev.detail ?? '';
      goals.push({
        time,
        extraTime: extra,
        side,
        teamName,
        scorer: player,
        assist: ev.assist?.name ?? null,
        type: detail.includes('Penalty') ? 'penalty'
          : detail.includes('Own') ? 'own_goal'
          : 'normal',
      });
    } else if (ev.type === 'Card') {
      const detail: string = ev.detail ?? '';
      cards.push({
        time,
        side,
        teamName,
        player,
        cardType: detail.includes('Red') && detail.includes('Yellow') ? 'yellow_red'
          : detail.includes('Red') ? 'red'
          : 'yellow',
      });
    }
  }

  return { goals, cards };
}

// ── 메인 함수 ─────────────────────────────────────────────────────────────────
export async function getLiveMatchData(): Promise<LiveMatchResponse> {
  if (!process.env.FOOTBALL_API_KEY) {
    return {
      available: false,
      fixtureId: null,
      status: null,
      homeTeam: '멕시코',
      awayTeam: '대한민국',
      homeScore: null,
      awayScore: null,
      homeHalfScore: null,
      awayHalfScore: null,
      goals: [],
      cards: [],
      lineups: [],
      lastUpdated: new Date().toISOString(),
      error: 'API_KEY_NOT_SET',
    };
  }

  const fixtureId = await findKoreaMexicoFixtureId();
  if (!fixtureId) {
    return {
      available: false,
      fixtureId: null,
      status: null,
      homeTeam: '멕시코',
      awayTeam: '대한민국',
      homeScore: null,
      awayScore: null,
      homeHalfScore: null,
      awayHalfScore: null,
      goals: [],
      cards: [],
      lineups: [],
      lastUpdated: new Date().toISOString(),
      error: 'FIXTURE_NOT_FOUND',
    };
  }

  const [fixtureData, eventData, lineupData] = await Promise.all([
    apiFetch(`/fixtures?id=${fixtureId}`),
    apiFetch(`/fixtures/events?fixture=${fixtureId}`),
    apiFetch(`/fixtures/lineups?fixture=${fixtureId}`),
  ]);

  const fixture = fixtureData?.response?.[0];
  if (!fixture) {
    return {
      available: false,
      fixtureId,
      status: null,
      homeTeam: '멕시코',
      awayTeam: '대한민국',
      homeScore: null,
      awayScore: null,
      homeHalfScore: null,
      awayHalfScore: null,
      goals: [],
      cards: [],
      lineups: [],
      lastUpdated: new Date().toISOString(),
      error: 'FIXTURE_DATA_EMPTY',
    };
  }

  const homeId: number = fixture.teams?.home?.id;
  const homeName: string = fixture.teams?.home?.name ?? '';
  const awayName: string = fixture.teams?.away?.name ?? '';
  const { goals, cards } = parseEvents(eventData?.response ?? [], homeId);

  return {
    available: true,
    fixtureId,
    status: {
      long: fixture.fixture?.status?.long ?? '',
      short: fixture.fixture?.status?.short ?? 'NS',
      elapsed: fixture.fixture?.status?.elapsed ?? null,
    },
    homeTeam: homeName,
    awayTeam: awayName,
    homeScore: fixture.score?.fulltime?.home ?? fixture.goals?.home ?? null,
    awayScore: fixture.score?.fulltime?.away ?? fixture.goals?.away ?? null,
    homeHalfScore: fixture.score?.halftime?.home ?? null,
    awayHalfScore: fixture.score?.halftime?.away ?? null,
    goals,
    cards,
    lineups: parseLineups(lineupData?.response ?? []),
    lastUpdated: new Date().toISOString(),
  };
}
