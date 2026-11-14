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
