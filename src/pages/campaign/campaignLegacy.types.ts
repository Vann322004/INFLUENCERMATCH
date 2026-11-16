import type { CampaignStatus, CampaignPlatform } from '../../types/api/campaign.types';
export interface CampaignItemUI {
  id: string;
  name: string;
  dateRange: string;
  niches: string[];
  status: CampaignStatus;
  statusText: string;
  statusType: 'running' | 'draft' | 'ready' | 'completed';
  platforms: CampaignPlatform[];
  extraPlatformsCount?: number;
  creatorsCount: number;
  creatorAvatars: string[];
  budgetFormatted: string;
  budgetRaw: number;
  progressPercent: number;
  updatedTime: string;
  updatedBy: string;
  thumbnail: string;
}
