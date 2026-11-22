import { Alert, App, Button, Collapse, DatePicker, Form, Input, Modal, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useRef, useState } from 'react';
import type { ExecutionSnapshot } from '../../types/api/collaboration.types';
import { collaborationService } from '../../services/api/collaborationService';
import { getErrorMessage } from '../../services/apiClient';
import axios from 'axios';
import { formatDate, httpsRule, requiredText } from './ExecutionForms';

type Action = 'management-mode' | 'complete-without-review' | 'terminate' | 'terminate-external' | 'withdraw-termination' | 'termination-requests' | 'termination-requests/decline';
const resolutionLabels: Record<string, string> = {
  DECLINED: 'Đã từ chối yêu cầu dừng',
  TERMINATED: 'Hai bên đồng thuận trên Portal',
  WITHDRAWN: 'Người đề nghị đã rút yêu cầu',
  TERMINATED_EXTERNAL: 'Brand ghi nhận đồng thuận ngoài hệ thống',
};
function evidenceLink(value?: string) {
  try { const url = new URL(value ?? ''); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
}
export function FlexibleLifecycleControls({ snapshot: s, brand, permissions, onChanged }: {
  snapshot: ExecutionSnapshot; brand: boolean; permissions: ReadonlySet<string>; onChanged: (s: ExecutionSnapshot) => void;
}) {
  const { message } = App.useApp();
  const [action, setAction] = useState<Action>();
  const [mode, setMode] = useState(s.managementMode || 'COLLABORATIVE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const lock = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const manage = brand && permissions.has('MANAGE_OWN_COLLABORATION');
  const pending = s.exitRequests?.find(row => !row.resolvedAt);
  const actorRole = brand ? 'BRAND' : 'CREATOR';
  const canParticipate = manage || !brand && permissions.has('RESPOND_OWN_COOPERATION');
  const inProgress = s.status === 'IN_PROGRESS' && s.campaignStatus === 'ACTIVE';
  const canResolvePending = Boolean(canParticipate && pending && pending.requestedByRole !== actorRole);
  const canWithdraw = Boolean(canParticipate && pending && pending.requestedByRole === actorRole);
  const canTerminateExternal = manage && s.managementMode === 'BRAND_MANAGED' && inProgress;
  const titles: Record<Action, string> = {
    'management-mode': 'Chọn phương thức quản lý', 'complete-without-review': 'Hoàn tất không đánh giá?',
    terminate: 'Đồng ý kết thúc hợp tác?', 'termination-requests': 'Đề nghị dừng hợp tác',
    'termination-requests/decline': 'Từ chối yêu cầu dừng',
    'terminate-external': 'Ghi nhận thỏa thuận dừng bên ngoài',
    'withdraw-termination': 'Rút đề nghị dừng hợp tác?',
  };
  function open(next: Action) { setMode(s.managementMode || 'COLLABORATIVE'); setConflict(false); setError(''); attempt.current = null; setAction(next); }
  const validAction = !action || (action === 'management-mode' ? manage && s.status === 'PLANNED'
    : action === 'complete-without-review' ? manage && permissions.has('RECORD_OWN_OUTCOME') && s.status === 'AWAITING_REVIEW'
      : action === 'terminate-external' ? canTerminateExternal
        : inProgress && (action === 'termination-requests' ? canParticipate && !pending : action === 'withdraw-termination' ? canWithdraw : canResolvePending));
  async function save(values: { reason?: string; evidenceUrl?: string; agreedAt?: Dayjs }) {
    if (!action || lock.current || conflict || !validAction) return;
    lock.current = true; setBusy(true); setError('');
    const body = { expectedRevision: s.executionRevision,
      ...(action === 'management-mode' ? { managementMode: mode }
        : action === 'complete-without-review' ? { outcomeRevision: s.acceptances.find(a => !a.reopenedAt)?.outcomeRevision }
          : action === 'withdraw-termination' ? {}
          : action === 'terminate-external' ? { reason: values.reason?.trim(), evidenceUrl: values.evidenceUrl?.trim(), agreedAt: values.agreedAt?.toISOString() }
          : { reason: values.reason?.trim(), evidenceUrl: values.evidenceUrl?.trim() || undefined,
            requestId: action === 'termination-requests' ? undefined : pending?.id }) };
    const fingerprint = JSON.stringify({ action, body, requestId: pending?.id });
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    try {
      onChanged(action === 'withdraw-termination'
        ? await collaborationService.withdrawTermination(s.id, pending!.id, s.executionRevision, attempt.current.key)
        : await collaborationService.flexibleAction(s.id, action, body, attempt.current.key));
      setAction(undefined); message.success(action === 'terminate-external' ? 'Đã ghi nhận thỏa thuận dừng ngoài hệ thống.' : action === 'withdraw-termination' ? 'Đã rút đề nghị dừng.' : 'Đã lưu thay đổi.');
    } catch (reason) { setError(getErrorMessage(reason, 'Không lưu được thay đổi.'));
      setConflict(axios.isAxiosError(reason) && reason.response?.status === 409); }
    finally { setBusy(false); lock.current = false; }
  }
  return <section className="execution-stack">
    <Space wrap>
      <Typography.Text type="secondary">{s.managementMode === 'BRAND_MANAGED' ? 'Brand quản lý công việc bên ngoài' : 'Cùng Nhà sáng tạo thực hiện'}</Typography.Text>
      {manage && s.status === 'PLANNED' && <Button onClick={() => open('management-mode')}>Chọn phương thức quản lý</Button>}
      {manage && permissions.has('RECORD_OWN_OUTCOME') && s.status === 'AWAITING_REVIEW'
        && <Button onClick={() => open('complete-without-review')}>Hoàn tất không đánh giá</Button>}
      {inProgress && canParticipate && !pending
        && <Button danger onClick={() => open('termination-requests')}>{canTerminateExternal ? 'Đề nghị dừng trên Portal' : 'Đề nghị dừng hợp tác'}</Button>}
      {canTerminateExternal && <Button danger onClick={() => open('terminate-external')}>Ghi nhận thỏa thuận dừng bên ngoài</Button>}
    </Space>
    {pending && <Alert type="warning" showIcon title="Đang chờ bên còn lại phản hồi đề nghị dừng"
      description={`${pending.requestedByRole === 'BRAND' ? 'Brand đề nghị' : 'Creator đề nghị'}: ${pending.reason}`}
      action={inProgress && (canResolvePending || canWithdraw) ? <Space wrap>
        {canResolvePending && <>
        <Button danger onClick={() => open('terminate')}>Đồng ý kết thúc</Button>
        <Button onClick={() => open('termination-requests/decline')}>Từ chối yêu cầu</Button>
        </>}
        {canWithdraw && <Button onClick={() => open('withdraw-termination')}>Rút đề nghị</Button>}
      </Space> : undefined} />}
    {s.status === 'TERMINATED' && <Alert type="warning" showIcon title="Hợp tác đã kết thúc giữa chừng"
      description={<Space orientation="vertical" size="small">
        <Typography.Text>{s.terminationMethod === 'BRAND_EXTERNAL' ? 'Nguồn: Brand ghi nhận đồng thuận ngoài hệ thống' : s.terminationMethod === 'PORTAL' ? 'Nguồn: Hai bên đồng thuận trên Portal' : 'Nguồn đồng thuận chưa được cung cấp'}</Typography.Text>
        <Typography.Text>{s.terminationReason} · Ghi nhận lúc {formatDate(s.terminatedAt)}</Typography.Text>
        {s.terminationMethod === 'BRAND_EXTERNAL' && s.terminationAgreedAt && <Typography.Text>Hai bên đồng ý lúc {formatDate(s.terminationAgreedAt)}</Typography.Text>}
        {evidenceLink(s.terminationEvidence) && <a href={evidenceLink(s.terminationEvidence)} target="_blank" rel="noopener noreferrer">Xem bằng chứng</a>}
        <Typography.Text type="secondary">Công việc và chi phí đã ghi nhận được giữ lại; không xác nhận đã thanh toán.</Typography.Text>
      </Space>} />}
    {s.completionMethod === 'WITHOUT_REVIEW' && <Alert type="success" title="Đã hoàn tất không có đánh giá Creator" />}
    {!!s.exitRequests?.length && <Collapse size="small" items={[{ key: 'exit-history', label: 'Lịch sử yêu cầu dừng',
      children: s.exitRequests.map(row => <p key={row.id}>{formatDate(row.createdAt)} · {row.requestedByRole === 'BRAND' ? 'Brand đề nghị' : 'Creator đề nghị'}: {row.reason} · {row.resolution ? resolutionLabels[row.resolution] ?? 'Đã xử lý; trạng thái chưa được hỗ trợ' : row.resolvedAt ? 'Đã xử lý; chưa có kết quả chi tiết' : 'Chờ bên còn lại phản hồi'}{row.resolvedAt ? ` · Xử lý lúc ${formatDate(row.resolvedAt)}` : ''}{row.resolutionReason ? ` · ${row.resolutionReason}` : ''}</p>) }]} />}
    <Modal open={!!action} title={action && titles[action]} destroyOnHidden footer={null}
      onCancel={() => !busy && setAction(undefined)} closable={!busy} mask={{ closable: !busy }}>
      {action && <Form key={action} layout="vertical" onFinish={save} disabled={busy}>
        {error && <Alert type={conflict ? 'warning' : 'error'} showIcon title={error}
          action={conflict ? <Button onClick={async () => {
            if (lock.current) return;
            lock.current = true; setBusy(true);
            try { onChanged(await collaborationService.execution(s.id)); setConflict(false); setError(''); }
            catch (reason) { setError(getErrorMessage(reason, 'Không tải được phiên bản mới.')); }
            finally { lock.current = false; setBusy(false); }
          }}>Tải phiên bản mới</Button> : undefined} />}
        {!validAction && <Alert type="warning" title="Trạng thái đã thay đổi. Hãy đóng và kiểm tra hành động tiếp theo." />}
        {action === 'management-mode' ? <Form.Item label="Phương thức quản lý"><Select value={mode} onChange={setMode}
          options={[{ value: 'COLLABORATIVE', label: 'Cùng Nhà sáng tạo thực hiện' }, { value: 'BRAND_MANAGED', label: 'Tôi quản lý công việc bên ngoài' }]} /></Form.Item>
          : action === 'complete-without-review' ? <p>Kết quả đã nghiệm thu sẽ được giữ nguyên. Hệ thống không tạo điểm đánh giá thay bạn.</p>
          : action === 'withdraw-termination' ? <p>Rút đề nghị đang chờ phản hồi. Hợp tác tiếp tục theo trạng thái hiện tại.</p>
          : <><Form.Item name="reason" label={action === 'terminate-external' ? 'Lý do hai bên đồng ý dừng' : action === 'termination-requests' ? 'Lý do đề nghị' : action === 'terminate' ? 'Ghi chú đồng ý' : 'Lý do từ chối'} rules={[requiredText]}><Input.TextArea rows={3} maxLength={2000} /></Form.Item>
            {action === 'terminate-external' && <Form.Item name="agreedAt" label="Thời điểm hai bên đồng ý" rules={[{ required: true, message: 'Chọn thời điểm đã đạt thỏa thuận.' }, { validator: async (_, value?: Dayjs) => {
              if (value && (!value.isValid() || value.isAfter(dayjs()))) throw new Error('Thời điểm đồng ý không được ở tương lai.');
            } }]}><DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} placeholder="Chọn ngày và giờ" /></Form.Item>}
            <Form.Item name="evidenceUrl" label={action === 'terminate-external' ? 'Link bằng chứng đồng thuận (HTTPS)' : 'Link bằng chứng (tùy chọn)'} rules={action === 'terminate-external' ? [requiredText, httpsRule] : [httpsRule]}><Input placeholder="https://…" maxLength={2000} /></Form.Item>
            <Typography.Paragraph type="secondary">
              {action === 'terminate-external' ? 'Brand ghi nhận đồng thuận dựa trên bằng chứng bên ngoài. Đây không phải xác nhận trực tiếp của Creator trên Portal; chưa phản hồi không được xem là đồng ý.' : action === 'termination-requests'
                ? 'Đề nghị chỉ có hiệu lực khi bên còn lại đồng ý. Không có phản hồi không được xem là đồng ý.'
                : 'Kết thúc chỉ được ghi nhận sau khi bên còn lại đồng ý; công việc, chi phí và trạng thái thanh toán đã lưu được giữ nguyên.'}
            </Typography.Paragraph></>}
        <Space wrap><Button disabled={busy} onClick={() => setAction(undefined)}>Đóng</Button><Button disabled={conflict || !validAction} type="primary" danger={action === 'terminate' || action === 'terminate-external' || action === 'termination-requests'} htmlType="submit" loading={busy}>
          {action === 'terminate-external' ? 'Ghi nhận đồng thuận và kết thúc' : action === 'withdraw-termination' ? 'Rút đề nghị' : action === 'termination-requests' ? 'Gửi đề nghị' : action === 'terminate' ? 'Đồng ý kết thúc' : 'Xác nhận'}
        </Button></Space>
      </Form>}
    </Modal>
  </section>;
}
