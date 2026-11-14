export const CAMPAIGN_RECOMMENDATION_LIMIT = 50;

/** Bound campaign results before filtering/counting/pagination, including legacy cached state. */
export function campaignRecommendationPool<T>(rows: T[], campaignSelected: boolean): T[] {
  return campaignSelected ? rows.slice(0, CAMPAIGN_RECOMMENDATION_LIMIT) : rows;
}
