import type { ScoringVersion } from '../../../types/api/admin.types';

export const CURRENT_WEIGHTS: Record<string, number> = {
  engagementRate: 35,
  followerCount: 20,
  growthRate: 15,
  contentQuality: 15,
  consistency: 10,
  brandSafety: 5,
};

export const INITIAL_SCORING_VERSIONS: ScoringVersion[] = [
  {
    id: 'sv_base',
    version: 'v2.4',
    savedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    savedBy: 'System Engine',
    notes: 'Trọng số tiêu chuẩn hệ thống (Engagement 35%, Followers 20%, Growth 15%)',
    isCurrent: true,
    weights: CURRENT_WEIGHTS,
  },
];
