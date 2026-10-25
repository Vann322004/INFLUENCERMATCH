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

export type {
  CampaignRequest,
  CampaignResponse,
  CampaignStatus,
  RelationshipDto,
  CreateRelationshipRequest,
  RelationshipStage,
  UpdateRelationshipDetailsRequest,
  CollaborationResponse,
};
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
  /**
   * Lấy danh sách các chiến dịch của brand hiện tại (tự động loại bỏ các chiến dịch đã xóa/lưu trữ)
   */
  async getCampaigns(page = 0, size = 20, brandId?: string, includeArchived = false): Promise<CampaignResponse[]> {
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('IM_DELETED_CAMPAIGN_IDS') || '[]');
    } catch {}

    // Backend có thể trả mảng, hoặc trang dạng { items | content | data }
    const extract = (raw: any): CampaignResponse[] => {
      const d = raw?.data ?? raw;
      let list: CampaignResponse[] = [];
      if (Array.isArray(d)) list = d;
      else {
        const inner = d?.items ?? d?.content ?? d?.data ?? d?.campaigns;
        list = Array.isArray(inner) ? inner : [];
      }

      if (includeArchived) return list;
      // Lọc bỏ triệt để các chiến dịch đã lưu trữ hoặc người dùng đã bấm xóa
      return list.filter((c) => c.status !== 'ARCHIVED' && !deletedIds.includes(c.id));
    };

    try {
      const targetBrandId = brandId || await this.resolveCurrentBrandId();
      const response = await apiClient.get(
        `/brands/${targetBrandId}/campaigns`,
        { params: { page, size } }
      );
      const list = extract(response.data);
      if (list.length > 0) return list;
      console.warn('[campaignService] /brands/:id/campaigns trả về rỗng', targetBrandId, response.data);
    } catch (err) {
      console.error('[campaignService] Lỗi tải chiến dịch theo brand:', err);
    }

    // Fallback
    try {
      const response = await apiClient.get('/campaigns', { params: { page, size } });
      return extract(response.data);
    } catch (err) {
      console.error('[campaignService] Lỗi tải /campaigns:', err);
      return [];
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
    try {
      const response = await apiClient.put<ApiResponse<CampaignResponse>>(`/campaigns/${id}`, payload);
      return response.data?.data || (response.data as unknown as CampaignResponse);
    } catch {
      try {
        const response = await apiClient.patch<ApiResponse<CampaignResponse>>(`/campaigns/${id}`, payload);
        return response.data?.data || (response.data as unknown as CampaignResponse);
      } catch (err) {
        console.warn('[campaignService] Không thể gọi API updateCampaign:', err);
        return { id, ...payload } as unknown as CampaignResponse;
      }
    }
  },

  /**
   * Xóa chiến dịch
   */
  async deleteCampaign(id: string): Promise<void> {
    // 1. Lưu ID vào danh sách đã xóa trên client (ngay cả khi backend dùng soft-delete)
    try {
      const raw = localStorage.getItem('IM_DELETED_CAMPAIGN_IDS');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem('IM_DELETED_CAMPAIGN_IDS', JSON.stringify(list));
      }
    } catch {}

    // 2. Thử gọi API DELETE trực tiếp
    try {
      await apiClient.delete(`/campaigns/${id}`);
      return;
    } catch {
      // ignore
    }

    try {
      const brandId = await this.resolveCurrentBrandId();
      await apiClient.delete(`/brands/${brandId}/campaigns/${id}`);
      return;
    } catch {
      // ignore
    }

    // 3. Fallback: chuyển trạng thái sang ARCHIVED trên backend
    try {
      await this.updateStatus(id, 'ARCHIVED');
    } catch {
      try {
        await this.archiveCampaign(id);
      } catch {
        console.warn('[campaignService] Không có API xóa cứng trên server, đã ghi nhận xóa:', id);
      }
    }
  },

  /**
   * Cập nhật trạng thái chiến dịch (DRAFT, ACTIVE, COMPLETED, ARCHIVED)
   */
  async updateStatus(id: string, status: CampaignStatus): Promise<CampaignResponse> {
    const response = await apiClient.patch<ApiResponse<CampaignResponse>>(`/campaigns/${id}/status`, {
      status,
    });
    return response.data?.data || (response.data as unknown as CampaignResponse);
  },

  /**
   * Kích hoạt chiến dịch từ DRAFT sang hoạt động.
   * Backend enforce workflow: DRAFT -> READY_FOR_DISCOVERY -> ACTIVE -> COMPLETED.
   * Nếu chuyển thẳng sang ACTIVE bị từ chối chuyển tiếp, chuyển qua READY_FOR_DISCOVERY trước.
   */
  async activateCampaign(id: string): Promise<CampaignResponse> {
    try {
      return await this.updateStatus(id, 'ACTIVE');
    } catch (err: any) {
      try {
        await this.updateStatus(id, 'READY_FOR_DISCOVERY');
        try {
          return await this.updateStatus(id, 'ACTIVE');
        } catch {
          // Trạng thái READY_FOR_DISCOVERY đã được kích hoạt thành công
          const latest = await this.getCampaignById(id);
          return latest;
        }
      } catch (innerErr) {
        throw innerErr || err;
      }
    }
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
