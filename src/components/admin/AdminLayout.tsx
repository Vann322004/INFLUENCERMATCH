import React, { useCallback, useState } from 'react';
import { Grid, Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminResponsive.css';

const { Content } = Layout;

interface AdminLayoutProps {
  pageTitle?: string;
}

export default function AdminLayout({ pageTitle }: AdminLayoutProps) {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  return (
    <Layout className={`admin-workspace ${mobile ? 'admin-mobile' : ''}`} hasSider={!mobile} style={{ minHeight: '100dvh', maxHeight: '100dvh', overflow: 'hidden', width: '100%' }}>
      <AdminSidebar mobile={mobile} compact={!screens.lg} open={menuOpen} onClose={closeMenu} />
      <Layout
        style={{
          background: '#F5F6FA',
          height: '100dvh',
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
          flex: 1,
          scrollBehavior: 'smooth',
          boxSizing: 'border-box',
        }}
      >
        <AdminHeader title={pageTitle} mobile={mobile} menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
        <Content
          className="admin-content"
          style={{
            background: '#F5F6FA',
            padding: '16px 24px 32px 24px',
            overflow: 'visible',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
          }}
        >
          <div className="app-page-wrapper" style={{ maxWidth: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
