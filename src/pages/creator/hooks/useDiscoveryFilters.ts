import { campaignRecommendationPool } from '../components/discovery/recommendationLimit';
import { useState, useMemo } from 'react';
import { message } from 'antd';
import type { Creator, BrandCampaignItem } from '../components/discovery/types';
import { filterDiscoveryCreators } from '../components/discovery/discoveryFilters';

interface UseDiscoveryFiltersOptions {
  creators: Creator[];
  matchedCampaign: BrandCampaignItem | null;
  initialSortBy?: string;
}

export function useDiscoveryFilters({
  creators,
  matchedCampaign,
  initialSortBy,
}: UseDiscoveryFiltersOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [followerTier, setFollowerTier] = useState<string>('all');
  const [engagementTier, setEngagementTier] = useState<string>('all');
  const [priceTier, setPriceTier] = useState<string>('all');
  const [selectedLocation] = useState<string>('all');
  const [audienceAge, setAudienceAge] = useState<string>('all');
  const [audienceGender, setAudienceGender] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>(() => initialSortBy || 'followers');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSubmittedSearch('');
    setSelectedPlatform('all');
    setSelectedCategory('all');
    setFollowerTier('all');
    setEngagementTier('all');
    setPriceTier('all');
    setAudienceAge('all');
    setAudienceGender('all');
    setSortBy(matchedCampaign ? 'match' : 'followers');
    setCurrentPage(1);
    message.info('Đã đặt lại tất cả bộ lọc');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedPlatform !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (followerTier !== 'all') count++;
    if (engagementTier !== 'all') count++;
    if (priceTier !== 'all') count++;
    if (audienceAge !== 'all') count++;
    if (audienceGender !== 'all') count++;
    if (searchTerm.trim()) count++;
    return count;
  }, [selectedPlatform, selectedCategory, followerTier, engagementTier, priceTier, audienceAge, audienceGender, searchTerm]);

  const filteredCreators = useMemo(
    () =>
      filterDiscoveryCreators(campaignRecommendationPool(creators, !!matchedCampaign), {
        search: matchedCampaign ? '' : submittedSearch,
        platform: selectedPlatform,
        category: selectedCategory,
        followerTier,
        engagementTier,
        priceTier,
        location: selectedLocation,
        sortBy,
      }),
    [
      creators,
      matchedCampaign,
      submittedSearch,
      selectedPlatform,
      selectedCategory,
      followerTier,
      engagementTier,
      priceTier,
      selectedLocation,
      sortBy,
    ]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCreators.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCreators = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredCreators.slice(startIndex, startIndex + pageSize);
  }, [filteredCreators, safeCurrentPage, pageSize]);

  return {
    searchTerm,
    setSearchTerm,
    submittedSearch,
    setSubmittedSearch,
    selectedPlatform,
    setSelectedPlatform,
    selectedCategory,
    setSelectedCategory,
    followerTier,
    setFollowerTier,
    engagementTier,
    setEngagementTier,
    priceTier,
    setPriceTier,
    selectedLocation,
    audienceAge,
    setAudienceAge,
    audienceGender,
    setAudienceGender,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    handleResetFilters,
    activeFiltersCount,
    filteredCreators,
    totalPages,
    safeCurrentPage,
    paginatedCreators,
  };
}

