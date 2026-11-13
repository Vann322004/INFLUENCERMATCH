import { Row, Col, Alert } from 'antd';
import { useDataManagerDashboard } from './hooks/useDataManagerDashboard';
import DashboardHeader from './components/DashboardHeader';
import PriorityQueue from './components/PriorityQueue';
import DashboardKpis from './components/DashboardKpis';
import IngestionTrendsPanel from './components/IngestionTrendsPanel';
import TaxonomyOverview from './components/TaxonomyOverview';
import CrawlerActivityTable from './components/CrawlerActivityTable';
import PendingClaimsPanel from './components/PendingClaimsPanel';

export default function DataManagerDashboardPage() {
  const dashboard = useDataManagerDashboard();

  return (
    <div className="dm-dashboard" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      <DashboardHeader {...dashboard} />
      {dashboard.apiError && (
        <Alert type="warning" showIcon style={{ marginBottom: 16, borderRadius: 10 }}
          message="Thông báo kết nối dữ liệu" description={dashboard.apiError} />
      )}
      <PriorityQueue {...dashboard} />
      <DashboardKpis {...dashboard} />
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={15}><IngestionTrendsPanel /></Col>
        <Col xs={24} lg={9}><TaxonomyOverview {...dashboard} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}><CrawlerActivityTable {...dashboard} /></Col>
        <Col xs={24} lg={10}><PendingClaimsPanel {...dashboard} /></Col>
      </Row>
    </div>
  );
}
