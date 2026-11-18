import React, { useState, useMemo } from 'react';
import { Alert, Button, ConfigProvider, message } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import type { Creator, BrandCampaignItem } from './components/discovery/types';
import { loadCachedDiscovery } from './components/discovery/discoveryUtils';

import DiscoveryHeader from './components/discovery/DiscoveryHeader';
import WorkflowStepBar from './components/discovery/WorkflowStepBar';
import CampaignMatchBanner from './components/discovery/CampaignMatchBanner';
import DiscoveryFilterSection from './components/discovery/DiscoveryFilterSection';
import DiscoveryResultsToolbar from './components/discovery/DiscoveryResultsToolbar';
import CreatorGridList from './components/discovery/CreatorGridList';
import CreatorDetailDrawer from './components/discovery/CreatorDetailDrawer';
import AddToShortlistModal from '../../components/discovery/AddToShortlistModal';
import ShortlistBatchAdd from './components/ShortlistBatchAdd';
import { activeCampaignId } from '../../services/campaignContext';

import { useDiscoveryCampaigns } from './hooks/useDiscoveryCampaigns';
import { useDiscoveryCreators } from './hooks/useDiscoveryCreators';
import { useDiscoveryFilters } from './hooks/useDiscoveryFilters';

import './CreatorDiscoveryPage.css';
import './DiscoveryTypography.css';

const discoveryTheme = {
  token: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontWeightStrong: 500,
  },
  components: { Button: { fontWeight: 500 } },
};

export type { Creator, BrandCampaignItem };

export default function CreatorDiscoveryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 1. Initial Campaign ID Resolution
  const storedInitialCampId = activeCampaignId() || null;
  const initialCampId =
    searchParams.get('campaignId') ||
    (location.state as any)?.campaignId ||
    storedInitialCampId ||
    null;

  const cachedData = useMemo(() => loadCachedDiscovery(), []);

  // 2. Campaign Discovery Hook
  const {
    campaignsList,
    loadingCampaigns,
    selectedCampaignId,
    matchedCampaign,
    loadCampaignError,
    setCampaignRequestKey,
    handleTriggerMatch: rawTriggerMatch,
    handleClearMatch: rawClearMatch,
  } = useDiscoveryCampaigns({
    initialCampId,
    locationState: location.state,
    onRequestKeyBump: () => setRequestKey((v) => v + 1),
  });

  // 3. Selection & Modal States
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<Set<string>>(new Set());
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [shortlistModalCreator, setShortlistModalCreator] = useState<Creator | null>(null);
  const [batchSelection, setBatchSelection] = useState<{ campaignId: string; creators: { id: string; name: string }[] } | null>(null);

  // 4. Creators Fetching Hook
  const {
    creators,
    setCreators,
    loading,
    isMatching,
    loadError,
    setRequestKey,
    categoriesList,
    isRefreshingCreator,
    handleRequestRefresh,
  } = useDiscoveryCreators({
    loadingCampaigns,
    selectedCampaignId,
    matchedCampaign,
    submittedSearch: '', // Handled dynamically below
    selectedCategory: 'all',
    followerTier: 'all',
    onResetPagination: () => setCurrentPage(1),
    cachedCategories: cachedData?.categoriesList,
  });

  // 5. Search & Filters Hook
  const {
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
    safeCurrentPage,
    paginatedCreators,
  } = useDiscoveryFilters({
    creators,
    matchedCampaign,
    initialSortBy: initialCampId ? 'match' : 'followers',
  });

  // Re-sync filter changes into creator fetching
  const handleTriggerMatch = (targetCamp?: BrandCampaignItem) => {
    setSelectedCreatorIds(new Set());
    setSortBy('match');
    setCurrentPage(1);
    rawTriggerMatch(targetCamp);
  };

  const handleClearMatch = () => {
    setSelectedCreatorIds(new Set());
    setSortBy('followers');
    setCurrentPage(1);
    rawClearMatch();
  };

  // Selection actions
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

  // Navigations & Modals
  const handleOpenCreator = (creator: Creator) => {
    navigate(`/creators/${creator.id}${selectedCampaignId ? '?campaignId=' + encodeURIComponent(selectedCampaignId) : ''}`, { state: { creator, campaign: matchedCampaign } });
  };

  const handleOpenShortlist = (creator: Creator, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShortlistModalCreator(creator);
  };

  const handleBulkAddToShortlist = () => {
    if (selectedCreatorIds.size === 0) return;
    const targetCampId = selectedCampaignId || matchedCampaign?.id;
    if (!targetCampId) {
      message.warning('Vui lòng tạo hoặc chọn một chiến dịch trước khi thêm Nhà sáng tạo vào danh sách chọn!');
      return;
    }
    if (selectedCreatorIds.size > 100) { message.warning('Mỗi lần chỉ lưu tối đa 100 kênh. Vui lòng bỏ bớt kênh đã chọn.'); return; }
    setBatchSelection({ campaignId: targetCampId, creators: [...selectedCreatorIds].map(id => ({ id, name: creators.find(item => item.id === id)?.name || 'Kênh đã chọn' })) });
  };

  const handleShareCreator = async (creator: Creator) => {
    try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(window.location.origin + '/creators/' + creator.id);
    message.success('Đã sao chép liên kết Nhà sáng tạo!'); } catch { message.error('Không thể sao chép liên kết.'); }
  };

  return (
    <ConfigProvider theme={discoveryTheme}>
    <div className="cdiscovery-container">
      {/* 1. Header & Breadcrumb */}
      <DiscoveryHeader matchedCampaign={matchedCampaign} />
      {loadCampaignError && <Alert type="error" title={loadCampaignError} action={<Button onClick={() => setCampaignRequestKey(v => v + 1)}>Thử lại</Button>} />}

      {/* 2. Stepper 5 bước */}
      <WorkflowStepBar selectedCampaignId={selectedCampaignId} />

      {/* 3. Main Discovery Flow */}
      <div className="cdiscovery-content-flow">
        {/* Banner chế độ đề xuất */}
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
          onSearchChange={(value) => {
            setSearchTerm(value);
            if (!value.trim()) setSubmittedSearch('');
          }}
          onSearchSubmit={() => {
            setSubmittedSearch(searchTerm.trim());
            setCurrentPage(1);
          }}
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
          priceFilterAvailable={creators.some((c) => c.hasReportedPrice)}
          priceTier={priceTier}
          onPriceTierChange={(val) => {
            setPriceTier(val);
            setCurrentPage(1);
          }}
          activeFiltersCount={activeFiltersCount}
          onResetFilters={handleResetFilters}
        />

        {/* Toolbar Kết quả & Chọn hàng loạt */}
        <DiscoveryResultsToolbar
          loading={loading || loadingCampaigns}
          isMatching={isMatching}
          matchedCampaign={matchedCampaign}
          filteredCount={filteredCreators.length}
          paginatedCreators={paginatedCreators}
          selectedCreatorIds={selectedCreatorIds}
          onToggleSelectAll={handleToggleSelectAll}
          onBulkAddToShortlist={handleBulkAddToShortlist}
        />

        {/* Grid / List KOC */}
        {loadError && (
          <Alert
            type="error"
            showIcon
            title="Không tải được danh sách creator"
            description={loadError}
            action={
              <Button
                onClick={() =>
                  selectedCampaignId && !matchedCampaign
                    ? setCampaignRequestKey((v) => v + 1)
                    : setRequestKey((v) => v + 1)
                }
              >
                Thử lại
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {!loadError && (
          <CreatorGridList
            loading={loading || loadingCampaigns}
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
        )}
      </div>

      {/* Quick Preview Drawer */}
      {batchSelection && <ShortlistBatchAdd campaignId={batchSelection.campaignId} creators={batchSelection.creators}
        onClose={() => setBatchSelection(null)} onChanged={result => {
          const saved = new Set(result.results.filter(item => ['ADDED', 'ALREADY_EXISTS', 'RESTORED'].includes(item.action)).map(item => item.creatorId));
          setCreators(previous => previous.map(item => saved.has(item.id) ? { ...item, saved: true } : item));
          setSelectedCreatorIds(previous => new Set([...previous].filter(id => !saved.has(id))));
          sessionStorage.setItem('current_campaign_id', batchSelection.campaignId);
        }} />}
      <CreatorDetailDrawer
        visible={drawerVisible}
        creator={selectedCreator}
        matchedCampaign={matchedCampaign}
        isRefreshing={isRefreshingCreator}
        onClose={() => setDrawerVisible(false)}
        onRefreshStats={() => {
          if (selectedCreator) {
            handleRequestRefresh(selectedCreator, (updated) => setSelectedCreator(updated));
          }
        }}
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
    </ConfigProvider>
  );
}
