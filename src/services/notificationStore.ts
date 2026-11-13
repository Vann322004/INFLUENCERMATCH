import { notification } from 'antd';
import { notificationService, readNotification } from './api/notificationService';
import type { NotificationDto } from './api/notificationService';
import { consumeAccountLogout, getAccessToken, getAuthSessionId, getStoredUser, subscribeAuthSession } from './authSession';

type Status = 'idle' | 'loading' | 'success' | 'error';
interface Snapshot {
  session: string; canView: boolean; canManage: boolean; items: NotificationDto[];
  total: number | null; page: number; size: number; listStatus: Status;
  unreadCount: number | null; countStatus: Status;
  stream: 'offline' | 'connecting' | 'live' | 'reconnecting' | 'denied';
  pending: string[]; markingAll: boolean; mutationError: string | null;
}
const empty = (): Snapshot => ({ session: '', canView: false, canManage: false, items: [], total: null, page: 0, size: 20,
  listStatus: 'idle', unreadCount: null, countStatus: 'idle', stream: 'offline', pending: [], markingAll: false, mutationError: null });
interface Run { scope: string; userId: string; token: string; controller: AbortController }
let state = empty(), run: Run | null = null;
const listeners = new Set<() => void>(), seen = new Set<string>(), toastKeys = new Set<string>();
let unwatch: (() => void) | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined, syncTimer: ReturnType<typeof setTimeout> | undefined;
let stableTimer: ReturnType<typeof setTimeout> | undefined;
let listTicket = 0, countTicket = 0;
const update = (patch: Partial<Snapshot>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
const current = (active: Run) => run === active && !active.controller.signal.aborted;

function stop() {
  run?.controller.abort(); run = null; listTicket++; countTicket++;
  clearTimeout(reconnectTimer); clearTimeout(syncTimer); clearTimeout(stableTimer);
}
function clearToasts() {
  toastKeys.forEach(key => notification.destroy(key)); toastKeys.clear();
}
async function refresh(active = run) {
  if (!active || !current(active)) return;
  const page = state.page, size = state.size, list = ++listTicket, count = ++countTicket;
  update({ listStatus: 'loading', countStatus: 'loading' });
  await Promise.allSettled([
    notificationService.getNotifications(page, size, active.controller.signal).then(result => {
      if (!current(active) || list !== listTicket) return;
      if (result.items.some(item => item.userId !== active.userId)) throw new Error('Thông báo không thuộc phiên hiện tại.');
      result.items.forEach(item => seen.add(item.id));
      update({ items: result.items, total: result.totalElements, page: result.page, size: result.size, listStatus: 'success' });
    }).catch(() => { if (current(active) && list === listTicket) update({ listStatus: 'error' }); }),
    notificationService.getUnreadCount(active.controller.signal).then(value => {
      if (current(active) && count === countTicket) update({ unreadCount: value, countStatus: 'success' });
    }).catch(() => { if (current(active) && count === countTicket) update({ unreadCount: null, countStatus: 'error' }); }),
  ]);
}
function scheduleSync(active: Run) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { if (current(active)) void refresh(active); }, 100);
}
function connect(active: Run, attempt = 0) {
  if (!current(active)) return;
  update({ stream: attempt === 0 ? 'connecting' : 'reconnecting' });
  void notificationService.stream(active.controller.signal, (event, payload) => {
    if (!current(active)) return;
    if (event === 'CONNECTED') {
      if ((payload as { userId?: string })?.userId !== active.userId) throw new Error('Phiên thông báo không khớp.');
      update({ stream: 'live' }); scheduleSync(active);
      clearTimeout(stableTimer); stableTimer = setTimeout(() => { attempt = 0; }, 30_000);
      return;
    }
    const item = readNotification(payload);
    if (item.userId !== active.userId) return;
    if (!seen.has(item.id)) {
      seen.add(item.id); listTicket++; countTicket++;
      if (state.page === 0 && state.listStatus === 'success') update({ items: [item, ...state.items].slice(0, state.size) });
      const key = `personal-notification:${item.id}`; toastKeys.add(key);
      notification.open({ key, message: item.title, description: item.message, className: 'notification-live-toast',
        onClose: () => toastKeys.delete(key) });
    }
    scheduleSync(active);
  }).catch(async error => {
    if (!current(active)) return;
    clearTimeout(stableTimer);
    if (error?.status === 403) { update({ stream: 'denied' }); return; }
    update({ stream: 'reconnecting' });
    // Axios performs the existing session refresh flow for an expired bearer token.
    if (error?.status === 401) await refresh(active);
    if (!current(active)) return;
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5)) + Math.floor(Math.random() * 250);
    reconnectTimer = setTimeout(() => connect(active, attempt + 1), delay);
  });
}
function reconcile() {
  if (consumeAccountLogout()) return;
  const token = getAccessToken(), user = getStoredUser();
  const canView = !!token && !!user?.id && !!user?.permissions?.includes('VIEW_OWN_NOTIFICATION');
  const scope = canView ? JSON.stringify([getAuthSessionId(), user.id, user.role, user.authVersion,
    [...(user.permissions ?? [])].sort(), user.status]) : '';
  const canManage = canView && !!user.permissions?.includes('MANAGE_OWN_NOTIFICATION');
  if (run?.scope === scope && run.token === token) return;
  const changed = state.session !== scope;
  stop();
  if (changed || !canView) { seen.clear(); clearToasts(); state = empty(); }
  update({ session: scope, canView, canManage, stream: 'offline', pending: [], markingAll: false, mutationError: null });
  if (!canView || !token) return;
  const active: Run = { scope, userId: user.id, token, controller: new AbortController() };
  run = active;
  void refresh(active); connect(active);
}
function onExternalSession() { reconcile(); }

export const notificationStore = {
  getSnapshot: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
      unwatch = subscribeAuthSession(reconcile);
      window.addEventListener('storage', onExternalSession); window.addEventListener('focus', onExternalSession);
      reconcile();
    }
    return () => {
      listeners.delete(listener);
      // Keep one connection across same-commit Header remounts and React StrictMode.
      queueMicrotask(() => { if (!listeners.size) {
        stop(); unwatch?.(); unwatch = undefined; clearToasts();
        state = empty(); seen.clear();
        window.removeEventListener('storage', onExternalSession); window.removeEventListener('focus', onExternalSession);
      } });
    };
  },
  retry() {
    if (run) {
      void refresh();
      if (state.stream === 'denied') { const active = run; connect(active); }
    }
  },
  setPage(page: number) { update({ page, items: [] }); void refresh(); },
  async markRead(id: string) {
    const active = run;
    if (!active || !state.canManage || state.pending.includes(id) || state.markingAll) return;
    update({ pending: [...state.pending, id], mutationError: null });
    try {
      const item = await notificationService.markAsRead(id, active.controller.signal);
      if (!current(active)) return;
      if (item.userId !== active.userId || item.id !== id || !item.read) throw new Error('Không thể xác nhận đã đọc.');
      update({ items: state.items.map(row => row.id === id ? item : row) });
      await refresh(active);
    } catch { if (current(active)) update({ mutationError: 'Không thể đánh dấu đã đọc. Vui lòng thử lại.' }); }
    finally { if (current(active)) update({ pending: state.pending.filter(value => value !== id) }); }
  },
  async markAll() {
    const active = run;
    if (!active || !state.canManage || state.markingAll || state.pending.length) return;
    update({ markingAll: true, mutationError: null });
    try { await notificationService.markAllAsRead(active.controller.signal); if (current(active)) await refresh(active); }
    catch { if (current(active)) update({ mutationError: 'Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.' }); }
    finally { if (current(active)) update({ markingAll: false }); }
  },
};
