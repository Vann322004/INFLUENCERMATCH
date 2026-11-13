export interface CreatorMasterSummary {
  totalMasters: number;
  claimedChannelsCount: number;
  unclaimedChannelsCount: number;
  duplicateCandidatesCount: number;
}

export interface CrawlerTrendPoint {
  date: string;
  ingestedCount: number;
  successCount: number;
  failedCount: number;
}

export interface CrawlerTrends {
  items: CrawlerTrendPoint[];
  source: string | null;
  isFallback: boolean | null;
}

export interface NicheStatistic {
  niche: string;
  name: string;
  creatorCount: number;
  percentage: number;
}
