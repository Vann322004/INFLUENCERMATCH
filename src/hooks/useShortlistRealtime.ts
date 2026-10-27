import { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { getAccessToken } from '../services/apiClient';

export interface ShortlistRealtimeEvent {
  eventType: 'CONNECTED' | 'CRAWL_STARTED' | 'CRAWL_COMPLETED' | string;
  campaignId: string;
  creatorId?: string;
  creatorName?: string;
  platform?: string;
  userName?: string;
  avatarUrl?: string;
  followers?: number;
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
  engagementRate?: number;
  message?: string;
  timestamp?: string;
}

/**
 * Custom hook lắng nghe sự kiện Server-Sent Events (SSE) theo thời gian thực
 * cho chiến dịch Shortlist:
 * - Thông báo khi bắt đầu cào số liệu (CRAWL_STARTED)
 * - Thông báo khi cào xong (CRAWL_COMPLETED) và tự động refresh danh sách
 */
export function useShortlistRealtime(
  campaignId?: string | null,
  onCreatorUpdated?: (eventData?: ShortlistRealtimeEvent) => void
) {
  const onCreatorUpdatedRef = useRef(onCreatorUpdated);
  useEffect(() => {
    onCreatorUpdatedRef.current = onCreatorUpdated;
  }, [onCreatorUpdated]);

  useEffect(() => {
    if (!campaignId || campaignId === 'all') {
      return;
    }

    const token = getAccessToken();
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    const url = `${baseUrl}/campaigns/${campaignId}/shortlist/events`;

    const abortController = new AbortController();
    let isSubscribed = true;

    const handleEvent = (data: ShortlistRealtimeEvent) => {
      if (!isSubscribed) return;

      const creatorHandle = data.userName || data.creatorName || 'Creator';

      if (data.eventType === 'CRAWL_STARTED') {
        notification.info({
          key: `crawl_started_${data.creatorId || creatorHandle}`,
          message: 'Đang làm mới số liệu',
          description: 'Hệ thống đang cào dữ liệu mới nhất',
          placement: 'bottomRight',
          duration: 4,
        });
      } else if (data.eventType === 'CRAWL_COMPLETED') {
        notification.success({
          key: `crawl_completed_${data.creatorId || creatorHandle}`,
          message: 'Số liệu đã cập nhật!',
          description: `@${creatorHandle} đã có số liệu tương tác mới nhất.`,
          placement: 'bottomRight',
          duration: 4.5,
        });

        // Tự động gọi callback để refresh danh sách shortlist
        if (onCreatorUpdatedRef.current) {
          onCreatorUpdatedRef.current(data);
        }
      } else if (data.eventType === 'CONNECTED') {
        console.log(`[Realtime Shortlist] Đã kết nối kênh cập nhật chiến dịch ${campaignId}`);
      }
    };

    // Sử dụng fetch với ReadableStream để truyền Bearer Token chuẩn RFC và Spring Security
    const startStreaming = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            Accept: 'text/event-stream',
          },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          // Nếu fetch stream trả về lỗi, fallback thử với EventSource tiêu chuẩn
          console.warn('[Realtime Shortlist] Fetch SSE stream response not OK:', response.status);
          fallbackNativeEventSource();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (isSubscribed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split(/\r?\n/);
            let eventDataString = '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const slice = line.slice(5).trim();
                eventDataString += slice;
              }
            }

            if (eventDataString) {
              try {
                const parsed: ShortlistRealtimeEvent = JSON.parse(eventDataString);
                handleEvent(parsed);
              } catch (e) {
                console.debug('[Realtime Shortlist] Parse non-json event:', eventDataString);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || !isSubscribed) {
          return;
        }
        console.warn('[Realtime Shortlist] Lỗi kết nối stream, thử lại sau 5s...', err);
        // Tự động kết nối lại sau 5 giây nếu mạng gián đoạn
        setTimeout(() => {
          if (isSubscribed) {
            startStreaming();
          }
        }, 5000);
      }
    };

    const fallbackNativeEventSource = () => {
      if (typeof EventSource === 'undefined') return;
      try {
        const es = new EventSource(url);
        es.addEventListener('SHORTLIST_EVENT', (e: MessageEvent) => {
          try {
            const parsed: ShortlistRealtimeEvent = JSON.parse(e.data);
            handleEvent(parsed);
          } catch {
            // ignore parse err
          }
        });
        es.onerror = () => {
          es.close();
        };
        abortController.signal.addEventListener('abort', () => {
          es.close();
        });
      } catch {
        // ignore
      }
    };

    startStreaming();

    return () => {
      isSubscribed = false;
      abortController.abort();
    };
  }, [campaignId]);
}
