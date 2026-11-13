import { Navigate } from 'react-router-dom';
import { Empty, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { adminService } from '../../../services/api/adminService';
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
import { DATA_MANAGER_ROUTES } from '../../../constants/adminRoutes';
import './AdminDashboard.css';

const getUsersTotal = async () => (await adminService.getUsers({ page: 0, size: 1 })).totalElements;
const getPlansTotal = async () => (await subscriptionService.getPlansPage()).totalElements;
// /creators is an unpaginated list of ingested metric records, not unique Creator identities.
const getCreatorRecords = async () => (await creatorService.getCreators()).length;
const getRecentLogs = () => adminService.getAuditLogs({ page: 0, size: 8 });

function Metric({ title, note, resource, allowed }: {
  title: string; note: string; resource: AsyncResource<number>; allowed: boolean;
}) {
  return <section className="ad-panel ad-kpi" aria-label={title}>
    <h2>{title}</h2>
    {allowed && resource.status === 'success'
      ? <p className="ad-kpi-value">{resource.data === null ? 'Chưa có dữ liệu' : resource.data.toLocaleString('vi-VN')}</p>
      : <ResourceState resource={resource} allowed={allowed} />}
    <p className="ad-note">{note}</p>
  </section>;
}

function StatusMetric<T extends CampaignSummary | SubscriptionSummary>({ title, resource, allowed, main, labels }: {
  title: string; resource: AsyncResource<T>; allowed: boolean; main: keyof T; labels: [keyof T, string][];
}) {
  return <section className="ad-panel ad-kpi" aria-label={title}>
    <h2>{title}</h2>
    {allowed && resource.status === 'success' && resource.data
      ? <><p className="ad-kpi-value">{(resource.data[main] as number).toLocaleString('vi-VN')}</p>
          <dl className="ad-status-list">{labels.map(([key, label]) => <div key={String(key)}><dt>{label}</dt><dd>{(resource.data![key] as number).toLocaleString('vi-VN')}</dd></div>)}</dl></>
      : <ResourceState resource={resource} allowed={allowed} />}
  </section>;
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
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {value.replace('T', ' ')}
        </span>
      ) : (
        '—'
      ),
  },
  {
    title: 'Người thực hiện',
    dataIndex: 'actor',
    width: '24%',
    ellipsis: true,
    render: (value: string, r) => (
      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ fontWeight: 600, color: '#0F172A' }} title={value || r.actorEmail || ''}>
          {value || '—'}
        </span>
        {r.actorEmail && r.actorEmail !== value && (
          <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.actorEmail}
          </div>
        )}
      </div>
    ),
  },
  {
    title: 'Hành động',
    dataIndex: 'action',
    width: '16%',
    render: (value: string) =>
      value ? (
        <Tag color={ACTION_COLORS[value] || 'default'} style={{ fontWeight: 600, borderRadius: 6, margin: 0 }}>
          {value}
        </Tag>
      ) : (
        '—'
      ),
  },
  {
    title: 'Đối tượng',
    dataIndex: 'resource',
    width: '22%',
    ellipsis: true,
    render: (value: string, r) => (
      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <Tag color="purple" style={{ borderRadius: 6, fontWeight: 500, margin: 0 }} title={value || ''}>
          {value || '—'}
        </Tag>
        {r.resourceId && (
          <span style={{ fontSize: 11, color: '#64748B', marginLeft: 6 }}>
            ID: {String(r.resourceId).slice(0, 8)}...
          </span>
        )}
      </div>
    ),
  },
  {
    title: 'Địa chỉ IP',
    dataIndex: 'ip',
    width: '20%',
    ellipsis: true,
    render: (value: string) =>
      value ? (
        <code style={{ fontSize: 12, color: '#475569', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
          {value}
        </code>
      ) : (
        '—'
      ),
  },
];

function DashboardContent() {
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
  const subscriptions = useAsyncResource(adminDashboardService.getSubscriptionSummary, canManageSubscriptions);
  const growth = useAsyncResource(adminDashboardService.getUserGrowth, canViewMonitoring);
  const revenue = useAsyncResource(adminDashboardService.getRevenueByPlan, canManageSubscriptions);

  return <div className="ad-dashboard">
    <header className="ad-header">
      <h1>Tổng quan hệ thống</h1>
      <p>Theo dõi tài khoản, dữ liệu nhà sáng tạo, danh mục gói dịch vụ và hoạt động quản trị.</p>
    </header>
    <div className="ad-kpis">
      <Metric title="Tổng tài khoản" note="Tổng tài khoản trên hệ thống." resource={users} allowed={canViewUsers} />
      <Metric title="Bản ghi Creator" note="Các bản ghi có dữ liệu thu thập; một Creator có thể có nhiều bản ghi." resource={creators} allowed />
      <Metric title="Gói dịch vụ" note="Tổng số gói trong danh mục, bao gồm các trạng thái." resource={plans} allowed={canViewPlans} />
      <StatusMetric title="Chiến dịch" resource={campaigns} allowed={canViewMonitoring} main="total"
        labels={[["draft", 'Bản nháp'], ['readyForDiscovery', 'Sẵn sàng khám phá'], ['active', 'Đang hoạt động'], ['completed', 'Hoàn thành'], ['archived', 'Lưu trữ']]} />
      <StatusMetric title="Gói đăng ký đang hoạt động" resource={subscriptions} allowed={canManageSubscriptions} main="active"
        labels={[["total", 'Tổng đăng ký'], ['pending', 'Chờ thanh toán'], ['expired', 'Hết hạn'], ['cancelled', 'Đã hủy']]} />
      <RevenueMetric resource={revenue} allowed={canManageSubscriptions} />
    </div>
    <div className="ad-charts">
      <UserGrowthPanel resource={growth} allowed={canViewMonitoring} />
      <RevenuePanel resource={revenue} allowed={canManageSubscriptions} />
    </div>
    <section className="ad-panel ad-audit" aria-label="Nhật ký hoạt động gần đây">
      <h2>Nhật ký hoạt động gần đây</h2>
      <p className="ad-note">8 hoạt động mới nhất được ghi nhận trên hệ thống.</p>
      {canViewAudit && logs.status === 'success'
        ? <Table<AuditLogItem> rowKey="id" columns={columns} dataSource={logs.data?.items ?? []}
            pagination={false} size="middle"
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" /> }} />
        : <ResourceState resource={logs} allowed={canViewAudit} />}
    </section>
  </div>;
}

export default function AdminDashboardPage() {
  if (authService.isManager()) return <Navigate to={DATA_MANAGER_ROUTES.DASHBOARD} replace />;
  if (!authService.isAdmin()) return <Navigate to="/admin/login" replace />;
  return <DashboardContent />;
}
