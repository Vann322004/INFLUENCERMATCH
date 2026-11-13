import { Tag, Button, Space, Badge, Typography } from 'antd';
import { SafetyCertificateOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

const { Title, Text } = Typography;

type Props = Pick<DataManagerDashboardData, 'loading' | 'apiError' | 'lastRefreshed' | 'fetchDashboardData' | 'pendingClaimsCount'>;

export default function DashboardHeader({ loading, apiError, lastRefreshed, fetchDashboardData, pendingClaimsCount }: Props) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div className="dm-title-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Title level={3} style={{ color: '#0F172A', margin: 0, fontWeight: 800 }}>
            Bảng điều khiển Vận hành Dữ liệu
          </Title>
          <Badge status={apiError ? 'error' : 'success'} />
          <Tag color={apiError ? 'error' : 'success'} style={{ borderRadius: 12, fontWeight: 700 }}>
            {loading ? 'Đang tải dữ liệu…' : apiError ? 'Cảnh báo kết nối API' : 'Hệ thống bình thường'}
          </Tag>
        </div>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, display: 'block' }}>
          Giám sát Crawler, danh tính Creator Master và chất lượng dữ liệu • Cập nhật lúc: <strong>{lastRefreshed.toLocaleTimeString('vi-VN')}</strong> • <em>Chế độ: Polling / Làm mới theo yêu cầu</em>
        </Text>
      </div>

      <Space wrap>
        <Button
          type="default"
          icon={<ReloadOutlined spin={loading} />}
          onClick={fetchDashboardData}
          loading={loading}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Làm mới số liệu
        </Button>
        <Button
          type="primary"
          icon={<SafetyCertificateOutlined />}
          onClick={() => navigate(DATA_MANAGER_ROUTES.CREATOR_CLAIMS)}
          style={{
            background: '#2563EB',
            borderRadius: 8,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}
        >
          Kiểm duyệt nhận kênh ({pendingClaimsCount})
        </Button>
      </Space>
    </div>
  );
}
