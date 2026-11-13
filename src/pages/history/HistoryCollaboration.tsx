import { Alert, Card, Collapse, Drawer, Empty, Space, Table, Tag } from 'antd';
import { useCallback } from 'react';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import type { HistoryAgreement, HistoryChannel, HistoryCollaborationDetail } from '../../types/api/campaignHistory.types';
import type { Deliverable, OutcomeRevision } from '../../types/api/collaboration.types';
import { ChannelNames, Facts } from './HistoryFacts';
import { collaborationStates, deliverableStates, EvidenceLink, historyDate, historyMoney, historyNumber,
  HistoryReadState, provenanceLabel, StatusTag, useHistoryRead } from './historyView';

const postMetrics = {
  views: 'Lượt xem', clicks: 'Lượt nhấp', likes: 'Lượt thích', comments: 'Bình luận', shares: 'Lượt chia sẻ',
} as const;
const metricNames = Object.keys(postMetrics) as (keyof typeof postMetrics)[];
const channelsFor = (channels: HistoryChannel[], creatorId: string) => channels.filter(channel => channel.creatorId === creatorId);

function Agreement({ agreement, channels }: { agreement: HistoryAgreement; channels: HistoryChannel[] }) {
  const proof = agreement.consentReference;
  return <Card title="Điều khoản đã chốt">
    {agreement.availability !== 'AVAILABLE' ? <p className="history-muted">Chưa có bản lưu đề xuất đã chốt.</p>
      : <Facts items={[
        { label: 'Đề xuất', value: `Phiên bản ${agreement.revision ?? '—'}` },
        { label: 'Phí theo điều khoản', value: historyMoney(agreement.fee, agreement.currency) },
        { label: 'Thời điểm chốt', value: historyDate(proof?.agreedAt, true) },
        { label: 'Bằng chứng đồng thuận', value: <div className="history-stack">
          {proof?.evidenceDescription || proof?.evidenceSource || (proof?.agreementSource === 'PORTAL' ? 'Creator đồng ý qua Portal' : '—')}
          <EvidenceLink url={proof?.evidenceUrl} label="Mở bằng chứng đồng thuận" />
        </div> },
        { label: 'Điều khoản', value: agreement.terms, wide: true },
        { label: 'Ấn phẩm theo đề xuất', value: agreement.deliverables?.length
          ? <ul className="history-evidence-list">{agreement.deliverables.map((item, index) =>
            <li key={index}><strong>{item.contentType} × {item.quantity}</strong> · Hạn nộp {historyDate(item.dueAt, true)}
              <ChannelNames channels={channelsFor(channels, item.creatorId)} /></li>)}</ul> : null, wide: true },
      ]} />}
  </Card>;
}

function ExecutionDeliverable({ unit, channels }: { unit: Deliverable; channels: HistoryChannel[] }) {
  return <div className="history-stack">
    <Facts items={[
      { label: 'Kênh hiện tại', value: <ChannelNames channels={channelsFor(channels, unit.creatorId)} /> },
      { label: 'Hạn nộp', value: historyDate(unit.dueAt, true) },
      { label: 'Vòng sửa đã dùng', value: `${unit.revisionRounds}/${unit.maxRevisionRounds}` },
      { label: 'Checklist', value: unit.acceptanceChecklist?.join('\n') || null },
    ]} />
    {unit.submissions.length ? <ul className="history-evidence-list">{unit.submissions.map(submission => {
      const review = unit.reviews.find(item => item.submissionRevision === submission.revision);
      const publication = unit.publications.find(item => item.submissionRevision === submission.revision);
      return <li key={submission.id}><div className="history-stack">
        <div>
          <strong>Bản {submission.revision}</strong> · {historyDate(submission.createdAt, true)} · {provenanceLabel(submission.source)}
          {submission.sourceDescription && <p>{submission.sourceDescription}</p>}
          <EvidenceLink url={submission.url} label="Mở bản nháp" />
        </div>
        {review && <div>
          <strong>{review.decision === 'APPROVE' ? 'Đã duyệt' : 'Yêu cầu sửa'}</strong> · {historyDate(review.createdAt, true)}
          {review.checklist?.length > 0 && <p>Đã kiểm tra: {review.checklist.join(', ')}</p>}
          {review.reason && <p>{review.reason}</p>}
        </div>}
        {publication && <div>
          <EvidenceLink url={publication.url} label="Mở bài đăng" />
          {publication.earlyPublication && <p>{publication.exceptionAcknowledged
            ? 'Đăng sớm · Đã xác nhận ngoại lệ' : 'Đăng sớm · Chưa xác nhận ngoại lệ'}
          {publication.exceptionReason && ` · ${publication.exceptionReason}`}</p>}
        </div>}
      </div></li>;
    })}</ul> : <p className="history-muted">Chưa có bản nộp.</p>}
  </div>;
}

function Outcome({ outcome, units, accepted }: { outcome: OutcomeRevision; units: Deliverable[]; accepted: boolean }) {
  const { payload, calculation } = outcome;
  return <div className="history-stack">
    <Space wrap><Tag color={accepted ? 'green' : 'default'}>{accepted ? 'Đã nghiệm thu' : 'Bản ghi kết quả'}</Tag>
      <Tag>{provenanceLabel(outcome.source)}</Tag><span>{historyDate(outcome.createdAt, true)}</span></Space>
    <Facts items={[
      { label: 'Chi phí thực tế', value: historyMoney(calculation.actualCost, payload.currency) },
      { label: 'Tổng giá trị đơn hàng (GMV)', value: historyMoney(payload.gmv, payload.currency) },
      { label: 'Doanh thu', value: historyMoney(payload.revenue, payload.currency) },
      { label: 'Kỳ tài chính', value: payload.periodStart && payload.periodEnd
        ? `${historyDate(payload.periodStart, true)} – ${historyDate(payload.periodEnd, true)}` : null },
      ...(['roas', 'roi', 'cpm', 'cpe'] as const).map(metric => ({
        label: metric.toUpperCase(),
        value: calculation[metric] == null ? '—' : metric === 'roi'
          ? new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(calculation[metric])
          : metric === 'roas' ? `${historyNumber(calculation[metric])}×` : historyMoney(calculation[metric], payload.currency),
      })),
    ]} />
    <EvidenceLink url={payload.financialEvidence} label="Mở link đối soát" />
    {(payload.posts ?? []).length > 0 && <Table rowKey={post => `${post.deliverableId}:${post.submissionRevision}`}
      dataSource={payload.posts} pagination={false} size="small" scroll={{ x: 'max-content' }} columns={[
        { title: 'Ấn phẩm', render: (_, post) => {
          const unit = units.find(item => item.id === post.deliverableId);
          return <div className="history-channels">
            <strong>{unit?.contentType ?? 'Ấn phẩm'} · Bản {post.submissionRevision}</strong>
            <EvidenceLink url={unit?.publications.find(item => item.submissionRevision === post.submissionRevision)?.url}
              label="Mở bài đăng" />
            <EvidenceLink url={post.evidenceUrl} label="Mở bằng chứng số liệu" />
          </div>;
        } },
        { title: 'Kỳ đo', render: (_, post) => post.periodStart && post.periodEnd
          ? `${historyDate(post.periodStart, true)} – ${historyDate(post.periodEnd, true)}` : '—' },
        ...metricNames.map(metric => ({ title: postMetrics[metric],
          render: (_: unknown, post: OutcomeRevision['payload']['posts'][number]) => post[metric] != null
            ? historyNumber(post[metric]) : post.unavailableMetrics?.includes(metric) ? 'Không cung cấp' : '—',
        })),
      ]} />}
  </div>;
}

function CollaborationContent({ detail }: { detail: HistoryCollaborationDetail }) {
  const { collaboration, execution, agreedProposal, legacyOutcome } = detail;
  const { currentChannels: channels } = collaboration;
  const { deliverables, outcomeRevisions, acceptances, review } = execution;
  const activeAcceptance = acceptances.find(item => !item.reopenedAt);
  const acceptedOutcome = activeAcceptance && outcomeRevisions.find(item => item.revision === activeAcceptance.outcomeRevision);
  const otherOutcomes = outcomeRevisions.filter(item => item.revision !== acceptedOutcome?.revision).slice().reverse();

  return <div className="history-stack">
    <Space wrap><StatusTag state={collaboration.status} labels={collaborationStates} />
      <Tag>{provenanceLabel(collaboration.provenance)}</Tag></Space>
    <Facts items={[
      { label: provenanceLabel(collaboration.currentProfileSource), value: <ChannelNames channels={channels} /> },
      { label: 'Phí đã chốt', value: historyMoney(collaboration.agreedFee, collaboration.currency) },
      { label: 'Ngày bắt đầu', value: historyDate(collaboration.startAt, true) },
      { label: 'Ngày hoàn tất', value: historyDate(collaboration.completedAt, true) },
    ]} />
    <Agreement agreement={agreedProposal} channels={channels} />
    <Card title="Ấn phẩm và lịch sử duyệt">
      {deliverables.length ? <Collapse items={deliverables.map(unit => ({
        key: unit.id,
        label: <Space wrap><strong>{unit.contentType}</strong><StatusTag state={unit.status} labels={deliverableStates} /></Space>,
        children: <ExecutionDeliverable unit={unit} channels={channels} />,
      }))} /> : <p className="history-muted">Chưa có bản lưu ấn phẩm.</p>}
    </Card>
    <Card className="history-proof-card" title="Outcome đã nghiệm thu">
      {acceptedOutcome && activeAcceptance ? <>
        <p>Phiên bản {acceptedOutcome.revision} · Nghiệm thu {historyDate(activeAcceptance.acceptedAt, true)}</p>
        <Outcome outcome={acceptedOutcome} units={deliverables} accepted />
      </> : <Alert showIcon type="info" title="Chưa có Outcome được nghiệm thu còn hiệu lực." />}
      {otherOutcomes.length > 0 && <Collapse items={otherOutcomes.map(item => {
        const reopened = acceptances.find(acceptance => acceptance.outcomeRevision === item.revision && acceptance.reopenedAt);
        return { key: item.id, label: `Lịch sử kết quả · Phiên bản ${item.revision}`, children: <div className="history-stack">
          {reopened && <p>Đã mở lại {historyDate(reopened.reopenedAt, true)}{reopened.reopenReason && ` · ${reopened.reopenReason}`}</p>}
          <Outcome outcome={item} units={deliverables} accepted={false} />
        </div> };
      })} />}
      {legacyOutcome && <Card size="small" title={provenanceLabel(legacyOutcome.provenance)}>
        <Facts items={[
          { label: 'Thời điểm ghi nhận', value: historyDate(legacyOutcome.storedValues.recordedAt, true) },
          ...metricNames.map(metric => ({ label: postMetrics[metric], value: historyNumber(legacyOutcome.storedValues[metric]) })),
          { label: 'Ghi chú kết quả', value: legacyOutcome.storedValues.resultNote, wide: true },
        ]} />
      </Card>}
    </Card>
    <Card title="Đánh giá cuối">
      {review ? <Facts items={[
        { label: 'Đánh giá chung', value: `${review.overallRating}/5` },
        { label: 'Phù hợp thương hiệu', value: `${review.brandFitRating}/5` },
        { label: 'Muốn hợp tác lại', value: review.wouldCollaborateAgain == null ? null : review.wouldCollaborateAgain ? 'Có' : 'Không' },
        { label: 'Outcome được đánh giá', value: review.acceptedOutcomeRevision == null ? null : `Phiên bản ${review.acceptedOutcomeRevision}` },
        { label: 'Thời điểm đánh giá', value: historyDate(review.reviewedAt, true) },
        { label: 'Nhãn đánh giá', value: review.reviewTags?.join(', ') || null },
        { label: 'Ghi chú', value: review.note, wide: true },
      ]} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đánh giá cuối." />}
    </Card>
  </div>;
}

export default function HistoryCollaboration({ campaignId, collaborationId, onClose }: {
  campaignId: string; collaborationId: string; onClose: () => void;
}) {
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.collaboration(campaignId, collaborationId, signal),
    [campaignId, collaborationId]);
  const { result, retry } = useHistoryRead(load);
  return <Drawer open size="min(840px, 100vw)" title="Lịch sử hợp tác" onClose={onClose}>
    {result.status === 'ready' ? <CollaborationContent detail={result.data} />
      : <HistoryReadState result={result} retry={retry} missing="Không tìm thấy hợp tác trong chiến dịch này." />}
  </Drawer>;
}
