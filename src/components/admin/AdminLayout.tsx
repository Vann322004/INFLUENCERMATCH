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
    <Layout style={{ minHeight: '100vh', background: '#0F172A' }}>
      <AdminSidebar />
      <Layout style={{ background: '#0F172A', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AdminHeader title={pageTitle} />
        <Content
          style={{
            background: '#0B1120',
            overflowY: 'auto',
            padding: '24px 28px 40px',
            boxSizing: 'border-box',
            flex: 1,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
