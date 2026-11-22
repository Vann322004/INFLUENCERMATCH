import type { DealHistory } from '../../services/api/dealService';
const labels: Record<string, string> = { DEAL_CREATED: 'Đã chuẩn bị lời mời', OFFER: 'Thương hiệu cập nhật đề xuất', COUNTEROFFER: 'Creator đề xuất thay đổi', PROPOSAL_ACCEPTED: 'Creator đồng ý đề xuất', DEAL_DECLINED: 'Creator từ chối', INVITATION_CREATED: 'Đã phát hành lời mời', DEAL_CONFIRMED: 'Đã xác nhận hợp tác', DEAL_CANCEL: 'Đã hủy thỏa thuận', DEAL_START: 'Đã bắt đầu hợp tác', DEAL_CANCELLED: 'Đã hủy thỏa thuận' };
export default function ProposalHistory({ history }: { history: DealHistory }) {
  return <details className="contact-history"><summary>Lịch sử trao đổi</summary>
    {history.events.length ? <ul>{history.events.map((event, index) => <li key={index}><strong>{labels[event.action] ?? 'Cập nhật thỏa thuận'}</strong><small>Bản {event.revision} · {new Date(event.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (UTC+7)</small>
      {event.metadata?.agreementSource && <p>{event.metadata.agreementSource === 'PORTAL' ? 'Creator đồng ý trên InfluencerMatch' : 'Thỏa thuận ngoài hệ thống'}{event.metadata.evidenceSource ? ' · ' + event.metadata.evidenceSource : ''}</p>}
      {event.metadata?.evidenceDescription && <p>{event.metadata.evidenceDescription}</p>}
      {event.metadata?.evidenceUrl?.startsWith('https://') && <a href={event.metadata.evidenceUrl} target="_blank" rel="noopener noreferrer">Xem bằng chứng thỏa thuận</a>}
    </li>)}</ul> : <p>Chưa có sự kiện được lưu.</p>}
    {history.proposals.map(proposal => <p key={proposal.revision}>Bản {proposal.revision} · {proposal.kind === 'COUNTEROFFER' ? 'Creator đề xuất' : 'Thương hiệu đề xuất'} · {proposal.fee.toLocaleString('vi-VN')} ₫
      {proposal.kpiType && proposal.kpiTarget != null ? ` · KPI cam kết: ${proposal.kpiType} ≥ ${proposal.kpiTarget.toLocaleString('vi-VN')}` : ' · Không cam kết KPI'}</p>)}
  </details>;
}
