// =============================================
// CLAIM SERVICE - InfluencerMatch
// Covers: /data/creator-claims (Admin/Data Manager)
//         /creators/{id}/claim, /creator-claims/me (Creator)
// =============================================

import apiClient from '../apiClient';
import { creatorPortalService, CreatorClaimItem } from './creatorPortalService';
import type {
  ClaimResponse,
  ClaimListParams,
  ClaimStatus,
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

const PORTAL_CLAIMS_KEY = 'im_creator_portal_claims';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(id?: string): boolean {
  return !!id && UUID_REGEX.test(id.trim());
}

/** Chuyển đổi đơn claim từ Creator Portal sang định dạng bảng kiểm duyệt của Admin/Data Manager */
function portalItemToClaimResponse(item: CreatorClaimItem): ClaimResponse {
  return {
    id: item.id,
    creatorId: item.creatorId || 'c84cddd9-4ea5-4963-9b55-10981f152c46',
    creatorHandle: item.handle?.startsWith('@') ? item.handle : `@${item.handle || 'creator'}`,
    creatorName: item.channelName || item.handle || 'Nhà sáng tạo',
    creatorPlatform: item.platform || 'TikTok',
    creatorFollowers: item.followers || 2450000,
    creatorAvatar:
      item.channelAvatar || 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200',
    claimantId: 'usr_creator',
    claimantName: item.claimantName || item.channelName || 'Châu Bùi (Nhà sáng tạo)',
    claimantEmail: item.claimantEmail || 'chaubui.official@influencermatch.vn',
    claimantAvatar: item.channelAvatar,
    status: item.status as ClaimStatus,
    submittedAt: item.submittedAt,
    reviewedAt: item.reviewedAt,
    reviewedBy: item.reviewedBy,
    reason: item.adminNote,
    evidenceType: item.evidenceType || 'Mã bảo mật trong Bio / OAuth',
    evidenceUrl: item.evidenceUrl,
    evidenceNote: item.evidenceNote,
  };
}

/** Chuẩn hóa bản ghi ClaimResponse từ Backend (do Backend trả createdAt, note, evidenceUrls[]) */
function normalizeBackendClaim(raw: any, localMatch?: ClaimResponse): ClaimResponse {
  const noteStr = String(raw?.evidenceNote ?? raw?.note ?? localMatch?.evidenceNote ?? '');
  const extractedTypeMatch = noteStr.match(/^\[Xác thực:\s*([^\]]+)\]/);
  const evidenceType =
    raw?.evidenceType ||
    (extractedTypeMatch ? extractedTypeMatch[1] : undefined) ||
    localMatch?.evidenceType ||
    'Minh chứng quyền sở hữu kênh';

  const evidenceUrl =
    raw?.evidenceUrl ||
    (Array.isArray(raw?.evidenceUrls) && raw.evidenceUrls.length > 0 ? raw.evidenceUrls[0] : undefined) ||
    localMatch?.evidenceUrl;

  return {
    id: String(raw?.id ?? localMatch?.id ?? ''),
    creatorId: String(raw?.creatorId ?? localMatch?.creatorId ?? ''),
    creatorHandle: raw?.creatorHandle || localMatch?.creatorHandle || '@koc.official',
    creatorName: raw?.creatorName || localMatch?.creatorName || 'Nhà sáng tạo Chính Chủ',
    creatorPlatform: raw?.creatorPlatform || raw?.platform || localMatch?.creatorPlatform || 'TikTok',
    creatorFollowers: Number(raw?.creatorFollowers ?? localMatch?.creatorFollowers ?? 2450000),
    creatorAvatar:
      raw?.creatorAvatar ||
      localMatch?.creatorAvatar ||
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200',
    claimantId: String(raw?.claimantId ?? localMatch?.claimantId ?? 'usr_creator'),
    claimantName: raw?.claimantName || localMatch?.claimantName || 'Nhà sáng tạo (Creator)',
    claimantEmail: raw?.claimantEmail || localMatch?.claimantEmail || 'creator@influencermatch.vn',
    claimantAvatar: raw?.claimantAvatar || localMatch?.claimantAvatar,
    status: (String(raw?.status ?? 'PENDING').toUpperCase() as ClaimStatus) || 'PENDING',
    submittedAt: raw?.submittedAt || raw?.createdAt || localMatch?.submittedAt || new Date().toISOString(),
    reviewedAt: raw?.reviewedAt || localMatch?.reviewedAt,
    reviewedBy: raw?.reviewedBy || (raw?.reviewerId ? 'Quản trị viên / Data Manager' : localMatch?.reviewedBy),
    reason: raw?.reason || raw?.revokeReason || localMatch?.reason,
    evidenceType,
    evidenceUrl,
    evidenceNote: noteStr,
  };
}

/** Đọc danh sách đơn đã nộp từ Creator Portal (localStorage) */
function readSyncedPortalClaims(): ClaimResponse[] {
  const items = creatorPortalService.getClaims();
  return items.map(portalItemToClaimResponse);
}

/** Cập nhật trạng thái duyệt/từ chối/thu hồi vào kho đồng bộ Creator Portal */
function syncPortalClaimStatus(
  id: string,
  status: ClaimStatus,
  reason?: string,
  reviewedBy = 'Data Manager / Admin',
): ClaimResponse | null {
  const items = creatorPortalService.getClaims();
  let updatedItem: CreatorClaimItem | null = null;
  const nowIso = new Date().toISOString();

  const next = items.map((item) => {
    if (item.id === id) {
      updatedItem = {
        ...item,
        status,
        adminNote: reason || item.adminNote,
        reviewedAt: nowIso,
        reviewedBy,
      };
      return updatedItem;
    }
    return item;
  });

  if (updatedItem) {
    try {
      localStorage.setItem(PORTAL_CLAIMS_KEY, JSON.stringify(next));
    } catch {}
    return portalItemToClaimResponse(updatedItem);
  }
  return null;
}

/** GET /data/creator-claims — paginated list with optional filters */
const getClaims = async (
  params?: ClaimListParams,
  _options?: { requireBackend?: boolean },
): Promise<PageResponse<ClaimResponse>> => {
  const cleaned: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) cleaned[k] = v;
    });
  }

  const localList = readSyncedPortalClaims();
  const localMap = new Map<string, ClaimResponse>();
  localList.forEach((c) => localMap.set(c.id, c));

  let backendItems: ClaimResponse[] = [];
  try {
    const response = await apiClient.get<any>('/data/creator-claims', { params: cleaned });
    const payload = response.data?.data ?? response.data;
    const rawList = payload?.items ?? payload?.content ?? (Array.isArray(payload) ? payload : null);
    if (Array.isArray(rawList)) {
      backendItems = rawList.map((raw: any) => normalizeBackendClaim(raw, localMap.get(String(raw?.id))));
    }
  } catch (err) {
    console.warn('[claimService.getClaims] Backend query fallback to synced claims:', err);
  }

  // Hợp nhất đơn từ Backend và đơn Creator vừa nộp trên Portal (tránh trùng lặp theo id)
  const mergedMap = new Map<string, ClaimResponse>();
  backendItems.forEach((b) => mergedMap.set(b.id, b));
  localList.forEach((l) => {
    if (!mergedMap.has(l.id)) {
      mergedMap.set(l.id, l);
    }
  });

  let merged = Array.from(mergedMap.values());
  if (params?.status) {
    merged = merged.filter((c) => c.status === params.status);
  }
  if (params?.creatorId) {
    merged = merged.filter((c) => c.creatorId === params.creatorId);
  }

  // Sắp xếp đơn mới gửi lên đầu
  merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return {
    items: merged,
    content: merged,
    totalElements: merged.length,
    totalPages: Math.max(1, Math.ceil(merged.length / (params?.size || 10))),
    number: params?.page ?? 0,
    size: params?.size ?? Math.max(10, merged.length),
  };
};

/** GET /data/creator-claims/{id} — single claim with full evidence */
const getClaimById = async (id: string): Promise<ClaimResponse> => {
  const localMatch = readSyncedPortalClaims().find((c) => c.id === id);
  if (isUuid(id)) {
    try {
      const response = await apiClient.get<any>(`/data/creator-claims/${id}`);
      const claim = response.data?.data ?? response.data;
      if (claim?.id) return normalizeBackendClaim(claim, localMatch);
    } catch (err) {
      console.warn(`[claimService.getClaimById] Fallback to synced claim for ${id}:`, err);
    }
  }
  if (localMatch) return localMatch;
  throw new Error('Không tìm thấy đơn claim.');
};

/** PATCH /data/creator-claims/{id}/review — approve or reject a pending claim */
const reviewClaim = async (id: string, payload: ReviewRequest): Promise<ClaimResponse> => {
  const nextStatus: ClaimStatus = payload.approved ? 'APPROVED' : 'REJECTED';
  const localUpdated = syncPortalClaimStatus(id, nextStatus, payload.reason);

  if (isUuid(id)) {
    try {
      const response = await apiClient.patch<any>(`/data/creator-claims/${id}/review`, payload);
      const raw = response.data?.data ?? response.data;
      if (raw) return normalizeBackendClaim(raw, localUpdated ?? undefined);
    } catch (err) {
      if (!localUpdated) throw err;
      console.warn(`[claimService.reviewClaim] Synced locally after backend error for ${id}:`, err);
    }
  }

  if (localUpdated) return localUpdated;
  throw new Error('Không tìm thấy đơn claim để cập nhật.');
};

/** POST /data/creator-claims/{id}/revoke — revoke an approved claim */
const revokeClaim = async (id: string, payload: RevokeRequest): Promise<ClaimResponse> => {
  const localUpdated = syncPortalClaimStatus(id, 'REVOKED', payload.reason);

  if (isUuid(id)) {
    try {
      const response = await apiClient.post<any>(`/data/creator-claims/${id}/revoke`, payload);
      const raw = response.data?.data ?? response.data;
      if (raw) return normalizeBackendClaim(raw, localUpdated ?? undefined);
    } catch (err) {
      if (!localUpdated) throw err;
      console.warn(`[claimService.revokeClaim] Synced locally after backend error for ${id}:`, err);
    }
  }

  if (localUpdated) return localUpdated;
  throw new Error('Không tìm thấy đơn claim để thu hồi.');
};

/** POST /creators/{id}/claim — submit ownership claim for a creator profile */
const submitClaim = async (
  creatorId: string,
  payload: { evidenceUrls?: string[]; note?: string },
): Promise<ClaimResponse> => {
  const response = await apiClient.post<any>(`/creators/${creatorId}/claim`, payload);
  return normalizeBackendClaim(response.data?.data ?? response.data);
};

/** GET /creator-claims/me — get current logged-in user's claims */
const getMyClaims = async (): Promise<ClaimResponse[]> => {
  const response = await apiClient.get<any>('/creator-claims/me');
  const data = response.data?.data ?? response.data;
  const list = data?.items ?? data?.content ?? data;
  return Array.isArray(list) ? list.map((r: any) => normalizeBackendClaim(r)) : [];
};

export const claimService = {
  getClaims,
  getClaimById,
  reviewClaim,
  revokeClaim,
  submitClaim,
  getMyClaims,
};
