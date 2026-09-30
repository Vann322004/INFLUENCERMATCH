import React, { useState } from 'react';
import { Layout, Input, Button, Badge, Avatar, Dropdown, Space, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  DownOutlined,
  UserOutlined,
  LogoutOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { CURRENT_USER } from '../../data/mockData';
import NotificationDrawer from './NotificationDrawer';

const { Header } = Layout;

export default function AppHeader() {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

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
    },
  ];

  return (
    <Header className="app-header">
      {/* Search Input */}
      <Input
        placeholder="Tìm kiếm chiến dịch, creator hoặc từ khóa..."
        prefix={<SearchOutlined style={{ color: '#94A3B8', marginRight: 8 }} />}
        suffix={
          <span
            style={{
              background: '#F1F5F9',
              padding: '2px 6px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: '#94A3B8',
            }}
          >
            ⌘ K
          </span>
        }
        style={{
          width: 380,
          borderRadius: 10,
          background: '#F8FAFC',
          borderColor: '#EEF0F6',
          height: 38,
        }}
      />

      {/* Right Actions */}
      <Space size={14} align="center">
        <Tooltip title="Thông báo">
          <Badge dot color="#EF4444" offset={[-2, 2]}>
            <Button
              shape="circle"
              icon={<BellOutlined />}
              onClick={() => setNotifOpen(true)}
              style={{
                border: '1px solid #EEF0F6',
                color: '#64748B',
                width: 36,
                height: 36,
              }}
            />
          </Badge>
        </Tooltip>

        <Tooltip title="Cài đặt giao diện">
          <Button
            shape="circle"
            icon={<SettingOutlined />}
            onClick={() => navigate('/subscription')}
            style={{
              border: '1px solid #EEF0F6',
              color: '#64748B',
              width: 36,
              height: 36,
            }}
          />
        </Tooltip>

        {/* User Profile */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
          >
            <Avatar src={CURRENT_USER.avatar} size={36} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap' }}>
                {CURRENT_USER.name}
              </span>
              <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                {CURRENT_USER.role}
              </span>
            </div>
            <DownOutlined style={{ fontSize: 10, color: '#94A3B8', marginLeft: 2 }} />
          </div>
        </Dropdown>
      </Space>

      {/* Notification Drawer Component */}
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </Header>
  );
}
