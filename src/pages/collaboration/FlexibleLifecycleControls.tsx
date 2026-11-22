import { Alert, App, Button, Collapse, DatePicker, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { useRef, useState, type ReactNode } from 'react';
import type { Dayjs } from 'dayjs';
import axios from 'axios';
import type { ExecutionSnapshot } from '../../types/api/collaboration.types';
import { collaborationService } from '../../services/api/collaborationService';
import { getErrorMessage, getStoredUser } from '../../services/apiClient';
import { formatDate, httpsRule, requiredText } from './ExecutionForms';
import { HttpsLink } from './OperationsTables';

const modeOptions = [
  { value: 'COLLABORATIVE', label: 'Cùng Nhà sáng tạo thực hiện' },
  { value: 'BRAND_MANAGED', label: 'Tôi quản lý công việc bên ngoài' },
] as const;

const titles = {
  'management-mode': 'Chọn phương thức quản lý',
  'complete-without-review': 'Hoàn tất không đánh giá?',
  terminate: 'Đồng ý kết thúc hợp tác?',
  'terminate-external': 'Ghi nhận đồng thuận dừng bên ngoài',
  'termination-requests': 'Đề nghị dừng hợp tác',
  'termination-requests/decline': 'Từ chối yêu cầu dừng',
  withdraw: 'Rút đề nghị dừng?',
};

const exitLabels = {
  DECLINED: 'Đã từ chối',
  TERMINATED: 'Hai bên đã đồng ý trên Portal',
  TERMINATED_EXTERNAL: 'Đã ghi nhận đồng thuận dừng bên ngoài',
  WITHDRAWN: 'Đã rút',
};

type Action = keyof typeof titles;
type Target = { action: Action; requestId?: string; acceptanceId?: string; outcomeRevision?: number };
type ExitForm = { reason?: string; evidenceUrl?: string; agreedAt?: Dayjs };

export function FlexibleLifecycleControls({ snapshot, brand, permissions, onChanged, reviewAction }: {
  snapshot: ExecutionSnapshot;
  brand: boolean;
  permissions: ReadonlySet<string>;
  onChanged: (snapshot: ExecutionSnapshot) => void;
  reviewAction?: ReactNode;
}) {
  const { message } = App.useApp();
  const [target, setTarget] = useState<Target>();
  const [mode, setMode] = useState(snapshot.managementMode || 'COLLABORATIVE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const lock = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const manage = brand && permissions.has('MANAGE_OWN_COLLABORATION');
  const participate = brand ? manage : permissions.has('RESPOND_OWN_COOPERATION');
  const active = snapshot.status === 'IN_PROGRESS' && snapshot.campaignStatus === 'ACTIVE';
  const pending = snapshot.exitRequests?.find(row => !row.resolvedAt);
  const accepted = snapshot.acceptances.find(row => !row.reopenedAt);
  const canResolve = active && participate && !!pending && pending.requestedByRole !== (brand ? 'BRAND' : 'CREATOR');
  const canWithdraw = active && participate && !!pending && pending.requestedBy === getStoredUser()?.id;
  const canTerminateExternal = active && manage && snapshot.managementMode === 'BRAND_MANAGED';
  const canChooseMode = manage && snapshot.status === 'PLANNED';
  const canComplete = manage && permissions.has('RECORD_OWN_OUTCOME') && snapshot.status === 'AWAITING_REVIEW' && !!accepted;
  const action = target?.action;

  function open(next: Action) {
    setMode(snapshot.managementMode || 'COLLABORATIVE');
    setConflict(false);
    setRefreshed(false);
    setError('');
    attempt.current = null;
    setTarget({ action: next, requestId: pending?.id, acceptanceId: accepted?.id, outcomeRevision: accepted?.outcomeRevision });
  }

  function canSave(current: Target) {
    switch (current.action) {
      case 'management-mode': return canChooseMode;
      case 'complete-without-review':
        return canComplete && current.acceptanceId === accepted?.id && current.outcomeRevision === accepted?.outcomeRevision;
      case 'termination-requests': return active && participate && !pending;
      case 'terminate-external': return canTerminateExternal && current.requestId === pending?.id;
      case 'withdraw': return canWithdraw && current.requestId === pending?.id;
      case 'terminate':
      case 'termination-requests/decline': return canResolve && current.requestId === pending?.id;
    }
  }

  async function save(values: ExitForm) {
    if (!target || lock.current || conflict || !canSave(target)) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const revision = { expectedRevision: snapshot.executionRevision };
    const exit = { ...revision, reason: values.reason?.trim(), evidenceUrl: values.evidenceUrl?.trim() || undefined };
    let body: object = revision;
    let path: Parameters<typeof collaborationService.flexibleAction>[1];
    if (target.action === 'withdraw') {
      path = ('termination-requests/' + target.requestId + '/withdraw') as typeof path;
    } else {
      path = target.action;
      switch (target.action) {
        case 'management-mode': body = { ...revision, managementMode: mode }; break;
        case 'complete-without-review': body = { ...revision, outcomeRevision: target.outcomeRevision }; break;
        case 'terminate-external': body = { ...exit, agreedAt: values.agreedAt?.toISOString() }; break;
        case 'termination-requests': body = exit; break;
        case 'terminate':
        case 'termination-requests/decline': body = { ...exit, requestId: target.requestId }; break;
      }
    }
    const fingerprint = JSON.stringify({ path, body });
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    try {
      onChanged(await collaborationService.flexibleAction(snapshot.id, path, body, attempt.current.key));
      setTarget(undefined);
      message.success('Đã lưu thay đổi.');
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không lưu được thay đổi.'));
      setConflict(axios.isAxiosError(reason) && reason.response?.status === 409);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  async function refresh() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      onChanged(await collaborationService.execution(snapshot.id));
      setConflict(false);
      setRefreshed(true);
      setError('');
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không tải được phiên bản mới.'));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  const reasonLabel = action === 'termination-requests' ? 'Lý do đề nghị'
    : action === 'terminate' ? 'Ghi chú đồng ý' : action === 'terminate-external' ? 'Lý do kết thúc' : 'Lý do từ chối';
  const external = action === 'terminate-external';
  const terminate = action === 'terminate';

  return <section className="execution-stack">
    <Space wrap>
      <Typography.Text type="secondary">{snapshot.managementMode === 'BRAND_MANAGED'
        ? 'Brand quản lý công việc bên ngoài' : 'Cùng Nhà sáng tạo thực hiện'}</Typography.Text>
      {canChooseMode && <Button onClick={() => open('management-mode')}>Chọn phương thức quản lý</Button>}
      {reviewAction}
      {canComplete && <Button onClick={() => open('complete-without-review')}>Hoàn tất không đánh giá</Button>}
      {active && participate && !pending && <Button danger onClick={() => open('termination-requests')}>Đề nghị dừng hợp tác</Button>}
      {canTerminateExternal && <Button danger onClick={() => open('terminate-external')}>Ghi nhận đồng thuận dừng bên ngoài</Button>}
    </Space>
    {pending && <Alert type="warning" showIcon title="Đang chờ bên còn lại phản hồi đề nghị dừng"
      description={(pending.requestedByRole === 'BRAND' ? 'Brand đề nghị · ' : 'Creator đề nghị · ') + pending.reason}
      action={canResolve ? <Space wrap>
        <Button danger onClick={() => open('terminate')}>Đồng ý kết thúc</Button>
        <Button onClick={() => open('termination-requests/decline')}>Từ chối yêu cầu</Button>
      </Space> : canWithdraw ? <Button onClick={() => open('withdraw')}>Rút đề nghị dừng</Button> : undefined} />}
    {snapshot.status === 'TERMINATED' && <Alert type="warning" showIcon title="Hợp tác đã kết thúc giữa chừng"
      description={<Space orientation="vertical" size={4}>
        <span>{snapshot.terminationReason} · Ghi nhận {formatDate(snapshot.terminatedAt)}</span>
        {snapshot.terminationMethod === 'BRAND_EXTERNAL' && <span>Brand ghi nhận đồng thuận bên ngoài · {formatDate(snapshot.terminationAgreedAt)}</span>}
        {snapshot.terminationEvidence && <HttpsLink url={snapshot.terminationEvidence}>Xem bằng chứng</HttpsLink>}
        <span>Công việc, chi phí và trạng thái thanh toán được giữ lại.</span>
      </Space>} />}
    {snapshot.completionMethod === 'WITHOUT_REVIEW' && <Alert type="success" title="Đã hoàn tất không có đánh giá Creator" />}
    {!!snapshot.exitRequests?.length && <Collapse size="small" items={[{ key: 'exit-history', label: 'Lịch sử yêu cầu dừng',
      children: snapshot.exitRequests.map(row => <p key={row.id}>{formatDate(row.createdAt)} · {row.requestedByRole === 'BRAND'
        ? 'Brand đề nghị' : 'Creator đề nghị'} · {row.reason} · {row.resolution ? exitLabels[row.resolution]
        : 'Chờ bên còn lại phản hồi'}{row.resolutionReason && <> · {row.resolutionReason}</>}</p>) }]} />}
    <Modal open={!!action} title={action && titles[action]} destroyOnHidden footer={null}
      onCancel={() => !busy && setTarget(undefined)} closable={!busy} mask={{ closable: !busy }}>
      {target && <Form key={action} layout="vertical" onFinish={save} disabled={busy}>
        {error && <Alert type={conflict ? 'warning' : 'error'} showIcon title={error}
          action={conflict ? <Button onClick={() => void refresh()}>Tải phiên bản mới</Button> : undefined} />}
        {!canSave(target) ? <Alert type="warning" title="Đối tượng xác nhận đã thay đổi. Hãy đóng hộp thoại và xem bản mới." />
          : refreshed && <Alert type="info" title="Đã tải phiên bản mới. Kiểm tra nội dung trước khi gửi lại." />}
        {action === 'management-mode' ? <Form.Item label="Phương thức quản lý">
          <Select value={mode} onChange={setMode} options={[...modeOptions]} />
        </Form.Item> : action === 'complete-without-review' ? <p>Hoàn tất theo kết quả đã nghiệm thu, phiên bản {target.outcomeRevision}.</p>
          : action === 'withdraw' ? <p>Đề nghị sẽ hiện là Đã rút trong lịch sử. Hợp tác tiếp tục thực hiện.</p>
            : <>
              <Form.Item name="reason" label={reasonLabel} rules={[requiredText]}><Input.TextArea maxLength={2000} /></Form.Item>
              {external && <Form.Item name="agreedAt" label="Thời điểm hai bên đồng thuận" rules={[{ required: true }]}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" />
              </Form.Item>}
              <Form.Item name="evidenceUrl" label={external ? 'Link bằng chứng đồng thuận' : 'Link bằng chứng (tùy chọn)'}
                rules={external ? [requiredText, httpsRule] : [httpsRule]}><Input placeholder="https://…" maxLength={2000} /></Form.Item>
              {action === 'termination-requests' && <Typography.Paragraph type="secondary">
                Đề nghị có hiệu lực khi bên còn lại đồng ý.
              </Typography.Paragraph>}
            </>}
        <Space>
          <Button disabled={busy} onClick={() => setTarget(undefined)}>Đóng</Button>
          <Button disabled={conflict || !canSave(target)} type="primary" danger={terminate || external}
            htmlType="submit" loading={busy}>{action === 'termination-requests' ? 'Gửi đề nghị' : terminate ? 'Đồng ý kết thúc' : 'Xác nhận'}</Button>
        </Space>
      </Form>}
    </Modal>
  </section>;
}
