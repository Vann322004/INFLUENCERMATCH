import React, { useState } from 'react';
import { Layout, Badge, Avatar, Dropdown, Space, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BellOutlined,
  SettingOutlined,
  DownOutlined,
  UserOutlined,
  LogoutOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';
import NotificationDrawer from './NotificationDrawer';

const { Header } = Layout;

export default function AppHeader() {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'subscription',
      icon: <CrownOutlined style={{ color: '#F59E0B' }} />,
      label: 'Gói cước & Hạn mức',
      onClick: () => navigate('/subscription'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ thương hiệu',
      onClick: () => navigate('/brand-profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt hệ thống',
      onClick: () => navigate('/subscription'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="app-header">
      {/* Standalone Action Buttons (no bar, clean floating buttons) */}
      <Space size={12} align="center">
        {/* Notification standalone button */}
        <Tooltip title="Thông báo">
          <Badge dot color="#EF4444" offset={[-3, 3]}>
            <button
              type="button"
              className="standalone-action-btn"
              onClick={() => setNotifOpen(true)}
              aria-label="Thông báo"
            >
              <BellOutlined style={{ fontSize: 16 }} />
            </button>
          </Badge>
        </Tooltip>

        {/* Settings standalone button */}
        <Tooltip title="Cài đặt">
          <button
            type="button"
            className="standalone-action-btn"
            onClick={() => navigate('/subscription')}
            aria-label="Cài đặt"
          >
            <SettingOutlined style={{ fontSize: 16 }} />
          </button>
        </Tooltip>

        {/* User Profile standalone pill button */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="standalone-user-btn">
            <Avatar size={34} style={{ flexShrink: 0, backgroundColor: '#8B5CF6', fontWeight: 700 }}>
              {(currentUser?.fullName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap' }}>
                {currentUser?.fullName || currentUser?.email || 'Người dùng'}
              </span>
              <span style={{ fontSize: 10.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                {currentUser?.role || 'BRAND'}
              </span>
            </div>
            <DownOutlined style={{ fontSize: 10, color: '#94A3B8', marginLeft: 2, marginRight: 2 }} />
          </div>
        </Dropdown>
      </Space>

      {/* Notification Drawer Component */}
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </Header>
  );
}
