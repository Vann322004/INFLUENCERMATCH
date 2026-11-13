import { Card, Tag, Empty, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { Link } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'realActivities' | 'loading' | 'unavailable'>;
type Activity = DataManagerDashboardData['realActivities'][number];

const columns: TableColumnsType<Activity> = [
  {
    title: 'Kênh / Ứng viên', dataIndex: 'username', key: 'username',
    render: (username: string, activity) => <div>
      <div className="dm-record-title">{username || activity.displayName || '—'}</div>
      <Tag className="dm-status-tag">{activity.platform || '—'}</Tag>
    </div>,
  },
  {
    title: 'Thu thập', dataIndex: 'status', key: 'status',
    render: (status: string) => <Tag className="dm-status-tag">
      {status === 'COMPLETED' || status === 'SUCCESS' ? 'Thành công' : status === 'QUEUED' ? 'Đang đợi' : status || '—'}
    </Tag>,
  },
  {
    title: 'Kiểm định', dataIndex: 'decision', key: 'decision',
    render: (decision: string) => {
      const labels: Record<string, string> = { ACCEPTED: 'Đạt (KOC)', REJECTED: 'Loại', REVIEW: 'Chờ duyệt' };
      return <Tag className="dm-status-tag">{labels[decision] || decision || '—'}</Tag>;
    },
  },
  {
    title: 'Cập nhật', dataIndex: 'updatedAt', key: 'updatedAt',
    render: (time: string) => <span className="dm-secondary">{time || '—'}</span>,
  },
];

export default function CrawlerActivityTable({ realActivities, loading, unavailable }: Props) {
  return (
    <Card variant="borderless" className="im-dashboard-card dm-panel"
      title="Hoạt động thu thập gần đây"
      extra={<Link className="dm-section-link" to={DATA_MANAGER_ROUTES.JOBS}>Xem tất cả</Link>}>
      {realActivities.length > 0 ? (
        <Table dataSource={realActivities} columns={columns} scroll={{ x: 720 }}
          loading={loading} rowKey="id" pagination={false} size="small" />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? 'Đang tải nhật ký…' :
          unavailable.includes(0) ? 'Chưa tải được nhật ký thu thập' : 'Chưa có hoạt động thu thập'} />
      )}
    </Card>
  );
}
