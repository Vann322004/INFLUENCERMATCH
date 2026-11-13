import { CAMPAIGN_RECOMMENDATION_LIMIT } from '../components/discovery/recommendationLimit';
import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import type { Creator, BrandCampaignItem } from '../components/discovery/types';
import { mapApiCreatorToUi } from '../components/discovery/discoveryUtils';
import { followerRange } from '../components/discovery/discoveryFilters';
import { creatorService } from '../../../services/api/creatorService';

interface UseDiscoveryCreatorsOptions {
  loadingCampaigns: boolean;
  selectedCampaignId: string | null;
  matchedCampaign: BrandCampaignItem | null;
  submittedSearch: string;
  selectedCategory: string;
  followerTier: string;
  onResetPagination?: () => void;
  cachedCategories?: string[];
}

export function useDiscoveryCreators({
  loadingCampaigns,
  selectedCampaignId,
  matchedCampaign,
  submittedSearch,
  selectedCategory,
  followerTier,
  onResetPagination,
  cachedCategories,
}: UseDiscoveryCreatorsOptions) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [requestKey, setRequestKey] = useState(0);
  const requestVersion = useRef(0);

  const [categoriesList, setCategoriesList] = useState<string[]>(
    () => cachedCategories || []
  );

  // Load categories taxonomy
  useEffect(() => {
    let active = true;
    creatorService.getNiches().then((names) => {
      if (active) setCategoriesList(names);
    });
    return () => {
      active = false;
    };
  }, []);

  // Main creator fetch pipeline
  useEffect(() => {
    if (loadingCampaigns) return;
    if (selectedCampaignId && !matchedCampaign) {
      setCreators([]);
      setLoading(false);
      return;
    }

    let active = true;
    const version = ++requestVersion.current;
    setLoading(true);
    setIsMatching(!!matchedCampaign);
    setLoadError('');
    setCreators([]);

    const load = async () => {
      try {
        let result: Creator[];
        if (matchedCampaign) {
          const requestedRange = followerRange(followerTier);
          const limit = CAMPAIGN_RECOMMENDATION_LIMIT;
          const response = await creatorService.discoverCreators(matchedCampaign.id, {
            keyword: submittedSearch || undefined,
            niche: selectedCategory !== 'all' ? selectedCategory : undefined,
            minFollowers: requestedRange?.minFollowers ?? matchedCampaign.followerMin,
            maxFollowers: requestedRange ? requestedRange.maxFollowers : matchedCampaign.followerMax,
            page: 0,
            size: limit,
          });
          const raw: any = response;
          const rows = Array.isArray(raw) ? raw : raw?.content ?? raw?.items ?? raw?.candidates;
          if (!Array.isArray(rows)) throw new Error('Dữ liệu gợi ý Creator không đúng định dạng.');
          result = rows.slice(0, limit).map((item) => {
            const base = mapApiCreatorToUi(item);
            const rawScore = item.matchScore ?? item.finalScore ?? item.score ?? item.hybridScore;
            const score = typeof rawScore === 'number' && Number.isFinite(rawScore)
              ? Math.max(0, Math.min(100, Math.round(rawScore <= 1 ? rawScore * 100 : rawScore))) : 0;
            return {
              ...base,
              matchRate: score,
              matchLevel: (score >= 80 ? 'high' : score >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
              matchReason: item.reason || item.summary || item.matchReason || '',
            };
          });
        } else {
          const rows = await creatorService.getCreators({ strict: false });
          result = rows.map(mapApiCreatorToUi);
        }

        if (!active || version !== requestVersion.current) return;
        setCreators(result);
        if (onResetPagination) onResetPagination();
      } catch (error: any) {
        if (!active || version !== requestVersion.current) return;
        setCreators([]);
        setLoadError(error?.response?.data?.detail || error?.message || 'Không tải được danh sách creator.');
      } finally {
        if (active && version === requestVersion.current) {
          setLoading(false);
          setIsMatching(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [loadingCampaigns, matchedCampaign, requestKey, submittedSearch, selectedCategory, followerTier]);

  // Refresh single creator
  const [isRefreshingCreator, setIsRefreshingCreator] = useState(false);
  const handleRequestRefresh = async (
    target: Creator,
    onSuccess?: (updated: Creator) => void
  ) => {
    setIsRefreshingCreator(true);
    message.loading({ content: `Đang đồng bộ số liệu mới nhất cho @${target.username}...`, key: 'refresh_creator' });
    try {
      const freshList = await creatorService.getCreators({ strict: true });
      const freshData = freshList.find((c) => c.userName === target.username || c.id === target.id);
      if (freshData) {
        const freshMapped = mapApiCreatorToUi(freshData);
        const updatedCreator: Creator = {
          ...freshMapped,
          matchRate: target.matchRate,
          matchLevel: target.matchLevel,
          matchReason: target.matchReason,
          saved: target.saved,
        };
        setCreators((prev) => prev.map((c) => (c.id === updatedCreator.id ? updatedCreator : c)));
        if (onSuccess) onSuccess(updatedCreator);
        message.success({ content: `Đã cập nhật số liệu mới nhất của @${target.username}!`, key: 'refresh_creator' });
      } else {
        message.info({ content: 'Số liệu hiện tại đã là phiên bản mới nhất từ mạng xã hội.', key: 'refresh_creator' });
      }
    } catch {
      message.error({ content: 'Không thể kết nối đến máy chủ để làm mới số liệu.', key: 'refresh_creator' });
    } finally {
      setIsRefreshingCreator(false);
    }
  };

  return {
    creators,
    setCreators,
    loading,
    isMatching,
    loadError,
    requestKey,
    setRequestKey,
    categoriesList,
    isRefreshingCreator,
    handleRequestRefresh,
  };
}

