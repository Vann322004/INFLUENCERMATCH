import React, { useState, useEffect } from 'react';
import { Layout, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserOutlined,
  CrownOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { authService } from '../../services/api/authService';

const { Sider } = Layout;

// ============================================================================
// Exact SVG Icons matching the Reference Design
// ============================================================================

/** Sidebar toggle icon [ | ] (rounded rectangle with left panel dividing line) */
const SidebarToggleIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

/** Standing books icon [ |||\ ] for "Chiến dịch" (Campaigns) */
const LibraryBooksIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <path d="m16 6 4 14" />
    <path d="M12 6v14" />
    <path d="M8 8v12" />
    <path d="M4 4v16" />
  </svg>
);

/** Collaboration / Operations icon (clipboard with checkmark) for "Hợp tác & Vận hành" */
const CollaborationIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

// ============================================================================
// Sleek Capsule Pill Tooltip matching the user's reference design
// ============================================================================

interface ChatGptTooltipProps {
  title: string;
  shortcut?: string;
  placement?: 'right' | 'top' | 'bottom' | 'left';
  children: React.ReactElement;
  disabled?: boolean;
}

function ChatGptTooltip({
  title,
  shortcut,
  placement = 'right',
  children,
  disabled = false,
}: ChatGptTooltipProps) {
  if (disabled) return children;

  return (
    <Tooltip
      placement={placement}
      arrow={false}
      mouseEnterDelay={0.12}
      mouseLeaveDelay={0.04}
      rootClassName="chatgpt-capsule-tooltip"
      title={
        <div className="chatgpt-tooltip-content">
          <span className="chatgpt-tooltip-text">{title}</span>
          {shortcut && <span className="chatgpt-tooltip-shortcut">{shortcut}</span>}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}

// ============================================================================
// Main AppSider Component - Phương án 2: Tối ưu Toàn diện
// ============================================================================

interface AppSiderProps {
  collapsed?: boolean;
}

export default function AppSider({ collapsed: initialCollapsed = false }: AppSiderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  // Persist collapsed preference in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('influencer_sidebar_collapsed');
    return saved !== null ? saved === 'true' : initialCollapsed;
  });

  useEffect(() => {
    localStorage.setItem('influencer_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  // Global Keyboard Shortcut: Ctrl+Shift+S (or Cmd+Shift+S) to toggle sidebar
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

  // Compute initials (e.g. "AM" or "VN") for avatar circle matching reference image
  const getInitials = () => {
    if (currentUser?.fullName) {
      const parts = currentUser.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'AM';
  };

  const initials = getInitials();
  const userName = currentUser?.fullName || 'Acme Brand Manager';

  // Determine active key from current URL path
  const getActiveKey = () => {
    const path = location.pathname;
    if (path.includes('subscription') || path.includes('billing') || path.includes('plans')) return 'subscription';
    if (path.includes('collaboration') || path.includes('collab') || path.includes('operations')) return 'collaboration';
    if (path.includes('crm') || path.includes('outreach') || path.includes('relationship')) return 'crm';
    if (path.includes('performance') || path.includes('reports') || path.includes('analytics')) return 'performance';
    if (
      path.includes('campaign') ||
      path.includes('creator') ||
      path.includes('shortlist') ||
      path.includes('recommendation') ||
      path.includes('pipeline')
    ) {
      return 'campaigns';
    }
    return 'dashboard';
  };

  const activeKey = getActiveKey();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userDropdownItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ Thương hiệu', onClick: () => navigate('/brand-profile') },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt hệ thống', onClick: () => navigate('/subscription') },
    { key: 'billing', icon: <CrownOutlined />, label: 'Quản lý gói & Hạn mức', onClick: () => navigate('/subscription') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: handleLogout },
  ];

  // Flat 5 Core Business Domains (Phương án 1 - Khớp 100% Backend & Single Source of Discovery)
  const navItems = [
    {
      key: 'dashboard',
      label: 'Tổng quan',
      icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
      path: '/dashboard',
    },
    {
      key: 'campaigns',
      label: 'Chiến dịch',
      icon: <LibraryBooksIcon size={18} />,
      path: '/campaigns',
    },
    {
      key: 'crm',
      label: 'Tiếp cận & Kết nối',
      icon: <TeamOutlined style={{ fontSize: 18 }} />,
      path: '/crm',
    },
    {
      key: 'collaboration',
      label: 'Hợp tác & Vận hành',
      icon: <CollaborationIcon size={18} />,
      path: '/collaboration',
    },
    {
      key: 'performance',
      label: 'Báo cáo & Hiệu suất',
      icon: <BarChartOutlined style={{ fontSize: 18 }} />,
      path: '/performance',
    },
  ];

  return (
    <Sider
      width={240}
      collapsedWidth={62}
      collapsed={collapsed}
      className="app-sider"
    >
      {/* ──────────────────────────────────────────────────────────────────
          COLLAPSED MODE: Clean 5-Domain Rail with Tooltip
          ────────────────────────────────────────────────────────────────── */}
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
          {/* Top Section: Logo that morphs into Sidebar Toggle Icon on hover */}
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

            {/* Subtle Divider */}
            <div
              style={{
                width: 32,
                height: 1,
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                marginBottom: 10,
              }}
            />

            {/* Core Domain Navigation Rail (5 flat items) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {navItems.map((item) => (
                <ChatGptTooltip key={item.key} title={item.label}>
                  <button
                    type="button"
                    className={`sidebar-rail-btn ${activeKey === item.key ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </button>
                </ChatGptTooltip>
              ))}
            </div>
          </div>

          {/* Bottom Section: Settings Icon + Brand User Avatar */}
          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ChatGptTooltip title="Cài đặt hệ thống">
              <button
                type="button"
                className={`sidebar-rail-btn ${activeKey === 'subscription' ? 'active' : ''}`}
                onClick={() => navigate('/subscription')}
                aria-label="Cài đặt hệ thống"
              >
                <SettingOutlined style={{ fontSize: 17 }} />
              </button>
            </ChatGptTooltip>

            <Dropdown menu={{ items: userDropdownItems }} placement="topRight" trigger={['click']}>
              <div>
                <ChatGptTooltip title="Tài khoản & Hồ sơ">
                  <div className="sidebar-rail-avatar-btn">
                    <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 12.5 }}>
                      {initials}
                    </span>
                  </div>
                </ChatGptTooltip>
              </div>
            </Dropdown>
          </div>
        </div>
      ) : (
        /* ──────────────────────────────────────────────────────────────────
           EXPANDED MODE: Clean 5-Item Flat Domain Architecture
           ────────────────────────────────────────────────────────────────── */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Section: Brand Logo & Text that morphs into Sidebar Toggle on hover */}
          <div>
            <div className="sidebar-expanded-header">
              <ChatGptTooltip title="Thu gọn thanh bên" shortcut="Ctrl+Shift+S" placement="bottom">
                <div
                  className="sidebar-brand-btn"
                  onClick={() => setCollapsed(true)}
                  role="button"
                  tabIndex={0}
                  aria-label="Thu gọn thanh bên"
                >
                  <div className="sidebar-logo-icon-box">
                    <img src="/logo.png" alt="InfluencerMatch Logo" className="sidebar-logo-img" />
                    <span className="sidebar-toggle-glyph">
                      <SidebarToggleIcon size={20} />
                    </span>
                  </div>
                  <span className="sidebar-brand-name">InfluencerMatch</span>
                </div>
              </ChatGptTooltip>
            </div>

            {/* Navigation Menu List (Flat 5-Item Domain Architecture) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navItems.map((item) => (
                <div
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`sidebar-nav-item ${activeKey === item.key ? 'active' : ''}`}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: User Card + Crown Action Pill */}
          <div className="sidebar-bottom-user-section">
            <Dropdown menu={{ items: userDropdownItems }} placement="topRight" trigger={['click']}>
              <div className="sidebar-user-info-row" style={{ cursor: 'pointer' }}>
                <div className="sidebar-user-avatar">
                  {initials}
                </div>

                <div className="sidebar-user-details" style={{ flex: 1, minWidth: 0 }}>
                  <div className="sidebar-user-name">
                    {userName}
                  </div>
                  <div className="sidebar-user-role">
                    Gói Doanh Nghiệp (Cao cấp)
                  </div>
                </div>

                <SettingOutlined style={{ fontSize: 14, color: '#94A3B8', marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            </Dropdown>

            <button
              type="button"
              onClick={() => navigate('/subscription')}
              className="sidebar-claim-pill-btn"
            >
              <CrownOutlined style={{ fontSize: 13, color: '#7C3AED' }} />
              <span>Quản lý gói & Hạn mức</span>
            </button>
          </div>
        </div>
      )}
    </Sider>
  );
}

