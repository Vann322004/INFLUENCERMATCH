import { useEffect, useState } from 'react';
import { Badge, Popover } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDrawer from './NotificationDrawer';
import './Notifications.css';

export default function NotificationBell() {
  const state = useNotifications();
  const { pathname } = useLocation();
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const context = state.session + ':' + pathname;
  const open = openedFor === context;
  const setOpen = (value: boolean) => setOpenedFor(value ? context : null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenedFor(null); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  const label = state.unreadCount !== null ? `Thông báo, ${state.unreadCount} chưa đọc` : 'Thông báo, chưa xác định số chưa đọc';
  return <Popover open={open && state.canView} onOpenChange={setOpen} trigger="click" placement="bottomRight"
    classNames={{ root: 'notification-popover' }} arrow={false}
    content={<NotificationDrawer onClose={() => setOpen(false)} />}>
    <Badge count={state.unreadCount ?? undefined} overflowCount={99} size="small" color="#4f46e5" offset={[-3, 3]}>
      <button type="button" className="standalone-action-btn notification-bell" aria-label={label} aria-haspopup="dialog"
        aria-expanded={open && state.canView} disabled={!state.canView} title={!state.canView ? 'Chưa đăng nhập hoặc chưa có quyền xem thông báo' : 'Thông báo'}>
        <BellOutlined />
      </button>
    </Badge>
  </Popover>;
}
