import { apiClient } from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';
import {
  RecommendationResponseDto,
  RecommendationRun,
  RecommendationFeedbackRequest,
  RecommendationFeedbackResponse,
  CreatorRecommendationItemDto,
} from '../../types/api/aiRecommendation.types';

export const aiRecommendationService = {
  /**
   * Kích hoạt thuật toán Đề xuất AI Four-Memory cho chiến dịch
   * POST /campaigns/{campaignId}/ai-recommendations?limit=10
   * Swagger Tag: "AI Recommendation"
   * OperationId: runRecommendation
   * Quyền yêu cầu: hasAuthority('RUN_RECOMMENDATION')
   */
  async runRecommendation(campaignId: string, limit = 10): Promise<RecommendationResponseDto> {
    try {
      console.log(`[aiRecommendationService] Kích hoạt POST /campaigns/${campaignId}/ai-recommendations?limit=${limit}`);
      const response = await apiClient.post<any>(
        `/campaigns/${campaignId}/ai-recommendations`,
        null,
        { params: { limit } }
      );
      console.log('[aiRecommendationService] Raw API response:', response.data);

      const resBody = response.data;
      const data = resBody?.data ?? resBody;

      // Hỗ trợ linh hoạt cấu trúc trả về từ backend (recommendations, content, hoặc array)
      const rawRecs =
        data?.recommendations ??
        data?.content ??
        (Array.isArray(data) ? data : []);

      const parsedRecs: CreatorRecommendationItemDto[] = rawRecs.map((item: any) => ({
        creatorId: item.creatorId || item.id,
        masterId: item.masterId,
        platform: item.platform || 'TIKTOK',
        displayName: item.displayName || item.fullName || item.name || 'Creator',
        userName: item.userName || item.username || item.handle || '',
        avatarUrl: item.avatarUrl || item.avatar || item.profileImageUrl,
        followers: Number(item.followers || item.followerCount || 0),
        avgViews: Number(item.avgViews || item.averageViews || 0),
        avgLikes: Number(item.avgLikes || item.averageLikes || 0),
        engagementRate: Number(item.engagementRate ?? item.er ?? 0),
        niche: item.niche || item.category || 'Lifestyle',
        category: item.category || item.niche,
        creatorType: item.creatorType,
        shortlistStatus: item.shortlistStatus,
        finalScore: typeof item.finalScore === 'number' ? item.finalScore : Number(item.matchScore ?? 0.85),
        scoreBreakdown: item.scoreBreakdown,
        reasoning: item.reasoning,
        claimed: item.claimed,
        inShortlist: Boolean(item.inShortlist || item.isInShortlist),
      }));

      console.log(`[aiRecommendationService] Đã xử lý ${parsedRecs.length} ứng viên từ API:`, parsedRecs);

      return {
        recommendationRunId: data?.recommendationRunId || data?.id || data?.runId || '',
        campaignId: data?.campaignId || campaignId,
        contextVersion: data?.contextVersion || 1,
        totalCandidates: data?.totalCandidates ?? parsedRecs.length,
        recommendations: parsedRecs,
      };
    } catch (err: any) {
      console.error('[aiRecommendationService] Lỗi khi gọi POST /campaigns/:id/ai-recommendations:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Không thể thực hiện đề xuất AI cho chiến dịch lúc này.';
      throw new Error(errMsg);
    }
  },

  /**
   * Lấy lịch sử các lần chạy đề xuất AI của chiến dịch
   * GET /campaigns/{campaignId}/ai-recommendations/runs
   * Swagger Tag: "AI Recommendation"
   * OperationId: getRecommendationRuns
   * Quyền yêu cầu: hasAuthority('VIEW_OWN_RECOMMENDATION')
   */
  async getRecommendationRuns(campaignId: string): Promise<RecommendationRun[]> {
    try {
      const response = await apiClient.get<ApiResponse<RecommendationRun[]>>(
        `/campaigns/${campaignId}/ai-recommendations/runs`
      );
      const data = response.data?.data ?? response.data;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err: any) {
      console.error('[aiRecommendationService] Lỗi khi tải lịch sử runs:', err);
      return [];
    }
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

