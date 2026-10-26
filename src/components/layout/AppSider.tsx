import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge, Tooltip } from 'antd';
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
  AimOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';

const { Sider } = Layout;

interface AppSiderProps {
  collapsed?: boolean;
}

export default function AppSider({ collapsed: initialCollapsed = false }: AppSiderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  // User initials (e.g. "VN" or "VY")
  const getInitials = () => {
    if (currentUser?.fullName) {
      const parts = currentUser.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'VN';
  };

  const initials = getInitials();
  const userName = currentUser?.fullName || 'Vy Huynh';

  // Determine active key from current path
  const activeKey = location.pathname.includes('subscription') || location.pathname.includes('billing') || location.pathname.includes('plans')
    ? 'subscription'
    : location.pathname.includes('recommendation') || location.search.includes('tab=recommendation')
    ? 'recommendation'
    : location.pathname.includes('crm') || location.pathname.includes('outreach') || location.pathname.includes('relationship')
    ? 'crm'
    : location.pathname.includes('performance') || location.pathname.includes('reports') || location.pathname.includes('analytics')
    ? 'performance'
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
    } else if (key === 'recommendation') {
      const savedCampId = localStorage.getItem('last_active_campaign_id') || sessionStorage.getItem('current_campaign_id');
      if (savedCampId && savedCampId !== 'all') {
        navigate(`/campaign-management/${savedCampId}?tab=recommendation`);
      } else {
        navigate('/recommendations?tab=recommendation');
      }
    } else if (key === 'crm') {
      navigate('/crm');
    } else if (key === 'performance') {
      navigate('/performance');
    } else if (key === 'messages') {
      navigate('/messages');
    } else if (key === 'subscription') {
      navigate('/subscription');
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <AppstoreOutlined />,
      label: 'Tổng quan',
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
      key: 'recommendation',
      icon: <AimOutlined />,
      label: 'Đề xuất Four-Memory',
    },
    {
      key: 'crm',
      icon: <TeamOutlined />,
      label: 'Tiếp cận & CRM',
    },
    {
      key: 'performance',
      icon: <BarChartOutlined />,
      label: 'Hiệu suất & ROI',
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Tin nhắn</span>
          <Badge count={3} style={{ backgroundColor: '#7C3AED', color: '#fff', fontSize: 10 }} />
        </div>
      ),
    },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userDropdownItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ Thương hiệu', onClick: () => navigate('/brand-profile') },
    { key: 'billing', icon: <CrownOutlined />, label: 'Gói & Hạn mức', onClick: () => navigate('/subscription') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: handleLogout },
  ];

  return (
    <Sider
      width={240}
      collapsedWidth={62}
      collapsed={collapsed}
      className="app-sider"
    >
      {/* 1. Header: Logo + Brand Name + ChatGPT-style Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '4px 0 12px 0' : '4px 4px 12px 6px',
          borderBottom: '1px solid rgba(124, 58, 237, 0.08)',
          marginBottom: 10,
        }}
      >
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            cursor: 'pointer',
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: 28,
              height: 28,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          {!collapsed && (
            <span
              style={{
                color: '#0F172A',
                fontWeight: 700,
                fontSize: 14.5,
                letterSpacing: -0.3,
                lineHeight: 1.2,
                userSelect: 'none',
              }}
            >
              InfluencerMatch
            </span>
          )}
        </div>

        <Tooltip title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} placement="right">
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px 6px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 13 }} /> : <MenuFoldOutlined style={{ fontSize: 13 }} />}
          </button>
        </Tooltip>
      </div>

      {/* 2. ChatGPT "New chat" Style Quick Action Pill */}
      {!collapsed ? (
        <div
          onClick={() => navigate('/campaigns/create')}
          className="chatgpt-new-action-pill"
        >
          <EditOutlined style={{ fontSize: 15, color: '#FFFFFF' }} />
          <span>Tạo chiến dịch mới</span>
        </div>
      ) : (
        <Tooltip title="Tạo chiến dịch mới" placement="right">
          <div
            onClick={() => navigate('/campaigns/create')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B5BF0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              margin: '0 auto 10px auto',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.28)',
            }}
          >
            <EditOutlined style={{ fontSize: 15, color: '#FFFFFF' }} />
          </div>
        </Tooltip>
      )}

      {/* 3. Navigation Menu Items - No scrolling */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={handleMenuClick}
          items={menuItems}
          inlineCollapsed={collapsed}
          className="sidebar-menu"
          style={{
            background: 'transparent',
            border: 'none',
          }}
        />
      </div>

      {/* 4. ChatGPT-Style Bottom User Card (Image 2 & 3) */}
      <div className="sidebar-user-card">
        <Dropdown menu={{ items: userDropdownItems }} placement="topRight" trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              padding: collapsed ? '6px 0' : '6px 4px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {/* Salmon / Coral Avatar with Initials like ChatGPT's VN circle */}
            <Avatar
              size={34}
              src={currentUser?.avatar}
              style={{
                backgroundColor: '#8B5CF6',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 12.5,
                flexShrink: 0,
                border: '1px solid rgba(124, 58, 237, 0.2)',
              }}
            >
              {initials}
            </Avatar>

            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                <div
                  style={{
                    color: '#0F172A',
                    fontSize: 12.5,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userName}
                </div>
                <div
                  style={{
                    color: '#64748B',
                    fontSize: 11,
                    fontWeight: 500,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Gói Doanh Nghiệp (Cao cấp)
                </div>
              </div>
            )}
          </div>
        </Dropdown>

        {/* ChatGPT "Claim offer" style pill button */}
        {!collapsed && (
          <button
            onClick={() => navigate('/subscription')}
            className="chatgpt-claim-pill-btn"
          >
            <CrownOutlined style={{ fontSize: 13, color: '#7C3AED' }} />
            <span>Quản lý gói & Hạn mức</span>
          </button>
        )}
      </div>
    </Sider>
  );
}
