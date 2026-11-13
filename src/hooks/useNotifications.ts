import { useSyncExternalStore } from 'react';
import { notificationStore } from '../services/notificationStore';

export function useNotifications() {
  return useSyncExternalStore(notificationStore.subscribe, notificationStore.getSnapshot);
}
