// Types for AI Recommendation (Four-Memory) and Historical Runs based on OpenAPI Swagger spec

export interface ScoreBreakdownDto {
  m1Score: number;            // Khớp hồ sơ & ngành hàng
  m2Score: number;            // Hiệu suất & tương tác thực tế
  m4Score: number;            // Khớp lịch sử feedback & context
  followerScore: number;
  engagementScore: number;
  semanticMatchScore: number;
  nicheMatchScore: number;
  finalScore: number;         // Match Score tổng hợp (0.0 -> 1.0)
}

export interface ReasoningCardDto {
  summary: string;            // Đoạn tóm tắt lý do
  reasons: string[];          // Danh sách gạch đầu dòng lý do
  explanationAvailable: boolean;
}

export interface CreatorRecommendationItemDto {
  creatorId: string;
  masterId?: string;
  platform: string;
  displayName: string;
  userName: string;
  avatarUrl?: string;
  followers: number;
  avgViews?: number;
  avgLikes?: number;
  engagementRate?: number;
  niche: string;
  category?: string;
  creatorType?: string;
  shortlistStatus?: 'SAVED' | 'READY_TO_CONTACT' | 'CONTACTED' | 'REMOVED';
  finalScore: number;
  scoreBreakdown?: ScoreBreakdownDto;
  reasoning?: ReasoningCardDto;
  claimed?: boolean;
  inShortlist?: boolean;
}

export interface RecommendationResponseDto {
  recommendationRunId: string;
  campaignId: string;
  contextVersion: number;
  totalCandidates: number;
  recommendations: CreatorRecommendationItemDto[];
}

export interface RecommendationRun {
  id: string;
  contextVersion: number;
  status: string;
  candidatesCount: number;
  queryBrief?: string;
  createdAt: string;
  campaign?: any;
  brandProfile?: any;
}

export type FeedbackAction = 'ACCEPT' | 'REJECT';

export interface RecommendationFeedbackRequest {
  creatorId: string;
  action: FeedbackAction;
  reasonCode?: string;
  reasonNote?: string;
}

export interface RecommendationFeedbackResponse {
  campaignId: string;
  creatorId: string;
  action: string;
  reasonCode?: string;
  previousContextVersion?: number;
  newContextVersion?: number;
  totalExcludedCount?: number;
  message?: string;
}
