import type { CreatorRecommendationItemDto } from '../types/api/aiRecommendation.types';
import { getAuthSessionId } from './authSession';
export interface ContactAssessment {
  runId?: string;
  evaluatedCreatorIds?: string[];
  items: { creatorId: string; group: 'main' | 'reference'; position: number; score: number | null }[];
}
export function contactContext(campaignId: string, creatorIds: string[], assessment?: ContactAssessment) {
  return { contactContext: { sessionId: getAuthSessionId(), campaignId, creatorIds: [...new Set(creatorIds)], assessment } };
}
export function assessmentItems(main: CreatorRecommendationItemDto[], reference: CreatorRecommendationItemDto[]): ContactAssessment['items'] {
  return [main, reference].flatMap((rows, index) => rows.map((item, position) => ({
    creatorId: item.creatorId, group: index === 0 ? 'main' as const : 'reference' as const, position: position + 1,
    score: (item.isScoreReady === true || (index === 0 && item.isScoreReady == null)) && typeof item.finalScore === 'number' && Number.isFinite(item.finalScore) ? item.finalScore : null,
  })));
}
