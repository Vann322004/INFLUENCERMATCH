import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getAccessToken, getAuthSessionId, getStoredUser, subscribeAuthSession, consumeAccountLogout } from '../services/authSession';

export interface ShortlistRealtimeEvent { campaignId: string; eventType: string; creatorId?: string; metricId?: string; timestamp?: string }
const sessionKey = () => { const user = getStoredUser(); return JSON.stringify([getAuthSessionId(), getAccessToken(), user?.id, user?.role, user?.authVersion, user?.permissions]); };
export function useShortlistRealtime(campaignId?: string | null, onUpdated?: (event?: ShortlistRealtimeEvent) => void) {
  const callback = useRef(onUpdated); callback.current = onUpdated;
  const [session, setSession] = useState(sessionKey);
  const [status, setStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'unavailable'>('unavailable');
  useEffect(() => subscribeAuthSession(() => setSession(sessionKey())), []);
  useEffect(() => {
    if (!campaignId || !getAccessToken() || !getStoredUser()?.permissions?.includes('MANAGE_OWN_SHORTLIST')) return;
    const abort = new AbortController(); let retry: ReturnType<typeof setTimeout> | undefined, sync: ReturnType<typeof setTimeout> | undefined;
    let stable: ReturnType<typeof setTimeout> | undefined, attempt = 0;
    const refresh = (event?: ShortlistRealtimeEvent) => { clearTimeout(sync); sync = setTimeout(() => { if (!abort.signal.aborted) callback.current?.(event); }, 150); };
    const connect = async () => {
      if (abort.signal.aborted || consumeAccountLogout()) return;
      setStatus(attempt ? 'reconnecting' : 'connecting');
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        const base = String(apiClient.defaults.baseURL ?? '/api/v1').replace(/\/$/, '');
        const response = await fetch(`${base}/campaigns/${encodeURIComponent(campaignId)}/shortlist/events`, {
          signal: abort.signal, credentials: 'include', headers: { Authorization: `Bearer ${getAccessToken()}`, Accept: 'text/event-stream' },
        });
        if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
          await response.body?.cancel();
          if ([401,403,404].includes(response.status)) { setStatus('unavailable'); return; }
          throw new Error('SSE unavailable');
        }
        reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
        while (!abort.signal.aborted) {
          const { done, value } = await reader.read(); if (done) throw new Error('SSE disconnected');
          buffer += decoder.decode(value, { stream: true });
          let match: RegExpExecArray | null;
          while ((match = /\r\n\r\n|\n\n/.exec(buffer))) {
            const block = buffer.slice(0, match.index); buffer = buffer.slice(match.index + match[0].length);
            const lines = block.split(/\r?\n/);
            if (!lines.some(line => line.trim() === 'event:SHORTLIST_EVENT' || line.trim() === 'event: SHORTLIST_EVENT')) continue;
            const raw = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
            const event = JSON.parse(raw) as ShortlistRealtimeEvent;
            if (event.campaignId !== campaignId || abort.signal.aborted) continue;
            if (event.eventType === 'CONNECTED') {
              setStatus('live'); clearTimeout(stable); stable = setTimeout(() => { attempt = 0; }, 30_000); refresh(event);
            } else if (['CRAWL_REQUESTED','CRAWL_REQUEST_FAILED','CRAWL_COMPLETED'].includes(event.eventType)) refresh(event);
          }
          if (buffer.length > 1_000_000) throw new Error('SSE event too large');
        }
      } catch {
        if (!abort.signal.aborted) { clearTimeout(stable); setStatus('reconnecting'); refresh();
          retry = setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5))); }
      } finally { await reader?.cancel().catch(() => {}); reader?.releaseLock(); }
    };
    void connect();
    const focus = () => { if (!consumeAccountLogout()) refresh(); };
    window.addEventListener('focus', focus);
    return () => { abort.abort(); clearTimeout(retry); clearTimeout(sync); clearTimeout(stable); window.removeEventListener('focus', focus); };
  }, [campaignId, session]);
  return status;
}
