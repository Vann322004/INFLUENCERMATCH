import { apiClient } from '../apiClient';
import type { CampaignResponse } from '../../types/api/campaign.types';
import { ApiResponse } from '../../types/api/common.types';
import {
  RecommendationResponseDto,
  RecommendationRun,
  RecommendationFeedbackRequest,
  RecommendationFeedbackResponse,
  DisplayMode,
  CandidateSource,
} from '../../types/api/aiRecommendation.types';

export const aiRecommendationService = {
  /**
   * Kích hoạt thuật toán Đề xuất AI Four-Memory cho chiến dịch
   * POST /campaigns/{campaignId}/ai-recommendations?limit=30
   * Swagger Tag: "AI Recommendation"
   * OperationId: runRecommendation
   * Quyền yêu cầu: hasAuthority('RUN_RECOMMENDATION')
   */
  async runRecommendation(campaignId: string, limit = 30, options?: { displayMode?: DisplayMode; candidateSource?: CandidateSource; creatorIds?: string[]; idempotencyKey?: string; revision?: number; signal?: AbortSignal }): Promise<RecommendationResponseDto> {
    const headers: Record<string, string> = { 'Idempotency-Key': options?.idempotencyKey ?? crypto.randomUUID() };
    if (options?.revision != null) {
      if (!Number.isSafeInteger(options.revision) || options.revision < 0) throw new Error('Phiên bản chiến dịch không hợp lệ.');
      headers['If-Match'] = `"campaign:${campaignId}:r${options.revision}"`;
    }
    const response = await apiClient.post('/campaigns/' + campaignId + '/ai-recommendations', null, { signal: options?.signal, headers, params: { limit, displayMode: options?.displayMode, candidateSource: options?.candidateSource ?? 'SHORTLIST', creatorIds: options?.creatorIds?.length ? options.creatorIds.join(',') : undefined } });
    const data = response.data?.data;
    if (response.data?.success === false || data?.campaignId !== campaignId || !Array.isArray(data.recommendations) || !Array.isArray(data.provisionalRecommendations)) throw new Error('Phản hồi gợi ý không hợp lệ.');
    if (data.excludedCandidates != null && !Array.isArray(data.excludedCandidates)) throw new Error('Danh sách kênh bị loại không hợp lệ.');
    if (options?.creatorIds?.length && [...data.recommendations, ...data.provisionalRecommendations].some(item => !options.creatorIds!.includes(item.creatorId))) throw new Error('Máy chủ trả về kênh ngoài lựa chọn. Cần cập nhật Backend hỗ trợ creatorIds trước khi chạy lại.');
    return data;
  },

  async runWhenReady(campaignId: string, request: { limit: number; displayMode: DisplayMode; creatorIds: string[]; idempotencyKey: string }, signal: AbortSignal,
    onProgress: (phase: 'preparing' | 'running', campaign?: CampaignResponse, warning?: string) => void): Promise<RecommendationResponseDto> {
    const readCampaign = async () => {
      signal.throwIfAborted();
      const response = await apiClient.get('/campaigns/' + campaignId, { signal });
      const data = response.data?.data as CampaignResponse;
      if (response.data?.success === false || data?.id !== campaignId || !data.status) throw new Error('Không thể đọc trạng thái chiến dịch.');
      if (data.status === 'ARCHIVED' || data.status === 'CLOSED') throw new Error('Chiến dịch đã kết thúc, không thể tiếp tục chạy gợi ý.');
      return data;
    };
    let campaign = await readCampaign();
    const post = () => {
      signal.throwIfAborted();
      if (campaign.status === 'DRAFT' && campaign.campaignRevision == null) throw new Error('Thiếu phiên bản chiến dịch. Tải lại trước khi chạy.');
      return aiRecommendationService.runRecommendation(campaignId, request.limit, { ...request, candidateSource: 'SHORTLIST', revision: campaign.campaignRevision, signal });
    };
    const finish = async (result: RecommendationResponseDto) => {
      try { onProgress('running', await readCampaign()); }
      catch (error) {
        if (signal.aborted) throw error;
        onProgress('running', undefined, 'Đã có kết quả nhưng chưa tải lại được trạng thái chiến dịch. Tải lại trang để kiểm tra.');
      }
      return result;
    };
    onProgress(campaign.status === 'DRAFT' ? 'preparing' : 'running', campaign);
    try { return await finish(await post()); }
    catch (error: any) {
      if (signal.aborted || error?.response?.status !== 409 || error?.response?.data?.code !== 'CAMPAIGN_EMBEDDING_NOT_READY') throw error;
      if (error.response.data.embeddingStatus === 'FAILED') throw new Error('Chuẩn bị dữ liệu thất bại. Cần thử lại embedding trước khi chạy gợi ý.');
    }
    onProgress('preparing');
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      campaign = await readCampaign();
      onProgress('preparing', campaign);
      if (campaign.embeddingStatus === 'FAILED') throw new Error('Chuẩn bị dữ liệu thất bại. Cần thử lại embedding trước khi chạy gợi ý.');
      if (campaign.embeddingStatus === 'READY') {
        onProgress('running', campaign);
        // Resume once, with the same request/key. Never retry unrelated errors or loop POSTs.
        return await finish(await post());
      }
      if (!['PENDING', 'PROCESSING'].includes(campaign.embeddingStatus ?? '')) throw new Error('Backend chưa cung cấp trạng thái chuẩn bị dữ liệu hợp lệ.');
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 2000);
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) { signal.removeEventListener('abort', abort); abort(); }
      });
    }
    throw new Error('Dữ liệu vẫn đang được chuẩn bị. Bấm thử lại để tiếp tục cùng yêu cầu; không tạo lượt chạy mới khi tải lại trang.');
  },

  /**
   * Lấy lịch sử các lần chạy đề xuất AI của chiến dịch
   * GET /campaigns/{campaignId}/ai-recommendations/runs
   * Swagger Tag: "AI Recommendation"
   * OperationId: getRecommendationRuns
   * Quyền yêu cầu: hasAuthority('VIEW_OWN_RECOMMENDATION')
   */
  async getRecommendationRuns(campaignId: string): Promise<RecommendationRun[]> {
    const response = await apiClient.get('/campaigns/' + campaignId + '/ai-recommendations/runs'); const data = response.data?.data;
    if (response.data?.success === false || !Array.isArray(data) || data.some(row => row.campaignId !== campaignId || (row.scoringSnapshot != null && !Array.isArray(row.scoringSnapshot)) || (row.excludedCandidates != null && !Array.isArray(row.excludedCandidates)))) throw new Error('Không thể đọc lịch sử gợi ý.');
    return data;
  },

  /**
   * Gửi phản hồi đánh giá KOC để tiến hóa bộ nhớ M4 (Feedback Loop)
   * POST /campaigns/{campaignId}/ai-recommendations/feedback
   * Swagger Tag: "AI Recommendation"
   * Quyền yêu cầu: hasAuthority('RUN_RECOMMENDATION')
   */
  async submitFeedback(
    campaignId: string,
    payload: RecommendationFeedbackRequest
  ): Promise<RecommendationFeedbackResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RecommendationFeedbackResponse>>(
        `/campaigns/${campaignId}/ai-recommendations/feedback`,
        payload
      );
      return response.data?.data || (response.data as unknown as RecommendationFeedbackResponse);
    } catch (err: any) {
      console.error('[aiRecommendationService] Lỗi khi gửi feedback:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể gửi phản hồi đánh giá AI.';
      throw new Error(errMsg);
    }
  },
};

