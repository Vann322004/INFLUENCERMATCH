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
    <Layout style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      <AdminSidebar />
      <Layout style={{ background: '#F5F6FA', height: '100vh', overflow: 'hidden' }}>
        <AdminHeader title={pageTitle} />
        <Content
          style={{
            background: '#F5F6FA',
            padding: '20px 28px 20px 28px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
