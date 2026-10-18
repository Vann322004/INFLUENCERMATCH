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
}

export interface AddShortlistItemPayload {
  creatorId: string;
  priority: ShortlistPriority;
  note?: string;
}

export interface ShortlistCompareRequest {
  creatorIds: string[];
}
