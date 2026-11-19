import { Card, Empty } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'pendingClaims' | 'pendingClaimsCount' | 'loading' | 'unavailable'>;

export default function PendingClaimsPanel({ pendingClaims, pendingClaimsCount, loading, unavailable }: Props) {
  return (
    <Card variant="borderless" className="im-dashboard-card dm-panel"
      title={<span>Đơn nhận kênh <span className="dm-count">{loading ? '…' : unavailable.includes(1) ? '—' : pendingClaimsCount}</span></span>}
      extra={<Link className="dm-section-link" to={DATA_MANAGER_ROUTES.CREATOR_CLAIMS}>Xem tất cả</Link>}>
      {pendingClaims.length > 0 ? (
        <div className="dm-claim-list">
          {pendingClaims.slice(0, 5).map(claim => (
            <Link className="dm-claim-item" key={claim.id} to={DATA_MANAGER_ROUTES.CREATOR_CLAIMS}>
              <div>
                <div className="dm-record-title">{claim.creatorHandle}</div>
                <div className="dm-secondary">{claim.claimantName} · {claim.creatorPlatform}</div>
                <div className="dm-secondary">Nộp lúc: {claim.submittedAt && Number.isFinite(new Date(claim.submittedAt).getTime()) ? new Date(claim.submittedAt).toLocaleDateString('vi-VN') : '—'}</div>
              </div>
              <RightOutlined aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? 'Đang tải đơn nhận kênh…' :
          unavailable.includes(1) ? 'Chưa tải được đơn nhận kênh' : 'Không có đơn đang chờ thẩm định'} />
      )}
    </Card>
  );
}
