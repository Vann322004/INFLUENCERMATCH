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
    import { createElement, useCallback, useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { BrowserRouter } from 'react-router-dom';
    import ChannelVerification from '/src/pages/creator/portal/ChannelVerification.tsx';
    window.mountChannelVerification = (reloadResult = [{ id: 'creator' }], initialLinked = []) => {
      function Harness() {
        const [linked, setLinked] = useState(initialLinked);
        const reloadLinked = useCallback(async () => {
          setLinked(reloadResult.map(channel => ({ platform: 'TIKTOK', externalId: channel.id, ...channel })));
          return reloadResult;
        }, []);
        return createElement(ChannelVerification, { canVerify: true, canViewClaims: false,
          linked, linkedError: null, reloadLinked });
      }
      createRoot(document.getElementById('harness')).render(
        createElement(BrowserRouter, {}, createElement(Harness)),
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
  let sessionPlatform = 'INSTAGRAM';
  let sessionAccounts = [{ accountId: '178400001', matchStatus: 'AVAILABLE' }];
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    requests.push({ path, method: req.method(), body: req.postDataJSON() });
    let data;
    if (req.method() === 'DELETE' && path.endsWith('/creators/portal/accounts/extra-tiktok')) {
      await route.fulfill({ status: 204 });
      return;
    }
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
    else if (path.endsWith('/connect/tiktok/sessions/session')) {
      data = { sessionId: 'session', platform: 'TIKTOK', status: 'COMPLETED', creatorId: 'new-tiktok-channel' };
    }
    else if (path.endsWith('/cooperation-invitations/context')) {
      data = { status: 'NEEDS_CHANNEL_VERIFICATION', channels: [{ creatorId: 'invited-channel', platform: 'FACEBOOK', username: 'invited' }] };
    }
    else data = { sessionId: 'session', platform: sessionPlatform, oauthFlow: returnedFlow, status: 'READY', accounts: sessionAccounts };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  const harnessUrl = `http://127.0.0.1:${server.httpServer.address().port}/.channel-oauth-browser.html`;
  await page.goto(harnessUrl);
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
  async function returnFromOAuth(flow, { reloadResult, fromInvitation = false } = {}) {
    await page.goto(harnessUrl);
    await page.waitForFunction(() => typeof window.mountChannelVerification === 'function');
    await page.evaluate(async ({ flow, fromInvitation, reloadResult }) => {
      const { getAuthSessionId } = await import('/src/services/authSession.ts');
      const { forgetCooperation, rememberCooperation, rememberCooperationTarget } =
        await import('/src/services/cooperationContinuation.ts');
      forgetCooperation();
      if (fromInvitation) {
        rememberCooperation('a'.repeat(64));
        rememberCooperationTarget({ creatorId: 'invited-channel', platform: 'FACEBOOK', username: 'invited' });
      }
      sessionStorage.setItem('creator.channel-oauth', JSON.stringify({
        id: 'session', expiresAt: new Date(Date.now() + 600000).toISOString(),
        authSessionId: getAuthSessionId(), flow,
      }));
      window.mountChannelVerification(reloadResult);
    }, { flow, fromInvitation, reloadResult });
  }
  const radio = name => page.getByRole('radio', { name });
  const link = page.getByRole('button', { name: 'Liên kết kênh', exact: true });
  const create = page.getByRole('button', { name: 'Tạo và liên kết kênh', exact: true });
  const confirmRequests = () => requests.filter(req => req.path.endsWith('/confirm'));

  await page.setViewportSize({ width: 1280, height: 900 });
  returnedFlow = 'FACEBOOK_LOGIN';
  sessionPlatform = 'FACEBOOK';
  sessionAccounts = [
    { accountId: '178400001', creatorId: 'known-channel', name: 'Trang có hồ sơ', matchStatus: 'AVAILABLE' },
    { accountId: '178400002', name: 'Trang mới', matchStatus: 'CAN_CREATE' },
  ];
  await returnFromOAuth('FACEBOOK_LOGIN');
  await link.waitFor();
  assert.equal(await link.isDisabled(), true);
  await radio(/Trang có hồ sơ/).check();
  assert.equal(await link.isEnabled(), true);
  await radio(/Trang mới/).check();
  assert.equal(await radio(/Trang có hồ sơ/).isChecked(), false);
  assert.equal(await create.isEnabled(), true);
  const previousConfirms = confirmRequests().length;
  await create.evaluate(button => { button.click(); button.click(); });
  await page.getByText('Kênh đã được liên kết.', { exact: true }).waitFor();
  await page.goto(harnessUrl);
  await page.evaluate(async () => {
    const { setAuthSession } = await import('/src/services/authSession.ts');
    setAuthSession('fixture-access-token', undefined, { id: 'creator-user', role: 'CREATOR', status: 'ACTIVE' });
    sessionStorage.removeItem('creator.channel-oauth');
    const keep = { id: 'keep-tiktok', platform: 'TIKTOK', externalId: '101', displayName: 'Kênh giữ lại' };
    window.mountChannelVerification([keep], [keep, { ...keep, id: 'extra-tiktok', displayName: 'Kênh cần gỡ' }]);
  });
  await page.getByText('Hãy gỡ các kênh trùng để mỗi nền tảng chỉ còn một kênh.').waitFor();
  await page.locator('.creator-mini-row').filter({ hasText: 'Kênh cần gỡ' })
    .getByRole('button', { name: 'Gỡ liên kết' }).click();
  const unlinkDialog = page.getByRole('dialog', { name: 'Gỡ liên kết kênh' });
  await unlinkDialog.getByText('Kênh cần gỡ').waitFor();
  await unlinkDialog.getByRole('button', { name: 'Gỡ liên kết' }).click();
  await page.getByText('Đã gỡ liên kết kênh.', { exact: true }).waitFor();
  await page.locator('.creator-mini-row').filter({ hasText: 'Kênh cần gỡ' }).waitFor({ state: 'detached' });
  assert.equal(await page.getByText('Kênh giữ lại', { exact: true }).count(), 1);
  assert.deepEqual(confirmRequests().slice(previousConfirms).map(req => req.body), [{ accountId: '178400002' }]);

  await page.setViewportSize({ width: 375, height: 812 });
  returnedFlow = 'INSTAGRAM_LOGIN';
  sessionPlatform = 'INSTAGRAM';
  sessionAccounts = [
    { accountId: '178400001', name: 'Kênh mới', matchStatus: 'CAN_CREATE' },
    { accountId: '178400002', name: 'Kênh thiếu bằng chứng', matchStatus: 'INSUFFICIENT_EVIDENCE' },
  ];
  await returnFromOAuth('INSTAGRAM_LOGIN');
  await radio(/Kênh mới/).check();
  assert.equal(await radio(/Kênh thiếu bằng chứng/).isDisabled(), true);
  assert.equal(await create.isEnabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Gửi bằng chứng', exact: true }).count(), 0);
  sessionAccounts[0] = { ...sessionAccounts[0], matchStatus: 'UNAVAILABLE', matchReason: 'OWNERSHIP_CONFLICT' };
  await page.getByRole('button', { name: 'Kiểm tra lại phiên', exact: true }).click();
  await page.getByText('Chưa có kênh đủ điều kiện liên kết.', { exact: true }).waitFor();
  assert.equal(await radio(/Kênh mới/).isChecked(), false);
  assert.equal(await link.isDisabled(), true);

  returnedFlow = 'FACEBOOK_LOGIN';
  sessionPlatform = 'FACEBOOK';
  sessionAccounts = [
    { accountId: '178400001', creatorId: 'invited-channel', name: 'Trang được mời', matchStatus: 'AVAILABLE' },
    { accountId: '178400002', creatorId: 'other-channel', name: 'Trang khác', matchStatus: 'AVAILABLE' },
  ];
  await returnFromOAuth('FACEBOOK_LOGIN', { fromInvitation: true });
  await radio(/Trang được mời/).check();
  assert.equal(await radio(/Trang khác/).isDisabled(), true);
  await link.click();
  await page.waitForURL('**/cooperation-invitations');
  assert.deepEqual(confirmRequests().at(-1).body, { accountId: '178400001' });

  await returnFromOAuth('TIKTOK_LOGIN', { reloadResult: [{ id: 'another-channel' }] });
  await page.getByText('BE đã xác nhận phiên. Chưa đọc được kênh vừa liên kết, hãy kiểm tra lại phiên.', { exact: true }).waitFor();
  assert.equal(await page.getByText('Kênh đã được liên kết.', { exact: true }).count(), 0);
  await returnFromOAuth('TIKTOK_LOGIN', { reloadResult: [{ id: 'new-tiktok-channel' }] });
  await page.getByText('Kênh đã được liên kết.', { exact: true }).waitFor();
  console.log('PASS: OAuth routing, single-channel selection, duplicate-click protection, invitation scope, and TikTok linked-channel reload (mock HTTP)');
} finally {
  await browser?.close(); await server?.close(); await unlink(harness).catch(() => {});
}
