import type { RecommendationRun } from '../types/api/aiRecommendation.types';
export function orderedRuns(runs: RecommendationRun[], campaignId: string): RecommendationRun[] {
  const time = (value: string) => { const clean = value.trim().replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1'); const parsed = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(clean) ? clean : clean + 'Z').getTime(); return Number.isFinite(parsed) ? parsed : 0; };
  return runs.filter(run => run.campaignId === campaignId)
    .sort((a, b) => time(b.createdAt) - time(a.createdAt) || b.id.localeCompare(a.id));
}
export function completedRuns(runs: RecommendationRun[], campaignId: string): RecommendationRun[] {
  return orderedRuns(runs, campaignId).filter(run => run.status === 'COMPLETED' && Array.isArray(run.scoringSnapshot));
}
export function coveringRun(runs: RecommendationRun[], campaignId: string, creatorIds: string[]) {
  if (!creatorIds.length) return null;
  return completedRuns(runs, campaignId).find(run => creatorIds.every(id => run.scoringSnapshot!.some(item => item.creatorId === id) || (Array.isArray(run.runMetadata?.evaluatedCreatorIds) && run.runMetadata.evaluatedCreatorIds.includes(id)))) ?? null;
}

export function evaluatedCreatorIds(runs: RecommendationRun[], campaignId: string): string[] {
  const ids = new Set<string>();
  for (const run of completedRuns(runs, campaignId)) {
    const excluded = new Set(run.excludedCandidates?.map(item => item.creatorId) ?? []);
    for (const item of run.scoringSnapshot ?? []) {
      if (item.recommendationTier && !['HISTORY_SUPPORTED', 'LIMITED_HISTORY', 'LIMITED_STABILITY'].includes(item.recommendationTier)) excluded.add(item.creatorId);
      else if (!excluded.has(item.creatorId)) ids.add(item.creatorId);
    }
    if (Array.isArray(run.runMetadata?.evaluatedCreatorIds)) for (const id of run.runMetadata.evaluatedCreatorIds) if (!excluded.has(id)) ids.add(id);
  }
  return [...ids];
}
