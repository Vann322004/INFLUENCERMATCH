import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Exercises SPA navigation and real FE cache code. Network responses are test fixtures.
// Does not create artifacts, screenshots, or credential files.
const base = process.env.RESPONSIVE_BASE_URL || 'http://127.0.0.1:5174';
const config = JSON.parse(await fs.readFile(new URL('./fixtures/recommendationConfig.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--disable-gpu'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const counts = new Map();
const results = [];
let writes = 0, failNextConfig = false;
const niches = [{ id: 'qa-niche', name: 'Beauty', description: '', active: true }];
const hits = (path, method = 'GET') => counts.get(method + ' ' + path) || 0;

await context.addInitScript(() => {
  sessionStorage.setItem('im_tab_auth_session', JSON.stringify({ id: 'cache-qa-session', accessToken: 'qa-cache-token',
    user: { id: 'cache-qa-manager', fullName: 'Manager QA', role: 'DATA_MANAGER', permissions: ['MANAGE_RECOMMENDATION_CONFIG'] }, logoutMarker: null }));
});
await context.route('**/*', async route => {
  const request = route.request(), url = new URL(request.url());
  if (url.pathname.includes('/api/v1/') || url.pathname.startsWith('/crawler-api')) {
    const key = request.method() + ' ' + url.pathname + (url.pathname.endsWith('/trends') ? '?days=' + url.searchParams.get('days') : '');
    counts.set(key, (counts.get(key) || 0) + 1);
    let data = { items: [], totalElements: 0 };
    if (url.pathname.includes('/monitor/overview')) return route.fulfill({ json: { activities: { items: [] } } });
    if (url.pathname.endsWith('/recommendation-config')) {
      if (failNextConfig) { failNextConfig = false; return route.fulfill({ status: 503, json: { message: 'QA temporary error' } }); }
      data = config;
    }
    if (url.pathname.endsWith('/creator-masters/summary')) data = {
      totalMasters: 10 + writes, claimedChannelsCount: 3, unclaimedChannelsCount: 4, duplicateCandidatesCount: 0,
    };
    if (url.pathname.endsWith('/niches/stats')) data = [{ niche: 'Beauty', name: 'Beauty', creatorCount: 3, percentage: 100 }];
    if (url.pathname.endsWith('/niches')) {
      if (request.method() === 'POST') {
        writes++;
        const created = { id: 'qa-new-' + writes, ...request.postDataJSON() };
        niches.push(created); data = created;
      } else data = niches;
    }
    if (url.pathname.endsWith('/trends')) data = Array.from({ length: Number(url.searchParams.get('days')) }, (_, index) => ({
      date: new Date(Date.UTC(2026, 10, index + 1)).toISOString().slice(0, 10), ingestedCount: index, successCount: index, failedCount: 0,
    }));
    return route.fulfill({ json: { data } });
  }
  if (url.origin !== new URL(base).origin) return route.abort();
  return route.continue();
});

const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
async function menu(name, suffix) {
  await page.locator('.app-sider').getByRole('button', { name, exact: true }).click();
  await page.waitForURL('**/data-manager/' + suffix);
}
async function dashboardReady() {
  await page.locator('.dm-kpi-value').first().waitFor();
  await page.locator('.dm-niche-stat').first().waitFor();
  await page.locator('.dm-niche-list .ant-tag').first().waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.dm-trends-panel tbody tr').length === 7);
}
try {
  await page.goto(base + '/data-manager/dashboard');
  await dashboardReady();
  const summaryPath = '/api/v1/data/creator-masters/summary';
  const statsPath = '/api/v1/data/niches/stats';
  const nichesPath = '/api/v1/data/niches';
  const configPath = '/api/v1/admin/recommendation-config';
  const trends7 = '/api/v1/data/crawler/trends?days=7';
  const trends30 = '/api/v1/data/crawler/trends?days=30';
  const liveClaims = hits('/api/v1/data/creator-claims');
  for (const path of [summaryPath, statsPath, nichesPath, trends7]) assert.equal(hits(path), 1);

  await menu('Cấu hình thuật toán', 'scoring');
  await page.locator('.dm-config').waitFor();
  assert.equal(hits(configPath), 1);
  await menu('Tổng quan', 'dashboard');
  await dashboardReady();
  for (const path of [summaryPath, statsPath, nichesPath, trends7]) assert.equal(hits(path), 1, 'cached navigation: ' + path);
  assert(hits('/api/v1/data/creator-claims') > liveClaims, 'review queue stays fresh');
  results.push('Dashboard aggregates reused; operational queue refetched');

  await menu('Cấu hình thuật toán', 'scoring');
  await page.locator('.dm-config').waitFor();
  assert.equal(hits(configPath), 1);
  assert.equal(await page.locator('.dm-config-state').count(), 0);
  results.push('Configuration reused without another request or loading screen');
  await menu('Tổng quan', 'dashboard');
  await dashboardReady();
  await page.locator('.dm-trends-panel').getByText('30 ngày', { exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.dm-trends-panel tbody tr').length === 30);
  await page.locator('.dm-trends-panel').getByText('7 ngày', { exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.dm-trends-panel tbody tr').length === 7);
  assert.equal(hits(trends7), 1); assert.equal(hits(trends30), 1);
  results.push('7/30-day trends use independent cached responses');

  await menu('Danh mục ngành hàng', 'taxonomy');
  await page.getByRole('tab', { name: /Quản lý ngành hàng/ }).click();
  await page.getByRole('button', { name: /Thêm ngành hàng/ }).waitFor();
  assert.equal(hits(nichesPath), 1, 'catalog shares the Dashboard taxonomy cache');
  await page.getByRole('button', { name: /Thêm ngành hàng/ }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: /Tên ngành hàng/ }).fill('Cache QA category');
  await page.getByRole('button', { name: 'Lưu ngành hàng', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(writes, 1);
  await menu('Tổng quan', 'dashboard');
  await dashboardReady();
  assert.equal(hits(nichesPath), 2); assert.equal(hits(summaryPath), 2); assert.equal(hits(statsPath), 2);
  assert.equal(hits(trends7), 1);
  assert.equal(await page.locator('.dm-kpi-value').first().innerText(), '11');
  results.push('Successful taxonomy mutation invalidates related cached aggregates and catalog');

  await menu('Danh mục ngành hàng', 'taxonomy');
  await page.getByRole('tab', { name: /Quản lý ngành hàng/ }).click();
  await page.getByRole('button', { name: /Làm mới/ }).click();
  await page.waitForFunction(() => !document.querySelector('.ant-btn-loading'));
  assert.equal(hits(nichesPath), 3);
  results.push('Explicit refresh bypasses a valid cached catalog');

  await menu('Cấu hình thuật toán', 'scoring');
  await page.locator('.dm-config').waitFor();
  assert.equal(hits(configPath), 1);
  failNextConfig = true;
  await page.reload();
  await page.getByRole('button', { name: /Thử lại \(Retry\)/ }).waitFor();
  assert.equal(hits(configPath), 2, 'full reload starts a new in-memory cache');
  await page.getByRole('button', { name: /Thử lại \(Retry\)/ }).click();
  await page.locator('.dm-config').waitFor();
  assert.equal(hits(configPath), 3, 'error response was not cached');
  results.push('Reload clears RAM cache and failed requests can retry successfully');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: results, requestCounts: Object.fromEntries(counts) }, null, 2));
} finally { await browser.close(); }
