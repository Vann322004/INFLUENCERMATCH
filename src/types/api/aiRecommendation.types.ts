// Types for AI Recommendation (Four-Memory) and Historical Runs based on OpenAPI Swagger spec

export type DisplayMode = 'BEST_MATCH' | 'BUDGET_READY_FIRST' | 'DIVERSIFIED_MATCH';
export type CandidateSource = 'SHORTLIST' | 'DISCOVERY';

export interface ScoreBreakdownDto {
  m1Score: number;            // M1: Historical Creator Reputation
  m2Score: number;            // M2: Public Performance Metrics
  m3Score: number;            // M3: Semantic Fit (PGVector Embedding & Content Relevance)
  m4Score: number;            // M4: Brand Taste/Affinity (Feedback Loop & Brand Prioritization)
  followerScore?: number;
  engagementScore?: number;
  semanticMatchScore?: number;
  nicheMatchScore?: number;
  finalScore?: number;        // Match Score tổng hợp (0.0 -> 1.0)
}

export interface ReasoningCardDto {
  summary: string;            // Đoạn tóm tắt lý do
  reasons: string[];          // Danh sách gạch đầu dòng lý do
  explanationAvailable: boolean;
  evidenceWarnings?: string[]; // Cảnh báo dữ liệu (thiếu metric, provisional...)
}

export type PriceStatus =
  | 'CONFIRMED_WITHIN_BUDGET'
  | 'DECLARED_ESTIMATE'
  | 'PRICE_UNKNOWN'
  | 'ESTIMATED_OVER_BUDGET'
  | 'CONFIRMED_OVER_BUDGET';

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
  priceStatus?: PriceStatus;
  isScoreReady?: boolean;
  isProvisional?: boolean;
  claimed?: boolean;
  inShortlist?: boolean;
}

export interface RecommendationResponseDto {
  recommendationRunId: string;
  campaignId: string;
  contextVersion: number;
  totalCandidates: number;
  recommendations: CreatorRecommendationItemDto[];
  provisionalRecommendations?: CreatorRecommendationItemDto[];
}

export interface RecommendationRun {
  id: string;
  campaignId?: string;
  brandProfileId?: string;
  contextVersion: number;
  candidateSource?: string;
  scoringPolicyVersion?: string;
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
