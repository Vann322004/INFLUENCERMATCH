import { Alert, Button, Card, Empty, Select, Space, Table, Tabs } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import { useCallback, useState } from 'react';
import { briefFields, BriefFacts, ChannelNames } from './HistoryFacts';
import { Link, useLocation } from 'react-router-dom';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import type { HistoryBrief, HistoryContext, HistoryDetail } from '../../types/api/campaignHistory.types';
import type { CollaborationStatus } from '../../types/api/collaboration.types';
import { campaignStates, collaborationStates, historyDate, historyMoney,
  HistoryReadState, isUuid, provenanceLabel, StatusTag, useHistoryRead } from './historyView';
import DuplicateBriefModal from './DuplicateBriefModal';
import HistoryCollaboration from './HistoryCollaboration';
import CampaignOutcomeReport from './CampaignOutcomeReport';

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
      { key: 'overview', label: 'Tổng quan', children: <CampaignOutcomeReport detail={detail} /> },
      { key: 'brief', label: 'Brief & phiên bản', children: <Contexts detail={detail}
        duplicate={canDuplicate ? context => setCopy({ contextId: context.id, version: context.version }) : undefined} /> },
      { key: 'collaborations', label: 'Hợp tác', children: <Collaborations campaignId={campaign.id} /> },
    ]} />
    {copy && canDuplicate && <DuplicateBriefModal campaignId={campaign.id} contextId={copy.contextId}
      contextVersion={copy.version} onClose={() => setCopy(undefined)} />}
  </>;
}
