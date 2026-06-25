import assert from 'node:assert/strict';
import { toGameStatus, toMatchStatus } from '../lib/game/statusMapping';

assert.equal(toGameStatus('NS'), 'BEFORE_MATCH');
assert.equal(toGameStatus('1H'), 'FIRST_HALF');
assert.equal(toGameStatus('HT'), 'HALF_TIME');
assert.equal(toGameStatus('2H'), 'SECOND_HALF');
assert.equal(toGameStatus('FT'), 'AFTER_MATCH');

assert.equal(toMatchStatus('BEFORE_MATCH'), 'NS');
assert.equal(toMatchStatus('FIRST_HALF'), '1H');
assert.equal(toMatchStatus('HALF_TIME'), 'HT');
assert.equal(toMatchStatus('SECOND_HALF'), '2H');
assert.equal(toMatchStatus('AFTER_MATCH'), 'FT');
assert.equal(toMatchStatus('RESULT_OPEN'), undefined);

console.log('status mapping tests passed');
