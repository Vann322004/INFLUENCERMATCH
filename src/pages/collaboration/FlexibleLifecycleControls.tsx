import { Alert, App, Button, Collapse, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { useRef, useState } from 'react';
import type { ExecutionSnapshot } from '../../types/api/collaboration.types';
import { collaborationService } from '../../services/api/collaborationService';
import { getErrorMessage } from '../../services/apiClient';
import axios from 'axios';
import { formatDate, httpsRule, requiredText } from './ExecutionForms';

type Action = 'management-mode' | 'complete-without-review' | 'terminate' | 'termination-requests' | 'termination-requests/decline';
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
  const canResolvePending = Boolean(pending && pending.requestedByRole !== actorRole);
  const titles: Record<Action, string> = {
    'management-mode': 'Chọn phương thức quản lý', 'complete-without-review': 'Hoàn tất không đánh giá?',
    terminate: 'Đồng ý kết thúc hợp tác?', 'termination-requests': 'Đề nghị dừng hợp tác',
    'termination-requests/decline': 'Từ chối yêu cầu dừng',
  };
  function open(next: Action) { setMode(s.managementMode || 'COLLABORATIVE'); setConflict(false); setError(''); attempt.current = null; setAction(next); }
  const validAction = !action || (action === 'management-mode' ? s.status === 'PLANNED'
    : action === 'complete-without-review' ? s.status === 'AWAITING_REVIEW'
      : s.status === 'IN_PROGRESS' && s.campaignStatus === 'ACTIVE'
        && (action === 'termination-requests' ? !pending : canResolvePending));
  async function save(values: { reason?: string; evidenceUrl?: string }) {
    if (!action || lock.current || conflict || !validAction) return;
    lock.current = true; setBusy(true); setError('');
    const body = { expectedRevision: s.executionRevision,
      ...(action === 'management-mode' ? { managementMode: mode }
        : action === 'complete-without-review' ? { outcomeRevision: s.acceptances.find(a => !a.reopenedAt)?.outcomeRevision }
          : { reason: values.reason?.trim(), evidenceUrl: values.evidenceUrl?.trim() || undefined,
            requestId: action === 'termination-requests' ? undefined : pending?.id }) };
    const fingerprint = JSON.stringify({ action, body });
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    try {
      onChanged(await collaborationService.flexibleAction(s.id, action, body, attempt.current.key));
      setAction(undefined); message.success('Đã lưu thay đổi.');
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
      {s.status === 'IN_PROGRESS' && s.campaignStatus === 'ACTIVE'
        && (manage || permissions.has('RESPOND_OWN_COOPERATION')) && !pending
        && <Button danger onClick={() => open('termination-requests')}>Đề nghị dừng hợp tác</Button>}
    </Space>
    {pending && <Alert type="warning" showIcon title="Đang chờ bên còn lại phản hồi đề nghị dừng"
      description={`${pending.requestedByRole === 'BRAND' ? 'Brand đề nghị' : 'Creator đề nghị'}: ${pending.reason}`}
      action={canResolvePending && s.status === 'IN_PROGRESS' ? <Space wrap>
        <Button danger onClick={() => open('terminate')}>Đồng ý kết thúc</Button>
        <Button onClick={() => open('termination-requests/decline')}>Từ chối yêu cầu</Button>
      </Space> : undefined} />}
    {s.status === 'TERMINATED' && <Alert type="warning" showIcon title="Hợp tác đã kết thúc giữa chừng"
      description={`${s.terminationReason || ''} · ${formatDate(s.terminatedAt)}. Công việc và chi phí đã ghi nhận được giữ lại; không xác nhận đã thanh toán.`} />}
    {s.completionMethod === 'WITHOUT_REVIEW' && <Alert type="success" title="Đã hoàn tất không có đánh giá Creator" />}
    {!!s.exitRequests?.length && <Collapse size="small" items={[{ key: 'exit-history', label: 'Lịch sử yêu cầu dừng',
      children: s.exitRequests.map(row => <p key={row.id}>{formatDate(row.createdAt)} · {row.requestedByRole === 'BRAND' ? 'Brand đề nghị' : 'Creator đề nghị'}: {row.reason} · {row.resolution === 'DECLINED' ? 'Đã từ chối' : row.resolution === 'TERMINATED' ? 'Hai bên đã đồng ý kết thúc' : 'Chờ bên còn lại phản hồi'}{row.resolutionReason ? ` · ${row.resolutionReason}` : ''}</p>) }]} />}
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
          : <><Form.Item name="reason" label={action === 'termination-requests' ? 'Lý do đề nghị' : action === 'terminate' ? 'Ghi chú đồng ý' : 'Lý do từ chối'} rules={[requiredText]}><Input.TextArea maxLength={2000} /></Form.Item>
            <Form.Item name="evidenceUrl" label="Link bằng chứng (tùy chọn)" rules={[httpsRule]}><Input placeholder="https://…" maxLength={2000} /></Form.Item>
            <Typography.Paragraph type="secondary">
              {action === 'termination-requests'
                ? 'Đề nghị chỉ có hiệu lực khi bên còn lại đồng ý. Không có phản hồi không được xem là đồng ý.'
                : 'Kết thúc chỉ được ghi nhận sau khi bên còn lại đồng ý; công việc, chi phí và trạng thái thanh toán đã lưu được giữ nguyên.'}
            </Typography.Paragraph></>}
        <Space><Button disabled={busy} onClick={() => setAction(undefined)}>Đóng</Button><Button disabled={conflict || !validAction} type="primary" danger={action === 'terminate' || action === 'termination-requests'} htmlType="submit" loading={busy}>
          {action === 'termination-requests' ? 'Gửi đề nghị' : action === 'terminate' ? 'Đồng ý kết thúc' : 'Xác nhận'}
        </Button></Space>
      </Form>}
    </Modal>
  </section>;
}
