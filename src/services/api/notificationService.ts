import { apiClient, getAccessToken } from '../apiClient';
import { readPage } from './pageResponse';
import type { PageResponse } from '../../types/api/common.types';

export interface NotificationDto {
  id: string; userId: string; type: string; title: string; message: string;
  entityType: string | null; entityId: string | null; readAt: string | null; createdAt: string; read: boolean;
}
const dataOf = (value: any): any => {
  if (value?.success === false) throw new Error('Không thể tải thông báo.');
  return value?.data ?? value;
};
export function readNotification(raw: any): NotificationDto {
  const read = raw?.read ?? raw?.isRead;
  if (!raw || !['id', 'userId', 'type', 'title', 'message', 'createdAt'].every(key => typeof raw[key] === 'string')
    || !raw.id || !raw.userId || typeof read !== 'boolean') throw new Error('Dữ liệu thông báo không hợp lệ.');
  return { id: raw.id, userId: raw.userId, type: raw.type, title: raw.title, message: raw.message,
    createdAt: raw.createdAt, read, readAt: raw.readAt ?? null, entityType: raw.entityType ?? null, entityId: raw.entityId ?? null };
}
function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Số lượng thông báo không hợp lệ.');
  return value;
}

/** Parses Spring SSE frames across UTF-8 chunks, including CRLF, comments and multiline data. */
export function createNotificationParser(emit: (event: string, data: unknown) => void) {
  let buffer = '';
  return (text: string) => {
    buffer += text;
    let match: RegExpExecArray | null;
    while ((match = /\r\n\r\n|\n\n|\r\r/.exec(buffer))) {
      const frame = buffer.slice(0, match.index); buffer = buffer.slice(match.index + match[0].length);
      let event = 'message'; const lines: string[] = [];
      for (const line of frame.split(/\r\n|\n|\r/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) lines.push(line.slice(5).replace(/^ /, ''));
      }
      if (!lines.length || !['CONNECTED', 'NOTIFICATION'].includes(event)) continue;
      let data: unknown;
      try { data = JSON.parse(lines.join('\n')); } catch { throw new Error('Sự kiện thông báo không hợp lệ.'); }
      emit(event, data);
    }
    if (buffer.length > 1_000_000) throw new Error('Sự kiện thông báo quá lớn.');
  };
}

export const notificationService = {
  async getNotifications(page = 0, size = 20, signal?: AbortSignal): Promise<PageResponse<NotificationDto>> {
    const response = await apiClient.get('/notifications', { params: { page, size }, signal });
    const result = readPage<unknown>(response.data);
    return { ...result, items: result.items.map(readNotification) };
  },
  async getUnreadCount(signal?: AbortSignal): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count', { signal });
    return count(dataOf(response.data)?.unreadCount);
  },
  async markAsRead(id: string, signal?: AbortSignal): Promise<NotificationDto> {
    const response = await apiClient.patch(`/notifications/${encodeURIComponent(id)}/read`, undefined, { signal });
    return readNotification(dataOf(response.data));
  },
  async markAllAsRead(signal?: AbortSignal): Promise<number> {
    const response = await apiClient.patch('/notifications/read-all', undefined, { signal });
    return count(dataOf(response.data)?.markedCount);
  },
  async stream(signal: AbortSignal, emit: (event: string, data: unknown) => void): Promise<void> {
    const base = String(apiClient.defaults.baseURL ?? '/api/v1').replace(/\/$/, '');
    const token = getAccessToken();
    if (!token) throw new Error('Chưa đăng nhập.');
    const response = await fetch(`${base}/notifications/stream`, { headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` }, credentials: 'include', signal });
    if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
      await response.body?.cancel();
      throw Object.assign(new Error('Không thể kết nối thông báo realtime.'), { status: response.status });
    }
    const parser = createNotificationParser(emit), reader = response.body.getReader(), decoder = new TextDecoder();
    try {
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        parser(decoder.decode(value, { stream: true }));
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    if (!signal.aborted) throw new Error('Kết nối thông báo đã ngắt.');
  },
};
