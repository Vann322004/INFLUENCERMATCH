import { apiClient } from '../apiClient';
import { readPage } from './pageResponse';
import { ApiResponse } from '../../types/api/common.types';
import {
  CampaignRequest,
  CampaignResponse,
  CampaignStatus,
  CampaignAutofillResponse,
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
  CampaignAutofillResponse,
  RelationshipDto,
  CreateRelationshipRequest,
  RelationshipStage,
  UpdateRelationshipDetailsRequest,
  CollaborationResponse,
};
import { brandService } from './brandService';
import { aiRecommendationService } from './aiRecommendationService';

export const clearBrandCache = () => brandService.clearBrandCache();

// Keep legacy response aliases out of every campaign write request.
function campaignWritePayload(payload: Partial<CampaignRequest>) {
  const { budgetMin, budgetMax, description, ...current } = payload;
  return {
    ...current,
    totalBudget: current.totalBudget ?? budgetMax ?? budgetMin,
    brief: current.brief ?? description,
  };
}

function readCampaign(response: { data: ApiResponse<CampaignResponse> }, id?: string): CampaignResponse {
  const data = response.data?.data;
  if (response.data?.success === false || !data?.id || (id && data.id !== id) || !data.status) {
    throw new Error('Máy chủ chưa xác nhận dữ liệu chiến dịch hợp lệ.');
  }
  return data;
}

export const campaignService = {
  async uploadImage(file: File, signal?: AbortSignal): Promise<string> {
    const brandId = await this.resolveCurrentBrandId();
    const body = new FormData();
    body.append('file', file);
    const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>('/brands/' + brandId + '/campaign-images', body, {
      headers: { 'Content-Type': undefined }, signal,
    });
    const url = response.data?.data?.imageUrl;
    if (response.data?.success !== true || !url || new URL(url).protocol !== 'https:') {
      throw new Error('Máy chủ chưa xác nhận ảnh đã tải lên.');
    }
    return url;
  },
  /**
   * Lấy ID brand của user hiện tại, tự động cache theo userId và tạo profile nếu chưa có
   */
  async resolveCurrentBrandId(forceRefresh = false): Promise<string> {
    const brand = await brandService.getMyBrand(forceRefresh);
    if (!brand?.id) throw new Error('Vui lòng hoàn thiện hồ sơ thương hiệu trước.');
    return brand.id;
  },
  async getCampaignPage(page = 0, size = 50, brandId?: string) {
    const target = brandId || await this.resolveCurrentBrandId();
    const response = await apiClient.get('/brands/' + target + '/campaigns', { params: { page, size: Math.min(100, size) } });
    return readPage<CampaignResponse>(response.data);
  },
  async getCampaigns(page = 0, size = 50, brandId?: string, includeArchived = false): Promise<CampaignResponse[]> {
    const result = await this.getCampaignPage(page, size, brandId);
    return includeArchived ? result.items : result.items.filter(item => item.status !== 'ARCHIVED');
  },
  async getAllCampaigns(): Promise<CampaignResponse[]> {
    const brand = await this.resolveCurrentBrandId(); const rows: CampaignResponse[] = []; let page = 0;
    while (true) { const result = await this.getCampaignPage(page, 100, brand); rows.push(...result.items); if (++page >= result.totalPages) return rows; }
  },

  /**
   * Lấy thông tin chi tiết một chiến dịch
   */
  async getCampaignById(id: string): Promise<CampaignResponse> {
    const response = await apiClient.get<ApiResponse<CampaignResponse>>('/campaigns/' + id);
    const data = response.data?.data;
    if (response.data?.success === false || data?.id !== id || !data.status) throw new Error('Invalid campaign response.');
    return data;
  },

  /**
   * Tạo chuẩn ETag revision theo contract của backend: "campaign:<uuid>:r<revision>"
   */
  formatCampaignRevisionTag(id: string, revision?: number | null): string {
    if (revision == null || !Number.isSafeInteger(Number(revision)) || Number(revision) < 0) throw new Error('Thiếu phiên bản chiến dịch. Vui lòng tải lại.');
    const rev = Number(revision);
    return `"campaign:${id}:r${rev}"`;
  },

  /**
   * Lấy thông tin chi tiết + ETag của một chiến dịch
   * Ưu tiên header ETag trả về, nếu trình duyệt che giấu header do CORS thì tự tính từ campaignRevision trong payload
   */
  async getCampaignWithETag(id: string): Promise<{ data: CampaignResponse; etag: string }> {
    const response = await apiClient.get<ApiResponse<CampaignResponse>>(`/campaigns/${id}`);
    const data = readCampaign(response, id);
    const rawHeader =
      response.headers?.['etag'] ??
      (typeof response.headers?.get === 'function' ? response.headers.get('etag') : null);
    const headerEtag = typeof rawHeader === 'string' ? rawHeader : null;
    // Revision in the DTO is authoritative; a proxy may replace ETag or make it weak.
    const expectedPrefix = `"campaign:${id}:r`;
    const etag = data.campaignRevision != null
      ? this.formatCampaignRevisionTag(id, data.campaignRevision)
      : headerEtag?.startsWith(expectedPrefix) && /^"campaign:[\da-f-]+:r\d+"$/i.test(headerEtag)
        ? headerEtag : this.formatCampaignRevisionTag(id, null);
    return { data, etag };
  },

  /**
   * Tạo chiến dịch mới gắn với Brand Profile
   */
  async createCampaign(payload: CampaignRequest, brandId?: string): Promise<CampaignResponse> {
    const targetBrandId = brandId || await this.resolveCurrentBrandId();
    const response = await apiClient.post<ApiResponse<CampaignResponse>>(
      `/brands/${targetBrandId}/campaigns`,
      campaignWritePayload(payload)
    );
    return readCampaign(response);
  },

  /**
   * Cập nhật thông tin chiến dịch
   * Đảm bảo luôn gửi header If-Match hợp lệ (bắt buộc bởi backend optimistic locking)
   */
  async updateCampaign(
    id: string,
    payload: Partial<CampaignRequest>,
    revisionOrEtag?: number | string | null
  ): Promise<CampaignResponse> {
    let ifMatchValue: string;
    if (typeof revisionOrEtag === 'number') {
      ifMatchValue = this.formatCampaignRevisionTag(id, revisionOrEtag);
    } else if (typeof revisionOrEtag === 'string' && revisionOrEtag.trim()) {
      const clean = revisionOrEtag.trim();
      ifMatchValue = clean.startsWith('"') ? clean : `"${clean}"`;
    } else {
      const { etag } = await this.getCampaignWithETag(id);
      ifMatchValue = etag;
    }

    const response = await apiClient.put<ApiResponse<CampaignResponse>>(
      `/campaigns/${id}`,
      campaignWritePayload(payload),
      {
        headers: {
          'If-Match': ifMatchValue,
        },
      }
    );
    return readCampaign(response, id);
  },

  /**
   * Lưu trữ chiến dịch
   * PATCH /campaigns/{id}/archive — luôn gửi kèm If-Match header
   */
  async archiveCampaign(id: string, revisionOrEtag?: number | string | null): Promise<CampaignResponse> {
    const etag = typeof revisionOrEtag === 'number' ? this.formatCampaignRevisionTag(id, revisionOrEtag)
      : typeof revisionOrEtag === 'string' ? revisionOrEtag : (await this.getCampaignWithETag(id)).etag;
    const result = readCampaign(await apiClient.patch<ApiResponse<CampaignResponse>>('/campaigns/' + id + '/archive', undefined, { headers: { 'If-Match': etag } }), id);
    if (result.status !== 'ARCHIVED') throw new Error('Máy chủ chưa xác nhận lưu trữ chiến dịch.');
    return result;
  },
  async deleteCampaign(id: string): Promise<void> {
    const { data, etag } = await this.getCampaignWithETag(id);
    if (data.status !== 'DRAFT') throw new Error('Chỉ có thể xóa vĩnh viễn chiến dịch bản nháp.');
    const response = await apiClient.delete('/campaigns/' + id, { headers: { 'If-Match': etag } });
    if (response.status !== 204) throw new Error('Máy chủ chưa xác nhận xóa vĩnh viễn chiến dịch.');
  },

  /**
   * Tự động điền thông tin chiến dịch bằng Gemini AI
   * POST /ai/campaign-autofill
   * Chỉ sử dụng kết quả thật từ Backend; không tự thử lại khi lỗi.
   */
  async autofillCampaign(prompt: string, signal?: AbortSignal): Promise<CampaignAutofillResponse> {
    const response = await apiClient.post<ApiResponse<CampaignAutofillResponse>>('/ai/campaign-autofill', { prompt }, {
      timeout: 60_000,
      signal,
    });
    if (!response.data?.data) throw new Error('No campaign draft returned by the server.');
    return response.data.data;
  },

  /**
   * Cập nhật trạng thái chiến dịch (DRAFT, ACTIVE, COMPLETED, ARCHIVED)
   */
  async updateStatus(
    id: string,
    status: CampaignStatus,
    revisionOrEtag?: number | string | null
  ): Promise<CampaignResponse> {
    let ifMatchValue: string;
    if (typeof revisionOrEtag === 'number') {
      ifMatchValue = this.formatCampaignRevisionTag(id, revisionOrEtag);
    } else if (typeof revisionOrEtag === 'string' && revisionOrEtag.trim()) {
      const clean = revisionOrEtag.trim();
      ifMatchValue = clean.startsWith('"') ? clean : `"${clean}"`;
    } else {
      const { etag } = await this.getCampaignWithETag(id);
      ifMatchValue = etag;
    }
    const response = await apiClient.patch<ApiResponse<CampaignResponse>>(
      `/campaigns/${id}/status`,
      { status },
      { headers: { 'If-Match': ifMatchValue } }
    );
    const data = readCampaign(response, id);
    if (data.status !== status) throw new Error('Máy chủ chưa xác nhận trạng thái yêu cầu. Tải lại chiến dịch để kiểm tra.');
    return data;
  },

  /**
   * Kích hoạt chiến dịch từ DRAFT sang hoạt động.
   * Backend enforce workflow: DRAFT -> READY_FOR_DISCOVERY -> ACTIVE -> COMPLETED.
   * Nếu chuyển thẳng sang ACTIVE bị từ chối chuyển tiếp, chuyển qua READY_FOR_DISCOVERY trước.
   */
  async activateCampaign(id: string): Promise<CampaignResponse> {
    let current = await this.getCampaignById(id);
    if (current.status === 'DRAFT') current = await this.updateStatus(id, 'READY_FOR_DISCOVERY', current.campaignRevision);
    if (current.status === 'READY_FOR_DISCOVERY') return this.updateStatus(id, 'ACTIVE', current.campaignRevision);
    if (current.status === 'ACTIVE') return current;
    throw new Error('Chiến dịch này không thể kích hoạt lại.');
  },

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
    params?: {
      keyword?: string;
      niche?: string;
      minFollowers?: number;
      maxFollowers?: number;
      page?: number;
      size?: number;
    }
  ): Promise<any> {
    try {
      const response = await apiClient.get(`/campaigns/${campaignId}/discovery`, { params });
      return response.data?.data ?? response.data;
    } catch (err) {
      console.warn('[campaignService] Lỗi khi gọi GET /campaigns/:id/discovery:', err);
      throw err;
    }
  },

  /**
   * Alias cho discoverCreators (GET /campaigns/{campaignId}/discovery)
   */
  async getDiscoveryResults(
    campaignId: string,
    params?: {
      keyword?: string;
      niche?: string;
      minFollowers?: number;
      maxFollowers?: number;
      page?: number;
      size?: number;
    }
  ): Promise<any> {
    return this.discoverCreators(campaignId, params);
  },

  // ── CRM / Relationships ────────────────────────────

  /**
   * Lấy danh sách quan hệ/pipeline CRM của chiến dịch
   */
  async getRelationships(campaignId: string): Promise<RelationshipDto[]> {
    const rows: RelationshipDto[] = [];
    for (let page = 0; ; page++) {
      const response = await apiClient.get('/campaigns/' + campaignId + '/relationships', { params: { page, size: 100 } });
      const result = readPage<RelationshipDto>(response.data);
      rows.push(...result.items);
      if (page + 1 >= result.totalPages) return rows;
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
    const response = await apiClient.patch<ApiResponse<RelationshipDto>>('/campaigns/' + campaignId + '/relationships/' + relationshipId + '/details', payload);
    return response.data.data;
  },

  /**
   * Lấy danh sách hợp tác thực tế của chiến dịch
   */
  async getCollaborations(campaignId: string): Promise<CollaborationResponse[]> {
    const rows: CollaborationResponse[] = [];
    for (let page = 0; ; page++) {
      const response = await apiClient.get('/campaigns/' + campaignId + '/collaborations', { params: { page, size: 100 } });
      const result = readPage<CollaborationResponse>(response.data); rows.push(...result.items);
      if (page + 1 >= result.totalPages) return rows;
    }
  },

  // ── AI Recommendations (Four-Memory) ─────────────

  /**
   * Kích hoạt thuật toán Đề xuất AI Four-Memory cho chiến dịch
   * POST /campaigns/{campaignId}/ai-recommendations?limit=10
   */
  async runRecommendation(campaignId: string, limit = 10) {
    return aiRecommendationService.runRecommendation(campaignId, limit);
  },

  /**
   * Lấy lịch sử các lần chạy đề xuất AI
   * GET /campaigns/{campaignId}/ai-recommendations/runs
   */
  async getRecommendationRuns(campaignId: string) {
    return aiRecommendationService.getRecommendationRuns(campaignId);
  },

  /**
   * Gửi phản hồi đánh giá KOC (Feedback Loop)
   * POST /campaigns/{campaignId}/ai-recommendations/feedback
   */
  async submitFeedback(campaignId: string, payload: any) {
    return aiRecommendationService.submitFeedback(campaignId, payload);
  },
};
