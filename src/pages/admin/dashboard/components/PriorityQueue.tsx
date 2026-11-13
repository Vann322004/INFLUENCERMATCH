import { Row, Col, Card, Tag, Button, Typography } from 'antd';
import { ArrowRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

const { Text } = Typography;

type Props = Pick<DataManagerDashboardData, 'loading' | 'unavailable' | 'pendingClaimsCount' | 'pendingQualityCount' | 'pendingConflictsCount' | 'oldestWaitTime'>;

export default function PriorityQueue({ loading, unavailable, pendingClaimsCount, pendingQualityCount, pendingConflictsCount, oldestWaitTime }: Props) {
  const navigate = useNavigate();
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 14,
        marginBottom: 20,
        background: 'linear-gradient(135deg, #FEF2F2 0%, #FFFBEB 100%)',
        border: '1px solid #FECACA',
        boxShadow: '0 2px 8px rgba(239,68,68,0.04)',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#DC2626', fontSize: 18 }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: '#991B1B' }}>
            Cần xử lý ngay (Hàng đợi Ưu tiên Vận hành)
          </span>
        </div>
        <Text style={{ fontSize: 12, color: '#B91C1C', fontStyle: 'italic' }}>
          Data Manager cần tập trung vào các tắc nghẽn dữ liệu thay vì chỉ quan sát thống kê
        </Text>
      </div>

      <Row className="dm-priority-queue" gutter={[16, 12]}>
        {/* Priority Item 1: Claims */}
        <Col xs={24} xl={8}>
          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #FCA5A5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                1. Đơn nhận kênh chờ thẩm định (DM-02)
              </span>
              <Tag color={pendingClaimsCount > 0 ? 'error' : 'default'} style={{ fontWeight: 800 }}>
                {loading ? 'Đang tải…' : unavailable.includes(1) ? 'Chưa tải được' : `${pendingClaimsCount} đơn`}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              {loading ? 'Đang tải hàng đợi…' : unavailable.includes(1) ? 'Chưa xác định được hàng đợi nhận kênh' : oldestWaitTime ? `Thời gian chờ lâu nhất: ${oldestWaitTime}` : 'Hiện không có đơn nào tồn đọng'}
            </div>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(DATA_MANAGER_ROUTES.CREATOR_CLAIMS)}
              style={{ padding: 0, marginTop: 6, fontSize: 12, fontWeight: 600, color: '#DC2626' }}
            >
              Vào duyệt đơn claim <ArrowRightOutlined />
            </Button>
          </div>
        </Col>

        {/* Priority Item 2: Staging Quality Review */}
        <Col xs={24} xl={8}>
          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #FCD34D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                2. Hồ sơ Staging chờ phân loại (DM-03)
              </span>
              <Tag color={pendingQualityCount > 0 ? 'warning' : 'default'} style={{ fontWeight: 800 }}>
                {loading ? 'Đang tải…' : unavailable.includes(2) ? 'Chưa tải được' : `${pendingQualityCount} hồ sơ`}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              AI Confidence &lt; 0.7 cần chuyên gia kiểm định thủ công
            </div>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(DATA_MANAGER_ROUTES.DATA_QUALITY)}
              style={{ padding: 0, marginTop: 6, fontSize: 12, fontWeight: 600, color: '#D97706' }}
            >
              Vào kiểm định Staging <ArrowRightOutlined />
            </Button>
          </div>
        </Col>

        {/* Priority Item 3: Identity Conflicts */}
        <Col xs={24} xl={8}>
          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                3. Xung đột & Trùng lặp định danh (DM-01)
              </span>
              <Tag color={pendingConflictsCount > 0 ? 'magenta' : 'default'} style={{ fontWeight: 800 }}>
                {loading ? 'Đang tải…' : unavailable.includes(3) ? 'Chưa tải được' : `${pendingConflictsCount} vụ việc`}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Kênh có 2 chủ quyền hoặc hồ sơ nghi trùng lặp cần đối soát
            </div>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(DATA_MANAGER_ROUTES.CREATORS)}
              style={{ padding: 0, marginTop: 6, fontSize: 12, fontWeight: 600, color: '#2563EB' }}
            >
              Vào đối soát Master <ArrowRightOutlined />
            </Button>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
