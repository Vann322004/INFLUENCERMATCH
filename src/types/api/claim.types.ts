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
  linkedToClaimant?: boolean;
  verification?: { status: string; method?: string | null; environment?: string | null };

  status: ClaimStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reason?: string;

  // Private evidence: claimant and authorized reviewers only.
  evidenceType?: string;
  evidenceUrl?: string;
  evidenceUrls?: string[];
  evidenceNote?: string;
}

export interface ClaimListParams {
  q?: string;
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
