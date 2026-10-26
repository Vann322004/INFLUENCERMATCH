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
   * Helper: Lấy shortlist lưu trữ cục bộ cho chiến dịch
   */
  getLocalShortlist(campaignId: string): ShortlistItem[] {
    try {
      if (campaignId === 'all') {
        const all: ShortlistItem[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('IM_LOCAL_SHORTLIST_')) {
            try {
              const items: ShortlistItem[] = JSON.parse(localStorage.getItem(key) || '[]');
              all.push(...items);
            } catch {}
          }
        }
        return all;
      }
      const raw = localStorage.getItem(`IM_LOCAL_SHORTLIST_${campaignId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Helper: Lưu shortlist cục bộ cho chiến dịch
   */
  saveLocalShortlist(campaignId: string, items: ShortlistItem[]): void {
    try {
      localStorage.setItem(`IM_LOCAL_SHORTLIST_${campaignId}`, JSON.stringify(items));
    } catch {}
  },

  /**
   * Lấy danh sách shortlist creator của một chiến dịch (kết hợp đồng bộ API backend và cache cục bộ)
   */
  async getShortlist(campaignId: string): Promise<ShortlistItem[]> {
    let serverList: ShortlistItem[] = [];
    if (campaignId && campaignId !== 'all') {
      try {
        const response = await apiClient.get<ApiResponse<any>>(
          `/campaigns/${campaignId}/shortlist`
        );
        const raw = response.data;
        const d = (raw as any)?.data ?? raw;
        const list = Array.isArray(d) ? d : (d?.content || d?.items || []);
        serverList = (list || []).map((it: any) => ({
          id: it.id || it.shortlistItemId || `sl-${it.creatorId}`,
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
      } catch (err) {
        console.warn(`[creatorService] getShortlist từ backend không thành công, sử dụng dữ liệu cục bộ:`, err);
      }
    }

    // Kết hợp với danh sách đã lưu trữ cục bộ
    const localList = this.getLocalShortlist(campaignId);
    const mergedMap = new Map<string, ShortlistItem>();

    // Ưu tiên đưa localList vào trước
    localList.forEach((it) => {
      const key = it.creatorId || it.id;
      if (key) mergedMap.set(key, it);
    });

    // Cập nhật đè serverList lên để có thông tin mới nhất từ backend
    serverList.forEach((it) => {
      const key = it.creatorId || it.id;
      if (key) mergedMap.set(key, it);
    });

    const finalResult = Array.from(mergedMap.values());
    if (campaignId && campaignId !== 'all' && serverList.length > 0) {
      this.saveLocalShortlist(campaignId, finalResult);
    }
    return finalResult;
  },

  /**
   * Thêm creator vào danh sách shortlist của chiến dịch
   */
  async addToShortlist(campaignId: string, payload: AddShortlistItemPayload): Promise<ShortlistItem> {
    const localItem: ShortlistItem = {
      id: `local-sl-${Date.now()}`,
      campaignId,
      creatorId: payload.creatorId,
      creatorName: payload.creatorName || 'Creator',
      avatarUrl: payload.avatarUrl,
      platform: payload.platform || 'tiktok',
      followers: payload.followers || 0,
      engagementRate: payload.engagementRate || 0,
      niche: payload.niche,
      priority: payload.priority || 'HIGH',
      note: payload.note || '',
      addedAt: new Date().toISOString(),
      status: 'SAVED',
    };

    // Lưu vào local cache ngay lập tức để UI cập nhật không bị mất
    const localList = this.getLocalShortlist(campaignId);
    const existingIndex = localList.findIndex(
      (it) => it.creatorId === payload.creatorId
    );
    if (existingIndex >= 0) {
      localList[existingIndex] = { ...localList[existingIndex], ...localItem };
    } else {
      localList.unshift(localItem);
    }
    this.saveLocalShortlist(campaignId, localList);

    // Gửi request lên Backend
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/campaigns/${campaignId}/shortlist`,
        {
          creatorId: payload.creatorId,
          priority: payload.priority,
          note: payload.note,
        }
      );
      const serverData = response.data?.data || response.data;
      if (serverData?.id) {
        localItem.id = serverData.id;
        this.saveLocalShortlist(campaignId, localList);
      }
      return serverData?.id ? serverData : localItem;
    } catch (err) {
      console.warn(`[creatorService] Backend addToShortlist lỗi/chưa có campaign trong DB, dùng local fallback:`, err);
      return localItem;
    }
  },

  /**
   * Xóa creator khỏi shortlist của chiến dịch
   */
  async removeFromShortlist(campaignId: string, shortlistItemId: string): Promise<void> {
    const localList = this.getLocalShortlist(campaignId);
    const filtered = localList.filter((it) => it.id !== shortlistItemId && it.creatorId !== shortlistItemId);
    this.saveLocalShortlist(campaignId, filtered);

    try {
      await apiClient.delete(`/campaigns/${campaignId}/shortlist/${shortlistItemId}`);
    } catch (err) {
      console.warn('[creatorService] Backend removeFromShortlist lỗi:', err);
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
