import apiClient from '../apiClient';
import { brandService } from './brandService';
import type { ApiResponse, PageResponse } from '../../types/api/common.types';
import type { CampaignResponse } from '../../types/api/campaign.types';
import type {
  CollaborationDetail, CollaborationSummary, ExecutionSnapshot,
  LegacyPlan, Measurement, OutcomeValues, PendingAssignment, ReviewValues,
} from '../../types/api/collaboration.types';

type Revision = { expectedRevision: number };
type SubmissionRevision = Revision & { submissionRevision: number };
type OutcomeRevision = Revision & { outcomeRevision: number };
type Submission = Revision & { url: string; source: 'CREATOR_PORTAL' };
type Decision = SubmissionRevision & {
  decision: 'APPROVE' | 'REQUEST_CHANGES'; completedChecklist: string[]; reason?: string;
};
type Publication = SubmissionRevision & {
  url: string; postId?: string; acknowledgeException: boolean; exceptionReason?: string;
};

async function get<T>(url: string, params?: object, signal?: AbortSignal): Promise<T> {
  return (await apiClient.get<ApiResponse<T>>(url, { params, signal })).data.data;
}

function writer<T>(path: (id: string) => string) {
  return async (id: string, body: T, key: string): Promise<ExecutionSnapshot> =>
    (await apiClient.post<ApiResponse<ExecutionSnapshot>>(path(id), body, {
      headers: { 'Idempotency-Key': key },
    })).data.data;
}

function deliverableWriter<T>(action: 'submissions' | 'review' | 'publication' | 'outcome') {
  return async (id: string, unit: string, body: T, key: string) =>
    writer<T>(() => `/collaborations/${id}/deliverables/${unit}/${action}`)(id, body, key);
}

export const collaborationService = {
  async listCampaigns(): Promise<CampaignResponse[]> {
    const brand = await brandService.getMyBrand(true);
    if (!brand) return [];
    const campaigns: CampaignResponse[] = [];
    for (let page = 0; ; page++) {
      const result = await get<PageResponse<CampaignResponse>>(`/brands/${brand.id}/campaigns`, { page, size: 50 });
      campaigns.push(...result.items);
      if (page + 1 >= result.totalPages) return campaigns;
    }
  },
  async listBrand(campaignId: string, signal: AbortSignal) {
    const rows: CollaborationSummary[] = [];
    for (let page = 0; ; page++) {
      const result = await get<PageResponse<CollaborationSummary>>(
        `/campaigns/${campaignId}/collaborations`, { page, size: 50, sort: 'id,asc' }, signal,
      );
      rows.push(...result.items);
      if (page + 1 >= result.totalPages) return rows;
    }
  },
  listCreator: () => get<CollaborationSummary[]>('/creators/portal/collaborations'),
  pendingAssignments: () => get<PendingAssignment[]>('/creators/portal/collaborations/pending-assignments'),
  async acceptAssignment(id: string, body: Revision & { proposalRevision: number }, key: string) {
    return (await apiClient.post<ApiResponse<{ collaborationId: string }>>(
      `/creators/portal/collaborations/${id}/accept-assignment`, body, { headers: { 'Idempotency-Key': key } },
    )).data.data;
  },
  detail: (id: string) => get<CollaborationDetail>(`/collaborations/${id}`),
  execution: (id: string, signal?: AbortSignal) => get<ExecutionSnapshot>(`/collaborations/${id}/deliverables`, undefined, signal),
  async transition(campaignId: string, dealId: string, action: 'start' | 'cancel', body: Revision & { reason?: string }, key: string) {
    await apiClient.post(
      `/campaigns/${campaignId}/deals/${dealId}/${action}`, body, { headers: { 'Idempotency-Key': key } },
    );
  },
  setup: writer<Revision & LegacyPlan>(id => `/collaborations/${id}/execution-plan`),
  submit: deliverableWriter<Submission>('submissions'),
  decide: deliverableWriter<Decision>('review'),
  publish: deliverableWriter<Publication>('publication'),
  saveDeliverableOutcome: deliverableWriter<Revision & Omit<Measurement, 'deliverableId'> & { url?: string; reason?: string }>('outcome'),
  saveFinance: writer<Revision & Omit<OutcomeValues, 'posts' | 'resultNote'> & { reason?: string }>(id => `/collaborations/${id}/outcome/finance`),
  accept: writer<OutcomeRevision>(id => `/collaborations/${id}/outcome/accept`),
  reopen: writer<Revision & { reason: string }>(id => `/collaborations/${id}/outcome/reopen`),
  review: writer<OutcomeRevision & ReviewValues>(id => `/collaborations/${id}/review`),
  reviewLegacy: writer<Revision & ReviewValues>(id => `/collaborations/${id}/review/legacy`),
};
