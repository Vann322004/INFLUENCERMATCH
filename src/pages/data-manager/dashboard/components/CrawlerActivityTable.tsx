import { Card, Tag, Empty, Table, Grid } from 'antd';
import type { TableColumnsType } from 'antd';
import { Link } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'realActivities' | 'loading' | 'unavailable'>;
type Activity = DataManagerDashboardData['realActivities'][number];

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Thành công',
  SUCCESS: 'Thành công',
  INGESTED: 'Đã lưu',
  QUEUED: 'Đang đợi',
  FAILED: 'Thất bại',
};

const DECISION_LABELS: Record<string, string> = {
  ACCEPTED: 'Đạt',
  AUTO_ACCEPT_KOC: 'Đạt (KOC)',
  AUTO_ACCEPT_KOL: 'Đạt (KOL)',
  MANAGER_APPROVED: 'Đã duyệt',
  REJECTED: 'Loại',
  AUTO_REJECT: 'Tự động loại',
  REVIEW: 'Chờ duyệt',
  NEEDS_MANAGER_REVIEW: 'Chờ duyệt',
  SKIP_INSUFFICIENT: 'Thiếu dữ liệu',
};

function formatShortTime(value?: string) {
  if (!value) return '—';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const columns: TableColumnsType<Activity> = [
  {
    title: 'Kênh / Ứng viên',
    dataIndex: 'username',
    key: 'username',
    ellipsis: true,
    render: (username: string, activity) => (
      <div className="dm-activity-identity">
        <div className="dm-record-title">{username || activity.displayName || '—'}</div>
        <Tag className="dm-status-tag">{activity.platform || '—'}</Tag>
      </div>
    ),
  },
  {
    title: 'Thu thập',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    render: (status: string) => (
      <Tag className="dm-status-tag">{STATUS_LABELS[status] || status || '—'}</Tag>
    ),
  },
  {
    title: 'Kiểm định',
    dataIndex: 'decision',
    key: 'decision',
    width: 130,
    render: (decision: string) => (
      <Tag className="dm-status-tag">{DECISION_LABELS[decision] || decision || '—'}</Tag>
    ),
  },
  {
    title: 'Cập nhật',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 115,
    render: (time: string) => <span className="dm-secondary dm-nowrap">{formatShortTime(time)}</span>,
  },
];

export default function CrawlerActivityTable({ realActivities, loading, unavailable }: Props) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  return (
    <Card
      variant="borderless"
      className="im-dashboard-card dm-panel"
      title="Hoạt động thu thập gần đây"
      extra={<Link className="dm-section-link" to={DATA_MANAGER_ROUTES.JOBS}>Xem tất cả</Link>}
    >
      {realActivities.length > 0 ? (
        isMobile ? (
          <div className="dm-activity-mobile-list">
            {realActivities.map((activity) => (
              <div key={activity.id} className="dm-activity-mobile-item">
                <div className="dm-activity-mobile-top">
                  <span className="dm-record-title">{activity.username || activity.displayName || '—'}</span>
                  <span className="dm-secondary dm-nowrap">{formatShortTime(activity.updatedAt)}</span>
                </div>
                <div className="dm-activity-mobile-tags">
                  <Tag className="dm-status-tag">{activity.platform || '—'}</Tag>
                  <Tag className="dm-status-tag">{STATUS_LABELS[activity.status] || activity.status || '—'}</Tag>
                  <Tag className="dm-status-tag">{DECISION_LABELS[activity.decision] || activity.decision || '—'}</Tag>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table
            dataSource={realActivities}
            columns={columns}
            loading={loading}
            rowKey="id"
            pagination={false}
            size="small"
            className="dm-activity-table"
          />
        )
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            loading
              ? 'Đang tải nhật ký…'
              : unavailable.includes(0)
                ? 'Chưa tải được nhật ký thu thập'
                : 'Chưa có hoạt động thu thập'
          }
        />
      )}
    </Card>
  );
}
