// =============================================
// COLLABORATION TYPES - InfluencerMatch
// Maps to: POST /campaigns/{id}/collaborations
//          POST /collaborations/{id}/outcome
//          POST /collaborations/{id}/review
// =============================================

export interface CreateCollaborationRequest {
  relationshipId: string;
  agreedFee?: number;
  currency?: string;
  note?: string;
}

export interface CollaborationResponse {
  id: string;
  campaignId: string;
  relationshipId: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string;
  agreedFee?: number;
  currency?: string;
  status?: string;
  paymentStatus?: string;
  publishedContentUrl?: string;
  note?: string;
  startAt?: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface RecordOutcomeRequest {
  views?: number;
  clicks?: number;
  publishedContentUrl?: string;
  resultNote?: string;
}

export interface OutcomeResponse {
  id: string;
  collaborationId: string;
  views?: number;
  clicks?: number;
  publishedContentUrl?: string;
  resultNote?: string;
  source?: string;
  recordedAt?: string;
  completedAt?: string;
}

export interface CreateCreatorReviewRequest {
  overallRating: number;
  brandFitRating: number;
  wouldCollaborateAgain?: boolean;
  note?: string;
}

export interface CreatorReviewResponse {
  id: string;
  collaborationId: string;
  outcomeId?: string;
  reviewedByUserId?: string;
  overallRating: number;
  brandFitRating: number;
  wouldCollaborateAgain: boolean;
  note?: string;
  reviewedAt?: string;
}
