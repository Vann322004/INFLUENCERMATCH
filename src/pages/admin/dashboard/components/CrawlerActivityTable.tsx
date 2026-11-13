import { Card, Tag, Button, Empty, Table } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'realActivities' | 'loading' | 'unavailable'>;

export default function CrawlerActivityTable({ realActivities, loading, unavailable }: Props) {
  const navigate = useNavigate();
  const activityColumns: TableColumnsType<DataManagerDashboardData['realActivities'][number]> = [
    {
      title: 'Kênh / Ứng viên',
      dataIndex: 'username',
      key: 'username',
      render: (u: string, r: DataManagerDashboardData['realActivities'][number]) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{u || r.displayName || '—'}</div>
          <Tag color="geekblue" style={{ fontSize: 11, padding: '0 6px', marginTop: 2 }}>
            {r.platform || 'TIKTOK'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Thu thập (Crawler)',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => {
        const isSuccess = st === 'COMPLETED' || st === 'SUCCESS';
        const isQueued = st === 'QUEUED';
        return (
          <Tag color={isSuccess ? 'success' : isQueued ? 'processing' : 'error'} style={{ fontWeight: 600 }}>
            {isSuccess ? 'Thành công' : isQueued ? 'Đang đợi' : st || 'Thất bại'}
          </Tag>
        );
      },
    },
    {
      title: 'Kiểm định (Quality Decision)',
      dataIndex: 'decision',
      key: 'decision',
      render: (dec: string, r: any) => {
        const d = dec || (r.status === 'FILTERED' ? 'REJECTED' : 'REVIEW');
        const color = d === 'ACCEPTED' ? 'green' : d === 'REJECTED' ? 'red' : 'gold';
        const label = d === 'ACCEPTED' ? 'ACCEPTED (KOC)' : d === 'REJECTED' ? 'REJECTED (Loại)' : 'REVIEW (Chờ)';
        return (
          <Tag color={color} style={{ fontWeight: 600 }}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (t: string) => <span style={{ color: '#64748B', fontSize: 12 }}>{t || 'Vừa xong'}</span>,
    },
  ];
  return (
    <Card
      bordered={false}
      style={{ borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
            Nhật ký thu thập &amp; Thẩm định gần đây (DM-05 / DM-03)
          </span>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(DATA_MANAGER_ROUTES.JOBS)}
            style={{ fontSize: 12, padding: 0 }}
          >
            Xem toàn bộ log <ArrowRightOutlined />
          </Button>
        </div>
      }
    >
      {realActivities.length > 0 ? (
        <Table
          dataSource={realActivities}
          columns={activityColumns}
          scroll={{ x: 720 }}
          loading={loading}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {loading ? 'Đang tải nhật ký…' : unavailable.includes(0) ? 'Không tải được nhật ký. Làm mới để thử lại.' : 'Chưa có nhật ký hoạt động thu thập nào được ghi nhận từ Crawler Service trong phiên này.'}
              </span>
            }
          />
          <Button
            type="dashed"
            size="small"
            onClick={() => navigate(`${DATA_MANAGER_ROUTES.JOBS}?tab=test-scrape`)}
            style={{ marginTop: 8 }}
          >
            Cào thử nghiệm 1 KOC ngay
          </Button>
        </div>
      )}
    </Card>
  );
}
