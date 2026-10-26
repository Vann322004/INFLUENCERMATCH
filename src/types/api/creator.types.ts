// Types for Creator and Shortlist APIs based on OpenAPI specification

export interface CreatorItem {
  id: string;
  creatorId: string;
  displayName: string;
  userName: string;
  platform: string;
  engagementRate?: number;
  followers?: number;
  verifiedByInfluencerMatch?: boolean;
  sourceType?: 'PUBLIC' | 'AUTHORIZED';
  niche?: string;
  avatarUrl?: string;
  location?: string;
  profileUrl?: string;
  creatorType?: string;
  contentSummary?: string;
}

export interface CreatorVectorSearchItem {
  id: string;
  displayName: string;
  userName: string;
  platform: string;
  avatarUrl?: string;
  profileUrl?: string;
  similarity: number;
}

export interface CreatorDetail {
  id: string;
  platform: string;
  externalId?: string;
  userName: string;
  displayName: string;
  profileUrl?: string;
  avatarUrl?: string;
  location?: string;
  sourceType?: 'PUBLIC' | 'AUTHORIZED';
  verifiedByInfluencerMatch?: boolean;
  authorizedAt?: string;
  followers?: number;
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
  engagementRate?: number;
  niche?: string;
  category?: string;
  contentSummary?: string;
  rateCard?: unknown;
  recentPosts?: any[];
}

export interface RateCardItem {
  deliverable?: string;
  price?: number;
  currency?: string;
}

export interface RateCardResponse {
  creatorId: string;
  source: string;
  items: RateCardItem[];
}

export type ShortlistPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ShortlistItem {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  priority: ShortlistPriority;
  note?: string;
  addedAt: string;
  avatarUrl?: string;
  platform?: string;
  followers?: number;
  engagementRate?: number;
  niche?: string;
  status?: string;
}

export interface AddShortlistItemPayload {
  creatorId: string;
  priority: ShortlistPriority;
  note?: string;
  creatorName?: string;
  avatarUrl?: string;
  platform?: string;
  followers?: number;
  niche?: string;
  engagementRate?: number;
}

export interface ShortlistCompareRequest {
  creatorIds: string[];
}

export interface SendInvitationRequest {
  creatorId?: string;
  email: string;
  campaignId?: string;
}

export interface InvitationResponse {
  id?: string;
  creatorId?: string;
  email?: string;
  campaignId?: string;
  status?: string;
  createdAt?: string;
}

export interface DiscoverCreatorsParams {
  keyword?: string;
  niche?: string;
  minFollowers?: number;
  maxFollowers?: number;
  page?: number;
  size?: number;
}

export interface CreatorDiscoveryCandidate {
  creatorId?: string;
  id?: string;
  platform?: string;
  userName?: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followers?: number;
  engagementRate?: number;
  niche?: string;
  location?: string;
  contentSummary?: string;
  creatorType?: string;
  recentPosts?: any[];
  matchScore?: number;
  finalScore?: number;
  score?: number;
  reason?: string;
  summary?: string;
  [key: string]: any;
}

export interface CreatorDiscoveryPageResponse {
  content?: CreatorDiscoveryCandidate[];
  items?: CreatorDiscoveryCandidate[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  page?: number;
  [key: string]: any;
}
