import { Alert, Button, Card, Empty, Select, Space, Spin, Table, Typography } from 'antd';
import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import { collaborationService } from '../../services/api/collaborationService';
import type { CollaborationSummary } from '../../types/api/collaboration.types';
import { StatusTag, RetryAlert, collaborationReadError } from '../collaboration/CollaborationExecutionPanel';
import { FeesOverview } from '../collaboration/OperationsTables';
import { acceptanceReadiness } from '../collaboration/collaborationProgress';
import { useCollaborationPermissions } from '../collaboration/useCollaborationPermissions';
import CampaignOutcomeReport from '../history/CampaignOutcomeReport';
import { HistoryReadState, useHistoryRead } from '../history/historyView';
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
  return <Card title="Hợp tác của chiến dịch">
    {result.status === 'loading' ? <Spin description="Đang tải hợp tác" />
      : result.status === 'error' ? (() => {
        const error = collaborationReadError(result.error);
        return error.retryable ? <RetryAlert error={error.message} retry={retry} />
          : <Alert showIcon type="warning" title={error.message} />;
      })()
      : <Table<CollaborationSummary> rowKey="id" dataSource={result.data} scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Chiến dịch chưa có hợp tác.' }}
        expandable={{ expandedRowRender: row => <CollaborationResults id={row.id} /> }}
        columns={[
          { title: 'Nhà sáng tạo', render: (_, row) => row.creatorName || row.channels?.map(channel => channel.creatorName || channel.username).filter(Boolean).join(', ') || '—' },
          { title: 'Trạng thái', render: (_, row) => <StatusTag status={row.status} /> },
          { title: 'Thao tác', render: (_, row) => <Link to="/collaboration/detail?tab=kpi" state={{ collaborationId: row.id }}>
            {row.status === 'AWAITING_REVIEW' ? 'Xem nghiệm thu và đánh giá' : 'Xem kết quả'}
          </Link> },
        ]} />}
  </Card>;
}

function CampaignReport({ campaignId }: { campaignId: string }) {
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.detail(campaignId, signal), [campaignId]);
  const { result, retry } = useHistoryRead(load);
  const permissions = useCollaborationPermissions();

  return <div className="history-stack">
    {result.status === 'ready' ? <CampaignOutcomeReport detail={result.data} />
      : <HistoryReadState result={result} retry={retry} missing="Không tìm thấy báo cáo của chiến dịch." />}
    {permissions.has('MANAGE_OWN_COLLABORATION') && <CampaignCollaborations campaignId={campaignId} />}
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
        <Typography.Title level={2}>Hiệu suất chiến dịch</Typography.Title>
        <Typography.Paragraph type="secondary">Số liệu đối soát từ kết quả hợp tác đã được nghiệm thu và đánh giá.</Typography.Paragraph>
      </div>
      <Link to="/campaign-history">Lịch sử chiến dịch</Link>
    </header>
    {result.status === 'loading' ? <Spin description="Đang tải chiến dịch" />
      : result.status === 'error' ? <RetryAlert error="Không tải được danh sách chiến dịch." retry={retry} />
      : !campaigns.length ? <Empty description="Chưa có chiến dịch." /> : <>
        <Space wrap>
          <label htmlFor="performance-campaign">Chiến dịch</label>
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
        {campaign ? <CampaignReport key={campaign.id} campaignId={campaign.id} />
          : <Alert showIcon type="warning" title="Chiến dịch trong đường dẫn không còn khả dụng. Hãy chọn một chiến dịch." />}
      </>}
  </main>;
}
