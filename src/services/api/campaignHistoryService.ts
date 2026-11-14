import apiClient from '../apiClient';
import type { ApiResponse, PageResponse } from '../../types/api/common.types';
import type { CollaborationStatus } from '../../types/api/collaboration.types';
import type {
  BriefPreview, DuplicateBriefRequest, DuplicateBriefResult, HistoryCampaignItem,
  HistoryCollaborationDetail, HistoryCollaborationItem, HistoryContext, HistoryDetail, HistoryFilters,
} from '../../types/api/campaignHistory.types';

async function get<T>(url: string, signal: AbortSignal, params?: object): Promise<T> {
  return (await apiClient.get<ApiResponse<T>>(url, { signal, params })).data.data;
}

export const campaignHistoryService = {
  list: (filters: HistoryFilters, signal: AbortSignal) =>
    get<PageResponse<HistoryCampaignItem>>('/campaign-history', signal, filters),
  detail: (id: string, signal: AbortSignal) => get<HistoryDetail>(`/campaigns/${id}/history`, signal),
  contexts: (id: string, page: number, signal: AbortSignal) =>
    get<PageResponse<HistoryContext>>(`/campaigns/${id}/history/contexts`, signal, { page, size: 20 }),
  collaborations: (id: string, page: number, status: CollaborationStatus | undefined, signal: AbortSignal) =>
    get<PageResponse<HistoryCollaborationItem>>(`/campaigns/${id}/history/collaborations`, signal, { page, size: 20, status }),
  collaboration: (id: string, collaborationId: string, signal: AbortSignal) =>
    get<HistoryCollaborationDetail>(`/campaigns/${id}/history/collaborations/${collaborationId}`, signal),
  preview: (id: string, contextId: string | undefined, signal: AbortSignal) =>
    get<BriefPreview>(`/campaigns/${id}/duplicate-brief/preview`, signal, { contextId }),
  async duplicate(id: string, payload: DuplicateBriefRequest, key: string) {
    return (await apiClient.post<ApiResponse<DuplicateBriefResult>>(`/campaigns/${id}/duplicate-brief`, payload, {
      headers: { 'Idempotency-Key': key },
    })).data.data;
  },
};
