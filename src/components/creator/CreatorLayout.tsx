import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import CreatorSidebar from './CreatorSidebar';
import CreatorHeader from './CreatorHeader';

const { Content } = Layout;

interface CreatorLayoutProps {
  pageTitle?: string;
}

export default function CreatorLayout({ pageTitle }: CreatorLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      <CreatorSidebar />
      <Layout style={{ background: '#F8FAFC', height: '100vh', overflow: 'hidden' }}>
        <CreatorHeader title={pageTitle} />
        <Content
          style={{
            background: '#F8FAFC',
            padding: '20px 28px',
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
