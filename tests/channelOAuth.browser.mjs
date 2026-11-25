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
  let duplicateInstagram = false;
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    requests.push({ path, method: req.method(), body: req.postDataJSON() });
    let data;
    if (path.endsWith('/connection-options')) {
      data = [
        { platform: 'FACEBOOK', oauthFlow: 'FACEBOOK_LOGIN', available: true, supported: true },
        { platform: 'INSTAGRAM', oauthFlow: 'INSTAGRAM_UNIFIED_LOGIN', available: true, supported: true },
        { platform: 'TIKTOK', oauthFlow: 'TIKTOK_LOGIN', available: false, supported: true },
      ];
      if (duplicateInstagram) data.push({ platform: 'INSTAGRAM', oauthFlow: 'INSTAGRAM_LOGIN', available: true, supported: true });
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
  console.log('PASS: OAuth routing and session isolation, one option per supported platform, and bound Claim payload (mock HTTP)');
} finally {
  await browser?.close(); await server?.close(); await unlink(harness).catch(() => {});
}
