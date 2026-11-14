import { Alert, Button, Card, Empty, Select, Space, Table, Tabs } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import { useCallback, useState } from 'react';
import { briefFields, BriefFacts, ChannelNames } from './HistoryFacts';
import { Link, useLocation } from 'react-router-dom';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import type { HistoryBrief, HistoryContext, HistoryDetail, HistoryMetric } from '../../types/api/campaignHistory.types';
import type { CollaborationStatus } from '../../types/api/collaboration.types';
import { campaignStates, collaborationStates, historyDate, historyMoney, historyNumber,
  HistoryReadState, isUuid, provenanceLabel, StatusTag, useHistoryRead } from './historyView';
import DuplicateBriefModal from './DuplicateBriefModal';
import HistoryCollaboration from './HistoryCollaboration';

const metrics: Record<string, string> = {
  committedFee: 'Phí cam kết', actualCost: 'Chi phí thực tế', gmv: 'Tổng giá trị đơn hàng (GMV)',
  revenue: 'Doanh thu', views: 'Lượt xem', clicks: 'Lượt nhấp', likes: 'Lượt thích', comments: 'Bình luận',
  shares: 'Lượt chia sẻ', engagements: 'Lượt tương tác', roas: 'ROAS', roi: 'ROI', cpm: 'CPM', cpe: 'CPE',
};

const metricReasons: Record<string, string> = {
  NO_COMPLETED_COLLABORATIONS: 'Chưa có hợp tác hoàn tất.',
  MISSING_ACCEPTED_REVIEWED_SOURCE: 'Có hợp tác thiếu Outcome được nghiệm thu và đánh giá cuối tham chiếu.',
  UNSUPPORTED_CURRENCY: 'Dữ liệu tiền tệ chưa thể đối chiếu bằng VND.',
  MISSING_COMMITMENT: 'Thiếu phí cam kết.',
  INVALID_OR_MISSING_ACTUAL_COST: 'Chi phí thực tế thiếu hoặc chưa hợp lệ.',
  UNSUPPORTED_FINANCIAL_POLICY: 'Phiên bản tính tài chính chưa tương thích.',
  MISSING_POSTS: 'Chưa có dữ liệu bài đăng.',
  MISSING_PUBLICATION_REFERENCE: 'Thiếu tham chiếu bài đăng.',
  MISSING_MEASUREMENT_PERIOD: 'Thiếu kỳ đo.',
  INCONSISTENT_FINANCIAL_PERIOD: 'Kỳ tài chính và kỳ đo chưa nhất quán.',
  MISSING_METRIC_INPUT: 'Thiếu đầu vào của chỉ số.',
  DUPLICATE_POST_CONFLICT: 'Số liệu của cùng một bài đăng mâu thuẫn.',
  INVALID_METRIC_INPUT: 'Đầu vào của chỉ số chưa hợp lệ.',
  INCONSISTENT_MEASUREMENT_PERIOD: 'Kỳ đo giữa các bài chưa nhất quán.',
  ATTRIBUTION_NOT_ESTABLISHED: 'Chưa xác định được phạm vi ghi nhận doanh thu giữa các hợp tác.',
  INVALID_FINANCIAL_INPUT: 'Dữ liệu tài chính chưa hợp lệ.',
  MISSING_FINANCIAL_INPUT: 'Thiếu dữ liệu tài chính.',
  INVALID_DENOMINATOR: 'Mẫu số bằng 0 hoặc chưa hợp lệ.',
};

function metricValue(key: string, metric: HistoryMetric) {
  const { value, unit, availability } = metric;
  if (availability !== 'AVAILABLE' || value == null) return '—';
  if (key === 'roi') return new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(value);
  if (unit === 'RATIO') return `${historyNumber(value)}×`;
  if (unit === 'VND_PER_1000_VIEWS') return `${historyMoney(value, 'VND')} / 1.000 lượt xem`;
  if (unit === 'VND_PER_ENGAGEMENT') return `${historyMoney(value, 'VND')} / lượt tương tác`;
  return unit === 'VND' ? historyMoney(value, 'VND') : historyNumber(value);
}

function Overview({ detail }: { detail: HistoryDetail }) {
  const { report, copyOrigin, latestContext, snapshotAvailability } = detail;
  return <div className="history-stack">
    <div className="history-grid">{[
      ['Đã hoàn tất', report.completedCount], ['Chưa hoàn tất', report.unfinishedCount],
      ['Đã hủy', report.cancelledCount], ['Có nguồn đủ điều kiện báo cáo', report.eligibleCount],
    ].map(([label, value]) => <Card key={label}><div className="history-summary"><span>{label}</span><strong>{value}</strong></div></Card>)}</div>
    {snapshotAvailability === 'MISSING' && <Alert showIcon type="info" title="Chưa có bản lưu lịch sử của brief." />}
    {latestContext && <p className="history-muted">Bản lưu brief mới nhất · Phiên bản {latestContext.version ?? '—'} · {historyDate(latestContext.createdAt, true)}</p>}
    {copyOrigin && <p className="history-muted">Chiến dịch được tạo bằng cách dùng lại brief từ <Link
      to={`/campaign-history/${copyOrigin.sourceCampaignId}`}>chiến dịch nguồn</Link>.</p>}
    <Card title="Báo cáo kết quả">
      <p className="history-muted">Kết quả lấy từ hợp tác đã hoàn tất có Outcome được nghiệm thu và đánh giá cuối tham chiếu.
        Phí cam kết gồm các hợp tác chưa hủy. Nguồn số liệu: {provenanceLabel(report.metricSource)}.</p>
      <Table rowKey="key" size="middle" scroll={{ x: 'max-content' }} pagination={false}
        dataSource={Object.entries(report.metrics).map(([key, metric]) => ({ key, metric }))}
        columns={[
          { title: 'Chỉ số', render: (_, row) => metrics[row.key] ?? row.key },
          { title: 'Giá trị', render: (_, row) => <strong>{metricValue(row.key, row.metric)}</strong> },
          { title: 'Độ phủ', render: (_, { metric: { coverage } }) => <span>
            {coverage.includedCollaborationCount}/{coverage.requiredCollaborationCount} hợp tác
            {coverage.distinctPostCount > 0 && ` · ${coverage.distinctPostCount} bài đăng`}
          </span> },
          { title: 'Dữ liệu còn thiếu', width: 320, render: (_, { metric }) => metric.unavailableReasons.length
            ? <ul className="history-reasons">{metric.unavailableReasons.map(reason =>
              <li key={reason}>{metricReasons[reason] ?? reason}</li>)}</ul> : '—' },
        ]} />
    </Card>
  </div>;
}

function Contexts({ detail, duplicate }: { detail: HistoryDetail; duplicate?: (context: HistoryContext) => void }) {
  const [page, setPage] = useState(0);
  const id = detail.currentCampaign.id;
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.contexts(id, page, signal), [id, page]);
  const { result, retry } = useHistoryRead(load);
  return <div className="history-stack">
    {result.status !== 'ready' ? <HistoryReadState result={result} retry={retry} />
      : <Table rowKey="id" dataSource={result.data.items} scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bản lưu lịch sử." /> }}
        pagination={{ current: page + 1, total: result.data.totalElements, pageSize: result.data.size,
          showSizeChanger: false, onChange: value => setPage(value - 1) }}
        expandable={{ expandedRowRender: context => <div className="history-stack">
          {context.missingFields.length > 0 && <Alert showIcon type="info" title="Bản lưu còn thiếu dữ liệu."
            description={context.missingFields.map(field => briefFields[field as keyof HistoryBrief] ?? field).join(', ')} />}
          <BriefFacts brief={context.brief} />
        </div> }}
        columns={[
          { title: 'Phiên bản', render: (_, context) => `Phiên bản ${context.version ?? '—'}` },
          { title: 'Thời điểm lưu', render: (_, context) => historyDate(context.createdAt, true) },
          { title: 'Nguồn', render: (_, context) => provenanceLabel(context.snapshotKind) },
          { title: 'Brand Context', render: (_, context) => context.brandContextId ?? '—' },
          ...(duplicate ? [{ title: 'Thao tác', render: (_: unknown, context: HistoryContext) =>
            <Button onClick={() => duplicate(context)}>Dùng lại brief</Button> }] : []),
        ]} />}
    <Card title={provenanceLabel(detail.currentProfileSource)}>
      <BriefFacts brief={detail.currentCampaign} />
    </Card>
  </div>;
}

function Collaborations({ campaignId }: { campaignId: string }) {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<CollaborationStatus>();
  const [selected, setSelected] = useState<string>();
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.collaborations(campaignId, page, status, signal),
    [campaignId, page, status]);
  const { result, retry } = useHistoryRead(load);

  return <div className="history-stack">
    <div className="history-section-heading">
      <h2>Danh sách hợp tác</h2>
      <Select aria-label="Trạng thái hợp tác" placeholder="Tất cả trạng thái" allowClear value={status}
        options={Object.entries(collaborationStates).map(([value, [label]]) => ({ value, label }))}
        onChange={value => { setStatus(value); setPage(0); }} />
    </div>
    {result.status !== 'ready' ? <HistoryReadState result={result} retry={retry} />
      : <Table rowKey="id" dataSource={result.data.items} scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={status ? 'Không có hợp tác phù hợp với trạng thái.' : 'Chiến dịch chưa có hợp tác.'} /> }}
        pagination={{ current: page + 1, total: result.data.totalElements, pageSize: result.data.size,
          showSizeChanger: false, onChange: value => setPage(value - 1) }}
        columns={[
          { title: 'Kênh hiện tại', render: (_, row) => <ChannelNames channels={row.currentChannels} /> },
          { title: 'Trạng thái', render: (_, row) => <StatusTag state={row.status} labels={collaborationStates} /> },
          { title: 'Phí đã chốt', render: (_, row) => historyMoney(row.agreedFee, row.currency) },
          { title: 'Ngày hoàn tất', render: (_, row) => historyDate(row.completedAt, true) },
          { title: 'Nguồn', render: (_, row) => provenanceLabel(row.provenance) },
          { title: 'Thao tác', render: (_, row) => <Button onClick={() => setSelected(row.id)}>Xem chi tiết</Button> },
        ]} />}
    {selected && <HistoryCollaboration key={selected} campaignId={campaignId} collaborationId={selected}
      onClose={() => setSelected(undefined)} />}
  </div>;
}

export default function CampaignHistoryDetail({ campaignId, canDuplicate }: { campaignId: string; canDuplicate: boolean }) {
  const { search } = useLocation();
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.detail(campaignId, signal), [campaignId]);
  return <>
    <Link to={{ pathname: '/campaign-history', search }} className="history-back"><ArrowLeftOutlined aria-hidden /> Quay lại danh sách</Link>
    {isUuid(campaignId) ? <DetailContent load={load} canDuplicate={canDuplicate} />
      : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy chiến dịch." />}
  </>;
}

function DetailContent({ load, canDuplicate }: {
  load: (signal: AbortSignal) => Promise<HistoryDetail>; canDuplicate: boolean;
}) {
  const { result, retry } = useHistoryRead(load);
  const [copy, setCopy] = useState<{ contextId?: string; version?: number | null }>();
  if (result.status !== 'ready') return <HistoryReadState result={result} retry={retry} missing="Không tìm thấy chiến dịch." />;
  const detail = result.data;
  const { currentCampaign: campaign } = detail;
  return <>
    <div className="history-heading">
      <div><h1>{campaign.name}</h1><Space wrap><StatusTag state={campaign.status} labels={campaignStates} />
        <span className="history-muted">{provenanceLabel(detail.currentProfileSource)}</span></Space></div>
      {canDuplicate && <Button type="primary" icon={<CopyOutlined aria-hidden />} onClick={() => setCopy({})}>Dùng lại brief</Button>}
    </div>
    <Tabs items={[
      { key: 'overview', label: 'Tổng quan', children: <Overview detail={detail} /> },
      { key: 'brief', label: 'Brief & phiên bản', children: <Contexts detail={detail}
        duplicate={canDuplicate ? context => setCopy({ contextId: context.id, version: context.version }) : undefined} /> },
      { key: 'collaborations', label: 'Hợp tác', children: <Collaborations campaignId={campaign.id} /> },
    ]} />
    {copy && canDuplicate && <DuplicateBriefModal campaignId={campaign.id} contextId={copy.contextId}
      contextVersion={copy.version} onClose={() => setCopy(undefined)} />}
  </>;
}
