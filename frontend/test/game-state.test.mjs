import { test } from 'node:test';
import assert from 'node:assert/strict';
import reducer, { restored } from '../src/store/gameSlice.ts';

function snapshot(revision, changes = {}) {
  return {
    id: 'match-1', code: 'ABCDE', revision, phase: 'playing', lang: 'EN', mode: 'VOCAB', level: 'A1',
    players: [{ userId: 1, name: 'Host', score: 150, isHost: true }],
    question: { index: 1, total: 3, text: 'Test?', options: ['Yes', 'No'], durationMs: 15000, endsAt: 30000, serverNow: 20000 },
    myChoice: 0, answered: [1], correctIndex: null, ranking: [], ...changes,
  };
}

test('reconnect restores answer, score and the original server deadline', () => {
  const state = reducer(undefined, restored(snapshot(5)));
  assert.equal(state.phase, 'playing');
  assert.equal(state.myChoice, 0);
  assert.equal(state.players[0].score, 150);
  assert.equal(state.question.endsAt, 30000);
  assert.equal(state.correctIndex, null);
});

test('late snapshots cannot overwrite newer answers or reveal state', () => {
  const current = reducer(undefined, restored(snapshot(6, { phase: 'reveal', correctIndex: 0 })));
  const result = reducer(current, restored(snapshot(5, { myChoice: null, answered: [] })));
  assert.equal(result.phase, 'reveal');
  assert.equal(result.myChoice, 0);
  assert.equal(result.revision, 6);
});

test('a new room starts fresh even if the previous room had a higher revision', () => {
  const current = reducer(undefined, restored(snapshot(100)));
  const result = reducer(current, restored(snapshot(1, { id: 'match-2', code: 'FGHJK', phase: 'lobby', myChoice: null })));
  assert.equal(result.id, 'match-2');
  assert.equal(result.phase, 'lobby');
  assert.equal(result.myChoice, null);
});
