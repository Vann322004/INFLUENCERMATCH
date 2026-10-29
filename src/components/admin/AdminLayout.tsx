import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const { Content } = Layout;

interface AdminLayoutProps {
  pageTitle?: string;
}

export default function AdminLayout({ pageTitle }: AdminLayoutProps) {
  return (
    <Layout hasSider style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden', width: '100vw' }}>
      <AdminSidebar />
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
        <AdminHeader title={pageTitle} />
        <Content
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
