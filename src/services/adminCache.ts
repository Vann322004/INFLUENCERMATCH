import { consumeAccountLogout, getAccessToken, getAuthSessionId, getStoredUser } from './authSession';
import { adminRequestCache } from './requestCache';
import type { CachedQuery } from './dataManagerCache';

function scope(): string | undefined {
  if (consumeAccountLogout()) { window.location.assign('/login'); return; }
  const user = getStoredUser();
  if (!getAccessToken() || !user || !['ADMIN', 'admin', 'super_admin'].includes(user.role)) return;
  if (user.status && !['ACTIVE', 'active'].includes(user.status)) return;
  const id = user.id ?? user.userId;
  if (typeof id !== 'string' || !id.trim()) return;
  return JSON.stringify([getAuthSessionId(), id, user.role, [...(user.permissions ?? [])].sort(), user.authVersion, user.status]);
}

export const usesAdminCache = () => scope() !== undefined;

/** RAM cache scoped to one Admin identity/authorization context; other roles use the original loader. */
export function createAdminQuery<T>(key: string, load: () => Promise<T>, options: {
  ttl?: number; tags?: readonly string[];
} = {}): CachedQuery<T> {
  const query = async () => {
    const session = scope();
    if (!session) return load();
    const value = await adminRequestCache.get(session + ':' + key, load, options.ttl ?? 60_000, options.tags);
    if (scope() !== session) throw new Error('Phiên đăng nhập đã thay đổi.');
    return value;
  };
  query.peek = () => { const session = scope(); return session ? adminRequestCache.peek<T>(session + ':' + key) : undefined; };
  query.invalidate = () => { const session = scope(); if (session) adminRequestCache.invalidate(session + ':' + key); };
  return query;
}

/** Derive display values without adding a second TTL on top of the source cache. */
export function mapCachedQuery<T, U>(source: CachedQuery<T>, map: (value: T) => U): CachedQuery<U> {
  const query = async () => map(await source());
  query.peek = () => { const hit = source.peek(); return hit ? { value: map(hit.value) } : undefined; };
  query.invalidate = source.invalidate;
  return query;
}
