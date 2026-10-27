import { ConfigProvider, Layout, App as AntdApp } from 'antd';
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
import CampaignManagementPage from './pages/campaign/CampaignManagementPage';
import CampaignListPage from './pages/campaign/CampaignListPage';
import CampaignDetailPage from './pages/campaign/CampaignDetailPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import BrandProfilePage from './pages/brand/BrandProfilePage';
import OutreachCrmPage from './pages/crm/OutreachCrmPage';
import CollaborationPage from './pages/collaboration/CollaborationPage';
import PerformancePage from './pages/performance/PerformancePage';
import CampaignHistoryPage from './pages/history/CampaignHistoryPage';
import './styles/custom.css';

// ── Admin Imports ────────────────────────────────────
import AdminLayout from './components/admin/AdminLayout';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AccountManagementPage from './pages/admin/accounts/AccountManagementPage';
import AccountDetailPage from './pages/admin/accounts/AccountDetailPage';
import CreatorCatalogPage from './pages/admin/creators/CreatorCatalogPage';
import DataSourcesPage from './pages/admin/datasources/DataSourcesPage';
import CollectionJobsPage from './pages/admin/jobs/CollectionJobsPage';
import ScoringConfigPage from './pages/admin/scoring/ScoringConfigPage';
import SubscriptionPlansPage from './pages/admin/subscriptions/SubscriptionPlansPage';
import PaymentsPage from './pages/admin/payments/PaymentsPage';
import AuditLogPage from './pages/admin/audit/AuditLogPage';
import CreatorClaimReviewPage from './pages/admin/claims/CreatorClaimReviewPage';
import DataQualityPage from './pages/admin/quality/DataQualityPage';

import { useMultiTabSessionSync } from './hooks/useMultiTabSessionSync';

const { Content } = Layout;

// Đồng bộ trạng thái đăng nhập giữa các tab
function SessionSyncHandler() {
  useMultiTabSessionSync();
  return null;
}

// Main App Layout Wrapper with Light Linear Sidebar & Top Header
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout hasSider style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden', width: '100vw' }}>
      {/* Light Linear Gradient Sidebar */}
      <AppSider />

      {/* Main Content Area */}
      <Layout style={{ background: '#F5F6FA', height: '100vh', overflow: 'hidden', minWidth: 0, flex: 1 }}>
        <AppHeader />

        <Content
          style={{
            background: '#F5F6FA',
            padding: '8px 24px 24px 24px',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            scrollBehavior: 'smooth',
            scrollSnapType: 'y proximity',
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
      <AntdApp>
        <SessionSyncHandler />
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

          {/* Campaign Detail Route (Hỗ trợ URL sạch không lộ ID) */}
          <Route
            path="/campaigns/detail"
            element={
              <MainLayout>
                <CampaignDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/campaign-detail"
            element={
              <MainLayout>
                <CampaignDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/campaign-management/detail"
            element={
              <MainLayout>
                <CampaignDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <MainLayout>
                <CampaignDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/campaign-detail/:id"
            element={
              <MainLayout>
                <CampaignDetailPage />
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

          {/* Campaign Management — List of campaigns */}
          <Route
            path="/campaign-management"
            element={
              <MainLayout>
                <CampaignListPage />
              </MainLayout>
            }
          />
          <Route
            path="/pipeline"
            element={
              <MainLayout>
                <CampaignListPage />
              </MainLayout>
            }
          />
          <Route
            path="/campaigns/management"
            element={
              <MainLayout>
                <CampaignListPage />
              </MainLayout>
            }
          />
          {/* Outreach & Relationship CRM Routes */}
          <Route
            path="/crm"
            element={
              <MainLayout>
                <OutreachCrmPage />
              </MainLayout>
            }
          />
          <Route
            path="/outreach"
            element={
              <MainLayout>
                <OutreachCrmPage />
              </MainLayout>
            }
          />
          <Route
            path="/outreach-crm"
            element={
              <MainLayout>
                <OutreachCrmPage />
              </MainLayout>
            }
          />
          <Route
            path="/relationships"
            element={
              <MainLayout>
                <OutreachCrmPage />
              </MainLayout>
            }
          />

          {/* Collaboration & Operations Routes */}
          <Route
            path="/collaboration"
            element={
              <MainLayout>
                <CollaborationPage />
              </MainLayout>
            }
          />
          <Route
            path="/collab"
            element={
              <MainLayout>
                <CollaborationPage />
              </MainLayout>
            }
          />
          <Route
            path="/operations"
            element={
              <MainLayout>
                <CollaborationPage />
              </MainLayout>
            }
          />

          {/* Campaign Pipeline Detail — Kanban view for a specific campaign */}
          <Route
            path="/campaign-management/:id"
            element={
              <MainLayout>
                <CampaignManagementPage />
              </MainLayout>
            }
          />

          {/* AI Recommendation Routes */}
          <Route
            path="/recommendations"
            element={
              <MainLayout>
                <CampaignManagementPage />
              </MainLayout>
            }
          />
          <Route
            path="/ai-recommendations"
            element={
              <MainLayout>
                <CampaignManagementPage />
              </MainLayout>
            }
          />

          {/* Performance & Analytics Routes */}
          <Route
            path="/performance"
            element={
              <MainLayout>
                <PerformancePage />
              </MainLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <MainLayout>
                <PerformancePage />
              </MainLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <MainLayout>
                <PerformancePage />
              </MainLayout>
            }
          />

          {/* Campaign History Routes */}
          <Route
            path="/campaign-history"
            element={
              <MainLayout>
                <CampaignHistoryPage />
              </MainLayout>
            }
          />
          <Route
            path="/history"
            element={
              <MainLayout>
                <CampaignHistoryPage />
              </MainLayout>
            }
          />

          {/* Subscription & Billing Routes */}
          <Route
            path="/subscription"
            element={
              <MainLayout>
                <SubscriptionPage />
              </MainLayout>
            }
          />
          <Route
            path="/billing"
            element={
              <MainLayout>
                <SubscriptionPage />
              </MainLayout>
            }
          />
          <Route
            path="/plans"
            element={
              <MainLayout>
                <SubscriptionPage />
              </MainLayout>
            }
          />

          {/* Brand Profile Routes */}
          <Route
            path="/brand-profile"
            element={
              <MainLayout>
                <BrandProfilePage />
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <MainLayout>
                <BrandProfilePage />
              </MainLayout>
            }
          />

          {/* Root Redirects to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── Admin Routes (/admin/*) ─────────────────────── */}
          {/* Admin login dùng chung trang /login của Brand */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />

          {/* Admin Protected Pages — wrapped in AdminLayout */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            {/* Phase 3 — Account Management */}
            <Route path="accounts" element={<AccountManagementPage />} />
            <Route path="accounts/:id" element={<AccountDetailPage />} />
            {/* Phase 4 — Creator Catalog */}
            <Route path="creators" element={<CreatorCatalogPage />} />
            {/* Phase 5 — Data Sources */}
            <Route path="data-sources" element={<DataSourcesPage />} />
            {/* Phase 6 — Collection Jobs, Data Quality & Scoring Config */}
            <Route path="jobs" element={<CollectionJobsPage />} />
            <Route path="data-quality" element={<DataQualityPage />} />
            <Route path="scoring" element={<ScoringConfigPage />} />
            {/* Phase 7 — Subscriptions & Payments */}
            <Route path="subscriptions" element={<SubscriptionPlansPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            {/* Phase 8 — Audit Log */}
            <Route path="audit" element={<AuditLogPage />} />
            {/* Phase 9 — Creator Claim Review */}
            <Route path="creator-claims" element={<CreatorClaimReviewPage />} />
          </Route>

          {/* Admin root redirect */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
