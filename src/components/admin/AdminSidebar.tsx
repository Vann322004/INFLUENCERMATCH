import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { adminAuthService } from '../../services/api/adminAuthService';
import { authService } from '../../services/api/authService';
import { ROUTE_KEY_MAP } from './sidebar/adminSidebarItems';
import AdminSidebarHeader from './sidebar/AdminSidebarHeader';
import AdminSidebarNav from './sidebar/AdminSidebarNav';
import AdminSidebarUserSection from './sidebar/AdminSidebarUserSection';

const { Sider } = Layout;

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Persist collapsed state
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('influencer_admin_sidebar_collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('influencer_admin_sidebar_collapsed', String(collapsed));
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

  const currentUser: any = adminAuthService.getCurrentUser() || { fullName: 'Quản trị viên', role: 'ADMIN' };
  const isManager = authService.isManager() || currentUser?.role === 'DATA_MANAGER' || currentUser?.role === 'manager';

  const activeKey = Object.entries(ROUTE_KEY_MAP).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'dashboard';

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/login');
  };

  return (
    <Sider
      width={240}
      collapsedWidth={62}
      collapsed={collapsed}
      className="app-sider"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          overflow: 'hidden',
          alignItems: collapsed ? 'center' : 'stretch',
        }}
      >
        {/* Top Header: Logo & Toggle */}
        <AdminSidebarHeader
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />

        {/* Main Navigation: Categories & Rail Items */}
        <AdminSidebarNav
          collapsed={collapsed}
          activeKey={activeKey}
          isManager={isManager}
          onNavigate={(path) => navigate(path)}
        />

        {/* Bottom Section: User Profile & Quick Action */}
        <AdminSidebarUserSection
          collapsed={collapsed}
          currentUser={currentUser}
          isManager={isManager}
          onLogout={handleLogout}
          onActionClick={(path) => navigate(path)}
        />
      </div>
    </Sider>
  );
}
