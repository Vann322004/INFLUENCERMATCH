import test from 'node:test';
import assert from 'node:assert/strict';
import { consentUrl, matchesOAuthSession } from '../src/services/channelOAuthContract.ts';
import { channelOAuthReturn } from '../api/proxy.js';

const origin = 'https://test.example';
const state = 'a'.repeat(64);
function url(changes = {}) {
  const params = new URLSearchParams({ client_id: '976403021867954', config_id: '1176260962020417',
    response_type: 'code', state, redirect_uri: origin + '/api/v1/integrations/instagram-unified/callback', ...changes });
  return 'https://www.facebook.com/v26.0/dialog/oauth?' + params;
}
test('Unified navigation uses config_id and exact same-origin callback', () => {
  assert.equal(consentUrl(url(), 'INSTAGRAM_UNIFIED_LOGIN', origin), url());
  for (const change of [{ scope: 'instagram_basic' }, { config_id: '' }, { state: 'bad' },
    { redirect_uri: 'https://attacker.invalid/api/v1/integrations/instagram-unified/callback' },
    { redirect_uri: origin + '/api/v1/integrations/meta/callback' }, { response_type: 'token' }]) {
    assert.throws(() => consentUrl(url(change), 'INSTAGRAM_UNIFIED_LOGIN', origin));
  }
  assert.throws(() => consentUrl(url().replace('www.facebook.com', 'www.facebook.com.attacker.invalid'), 'INSTAGRAM_UNIFIED_LOGIN', origin));
});
test('session read cannot mix Unified, Direct or Facebook flows', () => {
  const session = { sessionId: 'session', platform: 'INSTAGRAM', oauthFlow: 'INSTAGRAM_UNIFIED_LOGIN', status: 'READY',
    accounts: [{ accountId: '178400001', matchStatus: 'AVAILABLE' }] };
  assert.equal(matchesOAuthSession(session, 'session', 'INSTAGRAM_UNIFIED_LOGIN'), true);
  assert.equal(matchesOAuthSession(session, 'session', 'INSTAGRAM_LOGIN'), false);
  assert.equal(matchesOAuthSession(session, 'other', 'INSTAGRAM_UNIFIED_LOGIN'), false);
  assert.equal(matchesOAuthSession({ ...session, status: 'AUTHORIZED' }, 'session', 'INSTAGRAM_UNIFIED_LOGIN'), false);
  assert.equal(matchesOAuthSession({ ...session, accounts: [{ accountId: '1', matchStatus: 'UNKNOWN' }] }, 'session', 'INSTAGRAM_UNIFIED_LOGIN'), false);
});
test('all browser callbacks discard sensitive query parameters without declaring success', () => {
  const req = { method: 'GET', headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate' } };
  for (const provider of ['meta', 'instagram', 'instagram-unified', 'tiktok']) {
    const path = '/api/v1/integrations/' + provider + '/callback';
    assert.equal(channelOAuthReturn(req, path, new URLSearchParams({ code: 'private-code', state: 'private-state' }), 200), '/creator/social-accounts?oauth=return');
    assert.equal(channelOAuthReturn(req, path, new URLSearchParams({ error: 'access_denied' }), 403), '/creator/social-accounts?oauth=cancelled');
    assert.equal(channelOAuthReturn({ ...req, headers: { accept: 'application/json' } }, path, new URLSearchParams(), 200), null);
  }
  assert.equal(channelOAuthReturn(req, '/not-a-callback', new URLSearchParams(), 200), null);
});
