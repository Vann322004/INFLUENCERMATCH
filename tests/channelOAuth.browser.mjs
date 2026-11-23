// Browser/API contract test with mocked HTTP. Does not contact Meta or a live BE.
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
const harness = new URL('../.channel-oauth-browser.html', import.meta.url);
let server, browser;
try {
  await writeFile(harness, '<!doctype html><html><body>OAuth contract harness</body></html>', 'utf8');
  server = await createServer({ configFile: false, envDir: false, server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  const requests = [];
  let returnedFlow = 'INSTAGRAM_UNIFIED_LOGIN';
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    requests.push({ path, method: req.method(), body: req.postDataJSON() });
    let data;
    if (path.endsWith('/start')) data = { sessionId: 'session', expiresAt: new Date(Date.now() + 600000).toISOString(), authorizationUrl: 'https://www.facebook.com/dialog/oauth' };
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
  console.log('PASS: browser service routing for four flows, invitation context, confirmation and cross-flow rejection (mock HTTP)');
} finally {
  await browser?.close(); await server?.close(); await unlink(harness).catch(() => {});
}
