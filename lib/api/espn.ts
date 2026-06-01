import type { LiveMatchResponse, GoalEvent, CardEvent, TeamLineup, MatchStatusShort } from '@/types/match';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/FIFA.WORLD';

// 2026 월드컵 한국 경기 ESPN fixture ID
const ESPN_FIXTURE_IDS: Record<string, number> = {
  '1': 760414, // 한국 vs 체코  (2026-06-12 KST)
  '2': 760441, // 한국 vs 멕시코 (2026-06-19 KST)
};

const FALLBACK_TEAMS: Record<string, { homeTeam: string; awayTeam: string }> = {
  '1': { homeTeam: '대한민국', awayTeam: '체코' },
  '2': { homeTeam: '대한민국', awayTeam: '멕시코' },
};

function getFixtureId(matchId: string): number | null {
  const envVal = process.env[`ESPN_FIXTURE_ID_M${matchId}`];
  if (envVal) {
    const id = Number(envVal);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return ESPN_FIXTURE_IDS[matchId] ?? null;
}

function mapStatus(description: string, period: number): MatchStatusShort {
  const d = description.toLowerCase();
  if (d.includes('scheduled') || d.includes('pre game')) return 'NS';
  if (d.includes('halftime') || d.includes('half time')) return 'HT';
  if (d.includes('in progress') || d.includes('live')) return period <= 1 ? '1H' : '2H';
  if (d.includes('full time') || d.includes('final')) return 'FT';
  if (d.includes('extra time') || d.includes('overtime')) return 'ET';
  if (d.includes('penalty')) return 'P';
  return 'NS';
}

function parseMinute(display: string): { time: number; extraTime: number | null } {
  const main = display.match(/^(\d+)/);
  const extra = display.match(/\+(\d+)/);
  return {
    time: main ? parseInt(main[1], 10) : 0,
    extraTime: extra ? parseInt(extra[1], 10) : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseKeyEvents(keyEvents: any[], homeTeamId: string): {
  goals: GoalEvent[];
  cards: CardEvent[];
  homeHalfScore: number | null;
  awayHalfScore: number | null;
} {
  const goals: GoalEvent[] = [];
  const cards: CardEvent[] = [];

  // 전반 종료 인덱스 찾기
  const halftimeIdx = keyEvents.findIndex(
    (ev) => ev.type?.text === 'Halftime' || ev.type?.text === 'Start 2nd Half'
  );

  let homeHalfGoals = 0;
  let awayHalfGoals = 0;

  keyEvents.forEach((ev, idx) => {
    const typeText: string = ev.type?.text ?? '';
    const teamId: string = String(ev.team?.id ?? '');
    const teamName: string = ev.team?.displayName ?? '';
    const side: 'home' | 'away' = teamId === homeTeamId ? 'home' : 'away';
    const { time, extraTime } = parseMinute(ev.clock?.displayValue ?? '0\'');
    const participants = ev.participants ?? [];

    if (typeText === 'Goal' && !ev.shootout) {
      const text: string = (ev.text ?? '').toLowerCase();
      const scorer: string = participants[0]?.athlete?.displayName ?? '';
      const assist: string | null = participants[1]?.athlete?.displayName ?? null;
      const type: GoalEvent['type'] =
        text.includes('penalty') ? 'penalty' :
        text.includes('own goal') ? 'own_goal' :
        'normal';

      goals.push({ time, extraTime, side, teamName, scorer, assist, type });

      if (halftimeIdx >= 0 && idx < halftimeIdx) {
        if (side === 'home') homeHalfGoals++;
        else awayHalfGoals++;
      }
    } else if (typeText.includes('Card')) {
      const player: string = participants[0]?.athlete?.displayName ?? '';
      const cardType =
        typeText.includes('Yellow-Red') || typeText.includes('Second Yellow') ? 'yellow_red' :
        typeText.includes('Red') ? 'red' :
        'yellow';

      cards.push({ time, side, teamName, player, cardType });
    }
  });

  return {
    goals,
    cards,
    homeHalfScore: halftimeIdx >= 0 ? homeHalfGoals : null,
    awayHalfScore: halftimeIdx >= 0 ? awayHalfGoals : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLineups(rosters: any[]): TeamLineup[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rosters.map((r: any): TeamLineup => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const athletes: any[] = r.roster ?? r.athletes ?? [];
    return {
      teamName: r.team?.displayName ?? '',
      formation: r.formation ?? '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      starters: athletes.filter((a: any) => a.starter).map((a: any) => ({
        name: a.athlete?.displayName ?? '',
        number: Number(a.jersey) || 0,
        position: a.position?.abbreviation ?? '',
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bench: athletes.filter((a: any) => !a.starter).map((a: any) => ({
        name: a.athlete?.displayName ?? '',
        number: Number(a.jersey) || 0,
        position: a.position?.abbreviation ?? '',
      })),
    };
  });
}

export async function getEspnLiveMatchData(
  matchId = '2',
  options: { includeLineups?: boolean } = {}
): Promise<LiveMatchResponse> {
  const fallback = FALLBACK_TEAMS[matchId] ?? FALLBACK_TEAMS['2'];
  const fixtureId = getFixtureId(matchId);

  if (!fixtureId) {
    return {
      available: false, fixtureId: null, status: null,
      homeTeam: fallback.homeTeam, awayTeam: fallback.awayTeam,
      homeScore: null, awayScore: null, homeHalfScore: null, awayHalfScore: null,
      goals: [], cards: [], lineups: [],
      lastUpdated: new Date().toISOString(),
      error: 'ESPN_FIXTURE_NOT_CONFIGURED',
    };
  }

  try {
    const res = await fetch(`${ESPN_BASE}/summary?event=${fixtureId}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`ESPN HTTP ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    // 헤더에서 팀·스코어·상태 파싱
    const comp = data.header?.competitions?.[0] ?? {};
    const statusDesc: string = comp.status?.type?.description ?? 'Scheduled';
    const period: number = comp.status?.period ?? 1;
    const statusShort = mapStatus(statusDesc, period);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const competitors: any[] = comp.competitors ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeComp = competitors.find((c: any) => c.homeAway === 'home') ?? competitors[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayComp = competitors.find((c: any) => c.homeAway === 'away') ?? competitors[1];

    const homeTeamName: string = homeComp?.team?.displayName ?? fallback.homeTeam;
    const awayTeamName: string = awayComp?.team?.displayName ?? fallback.awayTeam;
    const homeTeamId: string = String(homeComp?.team?.id ?? '');
    const homeScore = homeComp?.score != null ? Number(homeComp.score) : null;
    const awayScore = awayComp?.score != null ? Number(awayComp.score) : null;

    // 골·카드·전반 스코어
    const keyEvents: unknown[] = data.keyEvents ?? [];
    const { goals, cards, homeHalfScore, awayHalfScore } = parseKeyEvents(keyEvents as never[], homeTeamId);

    // 라인업
    const lineups = options.includeLineups ? parseLineups(data.rosters ?? []) : [];

    return {
      available: true,
      fixtureId,
      status: { long: statusDesc, short: statusShort, elapsed: null },
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeScore,
      awayScore,
      homeHalfScore,
      awayHalfScore,
      goals,
      cards,
      lineups,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    return {
      available: false, fixtureId, status: null,
      homeTeam: fallback.homeTeam, awayTeam: fallback.awayTeam,
      homeScore: null, awayScore: null, homeHalfScore: null, awayHalfScore: null,
      goals: [], cards: [], lineups: [],
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'ESPN_API_ERROR',
    };
  }
}
