import React, { useEffect, useState } from 'react';
import { ConfigProvider, Drawer, Grid, Layout, App as AntdApp } from 'antd';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
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
import BrandProfilePage, { BrandOnboardingPage } from './pages/brand/BrandProfilePage';
import OutreachCrmPage from './pages/crm/CampaignOutreachPage';
import CooperationInvitationPage from './pages/crm/CooperationInvitationPage';
import CreatorRegisterPage from './pages/auth/CreatorRegisterPage';
import CollaborationPage from './pages/collaboration/CollaborationPage';
import CollaborationDetailPage from './pages/collaboration/CollaborationDetailPage';
import PerformancePage from './pages/performance/PerformancePage';
import CampaignHistoryPage from './pages/history/CampaignHistoryPage';
import LandingPage from './pages/landing/hero/HeroLanding';
import './styles/custom.css';
import './components/layout/BrandResponsive.css';

// ── Admin Imports ────────────────────────────────────
import AdminLayout from './components/admin/AdminLayout';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import AccountManagementPage from './pages/admin/accounts/AccountManagementPage';
import AccountDetailPage from './pages/admin/accounts/AccountDetailPage';
import SubscriptionPlansPage from './pages/admin/subscriptions/SubscriptionPlansPage';
import PaymentsPage from './pages/admin/payments/PaymentsPage';
import AuditLogPage from './pages/admin/audit/AuditLogPage';

// ── Data Manager Imports ─────────────────────────────
import DataManagerDashboardPage from './pages/data-manager/dashboard/DataManagerDashboardPage';
import CreatorCatalogPage from './pages/data-manager/creators/CreatorCatalogPage';
import CreatorClaimReviewPage from './pages/data-manager/claims/CreatorClaimReviewPage';
import CollectionJobsPage from './pages/data-manager/jobs/CollectionJobsPage';
import DataQualityPage from './pages/data-manager/quality/DataQualityPage';
import DataSourcesPage from './pages/data-manager/datasources/DataSourcesPage';
import ScoringConfigPage from './pages/data-manager/scoring/ScoringConfigPage';

// ── Creator Actor Imports ──────────────────────────────
import CreatorLayout from './components/creator/CreatorLayout';
import CreatorProtectedRoute from './components/creator/CreatorProtectedRoute';
import CreatorPortalPage from './pages/creator/portal/CreatorPortalPage';
import { useAccountLogoutSync } from './hooks/useAccountLogoutSync';
import { getAccessToken, getStoredUser, getAuthSessionId } from './services/authSession';


const { Content } = Layout;

// Đồng bộ đăng xuất cùng tài khoản và làm sạch UUID trên thanh URL.
function SessionSyncHandler() {
  useAccountLogoutSync();

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
  const next = new URLSearchParams(searchParams);
  if (id) next.set('campaignId', id);
  if (!next.has('tab')) next.set('tab', 'recommendation');
  if (next.get('tab') === 'recommendation') {
    const creatorIds = next.get('creatorIds')?.split(',') ?? [];
    const campaignId = id || next.get('campaignId') || '';
    next.delete('campaignId'); next.delete('creatorIds'); next.delete('candidateSource');
    return <Navigate to={'/campaign-management?' + next} replace state={{ recommendationContext: { sessionId: getAuthSessionId(), campaignId, creatorIds } }} />;
  }
  return <Navigate to={'/campaign-management?' + next} replace />;
}

function CollaborationDetailIdRedirect() {
  const { collaborationId } = useParams<{ collaborationId: string }>();
  const location = useLocation();
  const returnTo = typeof location.state?.returnTo === 'string' ? location.state.returnTo : undefined;
  return <Navigate
    to={{ pathname: '/collaboration/detail', search: location.search }}
    replace
    state={{ collaborationId, ...(returnTo ? { returnTo } : {}) }}
  />;
}

function CollaborationListRouteDispatcher() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const campaignId = params.get('campaign') || params.get('campaignId');
  if (params.has('campaign') || params.has('campaignId')) {
    params.delete('campaign');
    params.delete('campaignId');
    const priorState = location.state && typeof location.state === 'object'
      ? location.state as Record<string, unknown> : {};
    return <Navigate
      to={{ pathname: location.pathname, search: params.size ? '?' + params : '' }}
      replace
      state={{ ...priorState, ...(campaignId ? { campaignId } : {}) }}
    />;
  }
  return <MainLayout collaborationNavigation><CollaborationPage /></MainLayout>;
}

// Main App Layout Wrapper with Light Linear Sidebar & Top Header
function MainLayout({ children }: {
  children: React.ReactNode;
  collaborationNavigation?: boolean;
}) {
  const mobile = Grid.useBreakpoint().md === false;
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [location.key, mobile]);
  // Reject a stale Brand URL before mounting its pages or issuing Brand APIs.
  if (!getAccessToken()) return <Navigate to="/login" replace />;
  const role = getStoredUser()?.role?.toUpperCase();
  if (['ADMIN', 'SUPER_ADMIN'].includes(role)) return <Navigate to="/admin/dashboard" replace />;
  if (['MANAGER', 'DATA_MANAGER'].includes(role)) return <Navigate to="/data-manager/dashboard" replace />;
  if (['CREATOR', 'INFLUENCER'].includes(role)) return <Navigate to="/creator/dashboard" replace />;
  if (role !== 'BRAND') return <Navigate to="/login" replace />;
  return (
    <Layout
      className="brand-workspace"
      hasSider={!mobile}
      style={{
        minHeight: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        width: '100%',
        background: 'linear-gradient(135deg, #F4ECFF 0%, #FAF5FF 48%, #EFE4FF 100%)',
      }}
    >
      {/* Floating Plum-Violet Sidebar */}
      {mobile ? <Drawer title="Điều hướng" placement="left" size="min(280px, 88vw)"
        open={menuOpen} onClose={() => setMenuOpen(false)} styles={{ body: { padding: 0 } }} destroyOnHidden>
        <AppSider inDrawer />
      </Drawer> : <AppSider />}

      {/* Main Content Area - Scrollbar runs from top of screen */}
      <Layout
        className="brand-main"
        style={{
          background: 'transparent',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
          flex: 1,
          scrollBehavior: 'smooth',
          boxSizing: 'border-box',
        }}
      >
        <AppHeader onOpenNavigation={mobile ? () => setMenuOpen(true) : undefined} />

        <Content
          className="brand-content"
          style={{
            background: 'transparent',
            padding: mobile ? '12px 12px 24px' : '12px 24px 32px',
            overflow: 'visible',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
          }}
        >
          <div className="app-page-wrapper" style={{ width: '100%', maxWidth: '100%' }}>
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
          <Route path="/cooperation-invitations" element={<CooperationInvitationPage />} />
          <Route path="/auth/creator/register" element={<AuthLayout><CreatorRegisterPage /></AuthLayout>} />

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
            path="/campaigns/edit"
            element={<MainLayout><CreateCampaignPage /></MainLayout>}
          />
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
            element={<CollaborationListRouteDispatcher />}
          />
          <Route
            path="/collaboration/detail"
            element={
              <MainLayout collaborationNavigation>
                <CollaborationDetailPage brand />
              </MainLayout>
            }
          />
          <Route
            path="/collaboration/:collaborationId"
            element={<CollaborationDetailIdRedirect />}
          />
          <Route
            path="/collab"
            element={<CollaborationListRouteDispatcher />}
          />
          <Route
            path="/operations"
            element={
              <MainLayout collaborationNavigation>
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
              <MainLayout collaborationNavigation>
                <CampaignHistoryPage />
              </MainLayout>
            }
          />
          <Route
            path="/campaign-history/:campaignId"
            element={
              <MainLayout collaborationNavigation>
                <CampaignHistoryPage />
              </MainLayout>
            }
          />
          <Route
            path="/history"
            element={
              <MainLayout collaborationNavigation>
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
          <Route path="/brand-onboarding" element={<BrandOnboardingPage />} />
          <Route
            path="/brand-profile"
            element={
              <MainLayout collaborationNavigation>
                <BrandProfilePage />
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <MainLayout collaborationNavigation>
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
            {/* Phase 7 — Subscriptions & Payments (Admin only) */}
            <Route path="subscriptions" element={<AdminProtectedRoute requireAdmin><SubscriptionPlansPage /></AdminProtectedRoute>} />
            <Route path="payments" element={<AdminProtectedRoute requireAdmin><PaymentsPage /></AdminProtectedRoute>} />
            {/* Phase 8 — Audit Log (Admin only) */}
            <Route path="audit" element={<AdminProtectedRoute requireAdmin><AuditLogPage /></AdminProtectedRoute>} />
          </Route>

          {/* ── Data Manager Dedicated Routes (/data-manager/*) ─── */}
          <Route
            path="/data-manager"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/data-manager/dashboard" replace />} />
            <Route path="dashboard" element={<DataManagerDashboardPage />} />
            <Route path="creators" element={<CreatorCatalogPage />} />
            <Route path="creator-claims" element={<CreatorClaimReviewPage />} />
            <Route path="jobs" element={<CollectionJobsPage />} />
            <Route path="data-quality" element={<DataQualityPage />} />
            <Route path="data-sources" element={<DataSourcesPage />} />
            <Route path="taxonomy" element={<DataSourcesPage />} />
            <Route path="scoring" element={<ScoringConfigPage />} />
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
            <Route path="bookings/:collaborationId" element={<CollaborationDetailPage brand={false} />} />
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
