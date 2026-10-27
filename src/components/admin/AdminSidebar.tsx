import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  ApiOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ControlOutlined,
  CrownOutlined,
  TransactionOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { adminAuthService, ADMIN_USER } from '../../mock/adminData';

const { Sider } = Layout;

const getMenuItems = (collapsed: boolean): MenuProps['items'] => [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard Tổng quan' },
  { type: 'divider' },
  ...(collapsed
    ? []
    : [
        {
          type: 'group' as const,
          label: (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: 0.8 }}>
              DATA INGESTION PIPELINE
            </span>
          ),
          children: [
            { key: 'data-sources', icon: <ApiOutlined />, label: 'Data Sources & API' },
            { key: 'jobs', icon: <SyncOutlined />, label: 'Tiến trình cào (Jobs)' },
            { key: 'data-quality', icon: <CheckCircleOutlined />, label: 'Kiểm định chất lượng' },
            { key: 'scoring', icon: <ControlOutlined />, label: 'Cấu hình Scoring' },
          ],
        },
      ]),
  ...(collapsed
    ? [
        { key: 'data-sources', icon: <ApiOutlined />, label: 'Data Sources & API' },
        { key: 'jobs', icon: <SyncOutlined />, label: 'Tiến trình cào' },
        { key: 'data-quality', icon: <CheckCircleOutlined />, label: 'Kiểm định dữ liệu' },
        { key: 'scoring', icon: <ControlOutlined />, label: 'Cấu hình Scoring' },
      ]
    : []),
  { type: 'divider' },
  ...(collapsed
    ? []
    : [
        {
          type: 'group' as const,
          label: (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: 0.8 }}>
              CATALOG & XÁC MINH
            </span>
          ),
          children: [
            { key: 'creators', icon: <UserOutlined />, label: 'Creator Catalog' },
            { key: 'creator-claims', icon: <SafetyCertificateOutlined />, label: 'Duyệt hồ sơ Claims' },
          ],
        },
      ]),
  ...(collapsed
    ? [
        { key: 'creators', icon: <UserOutlined />, label: 'Creator Catalog' },
        { key: 'creator-claims', icon: <SafetyCertificateOutlined />, label: 'Duyệt Claims' },
      ]
    : []),
  { type: 'divider' },
  ...(collapsed
    ? []
    : [
        {
          type: 'group' as const,
          label: (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: 0.8 }}>
              QUẢN TRỊ HỆ THỐNG
            </span>
          ),
          children: [
            { key: 'accounts', icon: <TeamOutlined />, label: 'Tài khoản người dùng' },
            { key: 'subscriptions', icon: <CrownOutlined />, label: 'Gói Subscription' },
            { key: 'payments', icon: <TransactionOutlined />, label: 'Giao dịch & Thanh toán' },
            { key: 'audit', icon: <FileTextOutlined />, label: 'Nhật ký Audit Log' },
          ],
        },
      ]),
  ...(collapsed
    ? [
        { key: 'accounts', icon: <TeamOutlined />, label: 'Tài khoản' },
        { key: 'subscriptions', icon: <CrownOutlined />, label: 'Subscriptions' },
        { key: 'payments', icon: <TransactionOutlined />, label: 'Payments' },
        { key: 'audit', icon: <FileTextOutlined />, label: 'Audit Log' },
      ]
    : []),
];

const ROUTE_KEY_MAP: Record<string, string> = {
  '/admin/dashboard':      'dashboard',
  '/admin/data-sources':   'data-sources',
  '/admin/jobs':           'jobs',
  '/admin/data-quality':   'data-quality',
  '/admin/scoring':        'scoring',
  '/admin/creators':       'creators',
  '/admin/creator-claims': 'creator-claims',
  '/admin/accounts':       'accounts',
  '/admin/subscriptions':  'subscriptions',
  '/admin/payments':       'payments',
  '/admin/audit':          'audit',
};

const KEY_ROUTE_MAP: Record<string, string> = {
  dashboard:        ADMIN_ROUTES.DASHBOARD,
  'data-sources':   ADMIN_ROUTES.DATA_SOURCES,
  jobs:             ADMIN_ROUTES.JOBS,
  'data-quality':   ADMIN_ROUTES.DATA_QUALITY,
  scoring:          ADMIN_ROUTES.SCORING,
  creators:         ADMIN_ROUTES.CREATORS,
  'creator-claims': ADMIN_ROUTES.CREATOR_CLAIMS,
  accounts:         ADMIN_ROUTES.ACCOUNTS.LIST,
  subscriptions:    ADMIN_ROUTES.SUBSCRIPTIONS,
  payments:         ADMIN_ROUTES.PAYMENTS,
  audit:            ADMIN_ROUTES.AUDIT,
};

export default function AdminSidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentUser: any = adminAuthService.getCurrentUser() || ADMIN_USER;

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
    { key: 'profile',  icon: <UserOutlined />,   label: 'Hồ sơ Admin' },
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
            width: 32,
            height: 32,
            background: '#0F172A',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          <SafetyCertificateOutlined style={{ fontSize: 16 }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', letterSpacing: -0.2, lineHeight: 1.2 }}>
              Admin Panel
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#64748B' }}>
              InfluencerMatch
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
          items={getMenuItems(collapsed)}
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
                  <div style={{ color: '#8B5CF6', fontSize: 10.5, fontWeight: 600, lineHeight: 1.2 }}>
                    {currentUser.roleLabel || 'Super Admin'}
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
