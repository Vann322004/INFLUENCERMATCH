import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { themeConfig } from './theme/themeConfig';
import AppSider from './components/layout/AppSider';
import AppHeader from './components/layout/AppHeader';
import DashboardPage from './pages/dashboard/DashboardPage';
import CampaignPage from './pages/campaign/CampaignPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AuthLayout from './components/layout/AuthLayout';
import CreateCampaignPage from './pages/campaign/CreateCampaignPage';
import CreatorDiscoveryPage from './pages/creator/CreatorDiscoveryPage';
import CreatorDetailPage from './pages/creator/CreatorDetailPage';
import CreatorShortlistPage from './pages/creator/CreatorShortlistPage';
import './styles/custom.css';

const { Content } = Layout;

// Main App Layout Wrapper with Light Linear Sidebar & Top Header
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      {/* Light Linear Gradient Sidebar */}
      <AppSider />

      {/* Main Content Area */}
      <Layout style={{ background: '#F5F6FA', height: '100vh', overflow: 'hidden' }}>
        <AppHeader />

        <Content
          style={{
            background: '#F5F6FA',
            padding: '20px 28px 20px 28px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthLayout>
                <ResetPasswordPage />
              </AuthLayout>
            }
          />

          {/* Dashboard Page Route */}
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />

          {/* Campaigns Page Route */}
          <Route
            path="/campaigns"
            element={
              <MainLayout>
                <CampaignPage />
              </MainLayout>
            }
          />

          {/* Create Campaign Route */}
          <Route
            path="/campaigns/create"
            element={
              <MainLayout>
                <CreateCampaignPage />
              </MainLayout>
            }
          />
          <Route
            path="/create-campaign"
            element={
              <MainLayout>
                <CreateCampaignPage />
              </MainLayout>
            }
          />

          {/* Discover Creators Route */}
          <Route
            path="/creators"
            element={
              <MainLayout>
                <CreatorDiscoveryPage />
              </MainLayout>
            }
          />
          <Route
            path="/creators/discover"
            element={
              <MainLayout>
                <CreatorDiscoveryPage />
              </MainLayout>
            }
          />
          <Route
            path="/creators-match"
            element={
              <MainLayout>
                <CreatorDiscoveryPage />
              </MainLayout>
            }
          />

          {/* Creator Detail Routes */}
          <Route
            path="/creators/:id"
            element={
              <MainLayout>
                <CreatorDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/creators/detail"
            element={
              <MainLayout>
                <CreatorDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/creator-detail"
            element={
              <MainLayout>
                <CreatorDetailPage />
              </MainLayout>
            }
          />

          {/* Shortlists & Comparison Routes */}
          <Route
            path="/shortlists"
            element={
              <MainLayout>
                <CreatorShortlistPage />
              </MainLayout>
            }
          />
          <Route
            path="/creators/shortlist"
            element={
              <MainLayout>
                <CreatorShortlistPage />
              </MainLayout>
            }
          />
          <Route
            path="/shortlist"
            element={
              <MainLayout>
                <CreatorShortlistPage />
              </MainLayout>
            }
          />

          {/* Root Redirects to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
