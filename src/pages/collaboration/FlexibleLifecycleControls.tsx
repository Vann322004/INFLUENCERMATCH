import { Alert, App, Button, Collapse, DatePicker, Form, Input, Modal, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useRef, useState, type ReactNode } from 'react';
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

type Action = 'management-mode' | 'complete-without-review' | 'terminate' | 'terminate-external'
  | 'withdraw-termination' | 'termination-requests' | 'termination-requests/decline';
const titles: Record<Action, string> = {
  'management-mode': 'Chọn phương thức quản lý',
  'complete-without-review': 'Hoàn tất không đánh giá?',
  terminate: 'Đồng ý kết thúc hợp tác?',
  'terminate-external': 'Ghi nhận đồng thuận dừng bên ngoài',
  'termination-requests': 'Đề nghị dừng hợp tác',
  'termination-requests/decline': 'Từ chối yêu cầu dừng',
  'withdraw-termination': 'Rút đề nghị dừng hợp tác?',
};

const resolutionLabels: Record<string, string> = {
  DECLINED: 'Đã từ chối yêu cầu dừng',
  TERMINATED: 'Hai bên đồng thuận trên hệ thống',
  WITHDRAWN: 'Người đề nghị đã rút yêu cầu',
  TERMINATED_EXTERNAL: 'Brand ghi nhận đồng thuận ngoài hệ thống',
};
const exitLabels = {
  DECLINED: 'Đã từ chối',
  TERMINATED: 'Hai bên đã đồng ý trên hệ thống',
  TERMINATED_EXTERNAL: 'Đã ghi nhận đồng thuận dừng bên ngoài',
  WITHDRAWN: 'Đã rút',
};

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

  function canSave(current: Target): boolean {
    switch (current.action) {
      case 'management-mode': return canChooseMode;
      case 'complete-without-review':
        return canComplete && current.acceptanceId === accepted?.id && current.outcomeRevision === accepted?.outcomeRevision;
      case 'termination-requests': return active && participate && !pending;
      case 'terminate-external': return canTerminateExternal && current.requestId === pending?.id;
      case 'withdraw-termination': return canWithdraw && current.requestId === pending?.id;
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
    if (target.action === 'withdraw-termination') {
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
      let updated: ExecutionSnapshot;
      if (target.action === 'withdraw-termination') {
        const requestId = target.requestId;
        if (!requestId) throw new Error('Không tìm thấy yêu cầu dừng cần rút.');
        updated = await collaborationService.withdrawTermination(
          snapshot.id, requestId, snapshot.executionRevision, attempt.current.key);
      } else {
        updated = await collaborationService.flexibleAction(snapshot.id, path, body, attempt.current.key);
      }
      onChanged(updated);
      setTarget(undefined);
      message.success(target.action === 'terminate-external'
        ? 'Đã ghi nhận thỏa thuận dừng ngoài hệ thống.'
        : target.action === 'withdraw-termination' ? 'Đã rút đề nghị dừng.' : 'Đã lưu thay đổi.');
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

  const hasActions = canChooseMode || !!reviewAction || canComplete
    || (active && participate && !pending) || canTerminateExternal;

  return <section className="execution-stack collab-lifecycle-bar">
    {hasActions && (
      <div className="collab-lifecycle-row">
        <span className="collab-lifecycle-hint">Tùy chọn hợp tác</span>
        <Space wrap size={8}>
          {canChooseMode && <Button size="small" onClick={() => open('management-mode')}>Đổi phương thức quản lý</Button>}
          {reviewAction}
          {canComplete && <Button size="small" onClick={() => open('complete-without-review')}>Hoàn tất không đánh giá</Button>}
          {active && participate && !pending && <Button size="small" danger onClick={() => open('termination-requests')}>
            {canTerminateExternal ? 'Đề nghị dừng trên hệ thống' : 'Đề nghị dừng hợp tác'}
          </Button>}
          {canTerminateExternal && <Button size="small" danger onClick={() => open('terminate-external')}>Ghi nhận thỏa thuận dừng bên ngoài</Button>}
        </Space>
      </div>
    )}
    {pending && <Alert type="warning" showIcon title="Đang chờ bên còn lại phản hồi đề nghị dừng"
      description={(pending.requestedByRole === 'BRAND' ? 'Brand đề nghị · ' : 'Creator đề nghị · ') + pending.reason}
      action={canResolve ? <Space wrap>
        <Button danger onClick={() => open('terminate')}>Đồng ý kết thúc</Button>
        <Button onClick={() => open('termination-requests/decline')}>Từ chối yêu cầu</Button>
      </Space> : canWithdraw ? <Button onClick={() => open('withdraw-termination')}>Rút đề nghị dừng</Button> : undefined} />}
    {snapshot.status === 'TERMINATED' && <Alert type="warning" showIcon title="Hợp tác đã kết thúc giữa chừng"
      description={<Space orientation="vertical" size={4}>
        <Typography.Text>{snapshot.terminationMethod === 'BRAND_EXTERNAL'
          ? 'Nguồn: Brand ghi nhận đồng thuận ngoài hệ thống'
          : snapshot.terminationMethod === 'PORTAL' ? 'Nguồn: Hai bên đồng thuận trên Portal'
            : 'Nguồn đồng thuận chưa được cung cấp'}</Typography.Text>
        <Typography.Text>{snapshot.terminationReason} · Ghi nhận lúc {formatDate(snapshot.terminatedAt)}</Typography.Text>
        {snapshot.terminationMethod === 'BRAND_EXTERNAL' && snapshot.terminationAgreedAt
          && <Typography.Text>Hai bên đồng ý lúc {formatDate(snapshot.terminationAgreedAt)}</Typography.Text>}
        {snapshot.terminationEvidence && <HttpsLink url={snapshot.terminationEvidence}>Xem bằng chứng</HttpsLink>}
        <Typography.Text type="secondary">Công việc và chi phí đã ghi nhận được giữ lại; không xác nhận đã thanh toán.</Typography.Text>
      </Space>} />}
    {snapshot.completionMethod === 'WITHOUT_REVIEW' && <Alert type="success" title="Đã hoàn tất không có đánh giá Creator" />}
    {!!snapshot.exitRequests?.length && <Collapse size="small" items={[{ key: 'exit-history', label: 'Lịch sử yêu cầu dừng',
      children: snapshot.exitRequests.map(row => <p key={row.id}>{formatDate(row.createdAt)} · {row.requestedByRole === 'BRAND'
        ? 'Brand đề nghị' : 'Creator đề nghị'}: {row.reason} · {row.resolution
        ? resolutionLabels[row.resolution] ?? exitLabels[row.resolution] ?? 'Đã xử lý; trạng thái chưa được hỗ trợ'
        : row.resolvedAt ? 'Đã xử lý; chưa có kết quả chi tiết' : 'Chờ bên còn lại phản hồi'}
        {row.resolvedAt ? ` · Xử lý lúc ${formatDate(row.resolvedAt)}` : ''}
        {row.resolutionReason ? ` · ${row.resolutionReason}` : ''}</p>) }]} />}
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
          : action === 'withdraw-termination' ? <p>Rút đề nghị đang chờ phản hồi. Hợp tác tiếp tục theo trạng thái hiện tại.</p>
            : <>
              <Form.Item name="reason" label={reasonLabel} rules={[requiredText]}><Input.TextArea maxLength={2000} /></Form.Item>
              {external && <Form.Item name="agreedAt" label="Thời điểm hai bên đồng thuận" rules={[
                { required: true, message: 'Chọn thời điểm đã đạt thỏa thuận.' },
                { validator: async (_, value?: Dayjs) => {
                  if (value && (!value.isValid() || value.isAfter(dayjs())))
                    throw new Error('Thời điểm đồng ý không được ở tương lai.');
                } },
              ]}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }}
                  placeholder="Chọn ngày và giờ" />
              </Form.Item>}
              <Form.Item name="evidenceUrl" label={external ? 'Link bằng chứng đồng thuận' : 'Link bằng chứng (tùy chọn)'}
                rules={external ? [requiredText, httpsRule] : [httpsRule]}><Input placeholder="https://…" maxLength={2000} /></Form.Item>
              <Typography.Paragraph type="secondary">
                {external
                  ? 'Brand ghi nhận đồng thuận dựa trên bằng chứng bên ngoài. Đây không phải xác nhận trực tiếp của Creator trên Portal; chưa phản hồi không được xem là đồng ý.'
                  : action === 'termination-requests'
                    ? 'Đề nghị chỉ có hiệu lực khi bên còn lại đồng ý. Không có phản hồi không được xem là đồng ý.'
                    : 'Kết thúc chỉ được ghi nhận sau khi bên còn lại đồng ý; công việc, chi phí và trạng thái thanh toán đã lưu được giữ nguyên.'}
              </Typography.Paragraph>
            </>}
        <Space wrap>
          <Button disabled={busy} onClick={() => setTarget(undefined)}>Đóng</Button>
          <Button disabled={conflict || !canSave(target)} type="primary"
            danger={terminate || external || action === 'termination-requests'}
            htmlType="submit" loading={busy}>{action === 'termination-requests' ? 'Gửi đề nghị' : terminate ? 'Đồng ý kết thúc' : 'Xác nhận'}</Button>
        </Space>
      </Form>}
    </Modal>
  </section>;
}
