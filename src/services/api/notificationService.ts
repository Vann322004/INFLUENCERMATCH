import { apiClient, getAccessToken } from '../apiClient';

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  readAt?: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationPageResponse {
  content?: NotificationDto[];
  items?: NotificationDto[];
  totalElements?: number;
  page?: number;
  size?: number;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const notificationService = {
  /**
   * Lấy danh sách thông báo của người dùng hiện tại
   * GET /notifications?page=0&size=20
   */
  async getNotifications(page = 0, size = 20): Promise<NotificationDto[]> {
    const response = await apiClient.get<any>('/notifications', {
      params: { page, size },
    });
    const data = response.data?.data ?? response.data;
    const list = data?.content || data?.items || (Array.isArray(data) ? data : []);
    return list;
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   * GET /notifications/unread-count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<any>('/notifications/unread-count');
    const data = response.data?.data ?? response.data;
    if (typeof data === 'number') return data;
    return Number(data?.unreadCount ?? data?.count ?? 0);
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   * PATCH /notifications/{id}/read
   */
  async markAsRead(id: string): Promise<NotificationDto | null> {
    const response = await apiClient.patch<any>(`/notifications/${id}/read`);
    return response.data?.data ?? response.data ?? null;
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   * PATCH /notifications/read-all
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  /**
   * Đăng ký nhận luồng thông báo realtime qua Server-Sent Events (SSE)
   * GET /notifications/stream
   */
  subscribeToStream(onNotification: (notif: NotificationDto) => void): () => void {
    const controller = new AbortController();
    const token = getAccessToken();

    if (!token) {
      return () => {};
    }

    const startStream = async () => {
      try {
        const response = await fetch(`${BASE_URL}/notifications/stream`, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const eventText of events) {
            const dataLines = eventText
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim());

            if (dataLines.length > 0) {
              const payload = dataLines.join('\n');
              try {
                const parsed = JSON.parse(payload);
                if (parsed && parsed.id) {
                  onNotification(parsed as NotificationDto);
                }
              } catch {
                // ignore heartbeat / non-JSON ping
              }
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[notificationService] SSE stream disconnected:', err?.message);
        }
      }
    };

    startStream();

    return () => {
      controller.abort();
    };
  },
};

