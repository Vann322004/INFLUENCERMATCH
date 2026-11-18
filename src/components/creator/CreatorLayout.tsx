import React from 'react';
import { Layout } from 'antd';
import { Outlet, useMatch } from 'react-router-dom';
import CreatorSidebar from './CreatorSidebar';
import CreatorHeader from './CreatorHeader';

const { Content } = Layout;

interface CreatorLayoutProps {
  pageTitle?: string;
}

export default function CreatorLayout({ pageTitle }: CreatorLayoutProps) {
  const collaborationDetail = useMatch('/creator/bookings/:collaborationId');
  return (
    <Layout style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      <CreatorSidebar />
      <Layout style={{ background: '#F5F6FA', height: '100vh', overflow: 'hidden' }}>
        <CreatorHeader title={pageTitle ?? (collaborationDetail ? 'Chi tiết Hợp tác' : undefined)} />
        <Content
          className="creator-content-layout"
          style={{
            background: '#F5F6FA',
            overflowY: 'auto',
            boxSizing: 'border-box',
            padding: '24px 28px 40px',
          }}
        >
          <div className="app-page-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
