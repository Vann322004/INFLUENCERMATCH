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
      <Layout style={{ background: '#F8FAFC', height: '100vh', overflow: 'hidden' }}>
        <CreatorHeader title={pageTitle ?? (collaborationDetail ? 'Creator Portal' : undefined)} />
        <Content
          className="creator-content-layout"
          style={{
            background: '#F8FAFC',
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
