import assert from 'node:assert/strict';
import { getEspnLiveMatchData } from '../lib/api/espn';

const originalFetch = globalThis.fetch;
const originalFixtureId = process.env.ESPN_FIXTURE_ID_M2;

async function run() {
  process.env.ESPN_FIXTURE_ID_M2 = '760415';
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      header: {
        competitions: [{
          status: { type: { description: 'Full Time' }, period: 2 },
          competitors: [
            { homeAway: 'home', team: { id: '203', displayName: 'Mexico' }, score: '2' },
            { homeAway: 'away', team: { id: '467', displayName: 'South Africa' }, score: '0' },
          ],
        }],
      },
      keyEvents: [
        { type: { text: 'Goal' }, clock: { displayValue: "9'" }, team: { id: '203', displayName: 'Mexico' }, text: 'Goal! Mexico 1, South Africa 0.', participants: [{ athlete: { displayName: 'Julián Quiñones' } }, { athlete: { displayName: 'Érik Lira' } }] },
        { type: { text: 'Halftime' }, clock: { displayValue: "45'+4'" }, text: 'First Half ends, Mexico 1, South Africa 0.' },
        { type: { text: 'Goal - Header' }, clock: { displayValue: "67'" }, team: { id: '203', displayName: 'Mexico' }, text: 'Goal! Mexico 2, South Africa 0.', participants: [{ athlete: { displayName: 'Raúl Jiménez' } }, { athlete: { displayName: 'Roberto Alvarado' } }] },
        { type: { text: 'Red Card' }, clock: { displayValue: "84'" }, team: { id: '467', displayName: 'South Africa' }, participants: [{ athlete: { displayName: 'Themba Zwane' } }] },
      ],
      rosters: [
        { team: { displayName: 'Mexico' }, roster: [{ starter: true, athlete: { displayName: 'A' }, jersey: '1', position: { abbreviation: 'GK' } }] },
      ],
    }),
  }) as Response;

  const data = await getEspnLiveMatchData('2', { includeLineups: true });
  assert.equal(data.available, true);
  assert.equal(data.fixtureId, 760415);
  assert.equal(data.homeTeam, 'Mexico');
  assert.equal(data.awayTeam, 'South Africa');
  assert.equal(data.homeScore, 2);
  assert.equal(data.awayScore, 0);
  assert.equal(data.homeHalfScore, 1);
  assert.equal(data.awayHalfScore, 0);
  assert.deepEqual(data.goals.map((g) => [g.time, g.scorer, g.assist, g.side]), [
    [9, 'Julián Quiñones', 'Érik Lira', 'home'],
    [67, 'Raúl Jiménez', 'Roberto Alvarado', 'home'],
  ]);
  assert.deepEqual(data.cards.map((c) => [c.time, c.player, c.cardType, c.side]), [
    [84, 'Themba Zwane', 'red', 'away'],
  ]);
  assert.equal(data.lineups[0].starters.length, 1);
}

run().finally(() => {
  globalThis.fetch = originalFetch;
  if (originalFixtureId == null) delete process.env.ESPN_FIXTURE_ID_M2;
  else process.env.ESPN_FIXTURE_ID_M2 = originalFixtureId;
}).then(() => {
  console.log('espn tests passed');
});
