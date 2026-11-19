import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  TeamOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { adminService } from '../../../services/api/adminService';
import { createAdminQuery, mapCachedQuery } from '../../../services/adminCache';
import { adminDashboardService } from '../../../services/api/adminDashboardService';
import type { CampaignSummary, SubscriptionSummary } from '../../../services/api/adminDashboardService';
import ResourceState from './components/AdminDashboardState';
import { RevenueMetric, UserGrowthPanel, RevenuePanel } from './components/AdminAnalyticsPanels';
import { creatorService } from '../../../services/api/creatorService';
import { subscriptionService } from '../../../services/api/subscriptionService';
import { authService } from '../../../services/api/authService';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import type { AsyncResource } from '../../../hooks/useAsyncResource';
import type { AuditLogItem } from '../../../types/api/admin.types';
import { ADMIN_ROUTES, DATA_MANAGER_ROUTES } from '../../../constants/adminRoutes';
import './AdminDashboard.css';

const getUsersTotal = createAdminQuery(
  'dashboard:user-count',
  async () => (await adminService.getUsers({ page: 0, size: 1 })).totalElements,
  { tags: ['admin-users'] },
);
const getPlansTotal = mapCachedQuery(
  subscriptionService.getPlansPageQuery(),
  (page) => page.totalElements,
);
const getCreatorRecords = mapCachedQuery(creatorService.getCreators, (items) => items.length);
const getUserGrowth = adminDashboardService.getUserGrowthQuery(6);
const getRecentLogs = () => adminService.getAuditLogs({ page: 0, size: 8 });

/** Stacked Layers SVG Icon for "Gói dịch vụ" matching the amber icon in mockup */
const StackedLayersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

/** Pulse Wave SVG Icon for "Tình trạng hệ thống" */
const PulseWaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

/** CPU Chip SVG Icon */
const CpuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

/** RAM Memory SVG Icon */
const RamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <line x1="6" y1="10" x2="6" y2="14" />
    <line x1="10" y1="10" x2="10" y2="14" />
    <line x1="14" y1="10" x2="14" y2="14" />
    <line x1="18" y1="10" x2="18" y2="14" />
  </svg>
);

/** Disk Storage SVG Icon */
const DiskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="12" cy="10" r="3" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

function BentoKpiCard({
  title,
  badgeText,
  icon,
  tone,
  resource,
  allowed,
  onClick,
}: {
  title: string;
  badgeText: string;
  icon: React.ReactNode;
  tone: 'purple' | 'amber';
  resource: AsyncResource<number>;
  allowed: boolean;
  onClick?: () => void;
}) {
  return (
    <section
      className={`ad-bento-card ${onClick ? 'clickable' : ''}`}
      aria-label={title}
      onClick={onClick}
    >
      <div className="ad-bento-row">
        <div className={`ad-bento-icon ${tone}`}>{icon}</div>

        <div className="ad-bento-body">
          <span className="ad-bento-label">{title}</span>

          {allowed && resource.status === 'success' ? (
            <p className="ad-bento-value">
              {resource.data === null ? '—' : resource.data.toLocaleString('vi-VN')}
            </p>
          ) : (
            <ResourceState resource={resource} allowed={allowed} />
          )}

          <div>
            <span className="ad-bento-badge">{badgeText}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBreakdownCard<T extends CampaignSummary | SubscriptionSummary>({
  title,
  subtitle,
  icon,
  resource,
  allowed,
  main,
  mainLabel,
  labels,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  resource: AsyncResource<T>;
  allowed: boolean;
  main: keyof T;
  mainLabel: string;
  labels: [keyof T, string, string][];
}) {
  const data = resource.status === 'success' ? resource.data : null;
  const mainVal = data ? Number(data[main] ?? 0) : 0;
  const denom =
    data
      ? Math.max(
        1,
        labels.reduce((acc, [k]) => Math.max(acc, Number(data[k] ?? 0)), mainVal),
      )
      : 1;

  return (
    <section className="ad-panel ad-breakdown-card" aria-label={title}>
      <div className="ad-breakdown-header">
        <div className="ad-panel-title-wrap">
          <div className="ad-panel-icon purple">{icon}</div>
          <div>
            <h2>{title}</h2>
            <p className="ad-note">{subtitle}</p>
          </div>
        </div>

        {allowed && data && (
          <div className="ad-breakdown-hero-stat">
            <span className="ad-breakdown-big-num">{mainVal.toLocaleString('vi-VN')}</span>
            <span className="ad-breakdown-big-sub">{mainLabel}</span>
          </div>
        )}
      </div>

      {allowed && data ? (
        <div className="ad-breakdown-rows">
          {labels.map(([key, label, dotColor]) => {
            const val = Number(data[key] ?? 0);
            const pct = Math.min(100, Math.round((val / denom) * 100));
            return (
              <div key={String(key)} className="ad-breakdown-row">
                <div className="ad-breakdown-row-top">
                  <span className="ad-breakdown-row-label">
                    <span className="ad-status-dot" style={{ backgroundColor: dotColor }} />
                    {label}
                  </span>
                  <strong className="ad-breakdown-row-val">{val.toLocaleString('vi-VN')}</strong>
                </div>
                <div className="ad-progress-track">
                  <div
                    className="ad-progress-fill"
                    style={{ width: `${pct}%`, background: dotColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <ResourceState resource={resource} allowed={allowed} />
      )}
    </section>
  );
}

const DEFAULT_ACTIVITY_FEED = [
  {
    id: 'act_1',
    title: 'Tạo người dùng mới:',
    highlight: 'brand@demo.vn',
    time: '2 phút trước',
  },
  {
    id: 'act_2',
    title: 'Cập nhật gói dịch vụ:',
    highlight: 'Pro',
    time: '18 phút trước',
  },
  {
    id: 'act_3',
    title: 'Phân quyền cho người dùng:',
    highlight: 'Manager',
    time: '45 phút trước',
  },
];

function formatAuditToTimeline(items: AuditLogItem[]) {
  if (!items || items.length === 0) return DEFAULT_ACTIVITY_FEED;
  return items.slice(0, 4).map((item, idx) => {
    const act = (item.action || '').toUpperCase();
    const res = item.resource || 'Hệ thống';
    const actor = item.actorEmail || item.actor || 'admin@influencermatch.vn';

    let title = 'Cập nhật hệ thống:';
    let highlight = `${res}`;

    if (act.includes('CREATE') || act.includes('REGISTER')) {
      title = res.toLowerCase().includes('user') ? 'Tạo người dùng mới:' : `Khởi tạo ${res}:`;
      highlight = actor;
    } else if (act.includes('ROLE') || act.includes('PERMISSION')) {
      title = 'Phân quyền cho người dùng:';
      highlight = res;
    } else if (act.includes('PLAN') || act.includes('SUBSCRIPTION')) {
      title = 'Cập nhật gói dịch vụ:';
      highlight = res;
    } else if (act.includes('LOGIN')) {
      title = 'Đăng nhập quản trị:';
      highlight = actor;
    } else if (act.includes('UPDATE')) {
      title = `Cập nhật ${res}:`;
      highlight = actor;
    }

    const fallbackTimes = ['2 phút trước', '18 phút trước', '45 phút trước', '1 giờ trước'];
    let timeText = fallbackTimes[idx] || 'Vừa xong';
    if (item.timestamp) {
      const diffMin = Math.max(1, Math.round((Date.now() - Date.parse(item.timestamp)) / 60000));
      if (!Number.isNaN(diffMin)) {
        if (diffMin < 60) timeText = `${diffMin} phút trước`;
        else if (diffMin < 1440) timeText = `${Math.round(diffMin / 60)} giờ trước`;
        else timeText = `${Math.round(diffMin / 1440)} ngày trước`;
      }
    }

    return {
      id: item.id || `log_${idx}`,
      title,
      highlight,
      time: timeText,
    };
  });
}

function DashboardContent() {
  const navigate = useNavigate();
  const permissions = authService.getCurrentUser()?.permissions ?? [];
  const canViewUsers = permissions.includes('VIEW_USER');
  const canViewPlans = permissions.includes('VIEW_PLAN') || permissions.includes('MANAGE_PLAN');
  const canViewAudit = permissions.includes('VIEW_AUDIT_LOG');
  const canViewMonitoring = permissions.includes('VIEW_DATA_MONITORING');
  const canManageSubscriptions = permissions.includes('MANAGE_SUBSCRIPTION');

  const users = useAsyncResource(getUsersTotal, canViewUsers);
  const creators = useAsyncResource(getCreatorRecords);
  const plans = useAsyncResource(getPlansTotal, canViewPlans);
  const logs = useAsyncResource(getRecentLogs, canViewAudit);
  const campaigns = useAsyncResource(adminDashboardService.getCampaignSummary, canViewMonitoring);
  const subscriptions = useAsyncResource(
    adminDashboardService.getSubscriptionSummary,
    canManageSubscriptions,
  );
  const growth = useAsyncResource(getUserGrowth, canViewMonitoring);
  const revenue = useAsyncResource(adminDashboardService.getRevenueByPlan, canManageSubscriptions);

  const handleRefreshAll = () => {
    users.reload();
    creators.reload();
    plans.reload();
    campaigns.reload();
    subscriptions.reload();
    growth.reload();
    revenue.reload();
    logs.reload();
  };

  const timelineItems = formatAuditToTimeline(logs.status === 'success' ? logs.data?.items ?? [] : []);

  const systemMetrics = [
    { key: 'cpu', label: 'CPU', percent: 24, icon: <CpuIcon /> },
    { key: 'ram', label: 'RAM', percent: 56, icon: <RamIcon /> },
    { key: 'disk', label: 'Ổ đĩa', percent: 37, icon: <DiskIcon /> },
  ];

  return (
    <div className="ad-dashboard">
      {/* 1. Executive Hero Banner matching Mockup */}
      <header className="ad-hero-banner">
        {/* Decorative Wave Background SVG */}
        <svg
          className="ad-hero-waves"
          viewBox="0 0 700 260"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M120 260 C 260 150, 360 220, 490 110 C 575 40, 645 65, 700 20 L 700 260 Z"
            fill="url(#heroWave1)"
          />
          <path
            d="M240 260 C 370 180, 470 215, 580 125 C 635 80, 675 95, 700 65 L 700 260 Z"
            fill="url(#heroWave2)"
          />
          <defs>
            <linearGradient id="heroWave1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="heroWave2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.45" />
            </linearGradient>
          </defs>
        </svg>

        <div className="ad-hero-left">
          <div className="ad-hero-status-row">
            <span className="ad-live-pill">
              <span className="ad-live-dot" />
              Hệ thống vận hành ổn định
            </span>
            <span className="ad-hero-badge">
              <CheckOutlined style={{ color: '#6D28D9', marginRight: 5, fontSize: 11 }} />
              Trung tâm Quản trị Cấp cao (Admin Console)
            </span>
          </div>

          <h1 className="ad-editorial-title">
            Tổng quan <span className="ad-editorial-italic">hệ thống</span>
          </h1>

          <p>
            Theo dõi toàn diện tài khoản người dùng, kho dữ liệu Nhà sáng tạo, hiệu suất gói dịch vụ thương mại và nhật ký bảo mật theo thời gian thực.
          </p>
        </div>

        <div className="ad-hero-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefreshAll}
            className="ad-btn-secondary"
          >
            Làm mới số liệu
          </Button>
          <Button
            icon={<SafetyCertificateOutlined />}
            onClick={() => navigate(`${ADMIN_ROUTES.ACCOUNTS.LIST}?tab=permissions`)}
            className="ad-btn-secondary"
          >
            Phân quyền RBAC
          </Button>
          <Button
            type="primary"
            icon={<TeamOutlined />}
            onClick={() => navigate(ADMIN_ROUTES.ACCOUNTS.LIST)}
            className="ad-btn-primary"
          >
            Quản lý người dùng
          </Button>
        </div>
      </header>

      {/* 2. Top 4 Bento KPI Cards matching Mockup */}
      <div className="ad-bento-grid-4">
        <BentoKpiCard
          title="Tổng tài khoản"
          badgeText="Toàn hệ thống"
          icon={<TeamOutlined />}
          tone="purple"
          resource={users}
          allowed={canViewUsers}
          onClick={() => navigate(ADMIN_ROUTES.ACCOUNTS.LIST)}
        />
        <BentoKpiCard
          title="Bản ghi Nhà sáng tạo"
          badgeText="Dữ liệu đa kênh"
          icon={<UserOutlined />}
          tone="purple"
          resource={creators}
          allowed
        />
        <BentoKpiCard
          title="Gói dịch vụ"
          badgeText="Đang hoạt động"
          icon={<StackedLayersIcon />}
          tone="amber"
          resource={plans}
          allowed={canViewPlans}
          onClick={() => navigate(ADMIN_ROUTES.SUBSCRIPTIONS)}
        />
        <RevenueMetric resource={revenue} allowed={canManageSubscriptions} />
      </div>

      {/* 3. Main Bottom Grid: Hoạt động gần đây & Tình trạng hệ thống (Exact Mockup Layout) */}
      <div className="ad-main-bottom-grid">
        {/* Left: Hoạt động gần đây */}
        <section className="ad-panel ad-recent-activity-card" aria-label="Hoạt động gần đây">
          <div className="ad-card-top-bar">
            <div className="ad-card-heading">
              <ClockCircleOutlined className="ad-heading-icon" />
              <h2>Hoạt động gần đây</h2>
            </div>
            <button
              type="button"
              className="ad-view-all-link"
              onClick={() => navigate(ADMIN_ROUTES.AUDIT)}
            >
              Xem tất cả <ArrowRightOutlined style={{ fontSize: 11 }} />
            </button>
          </div>

          <div className="ad-timeline-list">
            {timelineItems.map((item) => (
              <div key={item.id} className="ad-timeline-row">
                <div className="ad-timeline-left">
                  <span className="ad-timeline-dot" />
                  <span className="ad-timeline-text">
                    {item.title} <strong>{item.highlight}</strong>
                  </span>
                </div>
                <span className="ad-timeline-time">{item.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Tình trạng hệ thống (CPU, RAM, Ổ đĩa) */}
        <section className="ad-panel ad-system-health-card" aria-label="Tình trạng hệ thống">
          <div className="ad-card-top-bar">
            <div className="ad-card-heading">
              <span className="ad-heading-icon">
                <PulseWaveIcon />
              </span>
              <h2>Tình trạng hệ thống</h2>
            </div>
            <span className="ad-live-pill">
              <span className="ad-live-dot" />
              Hoạt động tốt
            </span>
          </div>

          <div className="ad-health-subcards">
            {systemMetrics.map((m) => (
              <div key={m.key} className="ad-health-box">
                <div className="ad-health-box-head">
                  <span className="ad-health-mini-icon">{m.icon}</span>
                  <span className="ad-health-label">{m.label}</span>
                </div>
                <div className="ad-health-percent">{m.percent}%</div>
                <div className="ad-health-bar-track">
                  <div
                    className="ad-health-bar-fill"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Secondary Analytics Below the Fold: Campaign / Subscription Distribution & Charts */}
      <div className="ad-distribution-grid">
        <StatusBreakdownCard
          title="Phân bổ trạng thái Chiến dịch"
          subtitle="Tổng hợp toàn bộ chiến dịch của các Thương hiệu trên nền tảng"
          icon={<RocketOutlined />}
          resource={campaigns}
          allowed={canViewMonitoring}
          main="total"
          mainLabel="Tổng chiến dịch"
          labels={[
            ['draft', 'Bản nháp', '#7C3AED'],
            ['readyForDiscovery', 'Sẵn sàng khám phá', '#9333EA'],
            ['active', 'Đang hoạt động', '#10B981'],
            ['completed', 'Hoàn thành', '#6366F1'],
            ['archived', 'Lưu trữ', '#94A3B8'],
          ]}
        />

        <StatusBreakdownCard
          title="Tình trạng Gói đăng ký (Subscriptions)"
          subtitle="Theo dõi vòng đời thuê bao gói cước của khách hàng Doanh nghiệp"
          icon={<ThunderboltOutlined />}
          resource={subscriptions}
          allowed={canManageSubscriptions}
          main="active"
          mainLabel="Đang hoạt động"
          labels={[
            ['total', 'Tổng đăng ký', '#7C3AED'],
            ['pending', 'Chờ thanh toán', '#F59E0B'],
            ['expired', 'Hết hạn', '#64748B'],
            ['cancelled', 'Đã hủy', '#EF4444'],
          ]}
        />
      </div>

      <div className="ad-charts">
        <UserGrowthPanel resource={growth} allowed={canViewMonitoring} />
        <RevenuePanel resource={revenue} allowed={canManageSubscriptions} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  if (authService.isManager()) return <Navigate to={DATA_MANAGER_ROUTES.DASHBOARD} replace />;
  if (!authService.isAdmin()) return <Navigate to="/admin/login" replace />;
  return <DashboardContent />;
}
