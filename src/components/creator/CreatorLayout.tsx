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
    <Layout
      className="creator-workspace"
      style={{
        minHeight: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #F4ECFF 0%, #FAF5FF 48%, #EFE4FF 100%)',
      }}
    >
      <CreatorSidebar />
      <Layout style={{ background: 'transparent', height: '100vh', overflow: 'hidden' }}>
        <CreatorHeader title={pageTitle ?? (collaborationDetail ? 'Chi tiết Hợp tác' : undefined)} />
        <Content
          className="creator-content-layout"
          style={{
            background: 'transparent',
            overflowY: 'auto',
            boxSizing: 'border-box',
            padding: '12px 24px 40px',
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
