import type { CampaignResponse } from '../../../../types/api/campaign.types';
import type { Campaign } from '../../../../data/mockData';

export type CampaignStatusType = 'running' | 'draft' | 'completed' | 'cancelled';
export type CampaignDetailTabKey = 'overview' | 'creators' | 'budget' | 'timeline' | 'guidelines';

export interface CampaignCreatorRow {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: 'instagram' | 'tiktok';
  followers: string;
  fee: string;
  stageText: string;
  stageColor: string;
  deliverableStatus: string;
  deliverableColor: string;
}

export interface CampaignDetailCacheEntry {
  rawCampaign: CampaignResponse;
  campaign: Campaign;
  participatingCreators: CampaignCreatorRow[];
  currentStatus: CampaignStatusType;
  timestamp: number;
}
