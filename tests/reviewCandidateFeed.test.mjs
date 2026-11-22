import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

function load(file, names, globals = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm, '')
    .replaceAll('import.meta.env.VITE_CRAWLER_API_BASE_URL', 'undefined').replace(/export /g, '');
  const context = vm.createContext(globals);
  vm.runInContext(stripTypeScriptTypes(source) + `\nglobalThis.exports = {${names}}`, context);
  return context.exports;
}

test('comparison includes incomplete and retryable profiles while keeping final decisions separate', () => {
  const { collectionNeedsComparison } = load('src/services/collectionDecision.ts', 'collectionNeedsComparison');
  for (const decision of ['SKIP_INSUFFICIENT', 'RETRY_PREFLIGHT', 'NEEDS_MANAGER_REVIEW']) {
    assert.equal(collectionNeedsComparison({ status: 'success', decision }), true);
  }
  for (const decision of ['AUTO_REJECT', 'MANAGER_REJECTED', 'MANAGER_APPROVED', 'AUTO_ACCEPT_KOC']) {
    assert.equal(collectionNeedsComparison({ status: 'success', decision, primary_type: 'KOC' }), false);
  }
  assert.equal(collectionNeedsComparison({ status: 'success' }), true);
  assert.equal(collectionNeedsComparison({ status: 'error' }), false);
});

test('comparison fetches the complete filtered queue instead of the last 100 activities', async () => {
  const calls = [];
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    invalidateDataManagerCacheForMutation() {}, invalidateAdminCacheForMutation() {},
    requestCrawler: async (_, endpoint, options) => {
      calls.push({ endpoint, options });
      const offset = Number(endpoint.match(/offset=(\d+)/)[1]);
      return { total: 201, items: Array.from({ length: offset ? 1 : 200 }, (_, i) => ({
        platform: 'TIKTOK', username: `user_${offset + i}`, decision: 'SKIP_INSUFFICIENT', status: 'success' })) };
    },
  });
  const rows = await crawlerService.getReviewCandidates();
  assert.equal(rows.items.length, 201);
  assert.equal(rows.complete, true);
  assert.match(calls[1].endpoint, /offset=200/);
  assert.ok(calls.every(call => call.options.method === undefined));
});

test('older crawler falls back to its existing review queue only when the new endpoint is missing', async () => {
  const calls = [];
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    invalidateDataManagerCacheForMutation() {}, invalidateAdminCacheForMutation() {},
    requestCrawler: async (_, endpoint) => {
      calls.push(endpoint);
      if (endpoint.includes('/review-candidates')) throw Object.assign(new Error('Not Found'), { status: 404 });
      return { total: 1, candidates: [{ username: 'real_pending_creator', platform: 'TIKTOK',
        decision: 'NEEDS_MANAGER_REVIEW', primary_type: 'KOC', evidence_summary: { followers: 10000 } }] };
    },
  });
  const result = await crawlerService.getReviewCandidates();
  assert.equal(result.items[0].username, 'real_pending_creator');
  assert.equal(result.items[0].followers, 10000);
  assert.equal(result.complete, false);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /^\/api\/v1\/candidates\/review\/pending\?/);
});

test('permission failures are surfaced rather than retried against the compatibility endpoint', async () => {
  let calls = 0;
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    requestCrawler: async () => { calls++; throw Object.assign(new Error('Forbidden'), { status: 403 }); },
  });
  await assert.rejects(crawlerService.getReviewCandidates(), /Forbidden/);
  assert.equal(calls, 1);
});
