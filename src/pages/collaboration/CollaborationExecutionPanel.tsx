import { Alert, App, Button, Card, Collapse, Descriptions, Empty, Form, Input, Modal, Select, Space, Spin, Tag, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChartOutlined, FileDoneOutlined, VideoCameraOutlined } from '@ant-design/icons';
import axios from 'axios';
import { collaborationService } from '../../services/api/collaborationService';
import { getErrorMessage } from '../../services/apiClient';
import type {
  CollaborationDetail, CollaborationStatus, Deliverable, ExecutionSnapshot,
  Acceptance, OutcomeRevision, RatioName, ReviewValues,
} from '../../types/api/collaboration.types';
import {
  channelLabel, currentPublication, formatDate, formatMoney, formatNumber, httpsRule, initialOutcome, initialFinance, financePayload, FinanceFields,
  gmvLabel, hasFinance, LegacyPlanFields, legacyPlanPayload, measurementFor, measurementMetric, metricLabels, metrics, OutcomeFields, outcomePayload,
  required, requiredText, ReviewFields, reviewPayload,
} from './ExecutionForms';
import type { FinanceForm, LegacyPlanForm, OutcomeForm } from './ExecutionForms';
import { FeesOverview, HttpsLink, OutcomeTable } from './OperationsTables';
import { acceptanceReadiness, sortDeliverables } from './collaborationProgress';
import './CollaborationPage.css';

type StatusTone = 'gray' | 'blue' | 'orange' | 'green' | 'red';
type StatusStyle = [label: string, tone: StatusTone];

const statuses: Record<CollaborationStatus, StatusStyle> = {
  PLANNED: ['Đã lên kế hoạch', 'gray'],
  IN_PROGRESS: ['Đang thực hiện', 'blue'],
  AWAITING_REVIEW: ['Chờ đánh giá cuối', 'orange'],
  COMPLETED: ['Đã hoàn tất', 'green'],
  CANCELLED: ['Đã hủy', 'red'],
};

export function collaborationReadError(error: unknown) {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 403) return { message: 'Bạn không có quyền xem hợp tác này.', retryable: false };
  if (status === 404) return { message: 'Không tìm thấy hợp tác.', retryable: false };
  return { message: getErrorMessage(error, 'Không tải được chi tiết hợp tác.'), retryable: true };
}

const unitStatuses: Record<Deliverable['status'], StatusStyle> = {
  PENDING: ['Chờ nộp', 'gray'],
  SUBMITTED: ['Chờ duyệt', 'orange'],
  CHANGES_REQUESTED: ['Yêu cầu sửa', 'red'],
  APPROVED: ['Đã duyệt', 'green'],
};

export const statusOptions = (Object.keys(statuses) as CollaborationStatus[]).map(value => ({ value, label: statuses[value][0] }));

function ColoredStatus({ style }: { style: StatusStyle }) {
  const [text, tone] = style;
  return <Tag className={`collab-status-tag collab-status-${tone}`}>{text}</Tag>;
}

export function StatusTag({ status }: { status: CollaborationStatus }) {
  return <ColoredStatus style={statuses[status] ?? [status, 'gray']} />;
}

export function RetryAlert({ error, retry }: { error: string; retry: () => void }) {
  return <Alert type="error" showIcon title={error} action={<Button size="small" onClick={retry}>Thử lại</Button>} />;
}

type ActionKind = 'start' | 'cancel' | 'setup' | 'submit' | 'approve' | 'changes'
  | 'publish' | 'exception' | 'outcome' | 'finance' | 'accept' | 'reopen' | 'review' | 'legacyReview';

const actionLabels: Record<ActionKind, string> = {
  start: 'Bắt đầu hợp tác', cancel: 'Hủy hợp tác', setup: 'Ghi kế hoạch thực thi',
  submit: 'Nộp bản nháp', approve: 'Phê duyệt', changes: 'Yêu cầu chỉnh sửa',
  publish: 'Báo bài đã đăng sớm', exception: 'Xác nhận ngoại lệ',
  outcome: 'Lưu số liệu', finance: 'Lưu tài chính', accept: 'Nghiệm thu', reopen: 'Mở lại nghiệm thu',
  review: 'Gửi đánh giá cuối', legacyReview: 'Đánh giá hợp tác cũ',
};

type Action = {
  kind: ActionKind;
  unit?: Deliverable;
  outcomeRevision?: number;
  editing?: boolean;
};

type ActionValues = OutcomeForm & FinanceForm & LegacyPlanForm & ReviewValues & {
  url: string;
  checklist: string[];
};

const ratios: RatioName[] = ['roas', 'roi', 'cpm', 'cpe'];
const unavailable: Record<string, string> = {
  INCONSISTENT_MEASUREMENT_PERIOD: 'Kỳ đo chưa nhất quán',
  MISSING_INPUT: 'Thiếu đầu vào',
  INVALID_DENOMINATOR: 'Mẫu số không hợp lệ',
};

function OutcomeFinance({ outcome }: { outcome: OutcomeRevision }) {
  return <>
    <Descriptions size="small" bordered column={{ xs: 1, sm: 2, lg: 3 }} title="Tài chính và chỉ số"
      items={[
        { key: 'cost', label: 'Chi phí thực tế', children: formatMoney(outcome.calculation.actualCost, outcome.payload.currency) },
        { key: 'gmv', label: gmvLabel, children: formatMoney(outcome.payload.gmv, outcome.payload.currency) },
        { key: 'revenue', label: 'Doanh thu', children: formatMoney(outcome.payload.revenue, outcome.payload.currency) },
        ...ratios.map(ratio => {
          const value = outcome.calculation[ratio];
          const reason = outcome.calculation[`${ratio}UnavailableReason`];
          return {
            key: ratio, label: ratio.toUpperCase(),
            children: value == null ? ['—', reason && unavailable[reason]].filter(Boolean).join(' · ')
              : ratio === 'roi' ? formatNumber(value * 100) + '%' : formatNumber(value),
          };
        }),
      ]} />
    {!!outcome.payload.costs?.length && <ul>
      {outcome.payload.costs.map((cost, index) => <li key={index}>{cost.description} · {formatMoney(cost.amount, outcome.payload.currency)}</li>)}
    </ul>}
    {outcome.payload.financialEvidence && <HttpsLink url={outcome.payload.financialEvidence}>Bằng chứng đối soát</HttpsLink>}
  </>;
}

function AcceptanceHistory({ entries }: { entries: Acceptance[] }) {
  return <>{entries.map(entry => <p key={entry.id}>
    Nghiệm thu lúc {formatDate(entry.acceptedAt)}
    {entry.reopenedAt && <> · Mở lại lúc {formatDate(entry.reopenedAt)} · {entry.reopenReason}</>}
  </p>)}</>;
}

function OutcomeHistory({ snapshot, brand, label }: {
  snapshot: ExecutionSnapshot;
  brand: boolean;
  label: (unit: Deliverable) => string;
}) {
  const earlier = snapshot.outcomeRevisions.slice(0, -1).reverse();
  if (!earlier.length) return null;
  return <Collapse items={[{
    key: 'history',
    label: 'Lịch sử kết quả (' + earlier.length + ')',
    children: <Collapse items={earlier.map(outcome => ({
      key: outcome.id,
      label: <Space wrap>
        <strong>Phiên bản {outcome.revision}</strong>
        <Tag>{outcome.source || outcome.calculation.metricSource}</Tag>
        <span>{formatDate(outcome.createdAt)}</span>
      </Space>,
      children: <Space orientation="vertical" className="execution-stack">
        <p>{outcome.reason}</p>
        {outcome.payload.resultNote && <p>{outcome.payload.resultNote}</p>}
        {outcome.payload.posts.map(post => {
          const unit = snapshot.deliverables.find(d => d.id === post.deliverableId);
          return <Descriptions key={post.deliverableId} size="small" bordered column={{ xs: 1, sm: 2, lg: 3 }}
            title={<Space wrap><span>{unit ? label(unit) : 'Ấn phẩm'} · Bản {post.submissionRevision}</span>
              {post.evidenceUrl && <HttpsLink url={post.evidenceUrl}>Bằng chứng</HttpsLink>}</Space>}
            items={[
              { key: 'period', label: 'Kỳ đo', children: `${formatDate(post.periodStart)} – ${formatDate(post.periodEnd)}` },
              ...metrics.map(metric => ({ key: metric, label: metricLabels[metric], children: measurementMetric(post, metric) })),
            ]} />;
        })}
        {brand && <OutcomeFinance outcome={outcome} />}
        <AcceptanceHistory entries={snapshot.acceptances.filter(a => a.outcomeRevision === outcome.revision)} />
      </Space>,
    }))} />,
  }]} />;
}

function DeliverableHistory({ unit }: { unit: Deliverable }) {
  if (!unit.submissions.length) return <Typography.Text type="secondary">Chưa có bản nháp</Typography.Text>;
  return <Collapse items={[...unit.submissions].reverse().map(submission => {
    const decision = unit.reviews.find(r => r.submissionRevision === submission.revision);
    const publication = unit.publications.find(p => p.submissionRevision === submission.revision);
    return {
      key: submission.id,
      label: `Bản ${submission.revision} · ${submission.source === 'CREATOR_PORTAL' ? 'Creator nộp' : 'Brand nhập thay'} · ${formatDate(submission.createdAt)}`,
      children: <Space orientation="vertical">
        <HttpsLink url={submission.url}>Mở bản nháp</HttpsLink>
        {submission.sourceDescription && <span>{submission.sourceDescription}</span>}
        {decision && <div>
          <strong>{decision.decision === 'APPROVE' ? 'Đã duyệt' : 'Yêu cầu chỉnh sửa'}</strong>
          {' · '}{formatDate(decision.createdAt)}{decision.reason && <> · {decision.reason}</>}
          {!!decision.checklist.length && <ul>{decision.checklist.map(check => <li key={check}>{check}</li>)}</ul>}
        </div>}
        {publication && <Space wrap>
          <HttpsLink url={publication.url}>Mở bài đăng</HttpsLink>
          {publication.earlyPublication && <Tag color={publication.exceptionAcknowledged ? 'default' : 'warning'}>
            {publication.exceptionAcknowledged ? 'Ngoại lệ đã xác nhận' : 'Đăng trước khi duyệt'}
          </Tag>}
          {publication.exceptionReason && <span>{publication.exceptionReason}</span>}
        </Space>}
      </Space>,
    };
  })} defaultActiveKey={[unit.submissions[unit.submissions.length - 1].id]} />;
}

const tabs = [
  { value: 'progress', label: 'Tiến độ', icon: <FileDoneOutlined /> },
  { value: 'review', label: 'Ấn phẩm', icon: <VideoCameraOutlined /> },
  { value: 'kpi', label: 'Kết quả & Nghiệm thu', icon: <BarChartOutlined /> },
] as const;

type CollaborationTab = typeof tabs[number]['value'];

export default function CollaborationExecutionPanel({ summary, brand, permissions, onReviewCompleted }: {
  summary: CollaborationDetail;
  brand: boolean;
  permissions: ReadonlySet<string>;
  onReviewCompleted: (campaignId: string) => void;
}) {
  const id = summary.id;
  const { message } = App.useApp();
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot>();
  const [loadError, setLoadError] = useState<ReturnType<typeof collaborationReadError>>();
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action>();
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [failure, setFailure] = useState('');
  const [refreshed, setRefreshed] = useState(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const pending = useRef(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>();
  const [tab, setTab] = useState<CollaborationTab>('progress');
  const legacyOutcome = snapshot?.executionSource === 'LEGACY' && snapshot.status === 'COMPLETED'
    ? summary.outcome : undefined;
  const manage = brand && permissions.has('MANAGE_OWN_COLLABORATION');
  const canRespond = !brand && permissions.has('RESPOND_OWN_COOPERATION');
  const canReadDeal = manage && permissions.has('MANAGE_OWN_RELATIONSHIP');
  const canRecord = brand && permissions.has('RECORD_OWN_OUTCOME');
  const canReview = brand && permissions.has('RECORD_OWN_CREATOR_REVIEW');

  const read = useCallback(async (isCurrent: () => boolean = () => true) => {
    setLoading(true);
    setLoadError(undefined);
    try {
      const current = await collaborationService.execution(id);
      if (!isCurrent()) return false;
      setSnapshot(current);
      return isCurrent();
    } catch (error) {
      if (isCurrent()) {
        setSnapshot(undefined);
        setLoadError(collaborationReadError(error));
      }
      return false;
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let current = true;
    void read(() => current);
    return () => { current = false; };
  }, [read]);

  const latest = snapshot?.outcomeRevisions[snapshot.outcomeRevisions.length - 1];
  const accepted = snapshot?.acceptances.find(a => !a.reopenedAt);
  const awaitingReview = snapshot?.status === 'AWAITING_REVIEW';
  const acceptedOutcome = snapshot?.outcomeRevisions.find(outcome => outcome.revision === accepted?.outcomeRevision);
  const canSendReview = canReview && awaitingReview && !!acceptedOutcome && !snapshot?.review;
  const planned = snapshot?.status === 'PLANNED';
  const canCancel = planned && canReadDeal && !!snapshot?.dealId && snapshot.dealRevision != null;
  const canStart = canCancel && snapshot.campaignStatus === 'ACTIVE' && snapshot.assignmentStatus === 'READY';
  const publishedUnits = snapshot?.deliverables.filter(unit => !!currentPublication(unit)) ?? [];
  const canSaveFinance = !!latest?.payload.posts.length && latest.payload.posts.every(post =>
    publishedUnits.some(unit => unit.id === post.deliverableId && unit.submissionRevision === post.submissionRevision));
  const inProgress = snapshot?.status === 'IN_PROGRESS' && snapshot.campaignStatus === 'ACTIVE';
  const canPost = inProgress && canRespond;
  const readiness = snapshot ? acceptanceReadiness(snapshot, latest) : undefined;
  const canAccept = !!readiness && readiness.issues.length === 0;
  const channels = summary.channels ?? [];
  const label = (unit: Deliverable) => {
    const channel = channels.find(item => item.creatorId === unit.creatorId);
    const sameType = snapshot?.deliverables.filter(item => item.contentType === unit.contentType && item.creatorId === unit.creatorId);
    const number = sameType && sameType.length > 1 ? ' #' + (sameType.indexOf(unit) + 1) : '';
    return unit.contentType + number + (channel ? ' · ' + channelLabel(channel) : '');
  };

  const startAction = useCallback((next: Action) => {
    attempt.current = null;
    setFailure('');
    setConflict(false);
    setRefreshed(false);
    setAction(next);
  }, []);

  function actionStillValid(current: ExecutionSnapshot, target: Action) {
    const unit = current.deliverables.find(item => item.id === target.unit?.id);
    if (target.unit && (!unit || unit.submissionRevision !== target.unit.submissionRevision)) return false;
    switch (target.kind) {
      case 'start':
        return canStart;
      case 'cancel':
        return canCancel;
      case 'setup':
        return manage && current.executionSource === 'LEGACY' && ['PLANNED', 'IN_PROGRESS'].includes(current.status);
      case 'submit':
        return canPost && !!unit && unit.status !== 'SUBMITTED';
      case 'approve':
        return inProgress && manage && unit?.status === 'SUBMITTED';
      case 'changes':
        return inProgress && manage && unit?.status === 'SUBMITTED' && unit.revisionRounds < unit.maxRevisionRounds;
      case 'publish':
        return canPost && !!unit?.submissionRevision && !currentPublication(unit);
      case 'exception': {
        const post = unit && currentPublication(unit);
        return inProgress && manage && !!post?.earlyPublication && !post.exceptionAcknowledged;
      }
      case 'outcome':
        return canPost && unit?.status === 'APPROVED'
          && !!measurementFor(latest?.payload, unit) === target.editing
          && currentPublication(unit)?.url === currentPublication(target.unit!)?.url;
      case 'finance':
        return inProgress && canRecord && canSaveFinance && latest?.revision === target.outcomeRevision;
      case 'accept':
        return inProgress && canRecord && !!latest && canAccept && target.outcomeRevision === latest.revision;
      case 'reopen':
        return canRecord && current.status === 'AWAITING_REVIEW' && accepted?.outcomeRevision === target.outcomeRevision;
      case 'review':
        return canSendReview && acceptedOutcome.revision === target.outcomeRevision;
      case 'legacyReview':
        return canReview && current.status === 'COMPLETED' && current.executionSource === 'LEGACY' && legacyOutcome && !current.review;
    }
  }

  const allowed = !!(action && snapshot && actionStillValid(snapshot, action));

  async function submit(values: ActionValues) {
    if (!snapshot || !action || !allowed || conflict || pending.current || loading) return;
    pending.current = true;
    setBusy(true);
    setFailure('');
    try {
      const revision = { expectedRevision: snapshot.executionRevision };
      const reason = values.reason?.trim() ?? '';
      const unit = snapshot.deliverables.find(item => item.id === action.unit?.id);
      const unitRevision = unit && { expectedRevision: unit.revision, submissionRevision: unit.submissionRevision };
      const keyFor = (body: object) => {
        const fingerprint = JSON.stringify(body);
        if (attempt.current?.fingerprint !== fingerprint) {
          attempt.current = { fingerprint, key: crypto.randomUUID() };
        }
        return attempt.current.key;
      };
      let result: ExecutionSnapshot | undefined;
      switch (action.kind) {
        case 'start':
        case 'cancel': {
          const body = {
            expectedRevision: snapshot.dealRevision!, reason: action.kind === 'cancel' ? reason : undefined,
          };
          await collaborationService.transition(snapshot.campaignId, snapshot.dealId!, action.kind, body, keyFor(body));
          break;
        }
        case 'setup': {
          const body = { ...revision, ...legacyPlanPayload(values) };
          result = await collaborationService.setup(id, body, keyFor(body));
          break;
        }
        case 'submit': {
          const body = {
            expectedRevision: unit!.revision,
            url: values.url.trim(),
            source: 'CREATOR_PORTAL' as const,
          };
          result = await collaborationService.submit(id, unit!.id, body, keyFor(body));
          break;
        }
        case 'approve':
        case 'changes': {
          const body = {
            ...unitRevision!,
            decision: action.kind === 'approve' ? 'APPROVE' as const : 'REQUEST_CHANGES' as const,
            completedChecklist: action.kind === 'approve' ? values.checklist : [],
            reason: action.kind === 'changes' ? reason : undefined,
          };
          result = await collaborationService.decide(id, unit!.id, body, keyFor(body));
          break;
        }
        case 'publish':
        case 'exception': {
          const body = {
            ...unitRevision!,
            url: action.kind === 'exception' ? currentPublication(unit!)!.url : values.url.trim(),
            acknowledgeException: action.kind === 'exception',
            exceptionReason: action.kind === 'exception' ? reason : undefined,
          };
          result = await collaborationService.publish(id, unit!.id, body, keyFor(body));
          break;
        }
        case 'outcome': {
          const body = { ...revision, ...outcomePayload(values, unit!) };
          result = await collaborationService.saveDeliverableOutcome(id, unit!.id, body, keyFor(body));
          break;
        }
        case 'finance': {
          const body = { ...revision, ...financePayload(values) };
          result = await collaborationService.saveFinance(id, body, keyFor(body));
          break;
        }
        case 'accept': {
          const body = { ...revision, outcomeRevision: action.outcomeRevision! };
          result = await collaborationService.accept(id, body, keyFor(body));
          break;
        }
        case 'reopen': {
          const body = { ...revision, reason };
          result = await collaborationService.reopen(id, body, keyFor(body));
          break;
        }
        case 'review': {
          const body = { ...revision, ...reviewPayload(values), outcomeRevision: action.outcomeRevision! };
          result = await collaborationService.review(id, body, keyFor(body));
          if (result.status === 'COMPLETED') {
            message.success('Đã gửi đánh giá và hoàn tất hợp tác');
            onReviewCompleted(result.campaignId);
            return;
          }
          break;
        }
        case 'legacyReview': {
          const body = { ...revision, ...reviewPayload(values) };
          result = await collaborationService.reviewLegacy(id, body, keyFor(body));
          break;
        }
      }
      if (result) setSnapshot(result);
      message.success('Đã lưu thay đổi.');
      setAction(undefined);
      await read();
    } catch (error) {
      const changed = axios.isAxiosError(error) && error.response?.status === 409;
      setConflict(changed);
      setFailure(getErrorMessage(error, 'Thao tác chưa thành công. Vui lòng thử lại.'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function closeAction() {
    if (pending.current) return;
    setAction(undefined);
  }

  const reviewUnit = action?.unit && snapshot?.deliverables.find(item => item.id === action.unit?.id);

  const ordered = sortDeliverables(snapshot?.deliverables ?? []);
  const selectedUnit = ordered.find(unit => unit.id === selectedUnitId) ?? ordered[0];
  const financeButtonLabel = readiness?.hasPositiveCost ? 'Xác nhận chi phí' : 'Ghi tài chính';
  const openFinance = () => startAction({ kind: 'finance', outcomeRevision: latest?.revision, editing: hasFinance(latest?.payload) });
  const canSetup = manage && snapshot?.executionSource === 'LEGACY' && channels.length > 0
    && ['PLANNED', 'IN_PROGRESS'].includes(snapshot.status);
  const canLegacyReview = canReview && !!legacyOutcome && !snapshot?.review;
  const reviewUnavailable = brand && awaitingReview && !snapshot.review
    ? !canReview ? 'Bạn chưa có quyền gửi đánh giá cuối.'
      : !acceptedOutcome ? 'Chưa có phiên bản kết quả đã nghiệm thu còn hiệu lực. Hãy tải lại để kiểm tra.' : undefined
    : undefined;

  function renderDeliverable(unit: Deliverable, splitView: boolean) {
    const post = currentPublication(unit);
    const measurement = measurementFor(latest?.payload, unit);
    const buttons = (
      <Space wrap className="execution-actions">
        {canPost && unit.status !== 'SUBMITTED' && <Button disabled={loading}
          onClick={() => startAction({ kind: 'submit', unit })}>{unit.status === 'CHANGES_REQUESTED' ? 'Nộp lại bản nháp' : 'Nộp bản nháp'}</Button>}
        {inProgress && manage && unit.status === 'SUBMITTED' && <>
          <Button disabled={loading} onClick={() => startAction({ kind: 'approve', unit })}>Phê duyệt</Button>
          <Button danger={splitView} disabled={loading || unit.revisionRounds >= unit.maxRevisionRounds}
            onClick={() => startAction({ kind: 'changes', unit })}>Yêu cầu chỉnh sửa</Button>
          {unit.revisionRounds >= unit.maxRevisionRounds && <Typography.Text type="secondary">Đã hết lượt sửa.</Typography.Text>}
        </>}
        {canPost && unit.status !== 'APPROVED' && unit.submissionRevision > 0 && !post && <Button disabled={loading}
          onClick={() => startAction({ kind: 'publish', unit })}>
          Báo bài đã đăng sớm
        </Button>}
        {canPost && unit.status === 'APPROVED' && <Button type="primary" disabled={loading || busy}
          onClick={() => startAction({ kind: 'outcome', unit, editing: !!measurement })}>
          {measurement ? 'Chỉnh sửa kết quả' : 'Nhập kết quả'}
        </Button>}
        {inProgress && manage && post?.earlyPublication && !post.exceptionAcknowledged && <Button disabled={loading}
          onClick={() => startAction({ kind: 'exception', unit })}>Xác nhận ngoại lệ</Button>}
      </Space>
    );

    return <section key={unit.id} className={splitView ? 'review-main-card execution-unit' : 'execution-unit'}>
      <div className={splitView ? 'review-player-top' : undefined}>
        <div>
          <Space wrap><strong className={splitView ? 'review-content-title' : undefined}>{label(unit)}</strong><ColoredStatus style={unitStatuses[unit.status] ?? [unit.status, 'gray']} /></Space>
          <p className={splitView ? 'review-meta-row' : undefined}>Hạn nộp {formatDate(unit.dueAt)} · Đã dùng {unit.revisionRounds}/{unit.maxRevisionRounds} vòng sửa</p>
        </div>
        {splitView && buttons}
      </div>
      <div><strong>Checklist nghiệm thu</strong>
        <ul>{unit.acceptanceChecklist.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
      <DeliverableHistory unit={unit} />
      {!splitView && buttons}
    </section>;
  }

  return <div className="execution-stack">
    {loadError && (loadError.retryable
      ? <RetryAlert error={loadError.message} retry={() => void read()} />
      : <Alert showIcon type="error" title={loadError.message} />)}
    {loading && !snapshot && <Spin />}
    {snapshot && <>
      <header className="collab-detail-heading">
        <div>
          <Space wrap><h1 className="collab-main-title">Chi tiết hợp tác</h1><StatusTag status={snapshot.status} /></Space>
          <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }} items={[
            { key: 'campaign', label: 'Chiến dịch', children: summary.campaignName || '—' },
            { key: 'partner', label: brand ? 'Creator đối tác' : 'Nhãn hàng', children: (brand ? summary.creatorName : summary.brandName) || '—' },
            { key: 'channels', label: 'Kênh', children: channels.map(channelLabel).join(', ') || summary.platform || '—' },
            ...(!brand ? [{ key: 'fee', label: 'Phí đã chốt', children: formatMoney(snapshot.agreedFee, snapshot.currency) }] : []),
          ]} />
        </div>
        <Space wrap className="collab-heading-actions">
          <Button size="small" aria-label="Tải lại" loading={loading} disabled={busy} onClick={() => void read()}>Tải lại</Button>
          {canStart && <Button type="primary" disabled={loading || busy} onClick={() => startAction({ kind: 'start' })}>
            Bắt đầu hợp tác
          </Button>}
          {canCancel && <Button danger disabled={loading || busy} onClick={() => startAction({ kind: 'cancel' })}>
            Hủy hợp tác
          </Button>}
          {canSendReview && <Button type="primary" disabled={loading || busy}
            onClick={() => startAction({ kind: 'review', outcomeRevision: acceptedOutcome.revision })}>
            Gửi đánh giá cuối
          </Button>}
          {canLegacyReview && <Button type="primary" disabled={loading || busy}
            onClick={() => startAction({ kind: 'legacyReview' })}>
            Đánh giá hợp tác cũ
          </Button>}
        </Space>
      </header>
      {['LEGACY', 'BRAND_LEGACY_PLAN'].includes(snapshot.executionSource) && <Alert showIcon type="info"
        title="Hợp tác lịch sử" description={snapshot.executionSource === 'BRAND_LEGACY_PLAN'
          ? 'Kế hoạch do Brand ghi lại từ điều khoản cũ.'
          : 'Các lần nộp, duyệt và nghiệm thu chỉ hiển thị khi có dữ liệu đã lưu.'} />}
      {brand && <nav className="collab-tabs-bar" aria-label="Mục chi tiết hợp tác">
        {tabs.map(item => <button key={item.value} type="button" aria-pressed={tab === item.value}
          className={'collab-tab-btn' + (tab === item.value ? ' active' : '')} onClick={() => setTab(item.value)}>
          {item.icon}{item.label}
        </button>)}
      </nav>}
      {brand && tab === 'progress' && <Card title="Tiến độ thực hiện">
        <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
          { key: 'approved', label: 'Ấn phẩm đã duyệt', children: ordered.length
            ? ordered.filter(unit => unit.status === 'APPROVED').length + '/' + ordered.length : '—' },
          { key: 'posted', label: 'Ấn phẩm đã có bài đăng', children: ordered.length ? publishedUnits.length + '/' + ordered.length : '—' },
          { key: 'deadline', label: 'Hạn nộp sớm nhất', children: formatDate(ordered[0]?.dueAt) },
        ]} />
        {planned && canReadDeal && !loading && <>
          {!snapshot.dealId && <p>Chưa có Deal liên kết để bắt đầu hợp tác.</p>}
          {snapshot.assignmentStatus === 'WAITING_FOR_VERIFICATION' && <p>Chờ Creator xác minh kênh.</p>}
          {snapshot.assignmentStatus === 'WAITING_FOR_ACCEPTANCE' && <p>Chờ Creator xác nhận điều khoản.</p>}
          {snapshot.assignmentStatus === 'NO_CONFIRMED_PROPOSAL' && <p>Hợp tác chưa có proposal đã chốt.</p>}
          {snapshot.assignmentStatus === 'READY' && snapshot.campaignStatus !== 'ACTIVE' && <p>Chờ chiến dịch hoạt động.</p>}
        </>}
        {canSetup &&
          <Button className="execution-actions" disabled={loading || busy}
            onClick={() => startAction({ kind: 'setup' })}>Ghi kế hoạch thực thi</Button>}
      </Card>}
      {(!brand || tab === 'review') && (
        !ordered.length ? <Card title="Ấn phẩm và lịch sử duyệt">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ấn phẩm" />
        </Card> : brand && selectedUnit ? <div className="collab-review-grid">
          <aside className="review-sidebar-card" aria-label="Danh sách ấn phẩm">
            <strong className="sidebar-header-title">Danh sách ấn phẩm</strong>
            <div className="deliverable-items-list">
              {ordered.map(unit => (
                <button key={unit.id} type="button"
                  className={'deliverable-card-item' + (unit.id === selectedUnit.id ? ' active' : '')}
                  aria-pressed={unit.id === selectedUnit.id} onClick={() => setSelectedUnitId(unit.id)}>
                  <span className="item-title-preview">{label(unit)}</span>
                  <span className="item-bottom-meta">
                    <span>{unit.submissionRevision > 0 ? 'Bản ' + unit.submissionRevision : 'Chưa có bản nháp'}</span>
                    <ColoredStatus style={unitStatuses[unit.status] ?? [unit.status, 'gray']} />
                  </span>
                </button>
              ))}
            </div>
          </aside>
          {renderDeliverable(selectedUnit, true)}
        </div> : <Card title="Ấn phẩm và lịch sử duyệt">
          <div className="execution-stack">{ordered.map(unit => renderDeliverable(unit, false))}</div>
        </Card>
      )}
      {(!brand || tab === 'kpi') && <>
        {reviewUnavailable && <Alert showIcon type="warning" title={reviewUnavailable} />}
        {legacyOutcome ? <Card title="Kết quả lịch sử">
          <Descriptions size="small" bordered column={{ xs: 1, sm: 2, lg: 3 }}
            title={<Tag>{legacyOutcome.source || 'Dữ liệu lịch sử'}</Tag>}
            items={[
              ...metrics.map(metric => ({ key: metric, label: metricLabels[metric], children: formatNumber(legacyOutcome[metric]) })),
              { key: 'time', label: 'Ghi nhận', children: formatDate(legacyOutcome.recordedAt) },
              { key: 'note', label: 'Ghi chú', children: legacyOutcome.resultNote || '—' },
              { key: 'link', label: 'Bài đăng', children: legacyOutcome.publishedContentUrl
                ? <HttpsLink url={legacyOutcome.publishedContentUrl}>Mở bài đăng</HttpsLink> : '—' },
            ]} />
        </Card> : <>
          <OutcomeTable snapshot={snapshot} latest={latest} label={label} />
          {brand && <FeesOverview snapshot={snapshot} latest={latest} />}
          {latest && <Card title={brand ? 'Tài chính & nghiệm thu' : 'Trạng thái nghiệm thu'}>
            {brand && <>
              <OutcomeFinance outcome={latest} />
              {ratios.some(ratio => latest.calculation[`${ratio}UnavailableReason`] === 'INCONSISTENT_MEASUREMENT_PERIOD') &&
                <Typography.Paragraph type="secondary">
                  Các tỷ số cần cùng kỳ đo cho bài đăng và tài chính. Điều kiện nghiệm thu được hiển thị riêng.
                </Typography.Paragraph>}
            </>}
            <p>{accepted?.outcomeRevision === latest.revision ? 'Đã nghiệm thu' : 'Chưa nghiệm thu'}</p>
            <AcceptanceHistory entries={snapshot.acceptances.filter(a => a.outcomeRevision === latest.revision)} />
            {latest.payload.resultNote && <p>{latest.payload.resultNote}</p>}
            {snapshot.status === 'AWAITING_REVIEW' && accepted && canRecord &&
              <Button disabled={loading} onClick={() => startAction({ kind: 'reopen', outcomeRevision: accepted.outcomeRevision })}>
                Mở lại nghiệm thu
              </Button>}
            {inProgress && canRecord && canSaveFinance && <Space wrap>
              <Button type={readiness?.costConfirmed ? 'default' : 'primary'}
                disabled={loading || busy} onClick={openFinance}>
                {readiness?.costConfirmed ? 'Sửa tài chính' : financeButtonLabel}
              </Button>
              {canAccept && <Button type="primary" disabled={loading || busy}
                onClick={() => startAction({ kind: 'accept', outcomeRevision: latest.revision })}>
                Nghiệm thu
              </Button>}
            </Space>}
          </Card>}
          {inProgress && brand && readiness && !canAccept && <Alert showIcon type="info" title="Cần bổ sung trước khi nghiệm thu"
            description={<ul className="collab-readiness-list">
              {readiness.issues.map(issue => <li key={issue.unit?.id ?? issue.message}>
                {issue.unit && <><strong>{label(issue.unit)}</strong><span> · </span></>}{issue.message}
              </li>)}
            </ul>} />}
          <OutcomeHistory snapshot={snapshot} brand={brand} label={label} />
        </>}
      </>}
      {brand && snapshot.review && tab === 'kpi' && <Card title="Đánh giá cuối">
        <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
          { key: 'overall', label: 'Điểm tổng thể', children: `${snapshot.review.overallRating}/5` },
          { key: 'fit', label: 'Độ phù hợp', children: `${snapshot.review.brandFitRating}/5` },
          { key: 'again', label: 'Hợp tác lại', children: snapshot.review.wouldCollaborateAgain ? 'Có' : 'Không' },
          { key: 'date', label: 'Ngày đánh giá', children: formatDate(snapshot.review.reviewedAt) },
          { key: 'source', label: 'Nguồn', children: snapshot.review.acceptedOutcomeRevision
            ? `Kết quả đã nghiệm thu · Phiên bản ${snapshot.review.acceptedOutcomeRevision}` : 'Dữ liệu lịch sử' },
          { key: 'note', label: 'Ghi chú', children: snapshot.review.note || '—' },
          { key: 'tags', label: 'Nhãn', children: snapshot.review.reviewTags?.map(tag => <Tag key={tag}>{tag}</Tag>) },
        ]} />
      </Card>}
    </>}
    {action && <Modal open title={action.kind === 'finance' ? 'Ghi nhận chi phí thực tế'
      : action.kind === 'outcome' ? (action.editing ? 'Chỉnh sửa kết quả bài đăng' : 'Nhập kết quả bài đăng') : actionLabels[action.kind]}
      okText={actionLabels[action.kind]} cancelText="Đóng"
      onCancel={closeAction} confirmLoading={busy}
      okButtonProps={{ htmlType: 'submit', form: 'collaboration-execution-form', disabled: !allowed || conflict || loading }} cancelButtonProps={{ disabled: busy }}
      closable={!busy} mask={{ closable: !busy }} keyboard={!busy}
      width={['outcome', 'finance', 'setup'].includes(action.kind) ? 780 : 540}>
      <Form<ActionValues> id="collaboration-execution-form" layout="vertical" onFinish={submit} disabled={busy}
        onKeyDown={event => {
          if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault();
        }}
        initialValues={action.kind === 'outcome' && action.unit ? initialOutcome(measurementFor(latest?.payload, action.unit))
          : action.kind === 'finance' ? initialFinance(latest?.payload) : undefined}>
        {failure && <Alert showIcon type={conflict ? 'warning' : 'error'} title={failure}
          description={conflict ? 'Nội dung đang nhập được giữ lại. Tải bản mới và đối chiếu trước khi gửi lại.' : undefined}
          action={conflict ? <Button loading={loading} onClick={async () => {
            if (await read()) {
              setConflict(false);
              setFailure('');
              setRefreshed(true);
              attempt.current = null;
            }
          }}>Tải bản mới</Button> : undefined} />}
        {refreshed && <Alert showIcon type={allowed ? 'info' : 'warning'} title={allowed
          ? `Đã tải phiên bản thực thi ${snapshot?.executionRevision}. Kiểm tra nội dung trước khi gửi lại.`
          : 'Bản nộp hoặc trạng thái đã thay đổi. Hãy đối chiếu chi tiết trước khi mở lại thao tác.'} />}
        {action.kind === 'start' && <p>Chuyển hợp tác sang đang thực hiện để bắt đầu nhận bản nháp.</p>}
        {action.kind === 'setup' && <LegacyPlanFields channels={channels} />}
        {['cancel', 'changes', 'exception', 'reopen'].includes(action.kind) && (
          <Form.Item name="reason" label="Lý do" rules={[requiredText]}><Input.TextArea maxLength={action.kind === 'cancel' ? 1000 : 2000} /></Form.Item>
        )}
        {['submit', 'publish'].includes(action.kind) && (
          <Form.Item name="url" label={action.kind === 'submit' ? 'Link bản nháp' : 'Link bài đăng'} rules={[requiredText, httpsRule]}>
            <Input maxLength={2000} placeholder="https://…" />
          </Form.Item>
        )}
        {action.kind === 'exception' && action.unit && currentPublication(action.unit) && (
          <HttpsLink url={currentPublication(action.unit)!.url}>Mở bài đăng</HttpsLink>
        )}
        {action.kind === 'approve' && <Form.Item name="checklist" label="Checklist đã đạt"
          rules={[required, { validator: async (_, value?: string[]) => {
            if (value?.length !== reviewUnit?.acceptanceChecklist.length) throw new Error('Xác nhận tất cả mục trong checklist.');
          } }]}>
          <Select mode="multiple" options={reviewUnit?.acceptanceChecklist.map(item => ({ value: item, label: item }))} />
        </Form.Item>}
        {action.kind === 'publish' && reviewUnit?.status !== 'APPROVED' && <Alert type="warning" showIcon
          title="Bài đăng sẽ được ghi là đăng trước khi duyệt." />}
        {action.kind === 'outcome' && action.unit && <OutcomeFields unit={action.unit} label={label(action.unit)} editing={!!action.editing} />}
        {action.kind === 'finance' && <FinanceFields editing={!!action.editing} />}
        {action.kind === 'accept' && <p>Nghiệm thu kết quả phiên bản {action.outcomeRevision} và chuyển sang chờ đánh giá cuối.</p>}
        {action.kind === 'review' && <p>Kết quả đã nghiệm thu · Phiên bản {action.outcomeRevision}</p>}
        {['review', 'legacyReview'].includes(action.kind) && <ReviewFields />}
      </Form>
    </Modal>}
  </div>;
}
