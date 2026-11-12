import { useEffect } from 'react';
import { ACCOUNT_LOGOUT_PREFIX, consumeAccountLogout } from '../services/authSession';

export function useAccountLogoutSync() {
  useEffect(() => {
    const checkLogout = () => {
      if (consumeAccountLogout()) window.location.assign('/login');
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key?.startsWith(ACCOUNT_LOGOUT_PREFIX)) checkLogout();
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
