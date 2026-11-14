import { apiClient } from '../apiClient';
import { shortlistService } from './shortlistService';
import { createAdminQuery } from '../adminCache';
import type { ApiResponse } from '../../types/api/common.types';
import type {
  CreatorItem,
  CreatorDetail,
  CreatorVectorSearchItem,
  RateCardResponse,
  ShortlistItem,
  SendInvitationRequest,
  InvitationResponse,
  DiscoverCreatorsParams,
  CreatorDiscoveryPageResponse,
} from '../../types/api/creator.types';

const getCreators = createAdminQuery('creators:list', async (): Promise<CreatorItem[]> => {
    const response = await apiClient.get<ApiResponse<CreatorItem[]>>('/creators');
    const payload = response.data;
    const items = payload?.data ?? payload;
    if (payload?.success === false || !Array.isArray(items) || items.some(item => !item || typeof item.id !== 'string')) {
      throw new Error('Invalid creator list response.');
    }
    try {
      const withAvatars = items.filter(c => typeof c.avatarUrl === 'string' && c.avatarUrl.startsWith('http'));
      localStorage.setItem('IM_SHOWCASE_CREATORS', JSON.stringify(withAvatars.slice(0, 6)));
    } catch { /* Storage is optional. */ }
    return items;
  }, { tags: ['admin-creators'] });

export const creatorService = {
  /**
   * Khám phá Creator cho chiến dịch qua 4-Stage Hybrid Discovery Pipeline
   * Swagger Tag: "Creator Discovery"
   * GET /campaigns/{campaignId}/discovery
   * OperationId: discoverCreators
   * Summary: Discover creators for campaign
   * Description: Executes the 4-Stage Hybrid Discovery Pipeline (Hard Filters + Semantic & FTS Search + Rank Fusion + Fallback) to find creators.
   * Query params: keyword, niche, minFollowers, maxFollowers, page, size
   */
  async discoverCreators(
    campaignId: string,
    params?: DiscoverCreatorsParams
  ): Promise<CreatorDiscoveryPageResponse> {
    const response = await apiClient.get<ApiResponse<CreatorDiscoveryPageResponse>>(
      `/campaigns/${campaignId}/discovery`,
      { params }
    );
    return response.data?.data || (response.data as unknown as CreatorDiscoveryPageResponse);
  },
  /**
   * Lấy danh sách toàn bộ creator công khai
   */
  getCreators,

  /**
   * Lấy thông tin chi tiết của creator theo ID (GET /creators/{id})
   */
  async getCreatorById(id: string): Promise<CreatorDetail> {
    const response = await apiClient.get<ApiResponse<CreatorDetail>>(`/creators/${id}`);
    const payload = response.data;
    const detail = payload?.data ?? payload as unknown as CreatorDetail;
    if (payload?.success === false || !detail || typeof detail.id !== 'string') {
      throw new Error('Invalid creator detail response.');
    }
    return detail;
  },

  /**
   * Tìm kiếm creator bằng ngữ nghĩa / AI vector search
   * GET /creators/search/semantic?q={keyword}&limit=20 (Model BKAI 768-dim pgvector)
   */
  async searchSemantic(query: string, limit = 20): Promise<CreatorVectorSearchItem[]> {
    const response = await apiClient.get<ApiResponse<CreatorVectorSearchItem[]>>(
      `/creators/search/semantic`,
      {
        params: { q: query, limit },
      }
    );
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Lấy bảng giá (rate card) của creator (GET /creators/{id}/rate-card)
   */
  async getRateCard(creatorId: string): Promise<RateCardResponse> {
    const response = await apiClient.get<ApiResponse<RateCardResponse>>(
      `/creators/${creatorId}/rate-card`
    );
    return response.data?.data || (response.data as unknown as RateCardResponse);
  },

  /**
   * Lấy danh mục các niches/ngành hàng chuẩn (GET /taxonomies/niches)
   */
  async getNiches(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/taxonomies/niches');
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    } catch (err) {
      console.warn('[creatorService] Lỗi khi tải /taxonomies/niches:', err);
      return [];
    }
  },

  /**
   * Gửi yêu cầu claim hồ sơ creator
   */
  async claimCreator(creatorId: string, evidence: Record<string, unknown>): Promise<void> {
    await apiClient.post(`/creators/${creatorId}/claim`, evidence);
  },

  /**
   * Lấy danh sách yêu cầu claim của tài khoản hiện tại
   */
  async getMyClaims(): Promise<unknown[]> {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/creator-claims/me');
    return response.data.data || [];
  },

  /**
   * Read every backend page for existing consumers of the array contract.
   */
  async getShortlist(campaignId: string): Promise<ShortlistItem[]> {
    return (await shortlistService.all(campaignId)).map(item => ({ ...item,
      creatorName: item.creatorName ?? '', addedAt: item.addedAt ?? '', note: item.note ?? undefined,
      platform: item.platform ?? undefined, avatarUrl: item.avatarUrl ?? undefined,
      followers: item.followers ?? undefined, engagementRate: item.engagementRate ?? undefined, niche: item.niche ?? undefined,
    }));
  },
  addToShortlist: shortlistService.add,
  updateShortlist: shortlistService.update,
  removeFromShortlist: shortlistService.remove,
  compareShortlist: shortlistService.compare,

  async sendInvitation(creatorId: string, payload: SendInvitationRequest): Promise<InvitationResponse> {
    const response = await apiClient.post<ApiResponse<InvitationResponse>>(
      `/creators/${creatorId}/invite`,
      { creatorId, ...payload }
    );
    return response.data?.data || (response.data as unknown as InvitationResponse);
  },
};
