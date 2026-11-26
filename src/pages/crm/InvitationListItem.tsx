import { useCallback, useEffect, useRef, useState } from 'react';
import { App, Button, Tag } from 'antd';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { dealService } from '../../services/api/dealService';
import type { Deal, Delivery } from '../../services/api/dealService';
import { invitationDisplay, emailResendState } from './invitationDisplay';
import { getErrorMessage } from '../../services/apiClient';

export default function InvitationListItem({ deal, name, readOnly, onOpen }: { deal: Deal; name: string; readOnly: boolean; onOpen: () => void }) {
  const { modal, message } = App.useApp();
  const [resending, setResending] = useState(false);
  const resendLock = useRef(false);
  const query = useCallback(async () => {
    if (!deal.proposal) return null;
    const history = await dealService.history(deal.campaignId, deal.id);
    const invitation = history.events.filter(event => event.action === 'INVITATION_CREATED' && event.revision === deal.proposal!.revision && event.metadata?.invitationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return invitation?.metadata.invitationId ? dealService.delivery(invitation.metadata.invitationId) : null;
  }, [deal.campaignId, deal.id, deal.proposal]);
  const status = useAsyncResource(query);
  const scope = `${deal.campaignId}/${deal.id}/${deal.proposal?.revision}`;
  const lastDelivery = useRef<{ scope: string; value: Delivery } | null>(null);
  if (status.data) lastDelivery.current = { scope, value: status.data };
  const delivery = status.status === 'success' ? status.data
    : lastDelivery.current?.scope === scope ? lastDelivery.current.value : null;
  const view = invitationDisplay(deal, delivery);
  const loaded = status.status === 'success';
  const resendState = emailResendState(deal, delivery, readOnly);
  useEffect(() => {
    if (!loaded || readOnly || !delivery || delivery.active !== true
        || !['SENT', 'QUEUED', 'PROCESSING'].includes(delivery.emailStatus)
        || ['CONFIRMED', 'DECLINED', 'CANCELLED'].includes(deal.status)
        || deal.acceptedRevision === deal.proposal?.revision
        || ['PAYLOAD_UNAVAILABLE', 'PROPOSAL_ACCEPTED', 'STATE_UNAVAILABLE'].includes(delivery.resendUnavailableReason ?? '')) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!delivery.canResend) {
      const available = Date.parse(delivery.resendAvailableAt ?? '');
      const delay = Number.isFinite(available) ? Math.max(1000, available - Date.now() + 1000) : 60000;
      timer = setTimeout(() => { if (!document.hidden) void status.reload(); }, Math.min(delay, 2147483647));
    }
    const onFocus = () => { if (!document.hidden) void status.reload(); };
    window.addEventListener('focus', onFocus);
    return () => { if (timer) clearTimeout(timer); window.removeEventListener('focus', onFocus); };
  }, [loaded, delivery, deal.status, deal.acceptedRevision, deal.proposal?.revision, readOnly, status.reload]);
  const resend = () => modal.confirm({ title: 'Gửi lại email lời mời?', content: 'Gửi lại cùng lời mời đến email người nhận. Liên kết và thời hạn giữ nguyên; không tạo thỏa thuận mới.', okText: 'Gửi lại email', cancelText: 'Hủy', onOk: async () => {
    if (resendLock.current || !status.data?.canResend) return;
    resendLock.current = true; setResending(true);
    try { await dealService.resendEmail(status.data.invitationId); message.success('Đã xếp hàng gửi lại email.'); }
    catch (error) { message.error(getErrorMessage(error, 'Chưa gửi lại được email.')); }
    finally { await status.reload(); resendLock.current = false; setResending(false); }
  } });
  return <article className="contact-deal contact-invitation-row">
    <div className="contact-invitation-top">
      <div className="contact-invitation-title">
        <strong>{name}</strong>
        <p className="contact-invitation-summary">{deal.proposal ? `${deal.proposal.fee.toLocaleString('vi-VN')} ₫ · ${deal.proposal.deliverables.length} hạng mục` : 'Bản nháp · Chưa có đề xuất'}</p>
      </div>
      <div className="contact-invitation-buttons">
        <Button onClick={onOpen}>{readOnly ? 'Xem thỏa thuận' : loaded ? view.action : 'Xem lời mời'}</Button>
        {resendState.visible && <Button loading={resending} disabled={resending || !loaded || !resendState.enabled} onClick={resend}>Gửi lại email</Button>}
      </div>
    </div>
    <dl className="contact-invitation-status-grid">
      <div><dt>Cách gửi</dt><dd><Tag>{loaded ? view.route : status.status === 'error' ? 'Chưa tải được cách gửi' : 'Đang kiểm tra…'}</Tag></dd></div>
      <div><dt>Trạng thái gửi</dt><dd>{loaded ? view.dispatch : status.status === 'error' ? 'Chưa tải được trạng thái' : 'Đang kiểm tra…'}</dd></div>
      <div><dt>Phản hồi</dt><dd><Tag>{view.response}</Tag></dd></div>
    </dl>
    {loaded && !deal.plannedContactChannel && !deal.masterId && !status.data && <small className="contact-invitation-hint">API chưa cung cấp cách gửi cho bản nháp này. Chưa có lời mời được gửi.</small>}
    {loaded ? <small className="contact-invitation-hint">{view.hint}</small> : status.status === 'error' && <Button size="small" type="link" onClick={() => void status.reload()}>Thử tải lại trạng thái</Button>}
    {resendState.visible && resendState.reason && <small className="contact-invitation-hint">Gửi lại email: {resendState.reason}</small>}
  </article>;
}
