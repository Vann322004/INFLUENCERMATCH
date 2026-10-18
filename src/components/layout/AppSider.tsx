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
  CrownOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import SidebarPromo from '../dashboard/SidebarPromo';
import { authService } from '../../services/api/authService';

const { Sider } = Layout;

interface AppSiderProps {
  collapsed?: boolean;
}

export default function AppSider({ collapsed = false }: AppSiderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  // Determine active key from current path
  const activeKey = location.pathname.includes('subscription') || location.pathname.includes('billing') || location.pathname.includes('plans')
    ? 'subscription'
    : location.pathname.includes('crm') || location.pathname.includes('outreach') || location.pathname.includes('relationship')
    ? 'crm'
    : location.pathname.includes('collaboration') || location.pathname.includes('collab') || location.pathname.includes('operations')
    ? 'collaboration'
    : location.pathname.includes('performance') || location.pathname.includes('reports') || location.pathname.includes('analytics')
    ? 'reports'
    : location.pathname.includes('campaign-history') || location.pathname.includes('/history')
    ? 'history'
    : location.pathname.includes('campaign-management') || location.pathname.includes('pipeline')
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
    } else if (key === 'crm') {
      navigate('/crm');
    } else if (key === 'collaboration') {
      navigate('/collaboration');
    } else if (key === 'reports') {
      navigate('/performance');
    } else if (key === 'history') {
      navigate('/campaign-history');
    } else if (key === 'campaign-management') {
      navigate('/campaign-management');
    } else if (key === 'subscription') {
      navigate('/subscription');
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
      key: 'crm',
      icon: <TeamOutlined />,
      label: 'Tiếp cận & CRM',
    },
    {
      key: 'collaboration',
      icon: <FileDoneOutlined />,
      label: 'Vận hành & Hợp tác',
    },
    {
      key: 'campaign-management',
      icon: <ApartmentOutlined />,
      label: 'Quản lý chiến dịch',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Hiệu suất & ROI',
    },
    {
      key: 'history',
      icon: <ClockCircleOutlined />,
      label: 'Lịch sử Chiến dịch',
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
        <img
          src="/logo.png"
          alt="InfluencerMatch"
          style={{
            width: 38,
            height: 38,
            objectFit: 'contain',
            flexShrink: 0,
            filter: 'drop-shadow(0 3px 8px rgba(124, 58, 237, 0.25))',
          }}
        />
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
      <div style={{ marginTop: 'auto', paddingTop: 12, flexShrink: 0 }}>
        <SidebarPromo />
      </div>
    </Sider>
  );
}
