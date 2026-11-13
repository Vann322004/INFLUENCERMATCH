import { Card, Tag, Button, Empty } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'pendingClaims' | 'pendingClaimsCount' | 'loading' | 'unavailable'>;

export default function PendingClaimsPanel({ pendingClaims, pendingClaimsCount, loading, unavailable }: Props) {
  const navigate = useNavigate();
  return (
    <Card
      bordered={false}
      style={{ borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
            Đơn nhận kênh cần thẩm định (DM-02)
          </span>
          <Tag color={pendingClaimsCount > 0 ? 'red' : 'default'} style={{ fontWeight: 700 }}>
            {loading ? 'Đang tải…' : unavailable.includes(1) ? 'Chưa tải được' : `${pendingClaimsCount} đơn`}
          </Tag>
        </div>
      }
    >
      {pendingClaims.length > 0 ? (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingClaims.slice(0, 5).map((claim) => (
              <div
                key={claim.id}
                style={{
                  padding: '12px 14px',
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
                    {claim.creatorHandle}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Người gửi: <strong>{claim.claimantName}</strong> ({claim.creatorPlatform})
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Nộp lúc: {new Date(claim.submittedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate(DATA_MANAGER_ROUTES.CREATOR_CLAIMS)}
                  style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                >
                  Thẩm định
                </Button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(DATA_MANAGER_ROUTES.CREATOR_CLAIMS)}
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Xem tất cả {loading ? 'Đang tải…' : unavailable.includes(1) ? 'Chưa tải được' : `${pendingClaimsCount} đơn`} trong Hàng đợi đối soát <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={loading ? 'Đang tải đơn nhận kênh…' : unavailable.includes(1) ? 'Không tải được hàng đợi nhận kênh. Làm mới để thử lại.' : 'Không có đơn nhận kênh nào đang chờ thẩm định.'}
        />
      )}
    </Card>
  );
}
