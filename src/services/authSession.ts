// Credentials belong to a tab; localStorage carries cookie ownership and
// account-specific logout signals, never another tab's active identity.
import { dataManagerRequestCache } from './requestCache';
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'influencermatch_user',
};
const SESSION_KEY = 'im_tab_auth_session';
const COOKIE_OWNER_KEY = 'im_refresh_cookie_owner';
export const ACCOUNT_LOGOUT_PREFIX = 'im_account_logout:';
const identity = (user: any): string | null => user?.id || user?.userId || user?.email?.toLowerCase() || null;
const cacheIdentity = (user: any) => JSON.stringify([identity(user), user?.role,
  [...(user?.permissions ?? [])].sort(), user?.authVersion, user?.status]);
const logoutKey = (userId: string) => `${ACCOUNT_LOGOUT_PREFIX}${encodeURIComponent(userId)}`;

interface Session {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  user: any;
  logoutMarker: string | null;
}

const emptySession = (): Session => ({ id: crypto.randomUUID(), accessToken: null, refreshToken: null, user: null, logoutMarker: null });
let session: Session = (() => {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Session;
      if (parsed?.id && !parsed.accessToken?.startsWith('mock_')) return parsed;
      const clean = emptySession();
      if (localStorage.getItem(COOKIE_OWNER_KEY) === parsed?.id) localStorage.removeItem(COOKIE_OWNER_KEY);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
      return clean;
    } catch { /* Replace invalid data. */ }
  }
  const initial = emptySession();
  // Migrate the existing login once, then stop sharing credentials across tabs.
  const legacyToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (legacyToken && !legacyToken.startsWith('mock_')) {
    initial.accessToken = legacyToken;
    initial.refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    try { initial.user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'); } catch { /* No profile. */ }
  }
  const userId = identity(initial.user);
  if (userId) initial.logoutMarker = localStorage.getItem(logoutKey(userId));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(initial));
  if (initial.accessToken) localStorage.setItem(COOKIE_OWNER_KEY, initial.id);
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  return initial;
})();

const persist = () => sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
const sessionListeners = new Set<() => void>();
export const subscribeAuthSession = (listener: () => void) => {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
};
const notifySession = () => sessionListeners.forEach(listener => listener());
export const getAuthSessionId = () => session.id;
export const getAccessToken = () => session.accessToken;
export const getRefreshToken = () => session.refreshToken;
export const getStoredUser = () => session.user;
export const ownsRefreshCookie = () => localStorage.getItem(COOKIE_OWNER_KEY) === session.id;
export const hasRefreshCookieOwner = () => localStorage.getItem(COOKIE_OWNER_KEY) !== null;
export const claimRefreshCookie = () => localStorage.setItem(COOKIE_OWNER_KEY, session.id);
export const withAuthCookieLock = <T>(action: () => Promise<T>): Promise<T> =>
  typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('im-auth-cookie', action)
    : action();

export const setAuthSession = (accessToken: string, refreshToken?: string, user?: unknown) => {
  if (!accessToken || accessToken.startsWith('mock_')) {
    throw new Error('Không nhận được phiên đăng nhập hợp lệ từ máy chủ. Vui lòng đăng nhập lại.');
  }
  if (user !== undefined && cacheIdentity(user) !== cacheIdentity(session.user)) dataManagerRequestCache.clear();
  const userId = identity(user);
  if (userId && userId !== identity(session.user)) {
    session.logoutMarker = localStorage.getItem(logoutKey(userId));
  }
  if (accessToken) session.accessToken = accessToken;
  if (refreshToken !== undefined) session.refreshToken = refreshToken || null;
  if (user !== undefined) session.user = user;
  persist();
  notifySession();
};

export const clearAuthSession = () => {
  dataManagerRequestCache.clear();
  if (ownsRefreshCookie()) localStorage.removeItem(COOKIE_OWNER_KEY);
  session = emptySession();
  // Keep unrelated tab state; login/logout must not clear all sessionStorage.
  Object.values(STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));
  sessionStorage.removeItem('im_cached_brand_profile');
  persist();
  notifySession();
};

export const publishAccountLogout = () => {
  const userId = identity(session.user);
  if (userId) localStorage.setItem(logoutKey(userId), crypto.randomUUID());
};

// Compare the current marker rather than a queued StorageEvent's value. A new
// login acknowledges old logout events, even if those events arrive late.
export const consumeAccountLogout = (): boolean => {
  const userId = identity(session.user);
  if (!session.accessToken || !userId) return false;
  const marker = localStorage.getItem(logoutKey(userId));
  if (!marker || marker === (session.logoutMarker ?? null)) return false;
  clearAuthSession();
  return true;
};
