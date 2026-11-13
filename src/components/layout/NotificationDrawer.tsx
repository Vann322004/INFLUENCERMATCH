import { Button, Empty, Pagination, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationStore } from '../../services/notificationStore';
import { getStoredUser } from '../../services/authSession';
import type { NotificationDto } from '../../services/api/notificationService';

// Retain existing Brand entity destinations; do not send other roles into Brand routes.
function relatedPath(item: NotificationDto): string | undefined {
  if (String(getStoredUser()?.role).toUpperCase() !== 'BRAND') return;
  const type = item.entityType?.toUpperCase();
  if (type === 'CAMPAIGN' && item.entityId) return `/campaigns/${encodeURIComponent(item.entityId)}`;
  if (type === 'COLLABORATION') return '/collaboration';
  if (['RELATIONSHIP', 'DEAL', 'COOPERATION_INVITATION'].includes(type ?? '')) return '/crm';
  if (['SUBSCRIPTION', 'PAYMENT'].includes(type ?? '')) return '/subscription';
}

/** Shared compact popup content; the historic filename is kept for existing imports. */
export default function NotificationDrawer({ onClose }: { onClose: () => void }) {
  const state = useNotifications();
  const navigate = useNavigate();
  return <section className="notification-panel" role="dialog" aria-label="Thông báo">
    <header className="notification-panel-header"><h2>Thông báo</h2><Button type="text" onClick={onClose} aria-label="Đóng thông báo">Đóng</Button></header>
    {!state.canView ? <p className="notification-state">Bạn không có quyền xem thông báo.</p> : <>
      <div className="notification-toolbar">
        <span>{state.countStatus === 'success' && state.unreadCount !== null ? `${state.unreadCount.toLocaleString('vi-VN')} chưa đọc`
          : state.countStatus === 'error' ? 'Chưa tải được số chưa đọc' : 'Đang tải số chưa đọc…'}</span>
        {state.canManage && <Button type="link" loading={state.markingAll} disabled={state.unreadCount === null || state.unreadCount === 0 || state.pending.length > 0}
          onClick={() => void notificationStore.markAll()}>Đọc tất cả</Button>}
      </div>
      <p className="notification-connection" role="status">{state.stream === 'live' ? 'Đang kết nối realtime'
        : state.stream === 'denied' ? 'Chưa có quyền kết nối realtime' : 'Realtime đang kết nối lại…'}</p>
      {(state.countStatus === 'error' || state.stream === 'denied') && <Button className="notification-retry" onClick={() => notificationStore.retry()}>Thử lại kết nối</Button>}
      {state.mutationError && <p className="notification-state" role="alert">{state.mutationError}</p>}
      <div className="notification-list">
        {state.listStatus === 'loading' || state.listStatus === 'idle' ? <div className="notification-state" role="status" aria-label="Đang tải thông báo"><Skeleton active paragraph={{ rows: 3 }} /></div>
          : state.listStatus === 'error' ? <div className="notification-state" role="alert"><p>Không thể tải thông báo.</p><Button onClick={() => notificationStore.retry()}>Thử lại</Button></div>
          : state.items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
          : <ul>{state.items.map(item => <li key={item.id} className={item.read ? '' : 'is-unread'}>
              <div className="notification-item-title"><h3>{item.title}</h3>{!item.read && <span className="notification-unread-dot" aria-label="Chưa đọc" />}</div>
              <p>{item.message}</p><time>{item.createdAt.replace('T', ' ')}</time>
              {!item.read && state.canManage && <Button type="link" loading={state.pending.includes(item.id)} disabled={state.markingAll}
                onClick={() => void notificationStore.markRead(item.id)}>Đánh dấu đã đọc</Button>}
              {relatedPath(item) && <Button type="link" className="notification-related-link" disabled={state.pending.includes(item.id)}
                onClick={async () => {
                  const path = relatedPath(item), session = state.session;
                  if (!path) return;
                  if (!item.read && state.canManage) await notificationStore.markRead(item.id);
                  if (notificationStore.getSnapshot().session !== session) return;
                  onClose(); navigate(path);
                }}>Xem liên quan</Button>}
            </li>)}</ul>}
      </div>
      {state.listStatus === 'success' && state.total !== null && state.total > state.size && <footer className="notification-pagination">
        <Pagination simple current={state.page + 1} pageSize={state.size} total={state.total} onChange={page => notificationStore.setPage(page - 1)} />
      </footer>}
    </>}
  </section>;
}
