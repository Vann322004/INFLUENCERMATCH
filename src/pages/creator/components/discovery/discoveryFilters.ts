import type { Creator } from './types';

export function normalizeDiscoveryText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function followerRange(tier: string) {
  if (tier === 'nano') return { minFollowers: 0, maxFollowers: 49999 };
  if (tier === 'micro') return { minFollowers: 50000, maxFollowers: 199999 };
  if (tier === 'macro') return { minFollowers: 200000, maxFollowers: 499999 };
  if (tier === 'mega') return { minFollowers: 500000, maxFollowers: undefined };
  return null;
}

interface DiscoveryFilters {
  search: string;
  platform: string;
  category: string;
  followerTier: string;
  engagementTier: string;
  priceTier: string;
  location: string;
  sortBy: string;
}

export function filterDiscoveryCreators(creators: Creator[], filters: DiscoveryFilters): Creator[] {
  const query = normalizeDiscoveryText(filters.search);
  const category = normalizeDiscoveryText(filters.category);
  const range = followerRange(filters.followerTier);
  return creators.filter(creator => {
    if (query && ![creator.name, creator.username, creator.bio, ...(creator.sourceCategories || creator.categories)]
      .some(text => normalizeDiscoveryText(text).includes(query))) return false;
    if (filters.platform !== 'all' && !creator.platforms.includes(filters.platform as any)) return false;
    if (filters.category !== 'all' && !(creator.sourceCategories || creator.categories)
      .some(value => normalizeDiscoveryText(value).includes(category))) return false;
    if (range && (creator.followersCount < range.minFollowers || (range.maxFollowers != null && creator.followersCount > range.maxFollowers))) return false;
    if (filters.engagementTier !== 'all') {
      if (!creator.hasReportedEngagement) return false;
      if (creator.engagementValue < (filters.engagementTier === 'vhigh' ? 8 : 5)) return false;
    }
    if (filters.priceTier !== 'all') {
      if (!creator.hasReportedPrice) return false;
      if (filters.priceTier === 'low' && creator.avgPriceValue >= 500) return false;
      if (filters.priceTier === 'mid' && (creator.avgPriceValue < 500 || creator.avgPriceValue > 1000)) return false;
      if (filters.priceTier === 'high' && creator.avgPriceValue <= 1000) return false;
    }
    if (filters.location !== 'all' && normalizeDiscoveryText(creator.location) !== normalizeDiscoveryText(filters.location)) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'followers') return b.followersCount - a.followersCount;
    if (filters.sortBy === 'engagement') return b.engagementValue - a.engagementValue;
    if (filters.sortBy === 'priceAsc') return (a.hasReportedPrice ? a.avgPriceValue : Infinity) - (b.hasReportedPrice ? b.avgPriceValue : Infinity);
    if (filters.sortBy === 'priceDesc') return (b.hasReportedPrice ? b.avgPriceValue : -Infinity) - (a.hasReportedPrice ? a.avgPriceValue : -Infinity);
    return b.matchRate - a.matchRate;
  });
}
