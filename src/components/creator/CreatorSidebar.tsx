import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Tooltip, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  LineChartOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  DollarOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';

const { Sider } = Layout;

export const CREATOR_MENU_ITEMS = [
  { key: 'dashboard', icon: <LineChartOutlined />, label: 'Tổng quan & Reach' },
  { key: 'verification', icon: <SafetyCertificateOutlined />, label: 'Xác minh & Claim' },
  { key: 'social-accounts', icon: <ApiOutlined />, label: 'Kênh Mạng xã hội' },
  { key: 'rate-card', icon: <DollarOutlined />, label: 'Bảng giá Rate Card' },
  { key: 'bookings', icon: <CalendarOutlined />, label: 'Booking & Hợp tác' },
];

export default function CreatorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentUser = authService.getCurrentUser() || {
    fullName: 'Châu Bùi',
    email: 'creator@influencermatch.vn',
  };

  const getActiveKey = () => {
    const path = location.pathname;
    if (path.includes('verification')) return 'verification';
    if (path.includes('social')) return 'social-accounts';
    if (path.includes('rate-card')) return 'rate-card';
    if (path.includes('booking')) return 'bookings';
    return 'dashboard';
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(`/creator/${key}`);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userDropdown: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ Creator' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt tài khoản' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: handleLogout },
  ];

  return (
    <Sider
      width={240}
      collapsedWidth={68}
      collapsed={collapsed}
      className="app-sider"
      style={{ position: 'sticky', top: 0, height: '100vh' }}
    >
      {/* Logo + Brand */}
      <div
        onClick={() => navigate('/creator/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          padding: '14px 16px',
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all 0.2s',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: 16,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
          }}
        >
          <SafetyCertificateOutlined />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', letterSpacing: -0.2, lineHeight: 1.2 }}>
              CREATOR PORTAL
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>
              InfluencerMatch
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: '0 12px 8px' }}>
        <Tooltip title={collapsed ? 'Mở rộng' : 'Thu gọn'} placement="right">
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#059669',
              transition: 'all 0.2s',
            }}
          >
            {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 11 }} /> : <MenuFoldOutlined style={{ fontSize: 11 }} />}
          </div>
        </Tooltip>
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[getActiveKey()]}
          onClick={handleMenuClick}
          items={CREATOR_MENU_ITEMS}
          className="sidebar-menu"
          inlineCollapsed={collapsed}
          style={{ background: 'transparent', border: 'none', fontSize: 13.5 }}
        />
      </div>

      {/* Bottom User Card */}
      <div className="sidebar-user-card" style={{ padding: '10px 14px', borderTop: '1px solid #E2E8F0' }}>
        <Dropdown menu={{ items: userDropdown }} placement="topRight" trigger={['click']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <Avatar
              src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80"
              size={36}
              style={{ border: '2px solid #10B981', flexShrink: 0 }}
            />
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.fullName || 'Châu Bùi'}
                  </span>
                  <CheckCircleFilled style={{ color: '#10B981', fontSize: 12 }} />
                </div>
                <div style={{ fontSize: 10.5, color: '#64748B' }}>
                  KOC • Verified
                </div>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </Sider>
  );
}
