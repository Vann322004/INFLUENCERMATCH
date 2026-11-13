import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, Layout } from 'antd';
import { adminAuthService } from '../../services/api/adminAuthService';
import { authService } from '../../services/api/authService';
import { ROUTE_KEY_MAP } from './sidebar/adminSidebarItems';
import AdminSidebarHeader from './sidebar/AdminSidebarHeader';
import AdminSidebarNav from './sidebar/AdminSidebarNav';
import AdminSidebarUserSection from './sidebar/AdminSidebarUserSection';

const { Sider } = Layout;

export default function AdminSidebar({ mobile = false, compact = false, open = false, onClose = () => {} }: {
  mobile?: boolean; compact?: boolean; open?: boolean; onClose?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Persist collapsed state
  const [savedCollapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('influencer_admin_sidebar_collapsed');
    return saved !== null ? saved === 'true' : false;
  });
  const collapsed = !mobile && (compact || savedCollapsed);

  useEffect(() => {
    localStorage.setItem('influencer_admin_sidebar_collapsed', String(savedCollapsed));
  }, [savedCollapsed]);

  useEffect(() => { onClose(); }, [location.pathname, location.search, mobile, onClose]);

  // Global Keyboard Shortcut: Ctrl+Shift+S (or Cmd+Shift+S) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        if (mobile) { onClose(); return; }
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobile, onClose]);

  const currentUser: any = adminAuthService.getCurrentUser() || { fullName: 'Quản trị viên', role: 'ADMIN' };
  const isManager = authService.isManager() || currentUser?.role === 'DATA_MANAGER' || currentUser?.role === 'manager';

  const activeKey = Object.entries(ROUTE_KEY_MAP).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'dashboard';

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/login');
  };

  const content = (
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
          toggleLabel={mobile ? 'Đóng menu điều hướng' : undefined}
          onToggle={() => mobile ? onClose() : setCollapsed((prev) => !prev)}
        />

        {/* Main Navigation: Categories & Rail Items */}
        <AdminSidebarNav
          collapsed={collapsed}
          activeKey={activeKey}
          isManager={isManager}
          onNavigate={(path) => { navigate(isManager ? path.replace(/^\/admin(?=\/)/, '/data-manager') : path); onClose(); }}
        />

        {/* Bottom Section: User Profile & Quick Action */}
        <AdminSidebarUserSection
          collapsed={collapsed}
          currentUser={currentUser}
          isManager={isManager}
          onLogout={handleLogout}
        />
      </div>
  );

  if (mobile) return (
    <Drawer id="admin-navigation" title="Menu điều hướng" placement="left" width="min(320px, 100vw)"
      className="admin-navigation-drawer" open={open} onClose={onClose}
      styles={{ body: { padding: 0, overflow: 'hidden' } }}>
      {content}
    </Drawer>
  );

  return <Sider width={240} collapsedWidth={62} collapsed={collapsed} className="app-sider"
    style={{ position: 'sticky', top: 0, height: '100dvh', maxHeight: '100dvh', overflow: 'hidden', flexShrink: 0, zIndex: 100 }}>
    {content}
  </Sider>;
}
