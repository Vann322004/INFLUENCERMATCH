import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

async function service(file, name, get) {
  const context = vm.createContext({ console, Date, Math });
  const client = new vm.SyntheticModule(['default'], function () {
    this.setExport('default', { get });
  }, { context });
  const source = stripTypeScriptTypes(await readFile(new URL(`../src/services/api/${file}.ts`, import.meta.url), 'utf8'));
  const module = new vm.SourceTextModule(source, { context });
  await module.link(specifier => {
    assert.equal(specifier, '../apiClient');
    return client;
  });
  await module.evaluate();
  return module.namespace[name];
}

test('dashboard accepts a real empty claim queue without sample records', async () => {
  const api = await service('claimService', 'claimService', async () => ({ data: { data: { items: [], totalElements: 0 } } }));
  const page = await api.getClaims({ status: 'PENDING' }, { requireBackend: true });
  assert.equal(page.items.length, 0);
  assert.equal(page.totalElements, 0);
});

test('dashboard claim failures propagate instead of returning sample records', async () => {
  const error = new Error('backend unavailable');
  const api = await service('claimService', 'claimService', async () => { throw error; });
  await assert.rejects(api.getClaims({}, { requireBackend: true }), error);
});

test('dashboard rejects malformed claim responses', async () => {
  const api = await service('claimService', 'claimService', async () => ({ data: { data: {} } }));
  await assert.rejects(api.getClaims({}, { requireBackend: true }), /không hợp lệ/);
});

test('dashboard distinguishes an empty quality queue from backend failure', async () => {
  const empty = await service('adminService', 'adminService', async () => ({ data: { data: { items: [] } } }));
  assert.equal((await empty.getPendingClaims({}, { requireBackend: true })).length, 0);
  const error = new Error('quality unavailable');
  const failed = await service('adminService', 'adminService', async () => { throw error; });
  await assert.rejects(failed.getPendingClaims({}, { requireBackend: true }), error);
});

test('master summary uses its endpoint and preserves all four zero counts', async () => {
  const api = await service('dataManagerDashboardService', 'dataManagerDashboardService', async url => {
    assert.equal(url, '/data/creator-masters/summary');
    return { data: { success: true, data: { totalMasters: 0, claimedChannelsCount: 0, unclaimedChannelsCount: 0, duplicateCandidatesCount: 0 } } };
  });
  const summary = await api.getCreatorMasterSummary();
  assert.equal(summary.totalMasters, 0);
  assert.equal(summary.claimedChannelsCount, 0);
  assert.equal(summary.unclaimedChannelsCount, 0);
  assert.equal(summary.duplicateCandidatesCount, 0);
});

test('summary accepts backend snake case aliases and rejects missing counters', async () => {
  const api = await service('dataManagerDashboardService', 'dataManagerDashboardService', async () => ({ data: { data: {
    total_masters: 9, claimed_channels_count: 3, unclaimed_channels_count: 6, duplicate_candidates_count: 1,
  } } }));
  assert.equal((await api.getCreatorMasterSummary()).unclaimedChannelsCount, 6);
  const invalid = await service('dataManagerDashboardService', 'dataManagerDashboardService', async () => ({ data: { data: {} } }));
  await assert.rejects(invalid.getCreatorMasterSummary(), /totalMasters/);
});

test('niche statistics preserve server percentages and genuine empty/zero values', async () => {
  let data = [{ niche: 'BEAUTY', name: 'Beauty', creatorCount: 0, percentage: 0 }];
  const api = await service('dataManagerDashboardService', 'dataManagerDashboardService', async url => {
    assert.equal(url, '/data/niches/stats');
    return { data: { data } };
  });
  assert.equal((await api.getNicheStatistics())[0].percentage, 0);
  data = [{ niche: 'BEAUTY', name: 'Beauty', creatorCount: 1, percentage: 12.3 }];
  assert.equal((await api.getNicheStatistics())[0].percentage, 12.3);
  data = [];
  assert.equal((await api.getNicheStatistics()).length, 0);
  data = [{ niche: 'BEAUTY', name: 'Beauty', creatorCount: 1 }];
  await assert.rejects(api.getNicheStatistics(), /percentage/);
});

test('trends pass the selected days and never invent provenance or missing dates', async () => {
  const api = await service('dataManagerDashboardService', 'dataManagerDashboardService', async (url, config) => {
    assert.equal(url, '/data/crawler/trends');
    assert.equal(config.params.days, 30);
    return { data: { success: true, data: [{ date: '2026-11-13', ingested_count: 0, success_count: 0, failed_count: 0 }], meta: { timestamp: '2026-11-13' } } };
  });
  const trends = await api.getCrawlerTrends(30);
  assert.equal(trends.items.length, 1);
  assert.equal(trends.items[0].ingestedCount, 0);
  assert.equal(trends.source, null);
  assert.equal(trends.isFallback, null);
});

test('trends retain fallback metadata from the envelope or individual rows', async () => {
  const point = { date: '2026-11-13', ingestedCount: 2, successCount: 1, failedCount: 0 };
  let response = { data: [point], meta: { source: 'DATABASE', isFallback: true } };
  const api = await service('dataManagerDashboardService', 'dataManagerDashboardService', async () => ({ data: response }));
  assert.equal((await api.getCrawlerTrends(7)).source, 'DATABASE');
  assert.equal((await api.getCrawlerTrends(7)).isFallback, true);
  response = { data: [{ ...point, source: 'CRAWLER', isFallback: false }] };
  assert.equal((await api.getCrawlerTrends(7)).isFallback, false);
  response = { data: [] };
  assert.equal((await api.getCrawlerTrends(7)).items.length, 0);
});

test('trends reject malformed records rather than fabricating zero counts', async () => {
  let point = { date: '2026-11-13', ingestedCount: 2, successCount: 1 };
  const api = await service('dataManagerDashboardService', 'dataManagerDashboardService', async () => ({ data: { data: [point] } }));
  await assert.rejects(api.getCrawlerTrends(7), /failedCount/);
  point = { date: '2026-02-31', ingestedCount: 2, successCount: 1, failedCount: 0 };
  await assert.rejects(api.getCrawlerTrends(7), /Ngày/);
});

test('all new dashboard API failures propagate without mock fallbacks', async () => {
  const error = new Error('503 backend unavailable');
  const api = await service('dataManagerDashboardService', 'dataManagerDashboardService', async () => { throw error; });
  await assert.rejects(api.getCreatorMasterSummary(), error);
  await assert.rejects(api.getNicheStatistics(), error);
  await assert.rejects(api.getCrawlerTrends(7), error);
});
