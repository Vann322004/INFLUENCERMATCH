import { getAuthSessionId } from './authSession';
import type { LiveCrawlResult } from '../types/api/crawler.types';

export type CollectionSource = 'manual' | 'automatic';
export interface CollectionResult {
  id: string;
  sources: CollectionSource[];
  result: LiveCrawlResult;
  savedAt: string;
}
export const collectionIdentity = (platform: string, username: string) =>
  `${platform.toUpperCase()}:${username.replace(/^@+/, '').toLowerCase()}`;
const storageKey = () => `im_collection:${getAuthSessionId()}:reviewResults`;
const dismissedStorageKey = () => `im_collection:${getAuthSessionId()}:dismissedIds`;
const dismissedReasonsKey = () => `im_collection:${getAuthSessionId()}:dismissedReasons`;

export function readDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(dismissedStorageKey()) || sessionStorage.getItem(dismissedStorageKey()) || '[]';
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function readDismissedReasons(): Record<string, string> {
  try {
    const raw = localStorage.getItem(dismissedReasonsKey()) || sessionStorage.getItem(dismissedReasonsKey()) || '{}';
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function dismissCollectionResult(id: string, reason?: string) {
  const current = readDismissedIds();
  current.add(id);
  const reasons = readDismissedReasons();
  if (reason) reasons[id] = reason;
  try {
    const serialized = JSON.stringify([...current]);
    localStorage.setItem(dismissedStorageKey(), serialized);
    sessionStorage.setItem(dismissedStorageKey(), serialized);
    const reasonsSerialized = JSON.stringify(reasons);
    localStorage.setItem(dismissedReasonsKey(), reasonsSerialized);
    sessionStorage.setItem(dismissedReasonsKey(), reasonsSerialized);
    window.dispatchEvent(new Event('im-collection-results'));
  } catch {}
}

export function dismissBatchCollectionResults(ids: string[], reason?: string) {
  const current = readDismissedIds();
  const reasons = readDismissedReasons();
  ids.forEach(id => {
    current.add(id);
    if (reason) reasons[id] = reason;
  });
  try {
    const serialized = JSON.stringify([...current]);
    localStorage.setItem(dismissedStorageKey(), serialized);
    sessionStorage.setItem(dismissedStorageKey(), serialized);
    const reasonsSerialized = JSON.stringify(reasons);
    localStorage.setItem(dismissedReasonsKey(), reasonsSerialized);
    sessionStorage.setItem(dismissedReasonsKey(), reasonsSerialized);
    window.dispatchEvent(new Event('im-collection-results'));
  } catch {}
}

export function restoreCollectionResult(id: string) {
  const current = readDismissedIds();
  current.delete(id);
  const reasons = readDismissedReasons();
  delete reasons[id];
  try {
    const serialized = JSON.stringify([...current]);
    localStorage.setItem(dismissedStorageKey(), serialized);
    sessionStorage.setItem(dismissedStorageKey(), serialized);
    const reasonsSerialized = JSON.stringify(reasons);
    localStorage.setItem(dismissedReasonsKey(), reasonsSerialized);
    sessionStorage.setItem(dismissedReasonsKey(), reasonsSerialized);
    window.dispatchEvent(new Event('im-collection-results'));
  } catch {}
}

export function readCollectionResults(): CollectionResult[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey()) || '[]');
    return Array.isArray(saved) ? saved.filter(row => row?.id && row?.result?.username && Array.isArray(row.sources)) : [];
  } catch { return []; }
}

export function saveCollectionResults(results: LiveCrawlResult[], source: CollectionSource) {
  const records = new Map(readCollectionResults().map(row => [row.id, row]));
  for (const result of results) {
    if (result.status !== 'success' || !result.username) continue;
    const id = collectionIdentity(result.platform, result.username);
    const previous = records.get(id);
    records.set(id, {
      id, result, savedAt: new Date().toISOString(),
      sources: Array.from(new Set([...(previous?.sources || []), source])),
    });
  }
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify([...records.values()]));
    window.dispatchEvent(new Event('im-collection-results'));
  } catch { /* Keep the current crawl visible if browser storage is unavailable. */ }
}
