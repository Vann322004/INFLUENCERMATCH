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
          let rows: any[] = [];
          try {
            const response = await creatorService.discoverCreators(matchedCampaign.id, {
              keyword: submittedSearch || undefined,
              niche: selectedCategory !== 'all' ? selectedCategory : undefined,
              minFollowers: requestedRange?.minFollowers ?? matchedCampaign.followerMin,
              maxFollowers: requestedRange ? requestedRange.maxFollowers : matchedCampaign.followerMax,
              page: 0,
              size: 30,
            });
            const raw: any = response;
            const content = Array.isArray(raw) ? raw : raw?.content ?? raw?.items ?? raw?.candidates;
            if (Array.isArray(content) && content.length > 0) {
              rows = content;
            }
          } catch (discoverErr) {
            console.warn('[useDiscoveryCreators] discoverCreators API error, falling back:', discoverErr);
            rows = [];
          }

          if (rows.length > 0) {
            result = rows.map((item) => {
              const base = mapApiCreatorToUi(item);
              const rawScore = item.matchScore ?? item.finalScore ?? item.score ?? item.hybridScore;
              const score =
                typeof rawScore === 'number' && Number.isFinite(rawScore)
                  ? Math.round(rawScore >= 0 && rawScore <= 1 ? rawScore * 100 : rawScore)
                  : 85;
              return {
                ...base,
                matchRate: score,
                matchLevel: (score >= 80 ? 'high' : score >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
                matchReason: item.reason || item.summary || item.matchReason || 'Phù hợp mục tiêu chiến dịch',
              };
            });
          } else {
            // Khi API discovery trả về rỗng, tự động lấy danh sách KOC từ Catalog hệ thống
            const allRows = await creatorService.getCreators({ strict: false });
            // Lấy tất cả thông tin ngành của chiến dịch để so sánh
            const campCategory = (
              matchedCampaign.category ||
              matchedCampaign.suggestedCategory ||
              matchedCampaign.tag ||
              ''
            ).toLowerCase();
            // Map các từ khóa ngành hàng phổ biến sang nhóm
            const beautyKeywords = ['beauty', 'làm đẹp', 'mỹ phẩm', 'skincare', 'makeup', 'chăm sóc da', 'dưỡng da', 'son', 'nước hoa'];
            const campIsBeauty = beautyKeywords.some((kw) => campCategory.includes(kw));

            result = allRows.map((item) => {
              const base = mapApiCreatorToUi(item);
              const creatorNiche = (item.niche || (item as any).category || '').toLowerCase();
              const creatorBio = (item.contentSummary || '').toLowerCase();
              const creatorIsBeauty = beautyKeywords.some((kw) => creatorNiche.includes(kw) || creatorBio.includes(kw));

              let score = 72;
              let reason = 'Đề xuất dựa trên dữ liệu hiệu suất và tương tác thực tế';

              const hasDirectMatch =
                campCategory &&
                (creatorNiche.includes(campCategory) ||
                  creatorBio.includes(campCategory) ||
                  campCategory.includes(creatorNiche.substring(0, 5)));

              if (hasDirectMatch) {
                score = 92;
                reason = `Rất phù hợp với ngành hàng "${matchedCampaign.suggestedCategory || matchedCampaign.category || matchedCampaign.tag}"`;
              } else if (campIsBeauty && creatorIsBeauty) {
                score = 92;
                reason = 'Chuyên gia làm đẹp & mỹ phẩm – phù hợp cao với chiến dịch';
              } else if (
                creatorNiche.includes('làm đẹp') ||
                creatorNiche.includes('beauty') ||
                creatorNiche.includes('chăm sóc da') ||
                creatorNiche.includes('mỹ phẩm') ||
                creatorNiche.includes('tiêu dùng')
              ) {
                score = 86;
                reason = 'Phong cách review và tệp khán giả phù hợp với thông điệp chiến dịch';
              }
              return {
                ...base,
                matchRate: score,
                matchLevel: (score >= 80 ? 'high' : score >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
                matchReason: reason,
              };
            });
          }
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

