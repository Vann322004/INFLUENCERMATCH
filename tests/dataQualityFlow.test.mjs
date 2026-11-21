import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

test('account collection queues both single and multiple accounts without holding a crawl request open', async () => {
  const calls = [];
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    invalidateDataManagerCacheForMutation() {},
    invalidateAdminCacheForMutation() {},
    requestCrawler: async (_, path, options) => {
      calls.push({ path, body: options.body ? JSON.parse(options.body) : null });
      return path.endsWith('/test-scrape')
        ? { status: 'success', platform: 'TIKTOK', username: 'alice', latency_ms: 250 }
        : path.endsWith('/jobs') ? { task_id: 'test-job' }
        : { status: 'COMPLETED', result: { status: 'success', results: [{ username: 'alice' }], summary: { total_requested: 1 } } };
    },
  });
  const single = await crawlerService.collectAccounts('TIKTOK', [' @alice ', '@alice'], 5);
  assert.equal(calls[0].path, '/api/v1/crawl/batch-crawl/jobs');
  assert.deepEqual(calls[0].body.usernames, ['alice']);
  assert.equal(single.results[0].username, 'alice');
  assert.equal(single.summary.total_requested, 1);
  await crawlerService.collectAccounts('FACEBOOK', ['alice', 'bob', 'charlie'], 2);
  assert.equal(calls[2].path, '/api/v1/crawl/batch-crawl/jobs');
  assert.deepEqual(calls[2].body.usernames, ['alice', 'bob']);
  assert.equal(calls[2].body.max_channels, 2);
  await assert.rejects(crawlerService.collectAccounts('TIKTOK', ['  ', '@']), /tài khoản/);
  assert.equal(calls[3].path, '/api/v1/crawl/batch-crawl/jobs/test-job');
  assert.equal(calls.length, 4);
});

test('batch polling survives pending and started states without replaying the mutation', async () => {
  const calls = [];
  const states = ['PENDING', 'STARTED', 'COMPLETED'];
  const values = new Map();
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    invalidateDataManagerCacheForMutation() {}, invalidateAdminCacheForMutation() {},
    setTimeout: callback => callback(),
    sessionStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
    requestCrawler: async (_, path, options) => {
      calls.push({ path, method: options.method });
      if (options.method === 'POST') return { task_id: 'tracked-job' };
      const status = states.shift();
      return { status, result: status === 'COMPLETED' ? { results: [{ username: 'alice' }] } : undefined };
    },
  });
  const result = await crawlerService.batchCrawl({ category: 'TECH' });
  assert.equal(result.results[0].username, 'alice');
  assert.equal(calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(calls.length, 4);
  assert.equal(values.size, 0);
});

test('lost status connection retains the job and the next attempt resumes without another POST', async () => {
  const values = new Map();
  let posts = 0;
  let offline = true;
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    invalidateDataManagerCacheForMutation() {}, invalidateAdminCacheForMutation() {},
    setTimeout: callback => callback(),
    sessionStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
    requestCrawler: async (_, path, options) => {
      if (options.method === 'POST') { posts++; return { task_id: 'retained-job' }; }
      if (offline) throw new Error('HTTP 504');
      return { status: 'COMPLETED', result: { results: [] } };
    },
  });
  await assert.rejects(crawlerService.batchCrawl({ category: 'TECH' }), /retained-job/);
  assert.equal(values.size, 1);
  offline = false;
  await crawlerService.batchCrawl({ category: 'TECH' });
  assert.equal(posts, 1);
  assert.equal(values.size, 0);
});

function load(file, exports, globals = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm, '')
    .replaceAll('import.meta.env.VITE_CRAWLER_API_BASE_URL', 'undefined')
    .replace(/export /g, '');
  const context = vm.createContext({ ...globals });
  vm.runInContext(stripTypeScriptTypes(source) + `\nglobalThis.exports = {${exports}}`, context);
  return context.exports;
}

test('monitor clamps limit and normalizes flat crawler evidence', async () => {
  let endpoint;
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    invalidateDataManagerCacheForMutation() {},
    invalidateAdminCacheForMutation() {},
    requestCrawler: async (_, path) => {
      endpoint = path;
      return { stats: {}, activities: { items: [] }, crawled_data: { total: 1, items: [
        { platform: 'TIKTOK', username: 'alice', followers: 7001, recentPosts: [{ caption: 'Evidence' }] },
      ] } };
    },
  });
  const result = await crawlerService.getOverview(200);
  assert.match(endpoint, /limit=100$/);
  assert.equal(result.crawled_data.items[0].creator.username, 'alice');
  assert.equal(result.crawled_data.items[0].recentPosts[0].caption, 'Evidence');
});

test('pending -> approve/reject sends snapshot IDs and reviewer input to backend', async () => {
  const calls = [];
  const apiClient = {
    get: async () => ({ data: { data: { items: [{ metricId: 'snapshot-id' }], totalElements: 1 } } }),
    put: async (path, body) => { calls.push({ path, body }); return { data: { data: { metricId: 'snapshot-id' } } }; },
  };
  const { dataQualityService } = load('src/services/api/dataQualityService.ts', 'dataQualityService', { apiClient });
  const pending = await dataQualityService.pending();
  await dataQualityService.approve(pending.items[0].metricId, ' Beauty ');
  await dataQualityService.reject(pending.items[0].metricId, ' Shop account ', 'BRAND');
  assert.equal(calls[0].path, '/data/quality/snapshot-id/approve');
  assert.equal(calls[0].body.niche, 'Beauty');
  assert.equal(calls[1].path, '/data/quality/snapshot-id/reject');
  assert.equal(calls[1].body.reason, 'Shop account');
  assert.equal(calls[1].body.reclassifiedType, 'BRAND');
});

test('502 never replays a crawl mutation against another host', async () => {
  let calls = 0;
  const { requestCrawler } = load('src/services/api/crawlerTransport.ts', 'requestCrawler', {
    AbortController, setTimeout, clearTimeout,
    fetch: async () => { calls++; return { ok: false, status: 502, json: async () => ({}) }; },
  });
  await assert.rejects(requestCrawler('/crawler-api', '/crawl', { method: 'POST' }), /HTTP 502/);
  assert.equal(calls, 1);
});

test('taxonomy mutations invalidate cached crawl fields after merging Develop', async () => {
  const { dataManagerRequestCache, invalidateDataManagerCacheForMutation } = load(
    'src/services/requestCache.ts', 'dataManagerRequestCache, invalidateDataManagerCacheForMutation', { structuredClone });
  await dataManagerRequestCache.get('fields', async () => ['old'], Infinity, ['taxonomy']);
  assert.ok(dataManagerRequestCache.peek('fields'));
  invalidateDataManagerCacheForMutation('put', '/data/crawl-fields/field-id');
  assert.equal(dataManagerRequestCache.peek('fields'), undefined);
});


test('collection rejects insufficient evidence and reserves review for eligible classification cases', () => {
  const { collectionOutcome } = load('src/services/collectionDecision.ts', 'collectionOutcome');
  assert.equal(collectionOutcome('SKIP_INSUFFICIENT', 'KOC'), 'rejected');
  assert.equal(collectionOutcome('AUTO_REJECT', 'KOL'), 'rejected');
  assert.equal(collectionOutcome('NEEDS_MANAGER_REVIEW', 'KOC'), 'review');
  assert.equal(collectionOutcome('ACCEPTED', 'UNKNOWN'), 'review');
  assert.equal(collectionOutcome('AUTO_ACCEPT_KOL'), 'accepted');
  assert.equal(collectionOutcome('ACCEPTED', 'KOC'), 'accepted');
  assert.equal(collectionOutcome(undefined, 'KOL'), 'pending');
  assert.equal(collectionOutcome('INGESTED', 'KOC'), 'pending');
});

test('accepted KOL without posts can queue; rejected or failed results cannot', () => {
  const { canQueueCollectionResult } = load('src/services/collectionDecision.ts', 'canQueueCollectionResult');
  const kol = { status: 'success', platform: 'TIKTOK', username: '@khoailangthang',
    decision: 'AUTO_ACCEPT_KOL', primary_type: 'KOL', recent_posts: [] };
  assert.equal(canQueueCollectionResult(kol), true);
  assert.equal(canQueueCollectionResult({ ...kol, decision: 'NEEDS_MANAGER_REVIEW' }), true);
  assert.equal(canQueueCollectionResult({ ...kol, decision: undefined }), true);
  assert.equal(canQueueCollectionResult({ ...kol, decision: 'AUTO_REJECT' }), false);
  assert.equal(canQueueCollectionResult({ ...kol, decision: 'SKIP_INSUFFICIENT' }), false);
  assert.equal(canQueueCollectionResult({ ...kol, status: 'error' }), false);
  assert.equal(canQueueCollectionResult({ ...kol, username: ' @ ' }), false);
  assert.equal(canQueueCollectionResult({ ...kol, platform: 'ALL' }), false);
  assert.equal(canQueueCollectionResult(null), false);
});

test('queue request uses the enqueue endpoint and normal processing without forcing approval', async () => {
  let request;
  const { crawlerService } = load('src/services/api/crawlerService.ts', 'crawlerService', {
    invalidateDataManagerCacheForMutation() {},
    invalidateAdminCacheForMutation() {},
    requestCrawler: async (_, path, options) => {
      request = { path, ...options };
      return { status: 'queued', task_id: 'queue-task' };
    },
  });
  const result = await crawlerService.enqueueCandidate('TIKTOK', ' @khoailangthang ', false);
  assert.equal(request.path, '/api/v1/crawl/enqueue');
  assert.equal(request.method, 'POST');
  assert.deepEqual(JSON.parse(request.body), {
    platform: 'TIKTOK', username: 'khoailangthang', force_deep_crawl: false,
  });
  assert.equal(result.task_id, 'queue-task');
});
