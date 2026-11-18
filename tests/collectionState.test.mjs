import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

function store(storage = new Map()) {
  const context = vm.createContext({ sessionStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } });
  const source = readFileSync(new URL('../src/services/collectionStateStore.ts', import.meta.url), 'utf8').replace(/export /g, '');
  vm.runInContext(stripTypeScriptTypes(source) + '\nglobalThis.api = { readCollectionState, updateCollectionState, subscribeCollectionState };', context);
  return context.api;
}

test('an ongoing request updates the new subscriber after leaving and returning to the page', async () => {
  const state = store();
  state.readCollectionState('session:hunter.loading', false, false);
  state.updateCollectionState('session:hunter.loading', false, true, false);
  const leave = state.subscribeCollectionState('session:hunter.loading', () => {});
  leave();
  assert.equal(state.readCollectionState('session:hunter.loading', false, false), true);
  let notifications = 0;
  const stop = state.subscribeCollectionState('session:hunter.loading', () => notifications++);
  await Promise.resolve();
  state.updateCollectionState('session:hunter.loading', false, false, false);
  assert.equal(state.readCollectionState('session:hunter.loading', false, false), false);
  assert.equal(notifications, 1);
  stop();
});

test('results survive remounts, functional updates use current progress, and sessions are isolated', () => {
  const state = store();
  state.updateCollectionState('account-a:logs', [], ['start']);
  state.updateCollectionState('account-a:logs', [], current => [...current, 'complete']);
  assert.equal(JSON.stringify(state.readCollectionState('account-a:logs', [])), '["start","complete"]');
  assert.equal(JSON.stringify(state.readCollectionState('account-b:logs', [])), '[]');
});

test('a full reload restores results but never restores a stale running flag', () => {
  const storage = new Map();
  const beforeReload = store(storage);
  beforeReload.updateCollectionState('results', [], ['creator']);
  beforeReload.updateCollectionState('loading', false, true, false);
  const afterReload = store(storage);
  assert.equal(JSON.stringify(afterReload.readCollectionState('results', [])), '["creator"]');
  assert.equal(afterReload.readCollectionState('loading', false, false), false);
});
