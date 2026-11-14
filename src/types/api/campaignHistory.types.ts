import type { CampaignObjective, CampaignStatus } from './campaign.types';
import type { CollaborationStatus, ExecutionSnapshot, MetricName } from './collaboration.types';

export const historyPlatforms = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE'] as const;
export type HistoryPlatform = typeof historyPlatforms[number];

export interface HistoryFilters {
  q?: string;
  status?: CampaignStatus;
  platform?: HistoryPlatform;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  size: number;
}

export interface HistoryCampaignItem {
  id: string;
  name: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  platforms: string[];
  collaborationCount: number;
  completedCount: number;
}

export interface BriefDeliverable {
  platform: HistoryPlatform;
  contentType: string;
  quantity: number;
}

export interface HistoryBrief {
  name: string | null;
  productService: string | null;
  objective: CampaignObjective | null;
  brief: string | null;
  targetAudiences: string[] | null;
  contentType: string | null;
  startDate: string | null;
  endDate: string | null;
  platforms: HistoryPlatform[] | null;
  niches: string[] | null;
  locations: string[] | null;
  followerMin: number | null;
  followerMax: number | null;
  totalBudget: number | null;
  currency: 'VND' | null;
  creatorFeeMin: number | null;
  creatorFeeMax: number | null;
  creatorMode: 'SINGLE' | 'MULTI' | null;
  targetCreatorCount: number | null;
  deliverables: BriefDeliverable[] | null;
}

export interface HistoryContext {
  id: string;
  version: number | null;
  brandContextId: string | null;
  active: boolean;
  createdAt: string;
  snapshotKind: string;
  brief: HistoryBrief;
  missingFields: string[];
}

export interface HistoryMetric {
  value: number | null;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  unavailableReasons: string[];
  unit: string;
  coverage: { requiredCollaborationCount: number; includedCollaborationCount: number; distinctPostCount: number };
}

export interface HistoryReport {
  policyVersion: string;
  financialFormulaVersion: string;
  basis: string;
  metricSource: string;
  completedCount: number;
  unfinishedCount: number;
  cancelledCount: number;
  eligibleCount: number;
  missingSourceCollaborationIds: string[];
  metrics: Record<string, HistoryMetric>;
}

export type BriefSourceKind = 'CONTEXT_SNAPSHOT' | 'CURRENT_DRAFT' | 'CURRENT_RECORD_FALLBACK';

export interface BriefOrigin {
  sourceCampaignId: string;
  sourceContextId: string | null;
  sourceRevision: number;
  sourceKind: BriefSourceKind;
}

export interface HistoryCampaign extends HistoryBrief {
  id: string;
  name: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryDetail {
  currentCampaign: HistoryCampaign;
  currentProfileSource: string;
  latestContext: HistoryContext | null;
  snapshotAvailability: 'AVAILABLE' | 'MISSING';
  dealCounts: Record<string, number>;
  report: HistoryReport;
  copyOrigin: BriefOrigin | null;
}

export interface HistoryChannel {
  creatorId: string;
  currentMasterId: string | null;
  platform: string;
  username: string | null;
  displayName: string | null;
}

export interface HistoryCollaborationItem {
  id: string;
  dealId: string | null;
  status: CollaborationStatus;
  originalMasterId: string | null;
  agreedFee: number | null;
  currency: string | null;
  executionSource: string;
  startAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  acceptedOutcomeRevision: number | null;
  provenance: string;
  currentProfileSource: string;
  currentChannels: HistoryChannel[];
}

export interface HistoryDealDeliverable {
  creatorId: string;
  contentType: string;
  quantity: number;
  dueAt?: string | null;
  acceptanceChecklist?: string[];
  maxRevisionRounds?: number | null;
}

export interface HistoryAgreement {
  proposalId: string | null;
  revision: number | null;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  source: string;
  fee: number | null;
  currency: string | null;
  terms: string | null;
  deliverables: HistoryDealDeliverable[] | null;
  consentReference: {
    agreementSource?: string; agreedAt?: string; evidenceSource?: string; evidenceUrl?: string; evidenceDescription?: string;
  } | null;
}

export interface HistoryCollaborationDetail {
  collaboration: HistoryCollaborationItem;
  agreedProposal: HistoryAgreement;
  execution: Pick<ExecutionSnapshot, 'deliverables' | 'outcomeRevisions' | 'acceptances' | 'review'>;
  legacyOutcome: {
    provenance: string;
    storedValues: Partial<Record<MetricName, number | null>> & {
      recordedAt?: string | null;
      resultNote?: string | null;
    };
  } | null;
}

export interface BriefPreview {
  source: BriefOrigin;
  draft: HistoryBrief;
  resetFields: string[];
  reviewFields: string[];
  warnings: string[];
}

export interface DuplicateBriefRequest {
  expectedSourceRevision: number;
  sourceKind: BriefSourceKind;
  sourceContextId?: string;
  draft: HistoryBrief;
}

export interface DuplicateBriefResult {
  campaign: HistoryCampaign;
  source: BriefOrigin;
}
