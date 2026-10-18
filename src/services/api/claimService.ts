// =============================================
// CLAIM SERVICE - InfluencerMatch
// Covers: /data/creator-claims (Admin/Data Manager)
// =============================================

import apiClient from '../apiClient';
import type {
  ClaimResponse,
  ClaimListParams,
  ReviewRequest,
  RevokeRequest,
} from '../../types/api/claim.types';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** GET /data/creator-claims — paginated list with optional filters */
const getClaims = async (params?: ClaimListParams): Promise<PageResponse<ClaimResponse>> => {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) cleaned[k] = v;
    });
  }
  const response = await apiClient.get<ApiResponse<PageResponse<ClaimResponse>>>(
    '/data/creator-claims',
    { params: cleaned }
  );
  return response.data.data;
};

/** GET /data/creator-claims/{id} — single claim with full evidence */
const getClaimById = async (id: string): Promise<ClaimResponse> => {
  const response = await apiClient.get<ApiResponse<ClaimResponse>>(
    `/data/creator-claims/${id}`
  );
  return response.data.data;
};

/** PATCH /data/creator-claims/{id}/review — approve or reject a pending claim */
const reviewClaim = async (id: string, payload: ReviewRequest): Promise<ClaimResponse> => {
  const response = await apiClient.patch<ApiResponse<ClaimResponse>>(
    `/data/creator-claims/${id}/review`,
    payload
  );
  return response.data.data;
};

/** POST /data/creator-claims/{id}/revoke — revoke an approved claim */
const revokeClaim = async (id: string, payload: RevokeRequest): Promise<ClaimResponse> => {
  const response = await apiClient.post<ApiResponse<ClaimResponse>>(
    `/data/creator-claims/${id}/revoke`,
    payload
  );
  return response.data.data;
};

/** POST /creators/{id}/claim — submit ownership claim for a creator profile */
const submitClaim = async (creatorId: string, payload: { evidenceUrls?: string[]; note?: string }): Promise<ClaimResponse> => {
  const response = await apiClient.post<ApiResponse<ClaimResponse>>(
    `/creators/${creatorId}/claim`,
    payload
  );
  return response.data.data;
};

/** GET /creator-claims/me — get current logged-in user's claims */
const getMyClaims = async (): Promise<ClaimResponse[]> => {
  const response = await apiClient.get<ApiResponse<ClaimResponse[]>>(
    '/creator-claims/me'
  );
  return response.data.data;
};

export const claimService = {
  getClaims,
  getClaimById,
  reviewClaim,
  revokeClaim,
  submitClaim,
  getMyClaims,
};
