import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Badge, Avatar, Dropdown, Button, Tooltip, Drawer, List, Typography, Tag, Empty } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { adminAuthService, ADMIN_NOTIFICATIONS } from '../../mock/adminData';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';

const { Header } = Layout;
const { Text } = Typography;

const notifIconMap: Record<string, React.ReactNode> = {
  error: <CloseCircleOutlined style={{ color: '#EF4444' }} />,
  warning: <WarningOutlined style={{ color: '#F59E0B' }} />,
  info: <InfoCircleOutlined style={{ color: '#6366F1' }} />,
  success: <CheckCircleOutlined style={{ color: '#10B981' }} />,
};

interface AdminHeaderProps {
  title?: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(ADMIN_NOTIFICATIONS);
  const currentUser = adminAuthService.getCurrentUser();
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    adminAuthService.logout();
    navigate(ADMIN_ROUTES.LOGIN);
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const userDropdown: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ Admin' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt hệ thống' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: handleLogout },
  ];

  return (
    <>
      <Header
        style={{
          background: '#0F172A',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 60,
          lineHeight: 'normal',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Page Title */}
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>
          {title || 'Admin Panel'}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Notification Bell */}
          <Tooltip title="Thông báo hệ thống">
            <Badge count={unreadCount} size="small" style={{ backgroundColor: '#EF4444' }}>
              <Button
                shape="circle"
                icon={<BellOutlined />}
                onClick={() => setNotifOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94A3B8',
                }}
              />
            </Badge>
          </Tooltip>

          {/* Admin Profile Dropdown */}
          <Dropdown menu={{ items: userDropdown }} placement="bottomRight" trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'background 0.2s',
              }}
            >
              <Avatar
                src={currentUser?.avatar}
                size={28}
                style={{ border: '1.5px solid rgba(99,102,241,0.5)', flexShrink: 0 }}
              />
              <div>
                <div style={{ color: '#F1F5F9', fontSize: 12, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  {currentUser?.name || 'Admin'}
                </div>
                <div style={{ color: '#6366F1', fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>
                  {currentUser?.roleLabel || 'Super Admin'}
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Notification Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Thông báo hệ thống</span>
            {unreadCount > 0 && (
              <Button
                size="small"
                icon={<CheckOutlined />}
                onClick={markAllRead}
                style={{ fontSize: 12 }}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        }
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        width={380}
        styles={{ body: { padding: 0 } }}
      >
        {notifications.length === 0 ? (
          <Empty description="Không có thông báo" style={{ marginTop: 60 }} />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px 20px',
                  background: item.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ marginTop: 2, fontSize: 18 }}>
                      {notifIconMap[item.type]}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                      {!item.read && <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>Mới</Tag>}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#475569', fontSize: 12 }}>{item.body}</div>
                      <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{item.time}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
}
