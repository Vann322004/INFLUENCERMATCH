import apiClient from '../apiClient';
import { readPage } from './pageResponse';
import type { ClaimResponse, ClaimListParams, ReviewRequest, RevokeRequest } from '../../types/api/claim.types';

function normalize(raw: any): ClaimResponse {
  if (!raw || typeof raw.id !== 'string' || typeof raw.creatorId !== 'string' ||
      typeof raw.claimantId !== 'string' || !['PENDING','APPROVED','REJECTED','REVOKED'].includes(raw.status)) {
    throw new Error('Hồ sơ nhận kênh không hợp lệ.');
  }
  return {
    id: raw.id, creatorId: raw.creatorId, claimantId: raw.claimantId,
    creatorHandle: raw.creatorHandle, creatorName: raw.creatorName,
    creatorPlatform: raw.creatorPlatform ?? raw.platform, creatorAvatar: raw.creatorAvatar,
    creatorFollowers: typeof raw.creatorFollowers === 'number' ? raw.creatorFollowers : undefined,
    claimantName: raw.claimantName, claimantEmail: raw.claimantEmail, claimantAvatar: raw.claimantAvatar,
    status: raw.status, submittedAt: raw.createdAt ?? raw.submittedAt ?? '',
    reviewedAt: raw.reviewedAt, reviewedBy: raw.reviewerId ?? raw.reviewedBy,
    reason: raw.revokeReason ?? raw.reason,
    evidenceUrl: raw.evidenceUrls?.[0] ?? raw.evidenceUrl,
    evidenceUrls: Array.isArray(raw.evidenceUrls) ? raw.evidenceUrls : [],
    evidenceNote: raw.note ?? raw.evidenceNote, evidenceType: raw.evidenceType,
  };
}
const getClaims = async (params?: ClaimListParams, _options?: { requireBackend?: boolean }) => {
  const response = await apiClient.get('/data/creator-claims', { params });
  const page = readPage<any>(response.data);
  const items = page.items.map(normalize);
  return { ...page, items, content: items, number: page.page };
};
const getClaimById = async (id: string): Promise<ClaimResponse> => {
  const response = await apiClient.get('/data/creator-claims/' + encodeURIComponent(id));
  return normalize(response.data?.data ?? response.data);
};
const reviewClaim = async (id: string, payload: ReviewRequest): Promise<ClaimResponse> => {
  if (!payload.reason.trim()) throw new Error('Vui lòng nhập lý do quyết định.');
  const response = await apiClient.patch('/data/creator-claims/' + encodeURIComponent(id) + '/review',
    { decision: payload.approved ? 'APPROVED' : 'REJECTED', reason: payload.reason.trim() });
  return normalize(response.data?.data ?? response.data);
};
const revokeClaim = async (id: string, payload: RevokeRequest): Promise<ClaimResponse> => {
  const response = await apiClient.post('/data/creator-claims/' + encodeURIComponent(id) + '/revoke', payload);
  return normalize(response.data?.data ?? response.data);
};
const submitClaim = async (creatorId: string, payload: { evidenceUrls?: string[]; note?: string }): Promise<ClaimResponse> => {
  const response = await apiClient.post('/creators/' + encodeURIComponent(creatorId) + '/claim', payload);
  return normalize(response.data?.data ?? response.data);
};
const getMyClaims = async (): Promise<ClaimResponse[]> => {
  const response = await apiClient.get('/creator-claims/me');
  const data = response.data?.data ?? response.data;
  const list = data?.items ?? data?.content ?? data;
  if (!Array.isArray(list)) throw new Error('Danh sách yêu cầu nhận kênh không hợp lệ.');
  return list.map(normalize);
};
export const claimService = { getClaims, getClaimById, reviewClaim, revokeClaim, submitClaim, getMyClaims };
