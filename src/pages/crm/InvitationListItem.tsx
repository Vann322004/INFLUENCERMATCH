import { useCallback, useRef, useState } from 'react';
import { App, Button, Tag } from 'antd';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { dealService } from '../../services/api/dealService';
import type { Deal } from '../../services/api/dealService';
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
  const view = invitationDisplay(deal, status.data);
  const loaded = status.status === 'success';
  const resendState = emailResendState(deal, status.data, readOnly);
  const resend = () => modal.confirm({ title: 'Gửi lại email lời mời?', content: 'Gửi lại cùng lời mời đến email người nhận. Liên kết và thời hạn giữ nguyên; không tạo thỏa thuận mới.', okText: 'Gửi lại email', cancelText: 'Hủy', onOk: async () => {
    if (resendLock.current || !status.data?.canResend) return;
    resendLock.current = true; setResending(true);
    try { await dealService.resendEmail(status.data.invitationId); message.success('Đã xếp hàng gửi lại email.'); }
    catch (error) { message.error(getErrorMessage(error, 'Chưa gửi lại được email.')); }
    finally { await status.reload(); resendLock.current = false; setResending(false); }
  } });
  return <article className="contact-deal contact-invitation-row">
    <div className="contact-invitation-copy"><strong>{name}</strong>
      <p className="contact-invitation-summary">{deal.proposal ? `${deal.proposal.fee.toLocaleString('vi-VN')} ₫ · ${deal.proposal.deliverables.length} hạng mục` : 'Bản nháp · Chưa có đề xuất'}</p>
      <dl className="contact-invitation-status-grid">
        <div><dt>Cách gửi</dt><dd><Tag>{loaded ? view.route : status.status === 'error' ? 'Chưa tải được cách gửi' : 'Đang kiểm tra…'}</Tag></dd></div>
        <div><dt>Trạng thái gửi</dt><dd>{loaded ? view.dispatch : status.status === 'error' ? 'Chưa tải được trạng thái' : 'Đang kiểm tra…'}</dd></div>
        <div><dt>Phản hồi</dt><dd><Tag>{view.response}</Tag></dd></div>
      </dl>
      {loaded && !deal.plannedContactChannel && !deal.masterId && !status.data && <small>API chưa cung cấp cách gửi cho bản nháp này. Chưa có lời mời được gửi.</small>}
      {loaded ? <small>{view.hint}</small> : status.status === 'error' && <Button size="small" type="link" onClick={() => void status.reload()}>Thử tải lại trạng thái</Button>}
    </div>
    <div className="contact-invitation-buttons"><Button onClick={onOpen}>{readOnly ? 'Xem thỏa thuận' : loaded ? view.action : 'Xem lời mời'}</Button>
      {resendState.visible && <div className="contact-resend-control"><Button loading={resending} disabled={resending || !resendState.enabled} onClick={resend}>Gửi lại email</Button>{resendState.reason && <small>{resendState.reason}</small>}<Button type="link" size="small" disabled={resending} onClick={() => void status.reload()}>Tải lại trạng thái</Button></div>}
    </div>
  </article>;
}
