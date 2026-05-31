import assert from 'node:assert/strict';
import { __clearFootballApiCaches, getLiveMatchData } from '../lib/api/football';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.FOOTBALL_API_KEY;
const originalFixtureId = process.env.FOOTBALL_FIXTURE_ID_M2;
const originalLiveCacheSeconds = process.env.FOOTBALL_LIVE_CACHE_SECONDS;
const originalLineupCacheSeconds = process.env.FOOTBALL_LINEUP_CACHE_SECONDS;
const originalDateNow = Date.now;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

async function run() {
  __clearFootballApiCaches();
  process.env.FOOTBALL_API_KEY = 'test-key';
  process.env.FOOTBALL_FIXTURE_ID_M2 = '12345';
  process.env.FOOTBALL_LIVE_CACHE_SECONDS = '30';
  process.env.FOOTBALL_LINEUP_CACHE_SECONDS = '600';
  let now = 1_700_000_000_000;
  Date.now = () => now;

  const requestedPaths: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const path = new URL(url).pathname + new URL(url).search;
    requestedPaths.push(path);

    if (path === '/fixtures?id=12345') {
      return jsonResponse({
        response: [{
          fixture: { id: 12345, status: { long: 'Second Half', short: '2H', elapsed: 63 } },
          teams: {
            home: { id: 164, name: 'Mexico' },
            away: { id: 149, name: 'Korea Republic' },
          },
          goals: { home: 1, away: 2 },
          score: { halftime: { home: 1, away: 1 }, fulltime: { home: null, away: null } },
        }],
      });
    }

    if (path === '/fixtures/events?fixture=12345') {
      return jsonResponse({
        response: [{
          time: { elapsed: 11, extra: null },
          team: { id: 149, name: 'Korea Republic' },
          player: { name: 'Son Heung-min' },
          assist: { name: 'Lee Kang-in' },
          type: 'Goal',
          detail: 'Normal Goal',
        }],
      });
    }

    if (path === '/fixtures/lineups?fixture=12345') {
      return jsonResponse({ response: [] });
    }

    throw new Error(`unexpected API path: ${path}`);
  }) as typeof fetch;

  try {
    const live = await getLiveMatchData('2');

    assert.equal(live.available, true);
    assert.equal(live.fixtureId, 12345);
    assert.equal(live.status?.short, '2H');
    assert.equal(live.homeTeam, 'Mexico');
    assert.equal(live.awayTeam, 'Korea Republic');
    assert.equal(live.homeScore, 1);
    assert.equal(live.awayScore, 2);
    assert.equal(live.goals[0]?.side, 'away');
    assert.equal(live.goals[0]?.scorer, 'Son Heung-min');
    assert.deepEqual(
      requestedPaths,
      ['/fixtures?id=12345', '/fixtures/events?fixture=12345', '/fixtures/lineups?fixture=12345'],
      'matchId별 fixture override가 있으면 fixture 검색 없이 해당 경기만 조회해야 합니다',
    );

    await getLiveMatchData('2');
    assert.deepEqual(
      requestedPaths,
      ['/fixtures?id=12345', '/fixtures/events?fixture=12345', '/fixtures/lineups?fixture=12345'],
      'live cache TTL 안에서는 여러 사용자가 polling해도 공식 API를 다시 호출하지 않아야 합니다',
    );

    now += 31_000;
    await getLiveMatchData('2');
    assert.deepEqual(
      requestedPaths,
      [
        '/fixtures?id=12345',
        '/fixtures/events?fixture=12345',
        '/fixtures/lineups?fixture=12345',
        '/fixtures?id=12345',
        '/fixtures/events?fixture=12345',
      ],
      'live cache TTL이 지나면 스코어/이벤트만 재조회하고 라인업은 긴 TTL 캐시를 재사용해야 합니다',
    );

    const quota = await import('../lib/api/football');
    quota.__setFootballApiDailyUsageForTests(90);
    now += 31_000;
    const blocked = await getLiveMatchData('2', { includeEvents: true, includeLineups: false });
    assert.equal(blocked.available, false);
    assert.equal(blocked.error, 'FOOTBALL_API_DAILY_RESERVED_REACHED');
    assert.equal(requestedPaths.length, 5, '일일 사용량 90회부터는 일반 경기정보/라인업 조회가 공식 API를 추가 호출하면 안 됩니다');

    const reserved = await getLiveMatchData('2', { includeEvents: true, includeLineups: false, useReservedQuota: true });
    assert.equal(reserved.available, true, '최종 경기 종료 정산용 조회는 예약 10회 구간에서 허용해야 합니다');
    assert.equal(requestedPaths.length, 7, '예약 구간 조회는 실제 공식 API 호출을 수행해야 합니다');
    } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalDateNow;
    process.env.FOOTBALL_API_KEY = originalApiKey;
    process.env.FOOTBALL_FIXTURE_ID_M2 = originalFixtureId;
    process.env.FOOTBALL_LIVE_CACHE_SECONDS = originalLiveCacheSeconds;
    process.env.FOOTBALL_LINEUP_CACHE_SECONDS = originalLineupCacheSeconds;
    __clearFootballApiCaches();
  }
}

run().then(() => console.log('live match tests passed'));
