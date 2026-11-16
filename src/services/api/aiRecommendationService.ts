import { apiClient } from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';
import {
  RecommendationResponseDto,
  RecommendationRun,
  RecommendationFeedbackRequest,
  RecommendationFeedbackResponse,
  CreatorRecommendationItemDto,
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
  async runRecommendation(campaignId: string, limit = 30, options?: { displayMode?: DisplayMode; candidateSource?: CandidateSource; creatorIds?: string[] }): Promise<RecommendationResponseDto> {
    const response = await apiClient.post('/campaigns/' + campaignId + '/ai-recommendations', null, { params: { limit, displayMode: options?.displayMode, candidateSource: options?.candidateSource, creatorIds: options?.creatorIds?.length ? options.creatorIds.join(',') : undefined } });
    const data = response.data?.data;
    if (response.data?.success === false || data?.campaignId !== campaignId || !Array.isArray(data.recommendations) || !Array.isArray(data.provisionalRecommendations)) throw new Error('Phản hồi gợi ý không hợp lệ.');
    if (options?.creatorIds?.length && [...data.recommendations, ...data.provisionalRecommendations].some(item => !options.creatorIds!.includes(item.creatorId))) throw new Error('Máy chủ trả về kênh ngoài lựa chọn. Cần cập nhật Backend hỗ trợ creatorIds trước khi chạy lại.');
    return data;
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
    if (response.data?.success === false || !Array.isArray(data) || data.some(row => row.campaignId !== campaignId)) throw new Error('Không thể đọc lịch sử gợi ý.');
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

