// =============================================
// CREATOR CLAIM TYPES - InfluencerMatch
// Maps to: GET /data/creator-claims
//          GET /data/creator-claims/{id}
//          PATCH /data/creator-claims/{id}/review
//          POST /data/creator-claims/{id}/revoke
// =============================================

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface ClaimResponse {
  id: string;
  creatorId: string;
  creatorHandle?: string;
  creatorName?: string;
  creatorPlatform?: string;
  creatorFollowers?: number;
  creatorAvatar?: string;

  claimantId: string;
  claimantName?: string;
  claimantEmail?: string;
  claimantAvatar?: string;

  status: ClaimStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reason?: string;

  // Evidence fields (private, only visible to admins)
  evidenceType?: string;
  evidenceUrl?: string;
  evidenceNote?: string;
}

export interface ClaimListParams {
  status?: ClaimStatus;
  creatorId?: string;
  claimantId?: string;
  page?: number;
  size?: number;
}

export interface ReviewRequest {
  approved: boolean;
  reason: string;
}

export interface RevokeRequest {
  reason: string;
}

export interface SubmitClaimRequest {
  evidenceUrls?: string[];
  note?: string;
}
