import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import axios from 'axios';

class Storage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

async function tab(shared = new Storage(), existing = new Storage()) {
  const redirects = [];
  const context = vm.createContext({
    localStorage: shared, sessionStorage: existing, crypto: globalThis.crypto,
    navigator: {}, structuredClone: globalThis.structuredClone, window: { location: { assign: url => redirects.push(url) } },
  });
  const modules = new Map();
  const stub = (name, values) => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [key, value] of Object.entries(values)) this.setExport(key, value);
  }, { context, identifier: name });
  modules.set('axios', stub('axios', { default: axios }));
  modules.set('./campaignService', stub('campaigns', { clearBrandCache() {} }));
  modules.set('./brandService', stub('brands', { brandService: { clearBrandCache() {} } }));
  for (const [key, file] of [
    ['./requestCache', 'src/services/requestCache.ts'],
    ['cacheFacade', 'src/services/dataManagerCache.ts'],
    ['../authSession', 'src/services/authSession.ts'],
    ['../apiClient', 'src/services/apiClient.ts'],
    ['authService', 'src/services/api/authService.ts'],
  ]) {
    const source = stripTypeScriptTypes(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));
    modules.set(key, new vm.SourceTextModule(source, { context, initializeImportMeta: meta => { meta.env = {}; } }));
  }
  const resolve = specifier => modules.get(specifier === './authSession' ? '../authSession' : specifier);
  const serviceModule = modules.get('authService');
  await serviceModule.link(resolve);
  await serviceModule.evaluate();
  const cacheFacade = modules.get('cacheFacade');
  await cacheFacade.link(resolve);
  await cacheFacade.evaluate();
  return {
    session: modules.get('../authSession').namespace,
    client: modules.get('../apiClient').namespace,
    cache: modules.get('./requestCache').namespace.dataManagerRequestCache,
    cacheApi: cacheFacade.namespace,
    auth: serviceModule.namespace.authService,
    shared, storage: existing, redirects,
  };
}

const manager = { id: 'manager-id', role: 'DATA_MANAGER' };
const brand = { id: 'brand-id', role: 'BRAND' };
const response = (config, data) => ({ config,
  data: config.url === '/auth/csrf' && Object.keys(data).length === 0
    ? { data: { token: 'masked-csrf-token', headerName: 'X-XSRF-TOKEN' } } : data,
  status: 200, statusText: 'OK', headers: {},
});
const unauthorized = config => Promise.reject(new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, {}, { status: 401, data: {} }));

test('manager cache survives token rotation, but clears on permission changes and logout', async () => {
  const a = await tab();
  const user = { ...manager, permissions: ['MANAGE_RECOMMENDATION_CONFIG'] };
  a.session.setAuthSession('token-1', undefined, user);
  let calls = 0;
  const query = a.cacheApi.createDataManagerQuery('configuration', async () => { calls++; return { version: '1' }; });
  await Promise.all([query(), query()]);
  assert.equal(calls, 1);
  a.session.setAuthSession('token-2', undefined, user);
  await query();
  assert.equal(calls, 1);
  a.session.setAuthSession('token-3', undefined, { ...user, permissions: [] });
  assert.equal(query.peek(), undefined);
  await query();
  assert.equal(calls, 2);
  a.session.clearAuthSession();
  assert.equal(query.peek(), undefined);
});

test('a previous account request cannot populate or return cached data to a new account', async () => {
  const a = await tab();
  a.session.setAuthSession('token-a', undefined, manager);
  let resolve;
  const query = a.cacheApi.createDataManagerQuery('summary', () => new Promise(done => { resolve = done; }));
  const pending = query();
  await Promise.resolve();
  a.session.setAuthSession('token-b', undefined, { id: 'other-manager', role: 'DATA_MANAGER' });
  resolve({ private: 'old-account' });
  await assert.rejects(pending, /Dữ liệu đã thay đổi|Phiên đăng nhập đã thay đổi/);
  assert.equal(query.peek(), undefined);
});

test('API writes invalidate related cache and non-manager sessions bypass it', async () => {
  const a = await tab();
  a.session.setAuthSession('manager-token', undefined, manager);
  let calls = 0;
  const query = a.cacheApi.createDataManagerQuery('niches', async () => { calls++; return []; }, { tags: ['taxonomy'] });
  await query();
  a.client.apiClient.defaults.adapter = async config => response(config, {});
  await a.client.apiClient.patch('/data/niches/123', { name: 'Updated' });
  assert.equal(query.peek(), undefined);
  await query();
  assert.equal(calls, 2);
  a.session.setAuthSession('brand-token', undefined, brand);
  await query(); await query();
  assert.equal(calls, 4);
  assert.equal(query.peek(), undefined);
});

test('tabs retain separate identities and logout does not remove another tab session', async () => {
  const a = await tab();
  a.session.setAuthSession('manager-token', undefined, manager);
  a.session.claimRefreshCookie();
  const b = await tab(a.shared);
  assert.equal(b.session.getAccessToken(), null);
  b.session.setAuthSession('brand-token', undefined, brand);
  b.session.claimRefreshCookie();
  assert.equal(a.session.getStoredUser().id, manager.id);
  a.session.clearAuthSession();
  assert.equal(b.session.getAccessToken(), 'brand-token');
  assert.equal(b.session.ownsRefreshCookie(), true);
});

test('tab reload restores its own account and legacy shared login migrates only once', async () => {
  const shared = new Storage();
  shared.setItem('access_token', 'legacy');
  shared.setItem('influencermatch_user', JSON.stringify(manager));
  const a = await tab(shared);
  assert.equal(a.session.getAccessToken(), 'legacy');
  const reloaded = await tab(shared, a.storage);
  assert.equal(reloaded.session.getStoredUser().id, manager.id);
  assert.equal((await tab(shared)).session.getAccessToken(), null);
  assert.equal(shared.getItem('access_token'), null);
});

test('late successful requests cannot return data into a new account', async () => {
  const a = await tab();
  a.session.setAuthSession('manager-token', undefined, manager);
  let finish;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  a.client.apiClient.defaults.adapter = config => new Promise(resolve => {
    finish = () => resolve(response(config, { user: manager })); started();
  });
  const pending = a.client.apiClient.get('/profile');
  await ready;
  a.session.clearAuthSession();
  a.session.setAuthSession('brand-token', undefined, brand);
  finish();
  await assert.rejects(pending, error => axios.isCancel(error));
  assert.equal(a.session.getStoredUser().id, brand.id);
});

test('refresh uses the HttpOnly cookie even when no refresh token exists in JS', async () => {
  const a = await tab();
  a.session.setAuthSession('expired', undefined, manager);
  a.session.claimRefreshCookie();
  let refreshCalls = 0;
  a.client.cookieAuthClient.defaults.adapter = async config => {
    if (config.url === '/auth/csrf') return response(config, {});
    refreshCalls++;
    return response(config, { data: { accessToken: 'renewed', user: manager } });
  };
  a.client.apiClient.defaults.adapter = config => config.headers.Authorization === 'Bearer renewed'
    ? Promise.resolve(response(config, { ok: true })) : unauthorized(config);
  const results = await Promise.all([a.client.apiClient.get('/a'), a.client.apiClient.get('/b')]);
  assert.equal(results.length, 2);
  assert.equal(refreshCalls, 1);
  assert.equal(a.session.getAccessToken(), 'renewed');
});

test('a tab cannot refresh using the cookie owned by another account', async () => {
  const a = await tab();
  a.session.setAuthSession('expired-manager', undefined, manager);
  a.session.claimRefreshCookie();
  const b = await tab(a.shared);
  b.session.setAuthSession('brand-token', undefined, brand);
  b.session.claimRefreshCookie();
  let cookieCalls = 0;
  a.client.cookieAuthClient.defaults.adapter = () => { cookieCalls++; throw Error('must not run'); };
  a.client.apiClient.defaults.adapter = unauthorized;
  await assert.rejects(a.client.apiClient.get('/manager'));
  assert.equal(cookieCalls, 0);
  assert.equal(a.session.getAccessToken(), null);
  assert.equal(b.session.getStoredUser().id, brand.id);
});

test('a delayed refresh response cannot overwrite a new login', async () => {
  const a = await tab();
  a.session.setAuthSession('expired', undefined, manager);
  a.session.claimRefreshCookie();
  let finish;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  a.client.cookieAuthClient.defaults.adapter = config => config.url === '/auth/csrf'
    ? Promise.resolve(response(config, {})) : new Promise(resolve => {
      finish = () => resolve(response(config, { data: { accessToken: 'old-refreshed', user: manager } })); started();
    });
  a.client.apiClient.defaults.adapter = unauthorized;
  const pending = a.client.apiClient.get('/profile');
  await ready;
  a.session.clearAuthSession();
  a.session.setAuthSession('brand-token', undefined, brand);
  finish();
  await assert.rejects(pending, error => axios.isCancel(error));
  assert.equal(a.session.getAccessToken(), 'brand-token');
  assert.equal(a.redirects.length, 0);
});

test('logout clears immediately and its delayed completion cannot clear a new account', async () => {
  const a = await tab();
  a.session.setAuthSession('manager-token', undefined, manager);
  a.session.claimRefreshCookie();
  let finish;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  a.client.cookieAuthClient.defaults.adapter = config => config.url === '/auth/csrf'
    ? Promise.resolve(response(config, {})) : new Promise(resolve => { finish = () => resolve(response(config, {})); started(); });
  const pending = a.auth.logout();
  assert.equal(a.session.getAccessToken(), null);
  await ready;
  a.session.setAuthSession('brand-token', undefined, brand);
  finish();
  await pending;
  assert.equal(a.session.getStoredUser().id, brand.id);
});

test('a late 401 from the previous login cannot clear or refresh the new login', async () => {
  const a = await tab();
  a.session.setAuthSession('old-manager-token', undefined, manager);
  let fail;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  a.client.apiClient.defaults.adapter = config => new Promise((_, reject) => {
    fail = () => reject(new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, {}, { status: 401, data: {} }));
    started();
  });
  const pending = a.client.apiClient.get('/manager');
  await ready;
  a.session.clearAuthSession();
  a.session.setAuthSession('brand-token', undefined, brand);
  fail();
  await assert.rejects(pending, error => axios.isCancel(error));
  assert.equal(a.session.getAccessToken(), 'brand-token');
  assert.equal(a.redirects.length, 0);
});

test('a refresh response for a different user is rejected before credentials are stored', async () => {
  const a = await tab();
  a.session.setAuthSession('manager-token', undefined, manager);
  a.session.claimRefreshCookie();
  a.client.apiClient.defaults.adapter = unauthorized;
  a.client.cookieAuthClient.defaults.adapter = async config => response(config,
    config.url === '/auth/csrf' ? {} : { data: { accessToken: 'brand-token', user: brand } });
  await assert.rejects(a.client.apiClient.get('/manager'), /không khớp/);
  assert.equal(a.session.getAccessToken(), null);
  assert.equal(a.session.getStoredUser(), null);
  assert.deepEqual(a.redirects, ['/login']);
});

test('logout does not revoke the refresh cookie of another tab', async () => {
  const a = await tab();
  a.session.setAuthSession('manager-token', undefined, manager);
  a.session.claimRefreshCookie();
  const b = await tab(a.shared);
  b.session.setAuthSession('brand-token', undefined, brand);
  b.session.claimRefreshCookie();
  a.client.cookieAuthClient.defaults.adapter = () => { throw Error('must not call logout'); };
  await a.auth.logout();
  assert.equal(b.session.getAccessToken(), 'brand-token');
  assert.equal(b.session.ownsRefreshCookie(), true);
});

test('logging out signs out all tabs of the same account and preserves other accounts', async () => {
  const a = await tab();
  const b = await tab(a.shared);
  const c = await tab(a.shared);
  a.session.setAuthSession('manager-a', undefined, manager);
  b.session.setAuthSession('manager-b', undefined, manager);
  c.session.setAuthSession('brand-c', undefined, brand);
  await a.auth.logout();
  assert.equal(a.session.getAccessToken(), null);
  assert.equal(b.session.consumeAccountLogout(), true);
  assert.equal(b.session.getAccessToken(), null);
  assert.equal(c.session.consumeAccountLogout(), false);
  assert.equal(c.session.getAccessToken(), 'brand-c');
});

test('a new login ignores the previous logout signal even when the storage event is delayed', async () => {
  const a = await tab();
  const b = await tab(a.shared);
  a.session.setAuthSession('manager-a', undefined, manager);
  b.session.setAuthSession('manager-b', undefined, manager);
  await a.auth.logout();
  b.session.clearAuthSession();
  b.session.setAuthSession('new-manager-login', undefined, manager);
  assert.equal(b.session.consumeAccountLogout(), false);
  assert.equal(b.session.getAccessToken(), 'new-manager-login');
});

test('token rotation does not hide a logout signal from another tab', async () => {
  const a = await tab();
  const b = await tab(a.shared);
  a.session.setAuthSession('manager-a', undefined, manager);
  b.session.setAuthSession('manager-b', undefined, manager);
  await a.auth.logout();
  b.session.setAuthSession('rotated-token', undefined, manager);
  assert.equal(b.session.consumeAccountLogout(), true);
  assert.equal(b.session.getAccessToken(), null);
});

test('a background tab cannot send another request after the same account logs out', async () => {
  const a = await tab();
  const b = await tab(a.shared);
  a.session.setAuthSession('manager-a', undefined, manager);
  b.session.setAuthSession('manager-b', undefined, manager);
  let requests = 0;
  b.client.apiClient.defaults.adapter = config => { requests++; return Promise.resolve(response(config, {})); };
  await a.auth.logout();
  await assert.rejects(b.client.apiClient.get('/manager'), error => axios.isCancel(error));
  assert.equal(requests, 0);
  assert.deepEqual(b.redirects, ['/login']);
});

test('a failed manager login cannot become a successful demo login', async () => {
  const a = await tab();
  a.client.cookieAuthClient.defaults.adapter = async config => response(config, {});
  a.client.apiClient.defaults.adapter = unauthorized;
  await assert.rejects(a.auth.login({ email: 'manager@influencermatch.vn', password: 'manager123' }));
  assert.equal(a.session.getAccessToken(), null);
  assert.equal(a.session.getStoredUser(), null);
  assert.equal(a.auth.hasManagementAccess(), false);
});

test('successful manager login sends the real bearer token on subsequent API calls', async () => {
  const a = await tab();
  a.client.cookieAuthClient.defaults.adapter = async config => response(config, {});
  a.client.apiClient.defaults.adapter = async config => {
    if (config.url === '/auth/login') {
      assert.equal(config.headers.get('X-XSRF-TOKEN'), 'masked-csrf-token');
      assert.equal(config.withXSRFToken, false);
      return response(config, { data: { accessToken: 'real-manager-token', user: manager } });
    }
    assert.equal(config.headers.Authorization, 'Bearer real-manager-token');
    return response(config, { data: [] });
  };
  await a.auth.login({ email: 'manager@example.com', password: 'example' });
  assert.equal(a.auth.hasManagementAccess(), true);
  await a.client.apiClient.get('/data/niches');
});

test('previously persisted demo sessions are discarded on reload', async () => {
  const storage = new Storage();
  storage.setItem('im_tab_auth_session', JSON.stringify({ id: 'old-demo', accessToken: 'mock_manager_token_123', user: manager }));
  const a = await tab(new Storage(), storage);
  assert.equal(a.session.getAccessToken(), null);
  assert.equal(a.session.getStoredUser(), null);
  assert.equal(a.auth.hasManagementAccess(), false);
});

test('legacy demo sessions are not migrated into authenticated tabs', async () => {
  const shared = new Storage();
  shared.setItem('access_token', 'mock_manager_token_123');
  shared.setItem('influencermatch_user', JSON.stringify(manager));
  const a = await tab(shared);
  assert.equal(a.session.getAccessToken(), null);
  assert.equal(a.auth.hasManagementAccess(), false);
});
