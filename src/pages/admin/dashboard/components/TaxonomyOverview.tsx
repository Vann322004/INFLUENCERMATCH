import { Card, Tag, Empty, Skeleton, Progress } from 'antd';
import { Link } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';
import { nicheService } from '../../../../services/api/nicheService';
import { dataManagerDashboardService } from '../../../../services/api/dataManagerDashboardService';
import { useDashboardResource } from '../hooks/useDashboardResource';
import DashboardResourceError from './DashboardResourceError';

export default function TaxonomyOverview() {
  const statistics = useDashboardResource(dataManagerDashboardService.getNicheStatistics);
  const catalog = useDashboardResource(nicheService.list);
  return <Card variant="borderless" className="im-dashboard-card dm-panel" title="Phân bổ nhà sáng tạo theo ngành hàng"
    extra={<Link className="dm-section-link" to={DATA_MANAGER_ROUTES.TAXONOMY}>Quản lý</Link>}>
    {statistics.status === 'loading' ? <Skeleton active paragraph={{ rows: 3 }} /> :
      statistics.status === 'error' ? <DashboardResourceError message="Chưa tải được thống kê ngành hàng." onRetry={statistics.reload} /> :
      !statistics.data?.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu phân bổ ngành hàng" /> :
      <div className="dm-niche-stats">{statistics.data.map((item, index) => <div className="dm-niche-stat" key={item.niche + index}>
        <div className="dm-niche-stat-label"><span>{item.name}</span><span>{item.creatorCount.toLocaleString('vi-VN')} nhà sáng tạo · {item.percentage.toLocaleString('vi-VN')}%</span></div>
        <Progress percent={item.percentage} showInfo={false} strokeColor="var(--dm-accent)" trailColor="#F1F5F9" />
      </div>)}</div>}
    <div className="dm-niche-catalog">
      <h3>Danh mục ngành hàng</h3>
      {catalog.status === 'loading' ? <Skeleton active paragraph={{ rows: 1 }} title={false} /> :
        catalog.status === 'error' ? <DashboardResourceError message="Chưa tải được danh mục ngành hàng." onRetry={catalog.reload} /> :
        !catalog.data?.length ? <p className="dm-secondary">Chưa có ngành hàng trong danh mục</p> :
        <div className="dm-niche-list">{catalog.data.map(niche => <Tag key={niche.id} className="dm-status-tag">{niche.name}</Tag>)}</div>}
    </div>
  </Card>;
}
