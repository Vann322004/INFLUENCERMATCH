import type { CampaignStatus } from './campaign.types';

export type CollaborationStatus = 'PLANNED' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CollaborationChannel {
  creatorId: string;
  relationshipId?: string;
  platform?: string;
  creatorName?: string;
  username?: string;
}

export interface CollaborationSummary {
  id: string;
  campaignId: string;
  campaignName?: string;
  brandName?: string;
  creatorId: string;
  creatorName?: string;
  channelName?: string;
  platform?: string;
  avatarUrl?: string;
  agreedFee?: number | null;
  currency?: string | null;
  status: CollaborationStatus;
  updatedAt?: string;
  hasOutcome: boolean;
  hasReview: boolean;
  channels: CollaborationChannel[];
}

export interface CollaborationDetail extends Omit<CollaborationSummary, 'hasOutcome' | 'hasReview'> {
  outcome?: LegacyOutcome | null;
}

export interface DeliverableSubmission {
  id: string;
  revision: number;
  url: string;
  source: 'CREATOR_PORTAL' | 'BRAND_EXTERNAL';
  sourceDescription?: string | null;
  createdAt: string;
}

export interface ContentDecision {
  id: string;
  submissionRevision: number;
  decision: 'APPROVE' | 'REQUEST_CHANGES';
  checklist: string[];
  reason?: string | null;
  createdAt: string;
}

export interface Publication {
  id: string;
  submissionRevision: number;
  url: string;
  earlyPublication: boolean;
  exceptionAcknowledged: boolean;
  exceptionReason?: string | null;
}

export interface Deliverable {
  id: string;
  creatorId: string;
  contentType: string;
  dueAt: string;
  acceptanceChecklist: string[];
  maxRevisionRounds: number;
  revisionRounds: number;
  revision: number;
  submissionRevision: number;
  status: 'PENDING' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'APPROVED';
  submissions: DeliverableSubmission[];
  reviews: ContentDecision[];
  publications: Publication[];
}

export interface LegacyOutcome extends Partial<Record<MetricName, number | null>> {
  id: string;
  source?: string | null;
  recordedAt?: string | null;
  publishedContentUrl?: string | null;
  resultNote?: string | null;
}

export type MetricName = 'views' | 'clicks' | 'likes' | 'comments' | 'shares';

export interface Measurement extends Partial<Record<MetricName, number | null>> {
  deliverableId: string;
  submissionRevision: number;
  periodStart: string;
  periodEnd: string;
  unavailableMetrics?: MetricName[];
  evidenceUrl?: string;
}

export interface OutcomeValues {
  posts: Measurement[];
  resultNote?: string;
  costs?: { description: string; amount: number }[];
  currency?: 'VND';
  gmv?: number | null;
  revenue?: number | null;
  periodStart?: string;
  periodEnd?: string;
  financialEvidence?: string;
  financialConfirmed?: boolean;
}

export type RatioName = 'roas' | 'roi' | 'cpm' | 'cpe';

export type OutcomeCalculation = Partial<Record<MetricName | RatioName | 'actualCost', number | null>>
  & Partial<Record<`${RatioName}UnavailableReason`, string>>
  & { metricSource?: string; formulaVersion?: string };

export interface OutcomeRevision {
  id: string;
  revision: number;
  source: string;
  reason?: string;
  createdAt: string;
  payload: OutcomeValues;
  calculation: OutcomeCalculation;
}

export interface Acceptance {
  id: string;
  outcomeRevision: number;
  acceptedAt: string;
  reopenedAt?: string | null;
  reopenReason?: string | null;
}

export interface ReviewValues {
  overallRating: number;
  brandFitRating: number;
  wouldCollaborateAgain: boolean;
  note?: string;
  reviewTags: string[];
}

export interface FinalReview extends ReviewValues {
  id: string;
  acceptedOutcomeRevision?: number | null;
  reviewedAt: string;
}

export interface ExecutionSnapshot {
  id: string;
  campaignId: string;
  campaignStatus: CampaignStatus;
  status: CollaborationStatus;
  paymentStatus?: PaymentStatus | null;
  agreedFee?: number | null;
  currency?: string | null;
  executionSource: string;
  executionRevision: number;
  dealId?: string;
  dealRevision?: number;
  assignmentStatus?: 'READY' | 'WAITING_FOR_VERIFICATION' | 'WAITING_FOR_ACCEPTANCE' | 'NO_CONFIRMED_PROPOSAL';
  deliverables: Deliverable[];
  outcomeRevisions: OutcomeRevision[];
  acceptances: Acceptance[];
  review?: FinalReview | null;
}

export interface LegacyPlan {
  sourceDescription: string;
  deliverables: {
    creatorId: string;
    contentType: string;
    quantity: number;
    dueAt: string;
    acceptanceChecklist: string[];
    maxRevisionRounds: number;
  }[];
}

export interface PendingAssignment {
  collaborationId: string;
  dealRevision: number;
  proposalRevision: number;
  campaignName: string;
  brandName: string;
  channels: CollaborationChannel[];
  deliverables: LegacyPlan['deliverables'];
  fee: number;
  currency: string;
  terms: string;
}
