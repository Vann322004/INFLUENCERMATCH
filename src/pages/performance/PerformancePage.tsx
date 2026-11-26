import { Alert, Button, Card, Empty, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import { useCallback, useState } from 'react';
import { BarChart3, PieChart as PieChartIcon, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import { collaborationService } from '../../services/api/collaborationService';
import type { CollaborationSummary } from '../../types/api/collaboration.types';
import { StatusTag, RetryAlert, collaborationReadError } from '../collaboration/CollaborationExecutionPanel';
import { channelLabel, formatMoney } from '../collaboration/ExecutionForms';
import { FeesOverview } from '../collaboration/OperationsTables';
import { acceptanceReadiness } from '../collaboration/collaborationProgress';
import { useCollaborationPermissions } from '../collaboration/useCollaborationPermissions';
import CampaignOutcomeReport from '../history/CampaignOutcomeReport';
import { HistoryReadState, useHistoryRead } from '../history/historyView';
import { PerformanceOverviewSection } from './PerformanceCharts';
import './PerformancePage.css';

function CollaborationResults({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => collaborationService.execution(id, signal), [id]);
  const { result, retry } = useHistoryRead(load);
  const permissions = useCollaborationPermissions();
  if (result.status === 'loading') return <Spin />;
  if (result.status === 'error') {
    const error = collaborationReadError(result.error);
    return error.retryable ? <RetryAlert error={error.message} retry={retry} />
      : <Alert showIcon type="warning" title={error.message} />;
  }

  const snapshot = result.data;
  const latest = snapshot.outcomeRevisions[snapshot.outcomeRevisions.length - 1];
  const activeAcceptance = snapshot.acceptances.find(entry => !entry.reopenedAt);
  const canReview = snapshot.status === 'AWAITING_REVIEW' && !snapshot.review
    && !!activeAcceptance && snapshot.outcomeRevisions.some(entry => entry.revision === activeAcceptance.outcomeRevision)
    && permissions.has('RECORD_OWN_CREATOR_REVIEW');
  const canAccept = snapshot.status === 'IN_PROGRESS' && snapshot.campaignStatus === 'ACTIVE'
    && permissions.has('RECORD_OWN_OUTCOME') && acceptanceReadiness(snapshot, latest).issues.length === 0;

  return <Space orientation="vertical" style={{ width: '100%' }}>
    <FeesOverview snapshot={snapshot} latest={latest} />
    {snapshot.status === 'IN_PROGRESS' && !latest && <Typography.Text type="secondary">
      Chờ Creator ghi nhận bài đăng và kết quả cho ấn phẩm đã duyệt.
    </Typography.Text>}
    {(canAccept || canReview) && <Link to="/collaboration/detail?tab=kpi" state={{ collaborationId: id }}>
      {canReview ? 'Đánh giá cuối' : 'Nghiệm thu'}
    </Link>}
  </Space>;
}

function CampaignCollaborations({ campaignId }: { campaignId: string }) {
  const load = useCallback((signal: AbortSignal) => collaborationService.listBrand(campaignId, signal), [campaignId]);
  const { result, retry } = useHistoryRead(load);
  return <Card className="perf-table-card" title="Hợp tác của chiến dịch">
    {result.status === 'loading' ? <Spin description="Đang tải hợp tác" />
      : result.status === 'error' ? (() => {
        const error = collaborationReadError(result.error);
        return error.retryable ? <RetryAlert error={error.message} retry={retry} />
          : <Alert showIcon type="warning" title={error.message} />;
      })()
      : <Table<CollaborationSummary> rowKey="id" dataSource={result.data} scroll={{ x: 'max-content' }}
        pagination={result.data.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
        locale={{ emptyText: 'Chiến dịch chưa có hợp tác.' }}
        expandable={{ expandedRowRender: row => <CollaborationResults id={row.id} /> }}
        columns={[
          {
            title: 'Nhà sáng tạo',
            render: (_, row) => (
              <div className="perf-creator-cell">
                <strong>{row.creatorName || row.channels?.map(channel => channel.creatorName || channel.username).filter(Boolean).join(', ') || '—'}</strong>
                {row.channelName && <span className="perf-cell-sub">{row.channelName}</span>}
              </div>
            ),
          },
          {
            title: 'Kênh',
            render: (_, row) => row.channels?.length
              ? row.channels.map(channelLabel).join(', ')
              : (row.platform || '—'),
          },
          {
            title: 'Phí đã chốt',
            render: (_, row) => <strong>{formatMoney(row.agreedFee, row.currency)}</strong>,
          },
          {
            title: 'Kết quả',
            render: (_, row) => (
              <Tag color={row.hasOutcome ? 'green' : 'default'}>
                {row.hasOutcome ? 'Đã ghi nhận' : 'Chưa có'}
              </Tag>
            ),
          },
          {
            title: 'Đánh giá cuối',
            render: (_, row) => (
              <Tag color={row.hasReview ? 'purple' : 'default'}>
                {row.hasReview ? 'Đã đánh giá' : 'Chưa đánh giá'}
              </Tag>
            ),
          },
          { title: 'Trạng thái', render: (_, row) => <StatusTag status={row.status} /> },
          {
            title: 'Thao tác',
            render: (_, row) => (
              <Link className="perf-action-link" to="/collaboration/detail?tab=kpi" state={{ collaborationId: row.id }}>
                {row.status === 'AWAITING_REVIEW' ? 'Nghiệm thu & đánh giá' : 'Xem kết quả'}
              </Link>
            ),
          },
        ]} />}
  </Card>;
}

function CampaignReport({ campaignId }: { campaignId: string }) {
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.detail(campaignId, signal), [campaignId]);
  const { result, retry } = useHistoryRead(load);
  const permissions = useCollaborationPermissions();
  const [activeTab, setActiveTab] = useState<'overview' | 'collaborations' | 'metrics'>('overview');

  const tabs = [
    { key: 'overview' as const, label: 'Tổng quan & Biểu đồ', icon: <PieChartIcon size={15} /> },
    ...(permissions.has('MANAGE_OWN_COLLABORATION')
      ? [{ key: 'collaborations' as const, label: 'Hợp tác theo Creator', icon: <Users size={15} /> }]
      : []),
    { key: 'metrics' as const, label: 'Bảng chỉ số đối soát', icon: <BarChart3 size={15} /> },
  ];

  return <div className="history-stack perf-report-stack">
    {result.status === 'ready' && (
      <div className="perf-status-strip">
        <span>Hoàn tất: <strong>{result.data.report.completedCount}</strong></span>
        <span>Đang chạy: <strong>{result.data.report.unfinishedCount}</strong></span>
        <span>Đã hủy: <strong>{result.data.report.cancelledCount}</strong></span>
        <span>Dừng giữa chừng: <strong>{result.data.report.terminatedCount ?? 0}</strong></span>
        <span>Đủ điều kiện báo cáo: <strong>{result.data.report.eligibleCount}</strong></span>
      </div>
    )}

    <nav className="perf-tabs-bar" aria-label="Mục báo cáo hiệu suất">
      {tabs.map(item => (
        <button
          key={item.key}
          type="button"
          className={'perf-tab-btn' + (activeTab === item.key ? ' active' : '')}
          onClick={() => setActiveTab(item.key)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>

    {activeTab === 'overview' && (
      result.status === 'ready' ? (
        <div className="history-stack perf-report-stack">
          <PerformanceOverviewSection detail={result.data} />
          <CampaignOutcomeReport detail={result.data} mode="financial" />
        </div>
      ) : (
        <HistoryReadState result={result} retry={retry} missing="Không tìm thấy báo cáo của chiến dịch." />
      )
    )}

    {activeTab === 'collaborations' && permissions.has('MANAGE_OWN_COLLABORATION') && (
      <CampaignCollaborations campaignId={campaignId} />
    )}

    {activeTab === 'metrics' && (
      result.status === 'ready' ? (
        <CampaignOutcomeReport detail={result.data} mode="metrics" />
      ) : (
        <HistoryReadState result={result} retry={retry} missing="Không tìm thấy báo cáo của chiến dịch." />
      )
    )}
  </div>;
}

export default function PerformancePage() {
  const [params, setParams] = useSearchParams();
  const load = useCallback(() => campaignService.getAllCampaigns(), []);
  const { result, retry } = useHistoryRead(load);
  const campaigns = result.status === 'ready' ? result.data : [];
  const selected = params.get('campaign');
  const campaign = selected ? campaigns.find(item => item.id === selected) : campaigns[0];

  return <main className="performance-report history-stack">
    <header className="performance-report-heading">
      <div>
        <h1 className="perf-main-title">Báo cáo & Hiệu suất chiến dịch</h1>
        <p className="perf-description">Số liệu đối soát từ kết quả hợp tác đã được nghiệm thu và đánh giá cuối.</p>
      </div>
      <Link className="perf-history-btn" to="/campaign-history">Lịch sử chiến dịch</Link>
    </header>
    {result.status === 'loading' ? <div className="perf-loading-box"><Spin description="Đang tải chiến dịch" /></div>
      : result.status === 'error' ? <RetryAlert error="Không tải được danh sách chiến dịch." retry={retry} />
      : !campaigns.length ? <Empty description="Chưa có chiến dịch." /> : <>
        <div className="perf-toolbar-card">
          <Space wrap size={12}>
            <label htmlFor="performance-campaign" className="perf-toolbar-label">Chiến dịch</label>
            <Select id="performance-campaign" showSearch optionFilterProp="label"
              className="performance-campaign-select" placeholder="Chọn chiến dịch" value={campaign?.id}
              options={campaigns.map(item => ({ label: item.name, value: item.id }))}
              onChange={id => setParams(previous => {
                const next = new URLSearchParams(previous);
                next.set('campaign', id);
                return next;
              })} />
            {campaign && <Button type="link" href={'/campaign-history/' + campaign.id}>Xem lịch sử chiến dịch này</Button>}
          </Space>
        </div>
        {campaign ? <CampaignReport key={campaign.id} campaignId={campaign.id} />
          : <Alert showIcon type="warning" title="Chiến dịch trong đường dẫn không còn khả dụng. Hãy chọn một chiến dịch." />}
      </>}
  </main>;
}
