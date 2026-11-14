import type { ShortlistPriority } from './creator.types';
export type ShortlistStatus = 'SAVED' | 'READY_TO_CONTACT' | 'CONTACTED' | 'REMOVED';
export interface Verification { status: string; method: string | null; verifiedAt: string | null; evidenceSource: string | null; environment: string | null }
export interface ShortlistRecord {
  id: string; campaignId: string; creatorId: string; masterId: string | null; creatorName: string | null;
  platform: string | null; avatarUrl: string | null; priority: ShortlistPriority; status: ShortlistStatus; note: string | null; addedAt: string | null;
  followers: number | null; engagementRate: number | null; niche: string | null; metricId: string | null;
  collectedAt: string | null; dataConfidence: number | null; freshnessStatus: string | null; refreshRequestStatus: string | null;
  verifiedByInfluencerMatch: boolean; verification: Verification | null; declaredProfile: unknown;
  action?: 'ADDED' | 'ALREADY_EXISTS' | 'RESTORED'; totalShortlistCount?: number; message?: string;
}
export interface CompareMetrics { metricId: string | null; niche: string | null; followers: number | null;
  avgViews: number | null; avgLikes: number | null; avgComments: number | null; avgShares: number | null;
  engagementRate: number | null; dataConfidence: number | null; freshnessStatus: string | null; collectedAt: string | null }
export interface CompareItem {
  creatorId: string; masterId: string | null; status: ShortlistStatus; feeAssessmentStatus: string | null;
  platform: string | null; userName: string | null; displayName: string | null; profileUrl: string | null; avatarUrl: string | null;
  location: string | null; creatorType: string | null; priority: ShortlistPriority; note: string | null; sourceType: string | null;
  verifiedByInfluencerMatch: boolean; authorizedAt: string | null; metrics: CompareMetrics | null;
  verification: Verification | null; declaredProfile: unknown;
}
export interface Comparison { campaignId: string; creators: CompareItem[] }
export interface BatchAddResult { campaignId: string; totalShortlistCount: number; counts: Record<string, number>;
  results: { creatorId: string; action: string; item: ShortlistRecord | null; errorCode: string | null }[] }
export interface ContactReadiness { totalSelected: number; readyCount: number; manualCount: number; unavailableCount: number; alreadyContactedCount: number;
  items: { shortlistItemId: string; creatorId: string; creatorName: string | null; readinessStatus: string; contactChannel: string | null;
    contactTarget: string | null; canProceed: boolean; reason: string | null; action: string | null }[] }
export interface OutreachResult { campaignId: string; totalRequested: number; contactedCount: number; relationshipIds: string[];
  dispatchedInvitationIds: string[]; message: string; items: { shortlistItemId: string; creatorId: string | null; creatorName: string | null;
    relationshipId: string | null; dealId: string | null; invitationId: string | null; contactStatus: string; message: string | null }[] }
