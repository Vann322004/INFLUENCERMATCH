import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Dropdown } from 'antd';
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
import { SidebarToggleIcon, ChatGptTooltip } from '../admin/sidebar/AdminSidebarTooltip';

const { Sider } = Layout;

export const CREATOR_MENU_ITEMS = [
  { key: 'dashboard', icon: <LineChartOutlined style={{ fontSize: 18 }} />, label: 'Tổng quan' },
  { key: 'rate-card', icon: <DollarOutlined style={{ fontSize: 18 }} />, label: 'Bảng giá Rate Card' },
  { key: 'social-accounts', icon: <ApiOutlined style={{ fontSize: 18 }} />, label: 'Kênh liên kết' },
  { key: 'bookings', icon: <CalendarOutlined style={{ fontSize: 18 }} />, label: 'Hợp tác' },
];

/**
 * Sidebar Creator Portal — đồng bộ 100% cấu trúc, hiệu ứng morph logo,
 * ChatGptTooltip và trạng thái chọn với Brand, Data Manager và Admin.
 */
export default function CreatorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('influencer_creator_sidebar_collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('influencer_creator_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ Creator', onClick: () => navigate('/creator/verification') },
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
      style={{ position: 'sticky', top: 0, height: '100dvh', maxHeight: '100dvh', overflow: 'hidden', flexShrink: 0, zIndex: 100 }}
    >
      {collapsed ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 12 }}>
              <ChatGptTooltip title="Mở thanh bên" shortcut="Ctrl+Shift+S">
                <button
                  type="button"
                  className="sidebar-rail-logo-btn"
                  onClick={() => setCollapsed(false)}
                  aria-label="Mở thanh bên"
                >
                  <div className="sidebar-logo-icon-box">
                    <img src="/logo.png" alt="InfluencerMatch Logo" className="sidebar-logo-img" />
                    <span className="sidebar-toggle-glyph">
                      <SidebarToggleIcon size={20} />
                    </span>
                  </div>
                </button>
              </ChatGptTooltip>
            </div>

            <div
              style={{
                width: 32,
                height: 1,
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                marginBottom: 10,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CREATOR_MENU_ITEMS.map((item) => (
                <ChatGptTooltip key={item.key} title={item.label}>
                  <button
                    type="button"
                    className={`sidebar-rail-btn ${activeKey === item.key ? 'active' : ''}`}
                    onClick={() => navigate(`/creator/${item.key}`)}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </button>
                </ChatGptTooltip>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Dropdown menu={{ items: userDropdown }} placement="topRight" trigger={['click']}>
              <div>
                <ChatGptTooltip title={`${userName} (Nhà sáng tạo)`}>
                  <div className="sidebar-rail-avatar-btn">
                    <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 12 }}>
                      {initials}
                    </span>
                  </div>
                </ChatGptTooltip>
              </div>
            </Dropdown>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="sidebar-expanded-header">
              <ChatGptTooltip title="Thu gọn thanh bên" shortcut="Ctrl+Shift+S" placement="bottom">
                <button
                  type="button"
                  className="sidebar-brand-btn"
                  onClick={() => setCollapsed(true)}
                  aria-label="Thu gọn thanh bên"
                >
                  <div className="sidebar-logo-icon-box">
                    <img src="/logo.png" alt="InfluencerMatch Logo" className="sidebar-logo-img" />
                    <span className="sidebar-toggle-glyph">
                      <SidebarToggleIcon size={20} />
                    </span>
                  </div>
                  <span className="sidebar-brand-name">Influencer<span className="sidebar-brand-match">Match</span></span>
                </button>
              </ChatGptTooltip>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CREATOR_MENU_ITEMS.map((item) => (
                <div
                  key={item.key}
                  onClick={() => navigate(`/creator/${item.key}`)}
                  className={`sidebar-nav-item ${activeKey === item.key ? 'active' : ''}`}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-bottom-user-section">
            <Dropdown menu={{ items: userDropdown }} placement="topRight" trigger={['click']}>
              <div className="sidebar-user-info-row" style={{ cursor: 'pointer' }}>
                <div className="sidebar-user-avatar">{initials}</div>
                <div className="sidebar-user-details" style={{ flex: 1, minWidth: 0 }}>
                  <div className="sidebar-user-name">{userName}</div>
                  <div className="sidebar-user-role">Nhà sáng tạo (Creator)</div>
                </div>
                <SettingOutlined style={{ fontSize: 14, color: '#94A3B8', marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            </Dropdown>
          </div>
        </div>
      )}
    </Sider>
  );
}
