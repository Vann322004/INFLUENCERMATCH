import apiClient from '../apiClient';
export interface DealChannel { creatorId: string; relationshipId: string; platform: string; username: string }
export interface ProposalUnit { creatorId: string; contentType: string; quantity: number; dueAt: string; acceptanceChecklist: string[]; maxRevisionRounds: number }
export interface DealProposal { id?: string; revision: number; kind: string; fee: number; currency: string; terms: string; deliverables: ProposalUnit[]; createdAt: string }
export interface Deal { id: string; campaignId: string; campaignName?: string; campaignStatus?: string; brandName?: string; plannedContactChannel?: string; availableDeliveryMethods?: string[]; masterId: string | null; status: string; revision: number; acceptedRevision: number | null; collaborationId: string | null; collaborationStatus?: string; channels: DealChannel[]; proposal: DealProposal | null; agreedFee: number | null }
export interface CooperationBudget { status: string; totalBudget: number | null; currency: string | null; committedBudget: number | null; remainingBudget: number | null; confirmedCreatorCount: number; negotiatingBudget: number | null }
export interface Delivery { invitationId: string; dealId?: string; deliveryMethod?: string; emailStatus: string; sentAt?: string | null; canRetry?: boolean; portalNotificationCreated?: boolean; active?: boolean; invitationStatus?: string; expiresAt?: string }
export interface DealHistory { events: { action: string; revision: number; createdAt: string; metadata: { invitationId?: string; agreementSource?: string; agreedAt?: string; evidenceSource?: string; evidenceUrl?: string; evidenceDescription?: string } }[]; proposals: DealProposal[] }
const base = (campaignId: string) => `/campaigns/${campaignId}`;
function dataOf(response: any) { if (response.data?.success === false || response.data?.data == null) throw new Error('Máy chủ chưa xác nhận kết quả.'); return response.data.data; }
function deal(raw: any, campaignId: string): Deal { if (!raw?.id || raw.campaignId !== campaignId || !Number.isSafeInteger(raw.revision) || raw.revision < 1 || !Array.isArray(raw.channels)) throw new Error('Thỏa thuận trả về không hợp lệ.'); return raw; }
export const dealService = {
  async portalList(): Promise<Deal[]> {
    const data = dataOf(await apiClient.get('/creators/portal/cooperation-deals'));
    if (!Array.isArray(data)) throw new Error('Không tải được danh sách lời mời.');
    return data.map(row => deal(row, row.campaignId));
  },
  async portalDetail(id: string): Promise<Deal> {
    const data = dataOf(await apiClient.get('/creators/portal/cooperation-deals/' + id));
    const result = deal(data, data.campaignId); if (result.id !== id) throw new Error('Sai lời mời.'); return result;
  },
  async portalRespond(id: string, action: 'accept' | 'decline' | 'counteroffers', body: object, key?: string): Promise<Deal> {
    const data = dataOf(await apiClient.post('/creators/portal/cooperation-deals/' + id + '/' + action, body, { headers: key ? { 'Idempotency-Key': key } : {} }));
    const result = deal(data, data.campaignId);
    if (result.id !== id || (action === 'accept' && (!result.proposal || result.acceptedRevision !== result.proposal.revision)) || (action === 'decline' && result.status !== 'DECLINED')) throw new Error('Chưa nhận được xác nhận phản hồi hợp lệ.');
    return result;
  },
  async preview(token: string): Promise<{ brandName: string; campaignName: string; message: string; expiresAt: string }> {
    const data = dataOf(await apiClient.get('/cooperation-invitations/preview', { params: { token } }));
    if (!data?.brandName || !data.campaignName || !data.expiresAt) throw new Error('Lời mời chưa có thông tin hợp lệ.');
    return data;
  },
  async retryEmail(id: string): Promise<Delivery> { const data = dataOf(await apiClient.post(`/cooperation-invitations/${id}/retry-email`)); if (data.invitationId !== id) throw new Error('Chưa xác nhận gửi lại email.'); return data; },
  async manualLink(id: string): Promise<{ invitationId: string; link: string; expiresAt: string }> {
    const data = dataOf(await apiClient.get(`/cooperation-invitations/${id}/manual-link`));
    if (data?.invitationId !== id || typeof data.link !== 'string' || !/^https?:\/\//i.test(data.link)) throw new Error('Chưa lấy được đường dẫn lời mời.');
    return data;
  },
  async list(campaignId: string): Promise<Deal[]> { const data = dataOf(await apiClient.get(`${base(campaignId)}/deals`)); if (!Array.isArray(data)) throw new Error('Danh sách thỏa thuận không hợp lệ.'); return data.map(raw => deal(raw, campaignId)); },
  async detail(campaignId: string, id: string): Promise<Deal> { return deal(dataOf(await apiClient.get(`${base(campaignId)}/deals/${id}`)), campaignId); },
  async budget(campaignId: string): Promise<CooperationBudget> { const data = dataOf(await apiClient.get(`${base(campaignId)}/cooperation-budget`)); if (!data?.status) throw new Error('Ngân sách trả về không hợp lệ.'); return data; },
  async write(campaignId: string, id: string, action: 'proposals' | 'invitations' | 'confirm' | 'cancel', body: object, key: string) {
    const data = dataOf(await apiClient.post(`${base(campaignId)}/deals/${id}/${action}`, body, { headers: { 'Idempotency-Key': key } }));
    if (action === 'invitations') { if (!data.invitationId || data.dealId !== id || !data.emailStatus) throw new Error('Chưa nhận được thông tin lời mời đúng thỏa thuận.'); return data as Delivery; }
    const result = deal(data, campaignId);
    if (result.id !== id) throw new Error('Máy chủ trả về sai thỏa thuận.');
    if (action === 'proposals' && (result.status !== 'NEGOTIATING' || !result.proposal || result.proposal.revision !== result.revision)) throw new Error('Máy chủ chưa xác nhận phiên bản đề xuất mới.');
    return result;
  },
  async delivery(id: string): Promise<Delivery> { return dataOf(await apiClient.get(`/cooperation-invitations/${id}/email-delivery`)); },
  async history(campaignId: string, id: string): Promise<DealHistory> { const data = dataOf(await apiClient.get(`${base(campaignId)}/deals/${id}/history`)); if (!Array.isArray(data.events) || !Array.isArray(data.proposals)) throw new Error('Lịch sử thỏa thuận không hợp lệ.'); return data; },
};
