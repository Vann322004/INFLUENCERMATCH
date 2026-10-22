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

export interface PageResponse<T> {
  items?: T[];
  content?: T[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const DEFAULT_CLAIMS: ClaimResponse[] = [
  {
    id: 'clm_001',
    creatorId: 'c84cddd9-4ea5-4963-9b55-10981f152c46',
    creatorHandle: '@linh.beauty',
    creatorName: 'Nguyễn Thị Linh',
    creatorPlatform: 'TikTok',
    creatorFollowers: 2400000,
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    claimantId: 'usr_003',
    claimantName: 'Nguyễn Thị Linh',
    claimantEmail: 'linh.beauty@gmail.com',
    claimantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    status: 'PENDING',
    submittedAt: '2026-10-21T18:30:00Z',
    evidenceType: 'TikTok Studio Screenshot & Business Card',
    evidenceUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    evidenceNote: 'Tôi là chủ sở hữu kênh @linh.beauty trên TikTok. Đính kèm ảnh chụp màn hình TikTok Creator Portal chứng minh quyền quản trị.',
  },
  {
    id: 'clm_002',
    creatorId: 'c84cddd9-4ea5-4963-9b55-10981f152c47',
    creatorHandle: '@tuantech',
    creatorName: 'Võ Minh Tuấn',
    creatorPlatform: 'YouTube',
    creatorFollowers: 1200000,
    creatorAvatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100',
    claimantId: 'usr_006',
    claimantName: 'Võ Minh Tuấn',
    claimantEmail: 'tuanvo.creator@tiktok.vn',
    status: 'APPROVED',
    submittedAt: '2026-10-18T10:15:00Z',
    reviewedAt: '2026-10-19T14:00:00Z',
    reviewedBy: 'Trần Minh Khoa (Admin)',
    evidenceType: 'YouTube Analytics Dashboard',
    evidenceUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    evidenceNote: 'Xác minh kênh YouTube công nghệ TuanTech.',
  },
  {
    id: 'clm_003',
    creatorId: 'c84cddd9-4ea5-4963-9b55-10981f152c48',
    creatorHandle: '@hungfood',
    creatorName: 'Phạm Quốc Hùng',
    creatorPlatform: 'Instagram',
    creatorFollowers: 890000,
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    claimantId: 'usr_008',
    claimantName: 'Trần Văn Hoàng',
    claimantEmail: 'hoang.agency@food.vn',
    status: 'REJECTED',
    submittedAt: '2026-10-15T09:00:00Z',
    reviewedAt: '2026-10-16T11:20:00Z',
    reviewedBy: 'Lê Văn Dũng (Admin)',
    reason: 'Bằng chứng không hợp lệ: Không có giấy ủy quyền đại diện từ creator chính chủ.',
    evidenceType: 'Agency Agreement',
    evidenceNote: 'Yêu cầu claim đại diện cho Hùng Food.',
  },
];

let memoryClaims: ClaimResponse[] = [...DEFAULT_CLAIMS];

/** GET /data/creator-claims — paginated list with optional filters */
const getClaims = async (params?: ClaimListParams): Promise<PageResponse<ClaimResponse>> => {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) cleaned[k] = v;
    });
  }

  try {
    const response = await apiClient.get<any>('/data/creator-claims', { params: cleaned });
    const payload = response.data?.data ?? response.data;
    const rawList = payload?.items ?? payload?.content ?? (Array.isArray(payload) ? payload : null);
    if (rawList && rawList.length > 0) {
      return {
        items: rawList,
        content: rawList,
        totalElements: payload?.totalElements ?? rawList.length,
        totalPages: payload?.totalPages ?? 1,
        number: payload?.page ?? 0,
        size: payload?.size ?? rawList.length,
      };
    }
  } catch (err) {
    console.warn('[claimService.getClaims] API error, falling back:', err);
  }

  let list = [...memoryClaims];
  if (params?.status) {
    list = list.filter(c => c.status === params.status);
  }
  if (params?.creatorId) {
    list = list.filter(c => c.creatorId === params.creatorId);
  }

  return {
    items: list,
    content: list,
    totalElements: list.length,
    totalPages: 1,
    number: 0,
    size: list.length,
  };
};

/** GET /data/creator-claims/{id} — single claim with full evidence */
const getClaimById = async (id: string): Promise<ClaimResponse> => {
  try {
    const response = await apiClient.get<any>(`/data/creator-claims/${id}`);
    const claim = response.data?.data ?? response.data;
    if (claim && claim.id) return claim;
  } catch (err) {
    console.warn(`[claimService.getClaimById] API error for ${id}:`, err);
  }
  return memoryClaims.find(c => c.id === id) || memoryClaims[0];
};

/** PATCH /data/creator-claims/{id}/review — approve or reject a pending claim */
const reviewClaim = async (id: string, payload: ReviewRequest): Promise<ClaimResponse> => {
  try {
    const response = await apiClient.patch<any>(`/data/creator-claims/${id}/review`, payload);
    const updated = response.data?.data ?? response.data;
    if (updated) {
      memoryClaims = memoryClaims.map(c => c.id === id ? updated : c);
      return updated;
    }
  } catch (err) {
    console.warn(`[claimService.reviewClaim] API error for ${id}:`, err);
  }

  let result: ClaimResponse | null = null;
  memoryClaims = memoryClaims.map(c => {
    if (c.id === id) {
      result = {
        ...c,
        status: payload.approved ? 'APPROVED' : 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Trần Minh Khoa (Admin)',
        reason: payload.reason,
      };
      return result;
    }
    return c;
  });

  return result || memoryClaims[0];
};

/** POST /data/creator-claims/{id}/revoke — revoke an approved claim */
const revokeClaim = async (id: string, payload: RevokeRequest): Promise<ClaimResponse> => {
  try {
    const response = await apiClient.post<any>(`/data/creator-claims/${id}/revoke`, payload);
    const updated = response.data?.data ?? response.data;
    if (updated) {
      memoryClaims = memoryClaims.map(c => c.id === id ? updated : c);
      return updated;
    }
  } catch (err) {
    console.warn(`[claimService.revokeClaim] API error for ${id}:`, err);
  }

  let result: ClaimResponse | null = null;
  memoryClaims = memoryClaims.map(c => {
    if (c.id === id) {
      result = {
        ...c,
        status: 'REVOKED',
        reason: payload.reason,
      };
      return result;
    }
    return c;
  });

  return result || memoryClaims[0];
};

/** POST /creators/{id}/claim — submit ownership claim for a creator profile */
const submitClaim = async (creatorId: string, payload: { evidenceUrls?: string[]; note?: string }): Promise<ClaimResponse> => {
  try {
    const response = await apiClient.post<any>(`/creators/${creatorId}/claim`, payload);
    return response.data?.data ?? response.data;
  } catch {
    const newClaim: ClaimResponse = {
      id: `clm_${Date.now()}`,
      creatorId,
      creatorHandle: '@current.creator',
      claimantId: 'usr_me',
      claimantName: 'Current User',
      claimantEmail: 'me@influencermatch.vn',
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      evidenceUrl: payload.evidenceUrls?.[0],
      evidenceNote: payload.note,
    };
    memoryClaims.unshift(newClaim);
    return newClaim;
  }
};

/** GET /creator-claims/me — get current logged-in user's claims */
const getMyClaims = async (): Promise<ClaimResponse[]> => {
  try {
    const response = await apiClient.get<any>('/creator-claims/me');
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return memoryClaims.filter(c => c.claimantId === 'usr_003');
};

export const claimService = {
  getClaims,
  getClaimById,
  reviewClaim,
  revokeClaim,
  submitClaim,
  getMyClaims,
};
