import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const source = stripTypeScriptTypes(await readFile(new URL('../src/services/requestCache.ts', import.meta.url), 'utf8'));
const module = new vm.SourceTextModule(source, { context: vm.createContext({ structuredClone }) });
await module.link(() => { throw new Error('Unexpected dependency'); });
await module.evaluate();
const { createRequestCache, dataManagerRequestCache, invalidateDataManagerCacheForMutation } = module.namespace;

test('concurrent reads share a request and cached empty/zero data remain valid', async () => {
  const cache = createRequestCache();
  let calls = 0;
  const load = async () => { calls++; return { count: 0, items: [] }; };
  const [first, second] = await Promise.all([cache.get('a', load, Infinity), cache.get('a', load, Infinity)]);
  assert.equal(calls, 1);
  assert.equal(first.count, 0);
  first.items.push('local edit');
  assert.equal(second.items.length, 0);
  assert.equal(cache.peek('a').value.items.length, 0);
  await cache.get('a', load, Infinity);
  assert.equal(calls, 1);
});

test('expiry refreshes a resource and preserves independent 7/30-day entries', async () => {
  let now = 0, calls = 0;
  const cache = createRequestCache(() => now);
  await cache.get('trends:7', async () => { calls++; return 7; }, 60000);
  await cache.get('trends:30', async () => { calls++; return 30; }, 60000);
  now = 59999;
  assert.equal(cache.peek('trends:7').value, 7);
  assert.equal(cache.peek('trends:30').value, 30);
  now = 60000;
  assert.equal(cache.peek('trends:7'), undefined);
  await cache.get('trends:7', async () => { calls++; return 8; }, 60000);
  assert.equal(calls, 3);
});

test('failed requests are not cached and an explicit invalidation fetches fresh data', async () => {
  const cache = createRequestCache();
  const error = new Error('503');
  await assert.rejects(cache.get('a', async () => { throw error; }, Infinity), error);
  assert.equal(cache.peek('a'), undefined);
  assert.equal(await cache.get('a', async () => 1, Infinity), 1);
  cache.invalidate('a');
  assert.equal(await cache.get('a', async () => 2, Infinity), 2);
});

test('invalidation during an in-flight request prevents stale cache repopulation', async () => {
  const cache = createRequestCache();
  let resolve;
  const pending = cache.get('a', () => new Promise(done => { resolve = done; }), Infinity, ['taxonomy']);
  await Promise.resolve();
  cache.invalidateTags(['taxonomy']);
  await cache.get('a', async () => 'new', Infinity, ['taxonomy']);
  resolve('old');
  await assert.rejects(pending, /Dữ liệu đã thay đổi/);
  assert.equal(cache.peek('a').value, 'new');
});

test('successful domain mutations invalidate related groups, not configuration', async () => {
  dataManagerRequestCache.clear();
  for (const [key, tags] of [['niches', ['taxonomy']], ['summary', ['creator-data']], ['trends', ['crawler-data']], ['config', ['recommendation-config']]]) {
    await dataManagerRequestCache.get(key, async () => key, Infinity, tags);
  }
  invalidateDataManagerCacheForMutation('get', '/data/niches');
  assert(dataManagerRequestCache.peek('niches'));
  invalidateDataManagerCacheForMutation('patch', '/data/niches/123');
  assert.equal(dataManagerRequestCache.peek('niches'), undefined);
  assert.equal(dataManagerRequestCache.peek('summary'), undefined);
  assert(dataManagerRequestCache.peek('trends'));
  invalidateDataManagerCacheForMutation('post', '/api/v1/crawl/enqueue');
  assert.equal(dataManagerRequestCache.peek('trends'), undefined);
  assert(dataManagerRequestCache.peek('config'));
});
