import type { LiveCrawlResult } from '../types/api/crawler.types';

/** Keep the last image only when a recrawl refers to the same channel. */
export function mergeCrawledAvatar(next: LiveCrawlResult, previous?: LiveCrawlResult | null): LiveCrawlResult {
  const url = next.avatar_url?.trim() || next.avatarUrl?.trim();
  const username = next.username?.trim().replace(/^@+/, '').toLowerCase();
  const sameChannel = username && username === previous?.username?.trim().replace(/^@+/, '').toLowerCase()
    && next.platform?.toUpperCase() === previous?.platform?.toUpperCase()
    && (!next.author_id || !previous?.author_id || next.author_id === previous.author_id);
  const previousUrl = sameChannel ? previous?.avatar_url?.trim() || previous?.avatarUrl?.trim() : undefined;
  return {
    ...next,
    avatar_url: url || previousUrl,
    avatar_fallback_url: previousUrl && previousUrl !== url ? previousUrl : sameChannel ? previous?.avatar_fallback_url : undefined,
  };
}
