import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppstoreOutlined,
  NotificationOutlined,
  CompassOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  MessageOutlined,
  SettingOutlined,
  RightOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import SidebarPromo from '../dashboard/SidebarPromo';
import { CURRENT_USER } from '../../data/mockData';

const { Sider } = Layout;

interface AppSiderProps {
  collapsed?: boolean;
}

export default function AppSider({ collapsed = false }: AppSiderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active key from current path
  const activeKey = location.pathname.includes('campaign-management') || location.pathname.includes('pipeline') || location.pathname.includes('relationship')
    ? 'campaign-management'
    : location.pathname.includes('shortlist')
    ? 'shortlists'
    : location.pathname.includes('creator')
    ? 'creators'
    : location.pathname.includes('campaign')
    ? 'campaigns'
    : 'dashboard';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'dashboard') {
      navigate('/dashboard');
    } else if (key === 'campaigns') {
      navigate('/campaigns');
    } else if (key === 'creators') {
      navigate('/creators');
    } else if (key === 'shortlists') {
      navigate('/shortlists');
    } else if (key === 'campaign-management') {
      navigate('/campaign-management');
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <AppstoreOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'campaigns',
      icon: <NotificationOutlined />,
      label: 'Chiến dịch',
    },
    {
      key: 'creators',
      icon: <CompassOutlined />,
      label: 'Khám phá Creator',
    },
    {
      key: 'shortlists',
      icon: <UnorderedListOutlined />,
      label: 'Danh sách chọn',
    },
    {
      key: 'campaign-management',
      icon: <ApartmentOutlined />,
      label: 'Quản lý chiến dịch',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Tin nhắn</span>
          <Badge count={3} style={{ backgroundColor: '#8B5CF6', color: '#fff' }} />
        </div>
      ),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
  ];

  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: () => navigate('/login'),
    },
  ];

  return (
    <Sider
      width={240}
      breakpoint="lg"
      collapsedWidth="0"
      className="app-sider"
    >
      {/* Brand Logo */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 6px 18px 6px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 16,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          iM
          <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 10, color: '#FDE047' }}>✦</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              color: '#0F172A',
              fontWeight: 800,
              fontSize: 14.5,
              letterSpacing: 0.5,
              lineHeight: 1.2,
            }}
          >
            INFLUENCERMATCH
          </span>
          <span
            style={{
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: '#8B5CF6',
              marginTop: 2,
            }}
          >
            CONNECT • COLLABORATE • GROW
          </span>
        </div>
      </div>

      {/* Menu List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={handleMenuClick}
          items={menuItems}
          className="sidebar-menu"
          style={{
            background: 'transparent',
            border: 'none',
          }}
        />
      </div>

      {/* AI Promo Card */}
      <div style={{ margin: '12px 0', flexShrink: 0 }}>
        <SidebarPromo />
      </div>

      {/* Bottom User Profile (Pinned at bottom) */}
      <div className="sidebar-user-card">
        <Dropdown menu={{ items: userDropdownItems }} placement="topRight" trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 4px',
            }}
          >
            <Avatar src={CURRENT_USER.avatar} size={36} style={{ flexShrink: 0, border: '1.5px solid #CBD5E1' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#0F172A',
                  fontSize: 12.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {CURRENT_USER.name}
              </div>
              <div
                style={{
                  color: '#64748B',
                  fontSize: 10.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {CURRENT_USER.role}
              </div>
            </div>
            <RightOutlined style={{ color: '#94A3B8', fontSize: 11, flexShrink: 0 }} />
          </div>
        </Dropdown>
      </div>
    </Sider>
  );
}
