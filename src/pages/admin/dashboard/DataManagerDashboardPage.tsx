import type { CSSProperties } from 'react';
import { Row, Col, theme } from 'antd';
import { useDataManagerDashboard } from './hooks/useDataManagerDashboard';
import DashboardHeader from './components/DashboardHeader';
import PriorityQueue from './components/PriorityQueue';
import DashboardKpis from './components/DashboardKpis';
import TaxonomyOverview from './components/TaxonomyOverview';
import CrawlerActivityTable from './components/CrawlerActivityTable';
import PendingClaimsPanel from './components/PendingClaimsPanel';
import CrawlerTrendsPanel from './components/CrawlerTrendsPanel';
import '../../dashboard/Dashboard.css';
import './DataManagerDashboard.css';

export default function DataManagerDashboardPage() {
  const dashboard = useDataManagerDashboard();
  const { token } = theme.useToken();
  const colors = {
    '--dm-accent': token.colorPrimary,
    '--dm-accent-bg': token.colorPrimaryBg,
    '--dm-border': '#E2E8F0',
    '--dm-text': token.colorTextHeading,
    '--dm-secondary': token.colorTextSecondary,
  } as CSSProperties;

  return (
    <div className="dm-dashboard" style={colors}>
      <DashboardHeader />
      <DashboardKpis />
      <PriorityQueue {...dashboard} />
      <CrawlerTrendsPanel />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}><CrawlerActivityTable {...dashboard} /></Col>
        <Col xs={24} lg={9}><PendingClaimsPanel {...dashboard} /></Col>
      </Row>
      <TaxonomyOverview />
    </div>
  );
}
