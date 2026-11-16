import apiClient from '../apiClient';
export interface DealChannel { creatorId: string; relationshipId: string; platform: string; username: string }
export interface ProposalUnit { creatorId: string; contentType: string; quantity: number; dueAt: string; acceptanceChecklist: string[]; maxRevisionRounds: number }
export interface DealProposal { id: string; revision: number; kind: string; fee: number; currency: string; terms: string; deliverables: ProposalUnit[]; createdAt: string }
export interface Deal { id: string; campaignId: string; masterId: string | null; status: string; revision: number; acceptedRevision: number | null; collaborationId: string | null; collaborationStatus?: string; channels: DealChannel[]; proposal: DealProposal | null; agreedFee: number | null }
export interface CooperationBudget { status: string; totalBudget: number | null; currency: string | null; committedBudget: number | null; remainingBudget: number | null; confirmedCreatorCount: number; negotiatingBudget: number | null }
export interface Delivery { invitationId: string; dealId?: string; emailStatus: string; sentAt?: string | null; canRetry?: boolean }
export interface DealHistory { events: { action: string; revision: number; createdAt: string; metadata: { invitationId?: string } }[]; proposals: DealProposal[] }
const base = (campaignId: string) => `/campaigns/${campaignId}`;
function dataOf(response: any) { if (response.data?.success === false || response.data?.data == null) throw new Error('Máy chủ chưa xác nhận kết quả.'); return response.data.data; }
function deal(raw: any, campaignId: string): Deal { if (!raw?.id || raw.campaignId !== campaignId || !Number.isSafeInteger(raw.revision) || raw.revision < 1 || !Array.isArray(raw.channels)) throw new Error('Thỏa thuận trả về không hợp lệ.'); return raw; }
export const dealService = {
  async list(campaignId: string): Promise<Deal[]> { const data = dataOf(await apiClient.get(`${base(campaignId)}/deals`)); if (!Array.isArray(data)) throw new Error('Danh sách thỏa thuận không hợp lệ.'); return data.map(raw => deal(raw, campaignId)); },
  async detail(campaignId: string, id: string): Promise<Deal> { return deal(dataOf(await apiClient.get(`${base(campaignId)}/deals/${id}`)), campaignId); },
  async budget(campaignId: string): Promise<CooperationBudget> { const data = dataOf(await apiClient.get(`${base(campaignId)}/cooperation-budget`)); if (!data?.status) throw new Error('Ngân sách trả về không hợp lệ.'); return data; },
  async write(campaignId: string, id: string, action: 'proposals' | 'invitations' | 'confirm' | 'cancel', body: object, key: string) {
    const data = dataOf(await apiClient.post(`${base(campaignId)}/deals/${id}/${action}`, body, { headers: { 'Idempotency-Key': key } }));
    if (action === 'invitations') { if (!data.invitationId || !data.emailStatus) throw new Error('Chưa nhận được thông tin lời mời.'); return data as Delivery; }
    return deal(data, campaignId);
  },
  async delivery(id: string): Promise<Delivery> { return dataOf(await apiClient.get(`/cooperation-invitations/${id}/email-delivery`)); },
  async history(campaignId: string, id: string): Promise<DealHistory> { const data = dataOf(await apiClient.get(`${base(campaignId)}/deals/${id}/history`)); if (!Array.isArray(data.events) || !Array.isArray(data.proposals)) throw new Error('Lịch sử thỏa thuận không hợp lệ.'); return data; },
};
