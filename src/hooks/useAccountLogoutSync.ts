import { useEffect } from 'react';
import { App } from 'antd';
import { BROWSER_SESSION_KEY, SESSION_NOTICE_KEY, consumeAccountLogout } from '../services/authSession';

export function useAccountLogoutSync() {
  const { notification } = App.useApp();
  useEffect(() => {
    const description = sessionStorage.getItem(SESSION_NOTICE_KEY);
    if (!description) return;
    sessionStorage.removeItem(SESSION_NOTICE_KEY);
    notification.info({
      key: 'browser-session-change',
      title: 'Phiên đăng nhập đã thay đổi',
      description,
      duration: 0,
    });
  }, [notification]);
  useEffect(() => {
    const checkLogout = () => {
      consumeAccountLogout();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === BROWSER_SESSION_KEY || event.key === null)) checkLogout();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', checkLogout);
    document.addEventListener('visibilitychange', checkLogout);
    checkLogout();
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', checkLogout);
      document.removeEventListener('visibilitychange', checkLogout);
    };
  }, []);
}
