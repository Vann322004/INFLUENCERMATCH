import { useCallback } from 'react';
import { Button, Tag } from 'antd';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { dealService } from '../../services/api/dealService';
import type { Deal } from '../../services/api/dealService';
import { invitationDisplay } from './invitationDisplay';

export default function InvitationListItem({ deal, name, readOnly, onOpen }: { deal: Deal; name: string; readOnly: boolean; onOpen: () => void }) {
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
    <Button onClick={onOpen}>{readOnly ? 'Xem thỏa thuận' : loaded ? view.action : 'Xem lời mời'}</Button>
  </article>;
}
