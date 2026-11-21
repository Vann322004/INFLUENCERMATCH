import { writeKey } from './cooperationWriteKey';
import ProposalFields from './ProposalFields';
import { dealLabel } from './cooperationDisplay';
import { proposalPayload, localDate } from './proposalForm';
import type { ProposalForm } from './proposalForm';
import { useCallback, useRef, useState } from 'react';
import { Alert, App, Button, Form, Input, Modal, Select, Skeleton, Tag } from 'antd';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { dealService } from '../../services/api/dealService';
import type { Deal, Delivery } from '../../services/api/dealService';
import { getAuthSessionId, getStoredUser } from '../../services/authSession';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../services/apiClient';
import ProposalHistory from './ProposalHistory';
import { deliveryMethodLabels, emailResendState } from './invitationDisplay';
import type { DealHistory } from '../../services/api/dealService';


const deliveryLabel = (status: string) => ({ QUEUED: 'Email đang chờ gửi', PROCESSING: 'Đang gửi email', SENT: 'Email đã gửi', FAILED: 'Gửi email chưa thành công', MANUAL_REQUIRED: 'Cần chia sẻ lời mời trực tiếp', CANCELLED: 'Email đã hủy' }[status] ?? 'Chưa xác định trạng thái gửi');

export default function DealProposalDrawer({ campaignId, dealId, readOnly, onSaved, reusableDeals = [], contactChannel }: { campaignId: string; dealId: string; readOnly: boolean; onSaved: () => void; reusableDeals?: Deal[]; contactChannel?: string }) {
  const query = useCallback(async () => {
    const [deal, history] = await Promise.all([dealService.detail(campaignId, dealId), dealService.history(campaignId, dealId)]);
    const invitation = history.events.filter(event => event.action === 'INVITATION_CREATED' && event.revision === deal.proposal?.revision && event.metadata?.invitationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const delivery = invitation?.metadata.invitationId ? await dealService.delivery(invitation.metadata.invitationId) : null;
    return { deal, delivery, history };
  }, [campaignId, dealId]);
  const resource = useAsyncResource(query);
  return resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' || !resource.data ? <Alert type="error" title="Không tải được thỏa thuận" description={resource.error} action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : <ProposalEditor key={resource.data.deal.revision} campaignId={campaignId} deal={resource.data.deal} initialDelivery={resource.data.delivery} history={resource.data.history} readOnly={readOnly} reusableDeals={reusableDeals} contactChannel={contactChannel} onSaved={() => { onSaved(); void resource.reload(); }} />;
}

function ProposalEditor({ campaignId, deal, initialDelivery, history, readOnly, onSaved, reusableDeals }: { campaignId: string; deal: Deal; initialDelivery: Delivery | null; history: DealHistory; readOnly: boolean; onSaved: () => void; reusableDeals: Deal[]; contactChannel?: string }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ProposalForm>();
  const [confirmForm] = Form.useForm();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const agreementSource = Form.useWatch('agreementSource', confirmForm);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [delivery, setDelivery] = useState(initialDelivery);
  const availableMethods = (deal.availableDeliveryMethods ?? []).filter(method => Object.prototype.hasOwnProperty.call(deliveryMethodLabels, method));
  const [deliveryMethod, setDeliveryMethod] = useState<string | undefined>(initialDelivery?.deliveryMethod ?? availableMethods[0]);
  const [manualLink, setManualLink] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const sessionId = getAuthSessionId();
  const mutable = !readOnly && ['CONTACTED', 'NEGOTIATING'].includes(deal.status);
  const accepted = !!deal.proposal && deal.acceptedRevision === deal.proposal.revision;
  const canConfirm = (getStoredUser()?.permissions ?? []).includes('MANAGE_OWN_COLLABORATION');
  const resendState = emailResendState(deal, delivery, readOnly);
  const manual = deliveryMethod === 'MANUAL_LINK';
  const channelDescription = manual ? 'Bạn tự chia sẻ link lời mời. Hệ thống không gửi email hoặc thông báo Portal.'
    : deliveryMethod === 'PORTAL_ONLY' ? 'Chỉ tạo thông báo trong tài khoản Creator, không gửi email.'
    : deliveryMethod === 'PORTAL_EMAIL' ? 'Tạo thông báo trong tài khoản Creator và gửi email chứa link lời mời.'
    : deliveryMethod === 'EMAIL_ONLY' ? 'Chỉ gửi email chứa link lời mời, không tạo thông báo Portal.'
    : 'Chưa tải được các cách gửi khả dụng cho người nhận này.';
  const initialValues: Partial<ProposalForm> = {
    fee: deal.proposal?.fee, terms: deal.proposal?.terms ?? '',
    units: deal.proposal?.deliverables.map(unit => ({ ...unit, dueAt: localDate(unit.dueAt), checklist: unit.acceptanceChecklist?.join('\n') ?? '' }))
      ?? deal.channels.map(channel => ({ creatorId: channel.creatorId, contentType: '', quantity: 1, dueAt: '', checklist: '', maxRevisionRounds: 1 })),
  };
  const perform = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (error) { if (getAuthSessionId() === sessionId) setError(getErrorMessage(error, 'Chưa thực hiện được. Kiểm tra trạng thái trước khi thử lại.')); }
    finally { lock.current = false; if (getAuthSessionId() === sessionId) setBusy(false); }
  };
  const save = (values: ProposalForm) => perform(async () => {
    const body = proposalPayload(values, deal);
    await dealService.write(campaignId, deal.id, 'proposals', body, await writeKey(deal.id + ':proposals', body));
    if (getAuthSessionId() !== sessionId) return;
    message.success('Đã lưu đề xuất. Chưa gửi lời mời.'); onSaved();
  });
  const reuseProposal = (sourceId: string) => {
    const apply = () => perform(async () => {
      const source = await dealService.detail(campaignId, sourceId);
      if (getAuthSessionId() !== sessionId || !source.proposal) return;
      const sameChannels = source.channels.length === deal.channels.length && source.channels.every(channel => deal.channels.some(target => target.creatorId === channel.creatorId));
      const singleMatch = source.channels.length === 1 && deal.channels.length === 1 && source.channels[0].platform === deal.channels[0].platform;
      form.setFieldsValue({ fee: source.proposal.fee, terms: source.proposal.terms,
        ...(sameChannels || singleMatch ? { units: source.proposal.deliverables.map(unit => ({ creatorId: singleMatch ? deal.channels[0].creatorId : unit.creatorId, contentType: unit.contentType, quantity: unit.quantity, dueAt: localDate(unit.dueAt), checklist: unit.acceptanceChecklist?.join('\n') ?? '', maxRevisionRounds: unit.maxRevisionRounds })) } : {}),
      });
      setDirty(true);
      message.info(sameChannels || singleMatch ? 'Đã điền từ lời mời trước. Kiểm tra phí, số lượng và hạn bàn giao trước khi gửi.' : 'Đã điền phí và điều khoản. Các kênh khác nhau nên bạn cần thiết lập ấn phẩm riêng.');
    });
    if (dirty || deal.proposal) Modal.confirm({ title: 'Dùng nội dung lời mời khác?', content: 'Phí và điều khoản hiện tại sẽ được thay thế. Hạng mục được sao chép khi các kênh tương thích. Thao tác này chưa lưu hoặc gửi lời mời.', okText: 'Dùng nội dung', cancelText: 'Hủy', onOk: apply });
    else void apply();
  };
  const reviewAndSend = async () => {
    try {
      if (!deliveryMethod || !availableMethods.includes(deliveryMethod)) { setError('Chọn một cách gửi khả dụng trước khi tiếp tục.'); return; }
      const values = await form.validateFields();
      const proposal = proposalPayload(values, deal);
      Modal.confirm({ title: manual ? 'Tạo link lời mời hợp tác?' : 'Gửi lời mời hợp tác?', content: <><p>{deal.channels.map(channel => '@' + channel.username).join(', ')}</p><p>{proposal.fee.toLocaleString('vi-VN')} ₫ · {proposal.deliverables.reduce((sum, item) => sum + item.quantity, 0)} ấn phẩm</p><p>{channelDescription}</p><p>Phí, điều khoản và ấn phẩm được xem trên trang lời mời. Chưa ghi nhận Creator đồng ý ở bước này.</p></>, okText: manual ? 'Tạo lời mời' : 'Xác nhận gửi', cancelText: 'Kiểm tra lại', onOk: () => perform(async () => {
        let current = deal;
        if (dirty || !deal.proposal || deal.proposal.kind !== 'OFFER') current = await dealService.write(campaignId, deal.id, 'proposals', proposal, await writeKey(deal.id + ':proposals', proposal)) as Deal;
        const body = { expectedRevision: current.revision, deliveryMethod };
        const result = await dealService.write(campaignId, deal.id, 'invitations', body, await writeKey(deal.id + ':invitations:' + (delivery?.invitationId ?? 'first'), body)) as Delivery;
        if (getAuthSessionId() !== sessionId) return;
        setDelivery(result); onSaved();
      }) });
    } catch (error) { if (!(error as { errorFields?: unknown }).errorFields) setError(getErrorMessage(error)); }
  };
  const confirm = (values: { agreementSource: string; agreedAt?: string; evidenceSource?: string; evidenceUrl?: string; evidenceDescription?: string }) => perform(async () => {
    const body = { ...values, expectedRevision: deal.revision, agreedAt: values.agreementSource === 'EXTERNAL' && values.agreedAt ? new Date(values.agreedAt + ':00+07:00').toISOString() : undefined };
    const result = await dealService.write(campaignId, deal.id, 'confirm', body, await writeKey(deal.id + ':confirm', body)) as Deal;
    if (result.status !== 'CONFIRMED' || !result.collaborationId) throw new Error('Chưa nhận được xác nhận hợp tác hợp lệ.');
    if (getAuthSessionId() !== sessionId) return;
    setConfirmOpen(false); message.success('Đã xác nhận hợp tác. Có thể tiếp tục quản lý bàn giao.'); onSaved();
  });

  return <div className="contact-proposal">
    <div className="contact-section-heading"><strong>{deal.channels.map(channel => `${channel.platform} · @${channel.username.replace(/^@+/, '')}`).join(' / ')}</strong><Tag>{dealLabel(deal.status)}</Tag></div>
    <div className="contact-route-summary"><strong>Cách gửi lời mời</strong>{mutable && <Select aria-label="Cách gửi lời mời" value={deliveryMethod} placeholder="Chọn cách gửi" disabled={busy || (!!delivery && delivery.active !== false && !dirty)} onChange={setDeliveryMethod} options={availableMethods.map(value => ({ value, label: deliveryMethodLabels[value] }))} style={{ width: '100%', marginTop: 10 }} />}<p>{channelDescription}</p></div>
    {deal.proposal && <p className="contact-source">Bản đề xuất {deal.proposal.revision}{accepted ? ' · Creator đã đồng ý bản này' : deal.proposal.kind === 'COUNTEROFFER' ? ' · Creator có đề xuất thay đổi. Xem lại rồi phát hành lời mời cập nhật.' : ' · Chưa ghi nhận đồng ý bản này'}</p>}
    {error && <Alert type="error" title={error} action={<Button onClick={onSaved}>Tải lại trạng thái</Button>} />}
    {mutable && reusableDeals.some(source => source.id !== deal.id && source.proposal?.kind === 'OFFER') && <div className="contact-reuse-proposal"><span>Dùng lại lời mời</span><Select aria-label="Dùng lại nội dung lời mời" placeholder="Chọn lời mời đã soạn" value={undefined} disabled={busy} onChange={reuseProposal} options={reusableDeals.filter(source => source.id !== deal.id && source.proposal?.kind === 'OFFER').map(source => ({ value: source.id, label: source.channels.map(channel => '@' + channel.username).join(', ') + ' · ' + source.proposal!.fee.toLocaleString('vi-VN') + ' ₫' }))} /></div>}
    <ProposalFields form={form} deal={deal} initialValues={initialValues} mutable={mutable} busy={busy} onDirty={() => setDirty(true)} onFinish={values => void save(values)} />

    {delivery && <section className="contact-delivery"><strong>{delivery.emailStatus === 'NOT_REQUESTED' ? 'Đã tạo thông báo Portal · Không gửi email' : deliveryLabel(delivery.emailStatus)}</strong>{delivery.portalNotificationCreated && <p>Đã tạo thông báo lời mời trong hệ thống.</p>}{delivery.sentAt && <p>{new Date(delivery.sentAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (UTC+7)</p>}
      {delivery.emailStatus === 'SENT' && <p>Email đã được gửi; chưa xác nhận người nhận đã đọc hoặc đồng ý.</p>}
      {delivery.active === false && <p>Lời mời này không còn hiệu lực. Trạng thái email không phải trạng thái đồng thuận của Creator.</p>}
      <div className="contact-actions"><Button disabled={busy} onClick={() => void perform(async () => { const next = await dealService.delivery(delivery.invitationId); if (getAuthSessionId() === sessionId) setDelivery(next); })}>Kiểm tra trạng thái gửi</Button>
        {delivery.emailStatus === 'MANUAL_REQUIRED' && delivery.active !== false && <Button disabled={busy} onClick={() => void perform(async () => { const result = await dealService.manualLink(delivery.invitationId); if (getAuthSessionId() !== sessionId) return; setManualLink(result.link); })}>Lấy link lời mời</Button>}
        {delivery.canRetry && <Button disabled={busy} onClick={() => void perform(async () => { const result = await dealService.retryEmail(delivery.invitationId); if (getAuthSessionId() === sessionId) setDelivery(result); })}>Thử gửi lại email</Button>}</div>
      {resendState.visible && <div className="contact-resend-control"><Button disabled={busy || !resendState.enabled} onClick={() => Modal.confirm({ title: 'Gửi lại email lời mời?', content: 'Giữ nguyên liên kết và thời hạn của lời mời, không tạo thỏa thuận mới.', okText: 'Gửi lại email', cancelText: 'Hủy', onOk: () => perform(async () => { await dealService.resendEmail(delivery.invitationId); const next = await dealService.delivery(delivery.invitationId); if (getAuthSessionId() === sessionId) { setDelivery(next); message.success('Đã xếp hàng gửi lại email.'); } }) })}>Gửi lại email</Button>{resendState.reason && <small>{resendState.reason}</small>}</div>}
      {manualLink && delivery.active !== false && <Input.TextArea readOnly value={manualLink} aria-label="Link lời mời để chia sẻ trực tiếp" autoSize onFocus={event => event.target.select()} />}
      {delivery.emailStatus === 'MANUAL_REQUIRED' && <p>Chia sẻ link qua kênh liên hệ công khai. Chưa xác nhận Creator đã nhận hoặc đồng ý.</p>}
    </section>}
    <ProposalHistory history={history} />
    {deal.collaborationId && <Button type="primary" onClick={() => navigate('/collaboration')}>Đi đến quản lý bàn giao</Button>}
    {mutable && <div className="contact-proposal-footer"><Button loading={busy} disabled={busy || (!dirty && !!deal.proposal && deal.proposal.kind === 'OFFER')} onClick={() => form.submit()}>Lưu bản nháp</Button>
      <Button type={accepted && !dirty ? 'default' : 'primary'} disabled={busy || !deliveryMethod || !availableMethods.includes(deliveryMethod) || (!!delivery && delivery.active !== false && !dirty && deal.proposal?.kind === 'OFFER')} onClick={() => void reviewAndSend()}>{manual ? 'Xem lại & tạo link' : 'Xem lại & gửi'}</Button>
      {canConfirm && deal.proposal && <Button type={accepted ? 'primary' : 'default'} disabled={busy || dirty} onClick={() => setConfirmOpen(true)}>Xác nhận hợp tác</Button>}
    </div>}
    <Modal title="Xác nhận hợp tác" open={confirmOpen} onCancel={() => { if (!busy) setConfirmOpen(false); }} okText="Xác nhận hợp tác" cancelText="Để sau" confirmLoading={busy} onOk={() => confirmForm.submit()} destroyOnHidden>
      <Form form={confirmForm} layout="vertical" onFinish={values => void confirm(values)} disabled={busy}>
        <Form.Item name="agreementSource" label="Hai bên đã đồng ý bằng cách nào?" rules={[{ required: true }]}><Select options={[{ value: 'PORTAL', label: 'Creator đã đồng ý trên InfluencerMatch', disabled: !accepted }, { value: 'EXTERNAL', label: 'Đã thỏa thuận ngoài hệ thống' }]} /></Form.Item>
        {agreementSource === 'PORTAL' && <p>Xác nhận bản {deal.proposal?.revision} đã được Creator đồng ý. Chưa bắt đầu công việc hoặc thực hiện thanh toán.</p>}
        {agreementSource === 'EXTERNAL' && <><Form.Item name="agreedAt" label="Thời điểm đồng ý (giờ Việt Nam)" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item>
          <Form.Item name="evidenceSource" label="Nguồn thỏa thuận" rules={[{ required: true, whitespace: true }]}><Input maxLength={100} placeholder="Email, tin nhắn, hợp đồng…" /></Form.Item>
          <Form.Item name="evidenceUrl" label="Đường dẫn bằng chứng HTTPS" rules={[{ required: true }, { validator: (_, value) => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username ? Promise.resolve() : Promise.reject(new Error('Nhập link HTTPS hợp lệ.')); } catch { return Promise.reject(new Error('Nhập link HTTPS hợp lệ.')); } } }]}><Input maxLength={2000} /></Form.Item>
          <Form.Item name="evidenceDescription" label="Nội dung đã được hai bên thống nhất" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={3} maxLength={2000} /></Form.Item></>}
      </Form>
    </Modal>
  </div>;
}
