// Every tab on this origin uses one browser-wide login.
import { dataManagerRequestCache, adminRequestCache } from './requestCache';
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

// A single atomic record is authoritative for every tab on this origin.
// Never restore old per-tab credentials: they may belong to another account.
export const BROWSER_SESSION_KEY = 'im_browser_auth_session';
export const SESSION_NOTICE_KEY = 'im_session_change_notice';
const emptySession = (): Session => ({ id: crypto.randomUUID(), accessToken: null, refreshToken: null, user: null, logoutMarker: null });
const readBrowserSession = (): Session | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(BROWSER_SESSION_KEY) || 'null');
    return saved?.id && (!saved.accessToken || (typeof saved.accessToken === 'string' && !saved.accessToken.startsWith('mock_'))) ? saved : null;
  } catch { return null; }
};
let session: Session = (() => {
  sessionStorage.removeItem(SESSION_KEY);
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  const saved = readBrowserSession();
  if (saved) return saved;
  const initial = emptySession();
  localStorage.setItem(BROWSER_SESSION_KEY, JSON.stringify(initial));
  localStorage.removeItem(COOKIE_OWNER_KEY);
  return initial;
})();
let requiresNavigation = false;
const persist = () => localStorage.setItem(BROWSER_SESSION_KEY, JSON.stringify(session));
const sessionListeners = new Set<() => void>();
export const subscribeAuthSession = (listener: () => void) => {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
};
const notifySession = () => sessionListeners.forEach(listener => listener());
export const getAuthSessionId = () => readBrowserSession()?.id ?? session.id;
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
  if (readBrowserSession()?.id !== session.id) throw new Error('Session changed in another tab.');
  if (!accessToken || accessToken.startsWith('mock_')) {
    throw new Error('Không nhận được phiên đăng nhập hợp lệ từ máy chủ. Vui lòng đăng nhập lại.');
  }
  if (user !== undefined && cacheIdentity(user) !== cacheIdentity(session.user)) {
    dataManagerRequestCache.clear(); adminRequestCache.clear();
  }
  const userId = identity(user);
  if (userId && userId !== identity(session.user)) {
    session.logoutMarker = localStorage.getItem(logoutKey(userId));
  }
  if (!session.accessToken || (userId && userId !== identity(session.user))) {
    session.id = crypto.randomUUID();
    claimRefreshCookie();
  }
  if (accessToken) session.accessToken = accessToken;
  if (refreshToken !== undefined) session.refreshToken = refreshToken || null;
  if (user !== undefined) session.user = user;
  persist();
  notifySession();
};

export const clearAuthSession = () => {
  dataManagerRequestCache.clear();
  adminRequestCache.clear();
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

// Return true when the mounted UI belongs to an obsolete login. Callers must
// discard pending responses and navigate before rendering another account's data.
export const redirectToCurrentAccount = () => {
  const role = session.user?.role?.toUpperCase();
  const destination = !session.accessToken ? '/login'
    : ['ADMIN', 'SUPER_ADMIN'].includes(role) ? '/admin/dashboard'
    : ['MANAGER', 'DATA_MANAGER'].includes(role) ? '/data-manager/dashboard'
    : ['CREATOR', 'INFLUENCER'].includes(role) ? '/creator/dashboard'
    : '/dashboard';
  if (typeof window !== 'undefined') window.location.replace(destination);
};

export const consumeAccountLogout = (): boolean => {
  const shared = readBrowserSession();
  if (!shared) return false;
  const changed = shared.id !== session.id;
  if (changed || shared.accessToken !== session.accessToken || cacheIdentity(shared.user) !== cacheIdentity(session.user)) {
    if (changed || cacheIdentity(shared.user) !== cacheIdentity(session.user)) {
      dataManagerRequestCache.clear();
      adminRequestCache.clear();
    }
    session = shared;
    if (changed) {
      sessionStorage.removeItem('im_cached_brand_profile');
      sessionStorage.removeItem('current_campaign_id');
      const account = shared.user?.displayName || shared.user?.fullName || shared.user?.email;
      const role = shared.user?.role?.toUpperCase();
      const roleName = ['MANAGER', 'DATA_MANAGER'].includes(role) ? 'Quản lý'
        : ['ADMIN', 'SUPER_ADMIN'].includes(role) ? 'Quản trị viên'
        : ['CREATOR', 'INFLUENCER'].includes(role) ? 'Nhà sáng tạo' : 'Thương hiệu';
      sessionStorage.setItem(SESSION_NOTICE_KEY, shared.accessToken
        ? `Tài khoản đã được thay đổi ở tab khác. Tab này đã chuyển sang tài khoản ${account || roleName} (${roleName}).`
        : 'Bạn đã đăng xuất ở tab khác. Phiên đăng nhập trên tab này đã kết thúc. Vui lòng đăng nhập lại.');
      requiresNavigation = true;
      redirectToCurrentAccount();
    }
    notifySession();
  }
  return requiresNavigation;
};
