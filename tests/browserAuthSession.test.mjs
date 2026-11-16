import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
function tab(localStorage, sessionStorage = storage(), destinations = []) {
  let clears = 0;
  const source = readFileSync(new URL('../src/services/authSession.ts', import.meta.url), 'utf8')
    .replace(/^import.*;$/gm, '').replace(/export /g, '');
  const context = vm.createContext({ window: { location: { replace: path => destinations.push(path) } }, localStorage, sessionStorage, crypto: { randomUUID },
    dataManagerRequestCache: { clear() { clears++; } }, adminRequestCache: { clear() { clears++; } } });
  vm.runInContext(stripTypeScriptTypes(source) + '\nglobalThis.api = { getAuthSessionId, getAccessToken, getStoredUser, setAuthSession, clearAuthSession, consumeAccountLogout, claimRefreshCookie, ownsRefreshCookie };', context);
  return { ...context.api, clears: () => clears };
}
test('tabs share login; switching accounts invalidates the old UI and pending writes', () => {
  const shared = storage(); const a = tab(shared); const b = tab(shared);
  a.clearAuthSession(); a.setAuthSession('token-a', undefined, { id: 'a' }); a.claimRefreshCookie();
  assert.equal(b.consumeAccountLogout(), true);
  assert.equal(b.getAccessToken(), 'token-a');
  assert.equal(b.ownsRefreshCookie(), true);
  const oldId = a.getAuthSessionId();
  b.clearAuthSession(); b.setAuthSession('token-b', undefined, { id: 'b' }); b.claimRefreshCookie();
  assert.notEqual(a.getAuthSessionId(), oldId);
  assert.throws(() => a.setAuthSession('stale-token', undefined, { id: 'a' }));
  assert.equal(a.consumeAccountLogout(), true);
  assert.equal(a.getStoredUser().id, 'b');
  assert.equal(tab(shared).getStoredUser().id, 'b');
  assert.ok(a.clears() > 0);
});
test('refresh updates propagate without changing login generation or forcing navigation', () => {
  const shared = storage(); const a = tab(shared);
  a.setAuthSession('first', undefined, { id: 'a' }); a.claimRefreshCookie();
  const b = tab(shared); const id = a.getAuthSessionId();
  a.setAuthSession('rotated', undefined, { id: 'a' });
  assert.equal(b.consumeAccountLogout(), false);
  assert.equal(b.getAccessToken(), 'rotated');
  assert.equal(b.getAuthSessionId(), id);
  assert.equal(b.ownsRefreshCookie(), true);
});
test('logout clears all tabs and old tab credentials cannot resurrect a login', () => {
  const shared = storage(); const a = tab(shared);
  a.setAuthSession('first', undefined, { id: 'a' });
  const b = tab(shared); a.clearAuthSession();
  assert.equal(b.consumeAccountLogout(), true);
  assert.equal(b.getAccessToken(), null);
  const legacy = storage();
  legacy.setItem('im_tab_auth_session', JSON.stringify({ id: 'old', accessToken: 'old-token', user: { id: 'old-user' } }));
  const c = tab(shared, legacy);
  assert.equal(c.getAccessToken(), null);
  assert.equal(legacy.getItem('im_tab_auth_session'), null);
});

test('storage and focus events navigate obsolete tabs to the new account role', () => {
  const shared = storage(); const a = tab(shared);
  const handlers = {}; const destinations = [];
  const tabStorage = storage();
  const b = tab(shared, tabStorage, destinations);
  const source = readFileSync(new URL('../src/hooks/useAccountLogoutSync.ts', import.meta.url), 'utf8')
    .replace(/^import.*;$/gm, '').replace(/export /g, '');
  const notices = [];
  const context = vm.createContext({ ...b, App: { useApp: () => ({ notification: { info: notice => notices.push(notice) } }) }, SESSION_NOTICE_KEY: 'im_session_change_notice', sessionStorage: tabStorage, BROWSER_SESSION_KEY: 'im_browser_auth_session', localStorage: shared,
    useEffect: callback => callback(),
    window: { addEventListener: (name, fn) => { handlers[name] = fn; }, removeEventListener() {}, location: { replace: path => destinations.push(path) } },
    document: { addEventListener() {}, removeEventListener() {} } });
  vm.runInContext(stripTypeScriptTypes(source) + '\nuseAccountLogoutSync();', context);
  a.setAuthSession('admin-token', undefined, { id: 'admin', role: 'ADMIN' });
  handlers.storage({ storageArea: shared, key: 'im_browser_auth_session' });
  assert.equal(destinations.at(-1), '/admin/dashboard');
  assert.match(tabStorage.getItem('im_session_change_notice'), /tab/);
  vm.runInContext('useAccountLogoutSync();', context);
  assert.equal(notices.length, 1);
  assert.equal(notices[0].duration, 0);
  assert.equal(tabStorage.getItem('im_session_change_notice'), null);
  const count = destinations.length;
  a.setAuthSession('refreshed', undefined, { id: 'admin', role: 'ADMIN' });
  handlers.storage({ storageArea: shared, key: 'im_browser_auth_session' });
  assert.equal(destinations.length, count);
  a.clearAuthSession(); handlers.focus();
  assert.equal(destinations.at(-1), '/login');
});
