import type { LiveMatchResponse, GoalEvent, CardEvent, TeamLineup } from '@/types/match';

const BASE_URL = 'https://v3.football.api-sports.io';
// 2026 월드컵: league=1, season=2026
// Korea Republic = 149, Mexico = 164 (API-Football 팀 ID)
const WC_LEAGUE = 1;
const WC_SEASON = 2026;
const KOREA_TEAM_ID = 149;
const AWAY_TEAM_IDS: Record<string, number> = {
  '1': 56,   // Czech Republic
  '2': 164,  // Mexico
};

const FALLBACK_TEAMS: Record<string, { homeTeam: string; awayTeam: string }> = {
  '1': { homeTeam: '대한민국', awayTeam: '체코' },
  '2': { homeTeam: '멕시코', awayTeam: '대한민국' },
};

function apiHeaders(): HeadersInit {
  return {
    'x-apisports-key': process.env.FOOTBALL_API_KEY ?? '',
    'Accept': 'application/json',
  };
}

function ttlSecondsFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function liveCacheTtlSeconds(): number {
  return ttlSecondsFromEnv('FOOTBALL_LIVE_CACHE_SECONDS', 300);
}

function lineupCacheTtlSeconds(): number {
  return ttlSecondsFromEnv('FOOTBALL_LINEUP_CACHE_SECONDS', 1800);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiCacheEntry = { expiresAt: number; value: any };

type FootballApiQuota = { date: string; count: number };

const apiResponseCache = new Map<string, ApiCacheEntry>();
let dailyQuota: FootballApiQuota = { date: currentQuotaDate(), count: 0 };

function currentQuotaDate() {
  return new Date(Date.now()).toISOString().slice(0, 10);
}

function footballDailyApiLimit(): number {
  return ttlSecondsFromEnv('FOOTBALL_DAILY_API_LIMIT', 100);
}

function footballReservedApiCount(): number {
  return ttlSecondsFromEnv('FOOTBALL_DAILY_API_RESERVE', 10);
}

function resetQuotaIfNeeded() {
  const today = currentQuotaDate();
  if (dailyQuota.date !== today) dailyQuota = { date: today, count: 0 };
}

function consumeFootballApiQuota(allowReservedQuota: boolean) {
  resetQuotaIfNeeded();
  const hardLimit = footballDailyApiLimit();
  const normalLimit = Math.max(0, hardLimit - footballReservedApiCount());

  if (dailyQuota.count >= hardLimit) {
    throw new Error('FOOTBALL_API_DAILY_LIMIT_REACHED');
  }
  if (!allowReservedQuota && dailyQuota.count >= normalLimit) {
    throw new Error('FOOTBALL_API_DAILY_RESERVED_REACHED');
  }
  dailyQuota.count += 1;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiFetch(path: string, revalidateSeconds = 30, allowReservedQuota = false): Promise<any> {
  consumeFootballApiQuota(allowReservedQuota);
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: apiHeaders(),
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cachedApiFetch(path: string, ttlSeconds: number, allowReservedQuota = false): Promise<any> {
  const now = Date.now();
  const cached = apiResponseCache.get(path);
  if (cached && cached.expiresAt > now) return cached.value;

  const value = await apiFetch(path, ttlSeconds, allowReservedQuota);
  if (ttlSeconds > 0) {
    apiResponseCache.set(path, { expiresAt: now + ttlSeconds * 1000, value });
  } else {
    apiResponseCache.delete(path);
  }
  return value;
}

// 테스트와 개발 서버 hot reload에서 공식 API 캐시 상태를 명시적으로 초기화할 수 있게 둔다.
export function __clearFootballApiCaches() {
  apiResponseCache.clear();
  cachedFixtureIds.clear();
  dailyQuota = { date: currentQuotaDate(), count: 0 };
}

export function __setFootballApiDailyUsageForTests(count: number) {
  dailyQuota = { date: currentQuotaDate(), count };
}

export function getFootballApiDailyUsage() {
  resetQuotaIfNeeded();
  return {
    date: dailyQuota.date,
    count: dailyQuota.count,
    normalLimit: Math.max(0, footballDailyApiLimit() - footballReservedApiCount()),
    hardLimit: footballDailyApiLimit(),
    reserved: footballReservedApiCount(),
  };
}

// ── 한국 vs 멕시코 fixture ID 탐색 ───────────────────────────────────────────
const cachedFixtureIds = new Map<string, number | null>();

function fallbackTeams(matchId: string) {
  return FALLBACK_TEAMS[matchId] ?? FALLBACK_TEAMS['2'];
}

function fixtureIdFromEnv(matchId: string): number | null {
  const raw = process.env[`FOOTBALL_FIXTURE_ID_M${matchId}`] ?? process.env.FOOTBALL_FIXTURE_ID;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function findFixtureId(matchId = '2', allowReservedQuota = false): Promise<number | null> {
  const envFixtureId = fixtureIdFromEnv(matchId);
  if (envFixtureId !== null) return envFixtureId;

  if (cachedFixtureIds.has(matchId)) return cachedFixtureIds.get(matchId) ?? null;

  const awayTeamId = AWAY_TEAM_IDS[matchId];
  if (!awayTeamId) {
    cachedFixtureIds.set(matchId, null);
    return null;
  }

  const data = await apiFetch(
    `/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&team=${KOREA_TEAM_ID}`,
    30,
    allowReservedQuota
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fixtures: any[] = data?.response ?? [];
  const match = fixtures.find((f: any) => {
    const homeId: number = f.teams?.home?.id;
    const awayId: number = f.teams?.away?.id;
    return (
      (homeId === KOREA_TEAM_ID && awayId === awayTeamId) ||
      (homeId === awayTeamId && awayId === KOREA_TEAM_ID)
    );
  });

  const fixtureId = match?.fixture?.id ?? null;
  cachedFixtureIds.set(matchId, fixtureId);
  return fixtureId;
}

export const findKoreaMexicoFixtureId = () => findFixtureId('2');

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

export interface LiveMatchDataOptions {
  includeEvents?: boolean;
  includeLineups?: boolean;
  useReservedQuota?: boolean;
}

// ── 메인 함수 ─────────────────────────────────────────────────────────────────
export async function getLiveMatchData(
  matchId = '2',
  options: LiveMatchDataOptions = {}
): Promise<LiveMatchResponse> {
  const { includeEvents = true, includeLineups = true, useReservedQuota = false } = options;
  const fallback = fallbackTeams(matchId);

  if (!process.env.FOOTBALL_API_KEY) {
    return {
      available: false,
      fixtureId: null,
      status: null,
      homeTeam: fallback.homeTeam,
      awayTeam: fallback.awayTeam,
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

  try {
    const fixtureId = await findFixtureId(matchId, useReservedQuota);
    if (!fixtureId) {
      return {
        available: false,
        fixtureId: null,
        status: null,
        homeTeam: fallback.homeTeam,
        awayTeam: fallback.awayTeam,
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

    const liveTtl = liveCacheTtlSeconds();
  const [fixtureData, eventData, lineupData] = await Promise.all([
    cachedApiFetch(`/fixtures?id=${fixtureId}`, liveTtl, useReservedQuota),
    includeEvents ? cachedApiFetch(`/fixtures/events?fixture=${fixtureId}`, liveTtl, useReservedQuota) : Promise.resolve({ response: [] }),
    includeLineups ? cachedApiFetch(`/fixtures/lineups?fixture=${fixtureId}`, lineupCacheTtlSeconds(), useReservedQuota) : Promise.resolve({ response: [] }),
  ]);

  const fixture = fixtureData?.response?.[0];
  if (!fixture) {
    return {
      available: false,
      fixtureId,
      status: null,
      homeTeam: fallback.homeTeam,
      awayTeam: fallback.awayTeam,
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
  } catch (error) {
    return {
      available: false,
      fixtureId: null,
      status: null,
      homeTeam: fallback.homeTeam,
      awayTeam: fallback.awayTeam,
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
  }
}
