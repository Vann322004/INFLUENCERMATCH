import { Row, Col, Card, Skeleton } from 'antd';
import { UserOutlined, LinkOutlined, DisconnectOutlined, CopyOutlined } from '@ant-design/icons';
import { dataManagerDashboardService } from '../../../../services/api/dataManagerDashboardService';
import { useDashboardResource } from '../hooks/useDashboardResource';
import KpiCard from './KpiCard';
import DashboardResourceError from './DashboardResourceError';

export default function DashboardKpis() {
  const summary = useDashboardResource(dataManagerDashboardService.getCreatorMasterSummary);
  if (summary.status === 'error') return <Card className="im-dashboard-card">
    <DashboardResourceError message="Chưa tải được tổng quan nhà sáng tạo." onRetry={summary.reload} />
  </Card>;
  const cards = summary.data ? [
    { title: 'Hồ sơ nhà sáng tạo', icon: <UserOutlined />, value: summary.data.totalMasters, unit: 'hồ sơ trong hệ thống' },
    { title: 'Kênh đã liên kết', icon: <LinkOutlined />, value: summary.data.claimedChannelsCount, unit: 'kênh đã có hồ sơ chủ' },
    { title: 'Kênh chưa liên kết', icon: <DisconnectOutlined />, value: summary.data.unclaimedChannelsCount, unit: 'kênh chưa có hồ sơ chủ' },
    { title: 'Nghi trùng lặp', icon: <CopyOutlined />, value: summary.data.duplicateCandidatesCount, unit: 'trường hợp cần đối soát' },
  ] : [];
  return <Row className="dm-kpi-grid" gutter={[16, 16]}>
    {summary.status === 'loading' ? Array.from({ length: 4 }, (_, index) => <Col xs={24} sm={12} xl={6} key={index}>
      <Card className="im-dashboard-card"><Skeleton active paragraph={{ rows: 2 }} /></Card>
    </Col>) : cards.map(card => <Col xs={24} sm={12} xl={6} key={card.title}>
      <KpiCard {...card} value={card.value.toLocaleString('vi-VN')} />
    </Col>)}
  </Row>;
}
