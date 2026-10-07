import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  CrownOutlined,
  TransactionOutlined,
  AuditOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { adminAuthService, ADMIN_USER } from '../../mock/adminData';

const { Sider } = Layout;

const MENU_ITEMS: MenuProps['items'] = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { type: 'divider' },
  { key: 'accounts', icon: <TeamOutlined />, label: 'Tài khoản' },
  { key: 'creators', icon: <UserOutlined />, label: 'Creator Catalog' },
  { type: 'divider' },
  { key: 'data-sources', icon: <ApiOutlined />, label: 'Data Sources' },
  { key: 'jobs', icon: <ThunderboltOutlined />, label: 'Collection Jobs' },
  { key: 'scoring', icon: <TrophyOutlined />, label: 'Scoring Config' },
  { type: 'divider' },
  { key: 'subscriptions', icon: <CrownOutlined />, label: 'Subscription Plans' },
  { key: 'payments', icon: <TransactionOutlined />, label: 'Payments' },
  { type: 'divider' },
  { key: 'audit', icon: <AuditOutlined />, label: 'Audit Log' },
];

const ROUTE_KEY_MAP: Record<string, string> = {
  '/admin/dashboard': 'dashboard',
  '/admin/accounts': 'accounts',
  '/admin/creators': 'creators',
  '/admin/data-sources': 'data-sources',
  '/admin/jobs': 'jobs',
  '/admin/scoring': 'scoring',
  '/admin/subscriptions': 'subscriptions',
  '/admin/payments': 'payments',
  '/admin/audit': 'audit',
};

const KEY_ROUTE_MAP: Record<string, string> = {
  dashboard: ADMIN_ROUTES.DASHBOARD,
  accounts: ADMIN_ROUTES.ACCOUNTS.LIST,
  creators: ADMIN_ROUTES.CREATORS,
  'data-sources': ADMIN_ROUTES.DATA_SOURCES,
  jobs: ADMIN_ROUTES.JOBS,
  scoring: ADMIN_ROUTES.SCORING,
  subscriptions: ADMIN_ROUTES.SUBSCRIPTIONS,
  payments: ADMIN_ROUTES.PAYMENTS,
  audit: ADMIN_ROUTES.AUDIT,
};

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentUser = adminAuthService.getCurrentUser() || ADMIN_USER;

  // Resolve active menu key from pathname
  const activeKey = Object.entries(ROUTE_KEY_MAP).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'dashboard';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const route = KEY_ROUTE_MAP[key];
    if (route) navigate(route);
  };

  const handleLogout = () => {
    adminAuthService.logout();
    navigate(ADMIN_ROUTES.LOGIN);
  };

  const userDropdown: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ Admin' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: handleLogout },
  ];

  return (
    <Sider
      width={240}
      collapsedWidth={68}
      collapsed={collapsed}
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1a1f35 50%, #0F172A 100%)',
        borderRight: '1px solid rgba(99,102,241,0.15)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo + Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          padding: collapsed ? '20px 18px' : '20px 16px 18px',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all 0.2s',
        }}
        onClick={() => navigate(ADMIN_ROUTES.DASHBOARD)}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            position: 'relative',
          }}
        >
          <SafetyCertificateOutlined style={{ fontSize: 18 }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#F1F5F9', letterSpacing: 0.5, lineHeight: 1.2 }}>
              ADMIN PANEL
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#6366F1', letterSpacing: 1.5 }}>
              INFLUENCERMATCH
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: '8px 12px' }}>
        <Tooltip title={collapsed ? 'Mở rộng' : 'Thu gọn'} placement="right">
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 0.2s',
            }}
          >
            {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 12 }} /> : <MenuFoldOutlined style={{ fontSize: 12 }} />}
          </div>
        </Tooltip>
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[activeKey]}
          onClick={handleMenuClick}
          items={MENU_ITEMS}
          inlineCollapsed={collapsed}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 13,
          }}
        />
      </div>

      {/* Bottom User Card */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: collapsed ? '12px 0' : '12px',
          flexShrink: 0,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Dropdown menu={{ items: userDropdown }} placement="topRight" trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '6px 4px',
              borderRadius: 10,
            }}
          >
            <Avatar
              src={currentUser.avatar}
              size={32}
              style={{ flexShrink: 0, border: '1.5px solid rgba(99,102,241,0.5)' }}
            />
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#F1F5F9', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                    {currentUser.name}
                  </div>
                  <div style={{ color: '#6366F1', fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>
                    {currentUser.roleLabel || 'Super Admin'}
                  </div>
                </div>
                <RightOutlined style={{ fontSize: 10, color: '#475569', flexShrink: 0 }} />
              </>
            )}
          </div>
        </Dropdown>
      </div>
    </Sider>
  );
}
