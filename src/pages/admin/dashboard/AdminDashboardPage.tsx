import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Empty, Table, Tag, Button, Avatar } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  TeamOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  RocketOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  ArrowRightOutlined,
  UserSwitchOutlined,
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

function BentoKpiCard({
  title,
  note,
  badgeText,
  icon,
  tone,
  resource,
  allowed,
  onClick,
}: {
  title: string;
  note: string;
  badgeText: string;
  icon: React.ReactNode;
  tone: 'blue' | 'indigo' | 'sky' | 'emerald';
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
      <div className="ad-bento-top">
        <span className="ad-bento-label">{title}</span>
        <div className={`ad-bento-icon ${tone}`}>{icon}</div>
      </div>

      {allowed && resource.status === 'success' ? (
        <p className="ad-bento-value">
          {resource.data === null ? 'Chưa có dữ liệu' : resource.data.toLocaleString('vi-VN')}
        </p>
      ) : (
        <ResourceState resource={resource} allowed={allowed} />
      )}

      <div className="ad-bento-foot">
        <span className={`ad-bento-badge ${tone}`}>{badgeText}</span>
        <span className="ad-bento-note-inline">{note}</span>
      </div>
    </section>
  );
}

function StatusBreakdownCard<T extends CampaignSummary | SubscriptionSummary>({
  title,
  subtitle,
  icon,
  tone,
  resource,
  allowed,
  main,
  mainLabel,
  labels,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: 'blue' | 'indigo';
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
          <div className={`ad-panel-icon ${tone}`}>{icon}</div>
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

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'blue',
  UPDATE: 'orange',
  DELETE: 'red',
  LOGIN: 'green',
  LOGOUT: 'default',
};

const columns: TableColumnsType<AuditLogItem> = [
  {
    title: 'Thời gian',
    dataIndex: 'timestamp',
    width: '18%',
    render: (value: string) =>
      value ? (
        <span title={value} style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {value.replace('T', ' ').replace(/(\d{2}:\d{2}:\d{2})\.\d+/, '$1')}
        </span>
      ) : (
        '—'
      ),
  },
  {
    title: 'Người thực hiện',
    dataIndex: 'actor',
    width: '26%',
    ellipsis: true,
    render: (value: string, r) => {
      const display = value || r.actorEmail || 'Hệ thống';
      const initials = display.slice(0, 2).toUpperCase();
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Avatar
            size={30}
            style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }} title={display}>
              {value || '—'}
            </div>
            {r.actorEmail && r.actorEmail !== value && (
              <div style={{ fontSize: 11.5, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.actorEmail}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    title: 'Hành động',
    dataIndex: 'action',
    width: '15%',
    render: (value: string) =>
      value ? (
        <Tag color={ACTION_COLORS[value] || 'blue'} style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
          {value}
        </Tag>
      ) : (
        '—'
      ),
  },
  {
    title: 'Đối tượng tác động',
    dataIndex: 'resource',
    width: '23%',
    ellipsis: true,
    render: (value: string, r) => (
      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }} title={value || ''}>
          {value || '—'}
        </Tag>
        {r.resourceId && (
          <span style={{ fontSize: 11.5, color: '#64748B', marginLeft: 6, fontFamily: 'monospace' }}>
            #{String(r.resourceId).slice(0, 8)}
          </span>
        )}
      </div>
    ),
  },
  {
    title: 'Địa chỉ IP',
    dataIndex: 'ip',
    width: '18%',
    ellipsis: true,
    render: (value: string) =>
      value ? (
        <code
          style={{
            fontSize: 12,
            color: '#1E293B',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            padding: '2px 8px',
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          {value}
        </code>
      ) : (
        '—'
      ),
  },
];

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

  return (
    <div className="ad-dashboard">
      {/* 1. Executive Command Center Banner */}
      <header className="ad-hero-banner">
        <div className="ad-hero-left">
          <div className="ad-hero-status-row">
            <span className="ad-live-pill">
              <span className="ad-live-dot" />
              Hệ thống vận hành ổn định
            </span>
            <span className="ad-hero-badge">
              <CheckCircleFilled style={{ color: '#2563EB', marginRight: 5 }} />
              Trung tâm Quản trị Cấp cao (Admin Console)
            </span>
          </div>
          <h1>Tổng quan hệ thống</h1>
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

      {/* 2. Top 4 Bento KPI Cards */}
      <div className="ad-bento-grid-4">
        <BentoKpiCard
          title="Tổng tài khoản"
          badgeText="Toàn hệ thống"
          note="Brand, Nhà sáng tạo & Quản trị"
          icon={<TeamOutlined />}
          tone="blue"
          resource={users}
          allowed={canViewUsers}
          onClick={() => navigate(ADMIN_ROUTES.ACCOUNTS.LIST)}
        />
        <BentoKpiCard
          title="Bản ghi Nhà sáng tạo"
          badgeText="Dữ liệu đa kênh"
          note="Hồ sơ đã thu thập & chuẩn hóa"
          icon={<UserSwitchOutlined />}
          tone="indigo"
          resource={creators}
          allowed
        />
        <BentoKpiCard
          title="Gói dịch vụ"
          badgeText="Thương mại"
          note="Danh mục gói cước doanh nghiệp"
          icon={<CrownOutlined />}
          tone="sky"
          resource={plans}
          allowed={canViewPlans}
          onClick={() => navigate(ADMIN_ROUTES.SUBSCRIPTIONS)}
        />
        <RevenueMetric resource={revenue} allowed={canManageSubscriptions} />
      </div>

      {/* 3. Campaign & Subscription Status Breakdown */}
      <div className="ad-distribution-grid">
        <StatusBreakdownCard
          title="Phân bổ trạng thái Chiến dịch"
          subtitle="Tổng hợp toàn bộ chiến dịch của các Thương hiệu trên nền tảng"
          icon={<RocketOutlined />}
          tone="blue"
          resource={campaigns}
          allowed={canViewMonitoring}
          main="total"
          mainLabel="Tổng chiến dịch"
          labels={[
            ['draft', 'Bản nháp', '#64748B'],
            ['readyForDiscovery', 'Sẵn sàng khám phá', '#2563EB'],
            ['active', 'Đang hoạt động', '#10B981'],
            ['completed', 'Hoàn thành', '#0284C7'],
            ['archived', 'Lưu trữ', '#94A3B8'],
          ]}
        />

        <StatusBreakdownCard
          title="Tình trạng Gói đăng ký (Subscriptions)"
          subtitle="Theo dõi vòng đời thuê bao gói cước của khách hàng Doanh nghiệp"
          icon={<ThunderboltOutlined />}
          tone="indigo"
          resource={subscriptions}
          allowed={canManageSubscriptions}
          main="active"
          mainLabel="Đang hoạt động"
          labels={[
            ['total', 'Tổng đăng ký', '#2563EB'],
            ['pending', 'Chờ thanh toán', '#F59E0B'],
            ['expired', 'Hết hạn', '#64748B'],
            ['cancelled', 'Đã hủy', '#EF4444'],
          ]}
        />
      </div>

      {/* 4. Visual Charts Row */}
      <div className="ad-charts">
        <UserGrowthPanel resource={growth} allowed={canViewMonitoring} />
        <RevenuePanel resource={revenue} allowed={canManageSubscriptions} />
      </div>

      {/* 5. Recent Audit Logs Table */}
      <section className="ad-panel ad-audit" aria-label="Nhật ký hoạt động gần đây">
        <div className="ad-panel-head" style={{ marginBottom: 16 }}>
          <div className="ad-panel-title-wrap">
            <div className="ad-panel-icon blue">
              <FileTextOutlined />
            </div>
            <div>
              <h2>Nhật ký kiểm toán & Hoạt động gần đây</h2>
              <p className="ad-note">
                8 thao tác quản trị và bảo mật mới nhất được ghi nhận trên hệ thống
              </p>
            </div>
          </div>

          <Button
            type="link"
            onClick={() => navigate(ADMIN_ROUTES.AUDIT)}
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}
          >
            Xem toàn bộ nhật ký <ArrowRightOutlined style={{ fontSize: 12 }} />
          </Button>
        </div>

        {canViewAudit && logs.status === 'success' ? (
          <Table<AuditLogItem>
            rowKey="id"
            columns={columns}
            dataSource={logs.data?.items ?? []}
            tableLayout="fixed"
            pagination={false}
            size="middle"
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />,
            }}
          />
        ) : (
          <ResourceState resource={logs} allowed={canViewAudit} />
        )}
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  if (authService.isManager()) return <Navigate to={DATA_MANAGER_ROUTES.DASHBOARD} replace />;
  if (!authService.isAdmin()) return <Navigate to="/admin/login" replace />;
  return <DashboardContent />;
}
