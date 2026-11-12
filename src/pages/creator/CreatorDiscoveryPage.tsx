import React, { useState, useEffect, useMemo, useRef } from 'react';
import { message } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { TeamOutlined, GlobalOutlined } from '@ant-design/icons';

import type { Creator, BrandCampaignItem } from './components/discovery/types';
import {
  mapApiCreatorToUi,
  mapApiCampaignToItem,
  computeCreatorMatch,
  updateDiscoveryCache,
  loadCachedDiscovery,
} from './components/discovery/discoveryUtils';

import WorkflowStepBar from './components/discovery/WorkflowStepBar';
import CampaignMatchBanner from './components/discovery/CampaignMatchBanner';
import DiscoveryFilterSection from './components/discovery/DiscoveryFilterSection';
import DiscoveryResultsToolbar from './components/discovery/DiscoveryResultsToolbar';
import CreatorGridList from './components/discovery/CreatorGridList';
import CreatorDetailDrawer from './components/discovery/CreatorDetailDrawer';

import ExternalDiscovery from '../../components/discovery/ExternalDiscovery';
import AddToShortlistModal from '../../components/discovery/AddToShortlistModal';
import { creatorService, DEFAULT_CREATORS } from '../../services/api/creatorService';
import { campaignService } from '../../services/api/campaignService';
import './CreatorDiscoveryPage.css';

export type { Creator, BrandCampaignItem };

export default function CreatorDiscoveryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialCampId =
    searchParams.get('campaignId') ||
    (location.state as any)?.campaignId ||
    sessionStorage.getItem('current_campaign_id') ||
    localStorage.getItem('IM_SELECTED_CAMPAIGN_ID') ||
    null;

  const cachedData = useMemo(() => loadCachedDiscovery(), []);

  // Real Brand Campaigns loaded from API
  const [campaignsList, setCampaignsList] = useState<BrandCampaignItem[]>([]);
  const [, setLoadingCampaigns] = useState<boolean>(true);

  // Campaign Matching States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    () => initialCampId || null
  );

  const [matchedCampaign, setMatchedCampaign] = useState<BrandCampaignItem | null>(() => {
    const passed = (location.state as any)?.createdCampaign;
    if (passed) return mapApiCampaignToItem(passed);
    try {
      const rawStored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (parsed && (parsed.id === initialCampId || initialCampId)) {
          return {
            id: parsed.id || initialCampId,
            name: parsed.name || 'Chiến dịch mới',
            tag: parsed.category || 'Mới khởi tạo',
            target: parsed.target || parsed.targetAudience || 'Khán giả mục tiêu',
            budget: parsed.budget || '25.0M VND',
            targetAudience: parsed.targetAudience || 'Khán giả mục tiêu',
            category: parsed.category || 'Làm đẹp & Mỹ phẩm',
            channels: parsed.channels || ['tiktok'],
            status: 'ACTIVE',
            requirements: parsed.requirements || '',
            followerMin: parsed.followerMin ? Number(parsed.followerMin) : undefined,
            followerMax: parsed.followerMax ? Number(parsed.followerMax) : undefined,
          };
        }
      }
    } catch {}
    return null;
  });

  const [isMatching, setIsMatching] = useState(false);
  const [shortlistModalCreator, setShortlistModalCreator] = useState<Creator | null>(null);
  const hasAutoMatchedRef = useRef(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [followerTier, setFollowerTier] = useState<string>('all');
  const [engagementTier, setEngagementTier] = useState<string>('all');
  const [priceTier, setPriceTier] = useState<string>('all');
  const [selectedLocation] = useState<string>('all');
  const [audienceAge, setAudienceAge] = useState<string>('all');
  const [audienceGender, setAudienceGender] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>(() => (initialCampId ? 'match' : 'followers'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Mode & Selection
  const [discoveryMode, setDiscoveryMode] = useState<'database' | 'external'>('database');
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<Set<string>>(new Set());

  // Drawer Preview
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isRefreshingCreator, setIsRefreshingCreator] = useState(false);

  // Creators list: Khởi tạo với cache hoặc danh sách Creator chuẩn để tránh trắng trang
  const [loading, setLoading] = useState<boolean>(false);
  const [creators, setCreators] = useState<Creator[]>(() => {
    try {
      const raw = localStorage.getItem('IM_DISCOVERY_CREATORS');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CREATORS.map(mapApiCreatorToUi);
  });

  const [categoriesList, setCategoriesList] = useState<string[]>(
    () => cachedData?.categoriesList || []
  );

  // Load Brand Campaigns
  useEffect(() => {
    let isMounted = true;
    const fetchBrandCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const apiCampaigns = await campaignService.getCampaigns(0, 50);
        if (!isMounted) return;

        let mapped: BrandCampaignItem[] = [];
        if (Array.isArray(apiCampaigns) && apiCampaigns.length > 0) {
          mapped = apiCampaigns.map(mapApiCampaignToItem);
        }

        const targetId = initialCampId;
        let matched: BrandCampaignItem | undefined;
        if (targetId) {
          matched = mapped.find((c) => c.id === targetId);

          const passedCampaign = (location.state as any)?.createdCampaign;
          let storedCampaign: any = null;
          try {
            const rawStored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
            if (rawStored) storedCampaign = JSON.parse(rawStored);
          } catch {}

          if (!matched) {
            if (passedCampaign && (passedCampaign.id === targetId || !passedCampaign.id)) {
              matched = mapApiCampaignToItem(passedCampaign);
            } else {
              try {
                const fetched = await campaignService.getCampaignById(targetId);
                if (fetched) {
                  matched = mapApiCampaignToItem(fetched);
                }
              } catch {
                if (storedCampaign && (storedCampaign.id === targetId || targetId)) {
                  matched = {
                    id: targetId,
                    name: storedCampaign.name || passedCampaign?.name || 'Chiến dịch mới',
                    tag: storedCampaign.category || 'Mới khởi tạo',
                    target: storedCampaign.target || storedCampaign.targetAudience || 'Khán giả mục tiêu',
                    budget: storedCampaign.budget || '25.0M VND',
                    targetAudience: storedCampaign.targetAudience || 'Khán giả mục tiêu',
                    category: storedCampaign.category || 'Làm đẹp & Mỹ phẩm',
                    channels: storedCampaign.channels || ['tiktok'],
                    status: 'ACTIVE',
                    requirements: storedCampaign.requirements || '',
                    followerMin: storedCampaign.followerMin ? Number(storedCampaign.followerMin) : undefined,
                    followerMax: storedCampaign.followerMax ? Number(storedCampaign.followerMax) : undefined,
                  };
                }
              }
            }
          }

          if (matched) {
            if (!matched.followerMin && passedCampaign?.followerMin) {
              matched.followerMin = Number(passedCampaign.followerMin);
            }
            if (!matched.followerMax && passedCampaign?.followerMax) {
              matched.followerMax = Number(passedCampaign.followerMax);
            }
            if (!matched.followerMin && storedCampaign?.followerMin) {
              matched.followerMin = Number(storedCampaign.followerMin);
            }
            if (!matched.followerMax && storedCampaign?.followerMax) {
              matched.followerMax = Number(storedCampaign.followerMax);
            }

            mapped = [matched, ...mapped.filter((c) => c.id !== matched!.id)];
          }
        }

        setCampaignsList(mapped);
        updateDiscoveryCache({ campaigns: mapped });

        if (matched) {
          setSelectedCampaignId(matched.id);
          setMatchedCampaign(matched);
          setSortBy('match');
          setCurrentPage(1);
          updateDiscoveryCache({ matchedCampaign: matched, selectedCampaignId: matched.id });
          message.success({
            content: `Đã tự động chọn dự án "${matched.name}" để đề xuất Creator!`,
            key: 'auto_selected_campaign',
            duration: 2.5,
          });
          if (searchParams.get('autoRun') === 'true' && !hasAutoMatchedRef.current) {
            hasAutoMatchedRef.current = true;
            setTimeout(() => {
              handleTriggerMatch(matched);
            }, 200);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải chiến dịch thực tế từ API:', err);
      } finally {
        if (isMounted) setLoadingCampaigns(false);
      }
    };

    fetchBrandCampaigns();
    return () => {
      isMounted = false;
    };
  }, [initialCampId, location.state]);

  // Trigger matching for a selected campaign
  const handleTriggerMatch = async (targetCamp?: BrandCampaignItem) => {
    const camp = targetCamp || campaignsList.find((c) => c.id === selectedCampaignId);
    if (!camp) {
      message.warning('Vui lòng chọn một Dự án / Chiến dịch trước khi tìm kiếm Creator!');
      return;
    }

    setIsMatching(true);
    setLoading(true);
    message.loading({
      content: `Đang tìm kiếm KOC phù hợp cho chiến dịch "${camp.name}"...`,
      key: 'campaign_match',
    });

    try {
      let minF: number | undefined = camp.followerMin;
      let maxF: number | undefined = camp.followerMax;

      if (camp.followerMin || camp.followerMax) {
        minF = camp.followerMin;
        maxF = camp.followerMax;
      } else {
        if (followerTier === 'nano') { minF = 1000; maxF = 50000; }
        else if (followerTier === 'micro') { minF = 50000; maxF = 200000; }
        else if (followerTier === 'macro') { minF = 200000; maxF = 500000; }
        else if (followerTier === 'mega') { minF = 500000; maxF = undefined; }
      }

      if (camp.followerMin) {
        if (camp.followerMin >= 500000) setFollowerTier('mega');
        else if (camp.followerMin >= 200000) setFollowerTier('macro');
        else if (camp.followerMin >= 50000) setFollowerTier('micro');
        else setFollowerTier('nano');
      }

      let backendCandidates: any[] = [];
      try {
        const res = await creatorService.discoverCreators(camp.id, {
          keyword: searchTerm.trim() || undefined,
          niche: selectedCategory !== 'all' ? selectedCategory : undefined,
          minFollowers: minF,
          maxFollowers: maxF,
          page: 0,
          size: 20,
        });
        if (Array.isArray(res)) backendCandidates = res;
        else if (Array.isArray(res?.content)) backendCandidates = res.content;
        else if (Array.isArray(res?.items)) backendCandidates = res.items;
        else if (Array.isArray((res as any)?.candidates)) backendCandidates = (res as any).candidates;
      } catch (apiErr) {
        console.warn('Backend discovery pipeline notice, using local hybrid matching:', apiErr);
      }

      setMatchedCampaign(camp);
      setSelectedCampaignId(camp.id);
      setSortBy('match');
      setCurrentPage(1);

      if (backendCandidates.length > 0) {
        const mappedFromBackend: Creator[] = backendCandidates.map((item) => {
          const baseUi = mapApiCreatorToUi(item);
          const rawScore = item.matchScore ?? item.finalScore ?? item.score;
          const scorePercent = typeof rawScore === 'number'
            ? (rawScore <= 1 && rawScore > 0 ? Math.round(rawScore * 100) : Math.round(rawScore))
            : (baseUi.matchRate || 85);
          return {
            ...baseUi,
            matchRate: scorePercent,
            matchLevel: (scorePercent >= 80 ? 'high' : scorePercent >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
            matchReason: item.reason || item.summary || item.matchReason || `Được xếp hạng bởi 4-Stage Discovery Pipeline cho "${camp.name}"`,
          };
        });

        const returnedIds = new Set(mappedFromBackend.map((c) => c.id));
        setCreators((prev) => {
          const remaining = prev
            .filter((c) => !returnedIds.has(c.id))
            .map((c) => {
              const res = computeCreatorMatch(c, camp);
              return {
                ...c,
                matchRate: res.matchRate,
                matchLevel: res.matchLevel,
                matchReason: res.reason,
              };
            });
          const combined = [...mappedFromBackend, ...remaining];
          updateDiscoveryCache({ creators: combined, matchedCampaign: camp, selectedCampaignId: camp.id });
          try {
            localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify(camp));
            localStorage.setItem('IM_DISCOVERY_CREATORS', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      } else {
        setCreators((prev) => {
          const base = prev.length > 0 ? prev : DEFAULT_CREATORS.map(mapApiCreatorToUi);
          const updated = base.map((c) => {
            const res = computeCreatorMatch(c, camp);
            return {
              ...c,
              matchRate: res.matchRate,
              matchLevel: res.matchLevel,
              matchReason: res.reason,
            };
          });
          updateDiscoveryCache({ creators: updated, matchedCampaign: camp, selectedCampaignId: camp.id });
          try {
            localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify(camp));
            localStorage.setItem('IM_DISCOVERY_CREATORS', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      message.destroy('campaign_match');
    } finally {
      setIsMatching(false);
      setLoading(false);
    }
  };

  const handleClearMatch = () => {
    setSelectedCampaignId(null);
    setMatchedCampaign(null);
    setSortBy('followers');
    try {
      localStorage.removeItem('IM_MATCHED_CAMPAIGN');
      localStorage.removeItem('IM_SELECTED_CAMPAIGN_ID');
    } catch {}
    setCreators((prev) => {
      const reset = prev.map((c) => ({ ...c, matchRate: 0, matchReason: '' }));
      updateDiscoveryCache({ matchedCampaign: null, selectedCampaignId: null, creators: reset });
      return reset;
    });
    message.info('Đã thoát chế độ gợi ý chiến dịch. Đang hiển thị danh sách khám phá toàn bộ KOC.');
  };

  // Load Creators and Niches
  useEffect(() => {
    let isMounted = true;
    const fetchCreatorsAndNiches = async () => {
      if (isMatching) return;
      setLoading(true);

      try {
        const [apiNiches] = await Promise.all([
          creatorService.getNiches().catch(() => []),
        ]);

        if (isMounted && Array.isArray(apiNiches)) {
          setCategoriesList(apiNiches);
          updateDiscoveryCache({ categoriesList: apiNiches });
        }

        let loadedCandidates: any[] = [];
        if (matchedCampaign?.id) {
          try {
            const discoveryRes = await creatorService.discoverCreators(matchedCampaign.id, {
              keyword: searchTerm.trim() || undefined,
              niche: selectedCategory !== 'all' ? selectedCategory : undefined,
              minFollowers: matchedCampaign.followerMin,
              maxFollowers: matchedCampaign.followerMax,
              page: 0,
              size: 20,
            });
            if (Array.isArray(discoveryRes)) loadedCandidates = discoveryRes;
            else if (Array.isArray((discoveryRes as any)?.content)) loadedCandidates = (discoveryRes as any).content;
            else if (Array.isArray((discoveryRes as any)?.items)) loadedCandidates = (discoveryRes as any).items;
            else if (Array.isArray((discoveryRes as any)?.candidates)) loadedCandidates = (discoveryRes as any).candidates;
          } catch (discErr) {
            console.warn('[CreatorDiscoveryPage] Backend 4-stage discovery notice:', discErr);
          }
        }

        if (isMounted) {
          if (loadedCandidates.length > 0) {
            const mapped = loadedCandidates.map((cand) => {
              const ui = mapApiCreatorToUi(cand);
              const rawScore = cand.matchScore ?? cand.finalScore ?? cand.score;
              const scorePercent = typeof rawScore === 'number'
                ? (rawScore <= 1 && rawScore > 0 ? Math.round(rawScore * 100) : Math.round(rawScore))
                : 85;
              return {
                ...ui,
                matchRate: scorePercent,
                matchLevel: (scorePercent >= 80 ? 'high' : scorePercent >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
                matchReason: cand.reason || cand.summary || cand.matchReason || `Được xếp hạng bởi 4-Stage Discovery Pipeline cho "${matchedCampaign!.name}"`,
              };
            });
            setCreators(mapped);
            updateDiscoveryCache({ creators: mapped, matchedCampaign });
          } else {
            const apiCreators = await creatorService.getCreators();
            const sourceList = (Array.isArray(apiCreators) && apiCreators.length > 0)
              ? apiCreators
              : DEFAULT_CREATORS;
            if (isMounted) {
              const rawUi = sourceList.map(mapApiCreatorToUi);
              let finalList = rawUi;
              if (matchedCampaign) {
                finalList = rawUi.map((c) => {
                  const res = computeCreatorMatch(c, matchedCampaign);
                  return {
                    ...c,
                    matchRate: res.matchRate,
                    matchLevel: res.matchLevel,
                    matchReason: res.reason,
                  };
                });
              }
              setCreators(finalList);
              updateDiscoveryCache({ creators: finalList, matchedCampaign });
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải creators:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCreatorsAndNiches();
    return () => {
      isMounted = false;
    };
  }, [matchedCampaign]);

  // Refresh single creator stats from API
  const handleRequestRefresh = async () => {
    if (!selectedCreator) return;
    setIsRefreshingCreator(true);
    message.loading({ content: `Đang đồng bộ số liệu mới nhất cho @${selectedCreator.username}...`, key: 'refresh_creator' });
    try {
      const freshList = await creatorService.getCreators();
      const freshData = freshList.find((c) => c.userName === selectedCreator.username || c.id === selectedCreator.id);
      if (freshData) {
        const freshMapped = mapApiCreatorToUi(freshData);
        const matchRes = matchedCampaign ? computeCreatorMatch(freshMapped, matchedCampaign) : null;
        const updatedCreator: Creator = {
          ...freshMapped,
          matchRate: matchRes ? matchRes.matchRate : selectedCreator.matchRate,
          matchLevel: matchRes ? matchRes.matchLevel : selectedCreator.matchLevel,
          matchReason: matchRes ? matchRes.reason : selectedCreator.matchReason,
          saved: selectedCreator.saved,
        };
        setSelectedCreator(updatedCreator);
        setCreators((prev) => prev.map((c) => (c.id === updatedCreator.id ? updatedCreator : c)));
        message.success({ content: `Đã cập nhật số liệu mới nhất của @${selectedCreator.username}!`, key: 'refresh_creator' });
      } else {
        message.info({ content: 'Số liệu hiện tại đã là phiên bản mới nhất từ mạng xã hội.', key: 'refresh_creator' });
      }
    } catch {
      message.error({ content: 'Không thể kết nối đến máy chủ để làm mới số liệu.', key: 'refresh_creator' });
    } finally {
      setIsRefreshingCreator(false);
    }
  };

  // Toggle selection
  const handleToggleSelectCreator = (id: string) => {
    setSelectedCreatorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (paginatedCreators.length === 0) return;
    const allSelected = paginatedCreators.every((c) => selectedCreatorIds.has(c.id));
    setSelectedCreatorIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        paginatedCreators.forEach((c) => next.delete(c.id));
      } else {
        paginatedCreators.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPlatform('all');
    setSelectedCategory('all');
    setFollowerTier('all');
    setEngagementTier('all');
    setPriceTier('all');
    setAudienceAge('all');
    setAudienceGender('all');
    setSortBy('match');
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

  // Filter & Sort Logic
  const filteredCreators = useMemo(() => {
    const baseList = creators
      .filter((c) => {
        if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          const matchName = c.name.toLowerCase().includes(lower);
          const matchUsername = c.username.toLowerCase().includes(lower);
          const matchBio = c.bio.toLowerCase().includes(lower);
          const matchCat = c.categories.some((cat) => cat.toLowerCase().includes(lower));
          if (!matchName && !matchUsername && !matchBio && !matchCat) return false;
        }

        if (selectedPlatform !== 'all') {
          if (!c.platforms.includes(selectedPlatform as any)) return false;
        }

        if (selectedCategory !== 'all') {
          if (!c.categories.includes(selectedCategory)) return false;
        }

        if (followerTier === 'nano' && c.followersCount > 50000) return false;
        if (followerTier === 'micro' && (c.followersCount < 50000 || c.followersCount > 200000)) return false;
        if (followerTier === 'macro' && (c.followersCount < 200000 || c.followersCount > 500000)) return false;
        if (followerTier === 'mega' && c.followersCount < 500000) return false;

        if (engagementTier === 'high' && c.engagementValue < 5) return false;
        if (engagementTier === 'vhigh' && c.engagementValue < 8) return false;

        if (priceTier === 'low' && c.avgPriceValue > 500) return false;
        if (priceTier === 'mid' && (c.avgPriceValue < 500 || c.avgPriceValue > 1000)) return false;
        if (priceTier === 'high' && c.avgPriceValue < 1000) return false;

        if (selectedLocation !== 'all' && c.location !== selectedLocation) return false;

        if (matchedCampaign) {
          if (matchedCampaign.followerMin && c.followersCount < matchedCampaign.followerMin) {
            return false;
          }
          if (matchedCampaign.followerMax && c.followersCount > matchedCampaign.followerMax) {
            return false;
          }
          if (c.matchRate < 65 || c.matchLevel === 'low') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (matchedCampaign) {
          if ((b.matchRate || 0) !== (a.matchRate || 0)) {
            return (b.matchRate || 0) - (a.matchRate || 0);
          }
          return (b.engagementValue || 0) - (a.engagementValue || 0);
        }
        if (sortBy === 'match') {
          if ((b.matchRate || 0) !== (a.matchRate || 0)) {
            return (b.matchRate || 0) - (a.matchRate || 0);
          }
          return (b.engagementValue || 0) - (a.engagementValue || 0);
        }
        if (sortBy === 'followers') return b.followersCount - a.followersCount;
        if (sortBy === 'engagement') return b.engagementValue - a.engagementValue;
        if (sortBy === 'priceAsc') return a.avgPriceValue - b.avgPriceValue;
        if (sortBy === 'priceDesc') return b.avgPriceValue - a.avgPriceValue;
        return (b.matchRate || 0) - (a.matchRate || 0);
      });

    if (matchedCampaign) {
      if (baseList.length > 0) {
        return baseList.slice(0, 30);
      }
      return creators
        .slice()
        .sort((a, b) => (b.matchRate || 0) - (a.matchRate || 0))
        .slice(0, 20);
    }

    return baseList;
  }, [
    creators,
    searchTerm,
    selectedPlatform,
    selectedCategory,
    followerTier,
    engagementTier,
    priceTier,
    selectedLocation,
    matchedCampaign,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCreators.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCreators = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredCreators.slice(startIndex, startIndex + pageSize);
  }, [filteredCreators, safeCurrentPage, pageSize]);

  // Actions
  const handleOpenCreator = (creator: Creator) => {
    navigate(`/creators/${creator.id}`, { state: { creator, campaign: matchedCampaign } });
  };

  const handleOpenShortlist = (creator: Creator, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShortlistModalCreator(creator);
  };

  const handleBulkAddToShortlist = () => {
    if (selectedCreatorIds.size === 0) return;
    const targetCampId = selectedCampaignId || matchedCampaign?.id || campaignsList[0]?.id;
    if (!targetCampId) {
      message.warning('Vui lòng tạo hoặc chọn một chiến dịch trước khi thêm KOC vào danh sách chọn!');
      return;
    }

    const firstSelected = creators.find((c) => selectedCreatorIds.has(c.id));
    if (firstSelected) {
      setShortlistModalCreator(firstSelected);
    }
  };

  const handleShareCreator = (creator: Creator) => {
    navigator.clipboard?.writeText(window.location.origin + '/creators/' + creator.id);
    message.success('Đã sao chép liên kết KOC!');
  };

  return (
    <div className="cdiscovery-container">
      {/* 1. Breadcrumb */}
      <div className="cdiscovery-breadcrumb">
        <span className="cdiscovery-breadcrumb-link" onClick={() => navigate('/dashboard')}>
          Trang chủ
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-link" onClick={() => navigate('/campaigns')}>
          Chiến dịch
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-camp">
          {matchedCampaign?.name || 'Chiến dịch'}
        </span>
        <span className="cdiscovery-breadcrumb-sep">›</span>
        <span className="cdiscovery-breadcrumb-current">Khám phá KOC</span>
      </div>

      {/* 2. Tiêu đề trang & Tab điều hướng nguồn */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="cdiscovery-header-section">
          <h1 className="cdiscovery-header-title">Khám phá KOC</h1>
          <p className="cdiscovery-header-sub">
            Tìm kiếm KOC phù hợp theo tên, ngành hàng, tương tác và phong cách nội dung.
          </p>
        </div>

        <div className="cdiscovery-mode-tabs">
          {[
            { key: 'database', label: 'Khám phá hệ thống', icon: <TeamOutlined /> },
            { key: 'external', label: 'Quét kênh ngoài', icon: <GlobalOutlined /> },
          ].map((tab) => {
            const active = discoveryMode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDiscoveryMode(tab.key as any)}
                className={`cdiscovery-tab-btn ${active ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Render External Discovery Mode nếu được chọn */}
      {discoveryMode === 'external' ? (
        <ExternalDiscovery />
      ) : (
        <>
          {/* Stepper 5 bước */}
          <WorkflowStepBar selectedCampaignId={selectedCampaignId} />

          {/* Nội dung chính toàn màn hình */}
          <div className="cdiscovery-content-flow">
            {/* Banner chế độ */}
            <CampaignMatchBanner
              matchedCampaign={matchedCampaign}
              filteredCount={filteredCreators.length}
              campaignsList={campaignsList}
              selectedCampaignId={selectedCampaignId}
              onClearMatch={handleClearMatch}
              onSelectCampaign={(campId) => {
                const found = campaignsList.find((c) => c.id === campId);
                if (found) handleTriggerMatch(found);
              }}
            />

            {/* Panel Tìm kiếm & Bộ lọc */}
            <DiscoveryFilterSection
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearchSubmit={() => setCurrentPage(1)}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedPlatform={selectedPlatform}
              onPlatformChange={(val) => {
                setSelectedPlatform(val);
                setCurrentPage(1);
              }}
              selectedCategory={selectedCategory}
              onCategoryChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
              categoriesList={categoriesList}
              followerTier={followerTier}
              onFollowerTierChange={(val) => {
                setFollowerTier(val);
                setCurrentPage(1);
              }}
              engagementTier={engagementTier}
              onEngagementTierChange={(val) => {
                setEngagementTier(val);
                setCurrentPage(1);
              }}
              audienceAge={audienceAge}
              onAudienceAgeChange={(val) => {
                setAudienceAge(val);
                setCurrentPage(1);
              }}
              audienceGender={audienceGender}
              onAudienceGenderChange={(val) => {
                setAudienceGender(val);
                setCurrentPage(1);
              }}
              priceTier={priceTier}
              onPriceTierChange={(val) => {
                setPriceTier(val);
                setCurrentPage(1);
              }}
              activeFiltersCount={activeFiltersCount}
              onResetFilters={handleResetFilters}
            />

            {/* Toolbar Kết quả */}
            <DiscoveryResultsToolbar
              loading={loading}
              isMatching={isMatching}
              matchedCampaign={matchedCampaign}
              filteredCount={filteredCreators.length}
              paginatedCreators={paginatedCreators}
              selectedCreatorIds={selectedCreatorIds}
              onToggleSelectAll={handleToggleSelectAll}
              onBulkAddToShortlist={handleBulkAddToShortlist}
            />

            {/* Grid / List KOC */}
            <CreatorGridList
              loading={loading}
              isMatching={isMatching}
              creators={creators}
              paginatedCreators={paginatedCreators}
              totalCount={filteredCreators.length}
              viewMode={viewMode}
              matchedCampaign={matchedCampaign}
              safeCurrentPage={safeCurrentPage}
              pageSize={pageSize}
              selectedCreatorIds={selectedCreatorIds}
              onToggleSelectCreator={handleToggleSelectCreator}
              onOpenCreator={handleOpenCreator}
              onOpenShortlist={handleOpenShortlist}
              onPreview={(creator) => {
                setSelectedCreator(creator);
                setDrawerVisible(true);
              }}
              onShare={handleShareCreator}
              onMessage={() => navigate('/messages')}
              onResetFilters={handleResetFilters}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </>
      )}

      {/* Quick Preview Drawer */}
      <CreatorDetailDrawer
        visible={drawerVisible}
        creator={selectedCreator}
        matchedCampaign={matchedCampaign}
        isRefreshing={isRefreshingCreator}
        onClose={() => setDrawerVisible(false)}
        onRefreshStats={handleRequestRefresh}
        onOpenShortlist={handleOpenShortlist}
      />

      {/* Modal thêm creator vào Shortlist */}
      <AddToShortlistModal
        open={!!shortlistModalCreator}
        onClose={() => setShortlistModalCreator(null)}
        defaultCampaignId={selectedCampaignId || matchedCampaign?.id || undefined}
        creator={
          shortlistModalCreator
            ? {
                id: shortlistModalCreator.id,
                name: shortlistModalCreator.name,
                avatar: shortlistModalCreator.avatar,
                username: shortlistModalCreator.username,
                platform: shortlistModalCreator.platforms?.[0] || 'tiktok',
                followers: shortlistModalCreator.followersCount,
                engagementRate: shortlistModalCreator.engagementValue,
                niche: shortlistModalCreator.categories?.[0],
              }
            : null
        }
        onSuccess={() => {
          if (shortlistModalCreator) {
            setCreators((prev) =>
              prev.map((c) => (c.id === shortlistModalCreator.id ? { ...c, saved: true } : c))
            );
          }
        }}
      />
    </div>
  );
}
