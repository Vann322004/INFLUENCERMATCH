import { apiClient } from '../apiClient';
import { ApiResponse, PageResponse } from '../../types/api/common.types';
import {
  CampaignRequest,
  CampaignResponse,
  CampaignStatus,
  RelationshipDto,
  CreateRelationshipRequest,
  RelationshipStage,
  UpdateRelationshipDetailsRequest,
  CollaborationResponse,
} from '../../types/api/campaign.types';
import { brandService } from './brandService';

let cachedBrandId: string | null = null;

export const campaignService = {
  /**
   * Lấy ID brand của user hiện tại, tự động cache và tạo profile nếu chưa có
   */
  async resolveCurrentBrandId(): Promise<string> {
    if (cachedBrandId) return cachedBrandId;
    try {
      const brand = await brandService.getMyBrand();
      if (brand?.id) {
        cachedBrandId = brand.id;
        return brand.id;
      }
    } catch {
      // ignore
    }

    // Nếu chưa có brand profile, tạo 1 brand profile cơ bản để kích hoạt workflow
    try {
      const created = await brandService.createBrand({
        businessName: 'Thương hiệu của tôi',
        industry: 'E-commerce',
        website: 'https://influencermatch.vn',
        location: 'Việt Nam',
        targetMarkets: ['Vietnam'],
        targetAudiences: ['General Audience'],
        brandTone: 'Chuyên nghiệp',
        preferredPlatforms: ['TIKTOK', 'INSTAGRAM'],
        description: 'Thương hiệu đối tác trên hệ thống InfluencerMatch.',
      });
      if (created?.id) {
        cachedBrandId = created.id;
        return created.id;
      }
    } catch {
      // ignore
    }

    throw new Error('Không tìm thấy thông tin thương hiệu (Brand Profile). Vui lòng cập nhật hồ sơ Brand trước.');
  },

  /**
   * Lấy danh sách các chiến dịch của brand hiện tại
   */
  async getCampaigns(page = 0, size = 20, brandId?: string): Promise<CampaignResponse[]> {
    try {
      const targetBrandId = brandId || await this.resolveCurrentBrandId();
      const response = await apiClient.get<ApiResponse<PageResponse<CampaignResponse> | CampaignResponse[]>>(
        `/brands/${targetBrandId}/campaigns`,
        { params: { page, size } }
      );
      const data = response.data?.data;
      if (Array.isArray(data)) return data;
      return (data as PageResponse<CampaignResponse>)?.items || [];
    } catch {
      // Fallback
      try {
        const response = await apiClient.get<ApiResponse<PageResponse<CampaignResponse> | CampaignResponse[]>>(
          '/campaigns',
          { params: { page, size } }
        );
        const data = response.data?.data;
        if (Array.isArray(data)) return data;
        return (data as PageResponse<CampaignResponse>)?.items || [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Lấy thông tin chi tiết một chiến dịch
   */
  async getCampaignById(id: string): Promise<CampaignResponse> {
    const response = await apiClient.get<ApiResponse<CampaignResponse>>(`/campaigns/${id}`);
    return response.data.data;
  },

  /**
   * Tạo chiến dịch mới gắn với Brand Profile
   */
  async createCampaign(payload: CampaignRequest, brandId?: string): Promise<CampaignResponse> {
    const targetBrandId = brandId || await this.resolveCurrentBrandId();
    const response = await apiClient.post<ApiResponse<CampaignResponse>>(
      `/brands/${targetBrandId}/campaigns`,
      payload
    );
    return response.data?.data || (response.data as unknown as CampaignResponse);
  },

  /**
   * Cập nhật thông tin chiến dịch
   */
  async updateCampaign(id: string, payload: Partial<CampaignRequest>): Promise<CampaignResponse> {
    const response = await apiClient.put<ApiResponse<CampaignResponse>>(`/campaigns/${id}`, payload);
    return response.data.data;
  },

  /**
   * Cập nhật trạng thái chiến dịch (DRAFT, ACTIVE, COMPLETED, ARCHIVED)
   */
  async updateStatus(id: string, status: CampaignStatus): Promise<CampaignResponse> {
    const response = await apiClient.patch<ApiResponse<CampaignResponse>>(`/campaigns/${id}/status`, {
      status,
    });
    return response.data.data;
  },

  /**
   * Lưu trữ (Archive) chiến dịch
   */
  async archiveCampaign(id: string): Promise<void> {
    try {
      await apiClient.patch(`/campaigns/${id}/archive`);
    } catch {
      await apiClient.post(`/campaigns/${id}/archive`);
    }
  },

  /**
   * Kích hoạt thuật toán AI Discovery tìm creator cho chiến dịch
   */
  async discoverCreators(id: string): Promise<unknown> {
    try {
      const response = await apiClient.get(`/campaigns/${id}/discover`);
      return response.data;
    } catch {
      const response = await apiClient.post(`/campaigns/${id}/discover`);
      return response.data;
    }
  },

  /**
   * Lấy kết quả AI Discovery của chiến dịch
   */
  async getDiscoveryResults(id: string): Promise<unknown> {
    const response = await apiClient.get(`/campaigns/${id}/discovery`);
    return response.data.data;
  },

  // ── CRM / Relationships ────────────────────────────

  /**
   * Lấy danh sách quan hệ/pipeline CRM của chiến dịch
   */
  async getRelationships(campaignId: string): Promise<RelationshipDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ content?: RelationshipDto[]; items?: RelationshipDto[] }>>(
        `/campaigns/${campaignId}/relationships`
      );
      const data = response.data.data;
      return (data?.content || data?.items || (Array.isArray(data) ? data : [])) as RelationshipDto[];
    } catch {
      return [];
    }
  },

  /**
   * Tạo một quan hệ hợp tác mới trong CRM
   */
  async createRelationship(
    campaignId: string,
    payload: CreateRelationshipRequest
  ): Promise<RelationshipDto> {
    const response = await apiClient.post<ApiResponse<RelationshipDto>>(
      `/campaigns/${campaignId}/relationships`,
      payload
    );
    return response.data.data;
  },

  /**
   * Cập nhật giai đoạn (stage) của quan hệ CRM (Kanban move)
   */
  async updateRelationshipStage(
    campaignId: string,
    relationshipId: string,
    stage: RelationshipStage
  ): Promise<RelationshipDto> {
    const response = await apiClient.patch<ApiResponse<RelationshipDto>>(
      `/campaigns/${campaignId}/relationships/${relationshipId}/stage`,
      { stage }
    );
    return response.data.data;
  },

  /**
   * Cập nhật chi tiết thương lượng CRM (phí báo giá, phí thỏa thuận, ghi chú)
   */
  async updateRelationshipDetails(
    campaignId: string,
    relationshipId: string,
    payload: UpdateRelationshipDetailsRequest
  ): Promise<RelationshipDto> {
    try {
      const response = await apiClient.patch<ApiResponse<RelationshipDto>>(
        `/campaigns/${campaignId}/relationships/${relationshipId}/details`,
        payload
      );
      return response.data.data;
    } catch {
      const response = await apiClient.put<ApiResponse<RelationshipDto>>(
        `/campaigns/${campaignId}/relationships/${relationshipId}/details`,
        payload
      );
      return response.data.data;
    }
  },

  /**
   * Lấy danh sách hợp tác thực tế của chiến dịch
   */
  async getCollaborations(campaignId: string): Promise<CollaborationResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<CollaborationResponse[]>>(
        `/campaigns/${campaignId}/collaborations`
      );
      return response.data.data || [];
    } catch {
      return [];
    }
  },
};
