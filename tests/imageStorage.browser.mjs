// Run with Vite on IMAGE_TEST_URL (default http://127.0.0.1:5187).
import { chromium } from 'playwright';
import { writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';

const harness = new URL('../.image-storage-browser.html', import.meta.url);
await writeFile(harness, `<!doctype html><html><body><div id="root"></div><script type="module">
import React from 'react'; import { createRoot } from 'react-dom/client';
import { App } from 'antd'; import { BrowserRouter } from 'react-router-dom';
import { setAuthSession } from '/src/services/authSession.ts';
import BrandProfilePage from '/src/pages/brand/BrandProfilePage.tsx';
import CampaignImage from '/src/components/common/CampaignImage.tsx';
import CreatorAvatar from '/src/pages/creator/components/discovery/CreatorAvatar.tsx';
setAuthSession('browser-test-token', undefined, { id: 'brand-user', role: 'BRAND', status: 'ACTIVE', permissions: ['UPDATE_BRAND_PROFILE', 'VIEW_OWN_BRAND_DATA'] });
createRoot(document.getElementById('root')).render(React.createElement(App, null, React.createElement(BrowserRouter, null,
 React.createElement(BrandProfilePage), React.createElement('div', {id:'fallback-test'},
 React.createElement(CampaignImage, {src:'/broken-campaign.png'}),
 React.createElement(CreatorAvatar, {src:'/broken-avatar.png',name:'Alpha Brand'})))));
</script></body></html>`, 'utf8');
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZJ0AAAAASUVORK5CYII=', 'base64');
  let profile = { id: 'a0000000-0000-0000-0000-000000000001', businessName: 'Acme', profileRevision: 1, onboardingStatus: 'COMPLETED', preferredPlatforms: [], productCategories: [] };
  let uploads = 0;
  let failUpload = false;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/broken-*.png', route => route.fulfill({ status: 404 }));
  await page.route('**/uploaded-logo.png', route => route.fulfill({ status: 200, contentType: 'image/png', body: png }));
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    if (request.method() === 'POST' && request.url().includes('/brands/me/images/logo')) {
      uploads++;
      assert.match(request.headers()['content-type'], /multipart\/form-data; boundary=/);
      assert.equal(request.headers()['if-match'], `"brand:${profile.id}:r${profile.profileRevision}"`);
      if (failUpload) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Upload unavailable' }) });
      profile = { ...profile, logoUrl: 'https://assets.example/uploaded-logo.png', profileRevision: profile.profileRevision + 1 };
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: profile }) });
  });
  await page.goto(`${process.env.IMAGE_TEST_URL || 'http://127.0.0.1:5187'}/.image-storage-browser.html`);
  const logoButton = page.getByRole('button', { name: /Đổi logo/ });
  try { await logoButton.waitFor({ timeout: 15000 }); } catch (error) {
    console.log('Browser errors:', errors, 'Body:', (await page.locator('body').innerText()).slice(0, 1500));
    throw error;
  }
  await page.locator('input[value="Acme"]').fill('Edited brand');
  const choose = async () => {
    const event = page.waitForEvent('filechooser'); await logoButton.click();
    await (await event).setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
  };
  await choose();
  await page.locator('img[src="https://assets.example/uploaded-logo.png"]').waitFor();
  assert.equal(await page.locator('input[value="Edited brand"]').count(), 1, 'image upload must preserve unsaved profile edits');
  await page.waitForFunction(() => document.querySelector('#fallback-test img')?.getAttribute('src') === '/images/campaign-placeholder.svg');
  assert.match(await page.locator('#fallback-test').innerText(), /AB/);
  failUpload = true; await choose();
  await page.getByText('Upload unavailable', { exact: true }).waitFor();
  assert.equal(await page.locator('img[src="https://assets.example/uploaded-logo.png"]').count(), 1, 'failed upload must keep the previous image');
  assert.equal(uploads, 2);
  assert.deepEqual(errors, []);
  console.log('PASS: multipart BE upload, revision, saved logo, preserved edits, failure retention and image fallbacks');
} finally {
  await browser?.close(); await unlink(harness);
}
