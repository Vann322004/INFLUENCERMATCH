// Campaign & CRM Pipeline Types based on OpenAPI specification

export type CampaignObjective = 'AWARENESS' | 'ENGAGEMENT' | 'TRAFFIC' | 'CONVERSION';
export type CampaignStatus = 'DRAFT' | 'READY_FOR_DISCOVERY' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type CampaignPlatform = 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE';

export interface CampaignRequest {
  name: string;
  productService: string;
  description?: string;
  objective: CampaignObjective;
  platforms: CampaignPlatform[];
  targetAudiences?: string[];
  contentType?: string;
  startDate?: string;
  endDate?: string;
  niches?: string[];
  locations?: string[];
  followerMin?: number;
  followerMax?: number;
  budgetMin?: number;
  budgetMax?: number;
}

export interface CampaignResponse {
  id: string;
  brandId: string;
  name: string;
  productService: string;
  description?: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  platforms?: CampaignPlatform[];
  targetAudiences?: string[];
  contentType?: string;
  startDate?: string;
  endDate?: string;
  niches?: string[];
  locations?: string[];
  followerMin?: number;
  followerMax?: number;
  budgetMin?: number;
  budgetMax?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type RelationshipStage =
  | 'SHORTLISTED'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'COLLABORATING'
  | 'NOT_INTERESTED'
  | 'COMPLETED';

export interface RelationshipDto {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  shortlistItemId?: string;
  stage: RelationshipStage;
  contactMethod?: string;
  quotedFee?: number;
  agreedFee?: number;
  currency?: string;
  lastContactAt?: string;
  notes?: string;
  nextAction?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRelationshipRequest {
  creatorId: string;
  creatorName?: string;
  stage?: RelationshipStage;
  shortlistItemId?: string;
  contactMethod?: string;
  quotedFee?: number;
  currency?: string;
  notes?: string;
}

export interface UpdateRelationshipStageRequest {
  stage: RelationshipStage;
}

export interface UpdateRelationshipDetailsRequest {
  contactMethod?: string;
  quotedFee?: number;
  agreedFee?: number;
  currency?: string;
  notes?: string;
  nextAction?: string;
}

export interface CollaborationResponse {
  id: string;
  campaignId: string;
  relationshipId?: string;
  creatorId: string;
  agreedFee?: number;
  currency?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  publishedContentUrl?: string;
  note?: string;
  startAt?: string;
  completedAt?: string;
  updatedAt?: string;
}
