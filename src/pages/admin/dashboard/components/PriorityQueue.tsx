import { Row, Col, Card } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import type { DataManagerDashboardData } from '../hooks/useDataManagerDashboard';

type Props = Pick<DataManagerDashboardData, 'loading' | 'unavailable' | 'pendingClaimsCount' |
  'pendingQualityCount' | 'pendingConflictsCount' | 'oldestWaitTime'>;

export default function PriorityQueue({ loading, unavailable, pendingClaimsCount,
  pendingQualityCount, pendingConflictsCount, oldestWaitTime }: Props) {
  const queues = [
    { title: 'Yêu cầu nhận kênh', count: pendingClaimsCount, source: 1,
      detail: oldestWaitTime ? 'Chờ lâu nhất: ' + oldestWaitTime : 'Đơn đang chờ thẩm định',
      path: DATA_MANAGER_ROUTES.CREATOR_CLAIMS },
    { title: 'Hồ sơ chờ phân loại', count: pendingQualityCount, source: 2,
      detail: 'Cần kiểm định chất lượng', path: DATA_MANAGER_ROUTES.DATA_QUALITY },
    { title: 'Xung đột định danh', count: pendingConflictsCount, source: 3,
      detail: 'Cần đối soát hồ sơ', path: DATA_MANAGER_ROUTES.CREATORS },
  ];

  return (
    <Card variant="borderless" className="im-dashboard-card dm-panel" title="Hàng đợi cần xử lý">
      <Row className="dm-priority-queue" gutter={[16, 12]}>
        {queues.map(queue => (
          <Col xs={24} xl={8} key={queue.path}>
            <Link className="dm-queue-link" to={queue.path}>
              <div className="dm-queue-content">
                <span className="dm-queue-title">{queue.title}</span>
                <span className="dm-queue-count">{loading ? '…' : unavailable.includes(queue.source) ? '—' : queue.count}</span>
                <span className="dm-queue-detail">{loading ? 'Đang tải…' : unavailable.includes(queue.source) ? 'Chưa tải được hàng đợi' : queue.detail}</span>
              </div>
              <RightOutlined aria-hidden="true" />
            </Link>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
