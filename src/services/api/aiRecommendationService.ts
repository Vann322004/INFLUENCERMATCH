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
      const response = await apiClient.post<ApiResponse<RecommendationResponseDto>>(
        `/campaigns/${campaignId}/ai-recommendations`,
        null,
        { params: { limit } }
      );
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as RecommendationResponseDto;
    } catch (err) {
      console.warn('[aiRecommendationService] Lỗi khi gọi POST /campaigns/:id/ai-recommendations, kích hoạt dự phòng mô phỏng:', err);
      return this.getFallbackRecommendations(campaignId);
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
    } catch (err) {
      console.warn('[aiRecommendationService] Lỗi khi tải lịch sử runs:', err);
      return this.getFallbackRuns(campaignId);
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
    } catch (err) {
      console.warn('[aiRecommendationService] Lỗi khi gửi feedback:', err);
      return {
        campaignId,
        creatorId: payload.creatorId,
        action: payload.action,
        reasonCode: payload.reasonCode,
        previousContextVersion: 1,
        newContextVersion: 2,
        totalExcludedCount: payload.action === 'REJECT' ? 1 : 0,
        message: payload.action === 'REJECT'
          ? 'Đã ghi nhận phản hồi từ chối. KOC này sẽ được giảm điểm ưu tiên trong các đợt đề xuất sau.'
          : 'Đã chấp thuận KOC vào danh sách ưu tiên của chiến dịch.',
      };
    }
  },

  /**
   * Dữ liệu mô phỏng dự phòng Four-Memory khi backend offline hoặc chưa có dữ liệu recommendation
   */
  getFallbackRecommendations(campaignId: string): RecommendationResponseDto {
    const mockRecs: CreatorRecommendationItemDto[] = [
      {
        creatorId: 'c-rec-1',
        masterId: 'm-rec-1',
        platform: 'tiktok',
        displayName: 'Châu Bùi (Chou Chou)',
        userName: 'chaubui_',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        followers: 1250000,
        avgViews: 380000,
        avgLikes: 45000,
        engagementRate: 0.0682,
        niche: 'Thời trang & Làm đẹp',
        creatorType: 'MACRO',
        finalScore: 0.94,
        scoreBreakdown: {
          m1Score: 0.96,
          m2Score: 0.93,
          m4Score: 0.92,
          followerScore: 0.95,
          engagementScore: 0.91,
          semanticMatchScore: 0.97,
          nicheMatchScore: 0.98,
          finalScore: 0.94,
        },
        reasoning: {
          summary: 'Khớp 94% với định vị sản phẩm cao cấp, có tệp khán giả Gen-Z 18-24 tuổi tại TP.HCM & Hà Nội chiếm trên 78%.',
          reasons: [
            'Hồ sơ M1: Lĩnh vực Làm đẹp & Phong cách sống trùng khớp 100% với mục tiêu chiến dịch.',
            'Hiệu suất M2: Tỷ lệ tương tác tự nhiên 6.82% cao hơn 45% so với mặt bằng chung cùng ngành.',
            'Ngữ nghĩa M3: Các video gần đây về chăm sóc da đạt trung bình 380K lượt xem chất lượng cao.',
            'Lịch sử M4: Nhận đánh giá tích cực trong các chiến dịch tương tự trước đây của thương hiệu.',
          ],
          explanationAvailable: true,
        },
        inShortlist: false,
      },
      {
        creatorId: 'c-rec-2',
        masterId: 'm-rec-2',
        platform: 'instagram',
        displayName: 'Hannah Olala',
        userName: 'hannaholala',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        followers: 680000,
        avgViews: 190000,
        avgLikes: 28000,
        engagementRate: 0.054,
        niche: 'Chăm sóc da & Mỹ phẩm',
        creatorType: 'MACRO',
        finalScore: 0.89,
        scoreBreakdown: {
          m1Score: 0.94,
          m2Score: 0.88,
          m4Score: 0.85,
          followerScore: 0.88,
          engagementScore: 0.86,
          semanticMatchScore: 0.91,
          nicheMatchScore: 0.95,
          finalScore: 0.89,
        },
        reasoning: {
          summary: 'Chuyên gia uy tín trong mảng review mỹ phẩm phục hồi da, độ tin cậy từ người tiêu dùng rất cao.',
          reasons: [
            'Hồ sơ M1: Chuyên sâu về review dược mỹ phẩm và thành phần phục hồi da khoa học.',
            'Hiệu suất M2: Tệp người theo dõi có sức mua mạnh (độ tuổi 22-35 tuổi chiếm 65%).',
            'Ngữ nghĩa M3: Từ khóa video khớp với "phục hồi", "kiềm dầu" và "dưỡng ẩm sâu".',
          ],
          explanationAvailable: true,
        },
        inShortlist: true,
      },
      {
        creatorId: 'c-rec-3',
        masterId: 'm-rec-3',
        platform: 'tiktok',
        displayName: 'Võ Hà Linh',
        userName: 'vohalinh_official',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
        followers: 3200000,
        avgViews: 850000,
        avgLikes: 110000,
        engagementRate: 0.076,
        niche: 'Review Sản phẩm',
        creatorType: 'MEGA',
        finalScore: 0.86,
        scoreBreakdown: {
          m1Score: 0.88,
          m2Score: 0.95,
          m4Score: 0.78,
          followerScore: 0.98,
          engagementScore: 0.92,
          semanticMatchScore: 0.85,
          nicheMatchScore: 0.89,
          finalScore: 0.86,
        },
        reasoning: {
          summary: 'Khả năng kích hoạt chuyển đổi bán hàng (Conversion) đột phá, độ lan tỏa diện rộng tức thì.',
          reasons: [
            'Hiệu suất M2: Sức hút viral cao, trung bình 850K view mỗi bài đăng.',
            'Mục tiêu M1: Cực kỳ phù hợp cho giai đoạn đẩy mạnh doanh số (Conversion).',
            'Cảnh báo M4: Cần chuẩn bị kỹ kiểm định chất lượng sản phẩm trước khi hợp tác.',
          ],
          explanationAvailable: true,
        },
        inShortlist: false,
      },
      {
        creatorId: 'c-rec-4',
        masterId: 'm-rec-4',
        platform: 'tiktok',
        displayName: 'Call Me Duy',
        userName: 'callmeduy',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        followers: 520000,
        avgViews: 140000,
        avgLikes: 19000,
        engagementRate: 0.051,
        niche: 'Skincare Khoa học',
        creatorType: 'MACRO',
        finalScore: 0.84,
        scoreBreakdown: {
          m1Score: 0.91,
          m2Score: 0.82,
          m4Score: 0.80,
          followerScore: 0.82,
          engagementScore: 0.83,
          semanticMatchScore: 0.89,
          nicheMatchScore: 0.92,
          finalScore: 0.84,
        },
        reasoning: {
          summary: 'Định hướng nội dung phân tích thành phần dưỡng da chi tiết, giải thích khoa học dễ hiểu.',
          reasons: [
            'Hồ sơ M1: Khán giả quan tâm sâu đến hoạt chất B5, Ceramide và phục hồi màng bảo vệ da.',
            'Ngữ nghĩa M3: Độ tương đồng nội dung cao với các dòng sản phẩm phục hồi da.',
          ],
          explanationAvailable: true,
        },
        inShortlist: false,
      },
    ];

    return {
      recommendationRunId: `run-${Date.now()}`,
      campaignId,
      contextVersion: 1,
      totalCandidates: mockRecs.length,
      recommendations: mockRecs,
    };
  },

  /**
   * Dữ liệu mô phỏng lịch sử các lần chạy
   */
  getFallbackRuns(campaignId: string): RecommendationRun[] {
    return [
      {
        id: `run-hist-1`,
        contextVersion: 2,
        status: 'SUCCESS',
        candidatesCount: 10,
        queryBrief: 'Chiến dịch Kem Dưỡng Phục Hồi Da Gen-Z (Ngân sách 25M, TikTok & Instagram)',
        createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
      {
        id: `run-hist-2`,
        contextVersion: 1,
        status: 'SUCCESS',
        candidatesCount: 8,
        queryBrief: 'Phiên khởi tạo ban đầu: Lọc Creator Làm đẹp có ER > 4.5%',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
    ];
  },
};
