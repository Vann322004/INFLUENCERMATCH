import React, { useState } from 'react';
import { Drawer, Grid, Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

const { Content } = Layout;

interface AdminLayoutProps {
  pageTitle?: string;
}

export default function AdminLayout({ pageTitle }: AdminLayoutProps) {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Layout hasSider style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden', width: '100vw' }}>
      {mobile ? <Drawer title="Điều hướng" placement="left" open={menuOpen} onClose={() => setMenuOpen(false)} size={280} styles={{ body: { padding: 0 } }} className="admin-mobile-navigation">
        <AdminSidebar mobile onNavigate={() => setMenuOpen(false)} />
      </Drawer> : <AdminSidebar />}
      <Layout
        style={{
          background: '#F5F6FA',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
          flex: 1,
          scrollBehavior: 'smooth',
          boxSizing: 'border-box',
        }}
      >
        <AdminHeader title={pageTitle} onMenuClick={mobile ? () => setMenuOpen(true) : undefined} />
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
