export type CrawlPlatform = 'ALL' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';

export interface CrawledRecentPost {
  platformPostId: string;
  postUrl: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  coverUrl?: string;
  postedAt?: string;
}

export interface LiveCrawlResult {
  status: 'success' | 'error';
  platform: CrawlPlatform | string;
  username: string;
  display_name?: string;
  author_id?: string;
  profile_url?: string;
  avatar_url?: string;
  followers?: number;
  following?: number;
  heart_count?: number;
  video_count?: number;
  bio?: string;
  is_verified?: boolean;
  decision?: 'ACCEPTED' | 'REJECTED' | 'REVIEW' | string;
  primary_type?: 'KOL' | 'KOC' | 'COMMERCE' | 'OTHER' | string;
  latency_ms?: number;
  recent_posts?: CrawledRecentPost[];
  collected_at?: string;
  error?: string;
}

export interface BatchCrawlSummary {
  total_requested: number;
  success_count: number;
  failed_count: number;
  avg_latency_ms: number;
}

export interface BatchCrawlResponse {
  status: 'success' | 'error';
  category?: string;
  platform: string;
  summary: BatchCrawlSummary;
  results: LiveCrawlResult[];
  metrics?: Record<string, unknown>;
}

export interface CrawlerOverviewStats {
  total_candidates?: number;
  ingested_count?: number;
  accepted_kol_koc?: number;
  rejected_count?: number;
  review_pending?: number;
  rate_limit_429_count?: number;
  avg_latency_ms?: number;
}

export interface CrawlMonitorOverview {
  stats: CrawlerOverviewStats;
  metrics: {
    total_requests?: number;
    success_count?: number;
    failed_count?: number;
    rate_limit_429?: number;
    avg_latency_ms?: number;
  };
  activities: {
    total: number;
    items: Array<{
      id: string;
      platform: string;
      username: string;
      displayName?: string;
      status: string;
      decision: string;
      primaryType?: string;
      updatedAt?: string;
    }>;
  };
  crawled_data: {
    total: number;
    items: Array<{
      creator: {
        platform: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
        followers?: number;
        bio?: string;
        isVerified?: boolean;
      };
      recentPosts?: CrawledRecentPost[];
      collectedAt?: string;
    }>;
  };
}

