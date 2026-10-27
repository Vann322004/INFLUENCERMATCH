import { apiClient } from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';
import {
  CreatorItem,
  CreatorDetail,
  CreatorVectorSearchItem,
  RateCardResponse,
  ShortlistItem,
  AddShortlistItemPayload,
  SendInvitationRequest,
  InvitationResponse,
  DiscoverCreatorsParams,
  CreatorDiscoveryPageResponse,
} from '../../types/api/creator.types';

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
  async getCreators(): Promise<CreatorItem[]> {
    const response = await apiClient.get<ApiResponse<CreatorItem[]>>('/creators');
    const items = response.data.data || [];
    if (Array.isArray(items) && items.length > 0) {
      try {
        const withAvatars = items.filter((c) => c.avatarUrl && c.avatarUrl.trim().startsWith('http'));
        if (withAvatars.length > 0) {
          localStorage.setItem('IM_SHOWCASE_CREATORS', JSON.stringify(withAvatars.slice(0, 6)));
        }
      } catch {
        // ignore storage quota error
      }
    }
    return items;
  },

  /**
   * Lấy thông tin chi tiết của creator theo ID (GET /creators/{id})
   */
  async getCreatorById(id: string): Promise<CreatorDetail> {
    const response = await apiClient.get<ApiResponse<CreatorDetail>>(`/creators/${id}`);
    return response.data?.data || (response.data as unknown as CreatorDetail);
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
   * Dọn dẹp cache cục bộ cũ để đảm bảo Database là nguồn dữ liệu duy nhất
   */
  clearLegacyLocalShortlist(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('IM_LOCAL_SHORTLIST_') || key.startsWith('IM_SHORTLIST_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  },

  /**
   * Helper tương thích cũ (Vô hiệu hóa cache cục bộ để 100% dữ liệu Shortlist được lấy trực tiếp từ Database)
   */
  getLocalShortlist(_campaignId: string): ShortlistItem[] {
    return [];
  },

  /**
   * Helper tương thích cũ (Không lưu vào localStorage để tránh lệch dữ liệu giữa các máy và Database)
   */
  saveLocalShortlist(_campaignId: string, _items: ShortlistItem[]): void {
    // Không ghi vào localStorage
  },

  /**
   * Lấy danh sách shortlist creator của một chiến dịch từ Backend Database
   * Swagger: GET /campaigns/{campaignId}/shortlist
   */
  async getShortlist(campaignId: string): Promise<ShortlistItem[]> {
    if (!campaignId || campaignId === 'all') {
      return [];
    }

    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/campaigns/${campaignId}/shortlist`,
        { params: { page: 0, size: 100 } }
      );
      const raw = response.data;
      const d = (raw as any)?.data ?? raw;
      const list = Array.isArray(d) ? d : (d?.content || d?.items || []);

      return (list || []).map((it: any) => ({
        id: it.id || it.shortlistItemId || it.creatorId,
        campaignId: it.campaignId || campaignId,
        creatorId: it.creatorId || it.id,
        creatorName: it.creatorName || it.displayName || it.name || 'Creator',
        avatarUrl: it.avatarUrl || it.avatar,
        platform: it.platform || 'tiktok',
        followers: it.followers || 0,
        engagementRate: it.engagementRate || 0,
        niche: it.niche,
        priority: it.priority || 'HIGH',
        note: it.note || '',
        addedAt: it.addedAt || new Date().toISOString(),
        status: it.status || 'SAVED',
      }));
    } catch {
      // Backend shortlist trống hoặc trả mã lỗi, fallback về mảng rỗng nhẹ nhàng
      return [];
    }
  },

  /**
   * Thêm creator vào danh sách shortlist của chiến dịch và lưu trực tiếp xuống Database
   * Swagger: POST /campaigns/{campaignId}/shortlist (hoặc /campaigns/{campaignId}/shortlist/items)
   */
  async addToShortlist(campaignId: string, payload: AddShortlistItemPayload): Promise<ShortlistItem> {
    const requestBody = {
      creatorId: payload.creatorId,
      priority: payload.priority || 'HIGH',
      note: payload.note || '',
      source: 'MANUAL_DISCOVERY',
    };

    let serverData: any = null;
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/campaigns/${campaignId}/shortlist`,
        requestBody
      );
      serverData = response.data?.data || response.data;
    } catch (err: any) {
      // Fallback thử endpoint phụ /items nếu backend cấu hình theo REST resource
      try {
        const response2 = await apiClient.post<ApiResponse<any>>(
          `/campaigns/${campaignId}/shortlist/items`,
          requestBody
        );
        serverData = response2.data?.data || response2.data;
      } catch (innerErr: any) {
        console.error(`[creatorService] Backend addToShortlist thất bại khi lưu vào DB:`, innerErr || err);
        throw innerErr || err;
      }
    }

    return {
      id: serverData?.id || payload.creatorId,
      campaignId: serverData?.campaignId || campaignId,
      creatorId: serverData?.creatorId || payload.creatorId,
      creatorName: serverData?.creatorName || payload.creatorName || 'Creator',
      avatarUrl: serverData?.avatarUrl || payload.avatarUrl,
      platform: serverData?.platform || payload.platform || 'tiktok',
      followers: serverData?.followers ?? payload.followers ?? 0,
      engagementRate: serverData?.engagementRate ?? payload.engagementRate ?? 0,
      niche: serverData?.niche || payload.niche,
      priority: serverData?.priority || payload.priority || 'HIGH',
      note: serverData?.note || payload.note || '',
      addedAt: serverData?.addedAt || new Date().toISOString(),
      status: serverData?.status || 'SAVED',
    };
  },

  /**
   * Xóa creator khỏi shortlist của chiến dịch trong Database
   * Swagger: DELETE /campaigns/{campaignId}/shortlist/{shortlistItemId}
   */
  async removeFromShortlist(campaignId: string, shortlistItemId: string): Promise<void> {
    try {
      await apiClient.delete(`/campaigns/${campaignId}/shortlist/${shortlistItemId}`);
    } catch (err: any) {
      try {
        await apiClient.delete(`/campaigns/${campaignId}/shortlist/items/${shortlistItemId}`);
      } catch (innerErr: any) {
        console.error('[creatorService] Backend removeFromShortlist lỗi khi xóa khỏi DB:', innerErr || err);
        throw innerErr || err;
      }
    }
  },

  /**
   * So sánh danh sách creator trong shortlist của chiến dịch
   */
  async compareShortlist(campaignId: string, creatorIds: string[]): Promise<unknown> {
    const response = await apiClient.post(
      `/campaigns/${campaignId}/shortlist/compare`,
      { creatorIds }
    );
    return response.data;
  },

  /**
   * Gửi lời mời tham gia chiến dịch tới Creator (POST /creators/{id}/invite)
   */
  async sendInvitation(creatorId: string, payload: SendInvitationRequest): Promise<InvitationResponse> {
    const response = await apiClient.post<ApiResponse<InvitationResponse>>(
      `/creators/${creatorId}/invite`,
      { creatorId, ...payload }
    );
    return response.data?.data || (response.data as unknown as InvitationResponse);
  },
};

// Tự động dọn dẹp các key cache cục bộ cũ để đảm bảo 100% dữ liệu đồng bộ từ Database
try {
  creatorService.clearLegacyLocalShortlist();
} catch {}

