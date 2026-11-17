import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  LineChartOutlined,
  ApiOutlined,
  DollarOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';

const { Sider } = Layout;

export const CREATOR_MENU_ITEMS = [
  { key: 'dashboard', icon: <LineChartOutlined />, label: 'Tổng quan' },
  { key: 'rate-card', icon: <DollarOutlined />, label: 'Bảng giá Rate Card' },
  { key: 'social-accounts', icon: <ApiOutlined />, label: 'Kênh liên kết' },
  { key: 'bookings', icon: <CalendarOutlined />, label: 'Hợp tác' },
];

/**
 * Sidebar Creator Portal — dùng chung class/hệ màu với AppSider (Brand)
 * để đồng bộ giao diện giữa các vai trò (Dark Slate / Royal Blue).
 */
export default function CreatorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.fullName || currentUser?.email || 'Nhà sáng tạo';

  const initials = (() => {
    const parts = (currentUser?.fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return 'KC';
  })();

  const getActiveKey = () => {
    const path = location.pathname;
    if (path.includes('verification')) return 'verification';
    if (path.includes('social')) return 'social-accounts';
    if (path.includes('rate-card')) return 'rate-card';
    if (path.includes('booking')) return 'bookings';
    return 'dashboard';
  };
  const activeKey = getActiveKey();

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
      collapsedWidth={62}
      collapsed={collapsed}
      className="app-sider creator-desktop-sidebar"
      style={{ position: 'sticky', top: 0, height: '100vh' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: collapsed ? 'center' : 'stretch' }}>
        <div>
          {/* Logo + Brand (bấm để thu gọn / mở rộng giống sidebar Brand) */}
          <div className="sidebar-expanded-header" style={collapsed ? { justifyContent: 'center', padding: 0 } : undefined}>
            <Tooltip title={collapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên'} placement={collapsed ? 'right' : 'bottom'}>
              <div
                className="sidebar-brand-btn"
                role="button"
                tabIndex={0}
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên'}
              >
                <div className="sidebar-logo-icon-box">
                  <img src="/logo.png" alt="InfluencerMatch Logo" className="sidebar-logo-img" />
                </div>
                {!collapsed && <span className="sidebar-brand-name">InfluencerMatch</span>}
              </div>
            </Tooltip>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: collapsed ? 6 : 4, alignItems: collapsed ? 'center' : 'stretch' }}>
            {CREATOR_MENU_ITEMS.map((item) =>
              collapsed ? (
                <Tooltip key={item.key} title={item.label} placement="right">
                  <button
                    type="button"
                    className={`sidebar-rail-btn ${activeKey === item.key ? 'active' : ''}`}
                    onClick={() => navigate(`/creator/${item.key}`)}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </button>
                </Tooltip>
              ) : (
                <div
                  key={item.key}
                  onClick={() => navigate(`/creator/${item.key}`)}
                  className={`sidebar-nav-item ${activeKey === item.key ? 'active' : ''}`}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* User card */}
        <div className="sidebar-bottom-user-section" style={collapsed ? { padding: '8px 0', display: 'flex', justifyContent: 'center' } : undefined}>
          <Dropdown menu={{ items: userDropdown }} placement="topRight" trigger={['click']}>
            {collapsed ? (
              <div className="sidebar-rail-avatar-btn" style={{ cursor: 'pointer' }}>
                <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 12.5 }}>{initials}</span>
              </div>
            ) : (
              <div className="sidebar-user-info-row" style={{ cursor: 'pointer' }}>
                <div className="sidebar-user-avatar">{initials}</div>
                <div className="sidebar-user-details" style={{ flex: 1, minWidth: 0 }}>
                  <div className="sidebar-user-name">{userName}</div>
                  <div className="sidebar-user-role">Nhà sáng tạo (Creator)</div>
                </div>
                <SettingOutlined style={{ fontSize: 14, color: '#94A3B8', marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            )}
          </Dropdown>
        </div>
      </div>
    </Sider>
  );
}
