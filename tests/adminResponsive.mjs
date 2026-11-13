import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

// Browser-only fixtures: no application fallback or real credentials are used.
const output = path.resolve('artifacts/admin-responsive');
const baseURL = process.env.RESPONSIVE_BASE_URL || 'http://127.0.0.1:5173';
await fs.mkdir(output, { recursive: true });
const configSource = await fs.readFile('src/types/api/recommendationConfig.types.ts', 'utf8');
const js = configSource.slice(configSource.indexOf('export const FROZEN_RECOMMENDATION_CONFIG')).replace(': RecommendationConfigResponseDto', '');
const { FROZEN_RECOMMENDATION_CONFIG: config } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
const results = [];
const runtimeErrors = [];
const claim = { id: 'qa-claim', creatorHandle: '@creator_with_a_long_handle_for_readability', claimantName: 'Người kiểm thử giao diện với tên dài', creatorPlatform: 'TIKTOK', status: 'PENDING', submittedAt: '2026-11-13T07:00:00Z' };
let scenario = 'success';
let requests = 0;
const context = await browser.newContext({ viewport: { width: 375, height: 900 }, hasTouch: true });
await context.addInitScript(() => {
  sessionStorage.setItem('im_tab_auth_session', JSON.stringify({ id: 'responsive-qa', accessToken: 'qa-browser-token', user: { id: 'qa-manager', fullName: 'Data Manager QA', role: 'DATA_MANAGER', permissions: ['MANAGE_RECOMMENDATION_CONFIG'] }, logoutMarker: null }));
});
const handleRoute = async route => {
  const url = new URL(route.request().url());
  if (url.pathname.includes('/api/v1/') || url.pathname.startsWith('/crawler-api')) {
    requests++;
    if (scenario === 'loading') await new Promise(resolve => setTimeout(resolve, 1200));
    const fail = scenario === 'error' || (scenario === 'partial' && url.pathname.endsWith('/data/niches'));
    if (fail) return route.fulfill({ status: 503, json: { message: 'QA: nguồn dữ liệu tạm thời chưa sẵn sàng' } });
    const empty = scenario === 'empty';
    let data = { items: [], totalElements: 0 };
    if (url.pathname.includes('/monitor/overview')) return route.fulfill({ json: {
      stats: { total_candidates: empty ? 0 : 120, ingested_count: empty ? 0 : 75, accepted_kol_koc: empty ? 0 : 61, review_pending: empty ? 0 : 8 },
      activities: { items: empty ? [] : [{ id: 'qa-activity', username: claim.creatorHandle, platform: 'TIKTOK', status: 'FAILED', decision: 'REVIEW', updatedAt: '2026-11-13T07:00:00Z' }] },
    } });
    if (url.pathname.endsWith('/recommendation-config')) data = config;
    if (url.pathname.endsWith('/data/creator-claims')) data = { items: empty ? [] : [claim], totalElements: empty ? 0 : 1 };
    if (url.pathname.endsWith('/data-quality/pending')) data = { items: empty ? [] : [{ id: 'qa-quality', creatorHandle: '@quality' }] };
    if (url.pathname.endsWith('/data/creator-masters')) data = { items: [], totalElements: empty ? 0 : 81 };
    if (url.pathname.endsWith('/data/creator-conflicts')) data = { items: [], totalElements: empty ? 0 : 3 };
    if (url.pathname.endsWith('/data/niches')) data = empty ? [] : [{ id: 'qa-niche', name: 'Ngành hàng với tên dài để kiểm tra hiển thị đầy đủ', active: true }];
    return route.fulfill({ json: { data } });
  }
  if (url.origin !== new URL(baseURL).origin) return route.abort();
  return route.continue();
};
await context.route('**/*', handleRoute);
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', error => runtimeErrors.push(error.message));
const settle = async () => { await page.waitForTimeout(350); };
async function captureSection(locator, filename) {
  await locator.evaluate(node => {
    let scroller = node.parentElement;
    while (scroller && !['auto', 'scroll'].includes(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    if (scroller) scroller.scrollTo({ top: scroller.scrollTop + node.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 64, behavior: 'instant' });
  });
  await settle();
  await page.screenshot({ path: path.join(output, filename) });
}
async function verifyBounds(label) {
  const issues = await page.evaluate(() => {
    const content = document.querySelector('.admin-content');
    const viewport = document.documentElement.clientWidth;
    const issues = [];
    if (document.documentElement.scrollWidth > viewport + 1) issues.push('document overflow');
    if (content && content.scrollWidth > content.clientWidth + 1) issues.push(`content overflow ${content.scrollWidth}/${content.clientWidth}`);
    for (const node of document.querySelectorAll('.dm-dashboard .ant-btn, .dm-config .ant-btn, .dm-config .ant-tag')) {
      if (node.closest('.ant-table-content')) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width && (rect.right > viewport + 1 || rect.left < -1)) issues.push(`clipped control: ${node.textContent}`);
    }
    return issues;
  });
  if (issues.length) {
    await page.screenshot({ path: path.join(output, 'failure.png') });
    console.log(await page.evaluate(() => [...document.querySelectorAll('.admin-content *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2 && !el.closest('.ant-table-content')).slice(0, 18).map(el => ({ tag: el.tagName, cls: el.className, width: el.getBoundingClientRect().width, min: getComputedStyle(el).minWidth, flex: getComputedStyle(el).flex, text: el.textContent.slice(0, 50) }))));
  }
  assert.deepEqual(issues, [], `${label}: ${issues.join(', ')}`);
}
try {
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ['dashboard', 'scoring']) {
      await page.goto(`${baseURL}/data-manager/${view}`);
      await page.locator(view === 'dashboard' ? '.dm-dashboard' : '.dm-config').waitFor();
      await settle();
      await verifyBounds(`${view} ${width}`);
      await page.screenshot({ path: path.join(output, `${view}-${width}.png`) });
      if (view === 'dashboard' && [320, 768, 1440].includes(width)) {
        await captureSection(page.locator('.dm-kpi-grid'), `kpis-${width}.png`);
        await captureSection(page.locator('.dm-dashboard .ant-table-wrapper'), `crawler-log-${width}.png`);
      }
      if (view === 'scoring') {
        for (const key of ['calibration', 'reranking', 'weighting']) {
          const tab = page.locator(`[data-node-key="${key}"] .ant-tabs-tab-btn`);
          await tab.scrollIntoViewIfNeeded();
          await tab.tap();
          await settle();
          assert.equal(await tab.getAttribute('aria-selected'), 'true');
          const rect = await tab.boundingBox();
          assert(rect.x >= 0 && rect.x + rect.width <= width + 1, 'selected tab stays visible');
          await verifyBounds(`${key} ${width}`);
          const panel = page.locator('[role="tabpanel"][aria-hidden="false"]');
          if ([320, 768, 1440].includes(width)) await captureSection(panel, `${key}-${width}.png`);
          const table = panel.locator('.ant-table-content');
          if (await table.count()) {
            const scroll = await table.evaluate(el => { el.scrollLeft = 1000; return { offset: el.scrollLeft, scroll: el.scrollWidth, width: el.clientWidth }; });
            if (scroll.scroll > scroll.width) assert(scroll.offset > 0, 'table scrolls to all columns');
          }
        }
        const count = page.getByRole('spinbutton', { name: 'Số lượng ứng viên' });
        await count.fill('5'); await count.press('Tab');
        await page.getByText('Kích hoạt BUSINESS_FALLBACK', { exact: false }).waitFor();
        await count.fill('15'); await count.press('Tab');
        await page.getByText('Điều kiện quy mô mẫu: ĐẠT ĐIỀU KIỆN CẦN', { exact: false }).waitFor();
        if (width < 768) {
          const size = await count.boundingBox();
          assert(size.height >= 42, 'touch input height');
        }
      }
      results.push({ width, view, status: 'passed' });
      console.log(`${view} ${width}: passed`);
    }
    if (width < 768) {
      const trigger = page.getByRole('button', { name: 'Mở menu điều hướng' });
      await trigger.tap();
      const drawer = page.getByRole('dialog', { name: 'Menu điều hướng' });
      await drawer.waitFor();
      assert.equal(await drawer.locator('.admin-nav-item').count(), 7);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(output, `navigation-${width}.png`) });
      await page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden' });
      await trigger.tap();
      await drawer.locator('.admin-nav-item').filter({ hasText: 'Tổng quan' }).tap();
      await page.waitForURL('**/data-manager/dashboard');
      await drawer.waitFor({ state: 'hidden' });
      await trigger.focus(); await page.keyboard.press('Enter');
      await drawer.waitFor();
      await page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden' });
      results.push({ width, navigation: 'tap, Escape, keyboard, auto-close passed' });
    }
  }
  await page.setViewportSize({ width: 320, height: 900 });
  for (const state of ['loading', 'empty', 'partial', 'error']) {
    scenario = state;
    await page.goto(`${baseURL}/data-manager/dashboard`);
    await page.locator('.dm-dashboard').waitFor();
    if (state === 'loading') await page.locator('.ant-skeleton').first().waitFor();
    else {
      await page.waitForFunction(() => !document.querySelector('.ant-skeleton'));
      if (state === 'empty') assert.equal(await page.getByText('@creator_with_a_long_handle_for_readability', { exact: true }).count(), 0);
      if (state === 'partial' || state === 'error') await page.getByText('Thông báo kết nối dữ liệu', { exact: true }).waitFor();
    }
    await verifyBounds(`dashboard ${state}`);
    await page.screenshot({ path: path.join(output, `dashboard-${state}-320.png`) });
    results.push({ state, status: 'passed' });
  }
  scenario = 'error';
  await page.goto(`${baseURL}/data-manager/scoring`);
  const retry = page.getByRole('button', { name: 'Thử lại (Retry)' });
  await retry.waitFor();
  await page.screenshot({ path: path.join(output, 'scoring-error-320.png') });
  scenario = 'success'; await retry.tap();
  await page.locator('.dm-config').waitFor();
  const before = requests;
  await page.getByRole('button', { name: /Làm mới/ }).tap();
  await settle(); assert(requests > before);
  const pool = page.getByRole('spinbutton', { name: 'Số lượng ứng viên' });
  await pool.fill('5'); await pool.press('Tab');
  await page.getByRole('combobox', { name: 'Mục tiêu chiến dịch' }).tap();
  await page.locator('.ant-select-item-option').filter({ hasText: 'AWARENESS' }).tap();
  const calibration = page.locator('[data-node-key="calibration"] .ant-tabs-tab-btn');
  await calibration.scrollIntoViewIfNeeded(); await calibration.tap();
  scenario = 'error';
  await page.getByRole('button', { name: /Làm mới/ }).tap();
  await retry.waitFor();
  scenario = 'success'; await retry.tap();
  await page.locator('.dm-config').waitFor();
  assert.equal(await pool.inputValue(), '5');
  assert.match(await page.locator('.dm-config .ant-select').innerText(), /AWARENESS/);
  assert.equal(await calibration.getAttribute('aria-selected'), 'true');
  results.push({ state: 'tab, objective and candidate count retained across refresh failure and Retry', status: 'passed' });
  await page.goto(`${baseURL}/admin/accounts`);
  await page.waitForURL('**/data-manager/dashboard');
  results.push({ permissions: 'Data Manager redirected from Admin-only accounts' });
  const adminContext = await browser.newContext({ viewport: { width: 320, height: 900 }, hasTouch: true });
  await adminContext.addInitScript(() => {
    sessionStorage.setItem('im_tab_auth_session', JSON.stringify({ id: 'qa-admin', accessToken: 'qa-token', user: { id: 'qa-admin', role: 'ADMIN', fullName: 'Admin QA' }, logoutMarker: null }));
  });
  await adminContext.route('**/*', handleRoute);
  const adminPage = await adminContext.newPage();
  adminPage.setDefaultTimeout(12000);
  adminPage.on('pageerror', error => runtimeErrors.push(error.message));
  await adminPage.goto(`${baseURL}/admin/accounts`);
  await adminPage.locator('.admin-workspace').waitFor();
  await adminPage.getByRole('button', { name: 'Mở menu điều hướng' }).tap();
  const adminDrawer = adminPage.getByRole('dialog', { name: 'Menu điều hướng' });
  await adminDrawer.waitFor();
  await adminPage.waitForTimeout(400);
  assert.equal(await adminDrawer.getByRole('button', { name: 'Cấu hình thuật toán', exact: true }).count(), 0);
  await adminPage.screenshot({ path: path.join(output, 'admin-navigation-320.png') });
  await adminPage.keyboard.press('Escape');
  await adminDrawer.waitFor({ state: 'hidden' });
  results.push({ permissions: 'Admin retains Admin menu; Data Manager menu remains separate' });
  assert.deepEqual(runtimeErrors, []);
} finally {
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, runtimeErrors }, null, 2));
  await browser.close();
}
console.log(`Passed ${results.length} responsive checks; screenshots: ${output}`);
