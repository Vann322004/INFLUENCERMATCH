import React from 'react';
import './CampaignDetailPage.css';
import { useCampaignDetail } from './hooks/useCampaignDetail';
import { CampaignHeroBanner } from './components/detail/CampaignHeroBanner';
import { CampaignMetricCards } from './components/detail/CampaignMetricCards';
import { CampaignDetailNavTabs } from './components/detail/CampaignDetailNavTabs';
import { CampaignOverviewTab } from './components/detail/CampaignOverviewTab';
import { CampaignCreatorsTab } from './components/detail/CampaignCreatorsTab';
import { CampaignBudgetTab } from './components/detail/CampaignBudgetTab';
import { CampaignTimelineTab } from './components/detail/CampaignTimelineTab';
import { CampaignGuidelinesTab } from './components/detail/CampaignGuidelinesTab';
import { CampaignCancelModal } from './components/detail/CampaignCancelModal';
import { translateObjective, translateNiche } from './components/detail/campaignDetailUtils';

export default function CampaignDetailPage() {
  const {
    resolvedId,
    rawCampaign,
    participatingCreators,
    currentStatus,
    activeTab,
    setActiveTab,
    isCancelModalOpen,
    setIsCancelModalOpen,
    cancelReason,
    setCancelReason,
    campaignTitle,
    campaignBudgetFormatted,
    allocatedBudget,
    remainingBudget,
    progressPercent,
    handleActivate,
    handleComplete,
    handleConfirmCancel,
    handleNavigateToEdit,
    moreMenuItems,
    creatorColumns,
  } = useCampaignDetail();

  return (
    <div className="campaign-detail-container">
      {/* 1. Header Banner */}
      <CampaignHeroBanner
        campaignTitle={campaignTitle}
        rawCampaign={rawCampaign}
        currentStatus={currentStatus}
        resolvedId={resolvedId}
        handleActivate={handleActivate}
        handleComplete={handleComplete}
        moreMenuItems={moreMenuItems}
        setActiveTab={setActiveTab}
        translateObjective={translateObjective}
        translateNiche={translateNiche}
      />

      {/* 2. Metric KPI Cards */}
      <CampaignMetricCards
        campaignBudgetFormatted={campaignBudgetFormatted}
        allocatedBudget={allocatedBudget}
        progressPercent={progressPercent}
        rawCampaign={rawCampaign}
        participatingCreators={participatingCreators}
        setActiveTab={setActiveTab}
      />

      {/* 3. Navigation Tabs */}
      <CampaignDetailNavTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        creatorsCount={participatingCreators.length}
      />

      {/* 4. Tab Content Area */}
      <div className="cdetail-tab-content-wrap">
        {activeTab === 'overview' && (
          <CampaignOverviewTab
            rawCampaign={rawCampaign}
            currentStatus={currentStatus}
            participatingCreators={participatingCreators}
            handleNavigateToEdit={handleNavigateToEdit}
            moreMenuItems={moreMenuItems}
          />
        )}

        {activeTab === 'creators' && (
          <CampaignCreatorsTab
            participatingCreators={participatingCreators}
            creatorColumns={creatorColumns}
            resolvedId={resolvedId}
          />
        )}

        {activeTab === 'budget' && (
          <CampaignBudgetTab
            campaignBudgetFormatted={campaignBudgetFormatted}
            allocatedBudget={allocatedBudget}
            remainingBudget={remainingBudget}
            participatingCreators={participatingCreators}
            campaignTitle={campaignTitle}
          />
        )}

        {activeTab === 'timeline' && (
          <CampaignTimelineTab rawCampaign={rawCampaign} />
        )}

        {activeTab === 'guidelines' && (
          <CampaignGuidelinesTab rawCampaign={rawCampaign} />
        )}
      </div>

      {/* 5. Cancel Campaign Confirmation Modal */}
      <CampaignCancelModal
        isOpen={isCancelModalOpen}
        campaignTitle={campaignTitle}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onConfirmCancel={handleConfirmCancel}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
}
