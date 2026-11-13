import { consumeAccountLogout, getAccessToken, getAuthSessionId, getStoredUser } from './authSession';
import { dataManagerRequestCache } from './requestCache';
import type { CacheHit } from './requestCache';

export type CachedQuery<T> = (() => Promise<T>) & {
  peek: () => CacheHit<T> | undefined;
  invalidate: () => void;
};

function scope(): string | undefined {
  if (consumeAccountLogout()) {
    window.location.assign('/login');
    return undefined;
  }
  const user = getStoredUser();
  if (!getAccessToken() || !user || !['DATA_MANAGER', 'MANAGER', 'manager'].includes(user.role)) return undefined;
  const userId = user.id ?? user.userId ?? user.email;
  if (typeof userId !== 'string' || !userId.trim()) return undefined;
  return JSON.stringify([getAuthSessionId(), userId, user.role,
    [...(user.permissions ?? [])].sort(), user.authVersion, user.status]);
}

export function createDataManagerQuery<T>(key: string, load: () => Promise<T>, options: {
  ttl?: number; tags?: readonly string[];
} = {}): CachedQuery<T> {
  const scopedKey = (session: string) => session + ':' + key;
  const query = async () => {
    const session = scope();
    if (!session) return load();
    const value = await dataManagerRequestCache.get(scopedKey(session), load, options.ttl ?? Infinity, options.tags);
    if (scope() !== session) throw new Error('Phiên đăng nhập đã thay đổi.');
    return value;
  };
  query.peek = () => {
    const session = scope();
    return session ? dataManagerRequestCache.peek<T>(scopedKey(session)) : undefined;
  };
  query.invalidate = () => {
    const session = scope();
    if (session) dataManagerRequestCache.invalidate(scopedKey(session));
  };
  return query;
}
