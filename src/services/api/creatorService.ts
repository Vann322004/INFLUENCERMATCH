import { apiClient } from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';
import {
  CreatorItem,
  CreatorDetail,
  CreatorVectorSearchItem,
  RateCardResponse,
  ShortlistItem,
  AddShortlistItemPayload,
} from '../../types/api/creator.types';

export const creatorService = {
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
   * Lấy thông tin chi tiết của creator theo ID
   */
  async getCreatorById(id: string): Promise<CreatorDetail> {
    const response = await apiClient.get<ApiResponse<CreatorDetail>>(`/creators/${id}`);
    return response.data.data;
  },

  /**
   * Tìm kiếm creator bằng ngữ nghĩa / AI vector search
   */
  async searchSemantic(query: string, limit = 10): Promise<CreatorVectorSearchItem[]> {
    const response = await apiClient.get<ApiResponse<CreatorVectorSearchItem[]>>(
      `/creators/search/semantic`,
      {
        params: { q: query, limit },
      }
    );
    return response.data.data || [];
  },

  /**
   * Lấy bảng giá (rate card) của creator
   */
  async getRateCard(creatorId: string): Promise<RateCardResponse> {
    const response = await apiClient.get<ApiResponse<RateCardResponse>>(
      `/creators/${creatorId}/rate-card`
    );
    return response.data.data;
  },

  /**
   * Lấy danh mục các niches/ngành hàng
   */
  async getNiches(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/taxonomies/niches');
    return Array.isArray(response.data) ? response.data : [];
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
   * Lấy danh sách shortlist creator của một chiến dịch
   */
  async getShortlist(campaignId: string): Promise<ShortlistItem[]> {
    const response = await apiClient.get<ApiResponse<{ content?: ShortlistItem[]; items?: ShortlistItem[] }>>(
      `/campaigns/${campaignId}/shortlist`
    );
    const data = response.data.data;
    return (data?.content || data?.items || (Array.isArray(data) ? data : [])) as ShortlistItem[];
  },

  /**
   * Thêm creator vào danh sách shortlist của chiến dịch
   */
  async addToShortlist(campaignId: string, payload: AddShortlistItemPayload): Promise<ShortlistItem> {
    const response = await apiClient.post<ApiResponse<ShortlistItem>>(
      `/campaigns/${campaignId}/shortlist`,
      payload
    );
    return response.data.data;
  },

  /**
   * Xóa creator khỏi shortlist của chiến dịch
   */
  async removeFromShortlist(campaignId: string, shortlistItemId: string): Promise<void> {
    await apiClient.delete(`/campaigns/${campaignId}/shortlist/${shortlistItemId}`);
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
};
