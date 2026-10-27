import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { STORAGE_KEYS, getAccessToken, getStoredUser } from '../services/apiClient';

/**
 * Hook tự động đồng bộ phiên đăng nhập giữa các tab trên cùng trình duyệt.
 * - So sánh theo User ID (thay vì chuỗi token) để tránh báo nhầm khi token tự động refresh sau thời gian dài không dùng.
 * - Khi phát hiện tab khác đăng xuất hoặc đổi sang tài khoản khác -> tự động cảnh báo & reload/redirect.
 */
export function useMultiTabSessionSync() {
  const getUserId = () => {
    const user = getStoredUser();
    return user?.id || user?.userId || user?.email || null;
  };

  const currentTokenRef = useRef<string | null>(getAccessToken());
  const currentUserIdRef = useRef<string | null>(getUserId());

  useEffect(() => {
    // 1. Lắng nghe sự kiện Storage thay đổi từ tab khác trong thời gian thực
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACCESS_TOKEN) {
        // Tab khác bấm Đăng xuất (token bị xóa hẳn)
        if (!e.newValue && e.oldValue) {
          message.warning({
            content: 'Tài khoản đã đăng xuất ở tab khác. Đang chuyển về trang đăng nhập...',
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

        // Tab khác đổi token: kiểm tra xem có phải cùng 1 user không (token rotation)
        if (e.newValue) {
          const newUserId = getUserId();
          if (newUserId && currentUserIdRef.current && newUserId !== currentUserIdRef.current) {
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
          // Cùng 1 user (chỉ là token refresh): cập nhật ref ngầm, không reload phiền phức
          currentTokenRef.current = e.newValue;
        }
      }

      if (e.key === STORAGE_KEYS.USER && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const newId = parsed?.id || parsed?.userId || parsed?.email || null;
          if (newId && currentUserIdRef.current && newId !== currentUserIdRef.current) {
            message.info({
              content: 'Tài khoản đăng nhập đã thay đổi ở tab khác. Trang sẽ tự động tải lại...',
              key: 'session_sync_alert',
              duration: 3,
            });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch {
          // ignore json parse error
        }
      }
    };

    // 2. Khi người dùng click quay lại tab này (cửa sổ nhận focus)
    const handleWindowFocus = () => {
      const activeToken = getAccessToken();
      const activeUserId = getUserId();

      // Chỉ cảnh báo nếu thực sự đổi sang USER KHÁC
      if (activeUserId && currentUserIdRef.current && activeUserId !== currentUserIdRef.current) {
        message.info({
          content: 'Phát hiện đổi tài khoản từ tab khác. Đang đồng bộ lại dữ liệu...',
          key: 'session_sync_alert',
          duration: 3,
        });
        setTimeout(() => {
          window.location.reload();
        }, 600);
        return;
      }

      // Cập nhật lại ref nếu chỉ là token refresh bình thường cùng user
      if (activeToken) {
        currentTokenRef.current = activeToken;
      }
      if (activeUserId) {
        currentUserIdRef.current = activeUserId;
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
