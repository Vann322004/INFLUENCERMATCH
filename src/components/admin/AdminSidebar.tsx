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
import { authService } from '../../services/api/authService';

const { Sider } = Layout;

const ADMIN_MENU_ITEMS: MenuProps['items'] = [
  { key: 'dashboard',      icon: <AppstoreOutlined />,      label: 'Dashboard' },
  { type: 'divider' },
  { key: 'accounts',       icon: <TeamOutlined />,          label: 'Tài khoản' },
  { key: 'creators',       icon: <UserOutlined />,          label: 'Creator Catalog' },
  { key: 'creator-claims', icon: <SafetyCertificateOutlined />, label: 'Duyệt Claims' },
  { type: 'divider' },
  { key: 'data-sources',   icon: <ApiOutlined />,           label: 'Data Sources' },
  { key: 'jobs',           icon: <ThunderboltOutlined />,   label: 'Collection Jobs' },
  { key: 'scoring',        icon: <TrophyOutlined />,        label: 'Scoring Config' },
  { type: 'divider' },
  { key: 'subscriptions',  icon: <CrownOutlined />,         label: 'Subscription Plans' },
  { key: 'payments',       icon: <TransactionOutlined />,   label: 'Payments' },
  { type: 'divider' },
  { key: 'audit',          icon: <AuditOutlined />,         label: 'Audit Log' },
];

const MANAGER_MENU_ITEMS: MenuProps['items'] = [
  { key: 'dashboard',      icon: <AppstoreOutlined />,      label: 'Dashboard Vận Hành' },
  { type: 'divider' },
  { key: 'creators',       icon: <UserOutlined />,          label: 'Creator Catalog' },
  { key: 'creator-claims', icon: <SafetyCertificateOutlined />, label: 'Duyệt Claims' },
  { type: 'divider' },
  { key: 'data-sources',   icon: <ApiOutlined />,           label: 'Data Sources' },
  { key: 'jobs',           icon: <ThunderboltOutlined />,   label: 'Collection Jobs' },
  { key: 'scoring',        icon: <TrophyOutlined />,        label: 'Scoring Config' },
];

const ROUTE_KEY_MAP: Record<string, string> = {
  '/admin/dashboard':      'dashboard',
  '/admin/accounts':       'accounts',
  '/admin/creators':       'creators',
  '/admin/creator-claims': 'creator-claims',
  '/admin/data-sources':   'data-sources',
  '/admin/jobs':           'jobs',
  '/admin/scoring':        'scoring',
  '/admin/subscriptions':  'subscriptions',
  '/admin/payments':       'payments',
  '/admin/audit':          'audit',
};

const KEY_ROUTE_MAP: Record<string, string> = {
  dashboard:       ADMIN_ROUTES.DASHBOARD,
  accounts:        ADMIN_ROUTES.ACCOUNTS.LIST,
  creators:        ADMIN_ROUTES.CREATORS,
  'creator-claims': ADMIN_ROUTES.CREATOR_CLAIMS,
  'data-sources':  ADMIN_ROUTES.DATA_SOURCES,
  jobs:            ADMIN_ROUTES.JOBS,
  scoring:         ADMIN_ROUTES.SCORING,
  subscriptions:   ADMIN_ROUTES.SUBSCRIPTIONS,
  payments:        ADMIN_ROUTES.PAYMENTS,
  audit:           ADMIN_ROUTES.AUDIT,
};

export default function AdminSidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentUser: any = adminAuthService.getCurrentUser() || ADMIN_USER;
  const isManager = authService.isManager() || currentUser?.role === 'DATA_MANAGER' || currentUser?.role === 'manager';

  const menuItems = isManager ? MANAGER_MENU_ITEMS : ADMIN_MENU_ITEMS;

  const activeKey = Object.entries(ROUTE_KEY_MAP).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'dashboard';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const route = KEY_ROUTE_MAP[key];
    if (route) navigate(route);
  };

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/login');
  };

  const userDropdown: MenuProps['items'] = [
    { key: 'profile',  icon: <UserOutlined />,   label: isManager ? 'Hồ sơ Manager' : 'Hồ sơ Admin' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: handleLogout },
  ];

  return (
    <Sider
      width={240}
      collapsedWidth={68}
      collapsed={collapsed}
      className="app-sider"          /* reuse brand sidebar CSS */
      style={{ position: 'sticky', top: 0, height: '100vh' }}
    >
      {/* Logo + Brand */}
      <div
        onClick={() => navigate(ADMIN_ROUTES.DASHBOARD)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          padding: collapsed ? '4px 6px 14px' : '4px 6px 14px',
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all 0.2s',
        }}
      >
        <div
          style={{
            width: 36, height: 36,
            background: isManager
              ? 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)'
              : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16,
            boxShadow: isManager ? '0 4px 12px rgba(6,182,212,0.3)' : '0 4px 12px rgba(124,58,237,0.3)',
            flexShrink: 0, position: 'relative',
          }}
        >
          <SafetyCertificateOutlined style={{ fontSize: 18 }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', letterSpacing: 0.5, lineHeight: 1.2 }}>
              {isManager ? 'MANAGER PANEL' : 'ADMIN PANEL'}
            </div>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1.2, color: isManager ? '#0EA5E9' : '#8B5CF6' }}>
              {isManager ? 'DATA & OPERATIONS' : 'INFLUENCERMATCH'}
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: '0 4px 8px' }}>
        <Tooltip title={collapsed ? 'Mở rộng' : 'Thu gọn'} placement="right">
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#8B5CF6', transition: 'all 0.2s',
            }}
          >
            {collapsed
              ? <MenuUnfoldOutlined style={{ fontSize: 11 }} />
              : <MenuFoldOutlined   style={{ fontSize: 11 }} />}
          </div>
        </Tooltip>
      </div>

      {/* Navigation Menu — reuse brand sidebar-menu class */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={handleMenuClick}
          items={menuItems}
          className="sidebar-menu"
          inlineCollapsed={collapsed}
          style={{ background: 'transparent', border: 'none', fontSize: 13.5 }}
        />
      </div>

      {/* Bottom User Card — reuse brand sidebar-user-card class */}
      <div className="sidebar-user-card">
        <Dropdown menu={{ items: userDropdown }} placement="topRight" trigger={['click']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
            <Avatar
              src={currentUser.avatar}
              size={36}
              style={{ flexShrink: 0, border: '1.5px solid #CBD5E1' }}
            />
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#0F172A', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                    {currentUser.name}
                  </div>
                  <div style={{ color: isManager ? '#0EA5E9' : '#8B5CF6', fontSize: 10.5, fontWeight: 600, lineHeight: 1.2 }}>
                    {currentUser.roleLabel || (isManager ? 'Manager (Quản lý)' : 'Super Admin')}
                  </div>
                </div>
                <RightOutlined style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }} />
              </>
            )}
          </div>
        </Dropdown>
      </div>
    </Sider>
  );
}
