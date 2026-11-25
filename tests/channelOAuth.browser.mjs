// Browser/API contract test with mocked HTTP. Does not contact Meta or a live BE.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';
import { writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
const harness = new URL('../.channel-oauth-browser.html', import.meta.url);
let server, browser;
try {
  await writeFile(harness, `<!doctype html><html><body><div id="harness"></div><script type="module">
    import { createElement } from 'react';
    import { createRoot } from 'react-dom/client';
    import { BrowserRouter } from 'react-router-dom';
    import ChannelVerification from '/src/pages/creator/portal/ChannelVerification.tsx';
    window.mountChannelVerification = () => {
      createRoot(document.getElementById('harness')).render(
        createElement(BrowserRouter, {}, createElement(ChannelVerification, {
          canVerify: true, canViewClaims: false, linked: [], linkedError: null, reloadLinked: async () => true,
        })),
      );
    };
  </script></body></html>`, 'utf8');
  server = await createServer({ configFile: false, envDir: false, plugins: [react()], server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  const requests = [];
  let returnedFlow = 'INSTAGRAM_UNIFIED_LOGIN';
  let duplicateInstagram = false;
  let instagramMethods;
  let rejectStart = false;
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    requests.push({ path, method: req.method(), body: req.postDataJSON() });
    let data;
    if (path.endsWith('/connection-options')) {
      data = [
        { platform: 'FACEBOOK', oauthFlow: 'FACEBOOK_LOGIN', available: true, supported: true },
        { platform: 'INSTAGRAM', oauthFlow: 'INSTAGRAM_UNIFIED_LOGIN', available: true, supported: true, methods: instagramMethods },
        { platform: 'TIKTOK', oauthFlow: 'TIKTOK_LOGIN', available: false, supported: true },
      ];
      if (duplicateInstagram) data.push({ platform: 'INSTAGRAM', oauthFlow: 'INSTAGRAM_LOGIN', available: true, supported: true });
    }
    else if (path.endsWith('/start') && rejectStart) {
      await route.fulfill({ status: 422, contentType: 'application/problem+json',
        body: JSON.stringify({ detail: 'Không bắt đầu được phiên thử.' }) });
      return;
    }
    else if (path.endsWith('/claim')) data = { id: 'claim', creatorId: 'target', claimantId: 'creator-user', status: 'PENDING' };
    else if (path.endsWith('/start')) data = { sessionId: 'session', expiresAt: new Date(Date.now() + 600000).toISOString(), authorizationUrl: 'https://www.facebook.com/dialog/oauth' };
    else if (path.endsWith('/confirm')) data = { sessionId: 'session', creatorId: 'creator', status: 'AUTHORIZED' };
    else data = { sessionId: 'session', platform: 'INSTAGRAM', oauthFlow: returnedFlow, status: 'READY', accounts: [{ accountId: '178400001', matchStatus: 'AVAILABLE' }] };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/.channel-oauth-browser.html`);
  await page.evaluate(async () => {
    const { setAuthSession } = await import('/src/services/authSession.ts');
    setAuthSession('fixture-access-token', undefined, { id: 'creator-user', role: 'CREATOR', status: 'ACTIVE' });
    const { channelVerificationService: api } = await import('/src/services/api/channelVerificationService.ts');
    for (const [oauthFlow, platform] of [['INSTAGRAM_UNIFIED_LOGIN', 'INSTAGRAM'], ['INSTAGRAM_LOGIN', 'INSTAGRAM'], ['FACEBOOK_LOGIN', 'FACEBOOK'], ['TIKTOK_LOGIN', 'TIKTOK']]) {
      await api.start({ oauthFlow, platform, available: true, supported: true }, { creatorId: 'target', cooperationInvitationToken: 'fixture-invitation' });
    }
    await api.readSession('session', 'INSTAGRAM_UNIFIED_LOGIN');
    if (await api.confirm('session', '178400001') !== 'creator') throw Error('Missing confirmed creator');
  });
  assert.deepEqual(requests.slice(0, 4).map(req => req.path), [
    '/api/v1/creators/portal/accounts/connect/instagram-unified/start',
    '/api/v1/creators/portal/accounts/connect/instagram/start',
    '/api/v1/creators/portal/accounts/connect/meta/start',
    '/api/v1/creators/portal/accounts/connect/tiktok/start',
  ]);
  for (const req of requests.slice(0, 4)) {
    assert.equal(req.method, 'POST');
    assert.equal(req.body.creatorId, 'target');
    assert.equal(req.body.cooperationInvitationToken, 'fixture-invitation');
  }
  assert.equal(requests[2].body.platform, 'FACEBOOK');
  assert.equal(requests[0].body.platform, undefined);
  returnedFlow = 'INSTAGRAM_LOGIN';
  assert.equal(await page.evaluate(async () => {
    const { channelVerificationService: api } = await import('/src/services/api/channelVerificationService.ts');
    try { await api.readSession('session', 'INSTAGRAM_UNIFIED_LOGIN'); return false; } catch { return true; }
  }), true, 'a Direct session must not be shown as Unified');
  const readOptions = () => page.evaluate(async () => {
    const { channelVerificationService: api } = await import('/src/services/api/channelVerificationService.ts');
    return api.options();
  });
  assert.deepEqual((await readOptions()).map(option => [option.platform, option.oauthFlow, option.available]), [
    ['FACEBOOK', 'FACEBOOK_LOGIN', true],
    ['INSTAGRAM', 'INSTAGRAM_UNIFIED_LOGIN', true],
    ['TIKTOK', 'TIKTOK_LOGIN', false],
  ]);
  duplicateInstagram = true;
  assert.equal((await readOptions()).find(option => option.platform === 'INSTAGRAM').available, false);
  await page.evaluate(async () => {
    const { claimService } = await import('/src/services/api/claimService.ts');
    const claim = await claimService.submitClaim('target', {
      evidenceUrls: ['https://example.test/proof'], note: 'Account settings',
      cooperationInvitationToken: 'fixture-invitation',
    });
    if (claim.status !== 'PENDING') throw Error('Missing pending claim');
  });
  assert.equal(requests.at(-1).path, '/api/v1/creators/target/claim');
  assert.equal(requests.at(-1).body.cooperationInvitationToken, 'fixture-invitation');
  duplicateInstagram = false;
  rejectStart = true;
  const choices = [
    ['INSTAGRAM_LOGIN', 'Đăng nhập trực tiếp bằng Instagram', 'instagram'],
    ['FACEBOOK_LOGIN', 'Qua Facebook Page', 'meta'],
    ['INSTAGRAM_UNIFIED_LOGIN', 'Qua Meta Business Portfolio', 'instagram-unified'],
  ];
  const setAvailability = availableFlows => {
    instagramMethods = choices.map(([flow]) => ({
      oauthFlow: flow, available: availableFlows.includes(flow), unavailableReason: 'NOT_CONFIGURED',
    }));
  };
  await page.setViewportSize({ width: 375, height: 812 });
  const openDialog = async () => {
    await page.reload();
    await page.waitForFunction(() => typeof window.mountChannelVerification === 'function');
    await page.evaluate(() => window.mountChannelVerification());
    await page.getByRole('button', { name: 'Xác minh Instagram', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Chọn cách xác minh Instagram' });
    await dialog.waitFor();
    return dialog;
  };
  setAvailability(['INSTAGRAM_LOGIN']);
  const startCount = requests.filter(req => req.path.endsWith('/start')).length;
  let dialog = await openDialog();
  assert.equal(requests.filter(req => req.path.endsWith('/start')).length, startCount);
  for (const [flow, label] of choices) {
    const button = dialog.getByRole('button', { name: label, exact: true });
    assert.equal(await button.count(), 1);
    assert.equal(await button.isEnabled(), flow === 'INSTAGRAM_LOGIN');
  }
  assert.ok((await dialog.boundingBox()).width <= 375);
  setAvailability(choices.map(([flow]) => flow));
  dialog = await openDialog();
  for (const [flow, label, endpoint] of choices) {
    const response = page.waitForResponse(result => result.url().endsWith('/connect/' + endpoint + '/start'));
    await dialog.getByRole('button', { name: label, exact: true }).click();
    assert.equal((await response).status(), 422);
    await dialog.getByRole('alert').waitFor();
    if (flow === 'FACEBOOK_LOGIN') assert.equal(requests.at(-1).body.platform, 'INSTAGRAM');
  }
  setAvailability([]);
  dialog = await openDialog();
  await dialog.getByRole('button', { name: 'Xác minh thủ công' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.getByRole('dialog').waitFor();
  console.log('PASS: OAuth routing, bound Claim payload, three Instagram choices at 375 px, start errors and manual fallback (mock HTTP)');
} finally {
  await browser?.close(); await server?.close(); await unlink(harness).catch(() => {});
}
