import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { STORAGE_KEYS, getAccessToken } from '../services/apiClient';

/**
 * Hook tự động đồng bộ phiên đăng nhập giữa các tab trên cùng trình duyệt.
 * - Ngăn chặn tình trạng Tab 1 thao tác ghi đè nhầm dữ liệu vào tài khoản vừa đăng nhập ở Tab 2.
 * - Khi phát hiện tab khác đăng xuất hoặc đổi tài khoản -> tự động cảnh báo & reload/redirect.
 */
export function useMultiTabSessionSync() {
  const currentTokenRef = useRef<string | null>(getAccessToken());

  useEffect(() => {
    // 1. Lắng nghe sự kiện Storage thay đổi từ tab khác trong thời gian thực
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACCESS_TOKEN) {
        // Trường hợp A: Tab khác bấm Đăng xuất (token bị xóa)
        if (!e.newValue && e.oldValue) {
          message.warning({
            content: 'Bạn đã đăng xuất ở một tab khác. Đang chuyển về trang đăng nhập...',
            key: 'session_sync_alert',
            duration: 3,
          });
          setTimeout(() => {
            const isAuthPage =
              window.location.pathname === '/login' ||
              window.location.pathname === '/register' ||
              window.location.pathname === '/forgot-password';
            if (!isAuthPage) {
              window.location.href = '/login';
            }
          }, 800);
          return;
        }

        // Trường hợp B: Tab khác đăng nhập tài khoản khác (token bị thay đổi)
        if (e.newValue && e.newValue !== currentTokenRef.current) {
          message.info({
            content: 'Tài khoản đăng nhập đã thay đổi ở tab khác. Trang sẽ tự động tải lại...',
            key: 'session_sync_alert',
            duration: 3,
          });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      }
    };

    // 2. Khi người dùng click quay lại tab này (cửa sổ nhận focus)
    const handleWindowFocus = () => {
      const activeToken = getAccessToken();
      const isAuthPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/forgot-password';

      // Nếu trước đó đang đăng nhập mà giờ trong localStorage đã mất token
      if (currentTokenRef.current && !activeToken && !isAuthPage) {
        message.warning({
          content: 'Phiên đăng nhập đã kết thúc ở tab khác. Đang chuyển về trang đăng nhập...',
          key: 'session_sync_alert',
          duration: 3,
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 600);
        return;
      }

      // Nếu token trong localStorage bị đổi sang token của user khác
      if (activeToken && currentTokenRef.current && activeToken !== currentTokenRef.current) {
        message.info({
          content: 'Phát hiện đổi tài khoản từ tab khác. Đang đồng bộ lại dữ liệu...',
          key: 'session_sync_alert',
          duration: 3,
        });
        setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);
}
