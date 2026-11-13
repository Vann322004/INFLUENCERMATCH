export interface CacheHit<T> { value: T }

interface Entry {
  tags: readonly string[];
  hasValue: boolean;
  value?: unknown;
  expiresAt: number;
  pending?: Promise<unknown>;
}

/** RAM only. Invalidated requests cannot repopulate a cleared cache. */
export function createRequestCache(now: () => number = Date.now) {
  const entries = new Map<string, Entry>();
  const copy = <T>(value: T): T => structuredClone(value);

  function peek<T>(key: string): CacheHit<T> | undefined {
    const entry = entries.get(key);
    if (!entry?.hasValue) return undefined;
    if (entry.expiresAt <= now()) {
      entries.delete(key);
      return undefined;
    }
    return { value: copy(entry.value as T) };
  }

  function get<T>(key: string, load: () => Promise<T>, ttl: number, tags: readonly string[] = []): Promise<T> {
    const hit = peek<T>(key);
    if (hit) return Promise.resolve(hit.value);
    const pending = entries.get(key)?.pending;
    if (pending) return pending.then(value => copy(value as T));

    const entry: Entry = { tags, hasValue: false, expiresAt: 0 };
    entries.set(key, entry);
    entry.pending = Promise.resolve().then(load).then(value => {
      if (entries.get(key) !== entry) throw new Error('Dữ liệu đã thay đổi. Vui lòng thử lại.');
      entry.value = copy(value);
      entry.hasValue = true;
      entry.expiresAt = now() + ttl;
      entry.pending = undefined;
      return value;
    }).catch(error => {
      if (entries.get(key) === entry) entries.delete(key);
      throw error;
    });
    return entry.pending.then(value => copy(value as T));
  }

  return {
    peek, get,
    invalidate: (key: string) => { entries.delete(key); },
    invalidateTags: (tags: readonly string[]) => {
      for (const [key, entry] of entries) if (entry.tags.some(tag => tags.includes(tag))) entries.delete(key);
    },
    clear: () => entries.clear(),
  };
}

export const dataManagerRequestCache = createRequestCache();

export function invalidateDataManagerCacheForMutation(method: string | undefined, url: string | undefined) {
  if (!method || ['get', 'head', 'options'].includes(method.toLowerCase())) return;
  const path = (url ?? '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1(?=\/)/, '').split('?')[0];
  if (/\/data\/niches(?:\/|$)/.test(path)) {
    dataManagerRequestCache.invalidateTags(['taxonomy', 'creator-data']);
  } else if (/\/recommendation-config(?:\/|$)/.test(path)) {
    dataManagerRequestCache.invalidateTags(['recommendation-config']);
  } else if (/\/(?:creators?|creator-[^/]+|data-quality|quality|crawl|crawler)(?:\/|$)/.test(path)) {
    dataManagerRequestCache.invalidateTags(['creator-data', 'crawler-data']);
  }
}
