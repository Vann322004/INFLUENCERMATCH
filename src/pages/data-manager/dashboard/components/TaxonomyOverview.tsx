import { useMemo, useState } from 'react';
import { Button, Card, Empty, Progress, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import { dataManagerDashboardService } from '../../../../services/api/dataManagerDashboardService';
import { useDashboardResource } from '../hooks/useDashboardResource';
import DashboardResourceError from './DashboardResourceError';

const TOP_LIMIT = 5;

export default function TaxonomyOverview() {
  const statistics = useDashboardResource(dataManagerDashboardService.getNicheStatistics);
  const [expanded, setExpanded] = useState(false);

  const { rows, hasMore, totalCount } = useMemo(() => {
    const raw = [...(statistics.data ?? [])].sort((a, b) => b.creatorCount - a.creatorCount);
    if (expanded || raw.length <= TOP_LIMIT) {
      return { rows: raw, hasMore: raw.length > TOP_LIMIT, totalCount: raw.length };
    }
    const top = raw.slice(0, TOP_LIMIT);
    const rest = raw.slice(TOP_LIMIT);
    const restCreators = rest.reduce((sum, item) => sum + item.creatorCount, 0);
    const restPct = Number(rest.reduce((sum, item) => sum + item.percentage, 0).toFixed(1));
    return {
      rows: [
        ...top,
        {
          niche: '__OTHER__',
          name: `Khác (${rest.length} ngành)`,
          creatorCount: restCreators,
          percentage: restPct,
        },
      ],
      hasMore: true,
      totalCount: raw.length,
    };
  }, [statistics.data, expanded]);

  return (
    <Card
      variant="borderless"
      className="im-dashboard-card dm-panel"
      title="Phân bổ nhà sáng tạo theo ngành hàng"
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hasMore && (
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Thu gọn' : `Xem tất cả (${totalCount})`}
            </Button>
          )}
          <Link className="dm-section-link" to={DATA_MANAGER_ROUTES.TAXONOMY}>Quản lý</Link>
        </div>
      }
    >
      {statistics.status === 'loading' ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : statistics.status === 'error' ? (
        <DashboardResourceError message="Chưa tải được thống kê ngành hàng." onRetry={statistics.reload} />
      ) : !rows.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu phân bổ ngành hàng" />
      ) : (
        <div className="dm-niche-stats">
          {rows.map((item, index) => (
            <div className="dm-niche-stat" key={item.niche + index}>
              <div className="dm-niche-stat-label">
                <span>{item.name}</span>
                <span>
                  {item.creatorCount.toLocaleString('vi-VN')} nhà sáng tạo · {item.percentage.toLocaleString('vi-VN')}%
                </span>
              </div>
              <Progress percent={item.percentage} showInfo={false} strokeColor="var(--dm-accent)" trailColor="#F1F5F9" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
