import React, { useEffect } from 'react';
import { ConfigProvider, Layout, App as AntdApp } from 'antd';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useParams } from 'react-router-dom';
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
import LandingPage from './pages/landing/hero/HeroLanding';
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

// ── Creator Actor Imports ──────────────────────────────
import CreatorLayout from './components/creator/CreatorLayout';
import CreatorProtectedRoute from './components/creator/CreatorProtectedRoute';
import CreatorPortalPage from './pages/creator/portal/CreatorPortalPage';

import { useMultiTabSessionSync } from './hooks/useMultiTabSessionSync';

const { Content } = Layout;

// Đồng bộ trạng thái đăng nhập giữa các tab và tự động làm sạch UUID trên thanh URL
function SessionSyncHandler() {
  useMultiTabSessionSync();

  useEffect(() => {
    try {
      const search = window.location.search;
      if (search && search.includes('campaignId=')) {
        const sp = new URLSearchParams(search);
        const cId = sp.get('campaignId');
        if (cId) {
          sessionStorage.setItem('current_campaign_id', cId);
          localStorage.setItem('last_active_campaign_id', cId);
          sp.delete('campaignId');
          const newSearch = sp.toString() ? `?${sp.toString()}` : '';
          window.history.replaceState({}, '', window.location.pathname + newSearch);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return null;
}

// Dispatcher cho route /campaign-management: nếu có query param tab (ví dụ: tab=recommendation) thì mở CampaignManagementPage
function CampaignManagementRouteDispatcher() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  if (tab === 'recommendation' || tab === 'crm' || tab === 'pipeline' || tab === 'kanban' || tab === 'tasks' || tab === 'analytics') {
    return <CampaignManagementPage />;
  }
  return <CampaignListPage />;
}

// Chuyển hướng route /campaign-management/:id để ẩn hoàn toàn UUID khỏi URL bar của trình duyệt
function CampaignManagementIdRedirect() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  if (id) {
    sessionStorage.setItem('current_campaign_id', id);
    localStorage.setItem('last_active_campaign_id', id);
  }
  const tab = searchParams.get('tab') || 'recommendation';
  return <Navigate to={`/campaign-management?tab=${tab}`} replace />;
}

// Main App Layout Wrapper with Light Linear Sidebar & Top Header
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout hasSider style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden', width: '100vw' }}>
      {/* Light Linear Gradient Sidebar */}
      <AppSider />

      {/* Main Content Area - Scrollbar runs from top of screen */}
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
        <AppHeader />

        <Content
          style={{
            background: '#F5F6FA',
            padding: '12px 24px 32px 24px',
            overflow: 'visible',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
          }}
        >
          <div className="app-page-wrapper">
            {children}
          </div>
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
          {/* Public Landing Page / Homepage */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />

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

          {/* Edit Campaign Routes */}
          <Route
            path="/campaigns/:id/edit"
            element={
              <MainLayout>
                <CreateCampaignPage />
              </MainLayout>
            }
          />
          <Route
            path="/campaigns/edit/:id"
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
          <Route
            path="/discovery"
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

          {/* Campaign Management — List or Tab Detail */}
          <Route
            path="/campaign-management"
            element={
              <MainLayout>
                <CampaignManagementRouteDispatcher />
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

          {/* Campaign Pipeline Detail — Chuyển hướng và ẩn UUID khỏi URL */}
          <Route
            path="/campaign-management/:id"
            element={<CampaignManagementIdRedirect />}
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
            path="/creators/recommendations"
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

          {/* Landing Page Route */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />

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
            {/* Phase 3 — Account Management (Admin only) */}
            <Route path="accounts" element={<AdminProtectedRoute requireAdmin><AccountManagementPage /></AdminProtectedRoute>} />
            <Route path="accounts/:id" element={<AdminProtectedRoute requireAdmin><AccountDetailPage /></AdminProtectedRoute>} />
            {/* Phase 4 — Creator Catalog (Admin & Manager) */}
            <Route path="creators" element={<CreatorCatalogPage />} />
            {/* Phase 5 — Data Sources (Admin & Manager) */}
            <Route path="data-sources" element={<DataSourcesPage />} />
            {/* Phase 6 — Collection Jobs, Data Quality & Scoring Config */}
            <Route path="jobs" element={<CollectionJobsPage />} />
            <Route path="data-quality" element={<DataQualityPage />} />
            <Route path="scoring" element={<ScoringConfigPage />} />
            {/* Phase 7 — Subscriptions & Payments (Admin only) */}
            <Route path="subscriptions" element={<AdminProtectedRoute requireAdmin><SubscriptionPlansPage /></AdminProtectedRoute>} />
            <Route path="payments" element={<AdminProtectedRoute requireAdmin><PaymentsPage /></AdminProtectedRoute>} />
            {/* Phase 8 — Audit Log (Admin only) */}
            <Route path="audit" element={<AdminProtectedRoute requireAdmin><AuditLogPage /></AdminProtectedRoute>} />
            {/* Phase 9 — Creator Claim Review (Admin & Manager) */}
            <Route path="creator-claims" element={<CreatorClaimReviewPage />} />
          </Route>

          {/* ── Creator Actor Routes (/creator/*) ──────────── */}
          <Route
            path="/creator"
            element={
              <CreatorProtectedRoute>
                <CreatorLayout />
              </CreatorProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/creator/dashboard" replace />} />
            <Route path="portal" element={<CreatorPortalPage />} />
            <Route path="dashboard" element={<CreatorPortalPage />} />
            <Route path="reach" element={<CreatorPortalPage />} />
            <Route path="verification" element={<CreatorPortalPage />} />
            <Route path="social-accounts" element={<CreatorPortalPage />} />
            <Route path="rate-card" element={<CreatorPortalPage />} />
            <Route path="bookings" element={<CreatorPortalPage />} />
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
